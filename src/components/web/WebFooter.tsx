import { Link } from "react-router-dom";
import PyroLogo from "@/components/brand/PyroLogo";

const WebFooter = () => {
  return (
    <footer className="border-t border-border bg-card/50">
      <div className="mx-auto grid max-w-6xl gap-8 px-4 py-12 md:grid-cols-4">
        <div className="md:col-span-2">
          <PyroLogo size="sm" />
          <p className="mt-3 max-w-sm text-sm text-muted-foreground">
            PyRo te învață Python pas cu pas, prin lecții practice. Curriculum aliniat cu programa de
            clasa a IX-a, cu unelte pentru elevi și profesori.
          </p>
        </div>

        <div>
          <h3 className="mb-3 text-sm font-semibold">Produs</h3>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li><Link to="/about" className="hover:text-foreground">Despre</Link></li>
            <li><Link to="/tutoriale/elevi" className="hover:text-foreground">Tutoriale elevi</Link></li>
            <li><Link to="/tutoriale/profesori" className="hover:text-foreground">Tutoriale profesori</Link></li>
            <li><Link to="/auth" className="hover:text-foreground">Deschide aplicația</Link></li>
          </ul>
        </div>

        <div>
          <h3 className="mb-3 text-sm font-semibold">Legal & contact</h3>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li><Link to="/privacy-policy" className="hover:text-foreground">Politică de confidențialitate</Link></li>
            <li><Link to="/terms-of-use" className="hover:text-foreground">Termeni de utilizare</Link></li>
            <li><Link to="/support" className="hover:text-foreground">Suport</Link></li>
            <li><Link to="/delete-account" className="hover:text-foreground">Șterge cont</Link></li>
          </ul>
        </div>
      </div>
      <div className="border-t border-border">
        <div className="mx-auto max-w-6xl px-4 py-4 text-xs text-muted-foreground">
          © {new Date().getFullYear()} PyRo. Toate drepturile rezervate.
        </div>
      </div>
    </footer>
  );
};

export default WebFooter;
