import jsPDF from "jspdf";
import "jspdf-autotable";
import * as XLSX from "xlsx";

interface ExportStudent {
  first_name: string;
  last_name: string;
  cin: string;
  email: string;
  birth_date: string;
  formation_level: string;
  speciality: string;
  student_group: string;
  inscription_number: string;
  formation_type: string;
  formation_mode: string;
  formation_year: string;
}

interface ExportRequest {
  first_name: string;
  last_name: string;
  cin: string;
  phone: string;
  student_group: string;
  status: string;
  created_at: string;
  attestation_number?: number;
}

export const exportStudentsToExcel = (students: ExportStudent[]) => {
  const excelData = students.map((student) => ({
    Prénom: student.first_name,
    Nom: student.last_name,
    CIN: student.cin,
    Email: student.email,
    "Date de naissance": new Date(student.birth_date).toLocaleDateString("fr-FR"),
    "Niveau de formation": student.formation_level,
    Spécialité: student.speciality,
    Groupe: student.student_group,
    "N° d'inscription": student.inscription_number,
    "Type de formation": student.formation_type,
    "Mode de formation": student.formation_mode,
    "Année de formation": student.formation_year,
  }));

  const ws = XLSX.utils.json_to_sheet(excelData);
  ws["!cols"] = [
    { wch: 15 }, { wch: 15 }, { wch: 12 }, { wch: 25 }, { wch: 15 },
    { wch: 20 }, { wch: 25 }, { wch: 12 }, { wch: 15 }, { wch: 18 },
    { wch: 18 }, { wch: 18 },
  ];

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Étudiants");
  XLSX.writeFile(wb, `etudiants_${new Date().toISOString().split("T")[0]}.xlsx`);
};

export const exportStudentsToCSV = (students: ExportStudent[]) => {
  let csvContent =
    "Prénom,Nom,CIN,Email,Date de naissance,Niveau de formation,Spécialité,Groupe,N° d'inscription,Type de formation,Mode de formation,Année de formation\n";

  students.forEach((student) => {
    csvContent += `"${student.first_name}","${student.last_name}","${student.cin}","${student.email}","${student.birth_date}","${student.formation_level}","${student.speciality}","${student.student_group}","${student.inscription_number}","${student.formation_type}","${student.formation_mode}","${student.formation_year}"\n`;
  });

  const dataUri = "data:text/csv;charset=utf-8," + encodeURIComponent(csvContent);
  const link = document.createElement("a");
  link.setAttribute("href", dataUri);
  link.setAttribute("download", `students_${new Date().toISOString().split("T")[0]}.csv`);
  link.click();
};

export const exportRequestsToExcel = (requests: ExportRequest[]) => {
  const excelData = requests.map((request) => ({
    Prénom: request.first_name,
    Nom: request.last_name,
    CIN: request.cin,
    Téléphone: request.phone,
    Groupe: request.student_group,
    Statut: request.status === "pending" ? "En attente" : request.status === "approved" ? "Approuvé" : "Rejeté",
    "Date de demande": new Date(request.created_at).toLocaleDateString("fr-FR"),
    "N° Attestation": request.attestation_number || "-",
  }));

  const ws = XLSX.utils.json_to_sheet(excelData);
  ws["!cols"] = [
    { wch: 15 }, { wch: 15 }, { wch: 12 }, { wch: 15 },
    { wch: 15 }, { wch: 12 }, { wch: 18 }, { wch: 15 },
  ];

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Demandes");
  XLSX.writeFile(wb, `demandes_${new Date().toISOString().split("T")[0]}.xlsx`);
};

export const exportRequestsToCSV = (requests: ExportRequest[]) => {
  let csvContent = "Prénom,Nom,CIN,Téléphone,Groupe,Statut,Date de demande,N° Attestation\n";

  requests.forEach((request) => {
    const status = request.status === "pending" ? "En attente" : request.status === "approved" ? "Approuvé" : "Rejeté";
    csvContent += `"${request.first_name}","${request.last_name}","${request.cin}","${request.phone}","${request.student_group}","${status}","${new Date(request.created_at).toLocaleDateString("fr-FR")}","${request.attestation_number || "-"}"\n`;
  });

  const dataUri = "data:text/csv;charset=utf-8," + encodeURIComponent(csvContent);
  const link = document.createElement("a");
  link.setAttribute("href", dataUri);
  link.setAttribute("download", `demandes_${new Date().toISOString().split("T")[0]}.csv`);
  link.click();
};

export const convertImageToDataURL = async (imagePath: string): Promise<string> => {
  if (imagePath.startsWith("data:")) {
    return imagePath;
  }
  
  try {
    const response = await fetch(imagePath);
    const blob = await response.blob();
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.readAsDataURL(blob);
    });
  } catch (error) {
    console.error("Error converting image to data URL:", error);
    return imagePath;
  }
};
