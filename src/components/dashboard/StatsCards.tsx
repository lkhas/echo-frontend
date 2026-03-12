import { FileText, Camera, Mic } from 'lucide-react';

// Define the shape of the data directly here so you don't rely on mockObservations
interface Observation {
  imageCount: number;
  hasAudio: boolean;
  [key: string]: any; 
}

interface StatsCardsProps {
  observations: Observation[];
}

export const StatsCards = ({ observations }: StatsCardsProps) => {
  const total = observations.length;
  const totalPhotos = observations.reduce((sum, o) => sum + (o.imageCount || 0), 0);
  const totalAudio = observations.filter(o => o.hasAudio).length;

  const stats = [
    {
      label: 'Total Reports',
      value: total,
      icon: FileText,
      gradient: 'from-primary/20 to-primary/5',
      iconBg: 'bg-primary/15 text-primary',
    },
    {
      label: 'Photos',
      value: totalPhotos,
      icon: Camera,
      gradient: 'from-accent/40 to-accent/10',
      iconBg: 'bg-accent text-accent-foreground',
    },
    {
      label: 'Audio Recordings',
      value: totalAudio,
      icon: Mic,
      gradient: 'from-warning/15 to-warning/5',
      iconBg: 'bg-warning/15 text-warning',
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
      {stats.map((stat) => (
        <div
          key={stat.label}
          className={`glass-card rounded-2xl p-5 slide-up bg-gradient-to-br ${stat.gradient} hover:shadow-xl transition-shadow duration-300`}
        >
          <div className="flex items-center gap-4">
            <div className={`p-3 rounded-xl ${stat.iconBg}`}>
              <stat.icon className="w-6 h-6" />
            </div>
            <div>
              <p className="text-3xl font-bold text-foreground">{stat.value}</p>
              <p className="text-sm text-muted-foreground font-medium">{stat.label}</p>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};