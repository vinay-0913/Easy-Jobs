import { useEffect, useRef, useState } from "react";

const testimonials = [
  {
    name: "Sarah J.",
    role: "Software Engineer",
    content:
      "Easy Jobs streamlined my search. The match scoring helped me focus on roles where I truly stood out, landing me a Senior Developer position in weeks.",
    avatar: "/avatar-sarah.png",
  },
  {
    name: "Neeraj S.",
    role: "Product Manager",
    content:
      "The interface is so clean and distraction-free. I loved being able to set specific preferences and only get notifications for relevant opportunities.",
    avatar: "/avatar-neeraj.png",
  },
  {
    name: "Priya Sharma",
    role: "Data Analyst",
    content:
      "As someone transitioning careers, the track jobs feature kept me organized. It's the most helpful job board I've used.",
    avatar: "/avatar-priya.png",
  },
];

const TestimonialsSection = () => {
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
      id="testimonials"
      className={`py-section-gap px-4 md:px-6 max-w-[1280px] mx-auto fade-up ${isVisible ? "visible" : ""}`}
    >
      <h2 className="font-hanken text-[32px] leading-[40px] font-bold text-center text-gray-900 mb-section-gap tracking-tight">
        Success Stories
      </h2>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {testimonials.map((testimonial, index) => (
          <div
            key={testimonial.name}
            className={`bg-white p-8 rounded-xl border border-gray-200 shadow-sm relative pt-12 mt-8 ${
              index === 2
                ? "lg:mt-8 md:mt-16 md:col-span-2 lg:col-span-1"
                : ""
            }`}
          >
            {/* Avatar */}
            <div className="absolute -top-8 left-1/2 -translate-x-1/2">
              <img
                alt={testimonial.name}
                className="w-16 h-16 rounded-full border-4 border-white shadow-md object-cover"
                src={testimonial.avatar}
              />
            </div>

            {/* Quote */}
            <p className="font-hanken text-base text-gray-500 mb-4 italic leading-relaxed">
              "{testimonial.content}"
            </p>

            {/* Author */}
            <div className="text-center">
              <h4 className="font-hanken text-sm font-semibold text-gray-900">
                {testimonial.name}
              </h4>
              <span className="font-hanken text-sm text-gray-400">
                {testimonial.role}
              </span>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
};

export default TestimonialsSection;
