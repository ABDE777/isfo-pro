import { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  validateStudent,
  STUDENTS,
  findSimilarStudents,
} from "@/data/students";
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
import { TablesInsert } from "@/integrations/supabase/types";
import { useToast } from "@/hooks/use-toast";
import { GraduationCap, Send, Download, Clock, XCircle } from "lucide-react";
import RequestTracking from "./RequestTracking";
import { jsPDF } from "jspdf";

// Grouper et trier les groupes par type
const STUDENT_GROUPS = [
  // DEVOWFS Groups
  "DEVOWFS201",
  "DEVOWFS202",
  "DEVOWFS203",
  "DEVOWFS204",
  // IDOSR Groups
  "IDOSR201",
  "IDOSR202",
  "IDOSR203",
  "IDOSR204",
  // DEV Groups
  "DEV101",
  "DEV102",
  "DEV103",
  "DEV104",
  "DEV105",
  "DEV106",
  "DEV107",
  // ID Groups
  "ID101",
  "ID102",
  "ID103",
  "ID104",
];

interface FormData {
  firstName: string;
  lastName: string;
  cin: string;
  phone: string;
  studentGroup: string;
  selectedStudent: string;
  isAdmin?: boolean; // Ajout de la propriété isAdmin
}

// Interface pour les demandes d'attestation
export interface AttestationRequest {
  id: string;
  first_name: string;
  last_name: string;
  cin: string;
  phone: string;
  student_group: (typeof STUDENT_GROUPS)[number];
  status: "pending" | "approved" | "rejected";
  created_at: string;
  updated_at?: string;
  rejection_reason?: string;
}

