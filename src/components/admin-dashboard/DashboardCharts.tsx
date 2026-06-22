import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  LineChart, 
  Line,
  PieChart,
  Pie,
  Cell,
  Legend
} from 'recharts';

const COLORS = ['#8884d8', '#82ca9d', '#ffc658', '#ff8042', '#0088FE', '#00C49F', '#FFBB28', '#FF8042'];

interface ChartCardProps {
  title: string;
  children: React.ReactElement;
}

const ChartCard = ({ title, children }: ChartCardProps) => (
  <Card className="bg-white/60 backdrop-blur-md border-white/40 shadow-sm">
    <CardHeader>
      <CardTitle className="text-sm font-black uppercase tracking-widest text-muted-foreground">{title}</CardTitle>
    </CardHeader>
    <CardContent className="h-[300px]">
      <ResponsiveContainer width="100%" height="100%">
        {children}
      </ResponsiveContainer>
    </CardContent>
  </Card>
);

interface DashboardChartsProps {
  data: {
    usersByType: any[];
    eventsByNeighborhood: any[];
    eventsByPeriod: any[];
    placesByFavorites: any[];
    artistsByFavorites: any[];
    eventsByCategory: any[];
    eventStatusFunnel: any[];
    newUsersEvolution: any[];
    neighborhoodComparison: any[];
  };
}

export function DashboardCharts({ data }: DashboardChartsProps) {
  const usersByType = data.usersByType || [];
  const eventsByNeighborhood = data.eventsByNeighborhood || [];
  const eventsByPeriod = data.eventsByPeriod || [];
  const eventsByCategory = data.eventsByCategory || [];
  const eventStatusFunnel = data.eventStatusFunnel || [];
  const newUsersEvolution = data.newUsersEvolution || [];
  const neighborhoodComparison = data.neighborhoodComparison || [];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      <ChartCard title="Eventos vs Favoritos por Bairro">
        <BarChart data={neighborhoodComparison}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} />
          <XAxis dataKey="name" fontSize={10} />
          <YAxis fontSize={10} />
          <Tooltip />
          <Legend />
          <Bar dataKey="events" name="Eventos" fill="#8884d8" radius={[4, 4, 0, 0]} />
          <Bar dataKey="favorites" name="Favoritos" fill="#ffc658" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ChartCard>

      <ChartCard title="Usuários por Tipo">
        <PieChart>
          <Pie
            data={usersByType}
            innerRadius={60}
            outerRadius={80}
            paddingAngle={5}
            dataKey="value"
          >
            {usersByType.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
            ))}
          </Pie>
          <Tooltip />
          <Legend />
        </PieChart>
      </ChartCard>

      <ChartCard title="Eventos por Bairro (Top 10)">
        <BarChart data={eventsByNeighborhood} layout="vertical">
          <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} />
          <XAxis type="number" hide />
          <YAxis dataKey="name" type="category" width={100} fontSize={10} />
          <Tooltip />
          <Bar dataKey="value" fill="#8884d8" radius={[0, 4, 4, 0]} />
        </BarChart>
      </ChartCard>

      <ChartCard title="Evolução de Novos Usuários">
        <LineChart data={newUsersEvolution}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} />
          <XAxis dataKey="name" fontSize={10} />
          <YAxis fontSize={10} />
          <Tooltip />
          <Line type="monotone" dataKey="value" stroke="#82ca9d" strokeWidth={2} dot={{ r: 4 }} />
        </LineChart>
      </ChartCard>

      <ChartCard title="Eventos por Categoria">
        <PieChart>
          <Pie
            data={eventsByCategory}
            cx="50%"
            cy="50%"
            labelLine={false}
            outerRadius={80}
            fill="#8884d8"
            dataKey="value"
          >
            {eventsByCategory.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
            ))}
          </Pie>
          <Tooltip />
          <Legend />
        </PieChart>
      </ChartCard>

      <ChartCard title="Status dos Eventos">
        <BarChart data={eventStatusFunnel}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} />
          <XAxis dataKey="name" fontSize={10} />
          <YAxis fontSize={10} />
          <Tooltip />
          <Bar dataKey="value" radius={[4, 4, 0, 0]}>
            {eventStatusFunnel.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.name === 'Aprovado' ? '#10b981' : entry.name === 'Pendente' ? '#f59e0b' : '#ef4444'} />
            ))}
          </Bar>
        </BarChart>
      </ChartCard>

      <ChartCard title="Eventos por Período">
        <BarChart data={eventsByPeriod}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} />
          <XAxis dataKey="name" fontSize={10} />
          <YAxis fontSize={10} />
          <Tooltip />
          <Bar dataKey="value" fill="#6366f1" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ChartCard>
    </div>
  );
}
