import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Mail, Copy } from "lucide-react";

interface EmailModalProps {
  isOpen: boolean;
  email: string;
  subject: string;
  message: string;
  onClose: () => void;
  onCopy: () => void;
  onOpenClient: () => void;
}

export const EmailModal = ({
  isOpen,
  email,
  subject,
  message,
  onClose,
  onCopy,
  onOpenClient,
}: EmailModalProps) => {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Mail className="h-5 w-5" />
            Email de notification
          </DialogTitle>
          <DialogDescription>
            Le statut a été mis à jour. Envoyez l'email de notification à l'étudiant.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <Label>À</Label>
            <Input value={email} disabled />
          </div>

          <div>
            <Label>Objet</Label>
            <Input value={subject} disabled />
          </div>

          <div>
            <Label>Message</Label>
            <Textarea value={message} disabled rows={10} className="font-mono text-sm" />
          </div>
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={onCopy}>
            <Copy className="h-4 w-4 mr-2" />
            Copier
          </Button>
          <Button onClick={onOpenClient}>
            <Mail className="h-4 w-4 mr-2" />
            Ouvrir client email
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
