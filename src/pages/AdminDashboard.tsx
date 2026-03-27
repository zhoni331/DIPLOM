import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations_supabase/client";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CheckCircle, XCircle, Shield, MessageSquare, Flag, Users, Ban } from "lucide-react";
import StarRating from "@/components/StarRating";
import { toast } from "sonner";
import { useState } from "react";

export default function AdminDashboard() {
  const { user } = useAuth();
  const qc = useQueryClient();

  // Pending reviews
  const { data: pendingReviews } = useQuery({
    queryKey: ["admin-pending-reviews"],
    queryFn: async () => {
      const { data, error } = await supabase.from("reviews").select("*, teams(name), review_evidence(*)").eq("status", "pending").order("created_at", { ascending: true });
      if (error) throw error;
      return data;
    },
  });

  // Pending teams
  const { data: pendingTeams } = useQuery({
    queryKey: ["admin-pending-teams"],
    queryFn: async () => {
      const { data, error } = await supabase.from("teams").select("*").eq("verified_status", "pending").order("created_at", { ascending: true });
      if (error) throw error;
      return data;
    },
  });

  // Reports
  const { data: reports } = useQuery({
    queryKey: ["admin-reports"],
    queryFn: async () => {
      const { data, error } = await supabase.from("reports").select("*").eq("status", "open").order("created_at", { ascending: true });
      if (error) throw error;
      return data;
    },
  });

  // Review actions
  const [rejectionReason, setRejectionReason] = useState<Record<string, string>>({});
  
  const approveReview = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("reviews").update({ status: "approved" }).eq("id", id);
      if (error) throw error;
      await supabase.from("audit_logs").insert({ actor_user_id: user!.id, action: "approve_review", entity_type: "review", entity_id: id });
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["admin-pending-reviews"] }); toast.success("Review approved!"); },
  });

  const rejectReview = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("reviews").update({ status: "rejected", rejection_reason: rejectionReason[id] || "Does not meet guidelines" }).eq("id", id);
      if (error) throw error;
      await supabase.from("audit_logs").insert({ actor_user_id: user!.id, action: "reject_review", entity_type: "review", entity_id: id });
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["admin-pending-reviews"] }); toast.success("Review rejected."); },
  });

  const verifyTeam = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: "verified" | "rejected" }) => {
      const { error } = await supabase.from("teams").update({ verified_status: status }).eq("id", id);
      if (error) throw error;
      await supabase.from("audit_logs").insert({ actor_user_id: user!.id, action: `team_${status}`, entity_type: "team", entity_id: id });
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["admin-pending-teams"] }); toast.success("Team status updated!"); },
  });

  const closeReport = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("reports").update({ status: "closed" }).eq("id", id);
      if (error) throw error;
      await supabase.from("audit_logs").insert({ actor_user_id: user!.id, action: "close_report", entity_type: "report", entity_id: id });
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["admin-reports"] }); toast.success("Report closed."); },
  });

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-center gap-3 mb-8">
        <Shield className="h-8 w-8 text-secondary" />
        <h1 className="font-heading text-3xl font-bold">Admin Dashboard</h1>
      </div>

      <div className="grid grid-cols-3 gap-4 mb-8">
        <Card><CardContent className="p-4 text-center"><div className="text-3xl font-bold text-primary">{pendingReviews?.length || 0}</div><p className="text-sm text-muted-foreground">Pending Reviews</p></CardContent></Card>
        <Card><CardContent className="p-4 text-center"><div className="text-3xl font-bold text-primary">{pendingTeams?.length || 0}</div><p className="text-sm text-muted-foreground">Pending Teams</p></CardContent></Card>
        <Card><CardContent className="p-4 text-center"><div className="text-3xl font-bold text-primary">{reports?.length || 0}</div><p className="text-sm text-muted-foreground">Open Reports</p></CardContent></Card>
      </div>

      <Tabs defaultValue="reviews">
        <TabsList>
          <TabsTrigger value="reviews"><MessageSquare className="mr-2 h-4 w-4" />Reviews ({pendingReviews?.length || 0})</TabsTrigger>
          <TabsTrigger value="teams"><Users className="mr-2 h-4 w-4" />Teams ({pendingTeams?.length || 0})</TabsTrigger>
          <TabsTrigger value="reports"><Flag className="mr-2 h-4 w-4" />Reports ({reports?.length || 0})</TabsTrigger>
        </TabsList>

        <TabsContent value="reviews" className="mt-6 space-y-4">
          {!pendingReviews?.length ? <p className="text-muted-foreground text-center py-12">No pending reviews 🎉</p> : (
            pendingReviews.map((r) => (
              <Card key={r.id}>
                <CardContent className="p-6">
                  <div className="flex justify-between mb-2">
                    <div>
                      <h3 className="font-semibold">{r.title}</h3>
                      <p className="text-sm text-muted-foreground">Team: {(r as any).teams?.name}</p>
                      <StarRating rating={r.rating} size={14} />
                    </div>
                    <Badge>{r.verification_type}</Badge>
                  </div>
                  <p className="text-sm my-3">{r.body}</p>
                  {(r.review_evidence as any[])?.length > 0 && (
                    <div className="flex gap-2 mb-3">
                      {(r.review_evidence as any[]).map((e: any) => (
                        <img key={e.id} src={e.image_url} alt="evidence" className="h-16 w-16 rounded object-cover border" />
                      ))}
                    </div>
                  )}
                  <div className="flex items-center gap-2">
                    <Button size="sm" onClick={() => approveReview.mutate(r.id)} className="bg-success hover:bg-success/90 text-success-foreground">
                      <CheckCircle className="mr-1 h-4 w-4" /> Approve
                    </Button>
                    <Input placeholder="Rejection reason..." className="flex-1 h-9" value={rejectionReason[r.id] || ""} onChange={(e) => setRejectionReason({ ...rejectionReason, [r.id]: e.target.value })} />
                    <Button size="sm" variant="destructive" onClick={() => rejectReview.mutate(r.id)}>
                      <XCircle className="mr-1 h-4 w-4" /> Reject
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>

        <TabsContent value="teams" className="mt-6 space-y-4">
          {!pendingTeams?.length ? <p className="text-muted-foreground text-center py-12">No pending teams 🎉</p> : (
            pendingTeams.map((t) => (
              <Card key={t.id}>
                <CardContent className="p-6">
                  <h3 className="font-semibold text-lg">{t.name}</h3>
                  <p className="text-sm text-muted-foreground">{t.city} · {t.years_experience} years · {(t.specialties as string[])?.join(", ")}</p>
                  <p className="text-sm mt-2">{t.description}</p>
                  <div className="flex gap-2 mt-4">
                    <Button size="sm" onClick={() => verifyTeam.mutate({ id: t.id, status: "verified" })} className="bg-success hover:bg-success/90 text-success-foreground">
                      <CheckCircle className="mr-1 h-4 w-4" /> Verify
                    </Button>
                    <Button size="sm" variant="destructive" onClick={() => verifyTeam.mutate({ id: t.id, status: "rejected" })}>
                      <XCircle className="mr-1 h-4 w-4" /> Reject
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>

        <TabsContent value="reports" className="mt-6 space-y-4">
          {!reports?.length ? <p className="text-muted-foreground text-center py-12">No open reports 🎉</p> : (
            reports.map((r) => (
              <Card key={r.id}>
                <CardContent className="p-6">
                  <div className="flex justify-between">
                    <div>
                      <Badge variant="outline">{r.target_type}</Badge>
                      <p className="font-semibold mt-1">{r.reason}</p>
                      <p className="text-sm text-muted-foreground mt-1">{r.details}</p>
                    </div>
                    <Button size="sm" variant="outline" onClick={() => closeReport.mutate(r.id)}>Close</Button>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
