import { ReactNode } from "react";
import WebHeader from "./WebHeader";
import WebFooter from "./WebFooter";
import { useRedirectIfNative } from "@/hooks/useRedirectIfNative";

interface Props {
  children: ReactNode;
}

const WebLayout = ({ children }: Props) => {
  useRedirectIfNative();
  return (
    <div className="flex min-h-screen flex-col bg-background">
      <WebHeader />
      <main className="flex-1">{children}</main>
      <WebFooter />
    </div>
  );
};

export default WebLayout;
