import { Settings } from "lucide-react";
import { NavLink } from "react-router-dom";
import { cn } from "@/lib/utils";

export function Navbar() {
  return (
      <header className="z-40 flex items-center justify-between p-4">
        
      <NavLink to="/" >
        <img className="w-36" src="/LOGO.png" />
      </NavLink>
        
      <NavLink  to="/config" className={({ isActive }) => cn( isActive ? "text-primary rotate-180" : "text-muted-foreground")}>
        <Settings />
      </NavLink>
   
      </header>
  );
}
