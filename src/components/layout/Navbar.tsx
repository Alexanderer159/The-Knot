import { Settings } from "lucide-react";
import { NavLink } from "react-router-dom";
import { cn } from "@/lib/utils";

export function Navbar() {
  return (
      <header className="z-40 flex items-center justify-between gap-2 p-4">
        
      <NavLink to="/" className="flex gap-2">
        <img className="w-32" src="/LOGO.png" />
      </NavLink>
        
      <NavLink  to="/config" className={({ isActive }) => cn( "p-1 transition-all duration-500", isActive ? "text-primary rotate-90" : "text-muted-foreground")}>
        <Settings />
      </NavLink>
   
      </header>
  );
}
