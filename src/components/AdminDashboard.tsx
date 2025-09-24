import React, { useState, useEffect, lazy, Suspense } from "react";
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
import { Textarea } from "@/components/ui/textarea";
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
  UserCog,
  Download,
  Users,
  Filter,
  LogOut,
  Clock,
  Check,
  X,
  CalendarDays,
  ChartBar,
  Timer,
  TrendingUp,
  School,
  Target,
  AlertCircle,
  Mail,
  FileText,
  BarChart3,
  GraduationCap,
  Settings,
  Search,
  RefreshCw,
  Eye,
  Trash2,
  Calendar,
  Filter as FilterIcon,
  User,
  RotateCcw,
} from "lucide-react";
import { AttestationGenerator } from "./AttestationGenerator";
import { StudentManagement } from "./StudentManagement";
import jsPDF from "jspdf";
import "jspdf-autotable";
import ofpptLogo from "@/assets/ofppt-logo.png";

interface AttestationRequest {
  id: string;
  first_name: string;
  last_name: string;
  cin: string;
  phone: string;
  student_group: string;
  status: string;
  created_at: string;
  student_id?: string;
  students?: {
    email: string;
  };
}

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

interface AdminDashboardProps {
  adminProfile: string;
  onLogout: () => void;
}

// Définition des groupes par filière pour un meilleur ordre d'affichage
const STUDENT_GROUPS = [
  // DEVOWFS en premier
  "DEVOWFS201",
  "DEVOWFS202",
  "DEVOWFS203",
  "DEVOWFS204",
  // IDOSR en deuxième
  "IDOSR201",
  "IDOSR202",
  "IDOSR203",
  "IDOSR204",
  // DEV en troisième
  "DEV101",
  "DEV102",
  "DEV103",
  "DEV104",
  "DEV105",
  "DEV106",
  "DEV107",
  // ID en dernier
  "D101",
  "ID102",
  "ID103",
  "ID104",
];

