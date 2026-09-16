import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import {
  ArrowLeft,
  Music,
  Search,
  Loader2,
  Save,
  ImageIcon,
  X,
  Plus,
  CheckCircle2,
  Info,
} from "lucide-react";
import { toast } from "sonner";
import { handleError } from "@/lib/error-handler";
import { formatPhoneDisplay, validateBrazilianMobile } from "@/lib/whatsapp";
import { MediaUploadForm } from "@/components/artist-setup/MediaUploadForm";
import { cn } from "@/lib/utils";
import { z } from "zod";

const GENEROS = [
  "Samba", "Pagode", "MPB", "Rock", "Pop", "Sertanejo", "Forró",
  "Reggae", "Funk", "Rap / Hip-Hop", "Eletrônica", "Jazz", "Blues",
  "Bossa Nova", "Gospel", "Axé", "Piseiro", "Instrumental", "Outro",
];

const optionalUrl = z
  .string()
  .trim()
  .max(300, "Link muito longo.")
  .refine((v) => !v || /^https?:\/\/\S+\.\S+/i.test(v), {
    message: "Coloca o link completo começando com https://",
  })
  .optional()
  .or(z.literal(""));

type FieldErrors = Partial<Record<
  "name" | "genre" | "genreFree" | "artistType" | "bio" | "representativeName" | "whatsapp" | "contactEmail" | "instagram" | "spotify" | "youtube" | "website",
  string
>>;

type ArtistRow = {
  id: string;
  user_id: string;
  name: string;
  genre: string | null;
  artist_type: string | null;
  bio: string | null;
  member_count: number | null;
  members: string[] | null;
  representative_name: string | null;
  whatsapp: string | null;
  contact_email: string | null;
  instagram: string | null;
  spotify_url: string | null;
  youtube: string | null;
  website_url: string | null;
  avatar_url: string | null;
  is_approved: boolean;
};

