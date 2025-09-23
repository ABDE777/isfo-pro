import React, { useState } from "react";
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
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { Save, Mail, Bell, Settings, FileText, User } from "lucide-react";

interface EmailTemplate {
  id: string;
  name: string;
  subject: string;
  body: string;
}

interface NotificationSettings {
  emailNotifications: boolean;
  pushNotifications: boolean;
  dailyDigest: boolean;
}

interface SystemConfig {
  maxRequestsPerDay: number;
  maintenanceMode: boolean;
}

export const SettingsPage = ({ onBack }: { onBack: () => void }) => {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("system");

  // System configuration state
  const [systemConfig, setSystemConfig] = useState<SystemConfig>({
    maxRequestsPerDay: 10,
    maintenanceMode: false,
  });

  // Email templates state
  const [emailTemplates, setEmailTemplates] = useState<EmailTemplate[]>([
    {
      id: "approval",
      name: "Demande approuvée",
      subject: "Votre demande d'attestation a été approuvée",
      body: "Bonjour {{student_name}},\n\nVotre demande d'attestation de scolarité a été approuvée. Vous pouvez maintenant la télécharger depuis votre espace étudiant.\n\nCordialement,\nL'équipe administrative",
    },
    {
      id: "rejection",
      name: "Demande rejetée",
      subject: "Votre demande d'attestation a été rejetée",
      body: "Bonjour {{student_name}},\n\nNous regrettons de vous informer que votre demande d'attestation de scolarité a été rejetée pour la raison suivante : {{rejection_reason}}.\n\nVous pouvez soumettre une nouvelle demande si nécessaire.\n\nCordialement,\nL'équipe administrative",
    },
    {
      id: "reminder",
      name: "Rappel de demande",
      subject: "Rappel : Vous avez une demande d'attestation en attente",
      body: "Bonjour {{student_name}},\n\nCeci est un rappel concernant votre demande d'attestation de scolarité qui est toujours en attente de traitement.\n\nMerci de patienter ou de contacter l'administration si nécessaire.\n\nCordialement,\nL'équipe administrative",
    },
  ]);

  // Notification settings state
  const [notificationSettings, setNotificationSettings] =
    useState<NotificationSettings>({
      emailNotifications: true,
      pushNotifications: true,
      dailyDigest: true,
    });

  // Handle system config changes
  const handleSystemConfigChange = (
    field: keyof SystemConfig,
    value: string | number | boolean
  ) => {
    setSystemConfig((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  // Handle email template changes
  const handleTemplateChange = (
    id: string,
    field: keyof EmailTemplate,
    value: string
  ) => {
    setEmailTemplates((prev) =>
      prev.map((template) =>
        template.id === id ? { ...template, [field]: value } : template
      )
    );
  };

  // Handle notification settings changes
  const handleNotificationChange = (
    field: keyof NotificationSettings,
    value: boolean
  ) => {
    setNotificationSettings((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  // Save settings
  const handleSaveSettings = () => {
    // In a real application, this would save to a database or API
    toast({
      title: "Paramètres enregistrés",
      description:
        "Les paramètres de configuration ont été enregistrés avec succès.",
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
      {/* Header */}
      <div className="bg-white/80 backdrop-blur-sm shadow-lg border-b border-blue-200/50 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-20">
            <div className="flex items-center">
              <div className="bg-gradient-to-br from-blue-600 to-indigo-700 p-3 rounded-xl shadow-lg">
                <Settings className="h-8 w-8 text-white" />
              </div>
              <div className="ml-4">
                <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-700 to-indigo-700 bg-clip-text text-transparent">
                  Paramètres et Configuration
                </h1>
                <p className="text-sm text-slate-600 font-medium">
                  Gérer les paramètres du système, les modèles d'e-mails et les
                  notifications
                </p>
              </div>
            </div>
            <Button
              onClick={onBack}
              variant="outline"
              className="flex items-center gap-2 bg-white/80 hover:bg-red-50 border-red-200 text-red-700 hover:text-red-800 transition-all duration-200"
            >
              <span className="hidden sm:inline">
                Retour au tableau de bord
              </span>
            </Button>
          </div>
        </div>
      </div>

      {/* Navigation Bar */}
      <div className="bg-white/90 backdrop-blur-sm border-b border-slate-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex space-x-8">
            <button
              onClick={onBack}
              className="py-4 px-1 border-b-2 border-transparent text-slate-500 font-medium text-sm transition-colors duration-200 hover:text-slate-700 hover:border-slate-300 flex items-center gap-2"
            >
              <FileText className="h-4 w-4" />
              Gestion des Demandes
            </button>
            <button
              onClick={onBack}
              className="py-4 px-1 border-b-2 border-transparent text-slate-500 font-medium text-sm transition-colors duration-200 hover:text-slate-700 hover:border-slate-300 flex items-center gap-2"
            >
              <User className="h-4 w-4" />
              Gestion des Étudiants
            </button>
            <button className="py-4 px-1 border-b-2 border-blue-500 text-blue-600 font-medium text-sm transition-colors duration-200 flex items-center gap-2 cursor-default">
              <Settings className="h-4 w-4" />
              Paramètres
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Tabs
          value={activeTab}
          onValueChange={setActiveTab}
          className="space-y-6"
        >
          <TabsList className="grid w-full grid-cols-33 bg-white/80 backdrop-blur-sm border border-slate-200">
            <TabsTrigger value="system" className="flex items-center gap-2">
              <Settings className="h-4 w-4" />
              Configuration Système
            </TabsTrigger>
            <TabsTrigger value="email" className="flex items-center gap-2">
              <Mail className="h-4 w-4" />
              Modèles d'E-mails
            </TabsTrigger>
            <TabsTrigger
              value="notifications"
              className="flex items-center gap-2"
            >
              <Bell className="h-4 w-4" />
              Notifications
            </TabsTrigger>
          </TabsList>

          {/* System Configuration Tab */}
          <TabsContent value="system" className="space-y-6">
            <Card className="bg-white/80 backdrop-blur-sm border-slate-200 shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Settings className="h-5 w-5 text-blue-600" />
                  Configuration Système
                </CardTitle>
                <CardDescription>
                  Gérer les paramètres généraux du système
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label
                      htmlFor="maxRequests"
                      className="text-sm font-medium text-slate-700"
                    >
                      Nombre maximum de demandes par jour
                    </Label>
                    <Input
                      id="maxRequests"
                      type="number"
                      min="1"
                      max="100"
                      value={systemConfig.maxRequestsPerDay}
                      onChange={(e) =>
                        handleSystemConfigChange(
                          "maxRequestsPerDay",
                          parseInt(e.target.value) || 1
                        )
                      }
                      className="bg-white border-slate-200"
                    />
                    <p className="text-xs text-slate-500">
                      Limite le nombre de demandes qu'un étudiant peut soumettre
                      par jour
                    </p>
                  </div>

                  {/* Removed timezone selector - only using Morocco time */}

                  <div className="flex items-center justify-between p-4 bg-slate-50 rounded-lg">
                    <div className="space-y-1">
                      <Label className="text-sm font-medium text-slate-700">
                        Mode maintenance
                      </Label>
                      <p className="text-xs text-slate-500">
                        Désactiver temporairement le système pour maintenance
                      </p>
                    </div>
                    <Switch
                      checked={systemConfig.maintenanceMode}
                      onCheckedChange={(checked) =>
                        handleSystemConfigChange("maintenanceMode", checked)
                      }
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Email Templates Tab */}
          <TabsContent value="email" className="space-y-6">
            <Card className="bg-white/80 backdrop-blur-sm border-slate-200 shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Mail className="h-5 w-5 text-blue-600" />
                  Modèles d'E-mails
                </CardTitle>
                <CardDescription>
                  Personnaliser les modèles d'e-mails envoyés aux étudiants
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-8">
                  {emailTemplates.map((template) => (
                    <div
                      key={template.id}
                      className="border border-slate-200 rounded-lg p-6 bg-white"
                    >
                      <div className="space-y-4">
                        <div>
                          <Label className="text-sm font-medium text-slate-700">
                            {template.name}
                          </Label>
                        </div>
                        <div className="space-y-2">
                          <Label
                            htmlFor={`subject-${template.id}`}
                            className="text-xs font-medium text-slate-600"
                          >
                            Sujet
                          </Label>
                          <Input
                            id={`subject-${template.id}`}
                            value={template.subject}
                            onChange={(e) =>
                              handleTemplateChange(
                                template.id,
                                "subject",
                                e.target.value
                              )
                            }
                            className="bg-white border-slate-200"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label
                            htmlFor={`body-${template.id}`}
                            className="text-xs font-medium text-slate-600"
                          >
                            Corps du message
                          </Label>
                          <Textarea
                            id={`body-${template.id}`}
                            value={template.body}
                            onChange={(e) =>
                              handleTemplateChange(
                                template.id,
                                "body",
                                e.target.value
                              )
                            }
                            rows={6}
                            className="bg-white border-slate-200 font-mono text-sm"
                          />
                        </div>
                        <div className="text-xs text-slate-500">
                          Variables disponibles: {"{{student_name}}"},{" "}
                          {"{{rejection_reason}}"}, {"{{request_date}}"}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Notification Settings Tab */}
          <TabsContent value="notifications" className="space-y-6">
            <Card className="bg-white/80 backdrop-blur-sm border-slate-200 shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Bell className="h-5 w-5 text-blue-600" />
                  Paramètres de Notifications
                </CardTitle>
                <CardDescription>
                  Configurer les canaux et types de notifications
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 bg-slate-50 rounded-lg">
                    <div className="space-y-1">
                      <Label className="text-sm font-medium text-slate-700">
                        Notifications par e-mail
                      </Label>
                      <p className="text-xs text-slate-500">
                        Envoyer des notifications par e-mail aux administrateurs
                      </p>
                    </div>
                    <Switch
                      checked={notificationSettings.emailNotifications}
                      onCheckedChange={(checked) =>
                        handleNotificationChange("emailNotifications", checked)
                      }
                    />
                  </div>

                  {/* Removed SMS notifications */}

                  <div className="flex items-center justify-between p-4 bg-slate-50 rounded-lg">
                    <div className="space-y-1">
                      <Label className="text-sm font-medium text-slate-700">
                        Notifications push
                      </Label>
                      <p className="text-xs text-slate-500">
                        Envoyer des notifications push dans l'application
                      </p>
                    </div>
                    <Switch
                      checked={notificationSettings.pushNotifications}
                      onCheckedChange={(checked) =>
                        handleNotificationChange("pushNotifications", checked)
                      }
                    />
                  </div>

                  <div className="flex items-center justify-between p-4 bg-slate-50 rounded-lg">
                    <div className="space-y-1">
                      <Label className="text-sm font-medium text-slate-700">
                        Résumé quotidien
                      </Label>
                      <p className="text-xs text-slate-500">
                        Envoyer un résumé quotidien des activités
                      </p>
                    </div>
                    <Switch
                      checked={notificationSettings.dailyDigest}
                      onCheckedChange={(checked) =>
                        handleNotificationChange("dailyDigest", checked)
                      }
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Save Button */}
        <div className="flex justify-end mt-8">
          <Button
            onClick={handleSaveSettings}
            className="flex items-center gap-2 bg-gradient-to-r from-blue-600 to-indigo-700 hover:from-blue-700 hover:to-indigo-800"
          >
            <Save className="h-4 w-4" />
            Enregistrer les paramètres
          </Button>
        </div>
      </div>
    </div>
  );
};

export default SettingsPage;
