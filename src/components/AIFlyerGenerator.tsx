 import { useState, useRef, useEffect, useCallback } from "react";
 import { toPng, toJpeg } from "html-to-image";
 import { toast } from "sonner";
 import { 
   Download, RotateCcw, 
   Type, Palette, Layout, Instagram, MessageCircle, Share2, 
   Check, Loader2, Info, ChevronRight, ChevronLeft, Save
 } from "lucide-react";
 import { Button } from "./ui/button";
 import { Input } from "./ui/input";
 import { Label } from "./ui/label";
 import { Badge } from "./ui/badge";
 import { cn } from "@/lib/utils";
 import {
   Select,
   SelectContent,
   SelectItem,
   SelectTrigger,
   SelectValue,
 } from "./ui/select";
 
 interface FlyerData {
   title: string;
   artist: string;
   date: string;
   time: string;
   location: string;
   neighborhood: string;
   category: string;
   imageUrl?: string;
 }
 
 interface AIFlyerGeneratorProps {
   initialData: FlyerData;
   onFlyerGenerated: (urls: { feed: string; story: string; whatsapp: string }) => void;
 }
 
 type FlyerFormat = "feed" | "story" | "whatsapp";
 
 const FLYER_FORMATS: Record<FlyerFormat, { label: string; ratio: string; width: string; icon: any }> = {
   feed: { label: "Instagram Feed (1:1)", ratio: "aspect-square", width: "w-full", icon: Instagram },
   story: { label: "Instagram Stories (9:16)", ratio: "aspect-[9/16]", width: "w-[65%]", icon: Share2 },
   whatsapp: { label: "WhatsApp / Feed (4:5)", ratio: "aspect-[4/5]", width: "w-[80%]", icon: MessageCircle },
 };
 
 const FLYER_TEMPLATES = {
   musica: {
     bg: "bg-zinc-950",
     accent: "text-primary",
     gradient: "from-primary/20 via-zinc-950 to-zinc-950",
     font: "font-display",
     style: "Modern Show",
     colors: ["#ea384c", "#000000", "#ffffff"]
   },
   samba: {
     bg: "bg-orange-50",
     accent: "text-orange-600",
     gradient: "from-orange-500/10 via-orange-50 to-orange-50",
     font: "font-serif",
     style: "Vibrant Samba",
     colors: ["#ea580c", "#fff7ed", "#000000"]
   },
   rock: {
     bg: "bg-zinc-900",
     accent: "text-red-600",
     gradient: "from-zinc-800 via-zinc-900 to-black",
     font: "font-display",
     style: "Gritty Rock",
     colors: ["#dc2626", "#18181b", "#ffffff"]
   },
   eletronico: {
     bg: "bg-indigo-950",
     accent: "text-cyan-400",
     gradient: "from-indigo-500/20 via-indigo-950 to-black",
     font: "font-mono",
     style: "Cyber Electronic",
     colors: ["#22d3ee", "#1e1b4b", "#ffffff"]
   },
   jazz: {
     bg: "bg-stone-900",
     accent: "text-amber-500",
     gradient: "from-stone-800 via-stone-900 to-black",
     font: "font-serif",
     style: "Elegant Jazz",
     colors: ["#f59e0b", "#1c1917", "#ffffff"]
   },
   funk: {
     bg: "bg-pink-900",
     accent: "text-yellow-400",
     gradient: "from-purple-600/30 via-pink-900 to-black",
     font: "font-black",
     style: "Pop Funk",
     colors: ["#facc15", "#831843", "#ffffff"]
   },
   sertanejo: {
     bg: "bg-amber-900",
     accent: "text-amber-200",
     gradient: "from-amber-800/40 via-amber-900 to-stone-950",
     font: "font-sans",
     style: "Modern Country",
     colors: ["#fde68a", "#451a03", "#ffffff"]
   }
 };
 
 const FLYER_LAYOUTS = [
   { id: "center", label: "Centralizado", icon: Layout },
   { id: "bottom", label: "Inferior", icon: ChevronDown },
   { id: "split", label: "Dividido", icon: ArrowUpDown }
 ];
 
 export function AIFlyerGenerator({ initialData, onFlyerGenerated }: AIFlyerGeneratorProps) {
   const flyerRef = useRef<HTMLDivElement>(null);
   const [data, setData] = useState<FlyerData>(initialData);
   const [format, setFormat] = useState<FlyerFormat>("feed");
   const [isGenerating, setIsGenerating] = useState(false);
   const [template, setTemplate] = useState<string>(initialData.category || "musica");
   const [layout, setLayout] = useState("center");
   const [bgImage, setBgImage] = useState<string | null>(null);
   const [customAccent, setCustomAccent] = useState<string | null>(null);
 
   const currentTemplate = (FLYER_TEMPLATES as any)[template] || FLYER_TEMPLATES.musica;
 
   const fetchNewBg = useCallback(async () => {
     const randomId = Math.floor(Math.random() * 1000);
     setBgImage(`https://images.unsplash.com/photo-1470225620780-dba8ba36b745?auto=format&fit=crop&w=1200&q=80&sig=${randomId}`);
   }, []);
 
   useEffect(() => {
     fetchNewBg();
   }, [template, fetchNewBg]);
 
   const generateAllFormats = async () => {
     if (!flyerRef.current) return;
     setIsGenerating(true);
     try {
       const formats: FlyerFormat[] = ["feed", "story", "whatsapp"];
       const urls: any = {};
 
       for (const f of formats) {
         setFormat(f);
         // Wait for re-render
         await new Promise(resolve => setTimeout(resolve, 500));
         
         const dataUrl = await toPng(flyerRef.current, {
           quality: 0.95,
           pixelRatio: 2,
         });
         urls[f] = dataUrl;
       }
 
       onFlyerGenerated(urls);
       toast.success("Versões otimizadas geradas!");
     } catch (err) {
       console.error("Export error:", err);
       toast.error("Erro ao gerar versões.");
     } finally {
       setIsGenerating(false);
     }
   };
 
   const handleDownload = async () => {
     if (!flyerRef.current) return;
     try {
       const dataUrl = await toJpeg(flyerRef.current, { quality: 1.0, pixelRatio: 3 });
       const link = document.createElement('a');
       link.download = `flyer-${format}-${data.title.replace(/\s+/g, '-').toLowerCase()}.jpg`;
       link.href = dataUrl;
       link.click();
       toast.success("Download iniciado!");
     } catch (err) {
       toast.error("Erro no download.");
     }
   };
 
   const accentColor = customAccent || currentTemplate.colors[0];
   const flyerRef = useRef<HTMLDivElement>(null);
   const [data, setData] = useState<FlyerData>(initialData);
   const [format, setFormat] = useState<"feed" | "story">("feed");
   const [isGenerating, setIsGenerating] = useState(false);
   const [template, setTemplate] = useState<string>(initialData.category || "musica");
   const [bgImage, setBgImage] = useState<string | null>(null);
 
   const currentTemplate = (FLYER_TEMPLATES as any)[template] || FLYER_TEMPLATES.musica;
 
   const fetchNewBg = async () => {
     const keywords = [data.category, "concert", "stage", "music", "party", "nightlife"];
     const query = keywords.filter(Boolean).join(",");
     const randomId = Math.floor(Math.random() * 1000);
     setBgImage(`https://images.unsplash.com/photo-1470225620780-dba8ba36b745?auto=format&fit=crop&w=1200&q=80&sig=${randomId}`);
   };
 
   useEffect(() => {
     fetchNewBg();
   }, [template]);
 
   const handleExport = async () => {
     if (!flyerRef.current) return;
     setIsGenerating(true);
     try {
       const dataUrl = await toPng(flyerRef.current, {
         quality: 0.95,
         pixelRatio: 2,
       });
       onFlyerGenerated(dataUrl);
       toast.success("Flyer gerado com sucesso!");
     } catch (err) {
       console.error("Export error:", err);
       toast.error("Erro ao exportar imagem.");
     } finally {
       setIsGenerating(false);
     }
   };
 
   return (
     <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
       {/* Left: Preview */}
       <div className="space-y-4">
         <div className="flex items-center justify-between px-2">
           <div className="flex gap-2">
             <Button 
               variant={format === "feed" ? "default" : "outline"} 
               size="sm" 
               onClick={() => setFormat("feed")}
               className="rounded-full h-8 px-4"
             >
               Feed (1:1)
             </Button>
             <Button 
               variant={format === "story" ? "default" : "outline"} 
               size="sm" 
               onClick={() => setFormat("story")}
               className="rounded-full h-8 px-4"
             >
               Story (9:16)
             </Button>
           </div>
           <Badge variant="secondary" className="bg-secondary/10 text-secondary border-none animate-pulse">
             ✨ Preview IA
           </Badge>
         </div>
 
         <div className={cn(
           "relative mx-auto overflow-hidden shadow-2xl rounded-xl ring-1 ring-white/10",
           format === "feed" ? "aspect-square w-full" : "aspect-[9/16] w-[70%]"
         )}>
           <div 
             ref={flyerRef}
             className={cn(
               "relative w-full h-full flex flex-col p-8 sm:p-12 overflow-hidden",
               currentTemplate.bg,
               currentTemplate.font
             )}
           >
             {/* Background Image Layer */}
             {bgImage && (
               <div className="absolute inset-0 z-0">
                 <img src={bgImage} className="w-full h-full object-cover opacity-40 mix-blend-overlay scale-110 blur-[1px]" alt="" />
                 <div className={cn("absolute inset-0 bg-gradient-to-t opacity-90", currentTemplate.gradient)} />
               </div>
             )}
 
             {/* Content Layer */}
             <div className="relative z-10 flex flex-col h-full justify-between items-center text-center">
               {/* Top: Category/Badge */}
               <div className="mb-4">
                 <div className={cn(
                   "inline-block px-4 py-1.5 rounded-full border text-[10px] sm:text-xs font-black uppercase tracking-[0.3em]",
                   currentTemplate.accent,
                   "border-current/20 bg-white/5 backdrop-blur-sm"
                 )}>
                   {template} Event
                 </div>
               </div>
 
               {/* Center: Title & Artist */}
               <div className="space-y-4 sm:space-y-6">
                 <h2 className={cn(
                   "font-black tracking-tightest leading-[0.85] uppercase",
                   format === "feed" ? "text-5xl sm:text-7xl" : "text-4xl sm:text-6xl",
                   template === 'samba' ? 'text-orange-600' : 'text-white'
                 )}>
                   {data.title || "AgendIlha"}
                 </h2>
                 
                 <div className="flex items-center justify-center gap-3">
                   <div className="h-[2px] w-8 sm:w-12 bg-current opacity-30" />
                   <p className={cn(
                     "font-bold uppercase tracking-widest text-sm sm:text-xl",
                     currentTemplate.accent
                   )}>
                     {data.artist || "Convidados Especiais"}
                   </p>
                   <div className="h-[2px] w-8 sm:w-12 bg-current opacity-30" />
                 </div>
               </div>
 
               {/* Bottom: Date & Location */}
               <div className="w-full space-y-6">
                 <div className="flex flex-col gap-1 sm:gap-2">
                   <p className="text-white text-base sm:text-2xl font-black uppercase tracking-[0.2em]">
                     {data.date} • {data.time}
                   </p>
                   <div className="flex items-center justify-center gap-2 text-white/70 text-xs sm:text-sm font-medium">
                     <span className="uppercase">{data.location}</span>
                     <span className="opacity-30">|</span>
                     <span className="uppercase">{data.neighborhood}</span>
                   </div>
                 </div>
                 
                 <div className="pt-4 border-t border-white/10 flex justify-between items-center text-[8px] sm:text-[10px] font-bold text-white/40 tracking-widest uppercase">
                   <span>@coeaboa</span>
                   <span>#agendilha</span>
                   <span>Ilha do Governador</span>
                 </div>
               </div>
             </div>
           </div>
         </div>
       </div>
 
       {/* Right: Controls */}
       <div className="bg-card border border-border p-6 rounded-2xl shadow-sm space-y-8">
         <div>
           <h3 className="font-display font-black text-xl flex items-center gap-2 mb-1">
             <Palette className="h-5 w-5 text-primary" /> Personalizar Flyer
           </h3>
           <p className="text-sm text-muted-foreground">Ajuste os detalhes para criar a arte perfeita.</p>
         </div>
 
         <div className="space-y-6">
           <div className="space-y-4">
             <Label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Estilo Visual</Label>
             <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
               {Object.entries(FLYER_TEMPLATES).map(([key, value]) => (
                 <button
                   key={key}
                   onClick={() => setTemplate(key)}
                   className={cn(
                     "flex flex-col items-center gap-2 p-3 rounded-xl border-2 transition-all group",
                     template === key ? "border-primary bg-primary/5 shadow-md" : "border-muted hover:border-primary/30"
                   )}
                 >
                   <div className={cn("h-6 w-6 rounded-full", value.bg, "border border-white/20")} />
                   <span className="text-[10px] font-bold uppercase tracking-tight text-center">{value.style}</span>
                 </button>
               ))}
             </div>
           </div>
 
           <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
             <div className="space-y-2">
               <Label htmlFor="flyer-title">Título do Evento</Label>
               <Input 
                 id="flyer-title"
                 value={data.title}
                 onChange={(e) => setData({...data, title: e.target.value})}
                 className="h-11 bg-muted/30"
               />
             </div>
             <div className="space-y-2">
               <Label htmlFor="flyer-artist">Artista/Banda</Label>
               <Input 
                 id="flyer-artist"
                 value={data.artist}
                 onChange={(e) => setData({...data, artist: e.target.value})}
                 className="h-11 bg-muted/30"
               />
             </div>
           </div>
 
           <div className="flex flex-col gap-3 pt-4 border-t border-border">
             <Button 
               onClick={fetchNewBg} 
               variant="outline" 
               className="w-full h-12 rounded-xl font-bold uppercase tracking-widest"
             >
               <RotateCcw className="mr-2 h-4 w-4" /> Trocar Imagem de Fundo
             </Button>
             
             <Button 
               onClick={handleExport} 
               disabled={isGenerating}
               className="w-full h-14 rounded-xl gradient-sunset font-black text-lg uppercase tracking-widest shadow-lg"
             >
               {isGenerating ? (
                 <Loader2 className="mr-2 h-5 w-5 animate-spin" />
               ) : (
                 <Check className="mr-2 h-5 w-5" />
               )}
               Usar Este Flyer
             </Button>
           </div>
 
           <div className="bg-primary/5 p-4 rounded-xl flex items-start gap-3">
             <Info className="h-5 w-5 text-primary shrink-0 mt-0.5" />
             <p className="text-[11px] text-primary/80 font-medium leading-relaxed uppercase tracking-wider">
               Dica: Este flyer será salvo automaticamente como imagem oficial do seu evento.
             </p>
           </div>
         </div>
       </div>
     </div>
   );
 }