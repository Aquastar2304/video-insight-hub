import { Brain } from "lucide-react";
import { Link } from "react-router-dom";

export function Footer() {
  return (
    <footer className="border-t border-border/50 py-12">
      <div className="container px-4">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2">
            <Brain className="w-6 h-6 text-primary" />
            <span className="font-display font-bold text-lg">ClipMind</span>
          </Link>

          {/* Links */}
          <nav className="flex items-center gap-6 text-sm text-muted-foreground">
            <Link to="/library" className="hover:text-foreground transition-colors">
              Library
            </Link>
            <Link to="/upload" className="hover:text-foreground transition-colors">
              Upload
            </Link>
            <Link to="/search" className="hover:text-foreground transition-colors">
              Search
            </Link>
          </nav>

          {/* Copyright */}
          <p className="text-sm text-muted-foreground">
            © 2024 ClipMind. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
