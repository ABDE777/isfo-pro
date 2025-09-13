import { useState, useEffect } from "react";
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
} from "lucide-react";

interface AttestationRequest {
  id: string;
  first_name: string;
  last_name: string;
  cin: string;
  phone: string;
  student_group: string;
  status: string;
  created_at: string;
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
  const [loading, setLoading] = useState(true);
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

    setFilteredRequests(filtered);
  }, [requests, selectedGroup, selectedStatus, searchTerm]);

  const fetchRequests = async () => {
    try {
      const { data, error } = await supabase
        .from("attestation_requests")
        .select("*")
        .order("created_at", { ascending: true });

      if (error) throw error;
      setRequests(data || []);
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

  const updateStatus = async (id: string, newStatus: string) => {
    try {
      const { error } = await supabase
        .from("attestation_requests")
        .update({ status: newStatus })
        .eq("id", id);

      if (error) throw error;

      setRequests((prev) =>
        prev.map((req) => (req.id === id ? { ...req, status: newStatus } : req))
      );

      toast({
        title: "Statut mis à jour",
        description: `Le statut a été changé vers "${newStatus}".`,
      });
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

  const exportToPDF = () => {
    // Grouper les demandes par groupe
    const groupedRequests = STUDENT_GROUPS.reduce((acc, group) => {
      const requests = filteredRequests.filter(
        (req) => req.student_group === group
      );
      if (requests.length > 0) {
        acc[group] = requests;
      }
      return acc;
    }, {} as Record<string, AttestationRequest[]>);

    // Importer jsPDF
    import("jspdf").then(async ({ default: JsPDF }) => {
      const { default: autoTable } = await import("jspdf-autotable");

      // Créer un nouveau document PDF
      const doc = new JsPDF({
        orientation: "landscape",
        unit: "mm",
        format: "a4",
      });

      // Ajouter le titre principal
      doc.setFont("helvetica", "bold");
      doc.setFontSize(16);
      doc.text("Liste des demandes d'attestation par groupe", 15, 15);

      // Ajouter la date d'export
      doc.setFont("helvetica", "normal");
      doc.setFontSize(10);
      doc.text(`Exporté le ${new Date().toLocaleDateString("fr-FR")}`, 15, 22);

      const columns = [
        "Prénom",
        "Nom",
        "CIN",
        "Téléphone",
        "Statut",
        "Date de création",
      ];

      let startY = 30;

      // Pour chaque groupe, créer une section dans le PDF
      Object.entries(groupedRequests).forEach(([group, requests], index) => {
        // Ajouter un en-tête de groupe
        if (index > 0) {
          startY = (doc as any).lastAutoTable.finalY + 10;
        }

        doc.setFont("helvetica", "bold");
        doc.setFontSize(12);
        doc.text(
          `Groupe ${group} (${requests.length} étudiant${
            requests.length > 1 ? "s" : ""
          })`,
          15,
          startY
        );

        const tableData = requests.map((req) => [
          req.first_name,
          req.last_name,
          req.cin,
          req.phone,
          getStatusLabel(req.status),
          new Date(req.created_at).toLocaleDateString("fr-FR"),
        ]);

        autoTable(doc, {
          startY: startY + 5,
          head: [columns],
          body: tableData,
          theme: "grid",
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
      });

      // Sauvegarder le PDF
      doc.save(
        `attestation_requests_par_groupe_${
          new Date().toISOString().split("T")[0]
        }.pdf`
      );

      toast({
        title: "Export réussi",
        description: `${filteredRequests.length} demandes exportées en PDF, groupées par classe.`,
      });
    });
  };

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case "pending":
        return "secondary";
      case "approved":
        return "default";
      case "rejected":
        return "destructive";
      default:
        return "secondary";
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

  const getFiliere = (group: string) => {
    if (group.startsWith("DEVOWFS")) return "DEVOWFS";
    if (group.startsWith("IDOSR")) return "IDOSR";
    if (group.startsWith("DEV")) return "DEV";
    if (group.startsWith("ID")) return "ID";
    return "Autre";
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

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-academic-light to-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Chargement du dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-academic-light to-white">
      <div className="container mx-auto px-2 sm:px-4 py-4 sm:py-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 sm:gap-0 mb-8">
          <div className="flex items-center space-x-4">
            <div className="w-10 sm:w-12 h-10 sm:h-12 rounded-full bg-gradient-primary flex items-center justify-center">
              <UserCog className="w-5 sm:w-6 h-5 sm:h-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-academic-navy">
                Dashboard Admin
              </h1>
              <p className="text-sm sm:text-base text-muted-foreground">
                Connecté en tant que{" "}
                <span className="font-semibold text-primary">
                  {adminProfile}
                </span>
              </p>
            </div>
          </div>
          <Button
            onClick={onLogout}
            variant="outline"
            className="gap-2 w-full sm:w-auto"
          >
            <LogOut className="w-4 h-4" />
            Déconnexion
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-8">
          <Card className="shadow-elegant border-0 bg-gradient-to-br from-academic-light/50 to-white">
            <CardHeader className="p-3 flex flex-row items-center justify-between space-y-0">
              <CardTitle className="text-sm font-semibold text-academic-navy flex flex-col">
                <span className="flex items-center gap-2">
                  <Users className="w-3.5 h-3.5 text-primary" />
                  Total Demandes
                </span>
                <span className="text-2xl font-bold text-primary mt-1">
                  {requests.length}
                </span>
              </CardTitle>
              <div className="text-xs text-muted-foreground">
                {groupStats.length} groupes
              </div>
            </CardHeader>
          </Card>

          <Card className="shadow-elegant border-0 bg-gradient-to-br from-amber-50 to-white">
            <CardHeader className="p-3 flex flex-row items-center justify-between space-y-0">
              <CardTitle className="text-sm font-semibold text-academic-navy flex flex-col">
                <span className="flex items-center gap-2">
                  <Clock className="w-3.5 h-3.5 text-academic-gold" />
                  En Attente
                </span>
                <span className="text-2xl font-bold text-academic-gold mt-1">
                  {requests.filter((r) => r.status === "pending").length}
                </span>
              </CardTitle>
              <div className="text-xs text-muted-foreground">à traiter</div>
            </CardHeader>
          </Card>

          <Card className="shadow-elegant border-0 bg-gradient-to-br from-green-50 to-white">
            <CardHeader className="p-3 flex flex-row items-center justify-between space-y-0">
              <CardTitle className="text-sm font-semibold text-academic-navy flex flex-col">
                <span className="flex items-center gap-2">
                  <Check className="w-3.5 h-3.5 text-green-600" />
                  Approuvées
                </span>
                <span className="text-2xl font-bold text-green-600 mt-1">
                  {requests.filter((r) => r.status === "approved").length}
                </span>
              </CardTitle>
              <div className="text-xs text-muted-foreground">validées</div>
            </CardHeader>
          </Card>

          <Card className="shadow-elegant border-0 bg-gradient-to-br from-violet-50 to-white">
            <CardHeader className="p-3 flex flex-row items-center justify-between space-y-0">
              <CardTitle className="text-sm font-semibold text-academic-navy flex flex-col">
                <span className="flex items-center gap-2">
                  <X className="w-3.5 h-3.5 text-red-600" />
                  Rejetées
                </span>
                <span className="text-2xl font-bold text-red-600 mt-1">
                  {requests.filter((r) => r.status === "rejected").length}
                </span>
              </CardTitle>
              <div className="text-xs text-muted-foreground">refusées</div>
            </CardHeader>
          </Card>
        </div>

        {/* Statistiques par filière */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-8">
          {filiereStats.map((stat) => (
            <Card
              key={stat.filiere}
              className="shadow-elegant border-0 bg-gradient-to-br from-academic-light/50 to-white"
            >
              <CardHeader className="p-3">
                <CardTitle className="text-sm font-semibold text-academic-navy flex flex-col">
                  <span className="flex items-center gap-2">
                    <School className="w-3.5 h-3.5 text-academic-navy" />
                    Filière {stat.filiere}
                  </span>
                  <div className="mt-2 space-y-1">
                    <div className="flex justify-between items-center">
                      <span className="text-xs text-muted-foreground">
                        Total demandes:
                      </span>
                      <span className="font-bold text-academic-navy">
                        {stat.total}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-xs text-muted-foreground">
                        Approuvées:
                      </span>
                      <span className="font-bold text-green-600">
                        {stat.approved}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-xs text-muted-foreground">
                        Taux:
                      </span>
                      <div className="flex items-center gap-1">
                        <Target className="w-3 h-3 text-academic-purple" />
                        <span className="font-bold text-academic-purple">
                          {stat.approvalRate}%
                        </span>
                      </div>
                    </div>
                  </div>
                </CardTitle>
              </CardHeader>
            </Card>
          ))}
        </div>

        {/* Filters and Export */}
        <Card className="shadow-elegant border-0 mb-6">
          <CardHeader className="p-4 sm:p-6">
            <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
              <Filter className="w-4 sm:w-5 h-4 sm:h-5" />
              Filtres et Actions
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 sm:p-6">
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {/* Filtre par groupe */}
                <div>
                  <Label htmlFor="groupFilter" className="text-sm sm:text-base">
                    Filtrer par groupe
                  </Label>
                  <Select
                    value={selectedGroup}
                    onValueChange={setSelectedGroup}
                  >
                    <SelectTrigger className="mt-1">
                      <SelectValue placeholder="Tous les groupes" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Tous les groupes</SelectItem>
                      {STUDENT_GROUPS.map((group) => (
                        <SelectItem key={group} value={group}>
                          {group} (
                          {
                            requests.filter((r) => r.student_group === group)
                              .length
                          }
                          )
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Filtre par statut */}
                <div>
                  <Label
                    htmlFor="statusFilter"
                    className="text-sm sm:text-base"
                  >
                    Filtrer par statut
                  </Label>
                  <Select
                    value={selectedStatus}
                    onValueChange={setSelectedStatus}
                  >
                    <SelectTrigger className="mt-1">
                      <SelectValue placeholder="Tous les statuts" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Tous les statuts</SelectItem>
                      <SelectItem value="pending">En attente</SelectItem>
                      <SelectItem value="approved">Approuvé</SelectItem>
                      <SelectItem value="rejected">Rejeté</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex flex-col justify-end">
                  <Button
                    onClick={exportToPDF}
                    disabled={filteredRequests.length === 0}
                    className="bg-academic-gold hover:bg-academic-gold/90 text-white gap-2 w-full sm:w-auto mt-6"
                  >
                    <Download className="w-4 h-4" />
                    Exporter PDF ({filteredRequests.length})
                  </Button>
                </div>
              </div>

              {/* Barre de recherche */}
              <div>
                <Label htmlFor="search" className="text-sm sm:text-base">
                  Rechercher par nom, prénom ou CIN
                </Label>
                <Input
                  id="search"
                  type="text"
                  placeholder="Rechercher..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full mt-1"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Students by Group */}
        <div className="space-y-6">
          {selectedGroup === "all" ? (
            // Show all groups with students
            STUDENT_GROUPS.map((group) => {
              const groupRequests = filteredRequests.filter(
                (req) => req.student_group === group
              );
              if (groupRequests.length === 0) return null;

              return (
                <Card key={group} className="shadow-elegant border-0">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="flex items-center gap-2">
                        <Users className="w-5 h-5" />
                        Groupe {group}
                        <Badge variant="outline" className="ml-2">
                          {groupRequests.length} étudiant(s)
                        </Badge>
                      </CardTitle>
                      <Button
                        onClick={() => {
                          import("jspdf").then(async ({ default: JsPDF }) => {
                            const { default: autoTable } = await import(
                              "jspdf-autotable"
                            );

                            const doc = new JsPDF({
                              orientation: "landscape",
                              unit: "mm",
                              format: "a4",
                            });

                            doc.setFont("helvetica", "bold");
                            doc.setFontSize(16);
                            doc.text(
                              `Demandes d'attestation - Groupe ${group}`,
                              15,
                              15
                            );

                            doc.setFont("helvetica", "normal");
                            doc.setFontSize(10);
                            doc.text(
                              `Exporté le ${new Date().toLocaleDateString(
                                "fr-FR"
                              )}`,
                              15,
                              22
                            );

                            const tableData = groupRequests.map((req) => [
                              req.first_name,
                              req.last_name,
                              req.cin,
                              req.phone,
                              req.student_group,
                              getStatusLabel(req.status),
                              new Date(req.created_at).toLocaleDateString(
                                "fr-FR"
                              ),
                            ]);

                            const columns = [
                              "Prénom",
                              "Nom",
                              "CIN",
                              "Téléphone",
                              "Groupe",
                              "Statut",
                              "Date de création",
                            ];

                            autoTable(doc, {
                              startY: 30,
                              head: [columns],
                              body: tableData,
                              theme: "grid",
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

                            doc.save(
                              `attestation_requests_${group}_${
                                new Date().toISOString().split("T")[0]
                              }.pdf`
                            );

                            toast({
                              title: "Export réussi",
                              description: `${groupRequests.length} demandes exportées pour le groupe ${group}.`,
                            });
                          });
                        }}
                        size="sm"
                        variant="outline"
                        className="gap-2"
                      >
                        <Download className="w-4 h-4" />
                        Exporter PDF
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {groupRequests.map((request) => (
                        <div
                          key={request.id}
                          className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 bg-muted/30 rounded-lg gap-4"
                        >
                          <div className="flex-1 w-full">
                            <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
                              <div className="flex-1">
                                <h4 className="font-semibold text-academic-navy">
                                  {request.first_name} {request.last_name}
                                </h4>
                                <p className="text-sm text-muted-foreground">
                                  CIN: {request.cin} • Tél: {request.phone}
                                </p>
                                <p className="text-xs text-muted-foreground">
                                  {new Date(
                                    request.created_at
                                  ).toLocaleDateString("fr-FR")}
                                </p>
                              </div>
                              <Badge
                                variant={getStatusBadgeVariant(request.status)}
                                className="self-start sm:self-center"
                              >
                                {getStatusLabel(request.status)}
                              </Badge>
                            </div>
                          </div>
                          <div className="flex gap-2">
                            {request.status === "approved" ? (
                              <div className="flex items-center justify-center w-10 h-10 rounded-full bg-green-100 text-green-600">
                                <svg
                                  className="w-6 h-6"
                                  fill="none"
                                  stroke="currentColor"
                                  viewBox="0 0 24 24"
                                >
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth="2"
                                    d="M5 13l4 4L19 7"
                                  ></path>
                                </svg>
                              </div>
                            ) : (
                              <>
                                <Button
                                  size="sm"
                                  onClick={() =>
                                    updateStatus(request.id, "approved")
                                  }
                                  disabled={request.status === "approved"}
                                  className="bg-green-600 hover:bg-green-700 text-white"
                                >
                                  Approuver
                                </Button>
                                <Button
                                  size="sm"
                                  variant="destructive"
                                  onClick={() =>
                                    updateStatus(request.id, "rejected")
                                  }
                                  disabled={request.status === "rejected"}
                                >
                                  Rejeter
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => {
                                    if (
                                      window.confirm(
                                        "Êtes-vous sûr de vouloir supprimer cette demande ? Cette action est irréversible."
                                      )
                                    ) {
                                      deleteRequest(request.id);
                                    }
                                  }}
                                  className="border-red-600 text-red-600 hover:bg-red-600 hover:text-white"
                                >
                                  Supprimer
                                </Button>
                              </>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              );
            })
          ) : (
            // Show selected group only
            <Card className="shadow-elegant border-0">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="w-5 h-5" />
                  Groupe {selectedGroup}
                  <Badge variant="outline" className="ml-2">
                    {filteredRequests.length} étudiant(s)
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                {filteredRequests.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    Aucune demande trouvée pour ce groupe.
                  </div>
                ) : (
                  <div className="space-y-4">
                    {filteredRequests.map((request) => (
                      <div
                        key={request.id}
                        className="flex items-center justify-between p-4 bg-muted/30 rounded-lg"
                      >
                        <div className="flex-1">
                          <div className="flex items-center gap-4">
                            <div>
                              <h4 className="font-semibold text-academic-navy">
                                {request.first_name} {request.last_name}
                              </h4>
                              <p className="text-sm text-muted-foreground">
                                CIN: {request.cin} • Tél: {request.phone}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                {new Date(
                                  request.created_at
                                ).toLocaleDateString("fr-FR")}
                              </p>
                            </div>
                            <Badge
                              variant={getStatusBadgeVariant(request.status)}
                            >
                              {getStatusLabel(request.status)}
                            </Badge>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          {request.status === "approved" ? (
                            <div className="flex items-center justify-center w-10 h-10 rounded-full bg-green-100 text-green-600">
                              <svg
                                className="w-6 h-6"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth="2"
                                  d="M5 13l4 4L19 7"
                                ></path>
                              </svg>
                            </div>
                          ) : (
                            <>
                              <div className="flex flex-col sm:flex-row gap-2">
                                <Button
                                  size="sm"
                                  onClick={() =>
                                    updateStatus(request.id, "approved")
                                  }
                                  disabled={request.status === "approved"}
                                  className="bg-green-600 hover:bg-green-700 text-white w-full sm:w-auto"
                                >
                                  Approuver
                                </Button>
                                <Button
                                  size="sm"
                                  variant="destructive"
                                  onClick={() =>
                                    updateStatus(request.id, "rejected")
                                  }
                                  disabled={request.status === "rejected"}
                                  className="w-full sm:w-auto"
                                >
                                  Rejeter
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => {
                                    if (
                                      window.confirm(
                                        "Êtes-vous sûr de vouloir supprimer cette demande ? Cette action est irréversible."
                                      )
                                    ) {
                                      deleteRequest(request.id);
                                    }
                                  }}
                                  className="border-red-600 text-red-600 hover:bg-red-600 hover:text-white w-full sm:w-auto"
                                >
                                  Supprimer
                                </Button>
                              </div>
                            </>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
