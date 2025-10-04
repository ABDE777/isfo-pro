import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Mail, User, ArrowRight, Key, AlertCircle, Info } from "lucide-react";
import { ChangePasswordDialog } from "./ChangePasswordDialog";

interface StudentInfo {
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
}

interface StudentAuthProps {
  onAuthenticated: (student: StudentInfo & { requestCount: number }) => void;
}

export const StudentAuth: React.FC<StudentAuthProps> = ({
  onAuthenticated,
}) => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [showChangePassword, setShowChangePassword] = useState(false);
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [authenticatedStudent, setAuthenticatedStudent] = useState<any>(null);
  const { toast } = useToast();

  // Check for persisted session on mount
  React.useEffect(() => {
    const checkPersistedSession = async () => {
      const storedEmail = localStorage.getItem("student_email");
      const storedPassword = localStorage.getItem("student_password");

      if (storedEmail && storedPassword) {
        try {
          const { data: studentData, error } = await supabase
            .from("students")
            .select("*")
            .eq("email", storedEmail)
            .eq("password_hash", storedPassword)
            .single();

          if (!error && studentData) {
            const { data: requestCount } = await supabase.rpc(
              "get_student_request_count",
              { student_email: storedEmail }
            );

            const studentWithRequestCount = {
              ...studentData,
              student_group: studentData.student_group as any,
              requestCount: requestCount || 0,
            };

            onAuthenticated(studentWithRequestCount);
          } else {
            // Clear invalid session
            localStorage.removeItem("student_email");
            localStorage.removeItem("student_password");
          }
        } catch (error) {
          console.error("Error checking persisted session:", error);
          localStorage.removeItem("student_email");
          localStorage.removeItem("student_password");
        }
      }
      setIsLoading(false);
    };

    checkPersistedSession();
  }, [onAuthenticated]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate email domain
    if (!email.endsWith("@ofppt-edu.ma")) {
      toast({
        title: "Email invalide",
        description:
          "Il faut utiliser un email qui contient @ofppt-edu.ma. Si vous n'avez pas cet email, veuillez venir à la direction pour le récupérer.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);

    try {
      // Authentification directe avec la table students (pas Supabase Auth)
      const { data: studentData, error: studentError } = await supabase
        .from("students")
        .select("*")
        .eq("email", email)
        .eq("password_hash", password)
        .single();

      if (studentError || !studentData) {
        toast({
          title: "Erreur de connexion",
          description: "Email ou mot de passe incorrect",
          variant: "destructive",
        });
        return;
      }

      // Get student's request count for the current year
      const { data: requestCount } = await supabase.rpc("get_student_request_count", {
        student_email: email,
      });

      const studentWithRequestCount = {
        ...studentData,
        student_group: studentData.student_group as any,
        requestCount: requestCount || 0,
      };

      // Store credentials in localStorage for session persistence
      localStorage.setItem("student_email", email);
      localStorage.setItem("student_password", password);

      toast({
        title: "Connexion réussie",
        description: `Bienvenue ${studentData.first_name} ${studentData.last_name}`,
      });

      // Si le mot de passe n'a pas été changé, afficher le dialogue
      if (!studentData.password_changed) {
        setAuthenticatedStudent(studentWithRequestCount);
        setShowChangePassword(true);
      } else {
        onAuthenticated(studentWithRequestCount);
      }
    } catch (error) {
      toast({
        title: "Erreur",
        description: (error as Error).message || "Erreur lors de la connexion",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleCloseChangePassword = () => {
    setShowChangePassword(false);
    if (authenticatedStudent) {
      onAuthenticated(authenticatedStudent);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-white via-blue-50 to-green-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-blue-200 border-t-blue-600 mx-auto mb-6"></div>
          <p className="text-lg text-slate-600 font-medium">
            Chargement...
          </p>
        </div>
      </div>
    );
  }

  return (
    <>
      <ChangePasswordDialog
        isOpen={showChangePassword}
        onClose={handleCloseChangePassword}
        studentEmail={email}
      />
      
      {/* Forgot Password Dialog */}
      {showForgotPassword && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-md bg-white">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertCircle className="w-5 h-5 text-amber-500" />
                Mot de passe oublié
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-slate-700">
                Si vous avez oublié votre mot de passe, veuillez vous rendre à la direction de l'établissement pour le réinitialiser.
              </p>
              <p className="text-sm text-slate-600 bg-blue-50 p-3 rounded-lg border border-blue-200">
                <Info className="w-4 h-4 inline mr-2" />
                Apportez votre carte d'étudiant et votre pièce d'identité.
              </p>
              <Button
                onClick={() => setShowForgotPassword(false)}
                className="w-full"
              >
                J'ai compris
              </Button>
            </CardContent>
          </Card>
        </div>
      )}
      
      <Card className="w-full max-w-md mx-auto bg-white border-green-200 shadow-2xl rounded-2xl overflow-hidden">
      <div className="bg-gradient-to-r from-blue-600 to-green-600 p-6 text-white">
        <div className="flex items-center justify-center mb-4">
          <div className="bg-white/20 p-3 rounded-full">
            <User className="w-8 h-8" />
          </div>
        </div>
        <CardTitle className="text-center text-2xl font-bold">
          Connexion Étudiant
        </CardTitle>
        <CardDescription className="text-center text-blue-100 mt-2">
          Connectez-vous avec votre email et mot de passe OFPPT
        </CardDescription>
      </div>
      <CardContent className="p-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="email" className="text-slate-700 font-medium">
              Email OFPPT
            </Label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-5 h-5" />
              <Input
                id="email"
                type="email"
                placeholder="votre-matricule@ofppt-edu.ma"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={isLoading}
                className="pl-10 py-6 bg-slate-50 border-slate-200 focus:border-blue-500 focus:ring-blue-500 rounded-xl text-slate-800"
              />
            </div>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="password" className="text-slate-700 font-medium">
              Mot de passe
            </Label>
            <div className="relative">
              <Key className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-5 h-5" />
              <Input
                id="password"
                type="password"
                placeholder="Votre mot de passe"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                disabled={isLoading}
                className="pl-10 py-6 bg-slate-50 border-slate-200 focus:border-blue-500 focus:ring-blue-500 rounded-xl text-slate-800"
              />
            </div>
          </div>
          
          <Button
            type="submit"
            className="w-full py-6 bg-gradient-to-r from-blue-600 to-green-600 hover:from-blue-700 hover:to-green-700 text-white font-bold rounded-xl transition-all duration-300 transform hover:scale-[1.02] shadow-lg"
            disabled={isLoading}
          >
            {isLoading ? (
              <div className="flex items-center">
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                Connexion en cours...
              </div>
            ) : (
              <div className="flex items-center">
                Se connecter
                <ArrowRight className="ml-2 w-5 h-5" />
              </div>
            )}
          </Button>
          
          <div className="text-center mt-4">
            <button
              type="button"
              onClick={() => setShowForgotPassword(true)}
              className="text-sm text-blue-600 hover:text-blue-700 hover:underline font-medium"
            >
              Mot de passe oublié ?
            </button>
          </div>
        </form>
      </CardContent>
    </Card>
    </>
  );
};