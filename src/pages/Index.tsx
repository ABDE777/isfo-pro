import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { NewRequestForm } from "@/components/NewRequestForm";
import AdminLogin from "@/components/AdminLogin";
import AdminDashboard from "@/components/AdminDashboard";
import { GraduationCap } from "lucide-react";
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
    <div className="relative min-h-screen overflow-hidden bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      {/* Animated background elements */}
      <div className="absolute inset-0">
        <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(ellipse_at_center,rgba(120,119,198,0.1)_0%,rgba(255,255,255,0)_70%)]"></div>
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-500 rounded-full mix-blend-soft-light filter blur-3xl opacity-30 animate-pulse"></div>
        <div className="absolute top-3/4 right-1/4 w-96 h-96 bg-purple-500 rounded-full mix-blend-soft-light filter blur-3xl opacity-30 animate-pulse animation-delay-2000"></div>
        <div className="absolute bottom-1/4 left-1/3 w-96 h-96 bg-indigo-500 rounded-full mix-blend-soft-light filter blur-3xl opacity-30 animate-pulse animation-delay-4000"></div>
      </div>

      {/* Grid overlay */}
      <div className="absolute inset-0 bg-[linear-gradient(rgba(120,119,198,0.3)_1px,transparent_1px),linear-gradient(90deg,rgba(120,119,198,0.3)_1px,transparent_1px)] bg-[size:20px_20px]"></div>

      {/* Navigation */}
      <nav className="sticky top-0 z-50 bg-white/10 backdrop-blur-lg border-b border-white/20">
        <div className="container mx-auto px-4 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-500 to-purple-600 p-1 shadow-lg transform transition-transform duration-300 hover:scale-105">
                <div className="bg-white rounded-xl w-full h-full flex items-center justify-center">
                  <GraduationCap className="w-7 h-7 text-blue-600" />
                </div>
              </div>
              <div>
                <h1 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-300 to-purple-300">
                  ISFO
                </h1>
                <p className="text-sm text-white/80 font-medium">
                  Institut Spécialisé de Formation de l'Offshoring Casablanca
                </p>
              </div>
            </div>
            {/* Removed admin button from student interface */}
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <section className="relative z-10 flex min-h-[calc(100vh-80px)] items-center justify-center p-4">
        <div className="w-full max-w-6xl mx-auto px-4">
          <div className="max-w-md mx-auto">
            <NewRequestForm />
          </div>
        </div>
      </section>

      {/* Floating particles */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {[...Array(20)].map((_, i) => (
          <div
            key={i}
            className="absolute rounded-full bg-white/10"
            style={{
              top: `${Math.random() * 100}%`,
              left: `${Math.random() * 100}%`,
              width: `${Math.random() * 10 + 2}px`,
              height: `${Math.random() * 10 + 2}px`,
              animation: `float ${
                Math.random() * 10 + 10
              }s infinite ease-in-out`,
              animationDelay: `${Math.random() * 5}s`,
            }}
          ></div>
        ))}
      </div>

      {/* Pulsing border effect */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute inset-0 border border-white/5 rounded-xl animate-pulse"></div>
      </div>
    </div>
  );
};

export default Index;
