import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { BriefcaseDoodle } from "@/components/doodles";

const Header = () => {
  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center justify-between">
        <Link to="/" className="flex items-center gap-2">
          <BriefcaseDoodle className="h-8 w-8 text-primary" />
          <span className="text-xl font-bold text-foreground">
            Easy <span className="text-primary">Jobs</span>
          </span>
        </Link>

        <nav className="hidden items-center gap-6 md:flex">
          <Link
            to="/#how-it-works"
            className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
          >
            How It Works
          </Link>
          <Link
            to="/#features"
            className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
          >
            Features
          </Link>
          <Link
            to="/#testimonials"
            className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
          >
            Testimonials
          </Link>
        </nav>

        <div className="flex items-center gap-3">
          <Button variant="ghost" asChild>
            <Link to="/auth">Log In</Link>
          </Button>
          <Button asChild>
            <Link to="/auth?mode=signup">Register</Link>
          </Button>
        </div>
      </div>
    </header>
  );
};

export default Header;