const RequestForm = () => {
  const handleExportPDF = async (
    status: "approved" | "pending" | "rejected"
  ) => {
    try {
      // Fetch students based on status
      const { data: requests } = await supabase
        .from("attestation_requests")
        .select("*")
        .eq("status", status);

      if (!requests || requests.length === 0) {
        toast({
          title: "Aucune donnée",
          description: `Aucune demande ${
            status === "approved"
              ? "approuvée"
              : status === "pending"
              ? "en attente"
              : "rejetée"
          } trouvée.`,
          variant: "destructive",
        });
        return;
      }

      // Create PDF
      const doc = new jsPDF();

      // Add title
      const title =
        status === "approved"
          ? "Demandes Approuvées"
          : status === "pending"
          ? "Demandes en Attente"
          : "Demandes Rejetées";
      doc.setFontSize(16);
      doc.text(title, 20, 20);

      // Add date
      doc.setFontSize(12);
      doc.text(`Date: ${new Date().toLocaleDateString()}`, 20, 30);

      // Add table headers
      doc.setFontSize(12);
      const headers = [
        "Nom",
        "Prénom",
        "Groupe",
        "CIN",
        "Téléphone",
        "Date de demande",
      ];
      let y = 40;

      // Add data
      requests.forEach((request, index) => {
        if (y > 270) {
          // Check if we need a new page
          doc.addPage();
          y = 20;
        }

        doc.text(
          [
            request.last_name,
            request.first_name,
            request.student_group,
            request.cin,
            request.phone,
            new Date(request.created_at).toLocaleDateString(),
          ].map((item) => item?.toString() || ""),
          20,
          y
        );

        y += 10;
      });

      // Save PDF
      doc.save(
        `attestations_${status}_${new Date().toISOString().split("T")[0]}.pdf`
      );

      toast({
        title: "Export réussi",
        description: "Le PDF a été généré avec succès.",
      });
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Une erreur s'est produite lors de l'export du PDF.",
        variant: "destructive",
      });
    }
  };
  const [formData, setFormData] = useState<FormData>({
    firstName: "",
    lastName: "",
    cin: "",
    phone: "",
    studentGroup: "",
    selectedStudent: "",
  });

  const [submittedStudents, setSubmittedStudents] = useState<string[]>([]);

  // Fetch submitted students when component mounts
  useEffect(() => {
    const fetchSubmittedStudents = async () => {
      const { data: existingRequests } = await supabase
        .from("attestation_requests")
        .select("first_name, last_name");

      if (existingRequests) {
        // Create all possible combinations of the names
        const names = existingRequests
          .map((request) => {
            const firstName = request.first_name.trim().toUpperCase();
            const lastName = request.last_name.trim().toUpperCase();
            // Create different combinations in case names were entered in different orders
            return [
              `${lastName} ${firstName}`,
              `${firstName} ${lastName}`,
              // Also store the complete name for exact matching
              `${lastName} ${firstName}`.split(" ").sort().join(" "),
              `${firstName} ${lastName}`.split(" ").sort().join(" "),
            ];
          })
          .flat();
        setSubmittedStudents(names);
      }
    };

    fetchSubmittedStudents();
  }, []);

  // Get all students with their submission status
  const allStudentsWithStatus = STUDENTS.map((student) => {
    const normalizedName = student.fullName.trim().toUpperCase();
    const sortedNameParts = normalizedName.split(" ").sort().join(" ");

    return {
      ...student,
      hasSubmitted: submittedStudents.some(
        (submittedName) =>
          submittedName === normalizedName ||
          submittedName === sortedNameParts ||
          normalizedName
            .split(" ")
            .every((part) => submittedName.includes(part))
      ),
    };
  });

  // Check which groups are fully submitted
  const groupSubmissionStatus = STUDENT_GROUPS.reduce((acc, group) => {
    const groupStudents = allStudentsWithStatus.filter(
      (s) => s.group === group
    );
    acc[group] = groupStudents.every((student) => student.hasSubmitted);
    return acc;
  }, {} as Record<string, boolean>);

  // Get students for selected group
  const groupStudents = allStudentsWithStatus.filter(
    (student) => student.group === formData.studentGroup
  );
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  const handleInputChange = (field: keyof FormData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  // Format phone number to ensure it starts with +212
  const formatPhoneNumber = (phone: string): string => {
    // Remove any spaces, dashes, or other characters
    const cleaned = phone.replace(/\D/g, "");

    // If it already starts with 212, add the +
    if (cleaned.startsWith("212")) {
      return "+" + cleaned;
    }

    // If it starts with 0, replace it with +212
    if (cleaned.startsWith("0")) {
      return "+212" + cleaned.substring(1);
    }

    // Otherwise, add +212 to the number
    return "+212" + cleaned;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      // Format the phone number
      const formattedPhone = formatPhoneNumber(formData.phone);
      // Si la saisie est manuelle (pas de sélection dans la liste déroulante)
      if (!formData.selectedStudent) {
        // Vérifier si le nom saisi correspond à un étudiant de la liste
        const enteredFullName = `${formData.lastName
          .trim()
          .toUpperCase()} ${formData.firstName.trim().toUpperCase()}`;
        const matchingStudent = groupStudents.find((student) => {
          const normalizedStudentName = student.fullName.trim().toUpperCase();
          return (
            normalizedStudentName === enteredFullName ||
            normalizedStudentName ===
              `${formData.firstName.trim().toUpperCase()} ${formData.lastName
                .trim()
                .toUpperCase()}`
          );
        });

        if (!matchingStudent) {
          toast({
            title: "⚠️ Validation Impossible",
            description:
              "Nous ne trouvons pas votre nom dans notre base de données.\n\n" +
              "1. Vérifiez que vous avez choisi le bon groupe\n" +
              "2. Utilisez la liste déroulante pour sélectionner votre nom\n" +
              "3. Si votre nom n'apparaît pas, contactez l'administration",
            variant: "destructive",
            duration: 10000,
          });
          setIsSubmitting(false);
          return;
        }

        if (matchingStudent.hasSubmitted) {
          toast({
            title: "Demande impossible",
            description: "Vous avez déjà soumis une demande d'attestation.",
            variant: "destructive",
            duration: 7000,
          });
          setIsSubmitting(false);
          return;
        }
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

      const insertData: TablesInsert<"attestation_requests"> = {
        first_name: formData.firstName.trim().toUpperCase(),
        last_name: formData.lastName.trim().toUpperCase(),
        cin: formData.cin,
        phone: formattedPhone,
        student_group: formData.studentGroup as (typeof STUDENT_GROUPS)[number],
        status: "pending",
        created_at: new Date().toISOString(),
      };

      const { error } = await supabase
        .from("attestation_requests")
        .insert(insertData);

      if (error) throw error;

      toast({
        title: "✅ Demande Envoyée avec Succès",
        description:
          "Votre demande d'attestation a été enregistrée.\n\n" +
          "• Numéro de téléphone enregistré: " +
          formattedPhone +
          "\n" +
          "• Un SMS de confirmation vous sera envoyé\n" +
          "• Vous pouvez suivre l'état de votre demande avec votre CIN",
        duration: 10000,
      });

      // Reset form
      setFormData({
        firstName: "",
        lastName: "",
        cin: "",
        phone: "",
        studentGroup: "",
        selectedStudent: "",
        isAdmin: formData.isAdmin, // Conserver la valeur de isAdmin
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
    <div className="container mx-auto p-4 space-y-6">
      <div className="w-full max-w-4xl mx-auto">
        <Card className="w-full shadow-elegant border-0 bg-card/80 backdrop-blur-sm hover:shadow-glow transition-all duration-500 animate-fade-in">
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
            <form
              onSubmit={handleSubmit}
              className="space-y-4 animate-fade-in-up"
            >
              <div className="space-y-2">
                <Label htmlFor="group">Groupe</Label>
                <Select
                  value={formData.studentGroup}
                  onValueChange={(value) => {
                    handleInputChange("studentGroup", value);
                    handleInputChange("selectedStudent", ""); // Reset selected student when group changes
                    handleInputChange("firstName", ""); // Reset first name
                    handleInputChange("lastName", ""); // Reset last name
                  }}
                >
                  <SelectTrigger className="border-border/50 focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all duration-300 hover:border-primary/50">
                    <SelectValue placeholder="Sélectionnez votre groupe" />
                  </SelectTrigger>
                  <SelectContent>
                    {STUDENT_GROUPS.map((group) => (
                      <SelectItem
                        key={group}
                        value={group}
                        disabled={groupSubmissionStatus[group]}
                      >
                        {group}
                        {groupSubmissionStatus[group] &&
                          " (Tous les étudiants ont soumis)"}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {formData.studentGroup && (
                <div className="space-y-2">
                  <Label htmlFor="student">Étudiant</Label>
                  <Select
                    value={formData.selectedStudent}
                    onValueChange={(value) => {
                      const student = groupStudents.find(
                        (s) => s.fullName === value
                      );
                      if (student) {
                        const nameParts = student.fullName.split(" ");
                        // Handle cases where name might have more than 2 parts
                        const lastName = nameParts[0];
                        const firstName = nameParts.slice(1).join(" ");
                        handleInputChange("selectedStudent", value);
                        handleInputChange("firstName", firstName);
                        handleInputChange("lastName", lastName);
                      }
                    }}
                  >
                    <SelectTrigger className="border-border/50 focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all duration-300 hover:border-primary/50">
                      <SelectValue placeholder="Sélectionnez votre nom" />
                    </SelectTrigger>
                    <SelectContent>
                      {groupStudents.map((student) => (
                        <SelectItem
                          key={student.cef}
                          value={student.fullName}
                          disabled={student.hasSubmitted}
                        >
                          {student.fullName}
                          {student.hasSubmitted && " (Déjà soumis)"}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="firstName">Prénom</Label>
                <Input
                  id="firstName"
                  type="text"
                  value={formData.firstName}
                  onChange={(e) => {
                    handleInputChange("firstName", e.target.value);
                    handleInputChange("selectedStudent", ""); // Reset selected student when typing manually
                  }}
                  required
                  disabled={!!formData.selectedStudent}
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
                  onChange={(e) => {
                    handleInputChange("lastName", e.target.value);
                    handleInputChange("selectedStudent", ""); // Reset selected student when typing manually
                  }}
                  required
                  disabled={!!formData.selectedStudent}
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

              <Button
                type="submit"
                disabled={isSubmitting}
                className="w-full bg-gradient-primary hover:shadow-glow transition-all duration-300 mb-4"
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

              {/* Boutons d'export PDF pour l'admin */}
              {formData.isAdmin && (
                <div className="space-y-2">
                  <Button
                    type="button"
                    onClick={() => handleExportPDF("approved")}
                    className="w-full bg-green-600 hover:bg-green-700"
                  >
                    <Download className="w-4 h-4 mr-2" />
                    Télécharger PDF - Demandes Approuvées
                  </Button>

                  <Button
                    type="button"
                    onClick={() => handleExportPDF("pending")}
                    className="w-full bg-yellow-600 hover:bg-yellow-700"
                  >
                    <Clock className="w-4 h-4 mr-2" />
                    Télécharger PDF - Demandes en Attente
                  </Button>

                  <Button
                    type="button"
                    onClick={() => handleExportPDF("rejected")}
                    className="w-full bg-red-600 hover:bg-red-700"
                  >
                    <XCircle className="w-4 h-4 mr-2" />
                    Télécharger PDF - Demandes Rejetées
                  </Button>
                </div>
              )}

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
      </div>
      {/* Ajout du composant de suivi */}
      <div className="w-full max-w-4xl mx-auto">
        <RequestTracking />
      </div>
    </div>
  );
};

export default RequestForm;
