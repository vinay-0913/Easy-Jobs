import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowRight, Sparkles } from "lucide-react";
import { motion } from "framer-motion";
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
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 1.2, ease: "easeOut" }}
          className="absolute left-1/4 top-20 h-72 w-72 rounded-full bg-primary/5 blur-3xl"
        />
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 1.2, delay: 0.3, ease: "easeOut" }}
          className="absolute right-1/4 bottom-20 h-96 w-96 rounded-full bg-accent/5 blur-3xl"
        />
      </div>

      {/* Floating doodles */}
      <motion.div
        initial={{ opacity: 0, x: -30 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.8, delay: 0.8 }}
      >
        <RocketDoodle className="absolute left-8 top-32 hidden h-24 w-24 animate-float text-primary/30 md:block" />
      </motion.div>
      <motion.div
        initial={{ opacity: 0, x: 30 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.8, delay: 1.0 }}
      >
        <TargetDoodle className="absolute right-12 top-40 hidden h-20 w-20 animate-wiggle text-accent/40 md:block" />
      </motion.div>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, delay: 1.2 }}
      >
        <DocumentDoodle className="absolute bottom-20 left-16 hidden h-16 w-16 animate-float text-primary/20 md:block" />
      </motion.div>

      <div className="container relative">
        <div className="mx-auto max-w-3xl text-center">
          {/* Badge */}
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
            className="mb-6 inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-4 py-2 text-sm text-primary"
          >
            <span>Personalized Job Matching</span>
          </motion.div>

          {/* Headline */}
          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.15, ease: [0.22, 1, 0.36, 1] }}
            className="mb-6 text-4xl font-bold tracking-tight text-foreground md:text-5xl lg:text-6xl"
          >
            Find Your Dream Job{" "}
            <span className="relative">
              <span className="text-primary">Simplified</span>
              <motion.svg
                initial={{ pathLength: 0, opacity: 0 }}
                animate={{ pathLength: 1, opacity: 1 }}
                transition={{ duration: 1, delay: 0.8, ease: "easeOut" }}
                className="absolute -bottom-2 left-0 w-full"
                viewBox="0 0 200 12"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <motion.path
                  d="M2 8 Q50 2 100 6 Q150 10 198 4"
                  stroke="hsl(var(--primary))"
                  strokeWidth="3"
                  strokeLinecap="round"
                  fill="none"
                  opacity="0.4"
                  initial={{ pathLength: 0 }}
                  animate={{ pathLength: 1 }}
                  transition={{ duration: 1, delay: 0.8, ease: "easeOut" }}
                />
              </motion.svg>
            </span>
          </motion.h1>

          {/* Subheadline */}
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3, ease: [0.22, 1, 0.36, 1] }}
            className="mb-10 text-lg text-muted-foreground md:text-xl"
          >
            Create your profile, set your preferences, and let us find the
            perfect job matches from across the web. No more endless scrolling
            through irrelevant listings.
          </motion.p>

          {/* CTAs */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.45, ease: [0.22, 1, 0.36, 1] }}
            className="flex flex-col items-center justify-center gap-4 sm:flex-row"
          >
            <motion.div
              whileHover={{ scale: 1.05, boxShadow: "0 10px 30px rgba(59,130,246,0.35)" }}
              whileTap={{ scale: 0.97 }}
            >
              <Button size="lg" className="gap-2 px-8" asChild>
                <Link to="/auth?mode=signup">
                  Get Started
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
            </motion.div>
          </motion.div>

          {/* Social proof */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.6, ease: [0.22, 1, 0.36, 1] }}
            className="mt-12 flex flex-col items-center gap-4"
          >
            <div className="flex -space-x-3">
              {[
                "https://randomuser.me/api/portraits/women/44.jpg",
                "https://randomuser.me/api/portraits/men/32.jpg",
                "https://randomuser.me/api/portraits/women/68.jpg",
                "https://randomuser.me/api/portraits/men/75.jpg",
                "https://randomuser.me/api/portraits/women/90.jpg",
              ].map((src, i) => (
                <motion.img
                  key={i}
                  src={src}
                  alt={`Job seeker ${i + 1}`}
                  className="h-10 w-10 rounded-full border-2 border-background object-cover"
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.4, delay: 0.7 + i * 0.08 }}
                />
              ))}
            </div>
            <p className="text-sm text-muted-foreground">
              <span className="font-semibold text-foreground">2,000+</span> job
              seekers already finding their dream jobs
            </p>
          </motion.div>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
