import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { FileText, ExternalLink, Loader2 } from "lucide-react";
import { toast } from "sonner";

interface Props {
  path?: string | null;
  fileName?: string | null;
  className?: string;
}

const IMAGE_RE = /\.(jpe?g|png|webp|heic|heif|gif)$/i;

const DocumentAttachmentLink = ({ path, fileName, className }: Props) => {
  const [loading, setLoading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const label = fileName || path?.split("/").pop() || "Document atașat";
  const isImage = IMAGE_RE.test(label) || IMAGE_RE.test(path || "");

  const getSignedUrl = async (): Promise<string | null> => {
    if (!path) return null;
    const { data, error } = await supabase.storage
      .from("teacher-documents")
      .createSignedUrl(path, 60);
    if (error || !data?.signedUrl) {
      console.error(error);
      toast.error("Nu am putut deschide documentul.");
      return null;
    }
    return data.signedUrl;
  };

  const open = async () => {
    setLoading(true);
    try {
      const url = await getSignedUrl();
      if (url) window.open(url, "_blank", "noopener,noreferrer");
    } finally {
      setLoading(false);
    }
  };

  const loadPreview = async () => {
    if (previewUrl || loading) return;
    setLoading(true);
    try {
      const url = await getSignedUrl();
      if (url) setPreviewUrl(url);
    } finally {
      setLoading(false);
    }
  };

  if (!path) {
    return (
      <p className={`text-xs text-muted-foreground ${className ?? ""}`}>
        📎 {label} — fișierul nu are o cale salvată, nu poate fi deschis.
      </p>
    );
  }

  return (
    <div className={`space-y-1.5 ${className ?? ""}`}>
      <button
        type="button"
        onClick={open}
        disabled={loading}
        className="text-xs text-primary flex items-center gap-1 hover:underline disabled:opacity-60"
      >
        {loading ? (
          <Loader2 className="h-3 w-3 animate-spin" />
        ) : (
          <FileText className="h-3 w-3" />
        )}
        <span className="truncate max-w-[220px]">{label}</span>
        <ExternalLink className="h-3 w-3 shrink-0" />
      </button>

      {isImage && (
        <>
          {previewUrl ? (
            <button type="button" onClick={open} className="block">
              <img
                src={previewUrl}
                alt={`Previzualizare document: ${label}`}
                loading="lazy"
                className="max-h-32 rounded-md border border-border object-contain"
              />
            </button>
          ) : (
            <button
              type="button"
              onClick={loadPreview}
              disabled={loading}
              className="text-[10px] text-muted-foreground hover:text-foreground transition-colors"
            >
              Arată previzualizarea
            </button>
          )}
        </>
      )}
    </div>
  );
};

export default DocumentAttachmentLink;
