import { SupabaseClient } from "@supabase/supabase-js";

/**
 * Persisting inbound media happens at webhook time, never when a conversation
 * is opened.
 *
 * Instagram hands us a lookaside URL that expires within minutes: fetching it
 * lazily means the image is already gone by the time anyone looks. WhatsApp
 * gives a media id that only the relay can resolve, and resolving it on every
 * read would repeat that work forever. Either way the file is copied into our
 * own bucket once, on arrival, and the stored URL is what the UI renders.
 *
 * Every failure here is soft: the message still lands, the attachment keeps
 * whatever reference it had, and `ingest_error` records why so the admin
 * webhook monitor can show it.
 */

const BUCKET = "message-attachments";

/** Above this we keep the reference rather than copying the bytes. */
const MAX_INGEST_BYTES = 50 * 1024 * 1024;

/** Inbound media must not hold the webhook response open indefinitely. */
const FETCH_TIMEOUT_MS = 15_000;

export interface InboundAttachment {
  type?: string;
  /** Set once the file lives in our bucket. */
  url?: string;
  /** Instagram lookaside URL — short-lived, only useful at receipt time. */
  source_url?: string;
  /** WhatsApp media id, resolvable through the relay. */
  media_id?: string;
  mime_type?: string;
  filename?: string;
  sha256?: string;
  ingest_error?: string;
}

const EXTENSIONS: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/gif": "gif",
  "application/pdf": "pdf",
  "audio/mpeg": "mp3",
  "audio/ogg": "ogg",
  "audio/wav": "wav",
  "audio/webm": "weba",
  "audio/mp4": "m4a",
  "video/mp4": "mp4",
};

function extensionFor(mime: string, filename?: string): string {
  const fromName = filename?.match(/\.([a-z0-9]{1,5})$/i)?.[1];
  if (fromName) return fromName.toLowerCase();
  return EXTENSIONS[mime.split(";")[0].trim().toLowerCase()] || "bin";
}

/** Broad category the UI renders from, derived from the real Content-Type. */
function kindFor(mime: string, fallback?: string): string {
  if (mime.startsWith("image/")) return "image";
  if (mime.startsWith("audio/")) return "audio";
  if (mime.startsWith("video/")) return "video";
  if (mime === "application/pdf") return "document";
  return fallback || "document";
}

async function store(
  supabase: SupabaseClient,
  orgId: string,
  bytes: ArrayBuffer,
  mime: string,
  attachment: InboundAttachment
): Promise<InboundAttachment> {
  if (bytes.byteLength > MAX_INGEST_BYTES) {
    return {
      ...attachment,
      ingest_error: `Fichier trop volumineux pour être archivé (${Math.round(bytes.byteLength / 1024 / 1024)} Mo)`,
    };
  }

  const extension = extensionFor(mime, attachment.filename);
  const path = `${orgId}/inbound/${Date.now()}-${Math.random().toString(36).slice(2, 10)}.${extension}`;

  const { error } = await supabase.storage
    .from(BUCKET)
    .upload(path, bytes, { contentType: mime, upsert: false });

  if (error) {
    return { ...attachment, ingest_error: `Archivage impossible : ${error.message}` };
  }

  const { data } = supabase.storage.from(BUCKET).getPublicUrl(path);

  return {
    ...attachment,
    url: data.publicUrl,
    mime_type: mime,
    type: kindFor(mime, attachment.type),
  };
}

/**
 * Copy an Instagram lookaside URL into our bucket.
 *
 * The URL is passed straight through by the relay and is already fetchable —
 * there is nothing to request from the partner API for this channel. It just
 * has to happen now, while the link is still alive.
 */
export async function ingestFromUrl(
  supabase: SupabaseClient,
  orgId: string,
  sourceUrl: string,
  attachment: InboundAttachment = {}
): Promise<InboundAttachment> {
  const base: InboundAttachment = { ...attachment, source_url: sourceUrl };

  try {
    const res = await fetch(sourceUrl, {
      cache: "no-store",
      signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
    });

    if (!res.ok) {
      return { ...base, ingest_error: `Téléchargement refusé (${res.status})` };
    }

    const mime = res.headers.get("content-type")?.split(";")[0].trim() || "application/octet-stream";
    return await store(supabase, orgId, await res.arrayBuffer(), mime, base);
  } catch (err) {
    return {
      ...base,
      ingest_error: `Téléchargement impossible : ${err instanceof Error ? err.message : "erreur inconnue"}`,
    };
  }
}

/**
 * Resolve a WhatsApp media id through the relay and store the bytes.
 *
 * The relay does the two-step Graph exchange with the client's own credentials,
 * so no Meta token is handled here, and the call is not billed.
 */
export async function ingestFromMediaId(
  supabase: SupabaseClient,
  orgId: string,
  mediaId: string,
  clientRef: string,
  attachment: InboundAttachment = {}
): Promise<InboundAttachment> {
  const base: InboundAttachment = { ...attachment, media_id: mediaId };

  try {
    const { fetchIntelliMedia, IntelliAPIError } = await import("@/lib/intelli/partner-client");

    try {
      const media = await fetchIntelliMedia({
        mediaId,
        clientRef,
        signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
      });

      const stored = await store(supabase, orgId, media.bytes, media.contentType, base);
      return media.sha256 ? { ...stored, sha256: media.sha256 } : stored;
    } catch (err) {
      // Instagram has no id to resolve — the payload URL is the file. Reaching
      // here means the caller used the wrong shape for the channel.
      if (err instanceof IntelliAPIError && err.code === "channel_media_inline") {
        return {
          ...base,
          ingest_error:
            "Média Instagram : l'URL est fournie dans le payload, il n'y a pas d'identifiant à résoudre.",
        };
      }
      throw err;
    }
  } catch (err) {
    return {
      ...base,
      ingest_error: `Récupération impossible : ${err instanceof Error ? err.message : "erreur inconnue"}`,
    };
  }
}
