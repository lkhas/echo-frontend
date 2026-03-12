import { Calendar, Filter, SlidersHorizontal } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';

interface DashboardFiltersProps {
  dateFrom: string;
  dateTo: string;
  typeFilter: string;
  onDateFromChange: (val: string) => void;
  onDateToChange: (val: string) => void;
  onTypeChange: (val: string) => void;
}

export const DashboardFilters = ({
  dateFrom,
  dateTo,
  typeFilter,
  onDateFromChange,
  onDateToChange,
  onTypeChange,
}: DashboardFiltersProps) => {
  return (
    <div className="glass-card rounded-2xl overflow-hidden slide-up">
      {/* Header */}
      <div className="px-5 py-3 border-b border-border/50 bg-gradient-to-r from-primary/5 to-transparent flex items-center gap-2">
        <div className="p-1.5 rounded-lg bg-primary/10">
          <SlidersHorizontal className="w-4 h-4 text-primary" />
        </div>
        <h3 className="text-sm font-semibold text-foreground">Filters</h3>
      </div>

      {/* Filter Controls */}
      <div className="p-4">
        <div className="flex flex-col sm:flex-row gap-4 items-end">
          <div className="flex-1 min-w-0 w-full">
            <label className="text-xs font-semibold text-muted-foreground mb-2 flex items-center gap-1.5 uppercase tracking-wider">
              <Calendar className="w-3.5 h-3.5 text-primary" /> From
            </label>
            <Input
              type="date"
              value={dateFrom}
              onChange={(e) => onDateFromChange(e.target.value)}
              className="rounded-xl border-border/60 bg-background/80 focus:border-primary/50 transition-colors"
            />
          </div>
          <div className="flex-1 min-w-0 w-full">
            <label className="text-xs font-semibold text-muted-foreground mb-2 flex items-center gap-1.5 uppercase tracking-wider">
              <Calendar className="w-3.5 h-3.5 text-primary" /> To
            </label>
            <Input
              type="date"
              value={dateTo}
              onChange={(e) => onDateToChange(e.target.value)}
              className="rounded-xl border-border/60 bg-background/80 focus:border-primary/50 transition-colors"
            />
          </div>
          <div className="flex-1 min-w-0 w-full">
            <label className="text-xs font-semibold text-muted-foreground mb-2 flex items-center gap-1.5 uppercase tracking-wider">
              <Filter className="w-3.5 h-3.5 text-primary" /> Category
            </label>
            <Select value={typeFilter} onValueChange={onTypeChange}>
              <SelectTrigger className="rounded-xl border-border/60 bg-background/80">
                <SelectValue placeholder="All Types" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="environmental">🌿 Environmental</SelectItem>
                <SelectItem value="social">👥 Social</SelectItem>
                <SelectItem value="health">❤️ Health</SelectItem>
                <SelectItem value="infrastructure">🏗️ Infrastructure</SelectItem>
                <SelectItem value="education">📚 Education</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>
    </div>
  );
};
