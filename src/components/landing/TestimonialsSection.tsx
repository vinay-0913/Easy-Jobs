import { Star } from "lucide-react";
import { HandshakeDoodle, PersonWorkingDoodle } from "@/components/doodles";
import { motion } from "framer-motion";

const testimonials = [
  {
    name: "Priya Sharma",
    role: "Software Engineer",
    content:
      "Easy Jobs saved me hours of searching across different portals. The match score is incredibly accurate!",
    rating: 5,
  },
  {
    name: "Rahul Mehta",
    role: "Product Manager",
    content:
      "I love the job tracking feature. It keeps me organized and I never miss a deadline or follow-up.",
    rating: 5,
  },
  {
    name: "Ananya Gupta",
    role: "UX Designer",
    content:
      "Finally one place for all job listings. The aggregation from Naukri, Indeed, and career pages is a game changer.",
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
      <motion.div
        initial={{ opacity: 0, x: -30 }}
        whileInView={{ opacity: 1, x: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.8, delay: 0.5 }}
      >
        <HandshakeDoodle className="absolute -left-4 top-20 h-32 w-32 rotate-12 text-primary/10" />
      </motion.div>
      <motion.div
        initial={{ opacity: 0, x: 30 }}
        whileInView={{ opacity: 1, x: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.8, delay: 0.7 }}
      >
        <PersonWorkingDoodle className="absolute -right-8 bottom-20 h-40 w-40 -rotate-6 text-accent/10" />
      </motion.div>

      <div className="container relative">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.5 }}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          className="mx-auto mb-16 max-w-2xl text-center"
        >
          <h2 className="mb-4 text-3xl font-bold text-foreground md:text-4xl">
            Loved by Job Seekers
          </h2>
          <p className="text-lg text-muted-foreground">
            Join thousands who've found their perfect career match
          </p>
        </motion.div>

        <div className="grid gap-8 md:grid-cols-3">
          {testimonials.map((testimonial, index) => (
            <motion.div
              key={testimonial.name}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.3 }}
              transition={{ duration: 0.5, delay: index * 0.15, ease: [0.22, 1, 0.36, 1] }}
              whileHover={{ y: -5, boxShadow: "0 10px 25px rgba(0,0,0,0.06)" }}
              className="rounded-2xl bg-card p-6 shadow-sm"
            >
              {/* Stars */}
              <div className="mb-4 flex gap-1">
                {Array.from({ length: testimonial.rating }).map((_, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, scale: 0 }}
                    whileInView={{ opacity: 1, scale: 1 }}
                    viewport={{ once: true }}
                    transition={{ type: "spring", stiffness: 400, damping: 15, delay: 0.3 + index * 0.15 + i * 0.05 }}
                  >
                    <Star
                      className="h-5 w-5 fill-yellow-400 text-yellow-400"
                    />
                  </motion.div>
                ))}
              </div>

              {/* Quote */}
              <p className="mb-6 text-muted-foreground">
                "{testimonial.content}"
              </p>

              {/* Author */}
              <div className="flex items-center gap-3">
                <div className="h-12 w-12 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center text-white font-bold text-sm">
                  {testimonial.name.split(" ").map(n => n[0]).join("")}
                </div>
                <div>
                  <p className="font-semibold text-foreground">
                    {testimonial.name}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {testimonial.role}
                  </p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default TestimonialsSection;
