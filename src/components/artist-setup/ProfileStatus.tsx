import { Progress } from "@/components/ui/progress";
2: import { Badge } from "@/components/ui/badge";
3: import { CheckCircle2, Circle, AlertCircle, Clock } from "lucide-react";
4: import { cn } from "@/lib/utils";
5: 
6: interface ProfileStatusProps {
7:   status: 'pending' | 'approved' | 'rejected' | 'incomplete';
8:   completeness: number;
9:   missingFields: string[];
10: }
11: 
12: export function ProfileStatus({ status, completeness, missingFields }: ProfileStatusProps) {
13:   const statusConfig = {
14:     approved: {
15:       label: "Aprovado",
16:       icon: CheckCircle2,
17:       className: "bg-emerald-50 text-emerald-700 border-emerald-200",
18:       description: "Seu perfil está visível para toda a comunidade."
19:     },
20:     pending: {
21:       label: "Em Revisão",
22:       icon: Clock,
23:       className: "bg-amber-50 text-amber-700 border-amber-200",
24:       description: "Nossa equipe está analisando suas informações."
25:     },
26:     rejected: {
27:       label: "Necessita Ajustes",
28:       icon: AlertCircle,
29:       className: "bg-rose-50 text-rose-700 border-rose-200",
30:       description: "Seu perfil precisa de correções para ser aprovado."
31:     },
32:     incomplete: {
33:       label: "Incompleto",
34:       icon: Circle,
35:       className: "bg-slate-50 text-slate-700 border-slate-200",
36:       description: "Complete seu perfil para enviar para análise."
37:     }
38:   };
39: 
40:   const config = statusConfig[status];
41:   const StatusIcon = config.icon;
42: 
43:   return (
44:     <div className="space-y-6">
45:       <div className={cn("flex items-start gap-4 p-4 rounded-2xl border transition-all", config.className)}>
46:         <div className="p-2 bg-white/50 rounded-full shadow-sm">
47:           <StatusIcon className="h-6 w-6" />
48:         </div>
49:         <div className="flex-1 min-w-0">
50:           <div className="flex items-center gap-2 mb-1">
51:             <h3 className="font-bold text-lg">{config.label}</h3>
52:             <Badge variant="outline" className="bg-white/50 border-current/20">
53:               {completeness}% Completo
54:             </Badge>
55:           </div>
56:           <p className="text-sm opacity-90 leading-relaxed">{config.description}</p>
57:         </div>
58:       </div>
59: 
60:       <div className="space-y-3">
61:         <div className="flex items-center justify-between px-1">
62:           <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Progresso do Perfil</span>
63:           <span className="text-xs font-bold text-primary">{completeness}%</span>
64:         </div>
65:         <Progress value={completeness} className="h-2 rounded-full bg-muted shadow-inner" />
66:       </div>
67: 
68:       {missingFields.length > 0 && status !== 'approved' && (
69:         <div className="p-4 bg-muted/30 rounded-2xl border border-dashed border-border space-y-3">
70:           <h4 className="text-xs font-black uppercase tracking-widest text-foreground flex items-center gap-2">
71:             <AlertCircle className="h-3 w-3 text-primary" /> Pendências
72:           </h4>
73:           <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2">
74:             {missingFields.map((field, idx) => (
75:               <li key={idx} className="flex items-center gap-2 text-xs text-muted-foreground bg-white/50 p-2 rounded-lg border border-white/80">
76:                 <div className="h-1.5 w-1.5 rounded-full bg-primary/40 shrink-0" />
77:                 {field}
78:               </li>
79:             ))}
80:           </ul>
81:         </div>
82:       )}
83:     </div>
84:   );
85: }