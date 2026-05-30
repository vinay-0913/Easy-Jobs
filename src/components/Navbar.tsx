import { useState, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useUser } from "@clerk/clerk-react";
import { BriefcaseDoodle } from "@/components/doodles";

type ActivePage = "dashboard" | "applications" | "saved";

interface NavbarProps {
  activePage: ActivePage;
  
  // Optional controlled props for Dashboard integration
  searchQuery?: string;
  setSearchQuery?: (val: string) => void;
  onSearch?: (e: React.FormEvent) => void;

  showFilters?: boolean;
  setShowFilters?: (val: boolean) => void;
  
  selectedJobTypes?: string[];
  setSelectedJobTypes?: (val: string[] | ((prev: string[]) => string[])) => void;
  
  selectedExperience?: string[];
  setSelectedExperience?: (val: string[] | ((prev: string[]) => string[])) => void;
  
  selectedLocations?: string[];
  setSelectedLocations?: (val: string[] | ((prev: string[]) => string[])) => void;
  
  selectedSalary?: string[];
  setSelectedSalary?: (val: string[] | ((prev: string[]) => string[])) => void;

  sortBy?: string;
  setSortBy?: (val: string) => void;
  
  showSortDropdown?: boolean;
  setShowSortDropdown?: (val: boolean) => void;
}

