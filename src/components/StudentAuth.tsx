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
import { Mail, Shield, User, ArrowRight, ArrowLeft, Key } from "lucide-react";

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
  const [step, setStep] = useState<"email" | "code">("email");
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [studentInfo, setStudentInfo] = useState<StudentInfo | null>(null);
  const { toast } = useToast();

  const handleEmailSubmit = async (e: React.FormEvent) => {
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
      const { data, error } = await supabase.functions.invoke(
        "send-verification",
        {
          body: { email },
        }
      );

      if (error) throw error;

      setStudentInfo(data.student);
      setStep("code");
      toast({
        title: "Code envoyé",
        description: "Un code de vérification a été envoyé à votre email",
      });
    } catch (error) {
      toast({
        title: "Erreur",
        description:
          (error as Error).message || "Erreur lors de l'envoi du code",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleCodeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      // Call the verify-code edge function
      const { data: verifyResponse, error: verifyError } =
        await supabase.functions.invoke("verify-code", {
          body: {
            email: email,
            code: code.trim(),
          },
        });

      if (verifyError || !verifyResponse.success) {
        throw new Error(verifyResponse?.error || "Code invalide ou expiré");
      }

      const studentData = verifyResponse.student;

      // Sign in the user with Supabase Auth
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: email,
        password: code.trim(), // Use the verification code as password
      });

      if (signInError) {
        console.error("Sign in error:", signInError);
        // If sign in fails, try to sign up
        const { error: signUpError } = await supabase.auth.signUp({
          email: email,
          password: code.trim(),
          options: {
            emailRedirectTo: undefined,
          },
        });

        if (signUpError) {
          console.error("Sign up error:", signUpError);
        }
      }

      // Get student's request count for the current year
      const requestCount = await supabase.rpc("get_student_request_count", {
        student_email: email,
      });

      const studentWithRequestCount = {
        ...studentData,
        requestCount: requestCount.data || 0,
      };

      toast({
        title: "Authentification réussie",
        description: `Bienvenue ${studentData.first_name} ${studentData.last_name}`,
      });

      onAuthenticated(studentWithRequestCount);
    } catch (error) {
      console.error("Verification error:", error);
      toast({
        title: "Erreur",
        description: (error as Error).message || "Code invalide ou expiré",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (step === "email") {
    return (
      <Card className="w-full max-w-md mx-auto bg-gradient-to-br from-white to-slate-50 border-slate-200 shadow-2xl rounded-2xl overflow-hidden">
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 p-6 text-white">
          <div className="flex items-center justify-center mb-4">
            <div className="bg-white/20 p-3 rounded-full">
              <Mail className="w-8 h-8" />
            </div>
          </div>
          <CardTitle className="text-center text-2xl font-bold">
            Authentification Étudiant
          </CardTitle>
          <CardDescription className="text-center text-blue-100 mt-2">
            Entrez votre email OFPPT pour recevoir un code de vérification
          </CardDescription>
        </div>
        <CardContent className="p-6">
          <form onSubmit={handleEmailSubmit} className="space-y-6">
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
            <Button
              type="submit"
              className="w-full py-6 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-bold rounded-xl transition-all duration-300 transform hover:scale-[1.02] shadow-lg"
              disabled={isLoading}
            >
              {isLoading ? (
                <div className="flex items-center">
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                  Envoi en cours...
                </div>
              ) : (
                <div className="flex items-center">
                  Envoyer le code
                  <ArrowRight className="ml-2 w-5 h-5" />
                </div>
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-md mx-auto bg-gradient-to-br from-white to-slate-50 border-slate-200 shadow-2xl rounded-2xl overflow-hidden">
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 p-6 text-white">
        <div className="flex items-center justify-center mb-4">
          <div className="bg-white/20 p-3 rounded-full">
            <Key className="w-8 h-8" />
          </div>
        </div>
        <CardTitle className="text-center text-2xl font-bold">
          Code de vérification
        </CardTitle>
        <CardDescription className="text-center text-blue-100 mt-2">
          Entrez le code de 6 chiffres envoyé à votre email
        </CardDescription>
      </div>
      <CardContent className="p-6">
        <div className="mb-6 p-4 bg-slate-100 rounded-xl">
          <div className="flex items-center">
            <User className="w-5 h-5 text-slate-600 mr-2" />
            <div>
              <p className="font-bold text-slate-800">
                {studentInfo?.first_name} {studentInfo?.last_name}
              </p>
              <p className="text-sm text-slate-600">
                Groupe: {studentInfo?.student_group}
              </p>
            </div>
          </div>
        </div>
        <form onSubmit={handleCodeSubmit} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="code" className="text-slate-700 font-medium">
              Code de vérification
            </Label>
            <div className="relative">
              <Shield className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-5 h-5" />
              <Input
                id="code"
                type="text"
                placeholder="123456"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                maxLength={6}
                required
                disabled={isLoading}
                className="pl-10 py-6 bg-slate-50 border-slate-200 focus:border-blue-500 focus:ring-blue-500 rounded-xl text-center text-lg tracking-widest font-mono text-slate-800"
              />
            </div>
          </div>
          <div className="flex gap-3">
            <Button
              type="button"
              variant="outline"
              className="flex-1 py-6 border-slate-300 text-slate-700 hover:bg-slate-100 rounded-xl"
              onClick={() => setStep("email")}
              disabled={isLoading}
            >
              <ArrowLeft className="w-5 h-5 mr-2" />
              Retour
            </Button>
            <Button
              type="submit"
              className="flex-1 py-6 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-bold rounded-xl transition-all duration-300 transform hover:scale-[1.02] shadow-lg"
              disabled={isLoading}
            >
              {isLoading ? (
                <div className="flex items-center">
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                  Vérification...
                </div>
              ) : (
                "Vérifier"
              )}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
};
