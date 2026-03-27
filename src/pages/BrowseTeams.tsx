import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
// import { supabase } from "@/integrations_supabase/client";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Search, MapPin, CheckCircle, Star } from "lucide-react";
import { Link } from "react-router-dom";
import TrustScoreBadge from "@/components/TrustScoreBadge";
import StarRating from "@/components/StarRating";
import { motion } from "framer-motion";

export default function BrowseTeams() {
  const [search, setSearch] = useState("");
  const [city, setCity] = useState("all");
  const [sort, setSort] = useState("trust_score");

  const { data: teams, isLoading } = useQuery({
    queryKey: ["teams", city, sort],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (city !== "all") params.append("city", city);
      params.append("sort_by", sort === "trust_score" ? "trust_score" : sort === "rating" ? "rating" : "review_count");
      const response = await fetch(`/api/teams?${params}`);
      if (!response.ok) throw new Error("Failed to fetch teams");
      return response.json();
    },
  });

  const filtered = teams?.filter((t) => !search || t.name.toLowerCase().includes(search.toLowerCase()) || t.specialties?.some((s: string) => s.toLowerCase().includes(search.toLowerCase())));

  return (
    <div className="min-h-screen">
      <div className="bg-gradient-to-b from-primary/5 to-transparent py-12">
        <div className="container mx-auto px-4">
          <h1 className="font-heading text-3xl md:text-4xl font-bold mb-2">Browse Teams</h1>
          <p className="text-muted-foreground mb-8">Find trusted renovation professionals in Kazakhstan</p>
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input placeholder="Search by name or specialty..." className="pl-10" value={search} onChange={(e) => setSearch(e.target.value)} />
            </div>
            <Select value={city} onValueChange={setCity}>
              <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Cities</SelectItem>
                <SelectItem value="Astana">Astana</SelectItem>
                <SelectItem value="Almaty">Almaty</SelectItem>
                <SelectItem value="Shymkent">Shymkent</SelectItem>
              </SelectContent>
            </Select>
            <Select value={sort} onValueChange={setSort}>
              <SelectTrigger className="w-44"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="trust_score">Trust Score</SelectItem>
                <SelectItem value="rating">Rating</SelectItem>
                <SelectItem value="reviews">Most Reviews</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        {isLoading ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1,2,3].map(i => <div key={i} className="h-48 bg-muted rounded-xl animate-pulse" />)}
          </div>
        ) : !filtered?.length ? (
          <div className="text-center py-20 text-muted-foreground">No teams found. Try adjusting your filters.</div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filtered.map((team, i) => (
              <motion.div key={team.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
                <Link to={`/teams/${team.id}`}>
                  <Card className="h-full hover:shadow-lg hover:border-secondary/50 transition-all group">
                    <CardContent className="p-6">
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="font-heading font-semibold text-lg group-hover:text-primary transition-colors">{team.name}</h3>
                            {team.verified_status === "verified" && <CheckCircle className="h-4 w-4 text-success" />}
                          </div>
                          <div className="flex items-center gap-1 text-sm text-muted-foreground">
                            <MapPin className="h-3 w-3" /> {team.city}
                          </div>
                        </div>
                        <TrustScoreBadge score={Number(team.trust_score)} breakdown={team.trust_score_breakdown as any} size="sm" />
                      </div>
                      <div className="flex items-center gap-2 mb-3">
                        <StarRating rating={Math.round(Number(team.avg_rating))} size={16} />
                        <span className="text-sm text-muted-foreground">({team.review_count} reviews)</span>
                      </div>
                      <div className="flex flex-wrap gap-1.5">
                        {(team.specialties as string[] || []).slice(0, 3).map((s) => (
                          <Badge key={s} variant="secondary" className="text-xs">{s}</Badge>
                        ))}
                      </div>
                      {team.description && <p className="text-sm text-muted-foreground mt-3 line-clamp-2">{team.description}</p>}
                    </CardContent>
                  </Card>
                </Link>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
