import { useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations_supabase/client";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MapPin, CheckCircle, Calendar, Clock, DollarSign, User } from "lucide-react";
import TrustScoreBadge from "@/components/TrustScoreBadge";
import StarRating from "@/components/StarRating";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function TeamProfile() {
  const { id } = useParams<{ id: string }>();

  const { data: team, isLoading: teamLoading } = useQuery({
    queryKey: ["team", id],
    queryFn: async () => {
      const { data, error } = await supabase.from("teams").select("*").eq("id", id!).single();
      if (error) throw error;
      return data;
    },
    enabled: !!id,
  });

  const { data: portfolio } = useQuery({
    queryKey: ["portfolio", id],
    queryFn: async () => {
      const { data, error } = await supabase.from("portfolio_items").select("*").eq("team_id", id!).order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!id,
  });

  const { data: reviews } = useQuery({
    queryKey: ["reviews", id],
    queryFn: async () => {
      const { data, error } = await supabase.from("reviews").select("*, review_evidence(*), review_replies(*)").eq("team_id", id!).eq("status", "approved").order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!id,
  });

  if (teamLoading) return (
    <div className="container mx-auto px-4 py-12 space-y-6">
      <Skeleton className="h-8 w-64" /><Skeleton className="h-4 w-48" /><Skeleton className="h-64 w-full" />
    </div>
  );

  if (!team) return <div className="container mx-auto px-4 py-20 text-center text-muted-foreground">Team not found</div>;

  return (
    <div className="min-h-screen">
      {/* Header */}
      <div className="bg-gradient-to-b from-primary/5 to-transparent py-12">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row md:items-center gap-6">
            <TrustScoreBadge score={Number(team.trust_score)} breakdown={team.trust_score_breakdown as any} size="lg" />
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <h1 className="font-heading text-3xl font-bold">{team.name}</h1>
                {team.verified_status === "verified" && (
                  <Badge className="bg-success text-success-foreground gap-1"><CheckCircle className="h-3 w-3" /> Verified</Badge>
                )}
              </div>
              <div className="flex flex-wrap gap-4 text-sm text-muted-foreground mt-2">
                <span className="flex items-center gap-1"><MapPin className="h-4 w-4" />{team.city}</span>
                <span className="flex items-center gap-1"><Calendar className="h-4 w-4" />{team.years_experience} years exp.</span>
                {team.pricing_model && <span className="flex items-center gap-1"><DollarSign className="h-4 w-4" />{team.pricing_model}</span>}
              </div>
              <div className="flex items-center gap-3 mt-3">
                <StarRating rating={Math.round(Number(team.avg_rating))} />
                <span className="text-sm text-muted-foreground">{Number(team.avg_rating).toFixed(1)} ({team.review_count} reviews)</span>
              </div>
              <div className="flex flex-wrap gap-1.5 mt-3">
                {(team.specialties as string[] || []).map((s) => <Badge key={s} variant="secondary">{s}</Badge>)}
              </div>
            </div>
          </div>
          {team.description && <p className="mt-6 text-muted-foreground max-w-3xl">{team.description}</p>}
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        <Tabs defaultValue="reviews">
          <TabsList>
            <TabsTrigger value="reviews">Reviews ({reviews?.length || 0})</TabsTrigger>
            <TabsTrigger value="portfolio">Portfolio ({portfolio?.length || 0})</TabsTrigger>
          </TabsList>

          <TabsContent value="reviews" className="mt-6 space-y-4">
            {!reviews?.length ? (
              <p className="text-muted-foreground text-center py-12">No approved reviews yet.</p>
            ) : reviews.map((r) => (
              <Card key={r.id}>
                <CardContent className="p-6">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <h4 className="font-semibold">{r.title}</h4>
                      <div className="flex items-center gap-2 mt-1">
                        <StarRating rating={r.rating} size={14} />
                        {r.verification_type === "verified_project" && <Badge variant="outline" className="text-xs text-success border-success">Verified Purchase</Badge>}
                      </div>
                    </div>
                    <span className="text-xs text-muted-foreground">{new Date(r.created_at).toLocaleDateString()}</span>
                  </div>
                  <p className="text-sm text-muted-foreground mt-2">{r.body}</p>
                  {/* Evidence */}
                  {(r.review_evidence as any[])?.length > 0 && (
                    <div className="flex gap-2 mt-3 overflow-x-auto">
                      {(r.review_evidence as any[]).map((e: any) => (
                        <img key={e.id} src={e.image_url} alt={e.caption || "Evidence"} className="h-20 w-20 object-cover rounded-md border" />
                      ))}
                    </div>
                  )}
                  {/* Replies */}
                  {(r.review_replies as any[])?.length > 0 && (
                    <div className="mt-4 pl-4 border-l-2 border-secondary/30 space-y-2">
                      {(r.review_replies as any[]).map((reply: any) => (
                        <div key={reply.id} className="text-sm">
                          <span className="font-medium flex items-center gap-1"><User className="h-3 w-3" /> Contractor Reply</span>
                          <p className="text-muted-foreground mt-1">{reply.body}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </TabsContent>

          <TabsContent value="portfolio" className="mt-6">
            {!portfolio?.length ? (
              <p className="text-muted-foreground text-center py-12">No portfolio items yet.</p>
            ) : (
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {portfolio.map((item) => (
                  <Card key={item.id}>
                    <CardContent className="p-4">
                      <h4 className="font-semibold mb-2">{item.title}</h4>
                      {item.description && <p className="text-sm text-muted-foreground mb-3">{item.description}</p>}
                      <div className="grid grid-cols-2 gap-2">
                        {item.before_image_url && (
                          <div><p className="text-xs text-muted-foreground mb-1">Before</p><img src={item.before_image_url} alt="Before" className="rounded-md w-full h-32 object-cover" /></div>
                        )}
                        {item.after_image_url && (
                          <div><p className="text-xs text-muted-foreground mb-1">After</p><img src={item.after_image_url} alt="After" className="rounded-md w-full h-32 object-cover" /></div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
