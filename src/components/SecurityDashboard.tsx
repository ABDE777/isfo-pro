import React, { useState, useEffect, useCallback } from "react";
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
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import {
  Shield,
  AlertTriangle,
  Download,
  Search,
  Calendar,
  MapPin,
  Monitor,
  User,
  Clock,
  Ban,
  CheckCircle2,
  XCircle,
  Users,
  AlertCircle,
  TrendingUp,
  BarChart3,
} from "lucide-react";
import * as XLSX from "xlsx";

interface LoginAudit {
  id: string;
  user_email: string;
  user_type: string;
  ip_address: string;
  city: string;
  country: string;
  device_info: string;
  user_agent: string;
  success: boolean;
  login_timestamp: string;
  created_at: string;
  // Added fields for user names
  student_first_name?: string;
  student_last_name?: string;
  admin_profile_name?: string;
}

interface SuspiciousActivity {
  email: string;
  failedAttempts: number;
  lastAttempt: string;
  ipAddresses: string[];
}

// Add interface for statistics
interface SecurityStats {
  totalLogins: number;
  successfulLogins: number;
  failedLogins: number;
  suspiciousActivities: number;
}

export const SecurityDashboard = () => {
  const [loginLogs, setLoginLogs] = useState<LoginAudit[]>([]);
  const [filteredLogs, setFilteredLogs] = useState<LoginAudit[]>([]);
  const [suspiciousActivities, setSuspiciousActivities] = useState<
    SuspiciousActivity[]
  >([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [dateFilter, setDateFilter] = useState("");
  const [userTypeFilter, setUserTypeFilter] = useState<string>("all");
  const [stats, setStats] = useState<SecurityStats>({
    totalLogins: 0,
    successfulLogins: 0,
    failedLogins: 0,
    suspiciousActivities: 0,
  });
  const { toast } = useToast();

  const filterLogs = useCallback(() => {
    let filtered = [...loginLogs];

    // Filter by search term
    if (searchTerm.trim()) {
      const searchLower = searchTerm.toLowerCase();
      filtered = filtered.filter(
        (log) =>
          log.student_first_name?.toLowerCase().includes(searchLower) ||
          log.student_last_name?.toLowerCase().includes(searchLower) ||
          log.admin_profile_name?.toLowerCase().includes(searchLower) ||
          log.user_email.toLowerCase().includes(searchLower) ||
          log.ip_address.includes(searchLower)
      );
    }

    // Filter by date
    if (dateFilter) {
      const filterDate = new Date(dateFilter);
      filtered = filtered.filter((log) => {
        const logDate = new Date(log.login_timestamp);
        return logDate.toDateString() === filterDate.toDateString();
      });
    }

    // Filter by user type
    if (userTypeFilter !== "all") {
      filtered = filtered.filter((log) => log.user_type === userTypeFilter);
    }

    setFilteredLogs(filtered);
  }, [loginLogs, searchTerm, dateFilter, userTypeFilter]);

  const calculateStats = useCallback(() => {
    const totalLogins = loginLogs.length;
    const successfulLogins = loginLogs.filter((log) => log.success).length;
    const failedLogins = totalLogins - successfulLogins;
    const suspiciousActivitiesCount = suspiciousActivities.length;

    setStats({
      totalLogins,
      successfulLogins,
      failedLogins,
      suspiciousActivities: suspiciousActivitiesCount,
    });
  }, [loginLogs, suspiciousActivities]);

  const fetchLoginLogs = useCallback(async () => {
    try {
      // Fetch login logs with student and admin names using separate queries
      const { data: logsData, error: logsError } = await supabase
        .from("login_audit")
        .select("*")
        .order("login_timestamp", { ascending: false })
        .limit(500);

      if (logsError) throw logsError;

      // Get all unique emails from logs
      const studentEmails = [
        ...new Set(
          (logsData as LoginAudit[])
            .filter((log) => log.user_type === "student")
            .map((log) => log.user_email)
        ),
      ];

      const adminEmails = [
        ...new Set(
          (logsData as LoginAudit[])
            .filter((log) => log.user_type === "admin")
            .map((log) => log.user_email)
        ),
      ];

      // Fetch student names
      const studentNamesMap: Record<
        string,
        { first_name: string; last_name: string }
      > = {};
      if (studentEmails.length > 0) {
        const { data: studentsData, error: studentsError } = await supabase
          .from("students")
          .select("email, first_name, last_name")
          .in("email", studentEmails);

        if (!studentsError && studentsData) {
          (
            studentsData as {
              email: string;
              first_name: string;
              last_name: string;
            }[]
          ).forEach((student) => {
            studentNamesMap[student.email] = {
              first_name: student.first_name,
              last_name: student.last_name,
            };
          });
        }
      }

      // Fetch admin names (using profile names)
      const adminNamesMap: Record<string, string> = {};
      if (adminEmails.length > 0) {
        // Map emails to profile names based on the known mappings
        const emailToProfileName: Record<string, string> = {
          "ibrahim@isfo.ma": "DR IBRAHIM",
          "kenza@isfo.ma": "GS KENZA",
          "ghizlane@isfo.ma": "GS GHIZLANE",
          "abdelmonimtest@isfo.ma": "ABDELMONIM TEST",
          "abdelmonim@isfo.ma": "ABDELMONIM",
        };

        // Create mapping for logs
        adminEmails.forEach((email) => {
          if (emailToProfileName[email]) {
            adminNamesMap[email] = emailToProfileName[email];
          }
        });
      }

      // Process logs with names
      const processedLogs = (logsData as LoginAudit[]).map((log) => ({
        ...log,
        student_first_name:
          log.user_type === "student"
            ? studentNamesMap[log.user_email]?.first_name
            : undefined,
        student_last_name:
          log.user_type === "student"
            ? studentNamesMap[log.user_email]?.last_name
            : undefined,
        admin_profile_name:
          log.user_type === "admin" ? adminNamesMap[log.user_email] : undefined,
      }));

      setLoginLogs(processedLogs);
    } catch (error) {
      console.error("Error fetching login logs:", error);
      toast({
        title: "Erreur",
        description: "Impossible de charger les logs de connexion",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  const detectSuspiciousActivities = useCallback(() => {
    const emailAttempts = new Map<
      string,
      {
        failed: number;
        lastAttempt: string;
        ips: Set<string>;
      }
    >();

    // Analyser les 24 dernières heures
    const last24Hours = new Date();
    last24Hours.setHours(last24Hours.getHours() - 24);

    loginLogs
      .filter((log) => new Date(log.login_timestamp) > last24Hours)
      .forEach((log) => {
        if (!log.success) {
          const current = emailAttempts.get(log.user_email) || {
            failed: 0,
            lastAttempt: log.login_timestamp,
            ips: new Set<string>(),
          };

          current.failed++;
          current.ips.add(log.ip_address);
          if (new Date(log.login_timestamp) > new Date(current.lastAttempt)) {
            current.lastAttempt = log.login_timestamp;
          }

          emailAttempts.set(log.user_email, current);
        }
      });

    // Filtrer les activités suspectes (3+ tentatives échouées)
    const suspicious: SuspiciousActivity[] = [];
    emailAttempts.forEach((value, email) => {
      if (value.failed >= 3) {
        suspicious.push({
          email,
          failedAttempts: value.failed,
          lastAttempt: value.lastAttempt,
          ipAddresses: Array.from(value.ips),
        });
      }
    });

    setSuspiciousActivities(
      suspicious.sort((a, b) => b.failedAttempts - a.failedAttempts)
    );
  }, [loginLogs]);

  const exportToExcel = () => {
    try {
      const excelData = filteredLogs.map((log) => ({
        "Date/Heure": new Date(log.login_timestamp).toLocaleString("fr-FR"),
        Email: log.user_email,
        Type: log.user_type === "student" ? "Étudiant" : "Admin",
        Succès: log.success ? "Oui" : "Non",
        "Adresse IP": log.ip_address,
        Ville: log.city,
        Pays: log.country,
        Appareil: log.device_info,
      }));

      const ws = XLSX.utils.json_to_sheet(excelData);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Logs de connexion");

      const timestamp = new Date().toISOString().split("T")[0];
      XLSX.writeFile(wb, `logs_connexion_${timestamp}.xlsx`);

      toast({
        title: "Export réussi",
        description: "Les logs ont été exportés avec succès",
      });
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Erreur lors de l'export",
        variant: "destructive",
      });
    }
  };

  useEffect(() => {
    fetchLoginLogs();
  }, [fetchLoginLogs]);

  useEffect(() => {
    detectSuspiciousActivities();
    calculateStats();
  }, [loginLogs, detectSuspiciousActivities, calculateStats]);

  useEffect(() => {
    filterLogs();
  }, [loginLogs, searchTerm, dateFilter, userTypeFilter, filterLogs]);

  return (
    <div className="space-y-6">
      {/* Statistics Overview */}
      <div>
        <h2 className="text-3xl font-bold flex items-center gap-2">
          <Shield className="h-8 w-8 text-primary" />
          Tableau de Bord Sécurité
        </h2>
        <p className="text-muted-foreground">
          Surveillance des connexions et détection des activités suspectes
        </p>
      </div>
      

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {/* Total Connections Card */}
        <Card className="bg-gradient-to-br from-blue-500 to-blue-600 text-white border-0 shadow-md hover:shadow-lg transition-all duration-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-blue-100">
              Total Connexions
            </CardTitle>
            <Users className="h-4 w-4 text-blue-200" />
          </CardHeader>
          <CardContent className="pb-2">
            <div className="text-2xl font-bold">{stats.totalLogins}</div>
            <p className="text-xs text-blue-100 mt-1">
              Toutes les tentatives de connexion
            </p>
          </CardContent>
        </Card>

        {/* Successful Logins Card */}
        <Card className="bg-gradient-to-br from-emerald-500 to-emerald-600 text-white border-0 shadow-md hover:shadow-lg transition-all duration-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-emerald-100">
              Connexions Réussies
            </CardTitle>
            <CheckCircle2 className="h-4 w-4 text-emerald-200" />
          </CardHeader>
          <CardContent className="pb-2">
            <div className="text-2xl font-bold">{stats.successfulLogins}</div>
            <p className="text-xs text-emerald-100 mt-1">
              {stats.totalLogins > 0
                ? `${Math.round(
                    (stats.successfulLogins / stats.totalLogins) * 100
                  )}% de réussite`
                : "0% de réussite"}
            </p>
          </CardContent>
        </Card>

        {/* Failed Logins Card */}
        <Card className="bg-gradient-to-br from-amber-500 to-amber-600 text-white border-0 shadow-md hover:shadow-lg transition-all duration-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-amber-100">
              Connexions Échouées
            </CardTitle>
            <XCircle className="h-4 w-4 text-amber-200" />
          </CardHeader>
          <CardContent className="pb-2">
            <div className="text-2xl font-bold">{stats.failedLogins}</div>
            <p className="text-xs text-amber-100 mt-1">Tentatives échouées</p>
          </CardContent>
        </Card>

        {/* Suspicious Activities Card */}
        <Card className="bg-gradient-to-br from-red-500 to-red-600 text-white border-0 shadow-md hover:shadow-lg transition-all duration-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-red-100">
              Activités Suspectes
            </CardTitle>
            <AlertTriangle className="h-4 w-4 text-red-200" />
          </CardHeader>
          <CardContent className="pb-2">
            <div className="text-2xl font-bold">
              {stats.suspiciousActivities}
            </div>
            <p className="text-xs text-red-100 mt-1">Utilisateurs à risque</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters and Actions */}
      <Card className="mb-8 bg-white/80 backdrop-blur-sm border-slate-200 shadow-lg scale-95">
        <CardHeader className="bg-gradient-to-r from-slate-50 to-blue-50 rounded-t-lg">
          <CardTitle className="flex items-center gap-2 text-slate-700">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Search className="h-5 w-5 text-blue-600" />
            </div>
            Filtres et Actions
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
            <div className="space-y-2">
              <Label
                htmlFor="search"
                className="text-sm font-medium text-slate-700"
              >
                Recherche
              </Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
                <Input
                  placeholder="Email, nom, IP..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 bg-white border-slate-200 hover:border-blue-300 transition-colors"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label
                htmlFor="date"
                className="text-sm font-medium text-slate-700"
              >
                Date
              </Label>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
                <Input
                  type="date"
                  value={dateFilter}
                  onChange={(e) => setDateFilter(e.target.value)}
                  className="pl-10 bg-white border-slate-200 hover:border-blue-300 transition-colors"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label
                htmlFor="user-type"
                className="text-sm font-medium text-slate-700"
              >
                Type d'utilisateur
              </Label>
              <Select value={userTypeFilter} onValueChange={setUserTypeFilter}>
                <SelectTrigger className="bg-white border-slate-200 hover:border-blue-300 transition-colors">
                  <SelectValue placeholder="Tous les types" />
                </SelectTrigger>
                <SelectContent className="bg-white border shadow-xl z-50 rounded-lg">
                  <SelectItem value="all">Tous les types</SelectItem>
                  <SelectItem value="student">Étudiants</SelectItem>
                  <SelectItem value="admin">Administrateurs</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label className="text-sm font-medium text-slate-700">
                Actions
              </Label>
              <div className="flex flex-col sm:flex-row gap-2">
                <Button
                  onClick={exportToExcel}
                  variant="outline"
                  className="flex items-center gap-2 bg-green-50 border-green-200 text-green-700 hover:bg-green-100 transition-colors w-full sm:w-auto"
                >
                  <Download className="h-4 w-4" />
                  <span className="hidden sm:inline">Exporter Excel</span>
                </Button>
                <Button
                  onClick={async () => {
                    setLoading(true);
                    await fetchLoginLogs();
                    toast({
                      title: "Actualisation terminée",
                      description: "Les logs de connexion ont été mis à jour",
                    });
                  }}
                  variant="outline"
                  className="flex items-center gap-2 bg-blue-50 border-blue-200 text-blue-700 hover:bg-blue-100 transition-colors w-full sm:w-auto"
                >
                  <TrendingUp className="h-4 w-4" />
                  <span className="hidden sm:inline">Actualiser</span>
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Login Logs Table */}
      <Card className="bg-white/80 backdrop-blur-sm border-slate-200 shadow-lg scale-95">
        <CardHeader className="bg-gradient-to-r from-slate-50 to-blue-50 rounded-t-lg">
          <CardTitle className="flex items-center gap-2 text-slate-700">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Shield className="h-5 w-5 text-blue-600" />
            </div>
            Logs de Connexion ({filteredLogs.length})
          </CardTitle>
          <CardDescription className="text-slate-600">
            Historique des tentatives de connexion
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-6">
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow className="bg-gradient-to-r from-slate-50 to-blue-50 hover:bg-slate-50">
                  <TableHead className="font-semibold text-slate-700">
                    Date/Heure
                  </TableHead>
                  <TableHead className="font-semibold text-slate-700">
                    Utilisateur
                  </TableHead>
                  <TableHead className="font-semibold text-slate-700">
                    Type
                  </TableHead>
                  <TableHead className="font-semibold text-slate-700">
                    Statut
                  </TableHead>
                  <TableHead className="font-semibold text-slate-700">
                    IP
                  </TableHead>
                  <TableHead className="font-semibold text-slate-700">
                    Localisation
                  </TableHead>
                  <TableHead className="font-semibold text-slate-700">
                    Appareil
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8">
                      <div className="flex items-center justify-center">
                        <div className="animate-spin rounded-full h-6 w-6 border-2 border-blue-200 border-t-blue-600 mr-2"></div>
                        <span>Chargement des données...</span>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : filteredLogs.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8">
                      <div className="flex flex-col items-center justify-center">
                        <AlertCircle className="h-12 w-12 text-slate-300 mb-4" />
                        <h3 className="text-lg font-medium text-slate-700 mb-1">
                          Aucun log trouvé
                        </h3>
                        <p className="text-slate-500">
                          Aucune activité de connexion ne correspond aux filtres
                          sélectionnés
                        </p>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredLogs.map((log) => (
                    <TableRow
                      key={log.id}
                      className="hover:bg-blue-50/50 transition-colors duration-200"
                    >
                      <TableCell className="font-medium">
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4 text-slate-400" />
                          {new Date(log.login_timestamp).toLocaleString(
                            "fr-FR"
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <User className="h-4 w-4 text-slate-400" />
                          <div>
                            <div className="font-medium">
                              {log.user_type === "student"
                                ? `${log.student_first_name || ""} ${
                                    log.student_last_name || ""
                                  }`.trim() || log.user_email
                                : log.admin_profile_name || log.user_email}
                            </div>
                            <div className="text-sm text-slate-500">
                              {log.user_email}
                            </div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={
                            log.user_type === "student"
                              ? "default"
                              : "secondary"
                          }
                          className={
                            log.user_type === "student"
                              ? "bg-blue-100 text-blue-800"
                              : "bg-purple-100 text-purple-800"
                          }
                        >
                          {log.user_type === "student" ? "Étudiant" : "Admin"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {log.success ? (
                            <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                          ) : (
                            <XCircle className="h-4 w-4 text-red-500" />
                          )}
                          <span
                            className={
                              log.success ? "text-emerald-600" : "text-red-600"
                            }
                          >
                            {log.success ? "Réussi" : "Échoué"}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Monitor className="h-4 w-4 text-slate-400" />
                          {log.ip_address}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <MapPin className="h-4 w-4 text-slate-400" />
                          {log.city && log.country
                            ? `${log.city}, ${log.country}`
                            : "Inconnu"}
                        </div>
                      </TableCell>
                      <TableCell className="text-sm text-slate-600 max-w-xs truncate">
                        {log.device_info}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default SecurityDashboard;
