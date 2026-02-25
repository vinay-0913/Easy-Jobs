import { TrackingDoodle, TargetDoodle, CheckmarkDoodle } from "@/components/doodles";
import { motion } from "framer-motion";

const steps = [
  {
    number: "01",
    title: "Set Your Preferences",
    description:
      "Tell us what you're looking for - preferred locations, salary range, job type, remote work, and industries.",
    icon: TargetDoodle,
    color: "text-primary",
  },
  {
    number: "02",
    title: "Get Matched Jobs",
    description:
      "Our AI searches the web and delivers personalized job matches ranked by how well they fit your profile.",
    icon: CheckmarkDoodle,
    color: "text-accent",
  },
  {
    number: "03",
    title: "Track Your Jobs",
    description:
      "Save jobs you love, apply with one click, and track all your applications in one convenient dashboard.",
    icon: TrackingDoodle,
    color: "text-blue-500",
  },
];

const HowItWorksSection = () => {
  return (
    <section id="how-it-works" className="bg-secondary/30 py-20 md:py-28">
      <div className="container">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.5 }}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          className="mx-auto mb-16 max-w-2xl text-center"
        >
          <h2 className="mb-4 text-3xl font-bold text-foreground md:text-4xl">
            How It Works
          </h2>
          <p className="text-lg text-muted-foreground">
            Three simple steps to your next career opportunity
          </p>
        </motion.div>

        <div className="grid gap-8 md:grid-cols-3">
          {steps.map((step, index) => (
            <motion.div
              key={step.number}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.3 }}
              transition={{ duration: 0.5, delay: index * 0.2, ease: [0.22, 1, 0.36, 1] }}
              whileHover={{ y: -5 }}
              className="group relative rounded-2xl bg-card p-8 shadow-sm transition-shadow hover:shadow-md"
            >
              {/* Step number */}
              <motion.span
                initial={{ scale: 0 }}
                whileInView={{ scale: 1 }}
                viewport={{ once: true }}
                transition={{ type: "spring", stiffness: 400, damping: 15, delay: 0.3 + index * 0.2 }}
                className="absolute -top-4 left-6 rounded-full bg-primary px-3 py-1 text-sm font-bold text-primary-foreground"
              >
                {step.number}
              </motion.span>

              {/* Icon */}
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: 0.4 + index * 0.2 }}
                className={`mb-6 ${step.color}`}
              >
                <step.icon className="h-16 w-16" />
              </motion.div>

              {/* Content */}
              <h3 className="mb-3 text-xl font-semibold text-foreground">
                {step.title}
              </h3>
              <p className="text-muted-foreground">{step.description}</p>

              {/* Connector line (hidden on last item and mobile) */}
              {index < steps.length - 1 && (
                <motion.div
                  initial={{ scaleX: 0 }}
                  whileInView={{ scaleX: 1 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.6, delay: 0.6 + index * 0.2 }}
                  className="absolute -right-4 top-1/2 hidden h-0.5 w-8 -translate-y-1/2 origin-left bg-border md:block"
                >
                  <div className="absolute right-0 top-1/2 h-2 w-2 -translate-y-1/2 rotate-45 border-r-2 border-t-2 border-border" />
                </motion.div>
              )}
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default HowItWorksSection;
