import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";

const HeroSection = () => {
  const sectionRef = useRef<HTMLElement>(null);
  const [isVisible, setIsVisible] = useState(false);
  const [jobTitle, setJobTitle] = useState("");
  const [experience, setExperience] = useState("");
  const navigate = useNavigate();

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

  const handleSearch = () => {
    const query = jobTitle.trim();
    if (!query) return;

    // Store search params in sessionStorage so the Dashboard picks them up on mount
    sessionStorage.setItem("dashboard_searchQuery", query);
    sessionStorage.setItem("dashboard_submittedQuery", query);

    // Map the experience field to the Dashboard's filter format
    if (experience.trim()) {
      const expLower = experience.toLowerCase();
      let mapped: string[] = [];
      if (expLower.includes("0") || expLower.includes("fresher") || expLower.includes("1")) {
        mapped = ["0-1 Years"];
      } else if (expLower.includes("2") || expLower.includes("3") || expLower.includes("4") || expLower.includes("5")) {
        mapped = ["2-5 Years"];
      } else {
        mapped = ["5+ Years"];
      }
      sessionStorage.setItem("dashboard_experience", JSON.stringify(mapped));
    } else {
      sessionStorage.setItem("dashboard_experience", "[]");
    }

    // Clear other filters so the search starts fresh
    sessionStorage.setItem("dashboard_jobTypes", "[]");
    sessionStorage.setItem("dashboard_locations", "[]");
    sessionStorage.setItem("dashboard_salary", "[]");
    sessionStorage.setItem("dashboard_sortBy", "relevance");

    navigate("/dashboard");
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleSearch();
    }
  };

  const handlePopularClick = (term: string) => {
    setJobTitle(term);
    sessionStorage.setItem("dashboard_searchQuery", term);
    sessionStorage.setItem("dashboard_submittedQuery", term);
    sessionStorage.setItem("dashboard_experience", "[]");
    sessionStorage.setItem("dashboard_jobTypes", "[]");
    sessionStorage.setItem("dashboard_locations", "[]");
    sessionStorage.setItem("dashboard_salary", "[]");
    sessionStorage.setItem("dashboard_sortBy", "relevance");
    navigate("/dashboard");
  };

  return (
    <section
      ref={sectionRef}
      className={`relative h-[600px] flex items-center justify-center fade-up ${isVisible ? "visible" : ""}`}
    >
      {/* Background Image */}
      <div className="absolute inset-0 z-0">
        <img
          alt="Modern office space with professionals collaborating"
          className="w-full h-full object-cover"
          src="/hero-bg.png"
        />
        <div className="absolute inset-0 bg-gray-900/60" />
      </div>

      {/* Content */}
      <div className="relative z-10 w-full max-w-[1280px] mx-auto px-4 md:px-6 text-center">
        <h1 className="font-hanken text-4xl md:text-5xl font-bold text-white mb-4 tracking-tight">
          Find Your Dream Career
        </h1>
        <p className="font-hanken text-lg text-gray-200 mb-8 max-w-2xl mx-auto leading-relaxed">
          Discover opportunities that match your skills and ambitions with our
          intelligent matching platform.
        </p>

        {/* Search Bar */}
        <div className="bg-white p-2 rounded-xl shadow-lg max-w-4xl mx-auto flex flex-col md:flex-row gap-2">
          <div className="flex-1 relative flex items-center">
            <span className="material-symbols-outlined text-gray-400 absolute left-4">
              search
            </span>
            <input
              className="w-full pl-12 pr-4 py-3 bg-white border-0 focus:ring-2 focus:ring-[#137fec] rounded-lg text-gray-900 font-hanken text-base placeholder:text-gray-400"
              placeholder="Job title, keywords, or company"
              type="text"
              value={jobTitle}
              onChange={(e) => setJobTitle(e.target.value)}
              onKeyDown={handleKeyDown}
            />
          </div>
          <div className="hidden md:block w-px bg-gray-200 my-2" />
          <div className="flex-1 relative flex items-center">
            <span className="material-symbols-outlined text-gray-400 absolute left-4">
              work
            </span>
            <input
              className="w-full pl-12 pr-4 py-3 bg-white border-0 focus:ring-2 focus:ring-[#137fec] rounded-lg text-gray-900 font-hanken text-base placeholder:text-gray-400"
              placeholder="Experience (e.g. 2+ years)"
              type="text"
              value={experience}
              onChange={(e) => setExperience(e.target.value)}
              onKeyDown={handleKeyDown}
            />
          </div>
          <button
            onClick={handleSearch}
            className="bg-[#137fec] hover:bg-[#0f66be] text-white font-semibold text-sm px-8 py-3 rounded-lg transition-colors whitespace-nowrap"
          >
            Search Jobs
          </button>
        </div>

        {/* Popular Tags */}
        <div className="mt-4 flex items-center justify-center gap-2 text-gray-200 text-sm font-semibold">
          <span>Popular:</span>
          <button
            onClick={() => handlePopularClick("Software Engineer")}
            className="bg-white/20 px-3 py-1 rounded-full border border-white/30 backdrop-blur-sm hover:bg-white/30 transition-colors cursor-pointer"
          >
            Software Engineer
          </button>
          <button
            onClick={() => handlePopularClick("Product Manager")}
            className="bg-white/20 px-3 py-1 rounded-full border border-white/30 backdrop-blur-sm hover:bg-white/30 transition-colors cursor-pointer"
          >
            Product Manager
          </button>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
