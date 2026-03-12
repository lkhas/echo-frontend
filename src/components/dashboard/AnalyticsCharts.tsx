import {
  PieChart, Pie, Cell,
  Tooltip, ResponsiveContainer, Legend,
} from 'recharts';
import { Observation } from '@/data/mockObservations';

interface AnalyticsChartsProps {
  observations: Observation[];
}

const TYPE_COLORS: Record<string, string> = {
  Environmental: '#10b981',
  Social: '#8b5cf6',
  Health: '#f43f5e',
  Infrastructure: '#f59e0b',
  Education: '#0ea5e9',
};

export const AnalyticsCharts = ({ observations }: AnalyticsChartsProps) => {
  const typeCounts = observations.reduce((acc, o) => {
    acc[o.observationType] = (acc[o.observationType] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const typeData = Object.entries(typeCounts).map(([name, value]) => ({
    name: name.charAt(0).toUpperCase() + name.slice(1),
    value,
  }));

  const COLORS = typeData.map(d => TYPE_COLORS[d.name] || '#94a3b8');

  return (
    <div className="glass-card rounded-2xl p-5 slide-up h-full">
      <h2 className="text-lg font-semibold text-foreground mb-1">By Category</h2>
      <p className="text-sm text-muted-foreground mb-4">Observation type distribution</p>
      <div className="h-[280px]">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={typeData}
              cx="50%"
              cy="50%"
              innerRadius="40%"
              outerRadius="70%"
              paddingAngle={4}
              dataKey="value"
              label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
              labelLine={{ strokeWidth: 1 }}
            >
              {typeData.map((_, i) => (
                <Cell key={i} fill={COLORS[i]} />
              ))}
            </Pie>
            <Tooltip
              contentStyle={{
                borderRadius: '12px',
                border: '1px solid hsl(var(--border))',
                background: 'hsl(var(--card))',
                color: 'hsl(var(--foreground))',
              }}
            />
            <Legend
              verticalAlign="bottom"
              iconType="circle"
              iconSize={10}
              wrapperStyle={{ fontSize: '12px', paddingTop: '12px' }}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};
