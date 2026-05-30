import { useEffect, useRef, useState } from "react";

const features = [
  {
    icon: "list_alt",
    title: "Extensive Listings",
    description:
      "Access millions of up-to-date job postings from top global companies.",
  },
  {
    icon: "check_circle",
    title: "Match Scoring",
    description:
      "Instantly see how well your skills align with job requirements before you apply.",
  },
  {
    icon: "bookmark",
    title: "Save & Track",
    description:
      "Organize your job search with intuitive saving and status tracking features.",
  },
];

const FeaturesSection = () => {
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
      id="features"
      className={`bg-gray-50 py-section-gap px-4 md:px-6 fade-up ${isVisible ? "visible" : ""}`}
    >
      <div className="max-w-[1280px] mx-auto">
        <div className="flex flex-col items-center gap-section-gap">
          <div className="max-w-3xl w-full">
            <h2 className="font-hanken text-[32px] leading-[40px] font-bold text-gray-900 mb-4 text-center tracking-tight">
              Everything You Need to Succeed
            </h2>
            <p className="font-hanken text-lg text-gray-500 mb-8 text-center leading-relaxed">
              We provide the tools and insights necessary to navigate your
              career path with confidence.
            </p>

            {/* Feature List */}
            <div className="space-y-4">
              {features.map((feature) => (
                <div key={feature.title} className="flex gap-4">
                  <span className="material-symbols-outlined text-[#137fec] text-2xl mt-1 flex-shrink-0">
                    {feature.icon}
                  </span>
                  <div>
                    <h4 className="font-hanken text-sm font-semibold text-gray-900 mb-1">
                      {feature.title}
                    </h4>
                    <p className="font-hanken text-base text-gray-500 leading-relaxed">
                      {feature.description}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default FeaturesSection;
