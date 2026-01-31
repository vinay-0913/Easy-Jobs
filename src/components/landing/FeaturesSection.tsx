import {
  Sparkles,
  Search,
  Zap,
  Shield,
  BarChart3,
  Bookmark,
} from "lucide-react";

const features = [
  {
    icon: Sparkles,
    title: "AI-Powered Matching",
    description:
      "Our advanced AI analyzes your resume and preferences to find jobs that truly match your skills and career goals.",
  },
  {
    icon: Search,
    title: "Real Job Listings",
    description:
      "We search across the entire web to bring you real, verified job postings from top companies.",
  },
  {
    icon: Zap,
    title: "One-Click Apply",
    description:
      "Apply to jobs instantly with direct links to the original postings. No more copy-pasting your information.",
  },
  {
    icon: BarChart3,
    title: "Match Scoring",
    description:
      "See exactly how well each job matches your profile with our intelligent scoring system.",
  },
  {
    icon: Bookmark,
    title: "Save & Track",
    description:
      "Bookmark interesting positions and track your applications all in one place.",
  },
  {
    icon: Shield,
    title: "Privacy First",
    description:
      "Your data is secure. We never share your personal information with third parties.",
  },
];

const FeaturesSection = () => {
  return (
    <section id="features" className="py-20 md:py-28">
      <div className="container">
        <div className="mx-auto mb-16 max-w-2xl text-center">
          <h2 className="mb-4 text-3xl font-bold text-foreground md:text-4xl">
            Everything You Need to Land Your Dream Job
          </h2>
          <p className="text-lg text-muted-foreground">
            Powerful features designed to simplify your job search
          </p>
        </div>

        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {features.map((feature, index) => (
            <div
              key={feature.title}
              className="group rounded-2xl border border-border/50 bg-card p-6 transition-all hover:border-primary/30 hover:shadow-lg"
              style={{ animationDelay: `${index * 50}ms` }}
            >
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary transition-colors group-hover:bg-primary group-hover:text-primary-foreground">
                <feature.icon className="h-6 w-6" />
              </div>
              <h3 className="mb-2 text-lg font-semibold text-foreground">
                {feature.title}
              </h3>
              <p className="text-sm text-muted-foreground">
                {feature.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default FeaturesSection;
