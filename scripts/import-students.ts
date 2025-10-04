/**
 * Script pour importer les étudiants depuis le fichier Excel vers Supabase
 * 
 * Ce script lit les données du fichier parsed et les insère dans la table students
 * 
 * Instructions:
 * 1. Assurez-vous que les migrations sont appliquées
 * 2. Le fichier Excel doit être parsé et disponible
 * 3. Les colonnes nécessaires: MatriculeEtudiant, Nom, Prenom, DateNaissance, CIN, Code, LibelleLong, NTelelephone
 * 
 * Format email: matricule@ofppt-edu.ma
 * Mot de passe initial: MatriculeEtudiant (numéro d'inscription)
 */

import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = "https://hyzlkqrlodpcmxsnexsg.supabase.co";
const SUPABASE_SERVICE_KEY = "YOUR_SERVICE_ROLE_KEY_HERE"; // À remplacer par la clé service role

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

// Exemple de données extraites du fichier Excel
const studentsData = [
  {
    matricule: "2007102700175",
    nom: "JAFA",
    prenom: "ISMAIL",
    dateNaissance: "2007-10-27",
    cin: "BA65247",
    code: "DEV101",
    libelleLong: "DIA_DEV_TS_1A-Développement Digital (1A)-2025",
    telephone: ""
  },
  {
    matricule: "2006092300195",
    nom: "EL BERRIM",
    prenom: "OTHMANE",
    dateNaissance: "2006-09-23",
    cin: "BK749225",
    code: "ID101",
    libelleLong: "DIA_ID_TS_1A-Infrastructure Digitale (1A)-2025",
    telephone: ""
  },
  // ... plus d'étudiants à ajouter
];

/**
 * Extrait les informations de formation depuis LibelleLong
 */
function extractFormationInfo(libelleLong: string) {
  // Format: DIA_DEV_TS_1A-Développement Digital (1A)-2025
  const parts = libelleLong.split('-');
  
  const formationType = "Résidentielle"; // Par défaut
  const formationMode = "Diplômante"; // Par défaut
  const formationYear = parts[parts.length - 1] || "2025";
  
  // Niveau: TS pour Technicien Spécialisé
  const formationLevel = libelleLong.includes('_TS_') ? 'Technicien Spécialisé' : 'Technicien';
  
  // Spécialité
  let speciality = "";
  if (parts.length > 1) {
    speciality = parts[1].replace(/\s*\(\d+A\)/, '').trim();
  }
  
  return {
    formationType,
    formationMode,
    formationYear,
    formationLevel,
    speciality
  };
}

/**
 * Importe un étudiant dans la base de données
 */
async function importStudent(studentData: typeof studentsData[0]) {
  const formationInfo = extractFormationInfo(studentData.libelleLong);
  
  const student = {
    inscription_number: studentData.matricule,
    first_name: studentData.prenom,
    last_name: studentData.nom,
    cin: studentData.cin,
    birth_date: studentData.dateNaissance,
    email: `${studentData.matricule}@ofppt-edu.ma`,
    password_hash: studentData.matricule, // Mot de passe initial = numéro d'inscription
    password_changed: false,
    student_group: studentData.code,
    formation_level: formationInfo.formationLevel,
    speciality: formationInfo.speciality,
    formation_type: formationInfo.formationType,
    formation_mode: formationInfo.formationMode,
    formation_year: formationInfo.formationYear,
  };
  
  const { data, error } = await supabase
    .from('students')
    .insert(student)
    .select();
  
  if (error) {
    console.error(`Erreur pour ${studentData.matricule}:`, error.message);
    return { success: false, error };
  }
  
  console.log(`✓ Étudiant importé: ${studentData.prenom} ${studentData.nom}`);
  return { success: true, data };
}

/**
 * Importe tous les étudiants
 */
async function importAllStudents() {
  console.log(`Début de l'importation de ${studentsData.length} étudiants...`);
  
  let successCount = 0;
  let errorCount = 0;
  
  for (const student of studentsData) {
    const result = await importStudent(student);
    if (result.success) {
      successCount++;
    } else {
      errorCount++;
    }
    
    // Pause pour éviter de surcharger l'API
    await new Promise(resolve => setTimeout(resolve, 100));
  }
  
  console.log('\n========== RÉSUMÉ ==========');
  console.log(`✓ Succès: ${successCount}`);
  console.log(`✗ Erreurs: ${errorCount}`);
  console.log(`Total: ${studentsData.length}`);
}

// Exécuter l'importation
// importAllStudents().catch(console.error);

export { importStudent, importAllStudents, extractFormationInfo };
