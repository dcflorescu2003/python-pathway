import { Link, NavLink } from "react-router-dom";
import { useState } from "react";
import { Menu, X } from "lucide-react";
import PyroLogo from "@/components/brand/PyroLogo";
import { Button } from "@/components/ui/button";

const navItems = [
  { to: "/about", label: "Despre" },
  { to: "/tutoriale/elevi", label: "Tutoriale Elevi" },
  { to: "/tutoriale/profesori", label: "Tutoriale Profesori" },
];

const WebHeader = () => {
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-background/80 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4">
        <Link to="/about" className="flex items-center" onClick={() => setOpen(false)}>
          <PyroLogo size="sm" />
        </Link>

        <nav className="hidden items-center gap-1 md:flex">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                `rounded-md px-3 py-2 text-sm font-medium transition-colors ${
                  isActive
                    ? "bg-accent text-accent-foreground"
                    : "text-muted-foreground hover:text-foreground"
                }`
              }
            >
              {item.label}
            </NavLink>
          ))}
          <Button asChild size="sm" className="ml-2">
            <Link to="/auth">Deschide aplicația</Link>
          </Button>
        </nav>

        <button
          className="inline-flex h-10 w-10 items-center justify-center rounded-md md:hidden"
          onClick={() => setOpen((v) => !v)}
          aria-label="Meniu"
        >
          {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      {open && (
        <nav className="border-t border-border bg-background md:hidden">
          <div className="mx-auto flex max-w-6xl flex-col p-4">
            {navItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                onClick={() => setOpen(false)}
                className={({ isActive }) =>
                  `rounded-md px-3 py-3 text-base font-medium ${
                    isActive
                      ? "bg-accent text-accent-foreground"
                      : "text-muted-foreground"
                  }`
                }
              >
                {item.label}
              </NavLink>
            ))}
            <Button asChild size="lg" className="mt-3">
              <Link to="/auth" onClick={() => setOpen(false)}>
                Deschide aplicația
              </Link>
            </Button>
          </div>
        </nav>
      )}
    </header>
  );
};

export default WebHeader;
