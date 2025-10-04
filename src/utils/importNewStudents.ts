import { supabase } from "@/integrations/supabase/client";

// Extract formation information from LibelleLong
function extractFormationInfo(libelleLong: string) {
  const parts = libelleLong.split("-");
  let formationType = "Résidentielle";
  let formationMode = "Diplômante";
  let year = "1ère année";
  let level = "Technicien spécialisé";
  let speciality = "";

  if (parts.length >= 2) {
    const fullName = parts[1].trim();
    if (fullName.includes("(1A)")) {
      year = "1ère année";
    } else if (fullName.includes("(2A)")) {
      year = "2ème année";
    }

    if (fullName.toLowerCase().includes("développement digital")) {
      speciality = "Développement Digital";
    } else if (fullName.toLowerCase().includes("infrastructure digitale")) {
      speciality = "Infrastructure Digitale";
    } else if (fullName.toLowerCase().includes("web full stack")) {
      speciality = "Développement Web Full Stack";
    } else if (fullName.toLowerCase().includes("systèmes et réseaux")) {
      speciality = "Infrastructure Réseaux et Systèmes";
    }
  }

  return { formationType, formationMode, year, level, speciality };
}

// Parse date from DD/MM/YYYY HH:MM:SS format
function parseDate(dateStr: string): string {
  if (!dateStr) return "";
  const parts = dateStr.split(" ")[0].split("/");
  if (parts.length === 3) {
    return `${parts[2]}-${parts[1].padStart(2, "0")}-${parts[0].padStart(
      2,
      "0"
    )}`;
  }
  return "";
}

// New students data from Excel file
export const newStudentsData = [
  {
    id_inscription: "6469549",
    matricule: "2007102700175",
    nom: "JAFA",
    prenom: "ISMAIL",
    sexe: "H",
    cin: "BA65247",
    telephone: "",
    date_naissance: "27/10/2007 00:00:00",
    libelle_long: "DIA_DEV_TS_1A-Développement Digital (1A)-2025",
    code_diplome: "DEV101",
    annee_etude: "1ère année",
    niveau_scolaire: "Baccalauréat",
  },
  {
    id_inscription: "6469947",
    matricule: "2006092300195",
    nom: "EL BERRIM",
    prenom: "OTHMANE",
    sexe: "H",
    cin: "BK749225",
    telephone: "",
    date_naissance: "23/09/2006 00:00:00",
    libelle_long: "DIA_ID_TS_1A-Infrastructure Digitale (1A)-2025",
    code_diplome: "ID101",
    annee_etude: "1ère année",
    niveau_scolaire: "Baccalauréat",
  },
  // ... rest of the 454 students will be added here
];

// Function to import a single student with duplicate check
async function importStudent(studentData: typeof newStudentsData[0]) {
  try {
    const { formationType, formationMode, year, level, speciality } =
      extractFormationInfo(studentData.libelle_long);

    const email = `${studentData.matricule}@ofppt-edu.ma`;
    const birthDate = parseDate(studentData.date_naissance);

    // Check if student already exists by email or CIN
    const { data: existingStudent, error: checkError } = await supabase
      .from("students")
      .select("id, email, cin")
      .or(`email.eq.${email},cin.eq.${studentData.cin}`)
      .maybeSingle();

    if (checkError) {
      console.error("Error checking for existing student:", checkError);
      return { success: false, error: checkError.message };
    }

    // If student already exists, skip
    if (existingStudent) {
      console.log(
        `Student ${studentData.prenom} ${studentData.nom} already exists (email: ${email}, CIN: ${studentData.cin})`
      );
      return { success: true, skipped: true };
    }

    // Insert the student
    const studentToInsert = {
      first_name: studentData.prenom,
      last_name: studentData.nom,
      cin: studentData.cin,
      email: email,
      inscription_number: studentData.matricule,
      birth_date: birthDate,
      formation_type: formationType,
      formation_mode: formationMode,
      formation_year: year,
      formation_level: level,
      speciality: speciality,
      student_group: studentData.code_diplome,
      password_hash: studentData.matricule,
      password_changed: false,
    };

    const { error } = await supabase.from("students").insert(studentToInsert);

    if (error) {
      console.error(
        `Error inserting student ${studentData.prenom} ${studentData.nom}:`,
        error
      );
      return { success: false, error: error.message };
    }

    console.log(
      `Successfully imported student: ${studentData.prenom} ${studentData.nom}`
    );
    return { success: true, inserted: true };
  } catch (error) {
    console.error("Unexpected error:", error);
    return {
      success: false,
      error: (error as Error).message || "Unknown error",
    };
  }
}

// Function to import all new students
export async function importNewStudents() {
  let successCount = 0;
  let skippedCount = 0;
  let failedCount = 0;

  console.log(`Starting import of ${newStudentsData.length} students...`);

  for (const studentData of newStudentsData) {
    const result = await importStudent(studentData);

    if (result.success) {
      if (result.inserted) {
        successCount++;
      } else if (result.skipped) {
        skippedCount++;
      }
    } else {
      failedCount++;
    }

    // Small delay to avoid overwhelming the API
    await new Promise((resolve) => setTimeout(resolve, 100));
  }

  console.log(
    `Import completed. Success: ${successCount}, Skipped (already exists): ${skippedCount}, Failed: ${failedCount}`
  );

  return {
    total: newStudentsData.length,
    success: successCount,
    skipped: skippedCount,
    failed: failedCount,
  };
}