export default function CadastroBanda() {
  const navigate = useNavigate();
  const { user } = useAuth();

  const [search, setSearch] = useState("");
  const [suggestions, setSuggestions] = useState<Array<{ id: string; name: string; genre: string | null }>>([]);
  const [searching, setSearching] = useState(false);
  const searchTimer = useRef<number | null>(null);

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);

  const [artistId, setArtistId] = useState<string | null>(null);
  const [ownerId, setOwnerId] = useState<string | null>(null);
  const [isApproved, setIsApproved] = useState(false);

  const [name, setName] = useState("");
  const [genre, setGenre] = useState("");
  const [genreFree, setGenreFree] = useState("");
  const [artistType, setArtistType] = useState<"cover" | "autoral" | "both" | "">("");
  const [bio, setBio] = useState("");
  const [members, setMembers] = useState<string[]>([]);
  const [memberInput, setMemberInput] = useState("");
  const [representativeName, setRepresentativeName] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [contactEmail, setContactEmail] = useState("");
  const [instagram, setInstagram] = useState("");
  const [spotify, setSpotify] = useState("");
  const [youtube, setYoutube] = useState("");
  const [website, setWebsite] = useState("");
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [errors, setErrors] = useState<FieldErrors>({});
  const [submitAttempted, setSubmitAttempted] = useState(false);

  const canEdit = useMemo(() => {
    // Novo cadastro OU dono do perfil existente
    return !artistId || (ownerId && user?.id === ownerId);
  }, [artistId, ownerId, user?.id]);

  // Autoload perfil próprio (se já existir)
  useEffect(() => {
    if (!user) return;
    (async () => {
      const { data } = await supabase
        .from("artist_profiles")
        .select("*")
        .eq("user_id", user.id)
        .maybeSingle();
      if (data) applyArtist(data as ArtistRow);
    })();
  }, [user]);

  // Busca com debounce nas sugestões (perfis aprovados)
  useEffect(() => {
    if (searchTimer.current) window.clearTimeout(searchTimer.current);
    if (search.trim().length < 2) {
      setSuggestions([]);
      return;
    }
    searchTimer.current = window.setTimeout(async () => {
      setSearching(true);
      const { data } = await supabase
        .from("public_artist_profiles")
        .select("id, name, genre")
        .ilike("name", `%${search.trim()}%`)
        .limit(8);
      setSuggestions((data as any[]) || []);
      setSearching(false);
    }, 250);
    return () => {
      if (searchTimer.current) window.clearTimeout(searchTimer.current);
    };
  }, [search]);

  function applyArtist(a: ArtistRow) {
    setArtistId(a.id);
    setOwnerId(a.user_id);
    setIsApproved(!!a.is_approved);
    setName(a.name || "");
    const g = a.genre || "";
    if (GENEROS.includes(g)) {
      setGenre(g);
      setGenreFree("");
    } else if (g) {
      setGenre("Outro");
      setGenreFree(g);
    } else {
      setGenre("");
      setGenreFree("");
    }
    setArtistType((a.artist_type as any) || "");
    setBio(a.bio || "");
    setMembers(Array.isArray(a.members) ? a.members : []);
    setRepresentativeName(a.representative_name || "");
    setWhatsapp(a.whatsapp ? formatPhoneDisplay(a.whatsapp) : "");
    setContactEmail(a.contact_email || "");
    setInstagram(a.instagram || "");
    setSpotify(a.spotify_url || "");
    setYoutube(a.youtube || "");
    setWebsite(a.website_url || "");
    setAvatarUrl(a.avatar_url || null);
  }

  async function loadArtistById(id: string) {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("artist_profiles")
        .select("*")
        .eq("id", id)
        .maybeSingle();
      if (error) throw error;
      if (data) {
        applyArtist(data as ArtistRow);
        setSuggestions([]);
        setSearch("");
        toast.success("Perfil carregado — dá pra atualizar se for o dono.");
      }
    } catch (e) {
      handleError(e, "Não deu pra carregar esse artista agora.");
    } finally {
      setLoading(false);
    }
  }

  function resetForm() {
    setArtistId(null);
    setOwnerId(null);
    setIsApproved(false);
    setName("");
    setGenre("");
    setGenreFree("");
    setArtistType("");
    setBio("");
    setMembers([]);
    setMemberInput("");
    setRepresentativeName("");
    setWhatsapp("");
    setContactEmail("");
    setInstagram("");
    setSpotify("");
    setYoutube("");
    setWebsite("");
    setAvatarUrl(null);
  }

  function addMember() {
    const v = memberInput.trim();
    if (!v) return;
    if (members.includes(v)) return;
    setMembers([...members, v]);
    setMemberInput("");
  }

  async function handleAvatarUpload(file: File) {
    if (!user) return;
    setUploadingAvatar(true);
    try {
      const ext = file.name.split(".").pop() || "jpg";
      const path = `${user.id}/avatar-${Date.now()}.${ext}`;
      const { error } = await supabase.storage
        .from("artist-media")
        .upload(path, file, { upsert: true });
      if (error) throw error;
      const { data } = supabase.storage.from("artist-media").getPublicUrl(path);
      setAvatarUrl(data.publicUrl);
      toast.success("Foto de perfil pronta.");
    } catch (e) {
      handleError(e, "Não deu pra enviar a foto.");
    } finally {
      setUploadingAvatar(false);
    }
  }

  function runValidation(): FieldErrors {
    const e: FieldErrors = {};

    const trimmedName = name.trim();
    if (!trimmedName) e.name = "Informa o nome artístico ou da banda.";
    else if (trimmedName.length < 2) e.name = "Nome muito curto — pelo menos 2 letras.";
    else if (trimmedName.length > 120) e.name = "Nome muito longo — até 120 caracteres.";

    if (!genre) e.genre = "Escolhe um gênero musical.";
    if (genre === "Outro" && !genreFree.trim()) e.genreFree = "Diz aí qual é o gênero.";

    if (!artistType) e.artistType = "Selecciona se é cover, autoral ou os dois.";

    const trimmedBio = bio.trim();
    if (!trimmedBio) e.bio = "Escreve uma descrição curtinha do trampo.";
    else if (trimmedBio.length < 20) e.bio = "Um pouquinho mais — mínimo de 20 caracteres.";

    const trimmedRep = representativeName.trim();
    if (!trimmedRep) e.representativeName = "Informa o nome da pessoa responsável pela banda.";
    else if (trimmedRep.length < 2) e.representativeName = "Nome muito curto — pelo menos 2 letras.";
    else if (trimmedRep.length > 100) e.representativeName = "Nome muito longo — até 100 caracteres.";

    if (whatsapp.trim()) {
      const v = validateBrazilianMobile(whatsapp);
      if (!v.valid) e.whatsapp = "reason" in v && v.reason ? v.reason : "Celular inválido. Use DDD + 9 + 8 dígitos.";
    }

    if (contactEmail.trim() && !z.string().email().safeParse(contactEmail.trim()).success) {
      e.contactEmail = "E-mail inválido.";
    }

    const urlFields: Array<[keyof FieldErrors, string]> = [
      ["spotify", spotify],
      ["youtube", youtube],
      ["website", website],
    ];
    for (const [key, value] of urlFields) {
      const parsed = optionalUrl.safeParse(value);
      if (!parsed.success) e[key] = parsed.error.issues[0]?.message || "Link inválido.";
    }

    if (instagram.trim() && instagram.trim().length > 60) {
      e.instagram = "Usuário muito longo.";
    }

    return e;
  }

  // Revalida ao vivo depois da 1ª tentativa de envio
  useEffect(() => {
    if (!submitAttempted) return;
    setErrors(runValidation());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [name, genre, genreFree, artistType, bio, representativeName, whatsapp, contactEmail, instagram, spotify, youtube, website, submitAttempted]);

  const hasErrors = Object.keys(errors).length > 0;

  async function handleSave() {
    if (!user) {
      toast.error("Faz login pra salvar seu cadastro.");
      return;
    }
    setSubmitAttempted(true);
    const validationErrors = runValidation();
    setErrors(validationErrors);
    if (Object.keys(validationErrors).length > 0) {
      toast.error("Confere os campos destacados antes de salvar.");
      // rola até o primeiro erro
      const firstKey = Object.keys(validationErrors)[0];
      const el = document.querySelector(`[data-field="${firstKey}"]`);
      if (el && "scrollIntoView" in el) {
        (el as HTMLElement).scrollIntoView({ behavior: "smooth", block: "center" });
      }
      return;
    }
    if (!canEdit) {
      toast.error("Esse perfil pertence a outra pessoa. Você pode usá-lo como referência, mas não editar.");
      return;
    }
    setSaving(true);
    try {
      const finalGenre = genre === "Outro" ? genreFree.trim() : genre;
      const payload: any = {
        user_id: user.id,
        name: name.trim(),
        genre: finalGenre || null,
        artist_type: artistType || null,
        bio: bio.trim() || null,
        member_count: Math.max(1, members.length || 1),
        members,
        representative_name: representativeName.trim() || null,
        whatsapp: whatsapp ? whatsapp.replace(/\D/g, "") : null,
        contact_email: contactEmail.trim() || null,
        instagram: instagram.trim() || null,
        spotify_url: spotify.trim() || null,
        youtube: youtube.trim() || null,
        website_url: website.trim() || null,
        avatar_url: avatarUrl,
        moderation_status: isApproved ? "approved" : "pending",
      };

      let saved: any = null;
      if (artistId) {
        const { data, error } = await supabase
          .from("artist_profiles")
          .update(payload)
          .eq("id", artistId)
          .select("*")
          .single();
        if (error) throw error;
        saved = data;
      } else {
        const { data, error } = await supabase
          .from("artist_profiles")
          .upsert(payload, { onConflict: "user_id" })
          .select("*")
          .single();
        if (error) throw error;
        saved = data;
      }
      applyArtist(saved as ArtistRow);
      toast.success("Cadastro salvo. Bora arrasar nos rolês!");
    } catch (e) {
      handleError(e, "Não deu pra salvar o cadastro agora.");
    } finally {
      setSaving(false);
    }
  }

  const whatsappValid = whatsapp ? validateBrazilianMobile(whatsapp) : { valid: true };

  return (
    <div className="min-h-screen bg-gradient-to-b from-orange-50/40 via-background to-background">
      <div className="mx-auto max-w-2xl px-4 py-6 sm:py-10 space-y-6">
        <button
          onClick={() => navigate(-1)}
          className="inline-flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" /> Voltar
        </button>

        <header className="space-y-2">
          <div className="inline-flex items-center gap-2 rounded-full bg-primary/10 text-primary px-3 py-1 text-xs font-bold uppercase tracking-wider">
            <Music className="h-3.5 w-3.5" /> Cadastro de Banda / Artista
          </div>
          <h1 className="text-2xl sm:text-3xl font-black font-display leading-tight">
            Bota tua atração no mapa da ilha.
          </h1>
          <p className="text-muted-foreground">
            Se já existe cadastro, digita o nome que a gente puxa tudo. Se não, cria agora.
          </p>
        </header>

        {/* Search / autocomplete */}
        <Card className="border-primary/10">
          <CardContent className="p-4 space-y-3">
            <Label className="text-sm font-semibold">Já tem cadastro?</Label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Digita o nome artístico ou da banda"
                className="h-12 pl-9"
              />
              {searching && (
                <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin text-muted-foreground" />
              )}
            </div>
            {suggestions.length > 0 && (
              <div className="border rounded-xl overflow-hidden bg-background">
                {suggestions.map((s) => (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() => loadArtistById(s.id)}
                    className="w-full text-left px-3 py-2.5 hover:bg-muted text-sm border-b last:border-b-0 flex items-center justify-between"
                  >
                    <span className="font-semibold">{s.name}</span>
                    {s.genre && (
                      <span className="text-xs text-muted-foreground">{s.genre}</span>
                    )}
                  </button>
                ))}
              </div>
            )}
            {artistId && (
              <div className="flex items-center justify-between gap-3 rounded-lg bg-muted/50 px-3 py-2 text-sm">
                <span className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                  Editando: <strong>{name || "sem nome"}</strong>
                  {!canEdit && (
                    <Badge variant="secondary" className="ml-2">somente leitura</Badge>
                  )}
                </span>
                <Button size="sm" variant="ghost" onClick={resetForm} type="button">
                  Novo cadastro
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {loading ? (
          <div className="flex items-center justify-center py-10">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
          </div>
        ) : (
          <fieldset disabled={!canEdit} className={cn(!canEdit && "opacity-70")}>
            {/* Avatar */}
            <section className="space-y-3">
              <Label className="text-base font-semibold">Foto de perfil / Logo</Label>
              <div className="flex items-center gap-4">
                <div className="h-24 w-24 rounded-2xl bg-muted overflow-hidden flex items-center justify-center border">
                  {avatarUrl ? (
                    <img src={avatarUrl} alt="Avatar" className="h-full w-full object-cover" />
                  ) : (
                    <ImageIcon className="h-8 w-8 text-muted-foreground" />
                  )}
                </div>
                <div className="flex-1">
                  <input
                    type="file"
                    accept="image/*"
                    id="avatar-input"
                    className="hidden"
                    onChange={(e) => {
                      const f = e.target.files?.[0];
                      if (f) handleAvatarUpload(f);
                    }}
                  />
                  <label htmlFor="avatar-input">
                    <Button asChild variant="outline" size="sm" disabled={uploadingAvatar || !canEdit}>
                      <span className="cursor-pointer">
                        {uploadingAvatar ? (
                          <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Enviando…</>
                        ) : (
                          <>Escolher imagem</>
                        )}
                      </span>
                    </Button>
                  </label>
                  <p className="text-xs text-muted-foreground mt-1">Quadrada de preferência. Até 5MB.</p>
                </div>
              </div>
            </section>

            {/* Identidade */}
            <section className="space-y-4 mt-6">
              <div className="space-y-2" data-field="name">
                <Label htmlFor="name" className="text-base font-semibold">
                  Nome artístico / Banda <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Como o público chama vocês"
                  aria-invalid={!!errors.name}
                  className={cn("h-12", errors.name && "border-destructive focus-visible:ring-destructive")}
                />
                {errors.name && <p className="text-xs text-destructive">{errors.name}</p>}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2" data-field="genre">
                  <Label className="text-base font-semibold">
                    Gênero musical <span className="text-destructive">*</span>
                  </Label>
                  <Select value={genre} onValueChange={setGenre}>
                    <SelectTrigger aria-invalid={!!errors.genre} className={cn("h-12", errors.genre && "border-destructive focus-visible:ring-destructive")}>
                      <SelectValue placeholder="Selecione" />
                    </SelectTrigger>
                    <SelectContent>
                      {GENEROS.map((g) => (
                        <SelectItem key={g} value={g}>{g}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {errors.genre && <p className="text-xs text-destructive">{errors.genre}</p>}
                  {genre === "Outro" && (
                    <div data-field="genreFree">
                      <Input
                        value={genreFree}
                        onChange={(e) => setGenreFree(e.target.value)}
                        placeholder="Digita o gênero"
                        aria-invalid={!!errors.genreFree}
                        className={cn("h-11 mt-2", errors.genreFree && "border-destructive focus-visible:ring-destructive")}
                      />
                      {errors.genreFree && <p className="text-xs text-destructive mt-1">{errors.genreFree}</p>}
                    </div>
                  )}
                </div>

                <div className="space-y-2" data-field="artistType">
                  <Label className="text-base font-semibold">
                    Tipo <span className="text-destructive">*</span>
                  </Label>
                  <Select value={artistType} onValueChange={(v) => setArtistType(v as any)}>
                    <SelectTrigger aria-invalid={!!errors.artistType} className={cn("h-12", errors.artistType && "border-destructive focus-visible:ring-destructive")}>
                      <SelectValue placeholder="Cover, autoral..." />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="cover">Cover</SelectItem>
                      <SelectItem value="autoral">Autoral</SelectItem>
                      <SelectItem value="both">Cover + Autoral</SelectItem>
                    </SelectContent>
                  </Select>
                  {errors.artistType && <p className="text-xs text-destructive">{errors.artistType}</p>}
                </div>
              </div>

              <div className="space-y-2" data-field="bio">
                <Label htmlFor="bio" className="text-base font-semibold">
                  Breve descrição <span className="text-destructive">*</span>
                </Label>
                <Textarea
                  id="bio"
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  placeholder="Conta em poucas linhas o que rola no palco."
                  rows={4}
                  maxLength={600}
                  aria-invalid={!!errors.bio}
                  className={cn(errors.bio && "border-destructive focus-visible:ring-destructive")}
                />
                <div className="flex items-center justify-between">
                  {errors.bio ? (
                    <p className="text-xs text-destructive">{errors.bio}</p>
                  ) : <span />}
                  <p className="text-xs text-muted-foreground">{bio.length}/600</p>
                </div>
              </div>
            </section>

            {/* Integrantes */}
            <section className="space-y-3 mt-6">
              <Label className="text-base font-semibold">Integrantes (opcional)</Label>
              <div className="flex gap-2">
                <Input
                  value={memberInput}
                  onChange={(e) => setMemberInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      addMember();
                    }
                  }}
                  placeholder="Nome do integrante"
                  className="h-11"
                />
                <Button type="button" onClick={addMember} variant="secondary" className="h-11">
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
              {members.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {members.map((m) => (
                    <Badge key={m} variant="secondary" className="pl-3 pr-1 py-1 gap-1">
                      {m}
                      <button
                        type="button"
                        onClick={() => setMembers(members.filter((x) => x !== m))}
                        className="ml-1 rounded-full hover:bg-background/50 p-0.5"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </Badge>
                  ))}
                </div>
              )}
            </section>

            {/* Contato */}
            <section className="space-y-4 mt-6">
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold">Contato para shows</h2>
                <Info className="h-4 w-4 text-muted-foreground" />
              </div>
              <div className="space-y-2" data-field="representativeName">
                <Label htmlFor="representativeName" className="text-base font-semibold">
                  Contato (nome do responsável) <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="representativeName"
                  name="name"
                  autoComplete="name"
                  value={representativeName}
                  onChange={(e) => setRepresentativeName(e.target.value)}
                  placeholder="Ex: João da Silva"
                  aria-invalid={!!errors.representativeName}
                  className={cn("h-12", errors.representativeName && "border-destructive focus-visible:ring-destructive")}
                />
                {errors.representativeName && <p className="text-xs text-destructive">{errors.representativeName}</p>}
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2" data-field="whatsapp">
                  <Label htmlFor="whatsapp" className="text-base font-semibold">
                    WhatsApp
                  </Label>
                  <Input
                    id="whatsapp"
                    name="tel"
                    autoComplete="tel"
                    value={whatsapp}
                    onChange={(e) => setWhatsapp(formatPhoneDisplay(e.target.value))}
                    placeholder="(21) 99999-9999"
                    inputMode="tel"
                    maxLength={16}
                    aria-invalid={!!errors.whatsapp}
                    className={cn("h-12", errors.whatsapp && "border-destructive focus-visible:ring-destructive")}
                  />
                  {errors.whatsapp ? (
                    <p className="text-xs text-destructive">{errors.whatsapp}</p>
                  ) : whatsapp && !("valid" in whatsappValid && whatsappValid.valid) && (
                    <p className="text-xs text-destructive">
                      {"reason" in whatsappValid ? whatsappValid.reason : "Número inválido"}
                    </p>
                  )}
                </div>
                <div className="space-y-2" data-field="contactEmail">
                  <Label htmlFor="contactEmail" className="text-base font-semibold">E-mail</Label>
                  <Input
                    id="contactEmail"
                    name="email"
                    autoComplete="email"
                    type="email"
                    value={contactEmail}
                    onChange={(e) => setContactEmail(e.target.value)}
                    placeholder="contato@banda.com"
                    aria-invalid={!!errors.contactEmail}
                    className={cn("h-12", errors.contactEmail && "border-destructive focus-visible:ring-destructive")}
                  />
                  {errors.contactEmail && <p className="text-xs text-destructive">{errors.contactEmail}</p>}
                </div>
              </div>
            </section>

            {/* Links */}
            <section className="space-y-4 mt-6">
              <h2 className="text-lg font-bold">Links externos</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2" data-field="instagram">
                  <Label className="text-base font-semibold">Instagram</Label>
                  <Input
                    value={instagram}
                    onChange={(e) => setInstagram(e.target.value)}
                    placeholder="@sua.banda"
                    aria-invalid={!!errors.instagram}
                    className={cn("h-12", errors.instagram && "border-destructive focus-visible:ring-destructive")}
                  />
                  {errors.instagram && <p className="text-xs text-destructive">{errors.instagram}</p>}
                </div>
                <div className="space-y-2" data-field="spotify">
                  <Label className="text-base font-semibold">Spotify</Label>
                  <Input
                    value={spotify}
                    onChange={(e) => setSpotify(e.target.value)}
                    placeholder="https://open.spotify.com/..."
                    aria-invalid={!!errors.spotify}
                    className={cn("h-12", errors.spotify && "border-destructive focus-visible:ring-destructive")}
                  />
                  {errors.spotify && <p className="text-xs text-destructive">{errors.spotify}</p>}
                </div>
                <div className="space-y-2" data-field="youtube">
                  <Label className="text-base font-semibold">YouTube</Label>
                  <Input
                    value={youtube}
                    onChange={(e) => setYoutube(e.target.value)}
                    placeholder="https://youtube.com/..."
                    aria-invalid={!!errors.youtube}
                    className={cn("h-12", errors.youtube && "border-destructive focus-visible:ring-destructive")}
                  />
                  {errors.youtube && <p className="text-xs text-destructive">{errors.youtube}</p>}
                </div>
                <div className="space-y-2" data-field="website">
                  <Label className="text-base font-semibold">Site oficial</Label>
                  <Input
                    value={website}
                    onChange={(e) => setWebsite(e.target.value)}
                    placeholder="https://..."
                    aria-invalid={!!errors.website}
                    className={cn("h-12", errors.website && "border-destructive focus-visible:ring-destructive")}
                  />
                  {errors.website && <p className="text-xs text-destructive">{errors.website}</p>}
                </div>
              </div>
            </section>

            {/* Save */}
            <div className="sticky bottom-4 mt-8 z-10">
              {submitAttempted && hasErrors && (
                <p className="mb-2 text-center text-xs text-destructive font-medium">
                  Tem campo faltando ou inválido. Confere aí em cima.
                </p>
              )}
              <Button
                onClick={handleSave}
                disabled={saving || !canEdit || (submitAttempted && hasErrors)}
                className="w-full h-14 text-base font-bold rounded-full gradient-sunset shadow-lg"
              >
                {saving ? (
                  <Loader2 className="h-5 w-5 animate-spin" />
                ) : (
                  <><Save className="h-4 w-4 mr-2" /> {artistId ? "Atualizar cadastro" : "Salvar cadastro"}</>
                )}
              </Button>
            </div>

            {/* Galeria de mídia */}
            {artistId && canEdit && (
              <section className="space-y-3 mt-8">
                <h2 className="text-lg font-bold">Galeria de mídia</h2>
                <p className="text-sm text-muted-foreground">
                  Envia fotos, vídeos curtos e releases. Isso ajuda quem procura atração pra próximo rolê.
                </p>
                <MediaUploadForm artistId={artistId} onMediaUploaded={() => { /* noop */ }} />
              </section>
            )}
          </fieldset>
        )}
      </div>
    </div>
  );
}