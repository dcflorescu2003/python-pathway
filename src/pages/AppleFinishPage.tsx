import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import LoadingScreen from "@/components/states/LoadingScreen";

const AppleFinishPage = () => {
  const navigate = useNavigate();
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    const finalize = async () => {
      const hash = window.location.hash.startsWith("#")
        ? window.location.hash.slice(1)
        : window.location.hash;
      const params = new URLSearchParams(hash);

      const error = params.get("error");
      if (error) {
        setErrorMsg(error);
        toast.error("Login Apple eșuat", { description: error });
        setTimeout(() => navigate("/auth", { replace: true }), 1500);
        return;
      }

      const tokenHash = params.get("token_hash");
      const type = params.get("type") as "magiclink" | null;

      if (!tokenHash || !type) {
        setErrorMsg("Date lipsă");
        toast.error("Login Apple eșuat", { description: "Date lipsă" });
        setTimeout(() => navigate("/auth", { replace: true }), 1500);
        return;
      }

      const { error: verifyErr } = await supabase.auth.verifyOtp({
        token_hash: tokenHash,
        type,
      });

      if (verifyErr) {
        setErrorMsg(verifyErr.message);
        toast.error("Login Apple eșuat", { description: verifyErr.message });
        setTimeout(() => navigate("/auth", { replace: true }), 1500);
        return;
      }

      // Curăță hash-ul și du-l acasă
      window.history.replaceState(null, "", "/");
      navigate("/", { replace: true });
    };

    finalize();
  }, [navigate]);

  if (errorMsg) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background p-6">
        <div className="text-center space-y-2">
          <p className="text-foreground font-mono">Apple login eșuat</p>
          <p className="text-muted-foreground text-sm">{errorMsg}</p>
        </div>
      </div>
    );
  }

  return <LoadingScreen />;
};

export default AppleFinishPage;
