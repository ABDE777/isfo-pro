import { useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { validateStudent } from "@/data/students";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { GraduationCap, Send } from "lucide-react";

const STUDENT_GROUPS = [
  "D101",
  "ID102",
  "ID103",
  "ID104",
  "IDOSR201",
  "IDOSR202",
  "IDOSR203",
  "IDOSR204",
  "DEVOWFS201",
  "DEVOWFS202",
  "DEVOWFS203",
  "DEVOWFS204",
  "DEV101",
  "DEV102",
  "DEV103",
  "DEV104",
  "DEV105",
  "DEV106",
  "DEV107",
];

interface FormData {
  firstName: string;
  lastName: string;
  cin: string;
  phone: string;
  studentGroup: string;
}

const RequestForm = () => {
  const [formData, setFormData] = useState<FormData>({
    firstName: "",
    lastName: "",
    cin: "",
    phone: "",
    studentGroup: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  const handleInputChange = (field: keyof FormData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      // Valider que l'étudiant est bien dans la liste autorisée
      const isValidStudent = validateStudent(
        formData.firstName,
        formData.lastName,
        formData.studentGroup
      );

      if (!isValidStudent) {
        // Chercher des étudiants similaires pour suggérer des corrections
        const similarStudents = findSimilarStudents(
          formData.firstName,
          formData.lastName,
          formData.studentGroup
        );

        let errorMessage =
          "Vos informations ne correspondent pas à la liste des étudiants autorisés.";

        if (similarStudents.length > 0) {
          errorMessage +=
            "\n\nVouliez-vous dire :\n" +
            similarStudents
              .map((s) => `- ${s.fullName} (${s.group})`)
              .join("\n");
        }

        toast({
          title: "Validation échouée",
          description: errorMessage,
          variant: "destructive",
          duration: 7000, // Augmenter la durée pour laisser le temps de lire les suggestions
        });
        setIsSubmitting(false);
        return;
      }

      // Vérifier si un étudiant existe déjà avec le même CIN
      const { data: existingCIN } = await supabase
        .from("attestation_requests")
        .select("*")
        .eq("cin", formData.cin);

      if (existingCIN && existingCIN.length > 0) {
        toast({
          title: "Demande impossible",
          description: "Un étudiant avec ce CIN existe déjà dans le système.",
          variant: "destructive",
        });
        setIsSubmitting(false);
        return;
      }

      // Vérifier si un étudiant existe déjà avec le même nom et prénom
      const { data: existingName } = await supabase
        .from("attestation_requests")
        .select("*")
        .eq("first_name", formData.firstName)
        .eq("last_name", formData.lastName);

      if (existingName && existingName.length > 0) {
        toast({
          title: "Attention",
          description:
            "Un étudiant avec le même nom et prénom existe déjà. Veuillez vérifier que ce n'est pas un doublon.",
          variant: "destructive",
        });
        setIsSubmitting(false);
        return;
      }

      const { error } = await supabase.from("attestation_requests").insert({
        first_name: formData.firstName,
        last_name: formData.lastName,
        cin: formData.cin,
        phone: formData.phone,
        student_group: formData.studentGroup,
      });

      if (error) throw error;

      toast({
        title: "Demande envoyée avec succès",
        description:
          "Votre demande d'attestation a été soumise et sera traitée prochainement.",
      });

      // Reset form
      setFormData({
        firstName: "",
        lastName: "",
        cin: "",
        phone: "",
        studentGroup: "",
      });
    } catch (error) {
      toast({
        title: "Erreur",
        description:
          "Une erreur s'est produite lors de l'envoi de votre demande.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card className="w-full max-w-md mx-auto shadow-elegant border-0 bg-card/80 backdrop-blur-sm hover:shadow-glow transition-all duration-500 animate-fade-in">
      <CardHeader className="text-center pb-2">
        <div className="mx-auto mb-4 w-12 h-12 rounded-full bg-gradient-primary flex items-center justify-center transform hover:scale-110 transition-transform duration-300 animate-bounce-gentle">
          <GraduationCap className="w-6 h-6 text-white animate-pulse" />
        </div>
        <CardTitle className="text-2xl font-bold bg-gradient-primary bg-clip-text text-transparent animate-slide-up">
          Demande d'Attestation
        </CardTitle>
        <CardDescription className="text-muted-foreground animate-fade-in-delay">
          Remplissez le formulaire pour demander votre attestation
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4 animate-fade-in-up">
          <div className="space-y-2">
            <Label htmlFor="firstName">Prénom</Label>
            <Input
              id="firstName"
              type="text"
              value={formData.firstName}
              onChange={(e) => handleInputChange("firstName", e.target.value)}
              required
              className="border-border/50 focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all duration-300 hover:border-primary/50"
              placeholder="Votre prénom"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="lastName">Nom</Label>
            <Input
              id="lastName"
              type="text"
              value={formData.lastName}
              onChange={(e) => handleInputChange("lastName", e.target.value)}
              required
              className="border-border/50 focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all duration-300 hover:border-primary/50"
              placeholder="Votre nom"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="cin">CIN</Label>
            <Input
              id="cin"
              type="text"
              value={formData.cin}
              onChange={(e) => handleInputChange("cin", e.target.value)}
              required
              className="border-border/50 focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all duration-300 hover:border-primary/50"
              placeholder="Votre CIN"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="phone">Numéro de téléphone</Label>
            <Input
              id="phone"
              type="tel"
              value={formData.phone}
              onChange={(e) => handleInputChange("phone", e.target.value)}
              required
              className="border-border/50 focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all duration-300 hover:border-primary/50"
              placeholder="Votre numéro de téléphone"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="group">Groupe</Label>
            <Select
              value={formData.studentGroup}
              onValueChange={(value) =>
                handleInputChange("studentGroup", value)
              }
            >
              <SelectTrigger className="border-border/50 focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all duration-300 hover:border-primary/50">
                <SelectValue placeholder="Sélectionnez votre groupe" />
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

          <Button
            type="submit"
            disabled={isSubmitting}
            className="w-full bg-gradient-primary hover:shadow-glow transition-all duration-300"
          >
            {isSubmitting ? (
              "Envoi en cours..."
            ) : (
              <>
                <Send className="w-4 h-4 mr-2" />
                Envoyer la demande
              </>
            )}
          </Button>
          <div className="mt-4 text-center">
            <a
              href="https://www.isfocasa.com/accueil"
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-primary hover:text-primary/80 underline decoration-dotted"
            >
              Visitez le site officiel de l'ISFO Casa
            </a>
          </div>
        </form>
      </CardContent>
    </Card>
  );
};

export default RequestForm;
