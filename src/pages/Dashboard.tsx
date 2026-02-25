import { useState, useMemo, useEffect, useCallback, useRef } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { useUser, useClerk, useAuth } from "@clerk/clerk-react";
import { jobsApi, savedJobsApi, appliedJobsApi, profileApi, Job } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import { BriefcaseDoodle } from "@/components/doodles";


const Dashboard = () => {
  const { user, isLoaded } = useUser();
  const { signOut } = useClerk();
  const { getToken } = useAuth();
  const { toast } = useToast();

  // Profile data for sidebar
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

  // Active navigation
  const [activeNav, setActiveNav] = useState("dashboard");

  // Load profile data for sidebar
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
        console.error('Error loading profile for sidebar:', err);
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

  // Pagination computed values
  const totalPages = Math.ceil(filteredAndSortedJobs.length / JOBS_PER_PAGE);
  const paginatedJobs = filteredAndSortedJobs.slice(
    (currentPage - 1) * JOBS_PER_PAGE,
    currentPage * JOBS_PER_PAGE
  );

  // Generate page numbers with ellipsis
  const getPageNumbers = () => {
    const pages: (number | string)[] = [];
    if (totalPages <= 7) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      pages.push(1);
      if (currentPage > 3) pages.push('...');
      const start = Math.max(2, currentPage - 1);
      const end = Math.min(totalPages - 1, currentPage + 1);
      for (let i = start; i <= end; i++) pages.push(i);
      if (currentPage < totalPages - 2) pages.push('...');
      pages.push(totalPages);
    }
    return pages;
  };

  if (!isLoaded) return null;

  return (
    <div className="bg-background-light dark:bg-background-dark text-[#111418] dark:text-white h-screen overflow-hidden flex font-sans">
      <aside className="w-72 bg-white dark:bg-[#1a2632] border-r border-[#e5e7eb] dark:border-[#2a3642] flex flex-col shrink-0 h-full overflow-y-auto">
        <div className="p-6 pb-2">
          <Link to="/" className="flex items-center gap-2 font-bold text-xl tracking-tight">
            <BriefcaseDoodle className="h-8 w-8 text-primary" />
            <span className="text-foreground">Easy <span className="text-primary">Jobs</span></span>
          </Link>
        </div>
        <div className="px-4 py-4">
          <Link to="/profile" className="flex items-center gap-3 p-3 rounded-lg bg-[#f0f2f4] dark:bg-[#23303e] hover:bg-[#e5e7eb] dark:hover:bg-[#2a3642] transition-colors cursor-pointer">
            <div
              className="bg-center bg-no-repeat bg-cover rounded-full size-10 shrink-0"
              style={{ backgroundImage: `url("${user?.imageUrl}")` }}
            ></div>
            <div className="flex flex-col overflow-hidden">
              <h1 className="text-[#111418] dark:text-white text-sm font-bold leading-normal truncate">
                {profileName || `${user?.firstName || ''} ${user?.lastName || ''}`.trim() || 'User'}
              </h1>
              <p className="text-[#617589] dark:text-[#94a3b8] text-xs font-normal leading-normal truncate">{profileRole || 'Set your role in Profile'}</p>
            </div>
          </Link>
        </div>

        <div className="flex flex-col gap-1 px-4">
          <div
            onClick={() => setActiveNav("dashboard")}
            className={`flex items-center gap-3 px-3 py-2 rounded-lg cursor-pointer transition-colors ${activeNav === "dashboard" ? "bg-primary/10 text-primary" : "hover:bg-[#f0f2f4] dark:hover:bg-[#23303e] text-[#617589] dark:text-[#94a3b8]"}`}
          >
            <span className="material-symbols-outlined text-[20px]" style={activeNav === "dashboard" ? { fontVariationSettings: "'FILL' 1" } : {}}>dashboard</span>
            <p className={`text-sm ${activeNav === "dashboard" ? "font-bold" : "font-medium"}`}>Dashboard</p>
          </div>
          <Link
            to="/my-applications"
            className="flex items-center gap-3 px-3 py-2 rounded-lg cursor-pointer transition-colors hover:bg-[#f0f2f4] dark:hover:bg-[#23303e] text-[#617589] dark:text-[#94a3b8]"
          >
            <span className="material-symbols-outlined text-[20px]">work</span>
            <p className="text-sm font-medium">My Applications</p>
          </Link>
          <Link
            to="/saved-jobs"
            className="flex items-center gap-3 px-3 py-2 rounded-lg cursor-pointer transition-colors hover:bg-[#f0f2f4] dark:hover:bg-[#23303e] text-[#617589] dark:text-[#94a3b8]"
          >
            <span className="material-symbols-outlined text-[20px]">bookmark</span>
            <p className="text-sm font-medium">Saved Jobs</p>
          </Link>
        </div>

        <div className="h-px bg-[#e5e7eb] dark:bg-[#2a3642] my-4 mx-6"></div>

        <div className="px-6 flex flex-col gap-6 mb-8">
          <div className="flex flex-col gap-3">
            <h3 className="text-xs font-bold text-[#617589] dark:text-[#94a3b8] uppercase tracking-wider">Job Type</h3>
            {["Full-time", "Internship"].map(type => (
              <label key={type} className="flex items-center gap-3 cursor-pointer group">
                <input
                  type="checkbox"
                  checked={selectedJobTypes.includes(type)}
                  onChange={() => toggleFilter(type, selectedJobTypes, setSelectedJobTypes)}
                  className="w-4 h-4 rounded border-gray-300 text-primary focus:ring-primary"
                />
                <span className="text-sm text-[#111418] dark:text-gray-200">{type}</span>
              </label>
            ))}
          </div>
          <div className="flex flex-col gap-3">
            <h3 className="text-xs font-bold text-[#617589] dark:text-[#94a3b8] uppercase tracking-wider">Experience</h3>
            {["0-1 Years", "2-5 Years", "5+ Years"].map(exp => (
              <label key={exp} className="flex items-center gap-3 cursor-pointer group">
                <input
                  type="checkbox"
                  checked={selectedExperience.includes(exp)}
                  onChange={() => toggleFilter(exp, selectedExperience, setSelectedExperience)}
                  className="w-4 h-4 rounded border-gray-300 text-primary focus:ring-primary"
                />
                <span className="text-sm text-[#111418] dark:text-gray-200">{exp}</span>
              </label>
            ))}
          </div>
          <div className="flex flex-col gap-3">
            <h3 className="text-xs font-bold text-[#617589] dark:text-[#94a3b8] uppercase tracking-wider">Location</h3>
            {["Remote", "Bangalore", "Hyderabad", "Pune", "Delhi"].map(loc => (
              <label key={loc} className="flex items-center gap-3 cursor-pointer group">
                <input
                  type="checkbox"
                  checked={selectedLocations.includes(loc)}
                  onChange={() => toggleFilter(loc, selectedLocations, setSelectedLocations)}
                  className="w-4 h-4 rounded border-gray-300 text-primary focus:ring-primary"
                />
                <span className="text-sm text-[#111418] dark:text-gray-200">{loc}</span>
              </label>
            ))}
          </div>
          <div className="flex flex-col gap-3">
            <h3 className="text-xs font-bold text-[#617589] dark:text-[#94a3b8] uppercase tracking-wider">Salary (LPA)</h3>
            {["0 - 10 LPA", "10 - 25 LPA", "25 - 40 LPA", "40+ LPA"].map(sal => (
              <label key={sal} className="flex items-center gap-3 cursor-pointer group">
                <input
                  type="checkbox"
                  checked={selectedSalary.includes(sal)}
                  onChange={() => toggleFilter(sal, selectedSalary, setSelectedSalary)}
                  className="w-4 h-4 rounded border-gray-300 text-primary focus:ring-primary"
                />
                <span className="text-sm text-[#111418] dark:text-gray-200">{sal}</span>
              </label>
            ))}
          </div>
        </div>
      </aside>

      <main className="flex-1 flex flex-col min-w-0 overflow-hidden bg-background-light dark:bg-background-dark">
        <header className="bg-white dark:bg-[#1a2632] border-b border-[#e5e7eb] dark:border-[#2a3642] sticky top-0 z-20 px-8 py-4 flex items-center justify-between gap-4">
          <div className="flex-1 max-w-2xl flex items-center gap-4">
            <form onSubmit={handleSearch} className="relative flex-1 text-[#617589] focus-within:text-primary">
              <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                <span className="material-symbols-outlined text-[20px]">search</span>
              </div>
              <input
                ref={searchInputRef}
                type="text"
                className="block w-full rounded-lg border-none bg-[#f0f2f4] dark:bg-[#23303e] py-2.5 pl-10 pr-3 text-[#111418] dark:text-white placeholder:text-[#617589] focus:ring-2 focus:ring-primary sm:text-sm sm:leading-6"
                placeholder="Search by job title, skill, or company..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </form>
            <div className="relative group">
              <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none z-10">
                <span className="material-symbols-outlined text-[20px] text-[#617589]">sort</span>
              </div>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="appearance-none block w-44 rounded-lg border-none bg-[#f0f2f4] dark:bg-[#23303e] py-2.5 pl-10 pr-10 text-[#111418] dark:text-white text-sm font-medium focus:ring-2 focus:ring-primary cursor-pointer transition-all"
              >
                <option value="relevance">Relevance</option>
                <option value="date">Date Posted</option>
                <option value="match">Highest Match</option>
              </select>
            </div>
          </div>

        </header>

        <div className="flex-1 overflow-y-auto px-8 py-6">
          <div className="max-w-5xl mx-auto flex flex-col gap-6">
            <div className="flex flex-col gap-4">
              {!hasSearched ? (
                <div className="flex flex-col items-center justify-center py-24 gap-6">
                  <div className="relative">
                    <div className="absolute -inset-4 bg-primary/5 dark:bg-primary/10 rounded-full blur-xl animate-pulse"></div>
                    <div className="relative w-20 h-20 rounded-2xl bg-gradient-to-br from-primary/20 to-primary/5 dark:from-primary/30 dark:to-primary/10 flex items-center justify-center border border-primary/10">
                      <span className="material-symbols-outlined text-primary text-4xl">work</span>
                    </div>
                  </div>
                  <div className="text-center max-w-md">
                    <h2 className="text-xl font-bold text-[#111418] dark:text-white mb-2">Find your dream job</h2>
                    <p className="text-sm text-[#617589] dark:text-[#94a3b8] leading-relaxed">Search thousands of jobs by title, skill, or company name to discover opportunities tailored for you.</p>
                  </div>
                  <button
                    onClick={() => {
                      searchInputRef.current?.focus();
                    }}
                    className="flex items-center gap-2.5 px-8 py-3 bg-primary hover:bg-blue-600 text-white text-sm font-bold rounded-xl transition-all shadow-lg shadow-blue-500/25 hover:shadow-blue-500/40 hover:scale-[1.02] active:scale-[0.98]"
                  >
                    <span className="material-symbols-outlined text-[20px]">search</span>
                    <span>Search Jobs</span>
                  </button>
                </div>
              ) : isSearching ? (
                <div className="flex items-center justify-center py-12">
                  <span className="material-symbols-outlined animate-spin text-primary text-3xl">refresh</span>
                </div>
              ) : filteredAndSortedJobs.length === 0 ? (
                <div className="text-center py-10 text-gray-500">No jobs found.</div>
              ) : (
                paginatedJobs.map(job => (
                  <div key={job.id} className="relative flex flex-col md:flex-row items-center gap-5 rounded-xl bg-white dark:bg-[#1a2632] p-5 shadow-sm border border-[#e5e7eb] dark:border-[#2a3642] hover:shadow-md transition-shadow md:min-h-[140px]">
                    <div className="absolute top-4 right-3 flex items-center gap-3">
                      <p className="text-xs text-[#617589] dark:text-[#94a3b8] whitespace-nowrap">Posted {job.postedDate}</p>
                      <button
                        onClick={() => toggleSaveJob(job)}
                        className="p-1 text-[#617589] hover:text-primary transition-colors focus:outline-none group"
                      >
                        <span
                          className={`material-symbols-outlined text-[18px] ${savedJobs.has(job.id) ? 'filled text-primary' : 'group-active:filled'}`}
                          style={savedJobs.has(job.id) ? { fontVariationSettings: "'FILL' 1" } : { fontVariationSettings: "'FILL' 0" }}
                        >
                          bookmark
                        </span>
                      </button>
                    </div>
                    <div className="shrink-0 self-start md:self-center">
                      {job.companyLogo ? (
                        <img
                          src={job.companyLogo}
                          alt={`${job.company} logo`}
                          className="w-14 h-14 rounded-lg border border-gray-100 dark:border-gray-700 bg-white object-contain p-1"
                          onError={(e) => {
                            const target = e.currentTarget;
                            target.style.display = 'none';
                            target.nextElementSibling?.classList.remove('hidden');
                          }}
                        />
                      ) : null}
                      <div
                        className={`w-14 h-14 rounded-lg border border-gray-100 dark:border-gray-700 bg-gradient-to-br from-primary/20 to-primary/5 dark:from-primary/30 dark:to-primary/10 flex items-center justify-center ${job.companyLogo ? 'hidden' : ''}`}
                      >
                        <span className="text-lg font-bold text-primary">
                          {job.company?.charAt(0)?.toUpperCase() || '?'}
                        </span>
                      </div>
                    </div>
                    <div className={`flex-1 flex flex-col gap-1.5 min-w-0 w-full ${!(job.skills && job.skills.length > 0) ? 'justify-center' : ''}`}>
                      <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
                        <div>
                          <div className="flex flex-wrap items-center gap-3">
                            <h2 className="text-lg font-bold text-[#111418] dark:text-white leading-tight">{job.title}</h2>
                            {job.matchScore >= 0 && (
                              <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-sm font-bold whitespace-nowrap ${job.matchScore >= 90 ? 'bg-primary/10 text-primary' : job.matchScore >= 80 ? 'bg-yellow-500/10 text-yellow-700' : 'bg-gray-100 text-gray-600'}`}>
                                <span className="material-symbols-outlined text-[16px] filled" style={{ fontVariationSettings: "'FILL' 1" }}>pie_chart</span>
                                {job.matchScore}% Match
                              </div>
                            )}
                          </div>
                          <p className="text-[#617589] dark:text-[#94a3b8] text-sm font-normal mt-0.5">{job.company} • {job.location} • {job.salary}</p>
                        </div>
                      </div>
                      <p className="text-[13px] text-[#617589]/80 dark:text-[#94a3b8]/80 font-normal leading-relaxed overflow-hidden text-ellipsis whitespace-nowrap max-w-full">{job.description}</p>
                      {job.skills && job.skills.length > 0 && (
                        <div className="flex flex-wrap gap-2 pt-1">
                          {job.skills.slice(0, 3).map((skill, i) => (
                            <span key={i} className="px-2.5 py-1 rounded-md bg-[#f0f2f4] dark:bg-[#23303e] text-[#617589] dark:text-[#94a3b8] text-xs font-medium border border-transparent dark:border-[#334155]">{skill}</span>
                          ))}
                        </div>
                      )}
                    </div>
                    <div className="flex flex-row md:flex-col justify-end gap-3 shrink-0 w-full md:w-auto md:pl-4 md:border-l md:border-dashed border-[#e5e7eb] dark:border-[#2a3642]">
                      <button
                        onClick={async (e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          // Track application FIRST, then open URL
                          if (user) {
                            try {
                              const token = await getToken();
                              await appliedJobsApi.apply(user.id, job, token || undefined);
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
                          // Open the apply URL after tracking
                          if (job.applyUrl) {
                            window.open(job.applyUrl, '_blank');
                          }
                        }}
                        className="flex-1 md:flex-none h-10 px-6 bg-primary hover:bg-blue-600 text-white text-sm font-bold rounded-lg transition-colors flex items-center justify-center gap-2 whitespace-nowrap shadow-sm shadow-blue-500/30"
                      >
                        <span>Apply Now</span>
                        <span className="material-symbols-outlined text-[18px]">open_in_new</span>
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-2 pb-4">
                <p className="text-sm text-[#617589] dark:text-[#94a3b8]">
                  Showing{' '}
                  <span className="font-semibold text-[#111418] dark:text-white">{(currentPage - 1) * JOBS_PER_PAGE + 1}</span>
                  –
                  <span className="font-semibold text-[#111418] dark:text-white">{Math.min(currentPage * JOBS_PER_PAGE, filteredAndSortedJobs.length)}</span>
                  {' '}of{' '}
                  <span className="font-semibold text-[#111418] dark:text-white">{filteredAndSortedJobs.length}</span>
                  {' '}jobs
                </p>
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                    className="flex items-center gap-1 px-3 py-2 text-sm font-medium rounded-lg border border-[#e5e7eb] dark:border-[#2a3642] bg-white dark:bg-[#1a2632] text-[#617589] dark:text-[#94a3b8] hover:bg-[#f0f2f4] dark:hover:bg-[#23303e] disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                  >
                    <span className="material-symbols-outlined text-[18px]">chevron_left</span>
                    Prev
                  </button>
                  {getPageNumbers().map((page, idx) =>
                    typeof page === 'string' ? (
                      <span key={`ellipsis-${idx}`} className="px-2 text-[#617589] dark:text-[#94a3b8] text-sm select-none">…</span>
                    ) : (
                      <button
                        key={page}
                        onClick={() => setCurrentPage(page)}
                        className={`min-w-[36px] h-9 px-2 text-sm font-medium rounded-lg transition-colors ${currentPage === page
                          ? 'bg-primary text-white shadow-sm shadow-blue-500/30'
                          : 'border border-[#e5e7eb] dark:border-[#2a3642] bg-white dark:bg-[#1a2632] text-[#617589] dark:text-[#94a3b8] hover:bg-[#f0f2f4] dark:hover:bg-[#23303e]'
                          }`}
                      >
                        {page}
                      </button>
                    )
                  )}
                  <button
                    onClick={() => {
                      if (currentPage === totalPages && hasMore) {
                        loadMoreJobs();
                      } else {
                        setCurrentPage(p => Math.min(totalPages, p + 1));
                      }
                    }}
                    disabled={currentPage === totalPages && !hasMore}
                    className="flex items-center gap-1 px-3 py-2 text-sm font-medium rounded-lg border border-[#e5e7eb] dark:border-[#2a3642] bg-white dark:bg-[#1a2632] text-[#617589] dark:text-[#94a3b8] hover:bg-[#f0f2f4] dark:hover:bg-[#23303e] disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                  >
                    {currentPage === totalPages && hasMore ? 'Load More' : 'Next'}
                    <span className="material-symbols-outlined text-[18px]">{currentPage === totalPages && hasMore ? 'add' : 'chevron_right'}</span>
                  </button>
                </div>
              </div>
            )}

            {isLoadingMore && (
              <div className="flex items-center justify-center py-6 gap-3">
                <span className="material-symbols-outlined animate-spin text-primary text-2xl">refresh</span>
                <span className="text-sm text-[#617589] dark:text-[#94a3b8]">Loading more jobs...</span>
              </div>
            )}
            <div className="h-8"></div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Dashboard;
