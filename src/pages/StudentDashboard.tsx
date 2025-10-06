import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import {
  LogOut,
  FileText,
  Download,
  Clock,
  CheckCircle,
  XCircle,
  User,
  Mail,
  Calendar,
  BookOpen,
  Key,
  MessageSquare,
  Bell,
  GraduationCap,
} from "lucide-react";
import { ChangePasswordDialog } from "@/components/ChangePasswordDialog";
import { useNavigate } from "react-router-dom";

interface AttestationRequest {
  id: string;
  first_name: string;
  last_name: string;
  status: string;
  created_at: string;
  attestation_number?: number;
  rejection_reason?: string;
  year_requested: number;
}

interface Student {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  cin: string;
  birth_date: string;
  formation_level: string;
  speciality: string;
  student_group: string;
  inscription_number: string;
  formation_type: string;
  formation_mode: string;
  formation_year: string;
  password_changed: boolean;
  password_changes_count: number;
  password_changes_year: number;
}

export const StudentDashboard = () => {
  const [student, setStudent] = useState<Student | null>(null);
  const [requests, setRequests] = useState<AttestationRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [showPasswordDialog, setShowPasswordDialog] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();
  const currentYear = new Date().getFullYear();

  useEffect(() => {
    loadStudentData();
  }, []);

  const loadStudentData = async () => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      
      if (!user) {
        navigate("/");
        return;
      }

      // Get student info
      const { data: studentData, error: studentError } = await supabase
        .from("students")
        .select("*")
        .eq("email", user.email)
        .single();

      if (studentError) throw studentError;
      setStudent(studentData);

      // Get attestation requests
      const { data: requestsData, error: requestsError } = await supabase
        .from("attestation_requests")
        .select("*")
        .eq("student_id", studentData.id)
        .order("created_at", { ascending: false });

      if (requestsError) throw requestsError;
      setRequests(requestsData || []);
    } catch (error) {
      console.error("Error loading data:", error);
      toast({
        title: "Erreur",
        description: "Impossible de charger vos données",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/");
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "approved":
        return (
          <Badge className="bg-green-500">
            <CheckCircle className="w-3 h-3 mr-1" />
            Approuvée
          </Badge>
        );
      case "rejected":
        return (
          <Badge className="bg-destructive">
            <XCircle className="w-3 h-3 mr-1" />
            Rejetée
          </Badge>
        );
      default:
        return (
          <Badge className="bg-yellow-500">
            <Clock className="w-3 h-3 mr-1" />
            En attente
          </Badge>
        );
    }
  };

  const remainingRequests = student
    ? Math.max(
        0,
        3 - (requests.filter((r) => r.year_requested === currentYear).length || 0)
      )
    : 0;

  const remainingPasswordChanges = student
    ? Math.max(
        0,
        3 - (student.password_changes_year === currentYear 
          ? student.password_changes_count 
          : 0)
      )
    : 3;

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
        <div className="text-white text-xl">Chargement...</div>
      </div>
    );
  }

  if (!student) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      {/* Navigation */}
      <nav className="sticky top-0 z-50 bg-white/10 backdrop-blur-lg border-b border-white/20">
        <div className="container mx-auto px-4 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-500 to-purple-600 p-1 shadow-lg">
                <div className="bg-white rounded-xl w-full h-full flex items-center justify-center">
                  <GraduationCap className="w-7 h-7 text-blue-600" />
                </div>
              </div>
              <div>
                <h1 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-300 to-purple-300">
                  Mon Espace Étudiant
                </h1>
                <p className="text-sm text-white/80">
                  {student.first_name} {student.last_name}
                </p>
              </div>
            </div>
            <Button
              onClick={handleLogout}
              variant="outline"
              className="bg-white/10 border-white/20 text-white hover:bg-white/20"
            >
              <LogOut className="w-4 h-4 mr-2" />
              Déconnexion
            </Button>
          </div>
        </div>
      </nav>

      <div className="container mx-auto px-4 py-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card className="bg-white/10 backdrop-blur-sm border-white/20">
            <CardHeader className="pb-3">
              <CardTitle className="text-white flex items-center">
                <FileText className="w-5 h-5 mr-2 text-blue-400" />
                Demandes restantes
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-white">{remainingRequests}/3</div>
              <p className="text-sm text-white/70">Pour l'année {currentYear}</p>
            </CardContent>
          </Card>

          <Card className="bg-white/10 backdrop-blur-sm border-white/20">
            <CardHeader className="pb-3">
              <CardTitle className="text-white flex items-center">
                <Key className="w-5 h-5 mr-2 text-purple-400" />
                Changements de mot de passe
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-white">
                {remainingPasswordChanges}/3
              </div>
              <p className="text-sm text-white/70">Restants pour {currentYear}</p>
            </CardContent>
          </Card>

          <Card className="bg-white/10 backdrop-blur-sm border-white/20">
            <CardHeader className="pb-3">
              <CardTitle className="text-white flex items-center">
                <Clock className="w-5 h-5 mr-2 text-yellow-400" />
                Demandes en attente
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-white">
                {requests.filter((r) => r.status === "pending").length}
              </div>
              <p className="text-sm text-white/70">À traiter</p>
            </CardContent>
          </Card>
        </div>

        {/* Main Content Tabs */}
        <Tabs defaultValue="requests" className="w-full">
          <TabsList className="grid w-full grid-cols-2 lg:w-[400px] bg-white/10 backdrop-blur-sm border-white/20">
            <TabsTrigger value="requests" className="data-[state=active]:bg-white/20">
              Mes Demandes
            </TabsTrigger>
            <TabsTrigger value="profile" className="data-[state=active]:bg-white/20">
              Mon Profil
            </TabsTrigger>
          </TabsList>

          <TabsContent value="requests" className="mt-6">
            <Card className="bg-white/10 backdrop-blur-sm border-white/20">
              <CardHeader>
                <CardTitle className="text-white">Historique des demandes</CardTitle>
                <CardDescription className="text-white/70">
                  Toutes vos demandes d'attestation
                </CardDescription>
              </CardHeader>
              <CardContent>
                {requests.length === 0 ? (
                  <div className="text-center py-12">
                    <FileText className="w-16 h-16 mx-auto text-white/30 mb-4" />
                    <p className="text-white/70">Aucune demande pour le moment</p>
                    <Button
                      onClick={() => navigate("/")}
                      className="mt-4 bg-gradient-to-r from-blue-500 to-purple-600"
                    >
                      Faire une demande
                    </Button>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow className="border-white/20 hover:bg-white/5">
                          <TableHead className="text-white/90">Date</TableHead>
                          <TableHead className="text-white/90">Statut</TableHead>
                          <TableHead className="text-white/90">N° Attestation</TableHead>
                          <TableHead className="text-white/90">Année</TableHead>
                          <TableHead className="text-white/90">Action</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {requests.map((request) => (
                          <TableRow key={request.id} className="border-white/20 hover:bg-white/5">
                            <TableCell className="text-white">
                              {new Date(request.created_at).toLocaleDateString("fr-FR")}
                            </TableCell>
                            <TableCell>{getStatusBadge(request.status)}</TableCell>
                            <TableCell className="text-white">
                              {request.attestation_number || "-"}
                            </TableCell>
                            <TableCell className="text-white">
                              {request.year_requested}
                            </TableCell>
                            <TableCell>
                              {request.status === "approved" && request.attestation_number && (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="bg-white/10 border-white/20 text-white hover:bg-white/20"
                                >
                                  <Download className="w-4 h-4 mr-2" />
                                  Télécharger
                                </Button>
                              )}
                              {request.status === "rejected" && request.rejection_reason && (
                                <p className="text-red-400 text-sm">
                                  Motif: {request.rejection_reason}
                                </p>
                              )}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="profile" className="mt-6">
            <Card className="bg-white/10 backdrop-blur-sm border-white/20">
              <CardHeader>
                <CardTitle className="text-white">Informations personnelles</CardTitle>
                <CardDescription className="text-white/70">
                  Vos informations d'étudiant
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-white/70 text-sm flex items-center">
                      <User className="w-4 h-4 mr-2" />
                      Nom complet
                    </label>
                    <p className="text-white font-medium">
                      {student.first_name} {student.last_name}
                    </p>
                  </div>

                  <div className="space-y-2">
                    <label className="text-white/70 text-sm flex items-center">
                      <Mail className="w-4 h-4 mr-2" />
                      Email
                    </label>
                    <p className="text-white font-medium">{student.email}</p>
                  </div>

                  <div className="space-y-2">
                    <label className="text-white/70 text-sm flex items-center">
                      <FileText className="w-4 h-4 mr-2" />
                      CIN
                    </label>
                    <p className="text-white font-medium">{student.cin}</p>
                  </div>

                  <div className="space-y-2">
                    <label className="text-white/70 text-sm flex items-center">
                      <Calendar className="w-4 h-4 mr-2" />
                      Date de naissance
                    </label>
                    <p className="text-white font-medium">
                      {new Date(student.birth_date).toLocaleDateString("fr-FR")}
                    </p>
                  </div>

                  <div className="space-y-2">
                    <label className="text-white/70 text-sm flex items-center">
                      <BookOpen className="w-4 h-4 mr-2" />
                      Formation
                    </label>
                    <p className="text-white font-medium">{student.speciality}</p>
                    <p className="text-white/70 text-sm">{student.formation_level}</p>
                  </div>

                  <div className="space-y-2">
                    <label className="text-white/70 text-sm flex items-center">
                      <GraduationCap className="w-4 h-4 mr-2" />
                      Groupe
                    </label>
                    <p className="text-white font-medium">{student.student_group}</p>
                    <p className="text-white/70 text-sm">Année: {student.formation_year}</p>
                  </div>
                </div>

                <div className="border-t border-white/20 pt-6 mt-6">
                  <Button
                    onClick={() => setShowPasswordDialog(true)}
                    variant="outline"
                    className="bg-white/10 border-white/20 text-white hover:bg-white/20"
                  >
                    <Key className="w-4 h-4 mr-2" />
                    Changer mon mot de passe
                  </Button>
                  <p className="text-white/70 text-sm mt-2">
                    Changements restants: {remainingPasswordChanges}/3 pour {currentYear}
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      {student && (
        <ChangePasswordDialog
          open={showPasswordDialog}
          onOpenChange={setShowPasswordDialog}
          studentEmail={student.email}
          onPasswordChanged={() => {
            loadStudentData();
          }}
        />
      )}
    </div>
  );
};
