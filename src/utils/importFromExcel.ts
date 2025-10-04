import { supabase } from "@/integrations/supabase/client";

interface ExcelStudent {
  MatriculeEtudiant: string;
  Nom: string;
  Prenom: string;
  Sexe: string;
  DateNaissance: string;
  CIN: string;
  NTelelephone?: string;
  CodeDiplome: string;
  anneeEtude: string;
  LibelleLong: string;
}

// Parse the Excel data from the uploaded file
const excelStudentsData: ExcelStudent[] = [
  { MatriculeEtudiant: "2007102700175", Nom: "JAFA", Prenom: "ISMAIL", Sexe: "H", DateNaissance: "27/10/2007 00:00:00", CIN: "BA65247", CodeDiplome: "DEV101", anneeEtude: "1ère année", LibelleLong: "DIA_DEV_TS_1A-Développement Digital (1A)-2025" },
  { MatriculeEtudiant: "2006092300195", Nom: "EL BERRIM", Prenom: "OTHMANE", Sexe: "H", DateNaissance: "23/09/2006 00:00:00", CIN: "BK749225", CodeDiplome: "ID101", anneeEtude: "1ère année", LibelleLong: "DIA_ID_TS_1A-Infrastructure Digitale (1A)-2025" },
  { MatriculeEtudiant: "2007072900167", Nom: "HASSOUN", Prenom: "KAWTAR", Sexe: "F", DateNaissance: "29/07/2007 00:00:00", CIN: "BK766450", NTelelephone: "0719761190", CodeDiplome: "DEV104", anneeEtude: "1ère année", LibelleLong: "DIA_DEV_TS_1A-Développement Digital (1A)-2025" },
  { MatriculeEtudiant: "2007051400152", Nom: "OUCHAINE", Prenom: "AYA", Sexe: "F", DateNaissance: "14/05/2007 00:00:00", CIN: "BW69422", CodeDiplome: "DEV104", anneeEtude: "1ère année", LibelleLong: "DIA_DEV_TS_1A-Développement Digital (1A)-2025" },
  { MatriculeEtudiant: "2007031800213", Nom: "EL MASMOUDI", Prenom: "ZAKARIA", Sexe: "H", DateNaissance: "18/03/2007 00:00:00", CIN: "BW55450", NTelelephone: "0636240853", CodeDiplome: "ID102", anneeEtude: "1ère année", LibelleLong: "DIA_ID_TS_1A-Infrastructure Digitale (1A)-2025" },
  { MatriculeEtudiant: "2008010700095", Nom: "CHAFIK", Prenom: "HAITHAM", Sexe: "H", DateNaissance: "07/01/2008 00:00:00", CIN: "BK761109", NTelelephone: "0663516011", CodeDiplome: "DEV106", anneeEtude: "1ère année", LibelleLong: "DIA_DEV_TS_1A-Développement Digital (1A)-2025" },
  { MatriculeEtudiant: "2006092400111", Nom: "ELHARTI", Prenom: "ILIAS", Sexe: "H", DateNaissance: "24/09/2006 00:00:00", CIN: "BW63809", CodeDiplome: "ID103", anneeEtude: "1ère année", LibelleLong: "DIA_ID_TS_1A-Infrastructure Digitale (1A)-2025" },
  { MatriculeEtudiant: "2007062200154", Nom: "EL JADIDI", Prenom: "KARIM", Sexe: "H", DateNaissance: "22/06/2007 00:00:00", CIN: "BK760616", NTelelephone: "0675352277", CodeDiplome: "DEV107", anneeEtude: "1ère année", LibelleLong: "DIA_DEV_TS_1A-Développement Digital (1A)-2025" },
  { MatriculeEtudiant: "2007072000112", Nom: "EL OMARI", Prenom: "MOHAMMED", Sexe: "H", DateNaissance: "20/07/2007 00:00:00", CIN: "M710813", NTelelephone: "0693534593", CodeDiplome: "ID104", anneeEtude: "1ère année", LibelleLong: "DIA_ID_TS_1A-Infrastructure Digitale (1A)-2025" },
  { MatriculeEtudiant: "2004012300411", Nom: "AYYACHE", Prenom: "EL HOUSSINE", Sexe: "H", DateNaissance: "23/01/2004 00:00:00", CIN: "BH643476", NTelelephone: "0777794392", CodeDiplome: "DEV101", anneeEtude: "1ère année", LibelleLong: "DIA_DEV_TS_1A-Développement Digital (1A)-2025" },
  { MatriculeEtudiant: "2007122400120", Nom: "KOUCHE", Prenom: "AHLAM", Sexe: "F", DateNaissance: "24/12/2007 00:00:00", CIN: "BW75184", CodeDiplome: "DEV102", anneeEtude: "1ère année", LibelleLong: "DIA_DEV_TS_1A-Développement Digital (1A)-2025" },
  { MatriculeEtudiant: "2007020600272", Nom: "KHALIL", Prenom: "LAILA", Sexe: "F", DateNaissance: "06/02/2007 00:00:00", CIN: "BW61951", NTelelephone: "0663502980", CodeDiplome: "DEV103", anneeEtude: "1ère année", LibelleLong: "DIA_DEV_TS_1A-Développement Digital (1A)-2025" },
  { MatriculeEtudiant: "2008012100071", Nom: "AIT AHMED", Prenom: "MOUAD", Sexe: "H", DateNaissance: "21/01/2008 00:00:00", CIN: "BK767827", NTelelephone: "0695506161", CodeDiplome: "DEV102", anneeEtude: "1ère année", LibelleLong: "DIA_DEV_TS_1A-Développement Digital (1A)-2025" },
  { MatriculeEtudiant: "2006112800148", Nom: "BELGAS", Prenom: "HAYTAM", Sexe: "H", DateNaissance: "28/11/2006 00:00:00", CIN: "BE950419", NTelelephone: "0642267845", CodeDiplome: "ID102", anneeEtude: "1ère année", LibelleLong: "DIA_ID_TS_1A-Infrastructure Digitale (1A)-2025" },
  // Add more students following this structure...
];

