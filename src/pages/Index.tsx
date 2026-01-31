import {
  Header,
  HeroSection,
  HowItWorksSection,
  FeaturesSection,
  TestimonialsSection,
  CTASection,
  Footer,
} from "@/components/landing";

const Index = () => {
  return (
    <div className="min-h-screen">
      <Header />
      <main>
        <HeroSection />
        <HowItWorksSection />
        <FeaturesSection />
        <TestimonialsSection />
        <CTASection />
      </main>
      <Footer />
    </div>
  );
};

export default Index;
