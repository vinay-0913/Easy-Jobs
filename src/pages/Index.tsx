import {
  Header,
  HeroSection,
  HowItWorksSection,
  FeaturesSection,
  TestimonialsSection,
  Footer,
} from "@/components/landing";

const Index = () => {
  return (
    <div className="min-h-screen bg-[#f8f9fa] font-hanken antialiased pt-20">
      <Header />
      <main>
        <HeroSection />
        <HowItWorksSection />
        <FeaturesSection />
        <TestimonialsSection />
      </main>
      <Footer />
    </div>
  );
};

export default Index;
