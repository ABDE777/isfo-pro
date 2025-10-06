import React, { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import {
  User,
  Users,
  Plus,
  Upload,
  Download,
  Edit,
  Trash2,
  Save,
  X,
  Search,
  Filter,
  FileText,
  Settings,
  LogOut,
} from "lucide-react";
import { CSVImportDialog } from "./CSVImportDialog";
import ofpptLogo from "@/assets/ofppt-logo.png";
import jsPDF from "jspdf";
import "jspdf-autotable";
import * as XLSX from "xlsx";

interface Student {
  id: string;
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
  password_hash: string | null;
}

// Add interface for formation levels by group
interface FormationLevelsByGroup {
  [group: string]: string[];
}

// Add interface for student editing form
interface StudentEditForm {
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
  current_password: string;
  new_password: string;
}

const STUDENT_GROUPS = [
  "DEVOWFS201",
  "DEVOWFS202",
  "DEVOWFS203",
  "DEVOWFS204",
  "IDOSR201",
  "IDOSR202",
  "IDOSR203",
  "IDOSR204",
  "DEV101",
  "DEV102",
  "DEV103",
  "DEV104",
  "DEV105",
  "DEV106",
  "DEV107",
  "ID101",
  "ID102",
  "ID103",
  "ID104",
];

export const StudentManagement = ({
  onBack,
  onLogout,
}: {
  onBack: () => void;
  onLogout?: () => void;
}) => {
  const [students, setStudents] = useState<Student[]>([]);
  const [filteredStudents, setFilteredStudents] = useState<Student[]>([]);
  const [selectedGroup, setSelectedGroup] = useState<string>("all");
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [editingStudent, setEditingStudent] = useState<Student | null>(null);
  const [editingStudentForm, setEditingStudentForm] =
    useState<StudentEditForm | null>(null);
  const [addingStudent, setAddingStudent] = useState<boolean>(false);
  const [showCSVImport, setShowCSVImport] = useState(false);
  const [currentPage, setCurrentPage] = useState<string>("DEVOWFS"); // For pagination

  // Get current year and next year for formation year
  const currentYear = new Date().getFullYear();
  const nextYear = currentYear + 1;
  const defaultFormationYear = `${currentYear}/${nextYear}`;

  const [newStudent, setNewStudent] = useState<Omit<Student, "id">>({
    first_name: "",
    last_name: "",
    cin: "",
    email: "",
    birth_date: "",
    formation_level: "",
    speciality: "",
    student_group: "",
    inscription_number: "",
    formation_type: "",
    formation_mode: "",
    formation_year: defaultFormationYear, // Set default formation year
    password_hash: "",
  });

  // Add state for password visibility
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);

  const { toast } = useToast();

  useEffect(() => {
    fetchStudents();
  }, []);

  useEffect(() => {
    let filtered = [...students];

    // Filter by group
    if (selectedGroup !== "all") {
      filtered = filtered.filter(
        (student) => student.student_group === selectedGroup
      );
    }

    // Filter by search term
    if (searchTerm.trim()) {
      const searchLower = searchTerm.toLowerCase();
      filtered = filtered.filter(
        (student) =>
          student.first_name.toLowerCase().includes(searchLower) ||
          student.last_name.toLowerCase().includes(searchLower) ||
          student.cin.toLowerCase().includes(searchLower) ||
          student.email.toLowerCase().includes(searchLower) ||
          student.inscription_number.toLowerCase().includes(searchLower)
      );
    }

    setFilteredStudents(filtered);
  }, [students, selectedGroup, searchTerm]);

  const fetchStudents = async () => {
    try {
      const { data, error } = await supabase
        .from("students")
        .select("*")
        .order("student_group", { ascending: true })
        .order("last_name", { ascending: true });

      if (error) throw error;
      setStudents(data || []);
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Impossible de charger les étudiants.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleEditStudent = (student: Student) => {
    setEditingStudent(student);
    // Initialize the form with student data
    setEditingStudentForm({
      first_name: student.first_name,
      last_name: student.last_name,
      cin: student.cin,
      email: student.email,
      birth_date: student.birth_date,
      formation_level: student.formation_level,
      speciality: student.speciality,
      student_group: student.student_group,
      inscription_number: student.inscription_number,
      formation_type: student.formation_type,
      formation_mode: student.formation_mode,
      formation_year: student.formation_year,
      current_password: student.password_hash || "", // Show actual password
      new_password: "",
    });
  };

  const handleSaveStudent = async () => {
    if (!editingStudent || !editingStudentForm) return;

    try {
      // Prepare update data
      const updateData: Partial<Student> = {
        first_name: editingStudentForm.first_name,
        last_name: editingStudentForm.last_name,
        cin: editingStudentForm.cin,
        email: editingStudentForm.email,
        birth_date: editingStudentForm.birth_date,
        formation_level: editingStudentForm.formation_level,
        speciality: editingStudentForm.speciality,
        student_group: editingStudentForm.student_group,
        inscription_number: editingStudentForm.inscription_number,
        formation_type: editingStudentForm.formation_type,
        formation_mode: editingStudentForm.formation_mode,
        formation_year: editingStudentForm.formation_year,
      };

      // Only include password if it's being updated
      if (
        editingStudentForm.new_password &&
        editingStudentForm.new_password.trim() !== ""
      ) {
        updateData.password_hash = editingStudentForm.new_password;
      }

      const { error } = await supabase
        .from("students")
        .update(updateData)
        .eq("id", editingStudent.id);

      if (error) throw error;

      toast({
        title: "Succès",
        description: "Étudiant mis à jour avec succès.",
      });

      setEditingStudent(null);
      setEditingStudentForm(null);
      fetchStudents();
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Impossible de mettre à jour l'étudiant.",
        variant: "destructive",
      });
    }
  };

  // Add function to update student password
  const handleUpdateStudentPassword = async (
    studentId: string,
    newPassword: string
  ) => {
    try {
      const { error } = await supabase
        .from("students")
        .update({
          password_hash: newPassword,
        })
        .eq("id", studentId);

      if (error) throw error;

      toast({
        title: "Succès",
        description: "Mot de passe de l'étudiant mis à jour avec succès.",
      });

      fetchStudents();
    } catch (error) {
      toast({
        title: "Erreur",
        description:
          "Impossible de mettre à jour le mot de passe de l'étudiant.",
        variant: "destructive",
      });
    }
  };

  const handleDeleteStudent = async (id: string) => {
    try {
      const { error } = await supabase.from("students").delete().eq("id", id);

      if (error) throw error;

      toast({
        title: "Succès",
        description: "Étudiant supprimé avec succès.",
      });

      fetchStudents();
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Impossible de supprimer l'étudiant.",
        variant: "destructive",
      });
    }
  };

  const exportToExcel = () => {
    try {
      // Prepare data for Excel
      const excelData = filteredStudents.map((student) => ({
        Prénom: student.first_name,
        Nom: student.last_name,
        CIN: student.cin,
        Email: student.email,
        "Date de naissance": new Date(student.birth_date).toLocaleDateString(
          "fr-FR"
        ),
        "Niveau de formation": student.formation_level,
        Spécialité: student.speciality,
        Groupe: student.student_group,
        "N° d'inscription": student.inscription_number,
        "Type de formation": student.formation_type,
        "Mode de formation": student.formation_mode,
        "Année de formation": student.formation_year,
      }));

      // Create worksheet
      const ws = XLSX.utils.json_to_sheet(excelData);

      // Set column widths
      ws["!cols"] = [
        { wch: 15 }, // Prénom
        { wch: 15 }, // Nom
        { wch: 12 }, // CIN
        { wch: 25 }, // Email
        { wch: 15 }, // Date de naissance
        { wch: 20 }, // Niveau de formation
        { wch: 25 }, // Spécialité
        { wch: 12 }, // Groupe
        { wch: 15 }, // N° inscription
        { wch: 18 }, // Type de formation
        { wch: 18 }, // Mode de formation
        { wch: 18 }, // Année de formation
      ];

      // Create workbook
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Étudiants");

      // Generate Excel file
      XLSX.writeFile(
        wb,
        `etudiants_${new Date().toISOString().split("T")[0]}.xlsx`
      );

      toast({
        title: "Export réussi",
        description: `${filteredStudents.length} étudiants exportés en Excel.`,
      });
    } catch (error) {
      toast({
        title: "Erreur d'export",
        description:
          "Impossible de générer le fichier Excel. Veuillez réessayer.",
        variant: "destructive",
      });
    }
  };

  const exportToCSV = () => {
    // Create a simple CSV format
    let csvContent =
      "Prénom,Nom,CIN,Email,Date de naissance,Niveau de formation,Spécialité,Groupe,N° d'inscription,Type de formation,Mode de formation,Année de formation\n";

    filteredStudents.forEach((student) => {
      csvContent += `"${student.first_name}","${student.last_name}","${student.cin}","${student.email}","${student.birth_date}","${student.formation_level}","${student.speciality}","${student.student_group}","${student.inscription_number}","${student.formation_type}","${student.formation_mode}","${student.formation_year}"\n`;
    });

    const dataUri =
      "data:text/csv;charset=utf-8," + encodeURIComponent(csvContent);

    const exportFileDefaultName = `students_${
      new Date().toISOString().split("T")[0]
    }.csv`;

    const linkElement = document.createElement("a");
    linkElement.setAttribute("href", dataUri);
    linkElement.setAttribute("download", exportFileDefaultName);
    linkElement.click();

    toast({
      title: "Export réussi",
      description: `${filteredStudents.length} étudiants exportés en CSV.`,
    });
  };

  const exportToPDF = async () => {
    try {
      // Dynamically import jsPDF only when needed
      const { default: jsPDF } = await import("jspdf");
      const { default: autoTable } = await import("jspdf-autotable");

      // Create a new PDF document
      const doc = new jsPDF({
        orientation: "landscape",
        unit: "mm",
        format: "a4",
      });

      // Add institution header with logo
      try {
        // Convert logo to data URL
        let logoDataUrl = ofpptLogo;

        try {
          // If it's a relative path, convert it to data URL
          if (ofpptLogo && !ofpptLogo.startsWith("data:")) {
            const response = await fetch(ofpptLogo);
            const blob = await response.blob();
            logoDataUrl = await new Promise((resolve) => {
              const reader = new FileReader();
              reader.onload = () => resolve(reader.result as string);
              reader.readAsDataURL(blob);
            });
          }
        } catch (error) {
          console.error("Error converting logo to data URL:", error);
          // Fallback to original logo URL
          logoDataUrl = ofpptLogo;
        }

        // Add logo to PDF
        const pdfDoc = doc as unknown as any;
        pdfDoc.addImage(logoDataUrl, "PNG", 15, 10, 40, 20); // x, y, width, height
      } catch (logoError) {
        console.log("Logo could not be loaded, continuing without it");
      }

      // Add institution names
      const pdfDoc = doc as unknown as any;
      pdfDoc.setFontSize(22);
      pdfDoc.setTextColor(29, 78, 216); // Blue color
      pdfDoc.setFont(undefined, "bold");
      pdfDoc.text("OFPPT - ISFO", 148, 25, { align: "center" });

      // Add full institution name
      pdfDoc.setFontSize(14);
      pdfDoc.setTextColor(0, 0, 0); // Black color
      pdfDoc.setFont(undefined, "normal");
      pdfDoc.text(
        "Office de la Formation Professionnelle et de la Promotion du Travail",
        148,
        35,
        { align: "center" }
      );
      pdfDoc.text(
        "Institut Spécialisé de Formation de l'Offshoring Casablanca",
        148,
        42,
        { align: "center" }
      );

      // Add title
      pdfDoc.setFontSize(18);
      pdfDoc.setTextColor(0, 0, 0); // Black color
      pdfDoc.setFont(undefined, "bold");
      pdfDoc.text("Liste des Étudiants", 14, 55);

      // Add date
      pdfDoc.setFontSize(12);
      pdfDoc.setTextColor(0, 0, 0); // Black color
      pdfDoc.setFont(undefined, "normal");
      pdfDoc.text(
        `Date d'export: ${new Date().toLocaleDateString("fr-FR")}`,
        14,
        65
      );

      // Group students by their group
      const groupedStudents: Record<string, Student[]> = {};
      filteredStudents.forEach((student) => {
        if (!groupedStudents[student.student_group]) {
          groupedStudents[student.student_group] = [];
        }
        groupedStudents[student.student_group].push(student);
      });

      let startY = 75;
      const pageHeight = (doc as unknown as any).internal.pageSize.height;
      const marginBottom = 20;

      // Add each group as a separate section
      Object.entries(groupedStudents).forEach(
        ([groupName, students], index) => {
          // Calculate if we need a new page
          if (index > 0 && startY > pageHeight - marginBottom) {
            (doc as unknown as any).addPage();
            startY = 20;
          } else if (index > 0) {
            startY += 10;
          }

          // Add group title
          (doc as unknown as any).setFontSize(14);
          (doc as unknown as any).setTextColor(29, 78, 216); // Blue color
          (doc as unknown as any).setFont(undefined, "bold");
          (doc as unknown as any).text(
            `Groupe: ${groupName} (${students.length} étudiants)`,
            14,
            startY
          );

          // Prepare table data for this group
          const tableData = students.map((student) => [
            student.first_name,
            student.last_name,
            student.cin,
            student.email,
            new Date(student.birth_date).toLocaleDateString("fr-FR"),
            student.inscription_number,
            student.formation_level,
          ]);

          // Check if table would fit on current page, if not, add new page
          const estimatedTableHeight = 10 + students.length * 7; // Header + rows
          if (startY + estimatedTableHeight > pageHeight - marginBottom) {
            (doc as any).addPage();
            startY = 20;
            (doc as any).setFontSize(14);
            (doc as any).setTextColor(29, 78, 216); // Blue color
            (doc as any).setFont(undefined, "bold");
            (doc as any).text(
              `Groupe: ${groupName} (${students.length} étudiants)`,
              14,
              startY
            );
          }

          // Add table for this group
          autoTable(doc as any, {
            head: [
              [
                "Prénom",
                "Nom",
                "CIN",
                "Email",
                "Date de naissance",
                "N° inscription",
                "Formation",
              ],
            ],
            body: tableData,
            startY: startY + 7,
            styles: {
              fontSize: 8,
              cellPadding: 2,
            },
            headStyles: {
              fillColor: [51, 65, 85],
              textColor: [255, 255, 255],
              fontStyle: "bold",
            },
            alternateRowStyles: {
              fillColor: [245, 247, 250],
            },
          });

          // Update startY for next group
          // Use a try-catch block to handle the dynamic property access
          try {
            // We need to use a more generic approach to avoid TypeScript errors
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const jsDocWithAutoTable = doc as any;
            if (
              jsDocWithAutoTable.lastAutoTable &&
              typeof jsDocWithAutoTable.lastAutoTable.finalY === "number"
            ) {
              startY = jsDocWithAutoTable.lastAutoTable.finalY + 10;
            } else {
              startY += estimatedTableHeight + 10; // Default spacing if we can't get the finalY
            }
          } catch (error) {
            startY += estimatedTableHeight + 10; // Default spacing if there's any error
          }

          // Check if we need a new page for the next group
          if (startY > pageHeight - marginBottom) {
            (doc as any).addPage();
            startY = 20;
          }
        }
      );

      // Save the PDF
      (doc as any).save(
        `students_${new Date().toISOString().split("T")[0]}.pdf`
      );

      toast({
        title: "Export réussi",
        description: `${filteredStudents.length} étudiants exportés en PDF par groupe.`,
      });
    } catch (error) {
      toast({
        title: "Erreur d'export",
        description: "Impossible de générer le PDF. Veuillez réessayer.",
        variant: "destructive",
      });
    }
  };

  const exportToJSON = () => {
    // Create JSON data
    const jsonData = JSON.stringify(filteredStudents, null, 2);

    // Create blob and download
    const blob = new Blob([jsonData], { type: "application/json" });
    const url = URL.createObjectURL(blob);

    const link = document.createElement("a");
    link.href = url;
    link.download = `students_${new Date().toISOString().split("T")[0]}.json`;
    document.body.appendChild(link);
    link.click();

    // Clean up
    setTimeout(() => {
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    }, 100);

    toast({
      title: "Export réussi",
      description: `${filteredStudents.length} étudiants exportés en JSON.`,
    });
  };

  const handleImportJSON = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      const reader = new FileReader();
      reader.onload = async (e) => {
        try {
          const jsonData = JSON.parse(e.target?.result as string);
          if (Array.isArray(jsonData)) {
            // Process each student in the JSON data
            const studentsToAdd = jsonData.map((student: Partial<Student>) => ({
              first_name: student.first_name || "",
              last_name: student.last_name || "",
              cin: student.cin || "",
              email: student.email || "",
              birth_date: student.birth_date || "",
              formation_level: student.formation_level || "",
              speciality: student.speciality || "",
              student_group: student.student_group || "",
              inscription_number: student.inscription_number || "",
              formation_type: student.formation_type || "",
              formation_mode: student.formation_mode || "",
              formation_year: student.formation_year || "",
            }));

            // Insert all students
            const { error } = await supabase
              .from("students")
              .insert(studentsToAdd);

            if (error) throw error;

            toast({
              title: "Import réussi",
              description: `${jsonData.length} étudiants importés avec succès.`,
            });

            // Clear the file input
            event.target.value = "";

            // Refresh the student list
            fetchStudents();
          } else {
            toast({
              title: "Erreur d'import",
              description: "Format JSON invalide.",
              variant: "destructive",
            });
          }
        } catch (parseError) {
          toast({
            title: "Erreur d'import",
            description: "Impossible de lire le fichier JSON.",
            variant: "destructive",
          });
        }
      };
      reader.readAsText(file);
    } catch (error) {
      toast({
        title: "Erreur d'import",
        description: "Une erreur s'est produite lors de l'import.",
        variant: "destructive",
      });
    }
  };

  const importFromCSV = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const csvData = e.target?.result as string;
        const lines = csvData.split("\n");

        // Skip header line
        const dataLines = lines.slice(1).filter((line) => line.trim() !== "");

        // Process each line
        const studentsToAdd = dataLines.map((line) => {
          // Remove quotes and split by comma
          const values = line
            .split('","')
            .map((val) => val.replace(/^"|"$/g, ""));

          return {
            first_name: values[0] || "",
            last_name: values[1] || "",
            cin: values[2] || "",
            email: values[3] || "",
            birth_date: values[4] || "",
            formation_level: values[5] || "",
            speciality: values[6] || "",
            student_group: values[7] || "",
            inscription_number: values[8] || "",
            formation_type: values[9] || "",
            formation_mode: values[10] || "",
            formation_year: values[11] || "",
          };
        });

        // Insert all students
        const { error } = await supabase.from("students").insert(studentsToAdd);

        if (error) throw error;

        toast({
          title: "Import réussi",
          description: `${studentsToAdd.length} étudiants importés avec succès.`,
        });

        // Clear the file input
        event.target.value = "";

        // Refresh the student list
        fetchStudents();
      } catch (error) {
        toast({
          title: "Erreur d'import",
          description: "Impossible de lire le fichier CSV.",
          variant: "destructive",
        });
      }
    };
    reader.readAsText(file);
  };

  const importFromSQL = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const sqlData = e.target?.result as string;

        // Parse SQL INSERT statements
        // This is a simplified parser that assumes a specific format
        const insertStatements = sqlData.match(
          /INSERT INTO students \([^)]+\) VALUES (\([^)]+\));/g
        );

        if (!insertStatements || insertStatements.length === 0) {
          toast({
            title: "Erreur d'import",
            description:
              "Aucune instruction INSERT valide trouvée dans le fichier SQL.",
            variant: "destructive",
          });
          return;
        }

        // Process each INSERT statement
        const studentsToAdd = insertStatements
          .map((statement) => {
            // Extract values from INSERT statement
            const valuesMatch = statement.match(/VALUES \(([^)]+)\)/);
            if (!valuesMatch) return null;

            // Split values and remove quotes
            const values = valuesMatch[1].split(",").map((val) => {
              // Remove quotes and trim whitespace
              return val
                .trim()
                .replace(/^'(.*)'$/, "$1")
                .replace(/^"(.*)"$/, "$1");
            });

            // Map to student object (adjust indices based on your SQL structure)
            return {
              first_name: values[0] || "",
              last_name: values[1] || "",
              cin: values[2] || "",
              email: values[3] || "",
              birth_date: values[4] || "",
              formation_level: values[5] || "",
              speciality: values[6] || "",
              student_group: values[7] || "",
              inscription_number: values[8] || "",
              formation_type: values[9] || "",
              formation_mode: values[10] || "",
              formation_year: values[11] || "",
            };
          })
          .filter(Boolean); // Remove any null entries

        // Insert all students
        const { error } = await supabase.from("students").insert(studentsToAdd);

        if (error) throw error;

        toast({
          title: "Import réussi",
          description: `${studentsToAdd.length} étudiants importés avec succès depuis le fichier SQL.`,
        });

        // Clear the file input
        event.target.value = "";

        // Refresh the student list
        fetchStudents();
      } catch (error) {
        toast({
          title: "Erreur d'import",
          description: "Impossible de lire le fichier SQL.",
          variant: "destructive",
        });
      }
    };
    reader.readAsText(file);
  };

  const handleAddStudent = async () => {
    try {
      // Basic validation
      if (!newStudent.first_name.trim()) {
        toast({
          title: "Erreur de validation",
          description: "Le prénom est requis.",
          variant: "destructive",
        });
        return;
      }

      if (!newStudent.last_name.trim()) {
        toast({
          title: "Erreur de validation",
          description: "Le nom est requis.",
          variant: "destructive",
        });
        return;
      }

      if (!newStudent.email.trim() || !newStudent.email.includes("@")) {
        toast({
          title: "Erreur de validation",
          description: "Un email valide est requis.",
          variant: "destructive",
        });
        return;
      }

      // Use the password_hash field directly, with default if empty
      const studentToAdd = {
        ...newStudent,
        password_hash: newStudent.password_hash?.trim() || "default123",
        formation_year: newStudent.formation_year || defaultFormationYear,
        formation_type: newStudent.formation_type || "Résidentielle",
        formation_mode: newStudent.formation_mode || "Diplômante",
      };

      const { data, error } = await supabase
        .from("students")
        .insert([studentToAdd])
        .select();

      if (error) {
        console.error("Database error creating user:", error);
        throw new Error(`Database error creating new user: ${error.message}`);
      }

      toast({
        title: "Succès",
        description: "Étudiant ajouté avec succès.",
      });

      setAddingStudent(false);
      setNewStudent({
        first_name: "",
        last_name: "",
        cin: "",
        email: "",
        birth_date: "",
        formation_level: "",
        speciality: "",
        student_group: "",
        inscription_number: "",
        formation_type: "",
        formation_mode: "",
        formation_year: defaultFormationYear,
        password_hash: "",
      });
      fetchStudents();
    } catch (error) {
      console.error("Failed to create user:", error);
      toast({
        title: "Erreur",
        description: `Failed to create user: ${(error as Error).message}`,
        variant: "destructive",
      });
    }
  };

  // Function to get formation levels by group with filtering logic
  const getFormationLevelsByGroup = (): FormationLevelsByGroup => {
    const levelsByGroup: FormationLevelsByGroup = {};

    // Group students by their group and collect formation levels
    students.forEach((student) => {
      const group = student.student_group;
      const level = student.formation_level;

      if (!levelsByGroup[group]) {
        levelsByGroup[group] = [];
      }

      // Add level if not already in the array
      if (!levelsByGroup[group].includes(level)) {
        levelsByGroup[group].push(level);
      }
    });

    // Apply filtering logic: if there are two formation levels and one is "Technicien spécialisé", keep only that
    Object.keys(levelsByGroup).forEach((group) => {
      const levels = levelsByGroup[group];
      if (levels.length === 2 && levels.includes("Technicien spécialisé")) {
        levelsByGroup[group] = ["Technicien spécialisé"];
      }
    });

    return levelsByGroup;
  };

  // Get formation levels by group for display
  const formationLevelsByGroup = getFormationLevelsByGroup();

  // Function to get filiere (category) from group name
  const getFiliere = (group: string) => {
    if (group.startsWith("DEVOWFS")) return "DEVOWFS";
    if (group.startsWith("IDOSR")) return "IDOSR";
    if (group.startsWith("DEV")) return "DEV";
    if (group.startsWith("ID")) return "ID";
    return "Autre";
  };

  // Get unique filieres from STUDENT_GROUPS
  const getUniqueFilieres = () => {
    const filieres = STUDENT_GROUPS.map((group) => getFiliere(group));
    return Array.from(new Set(filieres));
  };

  // Get groups by filiere
  const getGroupsByFiliere = (filiere: string) => {
    return STUDENT_GROUPS.filter((group) => getFiliere(group) === filiere);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-blue-200 border-t-blue-600 mx-auto mb-6"></div>
          <p className="text-lg text-slate-600 font-medium">
            Chargement des données...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
      {/* Header */}

      {/* Statistics Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="bg-white/80 backdrop-blur-sm border-slate-200 shadow-lg">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-600">
                    Total Étudiants
                  </p>
                  <p className="text-2xl font-bold text-slate-900">
                    {students.length}
                  </p>
                </div>
                <div className="p-3 bg-blue-100 rounded-full">
                  <Users className="h-6 w-6 text-blue-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white/80 backdrop-blur-sm border-slate-200 shadow-lg">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-600">Groupes</p>
                  <p className="text-2xl font-bold text-slate-900">
                    {STUDENT_GROUPS.length}
                  </p>
                </div>
                <div className="p-3 bg-green-100 rounded-full">
                  <Users className="h-6 w-6 text-green-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white/80 backdrop-blur-sm border-slate-200 shadow-lg">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-600">Filtrés</p>
                  <p className="text-2xl font-bold text-slate-900">
                    {filteredStudents.length}
                  </p>
                </div>
                <div className="p-3 bg-purple-100 rounded-full">
                  <Filter className="h-6 w-6 text-purple-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white/80 backdrop-blur-sm border-slate-200 shadow-lg">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-600">Niveaux</p>
                  <p className="text-2xl font-bold text-slate-900">
                    {Object.keys(formationLevelsByGroup).length}
                  </p>
                </div>
                <div className="p-3 bg-amber-100 rounded-full">
                  <Settings className="h-6 w-6 text-amber-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-8">
        <div className="flex flex-col lg:flex-row gap-6">
          {/* Vertical Navbar for Groups with Pagination */}
          <div className="w-full lg:w-64 flex-shrink-0">
            <Card className="bg-white/80 backdrop-blur-sm border-slate-200 shadow-lg sticky top-24">
              <CardHeader className="bg-gradient-to-r from-slate-50 to-blue-50 rounded-t-lg">
                <CardTitle className="flex items-center gap-2 text-slate-700">
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <Users className="h-5 w-5 text-blue-600" />
                  </div>
                  Groupes
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                {/* Pagination Controls */}
                <div className="p-2 border-b border-slate-200">
                  <div className="flex flex-wrap gap-1">
                    {getUniqueFilieres().map((filiere) => (
                      <Button
                        key={filiere}
                        variant={
                          currentPage === filiere ? "default" : "outline"
                        }
                        size="sm"
                        className={`text-xs px-2 py-1 h-auto ${
                          currentPage === filiere
                            ? "bg-blue-600 hover:bg-blue-700"
                            : "bg-white hover:bg-blue-50"
                        }`}
                        onClick={() => setCurrentPage(filiere)}
                      >
                        {filiere}
                      </Button>
                    ))}
                  </div>
                </div>

                {/* All Groups Button */}
                <div className="p-4 border-b border-slate-200">
                  <Button
                    variant={selectedGroup === "all" ? "default" : "outline"}
                    className={`w-full justify-between mb-2 ${
                      selectedGroup === "all"
                        ? "bg-blue-600 hover:bg-blue-700"
                        : "bg-white hover:bg-blue-50"
                    }`}
                    onClick={() => setSelectedGroup("all")}
                  >
                    <span>Tous les groupes</span>
                    <Badge
                      variant="secondary"
                      className={
                        selectedGroup === "all"
                          ? "bg-blue-100 text-blue-800"
                          : "bg-slate-100 text-slate-800"
                      }
                    >
                      {students.length}
                    </Badge>
                  </Button>
                </div>

                {/* Group List with Pagination */}
                <div className="border-t border-slate-200 max-h-96 overflow-y-auto">
                  {getGroupsByFiliere(currentPage).map((group) => {
                    const groupStudents = students.filter(
                      (student) => student.student_group === group
                    );
                    return (
                      <Button
                        key={group}
                        variant={selectedGroup === group ? "default" : "ghost"}
                        className={`w-full justify-between rounded-none border-b border-slate-100 ${
                          selectedGroup === group
                            ? "bg-blue-50 hover:bg-blue-100 text-blue-700"
                            : "hover:bg-slate-50"
                        }`}
                        onClick={() => setSelectedGroup(group)}
                      >
                        <span className="font-medium">{group}</span>
                        <Badge
                          variant="secondary"
                          className={
                            selectedGroup === group
                              ? "bg-blue-100 text-blue-800"
                              : "bg-slate-100 text-slate-800"
                          }
                        >
                          {groupStudents.length}
                        </Badge>
                      </Button>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Main Content Area */}
          <div className="flex-1 w-full min-w-0 max-w-full">
            {/* Formation Levels by Group Section */}

            {/* Filters and Actions */}
            <Card className="mb-8 bg-white/80 backdrop-blur-sm border-slate-200 shadow-lg">
              <CardHeader className="bg-gradient-to-r from-slate-50 to-blue-50 rounded-t-lg">
                <CardTitle className="flex items-center gap-2 text-slate-700">
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <Filter className="h-5 w-5 text-blue-600" />
                  </div>
                  Filtres et Actions
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-6">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 mb-4">
                  <div className="space-y-2">
                    <Label
                      htmlFor="search"
                      className="text-sm font-medium text-slate-700"
                    >
                      Recherche
                    </Label>
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
                      <Input
                        placeholder="Nom, prénom, CIN, email..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-10 bg-white border-slate-200 hover:border-blue-300 transition-colors"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-sm font-medium text-slate-700">
                      Exporter
                    </Label>
                    <div className="flex flex-wrap gap-2">
                      <Button
                        onClick={exportToJSON}
                        variant="outline"
                        size="sm"
                        className="flex items-center gap-2 bg-purple-50 border-purple-200 text-purple-700 hover:bg-purple-100 transition-colors"
                      >
                        <Download className="h-4 w-4" />
                        <span className="hidden sm:inline">JSON</span>
                      </Button>
                      <Button
                        onClick={exportToPDF}
                        variant="outline"
                        size="sm"
                        className="flex items-center gap-2 bg-blue-50 border-blue-200 text-blue-700 hover:bg-blue-100 transition-colors"
                      >
                        <Download className="h-4 w-4" />
                        <span className="hidden sm:inline">PDF</span>
                      </Button>
                      <Button
                        onClick={exportToExcel}
                        variant="outline"
                        size="sm"
                        className="flex items-center gap-2 bg-green-50 border-green-200 text-green-700 hover:bg-green-100 transition-colors"
                      >
                        <Download className="h-4 w-4" />
                        <span className="hidden sm:inline">Excel</span>
                      </Button>
                    </div>
                  </div>

                  <div className="space-y-2 md:col-span-2 lg:col-span-1">
                    <Label className="text-sm font-medium text-slate-700">
                      Actions
                    </Label>
                    <div className="flex flex-wrap gap-2">
                      <Button
                        onClick={() => setAddingStudent(true)}
                        className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700"
                      >
                        <Plus className="h-4 w-4" />
                        <span className="hidden sm:inline">Ajouter</span>
                      </Button>
                      <Button
                        onClick={() => setShowCSVImport(true)}
                        variant="outline"
                        className="flex items-center gap-2 border-green-200 text-green-700 hover:bg-green-50"
                      >
                        <Upload className="h-4 w-4" />
                        <span className="hidden sm:inline">Import CSV</span>
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Add Student Form */}
            {addingStudent && (
              <Card className="mb-8 bg-white/80 backdrop-blur-sm border-slate-200 shadow-lg">
                <CardHeader className="bg-gradient-to-r from-slate-50 to-blue-50 rounded-t-lg">
                  <CardTitle className="flex items-center gap-2 text-slate-700">
                    <div className="p-2 bg-blue-100 rounded-lg">
                      <Plus className="h-5 w-5 text-blue-600" />
                    </div>
                    Ajouter un nouvel étudiant
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                    <div className="space-y-2">
                      <Label className="text-sm font-medium text-slate-700">
                        Prénom *
                      </Label>
                      <Input
                        value={newStudent.first_name}
                        onChange={(e) =>
                          setNewStudent({
                            ...newStudent,
                            first_name: e.target.value,
                          })
                        }
                        placeholder="Prénom"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-sm font-medium text-slate-700">
                        Nom *
                      </Label>
                      <Input
                        value={newStudent.last_name}
                        onChange={(e) =>
                          setNewStudent({
                            ...newStudent,
                            last_name: e.target.value,
                          })
                        }
                        placeholder="Nom"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-sm font-medium text-slate-700">
                        CIN *
                      </Label>
                      <Input
                        value={newStudent.cin}
                        onChange={(e) =>
                          setNewStudent({ ...newStudent, cin: e.target.value })
                        }
                        placeholder="CIN"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-sm font-medium text-slate-700">
                        Email *
                      </Label>
                      <Input
                        value={newStudent.email}
                        onChange={(e) => {
                          const email = e.target.value;
                          // Extract the part before @ for inscription number
                          const inscriptionNumber = email.split("@")[0] || "";
                          setNewStudent({
                            ...newStudent,
                            email: email,
                            inscription_number: inscriptionNumber,
                          });
                        }}
                        placeholder="Email"
                        type="email"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-sm font-medium text-slate-700">
                        Date de naissance *
                      </Label>
                      <Input
                        value={newStudent.birth_date}
                        onChange={(e) =>
                          setNewStudent({
                            ...newStudent,
                            birth_date: e.target.value,
                          })
                        }
                        type="date"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-sm font-medium text-slate-700">
                        N° d'inscription *
                      </Label>
                      <Input
                        value={newStudent.inscription_number}
                        readOnly
                        placeholder="N° d'inscription"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-sm font-medium text-slate-700">
                        Niveau de formation *
                      </Label>
                      <Select
                        value={newStudent.formation_level}
                        onValueChange={(value) =>
                          setNewStudent({
                            ...newStudent,
                            formation_level: value,
                          })
                        }
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Sélectionner un niveau" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Technicien spécialisé">
                            Technicien spécialisé
                          </SelectItem>
                          <SelectItem value="Technicien">Technicien</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-sm font-medium text-slate-700">
                        Spécialité *
                      </Label>
                      <Select
                        value={newStudent.speciality}
                        onValueChange={(value) =>
                          setNewStudent({
                            ...newStudent,
                            speciality: value,
                          })
                        }
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Sélectionner une spécialité" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Développement Digital option web full stack (2A)">
                            Développement Digital option web full stack (2A)
                          </SelectItem>
                          <SelectItem value="Developement digital">
                            Developement digital
                          </SelectItem>
                          <SelectItem value="infrastructure digital">
                            infrastructure digital
                          </SelectItem>
                          <SelectItem value="Réseaux et systèmes">
                            Réseaux et systèmes
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-sm font-medium text-slate-700">
                        Groupe *
                      </Label>
                      <Select
                        value={newStudent.student_group}
                        onValueChange={(value) =>
                          setNewStudent({ ...newStudent, student_group: value })
                        }
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Sélectionner un groupe" />
                        </SelectTrigger>
                        <SelectContent>
                          {STUDENT_GROUPS.map((group) => (
                            <SelectItem key={group} value={group}>
                              {group}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-sm font-medium text-slate-700">
                        Type de formation *
                      </Label>
                      <Input
                        value="Résidentielle"
                        readOnly
                        placeholder="Rempli automatiquement à partir de l'email"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-sm font-medium text-slate-700">
                        Mode de formation *
                      </Label>
                      <Select
                        value={newStudent.formation_mode}
                        onValueChange={(value) =>
                          setNewStudent({
                            ...newStudent,
                            formation_mode: value,
                          })
                        }
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Sélectionner un mode" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Diplômant">Diplômant</SelectItem>
                          <SelectItem value="qualifiant">qualifiant</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-sm font-medium text-slate-700">
                        Année de formation *
                      </Label>
                      <Input
                        value={newStudent.formation_year}
                        readOnly
                        placeholder="Année de formation"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-sm font-medium text-slate-700">
                        Mot de passe
                      </Label>
                      <Input
                        type="password"
                        value={newStudent.password_hash || ""}
                        onChange={(e) =>
                          setNewStudent({
                            ...newStudent,
                            password_hash: e.target.value,
                          })
                        }
                        placeholder="Mot de passe de l'étudiant"
                      />
                    </div>
                  </div>
                  <div className="flex justify-end gap-2 mt-6">
                    <Button
                      onClick={() => setAddingStudent(false)}
                      variant="outline"
                    >
                      Annuler
                    </Button>
                    <Button
                      onClick={handleAddStudent}
                      className="bg-blue-600 hover:bg-blue-700"
                    >
                      Ajouter l'étudiant
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Students Table */}
            <Card className="bg-white/80 backdrop-blur-sm border-slate-200 shadow-lg">
              <CardHeader className="bg-gradient-to-r from-slate-50 to-blue-50 rounded-t-lg">
                <CardTitle className="flex items-center gap-2 text-slate-700">
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <User className="h-5 w-5 text-blue-600" />
                  </div>
                  Liste des Étudiants ({filteredStudents.length})
                </CardTitle>
                <CardDescription className="text-slate-600">
                  Gérez les étudiants par groupe
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-6">
                <div className="overflow-x-auto -mx-6 px-6 -my-4 py-4">
                  <div className="min-w-full inline-block align-middle">
                    <Table>
                      <TableHeader>
                        <TableRow className="bg-gradient-to-r from-slate-50 to-blue-50 hover:bg-slate-50">
                          <TableHead className="font-semibold text-slate-700 min-w-[150px]">
                            Étudiant
                          </TableHead>
                          <TableHead className="font-semibold text-slate-700 min-w-[100px]">
                            CIN
                          </TableHead>
                          <TableHead className="font-semibold text-slate-700 min-w-[200px]">
                            Email
                          </TableHead>
                          <TableHead className="font-semibold text-slate-700 min-w-[120px]">
                            N° d'inscription
                          </TableHead>
                          <TableHead className="font-semibold text-slate-700 min-w-[150px]">
                            Formation
                          </TableHead>
                          <TableHead className="font-semibold text-slate-700 min-w-[120px]">
                            Actions
                          </TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredStudents.map((student) => (
                          <TableRow
                            key={student.id}
                            className="hover:bg-blue-50/50 transition-colors duration-200"
                          >
                            <TableCell className="font-medium text-slate-800">
                              {student.first_name} {student.last_name}
                              <div className="text-xs text-slate-500">
                                {new Date(
                                  student.birth_date
                                ).toLocaleDateString("fr-FR")}
                              </div>
                            </TableCell>
                            <TableCell className="text-slate-600">
                              {student.cin}
                            </TableCell>
                            <TableCell className="text-slate-600">
                              {student.email}
                            </TableCell>
                            <TableCell className="text-slate-600">
                              {student.inscription_number}
                            </TableCell>
                            <TableCell>
                              <div className="text-sm">
                                <div className="font-medium">
                                  {student.formation_level}
                                </div>
                                <div className="text-slate-600">
                                  {student.student_group}
                                </div>
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-1">
                                <Button
                                  onClick={() => handleEditStudent(student)}
                                  size="sm"
                                  variant="outline"
                                  className="h-8 w-8 p-0"
                                >
                                  <Edit className="h-4 w-4" />
                                </Button>
                                <Button
                                  onClick={() =>
                                    handleDeleteStudent(student.id)
                                  }
                                  size="sm"
                                  variant="outline"
                                  className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Student Edit Modal */}
      <Dialog open={editingStudent !== null} onOpenChange={(open) => !open && setEditingStudent(null)}>
        <DialogContent className="max-w-2xl p-8">
          <DialogHeader className="space-y-4">
            <DialogTitle>Modifier un Étudiant</DialogTitle>
            <DialogDescription>
              Veuillez remplir les informations suivantes pour modifier les
              détails de l'étudiant.
            </DialogDescription>
          </DialogHeader>
          {editingStudentForm && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Prénom</Label>
                <Input
                  value={editingStudentForm.first_name}
                  onChange={(e) =>
                    setEditingStudentForm({
                      ...editingStudentForm,
                      first_name: e.target.value,
                    })
                  }
                />
              </div>

              <div className="space-y-2">
                <Label>Nom</Label>
                <Input
                  value={editingStudentForm.last_name}
                  onChange={(e) =>
                    setEditingStudentForm({
                      ...editingStudentForm,
                      last_name: e.target.value,
                    })
                  }
                />
              </div>

              <div className="space-y-2">
                <Label>CIN</Label>
                <Input
                  value={editingStudentForm.cin}
                  onChange={(e) =>
                    setEditingStudentForm({
                      ...editingStudentForm,
                      cin: e.target.value,
                    })
                  }
                />
              </div>

              <div className="space-y-2">
                <Label>Email</Label>
                <Input
                  value={editingStudentForm.email}
                  onChange={(e) =>
                    setEditingStudentForm({
                      ...editingStudentForm,
                      email: e.target.value,
                    })
                  }
                  type="email"
                />
              </div>

              <div className="space-y-2">
                <Label>Date de naissance</Label>
                <Input
                  value={editingStudentForm.birth_date}
                  onChange={(e) =>
                    setEditingStudentForm({
                      ...editingStudentForm,
                      birth_date: e.target.value,
                    })
                  }
                  type="date"
                />
              </div>

              <div className="space-y-2">
                <Label>N° d'inscription</Label>
                <Input value={editingStudentForm.inscription_number} readOnly />
              </div>

              <div className="space-y-2">
                <Label>Niveau de formation</Label>
                <Select
                  value={editingStudentForm.formation_level}
                  onValueChange={(value) =>
                    setEditingStudentForm({
                      ...editingStudentForm,
                      formation_level: value,
                    })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Sélectionner un niveau" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Technicien spécialisé">
                      Technicien spécialisé
                    </SelectItem>
                    <SelectItem value="Technicien">Technicien</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Spécialité</Label>
                <Select
                  value={editingStudentForm.speciality}
                  onValueChange={(value) =>
                    setEditingStudentForm({
                      ...editingStudentForm,
                      speciality: value,
                    })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Sélectionner une spécialité" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Développement Digital option web full stack (2A)">
                      Développement Digital option web full stack (2A)
                    </SelectItem>
                    <SelectItem value="Developement digital">
                      Developement digital
                    </SelectItem>
                    <SelectItem value="infrastructure digital">
                      infrastructure digital
                    </SelectItem>
                    <SelectItem value="Réseaux et systèmes">
                      Réseaux et systèmes
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Groupe</Label>
                <Select
                  value={editingStudentForm.student_group}
                  onValueChange={(value) =>
                    setEditingStudentForm({
                      ...editingStudentForm,
                      student_group: value,
                    })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Sélectionner un groupe" />
                  </SelectTrigger>
                  <SelectContent>
                    {STUDENT_GROUPS.map((group) => (
                      <SelectItem key={group} value={group}>
                        {group}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Type de formation</Label>
                <Input value="Résidentielle" readOnly />
              </div>

              <div className="space-y-2">
                <Label>Mode de formation</Label>
                <Select
                  value={editingStudentForm.formation_mode}
                  onValueChange={(value) =>
                    setEditingStudentForm({
                      ...editingStudentForm,
                      formation_mode: value,
                    })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Sélectionner un mode" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Diplômant">Diplômant</SelectItem>
                    <SelectItem value="qualifiant">qualifiant</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Année de formation</Label>
                <Input value={editingStudentForm.formation_year} readOnly />
              </div>

              <div className="space-y-2">
                <Label>Mot de passe actuel</Label>
                <Input
                  type={showCurrentPassword ? "text" : "password"}
                  value={editingStudentForm.current_password}
                  onChange={(e) =>
                    setEditingStudentForm({
                      ...editingStudentForm,
                      current_password: e.target.value,
                    })
                  }
                />
                <Button
                  variant="outline"
                  size="sm"
                  className="mt-2"
                  onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                >
                  {showCurrentPassword ? "Masquer" : "Afficher"}
                </Button>
              </div>

              <div className="space-y-2">
                <Label>Nouveau mot de passe</Label>
                <Input
                  type={showNewPassword ? "text" : "password"}
                  value={editingStudentForm.new_password}
                  onChange={(e) =>
                    setEditingStudentForm({
                      ...editingStudentForm,
                      new_password: e.target.value,
                    })
                  }
                />
                <Button
                  variant="outline"
                  size="sm"
                  className="mt-2"
                  onClick={() => setShowNewPassword(!showNewPassword)}
                >
                  {showNewPassword ? "Masquer" : "Afficher"}
                </Button>
              </div>
            </div>
          )}

          <DialogFooter className="mt-6">
            <Button
              onClick={() => {
                setEditingStudent(null);
                setEditingStudentForm(null);
              }}
              variant="outline"
            >
              Annuler
            </Button>
            <Button
              onClick={handleSaveStudent}
              className="bg-blue-600 hover:bg-blue-700"
            >
              Enregistrer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* CSV Import Dialog */}
      <CSVImportDialog
        open={showCSVImport}
        onOpenChange={setShowCSVImport}
        onImportSuccess={() => {
          fetchStudents();
          setShowCSVImport(false);
        }}
      />
    </div>
  );
};
