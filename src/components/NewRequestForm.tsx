import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { StudentAuth } from "./StudentAuth";
import {
  GraduationCap,
  Send,
  Clock,
  CheckCircle,
  XCircle,
  LogOut,
  User,
  Calendar,
  Hash,
  Mail,
  BookOpen,
  CalendarClock,
  AlertCircle,
  Info,
} from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface Student {
  id: string;
  first_name: string;
  last_name: string;
  cin: string;
  email: string;
  birth_date: string;
  formation_level: string;
  speciality: string;
  student_group:
    | "ID101"
    | "ID102"
    | "ID103"
    | "ID104"
    | "IDOSR201"
    | "IDOSR202"
    | "IDOSR203"
    | "IDOSR204"
    | "DEVOWFS201"
    | "DEVOWFS202"
    | "DEVOWFS203"
    | "DEVOWFS204"
    | "DEV101"
    | "DEV102"
    | "DEV103"
    | "DEV104"
    | "DEV105"
    | "DEV106"
    | "DEV107";
  inscription_number: string;
  formation_type: string;
  formation_mode: string;
  formation_year: string;
  requestCount: number;
}

export interface AttestationRequest {
  id: string;
  status: string;
  created_at: string;
  rejection_reason?: string;
  first_name: string;
  last_name: string;
  cin: string;
  phone?: string;
  attestation_type?: string;
  student_group:
    | "ID101"
    | "ID102"
    | "ID103"
    | "ID104"
    | "IDOSR201"
    | "IDOSR202"
    | "IDOSR203"
    | "IDOSR204"
    | "DEVOWFS201"
    | "DEVOWFS202"
    | "DEVOWFS203"
    | "DEVOWFS204"
    | "DEV101"
    | "DEV102"
    | "DEV103"
    | "DEV104"
    | "DEV105"
    | "DEV106"
    | "DEV107";
}

interface SubmitError extends Error {
  message: string;
}

