import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Search, Filter as FilterIcon } from "lucide-react";

interface RequestFiltersProps {
  searchTerm: string;
  selectedGroup: string;
  selectedStatus: string;
  dateFilter: string;
  hourFilter: string;
  studentGroups: string[];
  onSearchChange: (value: string) => void;
  onGroupChange: (value: string) => void;
  onStatusChange: (value: string) => void;
  onDateChange: (value: string) => void;
  onHourChange: (value: string) => void;
}

export const RequestFilters = ({
  searchTerm,
  selectedGroup,
  selectedStatus,
  dateFilter,
  hourFilter,
  studentGroups,
  onSearchChange,
  onGroupChange,
  onStatusChange,
  onDateChange,
  onHourChange,
}: RequestFiltersProps) => {
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 text-muted-foreground">
        <FilterIcon className="h-4 w-4" />
        <span className="text-sm font-medium">Filtres de recherche</span>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <div>
          <Label htmlFor="search">Recherche</Label>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              id="search"
              placeholder="Nom, CIN..."
              value={searchTerm}
              onChange={(e) => onSearchChange(e.target.value)}
              className="pl-9"
            />
          </div>
        </div>

        <div>
          <Label htmlFor="group">Groupe</Label>
          <Select value={selectedGroup} onValueChange={onGroupChange}>
            <SelectTrigger id="group">
              <SelectValue placeholder="Tous les groupes" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tous les groupes</SelectItem>
              {studentGroups.map((group) => (
                <SelectItem key={group} value={group}>
                  {group}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label htmlFor="status">Statut</Label>
          <Select value={selectedStatus} onValueChange={onStatusChange}>
            <SelectTrigger id="status">
              <SelectValue placeholder="Tous les statuts" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tous les statuts</SelectItem>
              <SelectItem value="pending">En attente</SelectItem>
              <SelectItem value="approved">Approuvé</SelectItem>
              <SelectItem value="rejected">Rejeté</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label htmlFor="date">Date</Label>
          <Input
            id="date"
            type="date"
            value={dateFilter}
            onChange={(e) => onDateChange(e.target.value)}
          />
        </div>

        <div>
          <Label htmlFor="hour">Période</Label>
          <Select value={hourFilter} onValueChange={onHourChange}>
            <SelectTrigger id="hour">
              <SelectValue placeholder="Toutes les périodes" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Toutes les périodes</SelectItem>
              <SelectItem value="morning">Matin (6h-12h)</SelectItem>
              <SelectItem value="afternoon">Après-midi (12h-18h)</SelectItem>
              <SelectItem value="evening">Soirée (18h-24h)</SelectItem>
              <SelectItem value="night">Nuit (0h-6h)</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
    </div>
  );
};
