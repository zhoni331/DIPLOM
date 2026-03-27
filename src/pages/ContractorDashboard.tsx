import { useState } from "react";
import { useAuth } from "@/lib/auth";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations_supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import StarRating from "@/components/StarRating";
import TrustScoreBadge from "@/components/TrustScoreBadge";
import { Plus, Building2, Image, MessageSquare, Send } from "lucide-react";
import { toast } from "sonner";

export default function ContractorDashboard() {
  const { user } = useAuth();
  const qc = useQueryClient();

  const { data: team } = useQuery({
    queryKey: ["my-team"],
    queryFn: async () => {
      const { data, error } = await supabase.from("teams").select("*").eq("owner_user_id", user!.id).single();
      if (error && error.code !== "PGRST116") throw error;
      return data;
    },
    enabled: !!user,
  });

  const { data: portfolio } = useQuery({
    queryKey: ["my-portfolio", team?.id],
    queryFn: async () => {
      const { data, error } = await supabase.from("portfolio_items").select("*").eq("team_id", team!.id).order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!team,
  });

  const { data: reviews } = useQuery({
    queryKey: ["team-reviews", team?.id],
    queryFn: async () => {
      const { data, error } = await supabase.from("reviews").select("*, review_replies(*)").eq("team_id", team!.id).eq("status", "approved").order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!team,
  });

  // Create team
  const [teamOpen, setTeamOpen] = useState(false);
  const [teamForm, setTeamForm] = useState({ name: "", city: "Astana", description: "", specialties: "", years_experience: 0, pricing_model: "" });
  const createTeam = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("teams").insert({
        owner_user_id: user!.id,
        name: teamForm.name,
        city: teamForm.city,
        description: teamForm.description,
        specialties: teamForm.specialties.split(",").map((s) => s.trim()).filter(Boolean),
        years_experience: teamForm.years_experience,
        pricing_model: teamForm.pricing_model,
      });
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["my-team"] }); toast.success("Team created!"); setTeamOpen(false); },
    onError: (e: any) => toast.error(e.message),
  });

  // Add portfolio
  const [portOpen, setPortOpen] = useState(false);
  const [portForm, setPortForm] = useState({ title: "", description: "" });
  const [beforeFile, setBeforeFile] = useState<File | null>(null);
  const [afterFile, setAfterFile] = useState<File | null>(null);

  const addPortfolio = useMutation({
    mutationFn: async () => {
      let before_url = "";
      let after_url = "";
      const upload = async (file: File, prefix: string) => {
        const path = `${team!.id}/${prefix}_${crypto.randomUUID()}.${file.name.split(".").pop()}`;
        const { error } = await supabase.storage.from("portfolio").upload(path, file);
        if (error) throw error;
        return supabase.storage.from("portfolio").getPublicUrl(path).data.publicUrl;
      };
      if (beforeFile) before_url = await upload(beforeFile, "before");
      if (afterFile) after_url = await upload(afterFile, "after");
      const { error } = await supabase.from("portfolio_items").insert({ team_id: team!.id, title: portForm.title, description: portForm.description, before_image_url: before_url || null, after_image_url: after_url || null });
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["my-portfolio"] }); toast.success("Portfolio item added!"); setPortOpen(false); setPortForm({ title: "", description: "" }); setBeforeFile(null); setAfterFile(null); },
    onError: (e: any) => toast.error(e.message),
  });

  // Reply to review
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [replyBody, setReplyBody] = useState("");
  const addReply = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("review_replies").insert({ review_id: replyingTo!, contractor_user_id: user!.id, body: replyBody });
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["team-reviews"] }); toast.success("Reply posted!"); setReplyingTo(null); setReplyBody(""); },
    onError: (e: any) => toast.error(e.message),
  });

  if (!team) {
    return (
      <div className="container mx-auto px-4 py-12 text-center">
        <h1 className="font-heading text-3xl font-bold mb-4">Contractor Dashboard</h1>
        <p className="text-muted-foreground mb-6">You haven't created a team yet.</p>
        <Dialog open={teamOpen} onOpenChange={setTeamOpen}>
          <DialogTrigger asChild><Button><Plus className="mr-2 h-4 w-4" />Create Your Team</Button></DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Create Team</DialogTitle></DialogHeader>
            <div className="space-y-4">
              <div><Label>Team Name</Label><Input value={teamForm.name} onChange={(e) => setTeamForm({ ...teamForm, name: e.target.value })} required /></div>
              <div><Label>City</Label><Input value={teamForm.city} onChange={(e) => setTeamForm({ ...teamForm, city: e.target.value })} /></div>
              <div><Label>Specialties (comma-separated)</Label><Input value={teamForm.specialties} onChange={(e) => setTeamForm({ ...teamForm, specialties: e.target.value })} placeholder="Plumbing, Electrical, Tiling" /></div>
              <div><Label>Years Experience</Label><Input type="number" value={teamForm.years_experience} onChange={(e) => setTeamForm({ ...teamForm, years_experience: parseInt(e.target.value) || 0 })} /></div>
              <div><Label>Pricing Model</Label><Input value={teamForm.pricing_model} onChange={(e) => setTeamForm({ ...teamForm, pricing_model: e.target.value })} placeholder="Per sqm, Hourly, Fixed" /></div>
              <div><Label>Description</Label><Textarea value={teamForm.description} onChange={(e) => setTeamForm({ ...teamForm, description: e.target.value })} /></div>
              <Button onClick={() => createTeam.mutate()} disabled={!teamForm.name || createTeam.isPending}>{createTeam.isPending ? "Creating..." : "Create Team"}</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-center gap-4 mb-8">
        <TrustScoreBadge score={Number(team.trust_score)} breakdown={team.trust_score_breakdown as any} />
        <div>
          <h1 className="font-heading text-3xl font-bold">{team.name}</h1>
          <div className="flex items-center gap-2 mt-1">
            <Badge variant={team.verified_status === "verified" ? "default" : "secondary"}>{team.verified_status}</Badge>
            <StarRating rating={Math.round(Number(team.avg_rating))} size={14} />
            <span className="text-sm text-muted-foreground">({team.review_count} reviews)</span>
          </div>
        </div>
      </div>

      <Tabs defaultValue="portfolio">
        <TabsList>
          <TabsTrigger value="portfolio"><Image className="mr-2 h-4 w-4" />Portfolio</TabsTrigger>
          <TabsTrigger value="reviews"><MessageSquare className="mr-2 h-4 w-4" />Reviews</TabsTrigger>
        </TabsList>

        <TabsContent value="portfolio" className="mt-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="font-heading text-xl font-semibold">Portfolio</h2>
            <Dialog open={portOpen} onOpenChange={setPortOpen}>
              <DialogTrigger asChild><Button size="sm"><Plus className="mr-2 h-4 w-4" />Add Item</Button></DialogTrigger>
              <DialogContent>
                <DialogHeader><DialogTitle>Add Portfolio Item</DialogTitle></DialogHeader>
                <div className="space-y-4">
                  <div><Label>Title</Label><Input value={portForm.title} onChange={(e) => setPortForm({ ...portForm, title: e.target.value })} /></div>
                  <div><Label>Description</Label><Textarea value={portForm.description} onChange={(e) => setPortForm({ ...portForm, description: e.target.value })} /></div>
                  <div><Label>Before Image</Label><Input type="file" accept="image/*" onChange={(e) => setBeforeFile(e.target.files?.[0] || null)} /></div>
                  <div><Label>After Image</Label><Input type="file" accept="image/*" onChange={(e) => setAfterFile(e.target.files?.[0] || null)} /></div>
                  <Button onClick={() => addPortfolio.mutate()} disabled={!portForm.title || addPortfolio.isPending}>{addPortfolio.isPending ? "Uploading..." : "Add Item"}</Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
          {!portfolio?.length ? <p className="text-muted-foreground text-center py-12">No portfolio items yet.</p> : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {portfolio.map((item) => (
                <Card key={item.id}>
                  <CardContent className="p-4">
                    <h4 className="font-semibold">{item.title}</h4>
                    <div className="grid grid-cols-2 gap-2 mt-2">
                      {item.before_image_url && <img src={item.before_image_url} alt="Before" className="rounded h-24 object-cover w-full" />}
                      {item.after_image_url && <img src={item.after_image_url} alt="After" className="rounded h-24 object-cover w-full" />}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="reviews" className="mt-6 space-y-4">
          {!reviews?.length ? <p className="text-muted-foreground text-center py-12">No approved reviews yet.</p> : (
            reviews.map((r) => (
              <Card key={r.id}>
                <CardContent className="p-4">
                  <div className="flex justify-between mb-2">
                    <div><h4 className="font-semibold">{r.title}</h4><StarRating rating={r.rating} size={14} /></div>
                    <span className="text-xs text-muted-foreground">{new Date(r.created_at).toLocaleDateString()}</span>
                  </div>
                  <p className="text-sm text-muted-foreground">{r.body}</p>
                  {(r.review_replies as any[])?.map((reply: any) => (
                    <div key={reply.id} className="mt-3 pl-4 border-l-2 border-secondary/30 text-sm">
                      <span className="font-medium">Your Reply:</span>
                      <p className="text-muted-foreground">{reply.body}</p>
                    </div>
                  ))}
                  {!(r.review_replies as any[])?.length && (
                    replyingTo === r.id ? (
                      <div className="mt-3 flex gap-2">
                        <Input value={replyBody} onChange={(e) => setReplyBody(e.target.value)} placeholder="Write your reply..." className="flex-1" />
                        <Button size="sm" onClick={() => addReply.mutate()} disabled={!replyBody || addReply.isPending}><Send className="h-4 w-4" /></Button>
                      </div>
                    ) : (
                      <Button size="sm" variant="ghost" className="mt-2" onClick={() => setReplyingTo(r.id)}>Reply</Button>
                    )
                  )}
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