function parseDateFromFrench(dateString: string): string {
  // Parse format: "27/10/2007 00:00:00" to "2007-10-27"
  const parts = dateString.split(" ")[0].split("/");
  if (parts.length === 3) {
    const [day, month, year] = parts;
    return `${year}-${month.padStart(2, "0")}-${day.padStart(2, "0")}`;
  }
  return dateString;
}

function getFormationDetails(codeDiplome: string, libelleLong: string) {
  let formationLevel = "Technicien Spécialisé";
  let speciality = "";
  let formationType = "Résidentielle";
  let formationMode = "Diplômante";
  let formationYear = "1ère année";
  let studentGroup = codeDiplome;

  if (libelleLong.includes("Développement Digital")) {
    speciality = "Développement Digital";
  } else if (libelleLong.includes("Infrastructure Digitale")) {
    speciality = "Infrastructure Digitale";
  } else if (libelleLong.includes("DEVOWFS")) {
    speciality = "Développement Option Web Full Stack";
  } else if (libelleLong.includes("IDOSR")) {
    speciality = "Infrastructure Réseaux et Systèmes";
  }

  if (libelleLong.includes("2A") || libelleLong.includes("2ème année")) {
    formationYear = "2ème année";
  }

  return {
    formationLevel,
    speciality,
    formationType,
    formationMode,
    formationYear,
    studentGroup,
  };
}

export async function importExcelStudents() {
  let addedCount = 0;
  let skippedCount = 0;
  const errors: string[] = [];

  try {
    // Get all existing students to check for duplicates
    const { data: existingStudents, error: fetchError } = await supabase
      .from("students")
      .select("cin, email");

    if (fetchError) {
      throw new Error(`Error fetching existing students: ${fetchError.message}`);
    }

    const existingCINs = new Set(existingStudents?.map((s) => s.cin) || []);
    const existingEmails = new Set(existingStudents?.map((s) => s.email) || []);

    // Process each student from the Excel data
    for (const student of excelStudentsData) {
      try {
        // Skip if CIN already exists
        if (existingCINs.has(student.CIN)) {
          skippedCount++;
          continue;
        }

        const email = `${student.MatriculeEtudiant}@ofppt-edu.ma`;
        
        // Skip if email already exists
        if (existingEmails.has(email)) {
          skippedCount++;
          continue;
        }

        const formationDetails = getFormationDetails(
          student.CodeDiplome,
          student.LibelleLong
        );

        const newStudent = {
          first_name: student.Prenom,
          last_name: student.Nom,
          cin: student.CIN,
          email: email,
          birth_date: parseDateFromFrench(student.DateNaissance),
          formation_level: formationDetails.formationLevel,
          speciality: formationDetails.speciality,
          student_group: formationDetails.studentGroup,
          inscription_number: student.MatriculeEtudiant,
          formation_type: formationDetails.formationType,
          formation_mode: formationDetails.formationMode,
          formation_year: formationDetails.formationYear,
          password_hash: student.CIN, // Use CIN as default password
        };

        const { error: insertError } = await supabase
          .from("students")
          .insert([newStudent]);

        if (insertError) {
          errors.push(`Error adding ${student.Prenom} ${student.Nom}: ${insertError.message}`);
        } else {
          addedCount++;
          existingCINs.add(student.CIN);
          existingEmails.add(email);
        }
      } catch (error) {
        errors.push(`Error processing ${student.Prenom} ${student.Nom}: ${(error as Error).message}`);
      }
    }

    return {
      success: true,
      addedCount,
      skippedCount,
      errors,
      message: `Import terminé: ${addedCount} étudiants ajoutés, ${skippedCount} ignorés (déjà existants)`,
    };
  } catch (error) {
    return {
      success: false,
      addedCount: 0,
      skippedCount: 0,
      errors: [(error as Error).message],
      message: `Erreur d'importation: ${(error as Error).message}`,
    };
  }
}
