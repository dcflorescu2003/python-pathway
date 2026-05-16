import { useState, useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { toast } from "sonner";
import { Search, RefreshCw, Crown, User as UserIcon } from "lucide-react";

interface AdminUser {
  user_id: string;
  email: string | null;
  display_name: string | null;
  first_name: string | null;
  last_name: string | null;
  nickname: string | null;
  is_premium: boolean;
  is_teacher: boolean;
  teacher_status: string | null;
  premium_source: "none" | "stripe" | "play" | "appstore" | "coupon";
  play_expiry: string | null;
  coupon_until: string | null;
  coupon_type: string | null;
}

const PAGE_SIZE = 50;

const UsersManager = () => {
  const qc = useQueryClient();
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");
  const [page, setPage] = useState(0);

  useEffect(() => {
    const t = setTimeout(() => {
      setSearch(searchInput.trim());
      setPage(0);
    }, 300);
    return () => clearTimeout(t);
  }, [searchInput]);

  const { data, isLoading, isFetching, refetch } = useQuery({
    queryKey: ["admin-users", search, filter, page],
    queryFn: async () => {
      const { data, error } = await supabase.functions.invoke("admin-list-users", {
        body: { search, filter, limit: PAGE_SIZE, offset: page * PAGE_SIZE },
      });
      if (error) throw error;
      return data as { users: AdminUser[]; total: number; total_all: number };
    },
  });

  const users = data?.users || [];
  const total = data?.total || 0;
  const totalAll = data?.total_all || 0;
  const maxPage = Math.max(0, Math.ceil(total / PAGE_SIZE) - 1);

  const togglePremium = async (u: AdminUser, value: boolean) => {
    const { error } = await supabase.rpc("admin_set_premium" as any, {
      p_user_id: u.user_id,
      p_premium: value,
    });
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success(value ? "Promovat la Premium" : "Retrogradat la Free");
    qc.invalidateQueries({ queryKey: ["admin-users"] });
  };

  const renderName = (u: AdminUser) => {
    const parts = [u.last_name, u.first_name].filter(Boolean).join(" ").trim();
    return parts || u.display_name || u.nickname || "—";
  };

  const renderPremiumBadge = (u: AdminUser) => {
    if (!u.is_premium) return <Badge variant="secondary">Free</Badge>;
    return (
      <Badge className="bg-amber-500 text-amber-50 hover:bg-amber-500/90">
        <Crown className="h-3 w-3 mr-1" />
        Premium
      </Badge>
    );
  };

  const renderSourceBadge = (u: AdminUser) => {
    if (!u.is_premium) return <span className="text-xs text-muted-foreground">—</span>;
    switch (u.premium_source) {
      case "play":
        return <Badge className="bg-emerald-600 text-emerald-50">Plătit · Google Play</Badge>;
      case "appstore":
        return <Badge className="bg-emerald-600 text-emerald-50">Plătit · App Store</Badge>;
      case "stripe":
        return <Badge className="bg-emerald-600 text-emerald-50">Plătit · Web</Badge>;
      case "coupon":
        return <Badge className="bg-blue-600 text-blue-50">Cupon</Badge>;
      default:
        return <span className="text-xs text-muted-foreground">—</span>;
    }
  };

  return (
    <Card className="border-border">
      <CardContent className="p-4 space-y-4">
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Caută după nume, nickname sau email..."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              className="pl-9"
            />
          </div>
          <Select value={filter} onValueChange={(v) => { setFilter(v); setPage(0); }}>
            <SelectTrigger className="w-[180px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Toți</SelectItem>
              <SelectItem value="premium">Premium</SelectItem>
              <SelectItem value="free">Free</SelectItem>
              <SelectItem value="paid">Plătit</SelectItem>
              <SelectItem value="coupon">Cupon</SelectItem>
              <SelectItem value="teacher">Profesori</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" size="icon" onClick={() => refetch()} disabled={isFetching}>
            <RefreshCw className={`h-4 w-4 ${isFetching ? "animate-spin" : ""}`} />
          </Button>
        </div>

        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span>{isLoading ? "Se încarcă..." : `${total} utilizatori găsiți`}</span>
          {!isLoading && (
            <Badge variant="outline" className="text-xs font-mono">
              Total în sistem: {totalAll.toLocaleString('ro-RO')}
            </Badge>
          )}
        </div>

        <div className="rounded-md border border-border overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nume</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Tip cont</TableHead>
                <TableHead>Sursă</TableHead>
                <TableHead className="text-right">Acțiune</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {users.map((u) => (
                <TableRow key={u.user_id}>
                  <TableCell>
                    <div className="flex flex-col">
                      <span className="text-sm text-foreground">{renderName(u)}</span>
                      {u.nickname && (
                        <span className="text-xs text-muted-foreground">@{u.nickname}</span>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground break-all max-w-[220px]">
                    {u.email || "—"}
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1">
                      {renderPremiumBadge(u)}
                      {u.is_teacher && (
                        <Badge variant="outline" className="text-xs">
                          {u.teacher_status === "verified" ? "Profesor ✓" : "Profesor"}
                        </Badge>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>{renderSourceBadge(u)}</TableCell>
                  <TableCell className="text-right">
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button
                          size="sm"
                          variant={u.is_premium ? "outline" : "default"}
                          className="gap-1"
                        >
                          {u.is_premium ? (
                            <><UserIcon className="h-3 w-3" /> Free</>
                          ) : (
                            <><Crown className="h-3 w-3" /> Premium</>
                          )}
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>
                            {u.is_premium ? "Retrogradezi la Free?" : "Promovezi la Premium?"}
                          </AlertDialogTitle>
                          <AlertDialogDescription>
                            {renderName(u)} ({u.email || "fără email"})
                            {u.is_premium && (u.premium_source === "play" || u.premium_source === "appstore") && (
                              <div className="mt-2 text-amber-500 text-sm">
                                ⚠️ Acest user are un abonament nativ activ ({u.premium_source}). Setarea va fi resincronizată automat la următoarea verificare.
                              </div>
                            )}
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Anulează</AlertDialogCancel>
                          <AlertDialogAction onClick={() => togglePremium(u, !u.is_premium)}>
                            Confirmă
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </TableCell>
                </TableRow>
              ))}
              {!isLoading && users.length === 0 && (
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-sm text-muted-foreground py-8">
                    Niciun utilizator găsit.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>

        <div className="flex items-center justify-between gap-2">
          <Button
            variant="outline"
            size="sm"
            disabled={page === 0 || isFetching}
            onClick={() => setPage((p) => Math.max(0, p - 1))}
          >
            ← Anterior
          </Button>
          <span className="text-xs text-muted-foreground">
            Pagina {page + 1} / {maxPage + 1}
          </span>
          <Button
            variant="outline"
            size="sm"
            disabled={page >= maxPage || isFetching}
            onClick={() => setPage((p) => p + 1)}
          >
            Următor →
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default UsersManager;
