import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Shield, User, LogOut, LayoutDashboard, Menu, X } from "lucide-react";
import { useState } from "react";

export default function Navbar() {
  const { user, role, signOut } = useAuth();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);

  const dashboardPath = role === "admin" ? "/admin" : role === "contractor" ? "/contractor" : "/dashboard";

  return (
    <nav className="sticky top-0 z-50 glass">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        <Link to="/" className="flex items-center gap-2 font-heading text-xl font-bold text-foreground">
          <Shield className="h-6 w-6 text-secondary" />
          <span>Usta<span className="text-secondary">Trust</span></span>
        </Link>

        <div className="hidden md:flex items-center gap-6">
          <Link to="/teams" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
            Browse Teams
          </Link>
          {user ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="gap-2">
                  <User className="h-4 w-4" />
                  {role === "admin" && <span className="text-xs bg-destructive text-destructive-foreground px-1.5 py-0.5 rounded">Admin</span>}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => navigate(dashboardPath)}>
                  <LayoutDashboard className="mr-2 h-4 w-4" /> Dashboard
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => { signOut(); navigate("/"); }}>
                  <LogOut className="mr-2 h-4 w-4" /> Sign Out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <div className="flex gap-2">
              <Button variant="ghost" size="sm" onClick={() => navigate("/login")}>Log In</Button>
              <Button size="sm" onClick={() => navigate("/register")}>Sign Up</Button>
            </div>
          )}
        </div>

        <button className="md:hidden" onClick={() => setMobileOpen(!mobileOpen)}>
          {mobileOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>
      </div>

      {mobileOpen && (
        <div className="md:hidden border-t border-border bg-card p-4 space-y-3">
          <Link to="/teams" className="block text-sm" onClick={() => setMobileOpen(false)}>Browse Teams</Link>
          {user ? (
            <>
              <Link to={dashboardPath} className="block text-sm" onClick={() => setMobileOpen(false)}>Dashboard</Link>
              <button className="text-sm text-destructive" onClick={() => { signOut(); navigate("/"); setMobileOpen(false); }}>Sign Out</button>
            </>
          ) : (
            <>
              <Link to="/login" className="block text-sm" onClick={() => setMobileOpen(false)}>Log In</Link>
              <Link to="/register" className="block text-sm" onClick={() => setMobileOpen(false)}>Sign Up</Link>
            </>
          )}
        </div>
      )}
    </nav>
  );
}
