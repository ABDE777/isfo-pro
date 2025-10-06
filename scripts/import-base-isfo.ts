import * as dotenv from 'dotenv';
dotenv.config();
import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';
import * as XLSX from 'xlsx';

// Supabase configuration
const supabaseUrl = process.env.VITE_SUPABASE_URL || '';
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

if (!supabaseUrl || !supabaseServiceRoleKey) {
  console.error('Missing Supabase environment variables');
  console.error('Please ensure you have set SUPABASE_SERVICE_ROLE_KEY in your .env file');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);

// Function to parse formation information from LibelleLong
function parseFormationInfo(libelleLong: string, code: string) {
  // Example: DIA_IDOSR_TS_1A-Infrastructure Digitale option Systèmes et Réseaux (1A)-2025
  const parts = libelleLong.split('-');
  if (parts.length >= 3) {
    const codePart = parts[0]; // DIA_IDOSR_TS_1A
    const specialityPart = parts[1]; // Infrastructure Digitale option Systèmes et Réseaux
    const yearPart = parts[2]; // 2025
    
    // Extract formation level from codePart (TS = Technicien Spécialisé)
    let formationLevel = 'Technicien Spécialisé';
    if (codePart.includes('TS')) {
      formationLevel = 'Technicien Spécialisé';
    } else if (codePart.includes('T')) {
      formationLevel = 'Technicien';
    }
    
    // Use the Code column if available, otherwise derive from codePart
    let studentGroup = code || '';
    if (!studentGroup) {
      if (codePart.includes('IDOSR')) {
        // Extract the number part after IDOSR
        const match = codePart.match(/IDOSR.*?(\d+)/);
        if (match) {
          studentGroup = `IDOSR${match[1]}`;
        }
      } else if (codePart.includes('DEVOWFS')) {
        // Extract the number part after DEVOWFS
        const match = codePart.match(/DEVOWFS.*?(\d+)/);
        if (match) {
          studentGroup = `DEVOWFS${match[1]}`;
        }
      } else if (codePart.includes('DEV')) {
        // Extract the number part after DEV
        const match = codePart.match(/DEV.*?(\d+)/);
        if (match) {
          studentGroup = `DEV${match[1]}`;
        }
      } else if (codePart.includes('ID')) {
        // Extract the number part after ID
        const match = codePart.match(/ID.*?(\d+)/);
        if (match) {
          studentGroup = `ID${match[1]}`;
        }
      }
    }
    
    // If still no student group, use a default
    if (!studentGroup) {
      studentGroup = 'DEV101';
    }
    
    return {
      formationLevel,
      speciality: specialityPart.trim(),
      studentGroup,
      formationYear: yearPart.trim(),
      formationType: 'Résidentielle', // Default value
      formationMode: 'Diplômante' // Default value
    };
  }
  
  // Default values if parsing fails
  return {
    formationLevel: 'Technicien Spécialisé',
    speciality: 'Informatique',
    studentGroup: code || 'DEV101',
    formationYear: '2025',
    formationType: 'Résidentielle',
    formationMode: 'Diplômante'
  };
}

// Function to parse date from Excel format
function parseDate(dateStr: string): string {
  if (!dateStr) return '';
  
  // Handle different date formats
  if (dateStr.includes('/')) {
    // Format: DD/MM/YYYY HH:MM:SS
    const parts = dateStr.split(' ')[0].split('/');
    if (parts.length === 3) {
      return `${parts[2]}-${parts[1].padStart(2, '0')}-${parts[0].padStart(2, '0')}`;
    }
  } else if (dateStr.includes('-')) {
    // Format: YYYY-MM-DD
    return dateStr.split(' ')[0];
  }
  
  return '';
}