export const NewRequestForm: React.FC = () => {
  const [authenticatedStudent, setAuthenticatedStudent] =
    useState<Student | null>(null);
  const [studentRequests, setStudentRequests] = useState<AttestationRequest[]>(
    []
  );
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [expandedCard, setExpandedCard] = useState<string | null>(null);

  const { toast } = useToast();

  useEffect(() => {
    if (authenticatedStudent) {
      fetchStudentRequests();
    }
  }, [authenticatedStudent]);

  const fetchStudentRequests = async () => {
    if (!authenticatedStudent) return;

    try {
      const { data, error } = await supabase
        .from("attestation_requests")
        .select("*")
        .eq("student_id", authenticatedStudent.id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setStudentRequests(data || []);
    } catch (error) {
      console.error("Error fetching requests:", error);
    }
  };

  const canSubmitRequest = () => {
    if (!authenticatedStudent) return false;
    return authenticatedStudent.requestCount < 3;
  };

  const handleSubmitRequest = async () => {
    if (!authenticatedStudent) return;

    setIsSubmitting(true);
    try {
      const { error } = await supabase.from("attestation_requests").insert({
        student_id: authenticatedStudent.id,
        first_name: authenticatedStudent.first_name,
        last_name: authenticatedStudent.last_name,
        cin: authenticatedStudent.cin,
        phone: authenticatedStudent.email,
        student_group: authenticatedStudent.student_group,
        status: "pending",
      });

      if (error) throw error;

      toast({
        title: "✅ Demande envoyée",
        description:
          "Votre demande d'attestation a été soumise avec succès. Vous recevrez un email de notification lors du traitement.",
      });

      // Refresh requests and update count
      await fetchStudentRequests();
      setAuthenticatedStudent((prev) =>
        prev ? { ...prev, requestCount: prev.requestCount + 1 } : null
      );
    } catch (error: unknown) {
      const submitError = error as SubmitError;
      toast({
        title: "Erreur",
        description: submitError.message || "Erreur lors de la soumission",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setAuthenticatedStudent(null);
    setStudentRequests([]);
    toast({
      title: "Déconnexion réussie",
      description: "Vous avez été déconnecté avec succès.",
    });
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "approved":
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case "rejected":
        return <XCircle className="w-5 h-5 text-red-500" />;
      default:
        return <Clock className="w-5 h-5 text-yellow-500" />;
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case "approved":
        return "Approuvée";
      case "rejected":
        return "Rejetée";
      default:
        return "En attente";
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "approved":
        return "text-green-500 bg-green-500/10 border-green-500/20";
      case "rejected":
        return "text-red-500 bg-red-500/10 border-red-500/20";
      default:
        return "text-yellow-500 bg-yellow-500/10 border-yellow-500/20";
    }
  };

  const toggleCardExpansion = (cardId: string) => {
    setExpandedCard(expandedCard === cardId ? null : cardId);
  };

  const handlePrintAttestation = () => {
    window.print();
  };

  if (!authenticatedStudent) {
    return (
      <div className="container mx-auto p-4 max-w-md">
        <StudentAuth onAuthenticated={setAuthenticatedStudent} />
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4 space-y-6">
      <div className="w-full max-w-4xl mx-auto">
        {/* Header avec bouton de déconnexion */}
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-purple-600">
            Espace Étudiant
          </h1>
          <Button
            onClick={handleLogout}
            variant="outline"
            size="sm"
            className="flex items-center gap-2 bg-white/10 backdrop-blur-lg border-white/20 text-slate-800 hover:bg-white/20 transition-all duration-300"
          >
            <LogOut className="w-4 h-4" />
            Déconnexion
          </Button>
        </div>

        {/* Combined Card for Student Info, Important Info, and New Request */}
        <Card className="mb-6 bg-gradient-to-br from-white to-slate-50 backdrop-blur-lg border-slate-200 shadow-xl rounded-2xl overflow-hidden">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(99,102,241,0.1)_0%,transparent_70%)]"></div>
          <CardHeader className="relative">
            <CardTitle className="flex items-center gap-3 text-slate-800">
              <div className="p-2 rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 shadow-lg">
                <GraduationCap className="w-6 h-6 text-white" />
              </div>
              Espace Étudiant
            </CardTitle>
            <CardDescription className="text-slate-600">
              Bienvenue {authenticatedStudent.first_name}{" "}
              {authenticatedStudent.last_name}
            </CardDescription>
          </CardHeader>
          <CardContent className="relative">
            {/* Student Info Section */}
            <div className="mb-8">
              <h3 className="text-lg font-semibold text-slate-800 mb-4 flex items-center">
                <User className="w-5 h-5 text-blue-500 mr-2" />
                Informations Personnelles
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-4">
                <div
                  className="flex items-start p-4 bg-slate-50 rounded-xl border border-slate-200 w-full cursor-pointer transition-all duration-200 hover:bg-slate-100 hover:shadow-md"
                  title={`${authenticatedStudent.first_name} ${authenticatedStudent.last_name}`}
                >
                  <User className="w-5 h-5 text-blue-500 mr-3 flex-shrink-0 mt-0.5" />
                  <div className="min-w-0">
                    <p className="text-xs text-slate-500 mb-1">Nom complet</p>
                    <p className="font-medium text-slate-800">
                      {authenticatedStudent.first_name}{" "}
                      {authenticatedStudent.last_name}
                    </p>
                  </div>
                </div>

                <div
                  className="flex items-start p-4 bg-slate-50 rounded-xl border border-slate-200 w-full cursor-pointer transition-all duration-200 hover:bg-slate-100 hover:shadow-md"
                  title={authenticatedStudent.cin}
                >
                  <Hash className="w-5 h-5 text-purple-500 mr-3 flex-shrink-0 mt-0.5" />
                  <div className="min-w-0">
                    <p className="text-xs text-slate-500 mb-1">CIN</p>
                    <p className="font-medium text-slate-800">
                      {authenticatedStudent.cin}
                    </p>
                  </div>
                </div>

                <div
                  className="flex items-start p-4 bg-slate-50 rounded-xl border border-slate-200 w-full cursor-pointer transition-all duration-200 hover:bg-slate-100 hover:shadow-md"
                  title={authenticatedStudent.email}
                >
                  <Mail className="w-5 h-5 text-indigo-500 mr-3 flex-shrink-0 mt-0.5" />
                  <div className="min-w-0">
                    <p className="text-xs text-slate-500 mb-1">Email</p>
                    <p className="font-medium text-slate-800 break-all">
                      {authenticatedStudent.email}
                    </p>
                  </div>
                </div>

                <div
                  className="flex items-start p-4 bg-slate-50 rounded-xl border border-slate-200 w-full cursor-pointer transition-all duration-200 hover:bg-slate-100 hover:shadow-md"
                  title={authenticatedStudent.speciality}
                >
                  <BookOpen className="w-5 h-5 text-cyan-500 mr-3 flex-shrink-0 mt-0.5" />
                  <div className="min-w-0">
                    <p className="text-xs text-slate-500 mb-1">Spécialité</p>
                    <p className="font-medium text-slate-800">
                      {authenticatedStudent.speciality}
                    </p>
                  </div>
                </div>

                <div
                  className="flex items-start p-4 bg-slate-50 rounded-xl border border-slate-200 w-full cursor-pointer transition-all duration-200 hover:bg-slate-100 hover:shadow-md"
                  title={authenticatedStudent.student_group}
                >
                  <Calendar className="w-5 h-5 text-green-500 mr-3 flex-shrink-0 mt-0.5" />
                  <div className="min-w-0">
                    <p className="text-xs text-slate-500 mb-1">Groupe</p>
                    <p className="font-medium text-slate-800">
                      {authenticatedStudent.student_group}
                    </p>
                  </div>
                </div>

                <div
                  className="flex items-start p-4 bg-slate-50 rounded-xl border border-slate-200 w-full cursor-pointer transition-all duration-200 hover:bg-slate-100 hover:shadow-md"
                  title={`${authenticatedStudent.requestCount}/3`}
                >
                  <CalendarClock className="w-5 h-5 text-amber-500 mr-3 flex-shrink-0 mt-0.5" />
                  <div className="min-w-0">
                    <p className="text-xs text-slate-500 mb-1">
                      Demandes cette année
                    </p>
                    <p className="font-medium text-slate-800">
                      {authenticatedStudent.requestCount}
                      <span className="text-slate-500">/3</span>
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Important Information Section */}
            <div className="mb-8">
              <div className="space-y-3"></div>
            </div>

            {/* New Request Section */}
            <div>
              <h3 className="text-lg font-semibold text-slate-800 mb-4 flex items-center">
                <Send className="w-5 h-5 text-purple-500 mr-2" />
                Nouvelle Demande d'Attestation
              </h3>
              <div className="bg-slate-50 rounded-xl border border-slate-200 p-6">
                <p className="text-slate-600 mb-6">
                  {canSubmitRequest()
                    ? `Vous pouvez encore faire ${
                        3 - authenticatedStudent.requestCount
                      } demande(s) cette année`
                    : "Vous avez atteint la limite de 3 demandes par année"}
                </p>
                <Button
                  onClick={handleSubmitRequest}
                  disabled={!canSubmitRequest() || isSubmitting}
                  className="w-full py-6 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-bold rounded-xl transition-all duration-300 transform hover:scale-[1.02] shadow-lg flex items-center justify-center"
                >
                  {isSubmitting ? (
                    <>
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                      Envoi en cours...
                    </>
                  ) : (
                    <>
                      <Send className="w-5 h-5 mr-2" />
                      Faire une nouvelle demande
                    </>
                  )}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Requests History Card - Enhanced with futuristic design */}
        <Card className="bg-gradient-to-br from-white to-slate-50 backdrop-blur-lg border-slate-200 shadow-xl rounded-2xl overflow-hidden">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(16,185,129,0.1)_0%,transparent_70%)]"></div>
          <CardHeader className="relative">
            <CardTitle className="text-slate-800">
              Historique des Demandes
            </CardTitle>
            <CardDescription className="text-slate-600">
              Vos demandes d'attestation et leur statut
            </CardDescription>
          </CardHeader>
          <CardContent className="relative">
            {studentRequests.length === 0 ? (
              <div className="text-center py-12">
                <div className="inline-block p-4 rounded-full bg-slate-100 mb-4">
                  <Clock className="w-12 h-12 text-slate-400" />
                </div>
                <p className="text-slate-600">Aucune demande trouvée</p>
                <p className="text-slate-500 text-sm mt-2">
                  Vous n'avez pas encore soumis de demande d'attestation
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {studentRequests.map((request) => (
                  <div
                    key={request.id}
                    className="border border-slate-200 rounded-xl p-4 bg-slate-50 hover:bg-slate-100 transition-all duration-300"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        {getStatusIcon(request.status)}
                        <div>
                          <p className="font-medium text-slate-800">
                            Demande du{" "}
                            {new Date(request.created_at).toLocaleDateString(
                              "fr-FR"
                            )}
                          </p>
                          <span
                            className={`inline-block px-3 py-1 rounded-full text-xs font-medium border ${getStatusColor(
                              request.status
                            )}`}
                          >
                            {getStatusText(request.status)}
                          </span>
                        </div>
                      </div>
                    </div>

                    {request.rejection_reason && (
                      <div className="mt-3 p-3 bg-red-100 border border-red-200 rounded-lg">
                        <p className="text-sm text-red-700">
                          <span className="font-medium">Motif du refus:</span>{" "}
                          {request.rejection_reason}
                        </p>
                      </div>
                    )}

                    {request.status === "approved" && (
                      <div className="mt-3 p-3 bg-green-100 border border-green-200 rounded-lg">
                        <p className="text-sm text-green-700">
                          ✅ Votre attestation est prête pour retrait au
                          secrétariat de la direction
                        </p>
                        <p className="text-sm text-green-800 mt-1">
                          Présentez-vous avec votre CIN pour récupérer votre
                          attestation originale.
                        </p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
