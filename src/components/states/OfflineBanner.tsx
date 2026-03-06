import { useOnlineStatus } from "@/hooks/useOnlineStatus";
import { WifiOff } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";

const OfflineBanner = () => {
  const isOnline = useOnlineStatus();

  return (
    <AnimatePresence>
      {!isOnline && (
        <motion.div
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: "auto", opacity: 1 }}
          exit={{ height: 0, opacity: 0 }}
          className="bg-warning/10 border-b border-warning/30 overflow-hidden"
        >
          <div className="flex items-center justify-center gap-2 px-4 py-2">
            <WifiOff className="h-4 w-4 text-warning" />
            <span className="text-xs font-medium text-warning">Fără conexiune la internet</span>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default OfflineBanner;