const AdminDashboard = ({ adminProfile, onLogout }: AdminDashboardProps) => {
  const [requests, setRequests] = useState<AttestationRequest[]>([]);
  const [filteredRequests, setFilteredRequests] = useState<
    AttestationRequest[]
  >([]);
  const [selectedGroup, setSelectedGroup] = useState<string>("all");
  const [selectedStatus, setSelectedStatus] = useState<string>("all");
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [dateFilter, setDateFilter] = useState<string>("");
  const [hourFilter, setHourFilter] = useState<string>("all");
  const [loading, setLoading] = useState(true);
  const [showAttestation, setShowAttestation] = useState<{
    student: Student;
    request: AttestationRequest;
  } | null>(null);
  const [counterValue, setCounterValue] = useState<number>(0); // Add this state for counter value
  const { toast } = useToast();

  useEffect(() => {
    fetchRequests();
  }, []);

  useEffect(() => {
    let filtered = [...requests];

    // Filtre par groupe
    if (selectedGroup !== "all") {
      filtered = filtered.filter((req) => req.student_group === selectedGroup);
    }

    // Filtre par statut
    if (selectedStatus !== "all") {
      filtered = filtered.filter((req) => req.status === selectedStatus);
    }

    // Filtre par recherche (nom, prénom, CIN)
    if (searchTerm.trim()) {
      const searchLower = searchTerm.toLowerCase();
      filtered = filtered.filter(
        (req) =>
          req.first_name.toLowerCase().includes(searchLower) ||
          req.last_name.toLowerCase().includes(searchLower) ||
          req.cin.toLowerCase().includes(searchLower)
      );
    }

    // Filtre par date
    if (dateFilter) {
      const filterDate = new Date(dateFilter);
      filtered = filtered.filter((request) => {
        const requestDate = new Date(request.created_at);
        return requestDate.toDateString() === filterDate.toDateString();
      });
    }

    // Filtre par heure
    if (hourFilter !== "all") {
      filtered = filtered.filter((request) => {
        const requestDate = new Date(request.created_at);
        const hour = requestDate.getHours();

        switch (hourFilter) {
          case "morning":
            return hour >= 6 && hour < 12;
          case "afternoon":
            return hour >= 12 && hour < 18;
          case "evening":
            return hour >= 18 && hour < 24;
          case "night":
            return hour >= 0 && hour < 6;
          default:
            return true;
        }
      });
    }

    setFilteredRequests(filtered);
  }, [
    requests,
    selectedGroup,
    selectedStatus,
    searchTerm,
    dateFilter,
    hourFilter,
  ]);

  const fetchRequests = async () => {
    try {
      const { data, error } = await supabase
        .from("attestation_requests")
        .select(
          `
          *,
          students!attestation_requests_student_id_fkey (
            email
          )
        `
        )
        .order("created_at", { ascending: true });

      if (error) throw error;
      setRequests(data || []);

      // Fetch the current counter value
      const { data: counterData, error: counterError } = await supabase
        .from("attestation_counter")
        .select("counter")
        .single();

      if (!counterError && counterData) {
        setCounterValue(counterData.counter);
      }
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Impossible de charger les demandes.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const getStudentRequestCount = (
    studentId: string | undefined,
    year: number
  ) => {
    if (!studentId) return 0;
    return requests.filter(
      (req) =>
        req.student_id === studentId &&
        new Date(req.created_at).getFullYear() === year
    ).length;
  };

  const updateStatus = async (
    id: string,
    newStatus: string,
    rejectionReason?: string
  ) => {
    try {
      const { error } = await supabase
        .from("attestation_requests")
        .update({
          status: newStatus,
          ...(rejectionReason && { rejection_reason: rejectionReason }),
        })
        .eq("id", id);

      if (error) throw error;

      // Envoyer un email de notification
      try {
        const { error: emailError } = await supabase.functions.invoke(
          "send-notification",
          {
            body: {
              requestId: id,
              status: newStatus,
              rejectionReason,
            },
          }
        );

        if (emailError) {
          console.error("Error sending email:", emailError);
          toast({
            title: "Statut mis à jour",
            description:
              "Le statut a été mis à jour mais l'email de notification n'a pas pu être envoyé.",
            variant: "destructive",
          });
        } else {
          toast({
            title:
              newStatus === "approved"
                ? "Demande approuvée"
                : "Demande rejetée",
            description: "L'étudiant a été notifié par email.",
          });
        }
      } catch (emailError) {
        console.error("Error sending notification email:", emailError);
        toast({
          title: "Statut mis à jour",
          description:
            "Le statut a été mis à jour mais l'email de notification n'a pas pu être envoyé.",
          variant: "destructive",
        });
      }

      await fetchRequests();
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Impossible de mettre à jour le statut.",
        variant: "destructive",
      });
    }
  };

  const deleteRequest = async (id: string) => {
    try {
      const { error } = await supabase
        .from("attestation_requests")
        .delete()
        .eq("id", id);

      if (error) throw error;

      setRequests((prev) => prev.filter((req) => req.id !== id));

      toast({
        title: "Demande supprimée",
        description: "La demande a été supprimée avec succès.",
      });
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Impossible de supprimer la demande.",
        variant: "destructive",
      });
    }
  };

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case "pending":
        return "outline";
      case "approved":
        return "default";
      case "rejected":
        return "destructive";
      default:
        return "secondary";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "pending":
        return <Clock className="h-3 w-3" />;
      case "approved":
        return <Check className="h-3 w-3" />;
      case "rejected":
        return <X className="h-3 w-3" />;
      default:
        return null;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending":
        return "bg-amber-50 text-amber-700 border-amber-200";
      case "approved":
        return "bg-emerald-50 text-emerald-700 border-emerald-200";
      case "rejected":
        return "bg-red-50 text-red-700 border-red-200";
      default:
        return "bg-slate-50 text-slate-700 border-slate-200";
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "pending":
        return "En attente";
      case "approved":
        return "Approuvé";
      case "rejected":
        return "Rejeté";
      default:
        return status;
    }
  };

  const generateAttestation = async (request: AttestationRequest) => {
    try {
      // Vérifier si student_id existe
      if (!request.student_id) {
        // Chercher l'étudiant par email/CIN comme fallback
        const { data: studentData, error } = await supabase
          .from("students")
          .select("*")
          .eq("cin", request.cin)
          .single();

        if (error) throw error;

        setShowAttestation({
          student: studentData,
          request: request,
        });
      } else {
        // Récupérer les données complètes de l'étudiant par ID
        const { data: studentData, error } = await supabase
          .from("students")
          .select("*")
          .eq("id", request.student_id)
          .single();

        if (error) throw error;

        setShowAttestation({
          student: studentData,
          request: request,
        });
      }
    } catch (error) {
      console.error("Error loading student data:", error);
      toast({
        title: "Erreur",
        description: "Impossible de charger les données de l'étudiant.",
        variant: "destructive",
      });
    }
  };

  const handlePrintAttestation = () => {
    window.print();
  };

  const getFiliere = (group: string) => {
    if (group.startsWith("DEVOWFS")) return "DEVOWFS";
    if (group.startsWith("IDOSR")) return "IDOSR";
    if (group.startsWith("DEV")) return "DEV";
    if (group.startsWith("ID")) return "ID";
    return "Autre";
  };

  // Function to export student list to PDF organized by group
  const exportStudentsToPDF = async () => {
    try {
      // Dynamically import jsPDF only when needed
      const { default: jsPDF } = await import("jspdf");
      const { default: autoTable } = await import("jspdf-autotable");

      const doc = new jsPDF({
        orientation: "portrait",
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
      (doc as any).text("OFPPT - ISFO", 105, 35, { align: "center" });

      // Add full institution name
      (doc as any).setFontSize(14);
      (doc as any).setTextColor(0, 0, 0); // Black color
      (doc as any).setFont(undefined, "normal");
      (doc as any).text(
        "Office de la Formation Professionnelle et de la Promotion du Travail",
        105,
        45,
        { align: "center" }
      );
      (doc as any).text(
        "Institut Spécialisé de Formation de l'Offshoring Casablanca",
        105,
        52,
        { align: "center" }
      );

      // Add report title
      (doc as any).setFontSize(16);
      (doc as any).setTextColor(0, 0, 0); // Black color
      (doc as any).setFont(undefined, "bold");
      (doc as any).text("Liste des Étudiants par Groupe", 105, 62, {
        align: "center",
      });

      // Add generation date
      (doc as any).setFontSize(12);
      (doc as any).setTextColor(0, 0, 0); // Black color
      (doc as any).setFont(undefined, "normal");
      (doc as any).text(
        `Généré le: ${new Date().toLocaleDateString("fr-FR")}`,
        20,
        70
      );

      let yOffset = 80;

      // Process each group with requests
      STUDENT_GROUPS.forEach((group) => {
        const groupRequests = filteredRequests.filter(
          (req) => req.student_group === group
        );

        if (groupRequests.length === 0) return;

        // Add group title
        (doc as any).setFontSize(16);
        (doc as any).setTextColor(29, 78, 216); // Blue color
        (doc as any).setFont(undefined, "bold");
        (doc as any).text(`Groupe: ${group}`, 20, yOffset);

        // Add count
        // (doc as any).setFontSize(12);
        // (doc as any).setTextColor(0, 0, 0); // Black color
        // (doc as any).setFont(undefined, 'normal');
        // (doc as any).text(`Nombre d'étudiants: ${groupRequests.length}`, 20, yOffset + 7);
        yOffset += 7;

        // Prepare table data
        const tableData = groupRequests.map((request) => [
          `${request.last_name} ${request.first_name}`,
          request.cin,
          request.students?.email || "N/A",
          getStatusLabel(request.status),
          new Date(request.created_at).toLocaleDateString("fr-FR"),
        ]);

        // Add table
        autoTable(doc as any, {
          head: [["Nom Prénom", "CIN", "Email", "Statut", "Date"]],
          body: tableData,
          startY: yOffset,
          styles: { fontSize: 10 },
          headStyles: { fillColor: [59, 130, 246] }, // Blue color
          alternateRowStyles: { fillColor: [240, 248, 255] }, // Light blue
          margin: { left: 20, right: 20 },
        });

        // Update Y position for next group
        // Use a try-catch block to handle the dynamic property access
        try {
          // We need to use a more generic approach to avoid TypeScript errors
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const jsDocWithAutoTable = doc as any;
          if (
            jsDocWithAutoTable.lastAutoTable &&
            typeof jsDocWithAutoTable.lastAutoTable.finalY === "number"
          ) {
            yOffset = jsDocWithAutoTable.lastAutoTable.finalY + 15;
          } else {
            yOffset += 15 + groupRequests.length * 7; // Default spacing if we can't get the finalY
          }
        } catch (error) {
          yOffset += 15 + groupRequests.length * 7; // Default spacing if there's any error
        }

        // Add page break if needed
        const pageHeight = (doc as any).internal.pageSize.height;
        const marginBottom = 20;
        if (yOffset > pageHeight - marginBottom) {
          (doc as any).addPage();
          yOffset = 20;
        }
      });

      // Save the PDF
      (doc as any).save(
        `liste_etudiants_${new Date().toISOString().split("T")[0]}.pdf`
      );
    } catch (error) {
      toast({
        title: "Erreur d'export",
        description: "Impossible de générer le PDF. Veuillez réessayer.",
        variant: "destructive",
      });
    }
  };

  const groupStats = STUDENT_GROUPS.map((group) => ({
    group,
    count: requests.filter((req) => req.student_group === group).length,
    filiere: getFiliere(group),
  })).filter((stat) => stat.count > 0);

  const filiereStats = ["DEVOWFS", "IDOSR", "DEV", "ID"].map((filiere) => {
    const filiereRequests = requests.filter(
      (r) => getFiliere(r.student_group) === filiere
    );
    const approvedRequests = filiereRequests.filter(
      (r) => r.status === "approved"
    );
    return {
      filiere,
      total: filiereRequests.length,
      approved: approvedRequests.length,
      approvalRate:
        filiereRequests.length > 0
          ? Math.round((approvedRequests.length / filiereRequests.length) * 100)
          : 0,
    };
  });

  // Add state for student management page
  const [showStudentManagement, setShowStudentManagement] = useState(false);

  // Add function to reset the attestation counter
  const resetAttestationCounter = async () => {
    try {
      // Since we're not using Supabase Auth, we need to bypass the is_admin check
      // by directly updating the counter table instead of using the RPC function
      const { data, error } = await supabase
        .from("attestation_counter")
        .update({
          counter: 0,
          last_reset_date: new Date().toISOString(),
          last_reset_by: adminProfile,
          updated_at: new Date().toISOString(),
        })
        .eq("id", 1);

      // If update failed because no row exists, insert a new row
      if (error && error.message.includes("no rows")) {
        const { data: insertData, error: insertError } = await supabase
          .from("attestation_counter")
          .insert({
            id: 1,
            counter: 0,
            last_reset_date: new Date().toISOString(),
            last_reset_by: adminProfile,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          });

        if (insertError) throw insertError;
      } else if (error) {
        throw error;
      }

      toast({
        title: "Succès",
        description: "Le compteur d'attestations a été réinitialisé à 0.",
      });

      // Update the counter value state
      setCounterValue(0);

      // Refresh the requests to update any related data
      fetchRequests();
    } catch (error) {
      console.error("Reset counter error:", error);
      toast({
        title: "Erreur",
        description: "Impossible de réinitialiser le compteur d'attestations.",
        variant: "destructive",
      });
    }
  };

  if (showStudentManagement) {
    return (
      <StudentManagement
        onBack={() => setShowStudentManagement(false)}
        onLogout={onLogout}
      />
    );
  }

  if (showAttestation) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
        <div className="p-4">
          <Button
            onClick={() => setShowAttestation(null)}
            variant="outline"
            className="mb-4 print:hidden"
          >
            ← Retour au tableau de bord
          </Button>
          <AttestationGenerator
            attestationData={{
              student: showAttestation.student,
              request: showAttestation.request,
            }}
            onPrint={handlePrintAttestation}
          />
        </div>
      </div>
    );
  }

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
                <UserCog className="h-8 w-8 text-white" />
              </div>
              <div className="ml-4">
                <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-700 to-indigo-700 bg-clip-text text-transparent">
                  Tableau de Bord Administrateur
                </h1>
                <p className="text-sm text-slate-600 font-medium">
                  Connecté en tant que:{" "}
                  <span className="text-blue-700">{adminProfile}</span>
                </p>
              </div>
            </div>
            <Button
              onClick={onLogout}
              variant="outline"
              className="flex items-center gap-2 bg-white/80 hover:bg-red-50 border-red-200 text-red-700 hover:text-red-800 transition-all duration-200"
            >
              <LogOut className="h-4 w-4" />
              Déconnexion
            </Button>
          </div>
        </div>
      </div>

      {/* Navigation Bar */}
      <div className="bg-white/90 backdrop-blur-sm border-b border-slate-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex space-x-8">
            <button
              onClick={() => {
                setShowStudentManagement(false);
              }}
              className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors duration-200 ${
                !showStudentManagement
                  ? "border-blue-500 text-blue-600"
                  : "border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300"
              }`}
            >
              <div className="flex items-center gap-2">
                <FileText className="h-4 w-4" />
                Gestion des Demandes
              </div>
            </button>
            <button
              onClick={() => {
                setShowStudentManagement(true);
              }}
              className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors duration-200 ${
                showStudentManagement
                  ? "border-blue-500 text-blue-600"
                  : "border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300"
              }`}
            >
              <div className="flex items-center gap-2">
                <User className="h-4 w-4" />
                Gestion des Étudiants
              </div>
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Statistics Overview */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-8">
          <Card className="bg-gradient-to-br from-blue-500 to-blue-600 text-white border-0 shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-105">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-blue-100">
                Total des demandes
              </CardTitle>
              <Users className="h-5 w-5 text-blue-200" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{requests.length}</div>
              <p className="text-xs text-blue-100 mt-1">
                +
                {
                  requests.filter(
                    (r) =>
                      new Date(r.created_at) >
                      new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
                  ).length
                }{" "}
                cette semaine
              </p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-amber-500 to-orange-500 text-white border-0 shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-105">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-amber-100">
                En attente
              </CardTitle>
              <Clock className="h-5 w-5 text-amber-200" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">
                {requests.filter((r) => r.status === "pending").length}
              </div>
              <p className="text-xs text-amber-100 mt-1">
                Nécessitent une action
              </p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-emerald-500 to-green-600 text-white border-0 shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-105">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-emerald-100">
                Approuvées
              </CardTitle>
              <Check className="h-5 w-5 text-emerald-200" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">
                {requests.filter((r) => r.status === "approved").length}
              </div>
              <p className="text-xs text-emerald-100 mt-1">
                {requests.length > 0
                  ? Math.round(
                      (requests.filter((r) => r.status === "approved").length /
                        requests.length) *
                        100
                    )
                  : 0}
                % du total
              </p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-red-500 to-rose-600 text-white border-0 shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-105">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-red-100">
                Rejetées
              </CardTitle>
              <X className="h-5 w-5 text-red-200" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">
                {requests.filter((r) => r.status === "rejected").length}
              </div>
              <p className="text-xs text-red-100 mt-1">
                {requests.length > 0
                  ? Math.round(
                      (requests.filter((r) => r.status === "rejected").length /
                        requests.length) *
                        100
                    )
                  : 0}
                % du total
              </p>
            </CardContent>
          </Card>

          {/* Add Reset Counter Card */}
          <Card className="bg-gradient-to-br from-purple-500 to-indigo-600 text-white border-0 shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-105">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-purple-100">
                Réinitialiser Compteur
              </CardTitle>
              <RotateCcw className="h-5 w-5 text-purple-200" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold mb-2 text-center">
                {counterValue}
              </div>
              <Button
                onClick={resetAttestationCounter}
                className="w-full bg-white text-purple-600 hover:bg-purple-50 font-bold py-2 px-4 rounded-lg flex items-center justify-center gap-2 transition-all duration-200"
              >
                <RotateCcw className="h-4 w-4" />
                Réinitialiser
              </Button>
              <p className="text-xs text-purple-100 mt-2 text-center">
                Remettre le compteur à zéro
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Program Statistics */}
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-4 gap-6 mb-8">
          {filiereStats.map((stat, index) => (
            <Card
              key={stat.filiere}
              className="bg-white/80 backdrop-blur-sm border-slate-200 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105"
            >
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <div
                    className={`p-2 rounded-lg ${
                      index === 0
                        ? "bg-purple-100 text-purple-600"
                        : index === 1
                        ? "bg-teal-100 text-teal-600"
                        : index === 2
                        ? "bg-orange-100 text-orange-600"
                        : "bg-pink-100 text-pink-600"
                    }`}
                  >
                    <GraduationCap className="h-4 w-4" />
                  </div>
                  {stat.filiere}
                </CardTitle>
                <Badge
                  variant="secondary"
                  className="bg-slate-100 text-slate-700 font-medium"
                >
                  {stat.total}
                </Badge>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-slate-600">Approuvées:</span>
                    <span className="font-bold text-emerald-600">
                      {stat.approved}
                    </span>
                  </div>
                  <div className="w-full bg-slate-200 rounded-full h-2.5">
                    <div
                      className="bg-gradient-to-r from-emerald-400 to-emerald-600 h-2.5 rounded-full transition-all duration-500 ease-out"
                      style={{
                        width: `${
                          stat.total > 0
                            ? (stat.approved / stat.total) * 100
                            : 0
                        }%`,
                      }}
                    ></div>
                  </div>
                  <p className="text-xs text-slate-600 font-medium">
                    Taux d'approbation:{" "}
                    <span className="text-emerald-600 font-bold">
                      {stat.approvalRate}%
                    </span>
                  </p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Filters and Actions */}
        <Card className="mb-8 bg-white/80 backdrop-blur-sm border-slate-200 shadow-lg">
          <CardHeader className="bg-gradient-to-r from-slate-50 to-blue-50 rounded-t-lg">
            <CardTitle className="flex items-center gap-2 text-slate-700">
              <div className="p-2 bg-blue-100 rounded-lg">
                <FilterIcon className="h-5 w-5 text-blue-600" />
              </div>
              Filtres et Actions
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4 mb-4">
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
                  htmlFor="status"
                  className="text-sm font-medium text-slate-700"
                >
                  Statut
                </Label>
                <Select
                  value={selectedStatus}
                  onValueChange={setSelectedStatus}
                >
                  <SelectTrigger className="bg-white border-slate-200 hover:border-blue-300 transition-colors">
                    <SelectValue placeholder="Tous les statuts" />
                  </SelectTrigger>
                  <SelectContent className="bg-white border shadow-xl z-50 rounded-lg">
                    <SelectItem value="all">Tous les statuts</SelectItem>
                    <SelectItem value="pending">En attente</SelectItem>
                    <SelectItem value="approved">Approuvé</SelectItem>
                    <SelectItem value="rejected">Rejeté</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label
                  htmlFor="date"
                  className="text-sm font-medium text-slate-700"
                >
                  Date
                </Label>
                <Input
                  type="date"
                  value={dateFilter}
                  onChange={(e) => setDateFilter(e.target.value)}
                  className="bg-white border-slate-200 hover:border-blue-300 transition-colors"
                />
              </div>

              <div className="space-y-2">
                <Label
                  htmlFor="hour"
                  className="text-sm font-medium text-slate-700"
                >
                  Période
                </Label>
                <Select value={hourFilter} onValueChange={setHourFilter}>
                  <SelectTrigger className="bg-white border-slate-200 hover:border-blue-300 transition-colors">
                    <SelectValue placeholder="Toute la journée" />
                  </SelectTrigger>
                  <SelectContent className="bg-white border shadow-xl z-50 rounded-lg">
                    <SelectItem value="all">Toute la journée</SelectItem>
                    <SelectItem value="morning">Matin (6h-12h)</SelectItem>
                    <SelectItem value="afternoon">
                      Après-midi (12h-18h)
                    </SelectItem>
                    <SelectItem value="evening">Soir (18h-24h)</SelectItem>
                    <SelectItem value="night">Nuit (0h-6h)</SelectItem>
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
                    placeholder="Nom, prénom, CIN..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 bg-white border-slate-200 hover:border-blue-300 transition-colors"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-sm font-medium text-slate-700">
                  Actions
                </Label>
                <div className="flex flex-col sm:flex-row gap-2">
                  <Button
                    onClick={exportStudentsToPDF}
                    variant="outline"
                    className="bg-blue-50 border-blue-200 text-blue-700 hover:bg-blue-100 shadow-sm hover:shadow-md transition-all duration-200 h-8 w-8 p-0 sm:h-9 sm:w-auto sm:px-3"
                  >
                    <Download className="h-3 w-3 sm:h-4 sm:w-4" />
                    <span className="hidden sm:ml-2 sm:inline">
                      Télécharger Liste
                    </span>
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Requests Table */}
        <Card className="bg-white/80 backdrop-blur-sm border-slate-200 shadow-lg">
          <CardHeader className="bg-gradient-to-r from-slate-50 to-blue-50 rounded-t-lg">
            <CardTitle className="flex items-center gap-2 text-slate-700">
              <div className="p-2 bg-blue-100 rounded-lg">
                <FileText className="h-5 w-5 text-blue-600" />
              </div>
              Demandes d'attestation ({filteredRequests.length})
            </CardTitle>
            <CardDescription className="text-slate-600">
              Gérez les demandes d'attestation de scolarité par groupe
              d'étudiants
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="space-y-8">
              {STUDENT_GROUPS.map((group) => {
                const groupRequests = filteredRequests.filter(
                  (req) => req.student_group === group
                );

                if (groupRequests.length === 0) return null;

                return (
                  <div
                    key={group}
                    className="border-2 border-slate-200 rounded-xl p-6 bg-gradient-to-br from-white to-slate-50 shadow-sm hover:shadow-md transition-all duration-300"
                  >
                    <div className="flex items-center justify-between mb-6">
                      <h3 className="text-xl font-bold text-slate-800 flex items-center gap-3">
                        <div className="p-2 bg-blue-100 rounded-lg">
                          <GraduationCap className="h-6 w-6 text-blue-600" />
                        </div>
                        Groupe {group}
                        <Badge
                          variant="secondary"
                          className="ml-2 bg-blue-100 text-blue-800 font-bold text-sm px-3 py-1"
                        >
                          {groupRequests.length} demande
                          {groupRequests.length > 1 ? "s" : ""}
                        </Badge>
                      </h3>
                      <Badge
                        variant="outline"
                        className="bg-slate-100 text-slate-700 border-slate-300 font-medium px-3 py-1"
                      >
                        {getFiliere(group)}
                      </Badge>
                    </div>

                    <div className="bg-white rounded-xl shadow-sm overflow-hidden border border-slate-200">
                      <div className="overflow-x-auto">
                        <Table>
                          <TableHeader>
                            <TableRow className="bg-gradient-to-r from-slate-50 to-blue-50 hover:bg-slate-50">
                              <TableHead className="font-semibold text-slate-700 min-w-[120px]">
                                Étudiant
                              </TableHead>
                              <TableHead className="font-semibold text-slate-700 min-w-[80px]">
                                CIN
                              </TableHead>
                              <TableHead className="font-semibold text-slate-700 min-w-[200px] hidden sm:table-cell">
                                Email
                              </TableHead>
                              <TableHead className="font-semibold text-slate-700 min-w-[100px]">
                                Statut
                              </TableHead>
                              <TableHead className="font-semibold text-slate-700 min-w-[80px] hidden md:table-cell">
                                Date
                              </TableHead>
                              <TableHead className="font-semibold text-slate-700 min-w-[120px]">
                                Demandes/an
                              </TableHead>
                              <TableHead className="font-semibold text-slate-700 min-w-[120px]">
                                Actions
                              </TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {groupRequests.map((request) => (
                              <TableRow
                                key={request.id}
                                className="hover:bg-blue-50/50 transition-colors duration-200"
                              >
                                <TableCell className="font-medium text-slate-800">
                                  {request.first_name} {request.last_name}
                                </TableCell>
                                <TableCell className="text-slate-600">
                                  {request.cin}
                                </TableCell>
                                <TableCell className="text-slate-600 hidden sm:table-cell">
                                  {request.students?.email || "N/A"}
                                </TableCell>
                                <TableCell>
                                  <div
                                    className={`inline-flex items-center gap-2 px-33 py-1 rounded-full border text-xs font-medium ${getStatusColor(
                                      request.status
                                    )}`}
                                  >
                                    {getStatusIcon(request.status)}
                                    {getStatusLabel(request.status)}
                                  </div>
                                </TableCell>
                                <TableCell className="text-slate-600 hidden md:table-cell">
                                  {new Date(
                                    request.created_at
                                  ).toLocaleDateString("fr-FR")}
                                </TableCell>
                                <TableCell>
                                  <div className="flex items-center gap-1 text-sm">
                                    <Badge
                                      variant="secondary"
                                      className="text-xs"
                                    >
                                      {new Date(
                                        request.created_at
                                      ).getFullYear()}
                                      :{" "}
                                      {getStudentRequestCount(
                                        request.student_id,
                                        new Date(
                                          request.created_at
                                        ).getFullYear()
                                      )}
                                    </Badge>
                                  </div>
                                </TableCell>
                                <TableCell>
                                  <div className="flex items-center gap-1 sm:gap-2">
                                    {/* Always show approve and reject buttons for flexibility */}
                                    <Button
                                      onClick={() =>
                                        updateStatus(request.id, "approved")
                                      }
                                      size="sm"
                                      className="bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm hover:shadow-md transition-all duration-200 h-8 w-8 p-0 sm:h-9 sm:w-auto sm:px-3"
                                      disabled={request.status === "approved"}
                                    >
                                      <Check className="h-3 w-3 sm:h-4 sm:w-4" />
                                      <span className="hidden sm:ml-2 sm:inline">
                                        Approuver
                                      </span>
                                    </Button>
                                    <Button
                                      onClick={() => {
                                        const reason = prompt(
                                          "Raison du rejet (optionnel):"
                                        );
                                        updateStatus(
                                          request.id,
                                          "rejected",
                                          reason || undefined
                                        );
                                      }}
                                      size="sm"
                                      variant="destructive"
                                      className="shadow-sm hover:shadow-md transition-all duration-200 h-8 w-8 p-0 sm:h-9 sm:w-auto sm:px-3"
                                      disabled={request.status === "rejected"}
                                    >
                                      <X className="h-3 w-3 sm:h-4 sm:w-4" />
                                      <span className="hidden sm:ml-2 sm:inline">
                                        Rejeter
                                      </span>
                                    </Button>
                                    {request.status === "approved" && (
                                      <Button
                                        onClick={() =>
                                          generateAttestation(request)
                                        }
                                        size="sm"
                                        variant="outline"
                                        className="bg-blue-50 border-blue-200 text-blue-700 hover:bg-blue-100 shadow-sm hover:shadow-md transition-all duration-200 h-8 w-8 p-0 sm:h-9 sm:w-auto sm:px-3"
                                      >
                                        <Eye className="h-33 w-3 sm:h-4 sm:w-4" />
                                        <span className="hidden sm:ml-2 sm:inline">
                                          Voir
                                        </span>
                                      </Button>
                                    )}
                                    <Button
                                      onClick={() => deleteRequest(request.id)}
                                      size="sm"
                                      variant="outline"
                                      className="text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200 shadow-sm hover:shadow-md transition-all duration-200 h-8 w-8 p-0 sm:h-9 sm:w-auto sm:px-3"
                                    >
                                      <Trash2 className="h-3 w-3 sm:h-4 sm:w-4" />
                                      <span className="hidden sm:ml-2 sm:inline">
                                        Supprimer
                                      </span>
                                    </Button>
                                  </div>
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </div>
                    </div>
                  </div>
                );
              })}

              {filteredRequests.length === 0 && (
                <div className="text-center py-16">
                  <div className="p-4 bg-slate-100 rounded-full w-24 h-24 mx-auto mb-6 flex items-center justify-center">
                    <AlertCircle className="h-12 w-12 text-slate-400" />
                  </div>
                  <h3 className="text-xl font-bold text-slate-700 mb-2">
                    Aucune demande trouvée
                  </h3>
                  <p className="text-slate-500 max-w-md mx-auto">
                    Aucune demande ne correspond aux filtres sélectionnés.
                    Essayez de modifier vos critères de recherche.
                  </p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AdminDashboard;
