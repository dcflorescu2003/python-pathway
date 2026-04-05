import { motion } from "framer-motion";
import splashLogo from "@/assets/splash-logo.png";

const SplashScreen = () => {
  return (
    <div className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-background">
      <motion.div
        initial={{ scale: 0.5, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: "spring", stiffness: 260, damping: 20 }}
        className="flex flex-col items-center gap-4"
      >
        <img src={logo} alt="PyRo" className="h-24 w-24 rounded-2xl" />
        <h1 className="text-3xl font-bold font-mono">
          <span className="text-gradient-primary">Py</span><span className="text-tricolor">Ro</span>
        </h1>
        <p className="text-sm text-muted-foreground">Învață Python pas cu pas</p>
      </motion.div>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
        className="absolute bottom-20 flex flex-col items-center gap-2"
      >
        <div className="h-1 w-16 overflow-hidden rounded-full bg-muted">
          <motion.div
            className="h-full bg-primary rounded-full"
            initial={{ width: "0%" }}
            animate={{ width: "100%" }}
            transition={{ duration: 1.2, ease: "easeInOut" }}
          />
        </div>
      </motion.div>
    </div>
  );
};

export default SplashScreen;
