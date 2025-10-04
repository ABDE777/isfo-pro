import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Settings } from "lucide-react";

interface AttestationCounterDialogProps {
  isOpen: boolean;
  onClose: () => void;
  attestationNumber: number;
  onSave: (number: number) => void;
}

export const AttestationCounterDialog: React.FC<AttestationCounterDialogProps> = ({
  isOpen,
  onClose,
  attestationNumber,
  onSave,
}) => {
  const [counterValue, setCounterValue] = useState<string>(attestationNumber.toString());
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const numValue = parseInt(counterValue);
    if (isNaN(numValue) || numValue < 0) {
      toast({
        title: "Erreur",
        description: "Veuillez entrer un nombre valide",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);

    try {
      // Update the global counter
      const { error } = await supabase.rpc("admin_update_attestation_counter", {
        new_counter_value: numValue,
      });

      if (error) throw error;

      toast({
        title: "Succès",
        description: `Le compteur d'attestation a été mis à jour à ${numValue}`,
      });

      onSave(numValue);
      onClose();
    } catch (error) {
      toast({
        title: "Erreur",
        description: (error as Error).message || "Erreur lors de la mise à jour du compteur",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Settings className="w-5 h-5 text-primary" />
            Modifier le Compteur d'Attestation
          </DialogTitle>
          <DialogDescription>
            Entrez le nouveau numéro du compteur d'attestation. Ce numéro sera utilisé pour la prochaine attestation générée.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="counterValue">Numéro du compteur</Label>
            <Input
              id="counterValue"
              type="number"
              min="0"
              placeholder="Entrez le nouveau numéro"
              value={counterValue}
              onChange={(e) => setCounterValue(e.target.value)}
              required
              disabled={isLoading}
              className="text-lg font-bold"
            />
          </div>

          <DialogFooter className="gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={isLoading}
            >
              Annuler
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? "Enregistrement..." : "Enregistrer"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