const Navbar = (props: NavbarProps) => {
  const { activePage } = props;
  const { user } = useUser();
  const navigate = useNavigate();

  // Internal fallback state (used when not on Dashboard)
  const [internalSearchQuery, setInternalSearchQuery] = useState(() => sessionStorage.getItem('dashboard_searchQuery') || "");
  const [internalShowFilters, setInternalShowFilters] = useState(false);
  const [internalJobTypes, setInternalJobTypes] = useState<string[]>(() => JSON.parse(sessionStorage.getItem('dashboard_jobTypes') || '[]'));
  const [internalExperience, setInternalExperience] = useState<string[]>(() => JSON.parse(sessionStorage.getItem('dashboard_experience') || '[]'));
  const [internalLocations, setInternalLocations] = useState<string[]>(() => JSON.parse(sessionStorage.getItem('dashboard_locations') || '[]'));
  const [internalSalary, setInternalSalary] = useState<string[]>(() => JSON.parse(sessionStorage.getItem('dashboard_salary') || '[]'));
  const [internalSortBy, setInternalSortBy] = useState(() => sessionStorage.getItem('dashboard_sortBy') || "relevance");
  const [internalShowSort, setInternalShowSort] = useState(false);

  const searchInputRef = useRef<HTMLInputElement>(null);

  // Resolved values (prefer props, fallback to internal state)
  const searchQuery = props.searchQuery !== undefined ? props.searchQuery : internalSearchQuery;
  const setSearchQuery = props.setSearchQuery || setInternalSearchQuery;
  
  const showFilters = props.showFilters !== undefined ? props.showFilters : internalShowFilters;
  const setShowFilters = props.setShowFilters || setInternalShowFilters;

  const selectedJobTypes = props.selectedJobTypes || internalJobTypes;
  const setSelectedJobTypes = props.setSelectedJobTypes || setInternalJobTypes;

  const selectedExperience = props.selectedExperience || internalExperience;
  const setSelectedExperience = props.setSelectedExperience || setInternalExperience;

  const selectedLocations = props.selectedLocations || internalLocations;
  const setSelectedLocations = props.setSelectedLocations || setInternalLocations;

  const selectedSalary = props.selectedSalary || internalSalary;
  const setSelectedSalary = props.setSelectedSalary || setInternalSalary;

  const sortBy = props.sortBy || internalSortBy;
  const setSortBy = props.setSortBy || setInternalSortBy;

  const showSortDropdown = props.showSortDropdown !== undefined ? props.showSortDropdown : internalShowSort;
  const setShowSortDropdown = props.setShowSortDropdown || setInternalShowSort;

  const toggleFilter = (
    value: string,
    selected: string[],
    setSelected: any
  ) => {
    if (selected.includes(value)) {
      setSelected(selected.filter(v => v !== value));
    } else {
      setSelected([...selected, value]);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (props.onSearch) {
      props.onSearch(e);
      return;
    }
    
    if (searchQuery.trim()) {
      sessionStorage.setItem('dashboard_searchQuery', searchQuery);
      sessionStorage.setItem('dashboard_submittedQuery', searchQuery);
      sessionStorage.setItem('dashboard_jobTypes', JSON.stringify(selectedJobTypes));
      sessionStorage.setItem('dashboard_experience', JSON.stringify(selectedExperience));
      sessionStorage.setItem('dashboard_locations', JSON.stringify(selectedLocations));
      sessionStorage.setItem('dashboard_salary', JSON.stringify(selectedSalary));
      sessionStorage.setItem('dashboard_sortBy', sortBy);

      if (activePage !== "dashboard") {
        navigate("/dashboard");
      }
    }
  };

  const navLinkClass = (page: ActivePage) =>
    page === activePage
      ? "px-3 py-2 rounded-lg bg-primary/10 text-primary text-sm font-bold cursor-pointer"
      : "px-3 py-2 rounded-lg hover:bg-[#f0f2f4] dark:hover:bg-[#23303e] text-[#4b5563] dark:text-[#8492a6] text-sm font-medium cursor-pointer transition-colors";

  return (
    <>
      <header className="bg-white dark:bg-[#1a2632] border-b border-[#e5e7eb] dark:border-[#2a3642] sticky top-0 z-30 px-8 py-4 flex items-center gap-4 shrink-0">
        {/* Left: Logo + Search + Filter + Sort */}
        <Link to="/" className="flex items-center gap-2 text-primary font-bold text-xl tracking-tight shrink-0">
          <BriefcaseDoodle className="h-7 w-7 text-primary" />
          <span className="text-foreground">Easy <span className="text-primary">Jobs</span></span>
        </Link>

        <form onSubmit={handleSearch} className="relative flex-1 max-w-sm text-[#4b5563] focus-within:text-primary">
          <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
            <span className="material-symbols-outlined text-[20px]">search</span>
          </div>
          <input
            ref={searchInputRef}
            type="text"
            className="block w-full rounded-lg border-none bg-[#f0f2f4] dark:bg-[#23303e] py-2 pl-10 pr-3 text-[#111418] dark:text-white placeholder:text-[#4b5563] focus:ring-2 focus:ring-primary sm:text-sm"
            placeholder="Search job titles, skills..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </form>

        {/* Filter */}
        <div className="relative shrink-0">
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center gap-2 px-3 py-2 rounded-lg border border-[#e5e7eb] dark:border-[#2a3642] hover:bg-[#f0f2f4] dark:hover:bg-[#23303e] text-[#111418] dark:text-white text-sm font-medium transition-colors"
          >
            <span className="material-symbols-outlined text-[20px]">tune</span>
            <span>Filters</span>
          </button>
          {showFilters && (
            <div className="absolute top-full left-0 mt-2 w-72 bg-white dark:bg-[#1a2632] border border-[#e5e7eb] dark:border-[#2a3642] rounded-xl shadow-xl z-40 p-5 space-y-5">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-[#111418] dark:text-white">Filters</h3>
                <button
                  onClick={() => {
                    setSelectedJobTypes([]);
                    setSelectedExperience([]);
                    setSelectedLocations([]);
                    setSelectedSalary([]);
                  }}
                  className="text-xs text-primary hover:underline font-medium"
                >
                  Clear all
                </button>
              </div>
              <div className="flex flex-col gap-2.5">
                <h4 className="text-[10px] font-bold text-[#4b5563] dark:text-[#8492a6] uppercase tracking-wider">Job Type</h4>
                {["Full-time", "Internship"].map(type => (
                  <label key={type} className="flex items-center gap-2.5 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={selectedJobTypes.includes(type)}
                      onChange={() => toggleFilter(type, selectedJobTypes, setSelectedJobTypes)}
                      className="w-3.5 h-3.5 rounded border-gray-300 text-primary focus:ring-primary"
                    />
                    <span className="text-sm text-[#111418] dark:text-gray-200">{type}</span>
                  </label>
                ))}
              </div>
              <div className="flex flex-col gap-2.5">
                <h4 className="text-[10px] font-bold text-[#4b5563] dark:text-[#8492a6] uppercase tracking-wider">Experience</h4>
                {["0-1 Years", "2-5 Years", "5+ Years"].map(exp => (
                  <label key={exp} className="flex items-center gap-2.5 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={selectedExperience.includes(exp)}
                      onChange={() => toggleFilter(exp, selectedExperience, setSelectedExperience)}
                      className="w-3.5 h-3.5 rounded border-gray-300 text-primary focus:ring-primary"
                    />
                    <span className="text-sm text-[#111418] dark:text-gray-200">{exp}</span>
                  </label>
                ))}
              </div>
              <div className="flex flex-col gap-2.5">
                <h4 className="text-[10px] font-bold text-[#4b5563] dark:text-[#8492a6] uppercase tracking-wider">Location</h4>
                {["Remote", "Bangalore", "Hyderabad", "Pune", "Delhi"].map(loc => (
                  <label key={loc} className="flex items-center gap-2.5 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={selectedLocations.includes(loc)}
                      onChange={() => toggleFilter(loc, selectedLocations, setSelectedLocations)}
                      className="w-3.5 h-3.5 rounded border-gray-300 text-primary focus:ring-primary"
                    />
                    <span className="text-sm text-[#111418] dark:text-gray-200">{loc}</span>
                  </label>
                ))}
              </div>
              <div className="flex flex-col gap-2.5">
                <h4 className="text-[10px] font-bold text-[#4b5563] dark:text-[#8492a6] uppercase tracking-wider">Salary (LPA)</h4>
                {["0 - 10 LPA", "10 - 25 LPA", "25 - 40 LPA", "40+ LPA"].map(sal => (
                  <label key={sal} className="flex items-center gap-2.5 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={selectedSalary.includes(sal)}
                      onChange={() => toggleFilter(sal, selectedSalary, setSelectedSalary)}
                      className="w-3.5 h-3.5 rounded border-gray-300 text-primary focus:ring-primary"
                    />
                    <span className="text-sm text-[#111418] dark:text-gray-200">{sal}</span>
                  </label>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Sort */}
        <div className="relative shrink-0">
          <button
            onClick={() => setShowSortDropdown(!showSortDropdown)}
            className="flex items-center justify-between gap-2 rounded-lg border border-[#e5e7eb] dark:border-[#2a3642] bg-transparent hover:bg-[#f0f2f4] dark:hover:bg-[#23303e] transition-colors py-2 pl-3 pr-2 text-[#111418] dark:text-white text-sm font-medium outline-none cursor-pointer"
          >
            <span>{sortBy === "relevance" ? "Relevance" : sortBy === "date" ? "Newest" : "Match %"}</span>
            <span className="material-symbols-outlined text-[18px] text-[#4b5563]">expand_more</span>
          </button>
          {showSortDropdown && (
            <div className="absolute top-full right-0 mt-2 w-[160px] bg-white dark:bg-[#1a2632] border border-[#e5e7eb] dark:border-[#2a3642] rounded-xl shadow-xl z-40 p-2 space-y-1">
              <button
                onClick={() => { setSortBy("relevance"); setShowSortDropdown(false); }}
                className={`w-full text-left px-3 py-2 rounded-lg text-sm font-medium transition-colors ${sortBy === "relevance" ? "bg-primary/10 text-primary dark:bg-primary/20 dark:text-primary" : "text-[#111418] dark:text-white hover:bg-[#f0f2f4] dark:hover:bg-[#23303e]"}`}
              >
                Relevance
              </button>
              <button
                onClick={() => { setSortBy("date"); setShowSortDropdown(false); }}
                className={`w-full text-left px-3 py-2 rounded-lg text-sm font-medium transition-colors ${sortBy === "date" ? "bg-primary/10 text-primary dark:bg-primary/20 dark:text-primary" : "text-[#111418] dark:text-white hover:bg-[#f0f2f4] dark:hover:bg-[#23303e]"}`}
              >
                Newest
              </button>
              <button
                onClick={() => { setSortBy("match"); setShowSortDropdown(false); }}
                className={`w-full text-left px-3 py-2 rounded-lg text-sm font-medium transition-colors ${sortBy === "match" ? "bg-primary/10 text-primary dark:bg-primary/20 dark:text-primary" : "text-[#111418] dark:text-white hover:bg-[#f0f2f4] dark:hover:bg-[#23303e]"}`}
              >
                Match %
              </button>
            </div>
          )}
        </div>

        {/* Right: Nav Links + Avatar (logged in) OR Sign In/Up (logged out) */}
        <div className="flex items-center gap-1 ml-auto shrink-0">
          {user ? (
            <>
              <nav className="hidden md:flex items-center gap-1">
                {activePage === "dashboard" ? (
                  <div className={navLinkClass("dashboard")}>Dashboard</div>
                ) : (
                  <Link to="/dashboard" className={navLinkClass("dashboard")}>Dashboard</Link>
                )}
                {activePage === "applications" ? (
                  <div className={navLinkClass("applications")}>Applications</div>
                ) : (
                  <Link to="/my-applications" className={navLinkClass("applications")}>Applications</Link>
                )}
                {activePage === "saved" ? (
                  <div className={navLinkClass("saved")}>Saved</div>
                ) : (
                  <Link to="/saved-jobs" className={navLinkClass("saved")}>Saved</Link>
                )}
              </nav>
              <Link to="/profile" className="hover:opacity-80 transition-opacity ml-2">
                <div
                  className="bg-center bg-no-repeat bg-cover rounded-full size-9 shrink-0 border border-[#e5e7eb] dark:border-[#2a3642]"
                  style={{ backgroundImage: `url("${user?.imageUrl}")` }}
                ></div>
              </Link>
            </>
          ) : (
            <div className="flex items-center gap-3">
              <Link
                to="/auth"
                className="hidden md:inline-block text-sm font-semibold text-[#137fec] bg-white border border-[#137fec] px-4 py-2 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Sign In
              </Link>
              <Link
                to="/auth?mode=signup"
                className="text-sm font-semibold text-white bg-[#137fec] px-4 py-2 rounded-lg hover:bg-[#0f66be] transition-colors"
              >
                Sign Up
              </Link>
            </div>
          )}
        </div>
      </header>

      {/* Close filter dropdown when clicking outside */}
      {showFilters && (
        <div className="fixed inset-0 z-20" onClick={() => setShowFilters(false)}></div>
      )}
    </>
  );
};

export default Navbar;
