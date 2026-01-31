import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowRight, Sparkles } from "lucide-react";
import {
  RocketDoodle,
  TargetDoodle,
  DocumentDoodle,
} from "@/components/doodles";

const HeroSection = () => {
  return (
    <section className="relative overflow-hidden py-20 md:py-32">
      {/* Background decorations */}
      <div className="absolute inset-0 -z-10">
        <div className="absolute left-1/4 top-20 h-72 w-72 rounded-full bg-primary/5 blur-3xl" />
        <div className="absolute right-1/4 bottom-20 h-96 w-96 rounded-full bg-accent/5 blur-3xl" />
      </div>

      {/* Floating doodles */}
      <RocketDoodle className="absolute left-8 top-32 hidden h-24 w-24 animate-float text-primary/30 md:block" />
      <TargetDoodle className="absolute right-12 top-40 hidden h-20 w-20 animate-wiggle text-accent/40 md:block" />
      <DocumentDoodle className="absolute bottom-20 left-16 hidden h-16 w-16 animate-float text-primary/20 md:block" />

      <div className="container relative">
        <div className="mx-auto max-w-3xl text-center">
          {/* Badge */}
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-4 py-2 text-sm text-primary">
            <Sparkles className="h-4 w-4" />
            <span>AI-Powered Job Matching</span>
          </div>

          {/* Headline */}
          <h1 className="mb-6 text-4xl font-bold tracking-tight text-foreground md:text-5xl lg:text-6xl">
            Find Your Dream Job{" "}
            <span className="relative">
              <span className="text-primary">Simplified</span>
              <svg
                className="absolute -bottom-2 left-0 w-full"
                viewBox="0 0 200 12"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M2 8 Q50 2 100 6 Q150 10 198 4"
                  stroke="hsl(var(--primary))"
                  strokeWidth="3"
                  strokeLinecap="round"
                  fill="none"
                  opacity="0.4"
                />
              </svg>
            </span>
          </h1>

          {/* Subheadline */}
          <p className="mb-10 text-lg text-muted-foreground md:text-xl">
            Upload your resume, set your preferences, and let our AI find the
            perfect job matches from across the web. No more endless scrolling
            through irrelevant listings.
          </p>

          {/* CTAs */}
          <div className="flex flex-col items-center justify-center gap-4 sm:flex-row">
            <Button size="lg" className="gap-2 px-8" asChild>
              <Link to="/auth?mode=signup">
                Start Free Today
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
            <Button size="lg" variant="outline" asChild>
              <Link to="/#how-it-works">See How It Works</Link>
            </Button>
          </div>

          {/* Social proof */}
          <div className="mt-12 flex flex-col items-center gap-4">
            <div className="flex -space-x-3">
              {[1, 2, 3, 4, 5].map((i) => (
                <div
                  key={i}
                  className="h-10 w-10 rounded-full border-2 border-background bg-gradient-to-br from-primary/60 to-accent/60"
                />
              ))}
            </div>
            <p className="text-sm text-muted-foreground">
              <span className="font-semibold text-foreground">2,000+</span> job
              seekers already finding their dream jobs
            </p>
          </div>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
