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
import ofpptLogo from "@/assets/ofppt-logo.png";
import jsPDF from "jspdf";
import "jspdf-autotable";

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
  "D101",
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
  const [addingStudent, setAddingStudent] = useState<boolean>(false);
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
    formation_year: "",
  });
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
  };

  const handleSaveStudent = async () => {
    if (!editingStudent) return;

    try {
      const { error } = await supabase
        .from("students")
        .update({
          first_name: editingStudent.first_name,
          last_name: editingStudent.last_name,
          cin: editingStudent.cin,
          email: editingStudent.email,
          birth_date: editingStudent.birth_date,
          formation_level: editingStudent.formation_level,
          speciality: editingStudent.speciality,
          student_group: editingStudent.student_group,
          inscription_number: editingStudent.inscription_number,
          formation_type: editingStudent.formation_type,
          formation_mode: editingStudent.formation_mode,
          formation_year: editingStudent.formation_year,
        })
        .eq("id", editingStudent.id);

      if (error) throw error;

      toast({
        title: "Succès",
        description: "Étudiant mis à jour avec succès.",
      });

      setEditingStudent(null);
      fetchStudents();
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Impossible de mettre à jour l'étudiant.",
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
        (doc as any).addImage(logoDataUrl, "PNG", 15, 10, 40, 20); // x, y, width, height
      } catch (logoError) {
        console.log("Logo could not be loaded, continuing without it");
      }

      // Add institution names
      (doc as any).setFontSize(22);
      (doc as any).setTextColor(29, 78, 216); // Blue color
      (doc as any).setFont(undefined, "bold");
      (doc as any).text("OFPPT - ISFO", 148, 25, { align: "center" });

      // Add full institution name
      (doc as any).setFontSize(14);
      (doc as any).setTextColor(0, 0, 0); // Black color
      (doc as any).setFont(undefined, "normal");
      (doc as any).text(
        "Office de la Formation Professionnelle et de la Promotion du Travail",
        148,
        35,
        { align: "center" }
      );
      (doc as any).text(
        "Institut Spécialisé de Formation de l'Offshoring Casablanca",
        148,
        42,
        { align: "center" }
      );

      // Add title
      (doc as any).setFontSize(18);
      (doc as any).setTextColor(0, 0, 0); // Black color
      (doc as any).setFont(undefined, "bold");
      (doc as any).text("Liste des Étudiants", 14, 55);

      // Add date
      (doc as any).setFontSize(12);
      (doc as any).setTextColor(0, 0, 0); // Black color
      (doc as any).setFont(undefined, "normal");
      (doc as any).text(
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
      const pageHeight = (doc as any).internal.pageSize.height;
      const marginBottom = 20;

      // Add each group as a separate section
      Object.entries(groupedStudents).forEach(
        ([groupName, students], index) => {
          // Calculate if we need a new page
          if (index > 0 && startY > pageHeight - marginBottom) {
            (doc as any).addPage();
            startY = 20;
          } else if (index > 0) {
            startY += 10;
          }

          // Add group title
          (doc as any).setFontSize(14);
          (doc as any).setTextColor(29, 78, 216); // Blue color
          (doc as any).setFont(undefined, "bold");
          (doc as any).text(
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
      const { data, error } = await supabase
        .from("students")
        .insert([newStudent])
        .select();

      if (error) throw error;

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
        formation_year: "",
      });
      fetchStudents();
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Impossible d'ajouter l'étudiant.",
        variant: "destructive",
      });
    }
  };

  const getFiliere = (group: string) => {
    if (group.startsWith("DEVOWFS")) return "DEVOWFS";
    if (group.startsWith("IDOSR")) return "IDOSR";
    if (group.startsWith("DEV")) return "DEV";
    if (group.startsWith("ID")) return "ID";
    return "Autre";
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
      <div className="bg-white/80 backdrop-blur-sm shadow-lg border-b border-blue-200/50 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-20">
            <div className="flex items-center">
              <div className="bg-gradient-to-br from-blue-600 to-indigo-700 p-3 rounded-xl shadow-lg">
                <Users className="h-8 w-8 text-white" />
              </div>
              <div className="ml-4">
                <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-700 to-indigo-700 bg-clip-text text-transparent">
                  Gestion des Étudiants
                </h1>
                <p className="text-sm text-slate-600 font-medium">
                  Gérer les étudiants par groupe
                </p>
              </div>
            </div>
            {onLogout ? (
              <Button
                onClick={onLogout}
                variant="outline"
                className="flex items-center gap-2 bg-white/80 hover:bg-red-50 border-red-200 text-red-700 hover:text-red-800 transition-all duration-200"
              >
                <LogOut className="h-4 w-4" />
                Déconnexion
              </Button>
            ) : (
              <Button
                onClick={onBack}
                variant="outline"
                className="flex items-center gap-2 bg-white/80 hover:bg-red-50 border-red-200 text-red-700 hover:text-red-800 transition-all duration-200"
              >
                <X className="h-4 w-4" />
                Retour au tableau de bord
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Navigation Bar */}
      <div className="bg-white/90 backdrop-blur-sm border-b border-slate-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex space-x-8">
            <button
              onClick={onBack}
              className="py-4 px-1 border-b-2 border-transparent text-slate-500 font-medium text-sm transition-colors duration-200 hover:text-slate-700 hover:border-slate-300 flex items-center gap-2"
            >
              <FileText className="h-4 w-4" />
              Gestion des Demandes
            </button>
            <button className="py-4 px-1 border-b-2 border-blue-500 text-blue-600 font-medium text-sm transition-colors duration-200 flex items-center gap-2 cursor-default">
              <User className="h-4 w-4" />
              Gestion des Étudiants
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
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
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
              <div className="space-y-2">
                <Label
                  htmlFor="group"
                  className="text-sm font-medium text-slate-700"
                >
                  Groupe
                </Label>
                <Select value={selectedGroup} onValueChange={setSelectedGroup}>
                  <SelectTrigger className="bg-white border-slate-200 hover:border-blue-300 transition-colors">
                    <SelectValue placeholder="Tous les groupes" />
                  </SelectTrigger>
                  <SelectContent className="bg-white border shadow-xl z-50 rounded-lg">
                    <SelectItem value="all">Tous les groupes</SelectItem>
                    {STUDENT_GROUPS.map((group) => (
                      <SelectItem key={group} value={group}>
                        {group}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

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
                <div className="flex flex-col sm:flex-row gap-2">
                  <Button
                    onClick={exportToJSON}
                    variant="outline"
                    size="sm"
                    className="flex items-center gap-2 bg-purple-50 border-purple-200 text-purple-700 hover:bg-purple-100 transition-colors w-full sm:w-auto"
                  >
                    <Download className="h-4 w-4" />
                    <span className="hidden sm:inline">JSON</span>
                  </Button>
                  <Button
                    onClick={exportToPDF}
                    variant="outline"
                    size="sm"
                    className="flex items-center gap-2 bg-blue-50 border-blue-200 text-blue-700 hover:bg-blue-100 transition-colors w-full sm:w-auto"
                  >
                    <Download className="h-4 w-4" />
                    <span className="hidden sm:inline">PDF</span>
                  </Button>
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-sm font-medium text-slate-700">
                  Actions
                </Label>
                <div className="flex flex-col gap-2">
                  <Button
                    onClick={() => setAddingStudent(true)}
                    className="flex items-center gap-2 w-full"
                  >
                    <Plus className="h-4 w-4" />
                    <span className="hidden sm:inline">Ajouter</span>
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
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
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
                    onChange={(e) =>
                      setNewStudent({ ...newStudent, email: e.target.value })
                    }
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
                    onChange={(e) =>
                      setNewStudent({
                        ...newStudent,
                        inscription_number: e.target.value,
                      })
                    }
                    placeholder="N° d'inscription"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-sm font-medium text-slate-700">
                    Niveau de formation *
                  </Label>
                  <Input
                    value={newStudent.formation_level}
                    onChange={(e) =>
                      setNewStudent({
                        ...newStudent,
                        formation_level: e.target.value,
                      })
                    }
                    placeholder="Niveau de formation"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-sm font-medium text-slate-700">
                    Spécialité *
                  </Label>
                  <Input
                    value={newStudent.speciality}
                    onChange={(e) =>
                      setNewStudent({
                        ...newStudent,
                        speciality: e.target.value,
                      })
                    }
                    placeholder="Spécialité"
                  />
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
                    value={newStudent.formation_type}
                    onChange={(e) =>
                      setNewStudent({
                        ...newStudent,
                        formation_type: e.target.value,
                      })
                    }
                    placeholder="Type de formation"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-sm font-medium text-slate-700">
                    Mode de formation *
                  </Label>
                  <Input
                    value={newStudent.formation_mode}
                    onChange={(e) =>
                      setNewStudent({
                        ...newStudent,
                        formation_mode: e.target.value,
                      })
                    }
                    placeholder="Mode de formation"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-sm font-medium text-slate-700">
                    Année de formation *
                  </Label>
                  <Input
                    value={newStudent.formation_year}
                    onChange={(e) =>
                      setNewStudent({
                        ...newStudent,
                        formation_year: e.target.value,
                      })
                    }
                    placeholder="Année de formation"
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
            <div className="overflow-x-auto">
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
                      {editingStudent?.id === student.id ? (
                        // Edit mode
                        <>
                          <TableCell>
                            <Input
                              value={editingStudent.first_name}
                              onChange={(e) =>
                                setEditingStudent({
                                  ...editingStudent,
                                  first_name: e.target.value,
                                })
                              }
                              className="mb-1"
                            />
                            <Input
                              value={editingStudent.last_name}
                              onChange={(e) =>
                                setEditingStudent({
                                  ...editingStudent,
                                  last_name: e.target.value,
                                })
                              }
                            />
                          </TableCell>
                          <TableCell>
                            <Input
                              value={editingStudent.cin}
                              onChange={(e) =>
                                setEditingStudent({
                                  ...editingStudent,
                                  cin: e.target.value,
                                })
                              }
                            />
                          </TableCell>
                          <TableCell>
                            <Input
                              value={editingStudent.email}
                              onChange={(e) =>
                                setEditingStudent({
                                  ...editingStudent,
                                  email: e.target.value,
                                })
                              }
                            />
                          </TableCell>
                          <TableCell>
                            <Input
                              value={editingStudent.inscription_number}
                              onChange={(e) =>
                                setEditingStudent({
                                  ...editingStudent,
                                  inscription_number: e.target.value,
                                })
                              }
                            />
                          </TableCell>
                          <TableCell>
                            <Select
                              value={editingStudent.student_group}
                              onValueChange={(value) =>
                                setEditingStudent({
                                  ...editingStudent,
                                  student_group: value,
                                })
                              }
                            >
                              <SelectTrigger className="w-full">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                {STUDENT_GROUPS.map((group) => (
                                  <SelectItem key={group} value={group}>
                                    {group}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-1">
                              <Button
                                onClick={handleSaveStudent}
                                size="sm"
                                className="h-8 w-8 p-0"
                              >
                                <Save className="h-4 w-4" />
                              </Button>
                              <Button
                                onClick={() => setEditingStudent(null)}
                                size="sm"
                                variant="outline"
                                className="h-8 w-8 p-0"
                              >
                                <X className="h-4 w-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </>
                      ) : (
                        // View mode
                        <>
                          <TableCell className="font-medium text-slate-800">
                            {student.first_name} {student.last_name}
                            <div className="text-xs text-slate-500">
                              {new Date(student.birth_date).toLocaleDateString(
                                "fr-FR"
                              )}
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
                                onClick={() => handleDeleteStudent(student.id)}
                                size="sm"
                                variant="outline"
                                className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </>
                      )}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
