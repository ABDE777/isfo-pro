import { useState } from "react";
import type { AttestationRequest } from "./RequestForm";
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
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Search, Clock, CheckCircle2, XCircle } from "lucide-react";

const RequestTracking = () => {
  const [cin, setCin] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [request, setRequest] = useState<AttestationRequest | null>(null);
  const { toast } = useToast();

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSearching(true);

    try {
      const { data, error } = await supabase
        .from("attestation_requests")
        .select("*")
        .eq("cin", cin)
        .single();

      if (error) throw error;

      if (!data) {
        toast({
          title: "❌ Aucune demande trouvée",
          description:
            "Aucune demande n'a été trouvée avec ce numéro CIN. Vérifiez votre saisie ou soumettez une nouvelle demande.",
          variant: "destructive",
          duration: 5000,
        });
        setRequest(null);
        return;
      }

      setRequest(data);
      toast({
        title: "✅ Demande trouvée",
        description: "Les détails de votre demande ont été trouvés.",
        duration: 3000,
      });
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Une erreur s'est produite lors de la recherche.",
        variant: "destructive",
      });
    } finally {
      setIsSearching(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "approved":
        return "text-green-500";
      case "rejected":
        return "text-red-500";
      default:
        return "text-yellow-500";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "approved":
        return <CheckCircle2 className="w-6 h-6 text-green-500" />;
      case "rejected":
        return <XCircle className="w-6 h-6 text-red-500" />;
      default:
        return <Clock className="w-6 h-6 text-yellow-500" />;
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

  return (
    <Card className="w-full max-w-md shadow-elegant border-0 bg-card/80 backdrop-blur-sm hover:shadow-glow transition-all duration-500">
      <CardHeader className="text-center pb-2">
        <div className="mx-auto mb-4 w-12 h-12 rounded-full bg-gradient-primary flex items-center justify-center transform hover:scale-110 transition-transform duration-300">
          <Search className="w-6 h-6 text-white" />
        </div>
        <CardTitle className="text-2xl font-bold bg-gradient-primary bg-clip-text text-transparent">
          Suivi de Demande
        </CardTitle>
        <CardDescription className="text-muted-foreground">
          Vérifiez l'état de votre demande avec votre CIN
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSearch} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="tracking-cin">Numéro CIN</Label>
            <Input
              id="tracking-cin"
              type="text"
              value={cin}
              onChange={(e) => setCin(e.target.value)}
              required
              className="border-border/50 focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all duration-300"
              placeholder="Entrez votre CIN"
            />
          </div>

          <Button
            type="submit"
            disabled={isSearching}
            className="w-full bg-gradient-primary hover:shadow-glow transition-all duration-300"
          >
            {isSearching ? (
              "Recherche en cours..."
            ) : (
              <>
                <Search className="w-4 h-4 mr-2" />
                Rechercher
              </>
            )}
          </Button>

          {request && (
            <div className="mt-6 space-y-4 border rounded-lg p-4">
              <div className="flex items-center justify-between">
                <span className="font-medium">État de la demande:</span>
                <div className="flex items-center gap-2">
                  {getStatusIcon(request.status)}
                  <span className={getStatusColor(request.status)}>
                    {getStatusText(request.status)}
                  </span>
                </div>
              </div>

              <div className="space-y-2">
                <p>
                  <span className="font-medium">Nom:</span> {request.last_name}
                </p>
                <p>
                  <span className="font-medium">Prénom:</span>{" "}
                  {request.first_name}
                </p>
                <p>
                  <span className="font-medium">Groupe:</span>{" "}
                  {request.student_group}
                </p>
                <p>
                  <span className="font-medium">Date de soumission:</span>{" "}
                  {new Date(request.created_at).toLocaleDateString()}
                </p>
                {request.status === "rejected" && request.rejection_reason && (
                  <p className="text-red-500">
                    <span className="font-medium">Motif du rejet:</span>{" "}
                    {request.rejection_reason}
                  </p>
                )}
              </div>
            </div>
          )}
        </form>
      </CardContent>
    </Card>
  );
};

export default RequestTracking;
