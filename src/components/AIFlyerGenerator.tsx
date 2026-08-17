import { useState, useRef, useEffect, useCallback } from "react";
import { toPng, toJpeg } from "html-to-image";
import { toast } from "sonner";
import { handleError } from "@/lib/error-handler";
import { 
  Download, RotateCcw, 
  Type, Palette, Layout, Globe, MessageCircle, Share2, 
  Check, Loader2, Info, ChevronRight, ChevronLeft, Save,
  ChevronDown, ArrowUp
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
  feed: { label: "Instagram Feed (1:1)", ratio: "aspect-square", width: "w-full", icon: Globe },
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
  { id: "split", label: "Dividido", icon: ArrowUp }
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
        await new Promise(resolve => setTimeout(resolve, 300));
        
        const dataUrl = await toPng(flyerRef.current, {
          quality: 0.95,
          pixelRatio: 2,
        });
        urls[f] = dataUrl;
      }

      onFlyerGenerated(urls);
      toast.success("Versões otimizadas prontas!");
    } catch (err) {
      handleError(err, { context: "AIFlyerGenerator.export", fallback: "Não deu pra gerar as versões. Tenta de novo." });
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

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
      {/* Left: Preview */}
      <div className="space-y-4">
        <div className="flex flex-col gap-4">
          <div className="flex items-center justify-between px-2">
            <h3 className="text-sm font-bold uppercase tracking-widest text-muted-foreground">Formato</h3>
            <Badge variant="secondary" className="bg-primary/10 text-primary border-none animate-pulse">
              ✨ Preview flyer
            </Badge>
          </div>
          <div className="flex gap-2 bg-muted/30 p-1 rounded-full overflow-hidden">
            {(Object.keys(FLYER_FORMATS) as FlyerFormat[]).map((f) => {
              const FIcon = FLYER_FORMATS[f].icon;
              return (
                <Button 
                  key={f}
                  variant={format === f ? "default" : "ghost"} 
                  size="sm" 
                  onClick={() => setFormat(f)}
                  className="flex-1 rounded-full h-9 gap-2 transition-all"
                >
                  <FIcon className="h-4 w-4" />
                  <span className="hidden sm:inline">{FLYER_FORMATS[f].label.split(' ')[0]}</span>
                </Button>
              );
            })}
          </div>
        </div>

        <div className={cn(
          "relative mx-auto overflow-hidden shadow-2xl rounded-2xl ring-1 ring-white/10 transition-all duration-500",
          FLYER_FORMATS[format].ratio,
          FLYER_FORMATS[format].width
        )}>
          <div 
            ref={flyerRef}
            className={cn(
              "relative w-full h-full flex flex-col overflow-hidden",
              currentTemplate.bg,
              currentTemplate.font
            )}
          >
            {/* Background Image Layer */}
            {bgImage && (
              <div className="absolute inset-0 z-0">
                <img src={bgImage} className="w-full h-full object-cover opacity-40 mix-blend-overlay scale-110 blur-[1px]" alt="" />
                <div 
                  className={cn("absolute inset-0 bg-gradient-to-t opacity-90", currentTemplate.gradient)} 
                  style={{ backgroundImage: layout === 'split' ? `linear-gradient(to top, black 40%, transparent 80%)` : undefined }}
                />
              </div>
            )}

            {/* Content Layer */}
            <div className={cn(
              "relative z-10 flex flex-col h-full p-8 sm:p-12 text-center",
              layout === 'bottom' ? "justify-end pb-16" : "justify-between items-center"
            )}>
              {/* Top: Category/Badge */}
              <div className={cn("mb-4", layout === 'bottom' && "hidden")}>
                <div className={cn(
                  "inline-block px-4 py-1.5 rounded-full border text-[10px] sm:text-xs font-black uppercase tracking-[0.3em]",
                  "border-current/20 bg-white/5 backdrop-blur-sm"
                )} style={{ color: accentColor }}>
                  {template} Event
                </div>
              </div>

              {/* Center/Bottom: Title & Artist */}
              <div className={cn(
                "space-y-4 sm:space-y-6",
                layout === 'bottom' && "text-left items-start mb-8"
              )}>
                <h2 className={cn(
                  "font-black tracking-tightest leading-[0.85] uppercase",
                  format === "feed" ? "text-5xl sm:text-7xl" : format === "story" ? "text-4xl sm:text-6xl" : "text-5xl sm:text-6xl"
                )} style={{ color: template === 'samba' ? '#ea580c' : 'white' }}>
                  {data.title || "AgendIlha"}
                </h2>
                
                <div className={cn(
                  "flex items-center gap-3",
                  layout === 'center' ? "justify-center" : "justify-start"
                )}>
                  {layout === 'center' && <div className="h-[2px] w-8 sm:w-12 bg-current opacity-30" style={{ backgroundColor: accentColor }} />}
                  <p className="font-bold uppercase tracking-widest text-sm sm:text-xl" style={{ color: accentColor }}>
                    {data.artist || "Convidados Especiais"}
                  </p>
                  {layout === 'center' && <div className="h-[2px] w-8 sm:w-12 bg-current opacity-30" style={{ backgroundColor: accentColor }} />}
                </div>
              </div>

              {/* Footer: Date & Location */}
              <div className={cn(
                "w-full space-y-6",
                layout === 'bottom' && "text-left"
              )}>
                <div className="flex flex-col gap-1 sm:gap-2">
                  <p className="text-white text-base sm:text-2xl font-black uppercase tracking-[0.2em]">
                    {data.date} • {data.time}
                  </p>
                  <div className={cn(
                    "flex items-center gap-2 text-white/70 text-xs sm:text-sm font-medium",
                    layout === 'center' ? "justify-center" : "justify-start"
                  )}>
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
      <div className="bg-card border border-border p-6 rounded-3xl shadow-lg space-y-8 h-fit sticky top-24">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-display font-black text-xl flex items-center gap-2 mb-1">
              <Palette className="h-5 w-5 text-primary" /> Estúdio
            </h3>
            <p className="text-sm text-muted-foreground">Customize cada detalhe da sua arte.</p>
          </div>
          <Button variant="ghost" size="icon" onClick={fetchNewBg} className="rounded-full h-10 w-10">
            <RotateCcw className="h-4 w-4" />
          </Button>
        </div>

        <div className="space-y-6">
          <div className="space-y-4">
            <Label className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground flex items-center gap-2">
              <Layout className="h-3 w-3" /> Layout & Estilo
            </Label>
            <div className="grid grid-cols-2 gap-2">
              <Select value={template} onValueChange={setTemplate}>
                <SelectTrigger className="h-11 rounded-xl">
                  <SelectValue placeholder="Estilo Visual" />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(FLYER_TEMPLATES).map(([key, value]) => (
                    <SelectItem key={key} value={key}>{value.style}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              
              <Select value={layout} onValueChange={setLayout}>
                <SelectTrigger className="h-11 rounded-xl">
                  <SelectValue placeholder="Alinhamento" />
                </SelectTrigger>
                <SelectContent>
                  {FLYER_LAYOUTS.map((l) => (
                    <SelectItem key={l.id} value={l.id}>{l.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-4">
            <Label className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground flex items-center gap-2">
              <Type className="h-3 w-3" /> Conteúdo do Flyer
            </Label>
            <div className="space-y-3">
              <Input 
                value={data.title}
                onChange={(e) => setData({...data, title: e.target.value})}
                placeholder="Título do Evento"
                className="h-11 bg-muted/30 border-none rounded-xl"
              />
              <Input 
                value={data.artist}
                onChange={(e) => setData({...data, artist: e.target.value})}
                placeholder="Artista / Atração"
                className="h-11 bg-muted/30 border-none rounded-xl"
              />
            </div>
          </div>

          <div className="pt-6 border-t border-border flex flex-col gap-3">
            <div className="grid grid-cols-2 gap-3">
              <Button 
                onClick={handleDownload} 
                variant="outline" 
                className="h-12 rounded-xl font-bold uppercase tracking-widest text-xs"
              >
                <Download className="mr-2 h-4 w-4" /> Baixar
              </Button>
              <Button 
                onClick={generateAllFormats} 
                disabled={isGenerating}
                className="h-12 rounded-xl gradient-sunset font-black uppercase tracking-widest text-xs shadow-lg"
              >
                {isGenerating ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Check className="mr-2 h-4 w-4" />
                )}
                Finalizar
              </Button>
            </div>
          </div>

          <div className="bg-primary/5 p-4 rounded-2xl flex items-start gap-3 border border-primary/10">
            <Info className="h-5 w-5 text-primary shrink-0 mt-0.5" />
            <p className="text-[10px] text-primary/80 font-bold leading-relaxed uppercase tracking-wider">
              Ao finalizar, a IA criará automaticamente versões otimizadas para Story, Feed e WhatsApp.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
