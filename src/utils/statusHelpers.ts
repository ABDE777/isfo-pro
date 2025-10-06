import { Clock, Check, X } from "lucide-react";

export const getStatusBadgeVariant = (status: string) => {
  switch (status) {
    case "pending":
      return "outline";
    case "approved":
      return "default";
    case "rejected":
      return "destructive";
    default:
      return "secondary";
  }
};

export const getStatusIcon = (status: string) => {
  switch (status) {
    case "pending":
      return Clock;
    case "approved":
      return Check;
    case "rejected":
      return X;
    default:
      return null;
  }
};

export const getStatusColor = (status: string) => {
  switch (status) {
    case "pending":
      return "bg-amber-50 text-amber-700 border-amber-200";
    case "approved":
      return "bg-emerald-50 text-emerald-700 border-emerald-200";
    case "rejected":
      return "bg-red-50 text-red-700 border-red-200";
    default:
      return "bg-slate-50 text-slate-700 border-slate-200";
  }
};

export const getStatusLabel = (status: string) => {
  switch (status) {
    case "pending":
      return "En attente";
    case "approved":
      return "Approuvé";
    case "rejected":
      return "Rejeté";
    default:
      return status;
  }
};
