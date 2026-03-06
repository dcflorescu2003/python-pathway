import { ReactNode } from "react";
import BottomNav from "./BottomNav";
import OfflineBanner from "@/components/states/OfflineBanner";

interface MobileLayoutProps {
  children: ReactNode;
}

const MobileLayout = ({ children }: MobileLayoutProps) => {
  return (
    <div className="min-h-screen bg-background">
      <OfflineBanner />
      <div className="pb-20">{children}</div>
      <BottomNav />
    </div>
  );
};

export default MobileLayout;
