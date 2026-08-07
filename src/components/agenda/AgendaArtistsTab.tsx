import { useNavigate } from "react-router-dom";
import { Music as MusicIcon, Video } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import ArtistCard from "@/components/ArtistCard";

export interface AgendaArtistMedia {
  id: string;
  media_type?: string | null;
  thumbnail_url?: string | null;
}

export interface AgendaArtist {
  id: string;
  name: string;
  cover_url?: string;
  avatar_url?: string;
  genre?: string;
  neighborhood?: string;
  artist_type?: string;
  is_approved?: boolean;
  artist_media?: AgendaArtistMedia[] | null;
}

export interface AgendaShortVideo extends AgendaArtistMedia {
  artist: AgendaArtist;
}

interface AgendaArtistsTabProps {
  artists: AgendaArtist[];
  shortVideos: AgendaShortVideo[];
  neighborhoodFilter: string;
}

/** Aba "Artistas": carrossel de vídeos curtos + grid de artistas. */
export function AgendaArtistsTab({
  artists,
  shortVideos,
  neighborhoodFilter,
}: AgendaArtistsTabProps) {
  const navigate = useNavigate();

  return (
    <div className="space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-700">
      {shortVideos.length > 0 && (
        <section className="space-y-6">
          <h2 className="text-2xl font-display font-black text-primary flex items-center gap-2 px-2">
            <Video className="h-6 w-6" /> DESCUBRA NOVOS SONS
          </h2>
          <div className="flex gap-4 overflow-x-auto pb-4 snap-x no-scrollbar -mx-4 px-4 sm:mx-0 sm:px-0">
            {shortVideos.map((video) => (
              <button
                key={video.id}
                type="button"
                className="relative min-w-[200px] sm:min-w-[240px] aspect-[9/16] rounded-3xl overflow-hidden bg-muted snap-start shadow-xl group text-left"
                onClick={() => navigate(`/artista/${video.artist.id}`)}
              >
                <img
                  loading="lazy"
                  decoding="async"
                  src={video.thumbnail_url ?? undefined}
                  className="w-full h-full object-cover"
                  alt={`Vídeo de ${video.artist.name}`}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
                <div className="absolute bottom-4 left-4 right-4 text-primary-foreground">
                  <p className="font-bold text-sm">{video.artist.name}</p>
                  <Badge
                    variant="secondary"
                    className="bg-white/20 text-[10px] text-primary-foreground border-none"
                  >
                    {video.artist.genre}
                  </Badge>
                </div>
              </button>
            ))}
          </div>
        </section>
      )}

      <section className="space-y-8">
        <h2 className="text-2xl font-display font-black text-primary flex items-center gap-2 px-2">
          <MusicIcon className="h-6 w-6" /> ARTISTAS NA ILHA
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          {artists
            .filter((a) => neighborhoodFilter === "all" || a.neighborhood === neighborhoodFilter)
            .map((artist) => (
              <ArtistCard key={artist.id} artist={artist} />
            ))}
        </div>
      </section>
    </div>
  );
}
