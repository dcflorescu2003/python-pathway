import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useAdminAccess } from "@/hooks/useAdminAccess";
import ContentEditor from "@/components/admin/ContentEditor";
import ProblemsEditor from "@/components/admin/ProblemsEditor";
import CouponManager from "@/components/admin/CouponManager";
import AdminSettings from "@/components/admin/AdminSettings";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BookOpen, Ticket, Code2, Settings } from "lucide-react";

const AdminPage = () => {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const { isAdmin, isLoading: adminLoading } = useAdminAccess();

  if (authLoading || adminLoading) return <div className="flex items-center justify-center min-h-screen text-muted-foreground">Se încarcă...</div>;
  if (!isAdmin) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen gap-4 text-center px-4">
        <h1 className="text-2xl font-bold text-foreground">Acces restricționat</h1>
        <p className="text-muted-foreground">Nu ai permisiuni pentru această pagină.</p>
        <Button onClick={() => navigate("/")}>Înapoi acasă</Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-40 border-b border-border bg-background/80 backdrop-blur-md pt-[env(safe-area-inset-top)]">
        <div className="flex items-center gap-3 px-4 py-3">
          <span className="text-xl">⚙️</span>
          <h1 className="text-lg font-bold text-foreground flex-1">Admin</h1>
        </div>
      </header>

      <main className="px-4 py-4">
        <Tabs defaultValue="editor" className="w-full">
          <TabsList className="w-full mb-4">
            <TabsTrigger value="editor" className="flex-1 gap-2">
              <BookOpen className="h-4 w-4" />
              Lecții
            </TabsTrigger>
            <TabsTrigger value="problems" className="flex-1 gap-2">
              <Code2 className="h-4 w-4" />
              Probleme
            </TabsTrigger>
            <TabsTrigger value="coupons" className="flex-1 gap-2">
              <Ticket className="h-4 w-4" />
              Cupoane
            </TabsTrigger>
            <TabsTrigger value="settings" className="flex-1 gap-2">
              <Settings className="h-4 w-4" />
              Setări
            </TabsTrigger>
          </TabsList>

          <TabsContent value="editor">
            <ContentEditor />
          </TabsContent>

          <TabsContent value="problems">
            <ProblemsEditor />
          </TabsContent>

          <TabsContent value="coupons">
            <CouponManager />
          </TabsContent>

          <TabsContent value="settings">
            <AdminSettings currentUserEmail={user?.email || ""} />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

export default AdminPage;
