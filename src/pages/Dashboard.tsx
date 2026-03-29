import { useState, useMemo, useEffect, useCallback, useRef } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { useUser, useClerk, useAuth } from "@clerk/clerk-react";
import { jobsApi, savedJobsApi, appliedJobsApi, profileApi, Job } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import { BriefcaseDoodle } from "@/components/doodles";
import ReactMarkdown from "react-markdown";


const Dashboard = () => {
  const { user, isLoaded } = useUser();
  const { signOut } = useClerk();
  const { getToken } = useAuth();
  const { toast } = useToast();

  // Profile data for header
  const [profileName, setProfileName] = useState("");
  const [profileRole, setProfileRole] = useState("");

  const queryClient = useQueryClient();
  // Restore search & filter state from sessionStorage on remount
  const [searchQuery, setSearchQuery] = useState(
    () => sessionStorage.getItem('dashboard_searchQuery') || ""
  );
  const [submittedQuery, setSubmittedQuery] = useState(
    () => sessionStorage.getItem('dashboard_submittedQuery') || ""
  );

  // Ref for focusing the search input
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Filter states
  const [selectedJobTypes, setSelectedJobTypes] = useState<string[]>(
    () => JSON.parse(sessionStorage.getItem('dashboard_jobTypes') || '[]')
  );
  const [selectedExperience, setSelectedExperience] = useState<string[]>(
    () => JSON.parse(sessionStorage.getItem('dashboard_experience') || '[]')
  );
  const [selectedLocations, setSelectedLocations] = useState<string[]>(
    () => JSON.parse(sessionStorage.getItem('dashboard_locations') || '[]')
  );
  const [selectedSalary, setSelectedSalary] = useState<string[]>(
    () => JSON.parse(sessionStorage.getItem('dashboard_salary') || '[]')
  );

  // Sort state
  const [sortBy, setSortBy] = useState(
    () => sessionStorage.getItem('dashboard_sortBy') || "relevance"
  );

  // Selected job for detail panel
  const [selectedJobId, setSelectedJobId] = useState<string | null>(null);

  // Filter panel visibility
  const [showFilters, setShowFilters] = useState(false);
  const [showSortDropdown, setShowSortDropdown] = useState(false);

  // Persist search & filter state to sessionStorage
  useEffect(() => {
    sessionStorage.setItem('dashboard_searchQuery', searchQuery);
  }, [searchQuery]);
  useEffect(() => {
    sessionStorage.setItem('dashboard_submittedQuery', submittedQuery);
  }, [submittedQuery]);
  useEffect(() => {
    sessionStorage.setItem('dashboard_jobTypes', JSON.stringify(selectedJobTypes));
  }, [selectedJobTypes]);
  useEffect(() => {
    sessionStorage.setItem('dashboard_experience', JSON.stringify(selectedExperience));
  }, [selectedExperience]);
  useEffect(() => {
    sessionStorage.setItem('dashboard_locations', JSON.stringify(selectedLocations));
  }, [selectedLocations]);
  useEffect(() => {
    sessionStorage.setItem('dashboard_salary', JSON.stringify(selectedSalary));
  }, [selectedSalary]);
  useEffect(() => {
    sessionStorage.setItem('dashboard_sortBy', sortBy);
  }, [sortBy]);

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const JOBS_PER_PAGE = 20;

  // Load-more state
  const [allJobs, setAllJobs] = useState<Job[]>([]);
  const [apiPage, setApiPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);

  // Load profile data for header
  useEffect(() => {
    const loadProfile = async () => {
      if (!user) return;
      try {
        const token = await getToken();
        const res = await profileApi.get(user.id, token || undefined);
        if (res.success && res.data) {
          setProfileName(res.data.full_name || "");
          setProfileRole(res.data.role || "");
        }
      } catch (err) {
        console.error('Error loading profile for header:', err);
      }
    };
    loadProfile();
  }, [user]);

  // Whether the user has performed a search
  const hasSearched = submittedQuery.trim().length > 0;

  // Cached job search — won't refetch on remount
  const { isFetching: isSearching, data: cachedJobs } = useQuery({
    queryKey: ['jobSearch', submittedQuery, selectedExperience, selectedJobTypes],
    queryFn: async () => {
      const token = await getToken();
      const response = await jobsApi.search({
        query: submittedQuery,
        limit: 60,
        page: 1,
        experience: selectedExperience.length > 0 ? selectedExperience[0] : undefined,
        jobType: selectedJobTypes.length > 0 ? selectedJobTypes[0] : undefined,
      }, token || undefined);
      if (response.success && response.data && response.data.length > 0) {
        setAllJobs(response.data);
        setHasMore(response.hasMore ?? false);
        setApiPage(1);
        return response.data;
      }
      setAllJobs([]);
      setHasMore(false);
      return [];
    },
    enabled: !!user && !!submittedQuery.trim(),
    staleTime: Infinity,        // never auto-refetch
    gcTime: 1000 * 60 * 30,     // keep in cache for 30 min
  });

  // Restore allJobs from react-query cache on remount
  useEffect(() => {
    if (cachedJobs && cachedJobs.length > 0 && allJobs.length === 0) {
      setAllJobs(cachedJobs);
    }
  }, [cachedJobs]);

  // Cached saved jobs
  const { data: savedJobsData } = useQuery({
    queryKey: ['savedJobs', user?.id],
    queryFn: async () => {
      if (!user) return new Set<string>();
      const token = await getToken();
      const response = await savedJobsApi.get(user.id, token || undefined);
      if (response.success && response.data) {
        return new Set(response.data.map(job => job.id));
      }
      return new Set<string>();
    },
    enabled: !!user,
    staleTime: Infinity,
    gcTime: 1000 * 60 * 30,
  });
  const savedJobs = savedJobsData ?? new Set<string>();

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      setAllJobs([]);
      setApiPage(1);
      setHasMore(false);
      setCurrentPage(1);
      setSelectedJobId(null);
      setSubmittedQuery(searchQuery);
    }
  };

  // Load more jobs from next API page
  const loadMoreJobs = useCallback(async () => {
    if (isLoadingMore || !hasMore) return;
    setIsLoadingMore(true);
    try {
      const nextPage = apiPage + 1;
      const token = await getToken();
      const response = await jobsApi.search({
        query: submittedQuery,
        limit: 100,
        page: nextPage,
        experience: selectedExperience.length > 0 ? selectedExperience[0] : undefined,
        jobType: selectedJobTypes.length > 0 ? selectedJobTypes[0] : undefined,
      }, token || undefined);
      if (response.success && response.data && response.data.length > 0) {
        // Deduplicate by job id
        setAllJobs(prev => {
          const existingIds = new Set(prev.map(j => j.id));
          const newJobs = response.data!.filter(j => !existingIds.has(j.id));
          return [...prev, ...newJobs];
        });
        setHasMore(response.hasMore ?? false);
        setApiPage(nextPage);
      } else {
        setHasMore(false);
      }
    } catch (error) {
      console.error('Error loading more jobs:', error);
      toast({
        title: "Error",
        description: "Could not load more jobs. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoadingMore(false);
    }
  }, [isLoadingMore, hasMore, apiPage, submittedQuery, selectedExperience, selectedJobTypes, toast]);

  const toggleSaveJob = async (job: Job) => {
    if (!user) return;

    const isSaved = savedJobs.has(job.id);

    try {
      const token = await getToken();
      if (isSaved) {
        await savedJobsApi.unsave(user.id, job.id, token || undefined);
        queryClient.setQueryData(['savedJobs', user.id], (prev: Set<string> | undefined) => {
          const next = new Set(prev);
          next.delete(job.id);
          return next;
        });
        toast({ title: "Job removed from saved" });
      } else {
        const res = await savedJobsApi.save(user.id, job, token || undefined);
        if (!res.success) {
          toast({
            title: "Error",
            description: "Could not save job. Please try again.",
            variant: "destructive",
          });
          return;
        }
        queryClient.setQueryData(['savedJobs', user.id], (prev: Set<string> | undefined) => {
          return new Set(prev).add(job.id);
        });
        toast({ title: "Job saved!" });
      }
    } catch (error) {
      console.error('Error toggling saved job:', error);
      toast({
        title: "Error",
        description: "Could not save/unsave job. Please try again.",
        variant: "destructive",
      });
    }
  };

  const toggleFilter = (
    value: string,
    selected: string[],
    setSelected: React.Dispatch<React.SetStateAction<string[]>>
  ) => {
    if (selected.includes(value)) {
      setSelected(selected.filter(v => v !== value));
    } else {
      setSelected([...selected, value]);
    }
  };

  const parseSalary = (salary: string): number => {
    const match = salary.match(/(\d+)/);
    return match ? parseInt(match[1]) : 0;
  };

  const filteredAndSortedJobs = useMemo(() => {
    const jobs = allJobs;
    let result = jobs.filter((job) => {
      const matchesLocation =
        selectedLocations.length === 0 ||
        (selectedLocations.includes("Remote") && job.remote) ||
        selectedLocations.some(loc => job.location.toLowerCase().includes(loc.toLowerCase()));

      const matchesSalary = (() => {
        if (selectedSalary.length === 0) return true;
        const salary = parseSalary(job.salary);
        return selectedSalary.some(range => {
          if (range === "0 - 10 LPA") return salary >= 0 && salary < 10;
          if (range === "10 - 25 LPA") return salary >= 10 && salary < 25;
          if (range === "25 - 40 LPA") return salary >= 25 && salary <= 40;
          if (range === "40+ LPA") return salary > 40;
          return true;
        });
      })();

      return matchesLocation && matchesSalary;
    });

    switch (sortBy) {
      case "date":
        result = [...result].sort((a, b) => {
          const dateOrder = (date: string): number => {
            const lower = date.toLowerCase();
            if (lower.includes("today") || lower.includes("just now")) return 0;
            if (lower.includes("yesterday")) return 1;
            const daysMatch = lower.match(/(\d+)\s*days?/);
            if (daysMatch) return parseInt(daysMatch[1]);
            const weeksMatch = lower.match(/(\d+)\s*weeks?/);
            if (weeksMatch) return parseInt(weeksMatch[1]) * 7;
            const monthsMatch = lower.match(/(\d+)\s*months?/);
            if (monthsMatch) return parseInt(monthsMatch[1]) * 30;
            return 1000; // "Recently posted" or unknown
          };
          return dateOrder(a.postedDate) - dateOrder(b.postedDate);
        });
        break;
      case "match":
        result = [...result].sort((a, b) => b.matchScore - a.matchScore);
        break;
      case "relevance":
      default:
        break;
    }
    return result;
  }, [allJobs, selectedLocations, selectedJobTypes, selectedSalary, sortBy]);

  // Reset to page 1 when filters/sort/search change
  useEffect(() => {
    setCurrentPage(1);
  }, [filteredAndSortedJobs]);

  // Auto-select first job when results load
  useEffect(() => {
    if (filteredAndSortedJobs.length > 0 && !selectedJobId) {
      setSelectedJobId(filteredAndSortedJobs[0].id);
    }
  }, [filteredAndSortedJobs]);

  // Pagination computed values
  const totalPages = Math.ceil(filteredAndSortedJobs.length / JOBS_PER_PAGE);
  const paginatedJobs = filteredAndSortedJobs.slice(
    (currentPage - 1) * JOBS_PER_PAGE,
    currentPage * JOBS_PER_PAGE
  );

  // Selected job object
  const selectedJob = filteredAndSortedJobs.find(j => j.id === selectedJobId) || null;

  // Match score color helpers
  const getMatchPillClasses = (score: number) => {
    if (score >= 90) return "bg-primary/10 text-primary";
    if (score >= 80) return "bg-yellow-500/10 text-yellow-700 dark:text-yellow-500";
    return "bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400";
  };

  if (!isLoaded) return null;

  const displayName = profileName || `${user?.firstName || ''} ${user?.lastName || ''}`.trim() || 'User';
  const displayRole = profileRole || 'Set your role in Profile';

  return (
    <div className="bg-[#f6f7f8] dark:bg-[#101922] text-[#111418] dark:text-white h-screen overflow-hidden flex flex-col font-sans">
      {/* ========== HEADER ========== */}
      <header className="bg-white dark:bg-[#1a2632] border-b border-[#e5e7eb] dark:border-[#2a3642] sticky top-0 z-30 px-6 py-3 flex items-center justify-between gap-4 shrink-0">
        <div className="flex items-center gap-8">
          <Link to="/" className="flex items-center gap-2 text-primary font-bold text-xl tracking-tight shrink-0">
            <BriefcaseDoodle className="h-7 w-7 text-primary" />
            <span className="text-foreground">Easy <span className="text-primary">Jobs</span></span>
          </Link>
          <nav className="hidden md:flex items-center gap-1">
            <div className="px-3 py-2 rounded-lg bg-primary/10 text-primary text-sm font-bold cursor-pointer">
              Dashboard
            </div>
            <Link
              to="/my-applications"
              className="px-3 py-2 rounded-lg hover:bg-[#f0f2f4] dark:hover:bg-[#23303e] text-[#4b5563] dark:text-[#8492a6] text-sm font-medium cursor-pointer transition-colors"
            >
              Applications
            </Link>
            <Link
              to="/saved-jobs"
              className="px-3 py-2 rounded-lg hover:bg-[#f0f2f4] dark:hover:bg-[#23303e] text-[#4b5563] dark:text-[#8492a6] text-sm font-medium cursor-pointer transition-colors"
            >
              Saved
            </Link>
          </nav>
        </div>
        <div className="flex items-center gap-4">

          <Link to="/profile" className="flex items-center gap-3 pl-2 hover:opacity-80 transition-opacity">
            <div className="flex flex-col items-end overflow-hidden">
              <h1 className="text-[#111418] dark:text-white text-sm font-bold leading-none truncate">
                {displayName}
              </h1>
              <p className="text-[#4b5563] dark:text-[#8492a6] text-[11px] font-normal mt-1 truncate">
                {displayRole}
              </p>
            </div>
            <div
              className="bg-center bg-no-repeat bg-cover rounded-full size-9 shrink-0 border border-[#e5e7eb] dark:border-[#2a3642]"
              style={{ backgroundImage: `url("${user?.imageUrl}")` }}
            ></div>
          </Link>
        </div>
      </header>

      {/* ========== SUB-HEADER: Search & Filters ========== */}
      <div className="bg-white dark:bg-[#1a2632] border-b border-[#e5e7eb] dark:border-[#2a3642] px-6 py-3 shrink-0">
        <div className="max-w-[1600px] mx-auto flex items-center gap-3">
          <form onSubmit={handleSearch} className="relative flex-1 max-w-xl text-[#4b5563] focus-within:text-primary">
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
          <div className="relative">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center gap-2 px-4 py-2 rounded-lg border border-[#e5e7eb] dark:border-[#2a3642] hover:bg-[#f0f2f4] dark:hover:bg-[#23303e] text-[#111418] dark:text-white text-sm font-medium transition-colors"
            >
              <span className="material-symbols-outlined text-[20px]">tune</span>
              <span>Filters</span>
            </button>
            {/* Filter Dropdown */}
            {showFilters && (
              <div className="absolute top-full right-0 mt-2 w-72 bg-white dark:bg-[#1a2632] border border-[#e5e7eb] dark:border-[#2a3642] rounded-xl shadow-xl z-40 p-5 space-y-5">
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
          <div className="relative">
            <button
              onClick={() => setShowSortDropdown(!showSortDropdown)}
              className="flex items-center justify-between gap-3 rounded-lg border border-[#e5e7eb] dark:border-[#2a3642] bg-transparent hover:bg-[#f0f2f4] dark:hover:bg-[#23303e] transition-colors py-2 pl-4 pr-3 text-[#111418] dark:text-white text-sm font-medium outline-none cursor-pointer"
            >
              <span>{sortBy === "relevance" ? "Sort by : Relevance" : sortBy === "date" ? "Sort by : Newest" : "Sort by : Match %"}</span>
              <span className="material-symbols-outlined text-[18px] text-[#4b5563]">expand_more</span>
            </button>
            {showSortDropdown && (
              <div className="absolute top-full right-0 mt-2 w-[180px] bg-white dark:bg-[#1a2632] border border-[#e5e7eb] dark:border-[#2a3642] rounded-xl shadow-xl z-40 p-2 space-y-1">
                <button
                  onClick={() => { setSortBy("relevance"); setShowSortDropdown(false); }}
                  className={`w-full text-left px-3 py-2 rounded-lg text-sm font-medium transition-colors ${sortBy === "relevance" ? "bg-primary/10 text-primary dark:bg-primary/20 dark:text-primary" : "text-[#111418] dark:text-white hover:bg-[#f0f2f4] dark:hover:bg-[#23303e]"}`}
                >
                  Sort by : Relevance
                </button>
                <button
                  onClick={() => { setSortBy("date"); setShowSortDropdown(false); }}
                  className={`w-full text-left px-3 py-2 rounded-lg text-sm font-medium transition-colors ${sortBy === "date" ? "bg-primary/10 text-primary dark:bg-primary/20 dark:text-primary" : "text-[#111418] dark:text-white hover:bg-[#f0f2f4] dark:hover:bg-[#23303e]"}`}
                >
                  Sort by : Newest
                </button>
                <button
                  onClick={() => { setSortBy("match"); setShowSortDropdown(false); }}
                  className={`w-full text-left px-3 py-2 rounded-lg text-sm font-medium transition-colors ${sortBy === "match" ? "bg-primary/10 text-primary dark:bg-primary/20 dark:text-primary" : "text-[#111418] dark:text-white hover:bg-[#f0f2f4] dark:hover:bg-[#23303e]"}`}
                >
                  Sort by : Match %
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Close filter dropdown when clicking outside */}
      {showFilters && (
        <div className="fixed inset-0 z-30" onClick={() => setShowFilters(false)}></div>
      )}

      {/* ========== MAIN CONTENT SPLIT VIEW ========== */}
      <main className="flex-1 flex overflow-hidden">
        {/* Before search: full-width empty state */}
        {!hasSearched ? (
          <div className="flex-1 flex flex-col items-center justify-center gap-6 px-8">
            <div className="relative">
              <div className="absolute -inset-4 bg-primary/5 dark:bg-primary/10 rounded-full blur-xl animate-pulse"></div>
              <div className="relative w-20 h-20 rounded-2xl bg-gradient-to-br from-primary/20 to-primary/5 dark:from-primary/30 dark:to-primary/10 flex items-center justify-center border border-primary/10">
                <span className="material-symbols-outlined text-primary text-4xl">work</span>
              </div>
            </div>
            <div className="text-center max-w-md">
              <h2 className="text-xl font-bold text-[#111418] dark:text-white mb-2">Find your dream job</h2>
              <p className="text-sm text-[#4b5563] dark:text-[#8492a6] leading-relaxed">Search thousands of jobs by title, skill, or company name to discover opportunities tailored for you.</p>
            </div>
            <button
              onClick={() => searchInputRef.current?.focus()}
              className="flex items-center gap-2.5 px-8 py-3 bg-primary hover:bg-blue-600 text-white text-sm font-bold rounded-xl transition-all shadow-lg shadow-blue-500/25 hover:shadow-blue-500/40 hover:scale-[1.02] active:scale-[0.98]"
            >
              <span className="material-symbols-outlined text-[20px]">search</span>
              <span>Search Jobs</span>
            </button>
          </div>
        ) : isSearching ? (
          <div className="flex-1 flex items-center justify-center">
            <span className="material-symbols-outlined animate-spin text-primary text-3xl">refresh</span>
          </div>
        ) : filteredAndSortedJobs.length === 0 ? (
          <div className="flex-1 flex items-center justify-center text-gray-500">No jobs found.</div>
        ) : (
          <>
            {/* ===== LEFT COLUMN: Job List (40%) ===== */}
            <section className="w-[40%] flex flex-col border-r border-[#e5e7eb] dark:border-[#2a3642] bg-[#f8fafc] dark:bg-[#111827]">
              <div className="flex-1 overflow-y-auto py-2">
                {paginatedJobs.map((job) => (
                  <div
                    key={job.id}
                    onClick={() => setSelectedJobId(job.id)}
                    className={`mx-4 my-3 p-4 bg-white dark:bg-[#1a2632] rounded-xl shadow-sm cursor-pointer transition-colors border-2 ${selectedJobId === job.id
                      ? "border-primary"
                      : "border-transparent hover:shadow"
                      }`}
                  >
                    <div className="flex gap-4">
                      {/* Company logo */}
                      <div className="w-12 h-12 rounded-lg border border-gray-100 dark:border-gray-700 shrink-0 overflow-hidden bg-white flex items-center justify-center">
                        {job.companyLogo ? (
                          <img
                            src={job.companyLogo}
                            alt={`${job.company} logo`}
                            className="w-full h-full object-contain p-1"
                            onError={(e) => {
                              const target = e.currentTarget;
                              target.style.display = 'none';
                              if (target.nextElementSibling) {
                                (target.nextElementSibling as HTMLElement).style.display = 'flex';
                              }
                            }}
                          />
                        ) : null}
                        <div
                          className={`w-full h-full rounded-lg bg-gradient-to-br from-primary/20 to-primary/5 items-center justify-center text-lg font-bold text-primary ${job.companyLogo ? 'hidden' : 'flex'}`}
                        >
                          {job.company?.charAt(0)?.toUpperCase() || '?'}
                        </div>
                      </div>
                      {/* Job info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <h3 className="text-sm font-bold text-[#111418] dark:text-white truncate">{job.title}</h3>
                          {job.matchScore >= 0 && (
                            <div className={`match-pill inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-bold whitespace-nowrap ${getMatchPillClasses(job.matchScore)}`}>
                              {job.matchScore}% Match
                            </div>
                          )}
                        </div>
                        <p className="text-xs text-[#4b5563] dark:text-[#8492a6] mt-0.5">{job.company} • {job.location}</p>
                        <div className="flex items-center gap-2 mt-2">
                          <span className="text-[10px] text-[#4b5563] dark:text-[#8492a6]">{job.postedDate}</span>
                          <span className="text-[10px] text-[#4b5563]/50">•</span>
                          <span className="text-[10px] font-medium text-[#4b5563] dark:text-[#8492a6]">{job.salary}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}

                {/* Load more / pagination indicator */}
                {isLoadingMore && (
                  <div className="flex items-center justify-center py-4 gap-2">
                    <span className="material-symbols-outlined animate-spin text-primary text-xl">refresh</span>
                    <span className="text-xs text-[#4b5563]">Loading more...</span>
                  </div>
                )}

                {/* Pagination at bottom of list */}
                {totalPages > 1 && (
                  <div className="flex items-center justify-center gap-2 py-4 px-4">
                    <button
                      onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                      disabled={currentPage === 1}
                      className="p-1.5 rounded-lg border border-[#e5e7eb] dark:border-[#2a3642] bg-white dark:bg-[#1a2632] text-[#4b5563] hover:bg-[#f0f2f4] disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                    >
                      <span className="material-symbols-outlined text-[18px]">chevron_left</span>
                    </button>
                    <span className="text-xs text-[#4b5563] dark:text-[#8492a6]">
                      Page {currentPage} of {totalPages}
                    </span>
                    <button
                      onClick={() => {
                        if (currentPage === totalPages && hasMore) {
                          loadMoreJobs();
                        } else {
                          setCurrentPage(p => Math.min(totalPages, p + 1));
                        }
                      }}
                      disabled={currentPage === totalPages && !hasMore}
                      className="p-1.5 rounded-lg border border-[#e5e7eb] dark:border-[#2a3642] bg-white dark:bg-[#1a2632] text-[#4b5563] hover:bg-[#f0f2f4] disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                    >
                      <span className="material-symbols-outlined text-[18px]">chevron_right</span>
                    </button>
                  </div>
                )}
              </div>
            </section>

            {/* ===== RIGHT COLUMN: Job Details (60%) ===== */}
            <section className="w-[60%] flex flex-col bg-[#f6f7f8] dark:bg-[#101922] overflow-y-auto">
              {selectedJob ? (
                <div className="max-w-5xl mx-auto w-full p-8 px-12">
                  <div className="bg-white dark:bg-[#1a2632] rounded-2xl border border-[#e5e7eb] dark:border-[#2a3642] shadow-sm overflow-hidden">
                    <div className="p-8">
                      {/* Header Section */}
                      <div className="flex justify-between items-start mb-6">
                        <div className="flex items-center gap-4">
                          <div className="w-16 h-16 rounded-xl border border-gray-100 dark:border-gray-700 overflow-hidden bg-white flex items-center justify-center shrink-0">
                            {selectedJob.companyLogo ? (
                              <img
                                src={selectedJob.companyLogo}
                                alt={`${selectedJob.company} logo`}
                                className="w-full h-full object-contain p-1"
                                onError={(e) => {
                                  const target = e.currentTarget;
                                  target.style.display = 'none';
                                  if (target.nextElementSibling) {
                                    (target.nextElementSibling as HTMLElement).style.display = 'flex';
                                  }
                                }}
                              />
                            ) : null}
                            <div
                              className={`w-full h-full rounded-xl bg-gradient-to-br from-primary/20 to-primary/5 items-center justify-center text-2xl font-bold text-primary ${selectedJob.companyLogo ? 'hidden' : 'flex'}`}
                            >
                              {selectedJob.company?.charAt(0)?.toUpperCase() || '?'}
                            </div>
                          </div>
                          <div>
                            <h1 className="text-2xl font-bold text-[#111418] dark:text-white">{selectedJob.title}</h1>
                            <p className="text-lg text-[#4b5563] dark:text-[#8492a6] font-medium">{selectedJob.company}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => toggleSaveJob(selectedJob)}
                            className="p-2 text-[#4b5563] hover:bg-[#f0f2f4] dark:hover:bg-[#23303e] rounded-lg border border-[#e5e7eb] dark:border-[#2a3642] transition-colors"
                          >
                            <span
                              className={`material-symbols-outlined ${savedJobs.has(selectedJob.id) ? 'text-primary' : ''}`}
                              style={savedJobs.has(selectedJob.id) ? { fontVariationSettings: "'FILL' 1" } : {}}
                            >
                              bookmark
                            </span>
                          </button>
                        </div>
                      </div>

                      {/* Metadata Grid */}
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 py-6 border-y border-[#e5e7eb] dark:border-[#2a3642]">
                        <div className="flex flex-col gap-1">
                          <span className="text-[10px] text-[#4b5563] uppercase font-bold tracking-wider">Salary</span>
                          <span className="text-sm font-bold text-[#111418] dark:text-white">{selectedJob.salary || 'Not specified'}</span>
                        </div>
                        <div className="flex flex-col gap-1">
                          <span className="text-[10px] text-[#4b5563] uppercase font-bold tracking-wider">Location</span>
                          <span className="text-sm font-bold text-[#111418] dark:text-white">{selectedJob.location}{selectedJob.remote ? ' (Remote)' : ''}</span>
                        </div>
                        <div className="flex flex-col gap-1">
                          <span className="text-[10px] text-[#4b5563] uppercase font-bold tracking-wider">Experience</span>
                          <span className="text-sm font-bold text-[#111418] dark:text-white">{selectedJob.experienceLevel || 'Not specified'}</span>
                        </div>
                        <div className="flex flex-col gap-1">
                          <span className="text-[10px] text-[#4b5563] uppercase font-bold tracking-wider">Posted</span>
                          <span className="text-sm font-bold text-[#111418] dark:text-white">{selectedJob.postedDate}</span>
                        </div>
                      </div>

                      {/* Action Bar */}
                      <div className="mt-6 flex items-center justify-between pb-8">
                        {selectedJob.matchScore >= 0 && (
                          <div className="match-pill inline-flex items-center gap-2 px-4 py-2 bg-primary/10 text-primary text-sm font-bold">
                            <span className="material-symbols-outlined text-[18px]" style={{ fontVariationSettings: "'FILL' 1" }}>pie_chart</span>
                            {selectedJob.matchScore}% Match for your profile
                          </div>
                        )}
                        <button
                          onClick={async () => {
                            if (user) {
                              try {
                                const token = await getToken();
                                await appliedJobsApi.apply(user.id, selectedJob, token || undefined);
                                toast({ title: "Application tracked!" });
                              } catch (err) {
                                console.error('Error tracking application:', err);
                                toast({
                                  title: "Error",
                                  description: "Could not track application.",
                                  variant: "destructive",
                                });
                              }
                            }
                            if (selectedJob.applyUrl) {
                              window.open(selectedJob.applyUrl, '_blank');
                            }
                          }}
                          className="h-12 px-8 bg-primary hover:bg-blue-600 text-white text-base font-bold rounded-lg transition-colors flex items-center justify-center gap-2 shadow-lg shadow-blue-500/20"
                        >
                          <span>Apply Now</span>
                        </button>
                      </div>

                      {/* Detailed Information */}
                      <div className="space-y-8 pt-8 border-t border-[#e5e7eb] dark:border-[#2a3642]">
                        <section>
                          <h2 className="text-lg font-bold mb-4 text-[#111418] dark:text-white">About the Role</h2>
                          {(selectedJob.fullDescription || selectedJob.description) ? (
                            <div className="text-[#4b5563] dark:text-[#8492a6] leading-relaxed prose prose-sm max-w-none prose-headings:text-[#111418] dark:prose-headings:text-white prose-headings:text-base prose-headings:font-bold prose-headings:mt-6 prose-headings:mb-3 prose-li:my-0.5 prose-ul:my-2 prose-p:my-2 prose-strong:text-[#111418] dark:prose-strong:text-white">
                              <ReactMarkdown>{selectedJob.fullDescription || selectedJob.description}</ReactMarkdown>
                            </div>
                          ) : (
                            <div className="flex flex-col items-center gap-4 py-8 px-6 rounded-xl bg-[#f8fafc] dark:bg-[#111827] border border-dashed border-[#e5e7eb] dark:border-[#2a3642]">
                              <span className="material-symbols-outlined text-3xl text-[#4b5563]/50">description</span>
                              <p className="text-sm text-[#4b5563] dark:text-[#8492a6] text-center max-w-sm">
                                Full job description is not available from this source. View the complete details on the original posting.
                              </p>
                              {selectedJob.applyUrl && selectedJob.applyUrl !== '#' && (
                                <a
                                  href={selectedJob.applyUrl}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="flex items-center gap-2 px-5 py-2.5 bg-[#f0f2f4] dark:bg-[#23303e] hover:bg-[#e5e7eb] dark:hover:bg-[#2a3642] text-[#111418] dark:text-white text-sm font-medium rounded-lg transition-colors"
                                >
                                  <span>View Full Job Description</span>
                                  <span className="material-symbols-outlined text-[16px]">open_in_new</span>
                                </a>
                              )}
                            </div>
                          )}
                        </section>

                        {/* Job Highlights */}
                        {selectedJob.highlights && (
                          <section>
                            <h2 className="text-lg font-bold mb-4 text-[#111418] dark:text-white">Job Highlights</h2>
                            <div className="space-y-5">
                              {selectedJob.highlights.Qualifications && selectedJob.highlights.Qualifications.length > 0 && (
                                <div>
                                  <h3 className="text-sm font-bold text-[#111418] dark:text-white mb-2 flex items-center gap-2">
                                    <span className="material-symbols-outlined text-[18px] text-primary">school</span>
                                    Qualifications
                                  </h3>
                                  <ul className="space-y-1.5 ml-1">
                                    {selectedJob.highlights.Qualifications.map((item, i) => (
                                      <li key={i} className="flex items-start gap-2.5 text-sm text-[#4b5563] dark:text-[#8492a6]">
                                        <span className="text-primary mt-1.5 text-[6px]">●</span>
                                        <span>{item}</span>
                                      </li>
                                    ))}
                                  </ul>
                                </div>
                              )}
                              {selectedJob.highlights.Responsibilities && selectedJob.highlights.Responsibilities.length > 0 && (
                                <div>
                                  <h3 className="text-sm font-bold text-[#111418] dark:text-white mb-2 flex items-center gap-2">
                                    <span className="material-symbols-outlined text-[18px] text-primary">task_alt</span>
                                    Responsibilities
                                  </h3>
                                  <ul className="space-y-1.5 ml-1">
                                    {selectedJob.highlights.Responsibilities.map((item, i) => (
                                      <li key={i} className="flex items-start gap-2.5 text-sm text-[#4b5563] dark:text-[#8492a6]">
                                        <span className="text-primary mt-1.5 text-[6px]">●</span>
                                        <span>{item}</span>
                                      </li>
                                    ))}
                                  </ul>
                                </div>
                              )}
                              {selectedJob.highlights.Benefits && selectedJob.highlights.Benefits.length > 0 && (
                                <div>
                                  <h3 className="text-sm font-bold text-[#111418] dark:text-white mb-2 flex items-center gap-2">
                                    <span className="material-symbols-outlined text-[18px] text-primary">redeem</span>
                                    Benefits
                                  </h3>
                                  <ul className="space-y-1.5 ml-1">
                                    {selectedJob.highlights.Benefits.map((item, i) => (
                                      <li key={i} className="flex items-start gap-2.5 text-sm text-[#4b5563] dark:text-[#8492a6]">
                                        <span className="text-primary mt-1.5 text-[6px]">●</span>
                                        <span>{item}</span>
                                      </li>
                                    ))}
                                  </ul>
                                </div>
                              )}
                            </div>
                          </section>
                        )}

                        {/* Required Skills (full list from JSearch) */}
                        {selectedJob.requiredSkills && selectedJob.requiredSkills.length > 0 && (
                          <section>
                            <h2 className="text-lg font-bold mb-4 text-[#111418] dark:text-white">Required Skills</h2>
                            <div className="flex flex-wrap gap-2">
                              {selectedJob.requiredSkills.map((skill, i) => (
                                <span
                                  key={i}
                                  className="px-3 py-1.5 rounded-md bg-primary/5 dark:bg-primary/10 border border-primary/20 dark:border-primary/30 text-sm text-primary font-medium"
                                >
                                  {skill}
                                </span>
                              ))}
                            </div>
                          </section>
                        )}

                        {/* Skills Needed (extracted/inferred, shown only if no requiredSkills) */}
                        {(!selectedJob.requiredSkills || selectedJob.requiredSkills.length === 0) && selectedJob.skills && selectedJob.skills.length > 0 && (
                          <section>
                            <h2 className="text-lg font-bold mb-4 text-[#111418] dark:text-white">Skills Needed</h2>
                            <div className="flex flex-wrap gap-2">
                              {selectedJob.skills.map((skill, i) => (
                                <span
                                  key={i}
                                  className="px-3 py-1.5 rounded-md bg-[#f8fafc] dark:bg-[#111827] border border-[#e5e7eb] dark:border-[#2a3642] text-sm text-[#111418] dark:text-white font-medium"
                                >
                                  {skill}
                                </span>
                              ))}
                            </div>
                          </section>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="flex-1 flex items-center justify-center text-[#4b5563] dark:text-[#8492a6]">
                  <p className="text-sm">Select a job to view details</p>
                </div>
              )}
            </section>
          </>
        )}
      </main>
    </div>
  );
};

export default Dashboard;
