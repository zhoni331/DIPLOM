import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Shield, Search, Star, CheckCircle, ArrowRight, Users, FileCheck } from "lucide-react";
import { motion } from "framer-motion";

const features = [
  { icon: Search, title: "Find Trusted Teams", desc: "Browse verified renovation teams in your city with real reviews and evidence." },
  { icon: Star, title: "Evidence-Based Reviews", desc: "Reviews backed by photos and verified project completion. No fake testimonials." },
  { icon: Shield, title: "Trust Score System", desc: "Algorithmic trust scoring based on ratings, review volume, evidence, and recency." },
  { icon: CheckCircle, title: "Admin Moderation", desc: "Every review is verified by moderators before publication. Quality guaranteed." },
];

const stats = [
  { value: "100%", label: "Moderated Reviews" },
  { value: "0→100", label: "Trust Score Range" },
  { value: "📷", label: "Photo Evidence Required" },
];

export default function Landing() {
  return (
    <div className="min-h-screen">
      {/* Hero */}
      <section className="relative overflow-hidden py-24 lg:py-36">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-secondary/10" />
        <div className="container mx-auto px-4 relative">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7 }}
            className="max-w-3xl mx-auto text-center"
          >
            <div className="inline-flex items-center gap-2 rounded-full bg-secondary/10 px-4 py-1.5 text-sm font-medium text-secondary mb-6">
              <Shield className="h-4 w-4" /> Launching in Astana, Kazakhstan
            </div>
            <h1 className="font-heading text-5xl md:text-6xl lg:text-7xl font-bold leading-tight mb-6">
              Find <span className="text-gradient">Trusted</span> Renovation Teams
            </h1>
            <p className="text-lg md:text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
              The first crowdsourced, evidence-based reputation platform for home renovation teams in Kazakhstan. Real reviews. Real proof. Real trust.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button size="lg" asChild className="text-base">
                <Link to="/teams"><Search className="mr-2 h-5 w-5" /> Browse Teams</Link>
              </Button>
              <Button size="lg" variant="outline" asChild className="text-base">
                <Link to="/register"><Users className="mr-2 h-5 w-5" /> Join as Contractor</Link>
              </Button>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Stats */}
      <section className="py-12 border-y border-border bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-3 gap-8 max-w-2xl mx-auto text-center">
            {stats.map((s, i) => (
              <motion.div key={i} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }} viewport={{ once: true }}>
                <div className="text-3xl font-heading font-bold text-primary">{s.value}</div>
                <div className="text-sm text-muted-foreground mt-1">{s.label}</div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-24">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="font-heading text-3xl md:text-4xl font-bold mb-4">How It Works</h2>
            <p className="text-muted-foreground max-w-lg mx-auto">A transparent ecosystem connecting homeowners with verified renovation professionals.</p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-6xl mx-auto">
            {features.map((f, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
                viewport={{ once: true }}
                className="group rounded-xl border border-border bg-card p-6 hover:shadow-lg hover:border-secondary/50 transition-all"
              >
                <div className="w-12 h-12 rounded-lg bg-secondary/10 flex items-center justify-center mb-4 group-hover:bg-secondary/20 transition-colors">
                  <f.icon className="h-6 w-6 text-secondary" />
                </div>
                <h3 className="font-heading font-semibold text-lg mb-2">{f.title}</h3>
                <p className="text-sm text-muted-foreground">{f.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-24 bg-primary text-primary-foreground">
        <div className="container mx-auto px-4 text-center">
          <h2 className="font-heading text-3xl md:text-4xl font-bold mb-4">Ready to Get Started?</h2>
          <p className="text-primary-foreground/70 mb-8 max-w-lg mx-auto">Whether you're a homeowner looking for quality teams or a contractor building your reputation.</p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" variant="secondary" asChild>
              <Link to="/register">Create Account <ArrowRight className="ml-2 h-5 w-5" /></Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 border-t border-border">
        <div className="container mx-auto px-4 flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-2 font-heading font-bold">
            <Shield className="h-5 w-5 text-secondary" />
            UstaTrust
          </div>
          <p className="text-sm text-muted-foreground">
            Astana IT University · Toishybekov, Amantay, Omar · Supervised by Salkenov A.
          </p>
        </div>
      </footer>
    </div>
  );
}
