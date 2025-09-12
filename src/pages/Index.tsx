import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import RequestForm from "@/components/RequestForm";
import AdminLogin from "@/components/AdminLogin";
import AdminDashboard from "@/components/AdminDashboard";
import academicHero from "@/assets/academic-hero.jpg";
import { UserCog, GraduationCap, FileText } from "lucide-react";
import { useLocation } from "react-router-dom";

const Index = () => {
  const location = useLocation();
  const [currentView, setCurrentView] = useState<
    "student" | "admin-login" | "admin-dashboard"
  >(location.pathname === "/admin" ? "admin-login" : "student");
  const [loggedInAdmin, setLoggedInAdmin] = useState<string | null>(() => {
    // Récupérer l'état de connexion depuis le localStorage au chargement
    const savedAdmin = localStorage.getItem("loggedInAdmin");
    if (savedAdmin && location.pathname === "/admin") {
      return savedAdmin;
    }
    return null;
  });

  // Effet pour mettre à jour le currentView en fonction de l'état de connexion
  useEffect(() => {
    if (loggedInAdmin && location.pathname === "/admin") {
      setCurrentView("admin-dashboard");
    }
  }, [loggedInAdmin, location.pathname]);

  const handleAdminLogin = (profile: string) => {
    setLoggedInAdmin(profile);
    setCurrentView("admin-dashboard");
    // Sauvegarder l'état de connexion dans le localStorage
    localStorage.setItem("loggedInAdmin", profile);
  };

  const handleLogout = () => {
    setLoggedInAdmin(null);
    setCurrentView("student");
    // Supprimer l'état de connexion du localStorage
    localStorage.removeItem("loggedInAdmin");
  };

  if (currentView === "admin-login") {
    return <AdminLogin onLogin={handleAdminLogin} />;
  }

  if (currentView === "admin-dashboard" && loggedInAdmin) {
    return (
      <AdminDashboard adminProfile={loggedInAdmin} onLogout={handleLogout} />
    );
  }

  return (
    <div className="relative min-h-screen overflow-hidden bg-gradient-to-br from-[#1a237e] via-[#283593] to-[#3949ab]">
      {/* Décoration de fond */}
      <div className="absolute inset-0 bg-grid-white/[0.05] bg-[size:60px_60px]" />
      <div className="absolute inset-0 bg-gradient-to-b from-black/10 to-transparent" />

      {/* Points lumineux animés */}
      <div className="absolute inset-0">
        <div className="absolute top-1/4 left-1/4 w-60 h-60 bg-blue-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob" />
        <div className="absolute top-1/3 right-1/3 w-60 h-60 bg-purple-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-2000" />
        <div className="absolute bottom-1/4 right-1/4 w-60 h-60 bg-indigo-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-4000" />
      </div>

      {/* Navigation */}
      <nav className="sticky top-0 z-50 bg-white/10 backdrop-blur-md border-b border-white/10">
        <div className="container mx-auto px-4 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-full bg-white/90 p-1">
                <img
                  src="/favicon.png"
                  alt="ISFO Logo"
                  className="w-full h-full object-contain"
                />
              </div>
              <div>
                <h1 className="text-xl font-bold text-white">ISFO</h1>
                <p className="text-sm text-white/80">
                  Institut Spécialisé de Formation de l'Offshoring Casablanca
                </p>
              </div>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <section className="relative z-10 flex min-h-[calc(100vh-73px)] items-center justify-center p-4">
        <div className="w-full max-w-4xl mx-auto px-4">
          <div className="max-w-md mx-auto">
            <RequestForm />
          </div>
        </div>
      </section>

      {/* Overlay texture */}
      <div className="absolute inset-0 bg-grid-white/[0.02] bg-[size:20px_20px] pointer-events-none" />
    </div>
  );
};

export default Index;
