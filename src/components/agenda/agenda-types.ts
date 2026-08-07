/** Assinatura única de compartilhamento usada pelos cards da agenda. */
export type ShareHandler = (title: string, text: string, url: string, eventId?: string) => void;
