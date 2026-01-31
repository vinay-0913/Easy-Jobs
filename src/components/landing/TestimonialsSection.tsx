import { Star } from "lucide-react";
import { HandshakeDoodle, PersonWorkingDoodle } from "@/components/doodles";

const testimonials = [
  {
    name: "Sarah Chen",
    role: "Software Engineer",
    company: "Now at Google",
    content:
      "Simplify.jobs completely changed my job search. Within 2 weeks of uploading my resume, I had interviews at 3 top tech companies. The AI matching is incredibly accurate!",
    rating: 5,
  },
  {
    name: "Marcus Johnson",
    role: "Product Manager",
    company: "Now at Stripe",
    content:
      "I was spending hours every day scrolling through job boards. Simplify.jobs cut that down to minutes. The personalized recommendations are spot-on.",
    rating: 5,
  },
  {
    name: "Emily Rodriguez",
    role: "UX Designer",
    company: "Now at Figma",
    content:
      "The resume parsing feature is magic. It understood my skills better than I could describe them myself. Landed my dream job in just 3 weeks!",
    rating: 5,
  },
];

const TestimonialsSection = () => {
  return (
    <section
      id="testimonials"
      className="relative overflow-hidden bg-secondary/30 py-20 md:py-28"
    >
      {/* Doodle decorations */}
      <HandshakeDoodle className="absolute -left-4 top-20 h-32 w-32 rotate-12 text-primary/10" />
      <PersonWorkingDoodle className="absolute -right-8 bottom-20 h-40 w-40 -rotate-6 text-accent/10" />

      <div className="container relative">
        <div className="mx-auto mb-16 max-w-2xl text-center">
          <h2 className="mb-4 text-3xl font-bold text-foreground md:text-4xl">
            Loved by Job Seekers
          </h2>
          <p className="text-lg text-muted-foreground">
            Join thousands who've found their perfect career match
          </p>
        </div>

        <div className="grid gap-8 md:grid-cols-3">
          {testimonials.map((testimonial, index) => (
            <div
              key={testimonial.name}
              className="rounded-2xl bg-card p-6 shadow-sm"
              style={{ animationDelay: `${index * 100}ms` }}
            >
              {/* Stars */}
              <div className="mb-4 flex gap-1">
                {Array.from({ length: testimonial.rating }).map((_, i) => (
                  <Star
                    key={i}
                    className="h-5 w-5 fill-yellow-400 text-yellow-400"
                  />
                ))}
              </div>

              {/* Quote */}
              <p className="mb-6 text-muted-foreground">
                "{testimonial.content}"
              </p>

              {/* Author */}
              <div className="flex items-center gap-3">
                <div className="h-12 w-12 rounded-full bg-gradient-to-br from-primary to-accent" />
                <div>
                  <p className="font-semibold text-foreground">
                    {testimonial.name}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {testimonial.role} · {testimonial.company}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default TestimonialsSection;
