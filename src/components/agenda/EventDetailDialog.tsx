import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  CalendarDays,
  Clock,
  Copy,
  Download,
  Info,
  MapPin,
  MessageCircle,
  Share2,
  X,
} from "lucide-react";
import { FavoriteButton } from "@/components/FavoriteButton";
import { EventImage } from "./EventImage";
import { ReportButton } from "./ReportButton";
import { buildUberLink, buildWhatsAppShare } from "./agenda-utils";
import { categoryIcons, categoryLabels, type AgendaEvent } from "./types";
import { formatBrazilianDate } from "@/lib/date-utils";
import { buildFullAddress, getShareData, getShareUrl } from "@/lib/sharing";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface EventDetailDialogProps {
  event: AgendaEvent | null;
  onClose: () => void;
  onShare: (title: string, text: string, url: string, eventId?: string) => void;
  onCopyLink: (url: string) => void;
  trackShare: (id: string) => void;
}

function downloadImage(url: string, filename: string, label: string) {
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  toast.success(`Iniciando download (${label})...`);
}

export function EventDetailDialog({
  event,
  onClose,
  onShare,
  onCopyLink,
  trackShare,
}: EventDetailDialogProps) {
  return (
    <Dialog open={!!event} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-2xl p-0 overflow-hidden rounded-t-[2rem] sm:rounded-[2rem] border-none bg-background h-[95vh] sm:h-[90vh] flex flex-col focus:outline-none">
        {event && (
          <>
            <div className="relative aspect-[4/3] sm:aspect-video w-full bg-muted overflow-hidden shrink-0 group">
              <EventImage
                src={event.image_url}
                alt={event.event_title}
                category={event.category}
                className="absolute inset-0 w-full h-full"
              />
              <div className="absolute top-4 right-4 z-20 flex gap-2">
                <FavoriteButton
                  eventId={event.id}
                  className="backdrop-blur-md border border-white/20 transition-all shadow-lg"
                />
                <Button
                  variant="secondary"
                  size="icon"
                  className="rounded-full bg-black/40 backdrop-blur-md text-white border-white/20 hover:bg-black/60 transition-colors shadow-lg"
                  onClick={onClose}
                >
                  <X className="h-5 w-5" />
                </Button>
              </div>
              <div className="absolute bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-black/90 via-black/40 to-transparent">
                <div className="flex flex-wrap gap-2 mb-3">
                  <Badge className="bg-[#F6EEEA] text-[#2F5D46] border-[#E6D6CF] border px-3 py-1.5 font-semibold text-[10px] tracking-[0.15em] uppercase rounded-full shadow-sm">
                    {categoryIcons[event.category || ""] || "📌"}{" "}
                    {categoryLabels[event.category || ""] || "Evento"}
                  </Badge>
                  {event.age_rating && (
                    <Badge
                      className={cn(
                        "backdrop-blur-md text-white border-white/20 border px-3 py-1.5 font-black text-[10px] tracking-[0.15em] uppercase rounded-full shadow-sm",
                        event.age_rating === "18+" ? "bg-red-500/80" : "bg-green-600/80",
                      )}
                    >
                      {event.age_rating}
                    </Badge>
                  )}
                </div>
                <h2 className="text-2xl sm:text-4xl font-black text-white tracking-tight leading-[1.1]">
                  {event.event_title}
                </h2>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto">
              <div className="p-5 sm:p-10 space-y-8 sm:space-y-10">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 sm:gap-8">
                  <div className="space-y-5 sm:space-y-6">
                    <div className="flex items-start gap-4">
                      <div className="h-10 w-10 sm:h-12 sm:w-12 rounded-xl sm:rounded-2xl bg-primary/10 flex items-center justify-center shrink-0 shadow-sm border border-primary/5">
                        <CalendarDays className="h-5 w-5 sm:h-6 sm:w-6 text-primary" />
                      </div>
                      <div>
                        <p className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em] mb-1">
                          Data
                        </p>
                        <p className="font-bold text-base sm:text-lg text-foreground">
                          {formatBrazilianDate(event.date)}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-start gap-4">
                      <div className="h-10 w-10 sm:h-12 sm:w-12 rounded-xl sm:rounded-2xl bg-primary/10 flex items-center justify-center shrink-0 shadow-sm border border-primary/5">
                        <Clock className="h-5 w-5 sm:h-6 sm:w-6 text-primary" />
                      </div>
                      <div>
                        <p className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em] mb-1">
                          Horário
                        </p>
                        <p className="font-bold text-base sm:text-lg text-foreground">
                          {event.start_time}
                          {event.end_time ? ` — ${event.end_time}` : ""}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-5 sm:space-y-6">
                    <div className="flex items-start gap-4">
                      <div className="h-10 w-10 sm:h-12 sm:w-12 rounded-xl sm:rounded-2xl bg-secondary/10 flex items-center justify-center shrink-0 shadow-sm border border-secondary/5">
                        <MapPin className="h-5 w-5 sm:h-6 sm:w-6 text-secondary" />
                      </div>
                      <div>
                        <p className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em] mb-1">
                          Local
                        </p>
                        <p className="font-bold text-base sm:text-lg leading-tight text-foreground">
                          {event.location}
                        </p>
                        <p className="text-xs sm:text-sm text-muted-foreground font-medium mt-1.5 leading-relaxed line-clamp-2">
                          {event.address_street}
                          {event.address_neighborhood ? `, ${event.address_neighborhood}` : ""}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {event.description && (
                  <div className="space-y-4 pt-8 border-t border-border/50">
                    <div className="flex items-center gap-2">
                      <Info className="h-4 w-4 text-primary/60" />
                      <p className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em]">
                        Sobre o Evento
                      </p>
                    </div>
                    <p className="text-muted-foreground leading-relaxed whitespace-pre-wrap font-medium text-base sm:text-lg">
                      {event.description}
                    </p>
                  </div>
                )}

                <div className="space-y-4 pt-8 border-t border-border/50">
                  <iframe
                    src={`/avaliacoes.html?id=${event.id}&evento=${encodeURIComponent(event.event_title)}`}
                    width="100%"
                    height="650"
                    style={{ border: "none", borderRadius: "12px" }}
                    title="Avaliações"
                  />
                </div>
              </div>
            </div>

            <div className="p-5 sm:p-10 lg:p-12 bg-card/80 backdrop-blur-xl border-t border-border/50 shrink-0">
              <div className="flex flex-col gap-5 sm:gap-8">
                <div className="flex flex-col gap-3.5">
                  <div className="flex flex-col sm:flex-row gap-4 w-full">
                    <Button
                      className="flex-1 h-14 sm:h-16 rounded-full font-black uppercase tracking-wider gradient-sunset text-primary-foreground shadow-xl hover:scale-[1.03] active:scale-95 transition-all text-sm sm:text-base focus-visible:ring-4 focus-visible:ring-primary/40 outline-none"
                      onClick={() => {
                        window.open(buildWhatsAppShare(event), "_blank");
                        trackShare(event.id);
                      }}
                      aria-label="Compartilhar evento no WhatsApp"
                    >
                      <MessageCircle className="h-5 w-5 sm:h-6 sm:w-6 mr-3" /> WhatsApp
                    </Button>
                    <Button
                      variant="outline"
                      className="flex-1 h-14 sm:h-16 rounded-full font-black uppercase tracking-wider border-2 border-primary text-primary bg-background hover:bg-primary hover:text-white shadow-lg active:scale-95 transition-all text-sm sm:text-base focus-visible:ring-4 focus-visible:ring-primary/40 outline-none"
                      onClick={() => {
                        const data = getShareData(event as any);
                        onShare(data.title, data.text, data.url, event.id);
                      }}
                    >
                      <Share2 className="h-6 w-6 mr-3" /> Compartilhar
                    </Button>
                  </div>

                  <div className="grid grid-cols-2 xs:flex xs:flex-wrap gap-2.5 sm:gap-3">
                    <Button
                      variant="ghost"
                      className="flex-1 h-12 sm:h-14 rounded-full font-bold text-[10px] sm:text-sm uppercase tracking-widest text-muted-foreground hover:text-primary hover:bg-primary/5 active:scale-95 transition-all"
                      onClick={() => onCopyLink(getShareUrl(event.id))}
                    >
                      <Copy className="h-5 w-5 mr-2.5" /> Copiar link
                    </Button>
                    <Button
                      variant="outline"
                      className="flex-1 h-12 sm:h-14 rounded-full font-black uppercase tracking-wider border-2 border-primary/20 text-primary bg-background hover:bg-primary hover:text-white active:scale-95 transition-all text-[10px] sm:text-xs shadow-sm"
                      onClick={() => {
                        const addr = buildFullAddress(event as any);
                        window.open(
                          `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(addr)}`,
                          "_blank",
                        );
                      }}
                    >
                      <MapPin className="h-5 w-5 mr-2.5" /> Mapa
                    </Button>
                    <Button
                      variant="outline"
                      className="flex-1 h-12 sm:h-14 rounded-full font-black uppercase tracking-wider border-2 border-black/20 text-foreground bg-background hover:bg-foreground hover:text-background active:scale-95 transition-all text-[10px] sm:text-xs shadow-sm"
                      onClick={() => window.open(buildUberLink(event), "_blank")}
                    >
                      <MapPin className="h-5 w-5 mr-2.5" /> Ir de Uber
                    </Button>
                  </div>
                </div>

                <div className="flex flex-col gap-2">
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                    {event.image_url && (
                      <Button
                        variant="ghost"
                        className="h-10 text-[10px] font-bold text-muted-foreground hover:text-primary transition-colors border border-dashed border-border rounded-xl"
                        onClick={(e) => {
                          e.stopPropagation();
                          downloadImage(
                            event.image_url!,
                            `flyer-feed-${event.event_title}.jpg`,
                            "Feed",
                          );
                        }}
                      >
                        <Download className="h-3 w-3 mr-1" /> Feed
                      </Button>
                    )}
                    {(event as any).image_url_story && (
                      <Button
                        variant="ghost"
                        className="h-10 text-[10px] font-bold text-muted-foreground hover:text-primary transition-colors border border-dashed border-border rounded-xl"
                        onClick={(e) => {
                          e.stopPropagation();
                          downloadImage(
                            (event as any).image_url_story!,
                            `flyer-story-${event.event_title}.jpg`,
                            "Story",
                          );
                        }}
                      >
                        <Download className="h-3 w-3 mr-1" /> Story
                      </Button>
                    )}
                    {(event as any).image_url_whatsapp && (
                      <Button
                        variant="ghost"
                        className="h-10 text-[10px] font-bold text-muted-foreground hover:text-primary transition-colors border border-dashed border-border rounded-xl"
                        onClick={(e) => {
                          e.stopPropagation();
                          downloadImage(
                            (event as any).image_url_whatsapp!,
                            `flyer-whatsapp-${event.event_title}.jpg`,
                            "WhatsApp",
                          );
                        }}
                      >
                        <Download className="h-3 w-3 mr-1" /> WhatsApp
                      </Button>
                    )}
                  </div>

                  <ReportButton eventId={event.id} eventTitle={event.event_title} />

                  <Button
                    variant="ghost"
                    className="h-14 rounded-full font-bold text-muted-foreground hover:text-foreground hover:bg-muted focus-visible:ring-2 focus-visible:ring-muted-foreground/30 active:scale-95 transition-all"
                    onClick={onClose}
                  >
                    Fechar Detalhes
                  </Button>
                </div>
              </div>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}