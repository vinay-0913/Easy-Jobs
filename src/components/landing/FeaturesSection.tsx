import {
  Search,
  BarChart3,
  Bookmark,
} from "lucide-react";
import { motion } from "framer-motion";

const features = [
  {
    icon: Search,
    title: "Real Job Listings",
    description:
      "We search across the entire web to bring you real, verified job postings from top companies.",
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
];

const FeaturesSection = () => {
  return (
    <section id="features" className="py-20 md:py-28">
      <div className="container">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.5 }}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          className="mx-auto mb-16 max-w-2xl text-center"
        >
          <h2 className="mb-4 text-3xl font-bold text-foreground md:text-4xl">
            Everything You Need to Land Your Dream Job
          </h2>
          <p className="text-lg text-muted-foreground">
            Powerful features designed to simplify your job search
          </p>
        </motion.div>

        <div className="grid gap-8 md:grid-cols-3">
          {features.map((feature, index) => (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.3 }}
              transition={{ duration: 0.5, delay: index * 0.15, ease: [0.22, 1, 0.36, 1] }}
              whileHover={{ y: -6, boxShadow: "0 12px 30px rgba(0,0,0,0.08)" }}
              className="group rounded-2xl border border-border/50 bg-card p-8 transition-colors hover:border-primary/30"
            >
              <motion.div
                whileHover={{ scale: 1.1, rotate: -5 }}
                transition={{ type: "spring", stiffness: 300 }}
                className="mb-6 flex h-16 w-16 items-center justify-center rounded-xl bg-primary/10 text-primary transition-colors group-hover:bg-primary group-hover:text-primary-foreground"
              >
                <feature.icon className="h-8 w-8" />
              </motion.div>
              <h3 className="mb-3 text-xl font-semibold text-foreground">
                {feature.title}
              </h3>
              <p className="text-muted-foreground">
                {feature.description}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default FeaturesSection;
