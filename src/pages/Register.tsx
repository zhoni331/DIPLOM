import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Shield, Home, Wrench } from "lucide-react";
import { toast } from "sonner";

export default function Register() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [role, setRole] = useState<"homeowner" | "contractor">("homeowner");
  const [loading, setLoading] = useState(false);
  const { signUp } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password.length < 8) { toast.error("Password must be at least 8 characters"); return; }
    setLoading(true);
    try {
      await signUp(email, password, fullName, role);
      toast.success("Account created! You can now sign in.");
      navigate("/");
    } catch (err: any) {
      toast.error(err.message || "Registration failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-primary/5 to-secondary/5">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-2"><Shield className="h-10 w-10 text-secondary" /></div>
          <CardTitle className="font-heading text-2xl">Create Account</CardTitle>
          <CardDescription>Join UstaTrust today</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div><Label>Full Name</Label><Input value={fullName} onChange={(e) => setFullName(e.target.value)} required /></div>
            <div><Label>Email</Label><Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required /></div>
            <div><Label>Password</Label><Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={8} /></div>
            <div>
              <Label className="mb-3 block">I am a...</Label>
              <RadioGroup value={role} onValueChange={(v) => setRole(v as any)} className="grid grid-cols-2 gap-3">
                <Label htmlFor="homeowner" className={`flex items-center gap-2 rounded-lg border-2 p-4 cursor-pointer transition-colors ${role === "homeowner" ? "border-primary bg-primary/5" : "border-border"}`}>
                  <RadioGroupItem value="homeowner" id="homeowner" />
                  <Home className="h-4 w-4" /> Homeowner
                </Label>
                <Label htmlFor="contractor" className={`flex items-center gap-2 rounded-lg border-2 p-4 cursor-pointer transition-colors ${role === "contractor" ? "border-primary bg-primary/5" : "border-border"}`}>
                  <RadioGroupItem value="contractor" id="contractor" />
                  <Wrench className="h-4 w-4" /> Contractor
                </Label>
              </RadioGroup>
            </div>
            <Button type="submit" className="w-full" disabled={loading}>{loading ? "Creating..." : "Create Account"}</Button>
          </form>
          <p className="text-center text-sm text-muted-foreground mt-4">
            Already have an account? <Link to="/login" className="text-primary font-medium hover:underline">Sign in</Link>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
