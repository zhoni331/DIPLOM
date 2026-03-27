import { useState } from "react";
import { useAuth } from "@/lib/auth";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations_supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import StarRating from "@/components/StarRating";
import { Plus, FolderOpen, MessageSquare, Camera } from "lucide-react";
import { toast } from "sonner";

export default function HomeownerDashboard() {
  const { user } = useAuth();
  const qc = useQueryClient();

  // Projects
  const { data: projects } = useQuery({
    queryKey: ["my-projects"],
    queryFn: async () => {
      const { data, error } = await supabase.from("projects").select("*, teams(name)").eq("homeowner_user_id", user!.id).order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  // My Reviews
  const { data: myReviews } = useQuery({
    queryKey: ["my-reviews"],
    queryFn: async () => {
      const { data, error } = await supabase.from("reviews").select("*, teams(name)").eq("homeowner_user_id", user!.id).order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  // Teams for project creation
  const { data: teams } = useQuery({
    queryKey: ["all-teams"],
    queryFn: async () => {
      const { data, error } = await supabase.from("teams").select("id, name").order("name");
      if (error) throw error;
      return data;
    },
  });

  // Create project
  const [projOpen, setProjOpen] = useState(false);
  const [projForm, setProjForm] = useState({ title: "", description: "", team_id: "", district: "" });
  const createProject = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("projects").insert({ ...projForm, homeowner_user_id: user!.id });
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["my-projects"] }); toast.success("Project created!"); setProjOpen(false); setProjForm({ title: "", description: "", team_id: "", district: "" }); },
    onError: (e: any) => toast.error(e.message),
  });

  // Complete project
  const completeProject = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("projects").update({ status: "completed", end_date: new Date().toISOString().split("T")[0] }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["my-projects"] }); toast.success("Project marked as completed!"); },
  });

  // Create review
  const [revOpen, setRevOpen] = useState(false);
  const [revForm, setRevForm] = useState({ project_id: "", rating: 5, title: "", body: "" });
  const [evidenceFiles, setEvidenceFiles] = useState<File[]>([]);

  const completedProjects = projects?.filter((p) => p.status === "completed");

  const createReview = useMutation({
    mutationFn: async () => {
      const project = projects?.find((p) => p.id === revForm.project_id);
      if (!project) throw new Error("Select a project");
      
      const { data: review, error } = await supabase.from("reviews").insert({
        team_id: project.team_id,
        homeowner_user_id: user!.id,
        project_id: revForm.project_id,
        rating: revForm.rating,
        title: revForm.title,
        body: revForm.body,
        verification_type: "verified_project",
      }).select().single();
      if (error) throw error;

      // Upload evidence
      for (const file of evidenceFiles) {
        const ext = file.name.split(".").pop();
        const path = `${user!.id}/${review.id}/${crypto.randomUUID()}.${ext}`;
        const { error: uploadErr } = await supabase.storage.from("evidence").upload(path, file);
        if (uploadErr) continue;
        const { data: urlData } = supabase.storage.from("evidence").getPublicUrl(path);
        await supabase.from("review_evidence").insert({ review_id: review.id, image_url: urlData.publicUrl });
      }
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["my-reviews"] }); toast.success("Review submitted! Awaiting moderation."); setRevOpen(false); setRevForm({ project_id: "", rating: 5, title: "", body: "" }); setEvidenceFiles([]); },
    onError: (e: any) => toast.error(e.message),
  });

  const statusColor: Record<string, string> = { pending: "bg-warning text-warning-foreground", approved: "bg-success text-success-foreground", rejected: "bg-destructive text-destructive-foreground", planned: "bg-muted text-muted-foreground", active: "bg-primary text-primary-foreground", completed: "bg-success text-success-foreground" };

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="font-heading text-3xl font-bold mb-8">Homeowner Dashboard</h1>
      
      <Tabs defaultValue="projects">
        <TabsList>
          <TabsTrigger value="projects"><FolderOpen className="mr-2 h-4 w-4" />My Projects</TabsTrigger>
          <TabsTrigger value="reviews"><MessageSquare className="mr-2 h-4 w-4" />My Reviews</TabsTrigger>
        </TabsList>

        <TabsContent value="projects" className="mt-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="font-heading text-xl font-semibold">Projects</h2>
            <Dialog open={projOpen} onOpenChange={setProjOpen}>
              <DialogTrigger asChild><Button size="sm"><Plus className="mr-2 h-4 w-4" />New Project</Button></DialogTrigger>
              <DialogContent>
                <DialogHeader><DialogTitle>Create Project</DialogTitle></DialogHeader>
                <div className="space-y-4">
                  <div><Label>Title</Label><Input value={projForm.title} onChange={(e) => setProjForm({ ...projForm, title: e.target.value })} required /></div>
                  <div>
                    <Label>Team</Label>
                    <Select value={projForm.team_id} onValueChange={(v) => setProjForm({ ...projForm, team_id: v })}>
                      <SelectTrigger><SelectValue placeholder="Select team" /></SelectTrigger>
                      <SelectContent>{teams?.map((t) => <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                  <div><Label>District</Label><Input value={projForm.district} onChange={(e) => setProjForm({ ...projForm, district: e.target.value })} placeholder="e.g. Yesil" /></div>
                  <div><Label>Description</Label><Textarea value={projForm.description} onChange={(e) => setProjForm({ ...projForm, description: e.target.value })} /></div>
                  <Button onClick={() => createProject.mutate()} disabled={!projForm.title || !projForm.team_id || createProject.isPending}>
                    {createProject.isPending ? "Creating..." : "Create Project"}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
          {!projects?.length ? <p className="text-muted-foreground text-center py-12">No projects yet. Create your first one!</p> : (
            <div className="space-y-3">
              {projects.map((p) => (
                <Card key={p.id}>
                  <CardContent className="p-4 flex items-center justify-between">
                    <div>
                      <h3 className="font-semibold">{p.title}</h3>
                      <p className="text-sm text-muted-foreground">{(p as any).teams?.name} · {p.district}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge className={statusColor[p.status]}>{p.status}</Badge>
                      {p.status !== "completed" && <Button size="sm" variant="outline" onClick={() => completeProject.mutate(p.id)}>Mark Complete</Button>}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="reviews" className="mt-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="font-heading text-xl font-semibold">Reviews</h2>
            <Dialog open={revOpen} onOpenChange={setRevOpen}>
              <DialogTrigger asChild><Button size="sm" disabled={!completedProjects?.length}><Plus className="mr-2 h-4 w-4" />Write Review</Button></DialogTrigger>
              <DialogContent>
                <DialogHeader><DialogTitle>Write a Review</DialogTitle></DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label>Completed Project</Label>
                    <Select value={revForm.project_id} onValueChange={(v) => setRevForm({ ...revForm, project_id: v })}>
                      <SelectTrigger><SelectValue placeholder="Select project" /></SelectTrigger>
                      <SelectContent>{completedProjects?.map((p) => <SelectItem key={p.id} value={p.id}>{p.title} — {(p as any).teams?.name}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                  <div><Label>Rating</Label><StarRating rating={revForm.rating} onChange={(r) => setRevForm({ ...revForm, rating: r })} /></div>
                  <div><Label>Title</Label><Input value={revForm.title} onChange={(e) => setRevForm({ ...revForm, title: e.target.value })} /></div>
                  <div><Label>Review</Label><Textarea value={revForm.body} onChange={(e) => setRevForm({ ...revForm, body: e.target.value })} /></div>
                  <div>
                    <Label className="flex items-center gap-2"><Camera className="h-4 w-4" /> Photo Evidence</Label>
                    <Input type="file" accept="image/*" multiple onChange={(e) => setEvidenceFiles(Array.from(e.target.files || []))} className="mt-1" />
                    {evidenceFiles.length > 0 && <p className="text-xs text-muted-foreground mt-1">{evidenceFiles.length} file(s) selected</p>}
                  </div>
                  <Button onClick={() => createReview.mutate()} disabled={!revForm.project_id || !revForm.title || createReview.isPending}>
                    {createReview.isPending ? "Submitting..." : "Submit Review"}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
          {!myReviews?.length ? <p className="text-muted-foreground text-center py-12">No reviews yet.</p> : (
            <div className="space-y-3">
              {myReviews.map((r) => (
                <Card key={r.id}>
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="font-semibold">{r.title}</h3>
                        <p className="text-sm text-muted-foreground">{(r as any).teams?.name}</p>
                        <StarRating rating={r.rating} size={14} />
                      </div>
                      <Badge className={statusColor[r.status]}>{r.status}</Badge>
                    </div>
                    <p className="text-sm text-muted-foreground mt-2">{r.body}</p>
                    {r.status === "rejected" && r.rejection_reason && (
                      <p className="text-sm text-destructive mt-2">Rejection reason: {r.rejection_reason}</p>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
