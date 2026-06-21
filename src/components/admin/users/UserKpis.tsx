import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { Users, User, UserCheck, Music, ShieldAlert } from "lucide-react";

export interface UserKpisData {
  total: number;
  publico: number;
  divulgadores: number;
  artistas: number;
  admins: number;
  semBairro: number;
}

export function UserKpis({ kpis }: { kpis: UserKpisData }) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
      <Card className="border-border">
        <CardContent className="p-4">
          <div className="flex items-center gap-2 text-muted-foreground text-xs uppercase tracking-wider font-bold">
            <Users className="h-3.5 w-3.5" /> Total
          </div>
          <div className="text-2xl font-extrabold mt-1">{kpis.total}</div>
        </CardContent>
      </Card>
      <Card className="border-blue-500/30 bg-blue-500/5">
        <CardContent className="p-4">
          <div className="flex items-center gap-2 text-blue-700 text-xs uppercase tracking-wider font-bold">
            <User className="h-3.5 w-3.5" /> Público
          </div>
          <div className="text-2xl font-extrabold mt-1 text-blue-700">{kpis.publico}</div>
        </CardContent>
      </Card>
      <Card className="border-emerald-500/30 bg-emerald-500/5">
        <CardContent className="p-4">
          <div className="flex items-center gap-2 text-emerald-700 text-xs uppercase tracking-wider font-bold">
            <UserCheck className="h-3.5 w-3.5" /> Divulgadores
          </div>
          <div className="text-2xl font-extrabold mt-1 text-emerald-700">{kpis.divulgadores}</div>
        </CardContent>
      </Card>
      <Card className="border-purple-500/30 bg-purple-500/5">
        <CardContent className="p-4">
          <div className="flex items-center gap-2 text-purple-700 text-xs uppercase tracking-wider font-bold">
            <Music className="h-3.5 w-3.5" /> Artistas
          </div>
          <div className="text-2xl font-extrabold mt-1 text-purple-700">{kpis.artistas}</div>
        </CardContent>
      </Card>
      <Card
        className={cn(
          "border-amber-500/30 bg-amber-500/5",
          kpis.semBairro > 0 && "ring-1 ring-amber-500/40"
        )}
      >
        <CardContent className="p-4">
          <div className="flex items-center gap-2 text-amber-700 text-xs uppercase tracking-wider font-bold">
            <ShieldAlert className="h-3.5 w-3.5" /> Sem bairro
          </div>
          <div className="text-2xl font-extrabold mt-1 text-amber-700">{kpis.semBairro}</div>
        </CardContent>
      </Card>
    </div>
  );
}