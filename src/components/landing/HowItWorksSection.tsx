import { useEffect, useRef, useState } from "react";

const steps = [
  {
    icon: "tune",
    title: "Set Preferences",
    description:
      "Tell us what you're looking for, from salary requirements to remote flexibility.",
    bgColor: "bg-[#cbdeff]",
    textColor: "text-[#4f627e]",
  },
  {
    icon: "check_circle",
    title: "Get Matched",
    description:
      "Our algorithm highlights jobs where you're a top candidate based on your profile.",
    bgColor: "bg-[#0056d2]",
    textColor: "text-white",
  },
  {
    icon: "trending_up",
    title: "Track Jobs",
    description:
      "Save listings, track your applications, and manage interviews in one place.",
    bgColor: "bg-[#006688]",
    textColor: "text-white",
  },
];

const HowItWorksSection = () => {
  const sectionRef = useRef<HTMLElement>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0.1 }
    );

    if (sectionRef.current) {
      observer.observe(sectionRef.current);
    }

    return () => observer.disconnect();
  }, []);

  return (
    <section
      ref={sectionRef}
      id="how-it-works"
      className={`py-section-gap px-4 md:px-6 max-w-[1280px] mx-auto fade-up ${isVisible ? "visible" : ""}`}
    >
      {/* Section Header */}
      <div className="text-center mb-section-gap">
        <h2 className="font-hanken text-[32px] leading-[40px] font-bold text-gray-900 mb-2 tracking-tight">
          How It Works
        </h2>
        <p className="font-hanken text-base text-gray-500">
          Three simple steps to your next big opportunity.
        </p>
      </div>

      {/* Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {steps.map((step) => (
          <div
            key={step.title}
            className="bg-white p-8 rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-shadow text-center"
          >
            <div
              className={`w-16 h-16 ${step.bgColor} ${step.textColor} rounded-full flex items-center justify-center mx-auto mb-4`}
            >
              <span className="material-symbols-outlined text-3xl">
                {step.icon}
              </span>
            </div>
            <h3 className="font-hanken text-xl font-semibold text-gray-900 mb-2">
              {step.title}
            </h3>
            <p className="font-hanken text-base text-gray-500 leading-relaxed">
              {step.description}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
};

export default HowItWorksSection;
