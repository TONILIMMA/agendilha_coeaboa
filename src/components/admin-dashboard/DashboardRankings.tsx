import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Trophy, Star, MapPin, Building2, Music } from "lucide-react";

interface RankingItem {
  name: string;
  count: number;
  subtext?: string;
  type?: string;
}

interface RankingListProps {
  title: string;
  icon: any;
  items: RankingItem[];
}

const RankingList = ({ title, icon: Icon, items }: RankingListProps) => (
  <Card className="bg-white/60 backdrop-blur-md border-white/40 shadow-sm">
    <CardHeader className="pb-2">
      <CardTitle className="text-sm font-black uppercase tracking-widest text-muted-foreground flex items-center gap-2">
        <Icon className="h-4 w-4" />
        {title}
      </CardTitle>
    </CardHeader>
    <CardContent className="space-y-2">
      {items.length === 0 && (
        <p className="text-xs text-muted-foreground py-4 text-center">Sem dados disponíveis.</p>
      )}
      {items.map((item, i) => (
        <div key={i} className="flex items-center justify-between p-2 rounded-lg bg-white/40 border border-white/50">
          <div className="flex items-center gap-3 min-w-0">
            <div className={`h-6 w-6 rounded-full flex items-center justify-center font-bold text-[10px] ${
              i === 0 ? "bg-amber-100 text-amber-700" : 
              i === 1 ? "bg-slate-100 text-slate-700" :
              i === 2 ? "bg-orange-50 text-orange-700" :
              "bg-muted text-muted-foreground"
            }`}>
              {i + 1}
            </div>
            <div className="min-w-0">
              <div className="text-sm font-bold text-foreground truncate">{item.name}</div>
              {item.subtext && <div className="text-[10px] text-muted-foreground truncate">{item.subtext}</div>}
            </div>
          </div>
          <div className="text-right shrink-0">
            <div className="text-sm font-black text-primary">{item.count}</div>
          </div>
        </div>
      ))}
    </CardContent>
  </Card>
);

interface DashboardRankingsProps {
  data: {
    topEvents: RankingItem[];
    topEventsByViews: RankingItem[];
    topNeighborhoods: RankingItem[];
    topPlaces: RankingItem[];
    topArtists: RankingItem[];
    topPromoters: RankingItem[];
  };
}

export function DashboardRankings({ data }: DashboardRankingsProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      <RankingList title="Top Eventos (Favoritos)" icon={Star} items={data.topEvents} />
      <RankingList title="Top Eventos (Cliques)" icon={Trophy} items={data.topEventsByViews} />
      <RankingList title="Bairros (+ Eventos)" icon={MapPin} items={data.topNeighborhoods} />
      <RankingList title="Estabelecimentos" icon={Building2} items={data.topPlaces} />
      <RankingList title="Artistas / Bandas" icon={Music} items={data.topArtists} />
      <RankingList title="Top Divulgadores" icon={Trophy} items={data.topPromoters} />
    </div>
  );
}