async function importStudents() {
  try {
    // Read the Excel file
    const fileBuffer = fs.readFileSync('base isfo 2.xls');
    const workbook = XLSX.read(fileBuffer);
    const worksheet = workbook.Sheets[workbook.SheetNames[0]];
    const jsonData: (string | number | undefined)[][] = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
    
    // Skip header row and process data
    const studentsData = jsonData.slice(1);
    
    console.log(`Found ${studentsData.length} students to import`);
    
    let successCount = 0;
    let errorCount = 0;
    
    // Process each student
    for (let i = 0; i < studentsData.length; i++) {
      try {
        const row = studentsData[i];
        
        // Extract data from Excel row based on the actual column structure:
        // 0: id_inscriptionsessionprogramme
        // 1: MatriculeEtudiant
        // 2: Nom
        // 3: Prenom
        // 4: Sexe
        // 8: LibelleLong (formation info)
        // 9: CodeDiplome
        // 10: Code (student group)
        // 14: DateNaissance
        // 21: CIN
        // 22: NTelelephone
        
        const idInscription = row[0]; // Column A
        const matriculeEtudiant = row[1]; // Column B
        const nom = row[2]; // Column C
        const prenom = row[3]; // Column D
        const sexe = row[4]; // Column E
        const dateNaissance = row[14]; // Column O (DateNaissance)
        const libelleLong = row[8]; // Column I (LibelleLong)
        const codeDiplome = row[9]; // Column J (CodeDiplome)
        const code = row[10]; // Column K (Code)
        const cin = row[21]; // Column V (CIN)
        const telephone = row[22]; // Column W (NTelelephone)
        
        // Skip if required fields are missing
        if (!matriculeEtudiant || !nom || !prenom || !cin) {
          console.log(`Skipping row ${i + 2}: Missing required fields`);
          errorCount++;
          continue;
        }
        
        // Parse formation information
        const formationInfo = parseFormationInfo((libelleLong || '').toString(), (code || '').toString());
        
        // Parse birth date
        const birthDate = parseDate((dateNaissance || '').toString());
        if (!birthDate) {
          console.log(`Skipping row ${i + 2}: Invalid birth date`);
          errorCount++;
          continue;
        }
        
        // Check if student already exists
        const { data: existingStudent, error: checkError } = await supabase
          .from('students')
          .select('id')
          .eq('cin', cin.toString())
          .single();
        
        if (checkError && checkError.code !== 'PGRST116') {
          // Some other error occurred
          console.error(`Error checking existing student ${matriculeEtudiant}:`, checkError.message);
          errorCount++;
          continue;
        }
        
        if (existingStudent) {
          console.log(`Skipping student ${prenom} ${nom} (${matriculeEtudiant}): Already exists`);
          errorCount++; // Count as skipped rather than error
          continue;
        }
        
        // Create student object
        const student = {
          first_name: prenom.toString(),
          last_name: nom.toString(),
          cin: cin.toString(),
          birth_date: birthDate,
          email: `${matriculeEtudiant}@ofppt-edu.ma`,
          password_hash: matriculeEtudiant.toString(), // Default password is inscription number
          password_changed: false,
          student_group: formationInfo.studentGroup,
          formation_level: formationInfo.formationLevel,
          speciality: formationInfo.speciality,
          formation_type: formationInfo.formationType,
          formation_mode: formationInfo.formationMode,
          formation_year: formationInfo.formationYear,
          inscription_number: matriculeEtudiant.toString()
        };
        
        // Insert student into database
        const { data, error } = await supabase
          .from('students')
          .insert(student)
          .select();
        
        if (error) {
          console.error(`Error importing student ${matriculeEtudiant}:`, error.message);
          errorCount++;
        } else {
          console.log(`✓ Imported student: ${prenom} ${nom} (${matriculeEtudiant})`);
          successCount++;
        }
        
        // Add small delay to avoid overwhelming the API
        await new Promise(resolve => setTimeout(resolve, 100));
      } catch (error) {
        console.error(`Error processing row ${i + 2}:`, (error as Error).message);
        errorCount++;
      }
    }
    
    console.log(`\nImport completed. Success: ${successCount}, Skipped (already exist): ${errorCount}`);
    
  } catch (error) {
    console.error('Error reading Excel file:', (error as Error).message);
    process.exit(1);
  }
}

// Run the import
importStudents();