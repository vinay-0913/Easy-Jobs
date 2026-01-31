import { DocumentDoodle, TargetDoodle, CheckmarkDoodle } from "@/components/doodles";

const steps = [
  {
    number: "01",
    title: "Upload Your Resume",
    description:
      "Simply upload your resume and our AI will extract your skills, experience, and qualifications automatically.",
    icon: DocumentDoodle,
    color: "text-primary",
  },
  {
    number: "02",
    title: "Set Your Preferences",
    description:
      "Tell us what you're looking for - preferred locations, salary range, job type, remote work, and industries.",
    icon: TargetDoodle,
    color: "text-accent",
  },
  {
    number: "03",
    title: "Get Matched Jobs",
    description:
      "Our AI searches the web and delivers personalized job matches ranked by how well they fit your profile.",
    icon: CheckmarkDoodle,
    color: "text-success",
  },
];

const HowItWorksSection = () => {
  return (
    <section id="how-it-works" className="bg-secondary/30 py-20 md:py-28">
      <div className="container">
        <div className="mx-auto mb-16 max-w-2xl text-center">
          <h2 className="mb-4 text-3xl font-bold text-foreground md:text-4xl">
            How It Works
          </h2>
          <p className="text-lg text-muted-foreground">
            Three simple steps to your next career opportunity
          </p>
        </div>

        <div className="grid gap-8 md:grid-cols-3">
          {steps.map((step, index) => (
            <div
              key={step.number}
              className="group relative rounded-2xl bg-card p-8 shadow-sm transition-all hover:shadow-md"
              style={{ animationDelay: `${index * 100}ms` }}
            >
              {/* Step number */}
              <span className="absolute -top-4 left-6 rounded-full bg-primary px-3 py-1 text-sm font-bold text-primary-foreground">
                {step.number}
              </span>

              {/* Icon */}
              <div className={`mb-6 ${step.color}`}>
                <step.icon className="h-16 w-16" />
              </div>

              {/* Content */}
              <h3 className="mb-3 text-xl font-semibold text-foreground">
                {step.title}
              </h3>
              <p className="text-muted-foreground">{step.description}</p>

              {/* Connector line (hidden on last item and mobile) */}
              {index < steps.length - 1 && (
                <div className="absolute -right-4 top-1/2 hidden h-0.5 w-8 -translate-y-1/2 bg-border md:block">
                  <div className="absolute right-0 top-1/2 h-2 w-2 -translate-y-1/2 rotate-45 border-r-2 border-t-2 border-border" />
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default HowItWorksSection;
