import { useState, useEffect, useCallback } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { BriefcaseDoodle } from "@/components/doodles";
import { jobsApi, savedJobsApi, Job } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import {
  Search,
  MapPin,
  Building2,
  DollarSign,
  Bookmark,
  ExternalLink,
  Filter,
  User,
  LogOut,
  Loader2,
  Briefcase,
  Clock,
  RefreshCw,
} from "lucide-react";
import { User as SupabaseUser } from "@supabase/supabase-js";

// Fallback mock jobs for when API is unavailable
const fallbackJobs: Job[] = [
  {
    id: "1",
    title: "Senior Frontend Developer",
    company: "TechCorp Inc.",
    location: "San Francisco, CA",
    remote: true,
    salary: "$150,000 - $180,000",
    description:
      "We're looking for a senior frontend developer to join our team and help build amazing user experiences.",
    matchScore: 95,
    postedDate: "2 days ago",
    jobType: "Full-time",
    applyUrl: "https://example.com/apply",
  },
  {
    id: "2",
    title: "Full Stack Engineer",
    company: "StartupXYZ",
    location: "New York, NY",
    remote: true,
    salary: "$130,000 - $160,000",
    description:
      "Join our fast-growing startup to work on cutting-edge technology and make a real impact.",
    matchScore: 88,
    postedDate: "5 days ago",
    jobType: "Full-time",
    applyUrl: "https://example.com/apply",
  },
  {
    id: "3",
    title: "React Developer",
    company: "Digital Agency Co.",
    location: "Austin, TX",
    remote: false,
    salary: "$100,000 - $130,000",
    description:
      "Creative agency seeking talented React developer to build beautiful web applications for top clients.",
    matchScore: 82,
    postedDate: "1 week ago",
    jobType: "Full-time",
    applyUrl: "https://example.com/apply",
  },
];

const Dashboard = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [user, setUser] = useState<SupabaseUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSearching, setIsSearching] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [submittedQuery, setSubmittedQuery] = useState("software developer");
  const [jobType, setJobType] = useState("all");
  const [remoteFilter, setRemoteFilter] = useState("all");
  const [jobs, setJobs] = useState<Job[]>(fallbackJobs);
  const [savedJobs, setSavedJobs] = useState<Set<string>>(new Set());

  // Authentication check
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setUser(session?.user ?? null);
        if (!session) {
          navigate("/auth");
        }
        setIsLoading(false);
      }
    );

    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      if (!session) {
        navigate("/auth");
      }
      setIsLoading(false);
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  // Load saved jobs for the user
  useEffect(() => {
    if (user) {
      loadSavedJobs();
    }
  }, [user]);

  const loadSavedJobs = async () => {
    if (!user) return;
    
    try {
      const response = await savedJobsApi.get(user.id);
      if (response.success && response.data) {
        const savedIds = new Set(response.data.map(job => job.id));
        setSavedJobs(savedIds);
      }
    } catch (error) {
      console.error('Error loading saved jobs:', error);
    }
  };

  // Search for jobs using Firecrawl
  const searchJobs = useCallback(async (query: string) => {
    if (!query.trim()) return;
    
    setIsSearching(true);
    try {
      const response = await jobsApi.search({
        query,
        remote: remoteFilter === 'remote' ? true : remoteFilter === 'onsite' ? false : undefined,
        jobType: jobType !== 'all' ? jobType : undefined,
        limit: 20,
      });

      if (response.success && response.data && response.data.length > 0) {
        setJobs(response.data);
        toast({
          title: "Jobs found!",
          description: `Found ${response.data.length} job listings matching your search.`,
        });
      } else {
        // Keep fallback jobs if search fails
        toast({
          title: "Using sample jobs",
          description: response.error || "Showing example listings. Try a different search.",
          variant: "default",
        });
      }
    } catch (error) {
      console.error('Job search error:', error);
      toast({
        title: "Search unavailable",
        description: "Showing example job listings. Real job search is being configured.",
        variant: "default",
      });
    } finally {
      setIsSearching(false);
    }
  }, [remoteFilter, jobType, toast]);

  // Initial job search
  useEffect(() => {
    if (user && submittedQuery) {
      searchJobs(submittedQuery);
    }
  }, [user, submittedQuery, searchJobs]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/");
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      setSubmittedQuery(searchQuery);
    }
  };

  const toggleSaveJob = async (job: Job) => {
    if (!user) return;

    const isSaved = savedJobs.has(job.id);
    
    try {
      if (isSaved) {
        await savedJobsApi.unsave(user.id, job.id);
        setSavedJobs(prev => {
          const next = new Set(prev);
          next.delete(job.id);
          return next;
        });
        toast({ title: "Job removed from saved" });
      } else {
        await savedJobsApi.save(user.id, job);
        setSavedJobs(prev => new Set(prev).add(job.id));
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

  // Filter jobs locally based on current filters
  const filteredJobs = jobs.filter((job) => {
    const matchesRemote =
      remoteFilter === "all" ||
      (remoteFilter === "remote" && job.remote) ||
      (remoteFilter === "onsite" && !job.remote);

    const matchesType =
      jobType === "all" || job.jobType.toLowerCase().includes(jobType);

    return matchesRemote && matchesType;
  });

  const getMatchScoreColor = (score: number) => {
    if (score >= 90) return "bg-success text-success-foreground";
    if (score >= 75) return "bg-primary text-primary-foreground";
    return "bg-muted text-muted-foreground";
  };

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-border bg-background/95 backdrop-blur">
        <div className="container flex h-16 items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <BriefcaseDoodle className="h-8 w-8 text-primary" />
            <span className="text-xl font-bold text-foreground">
              Simplify<span className="text-primary">.jobs</span>
            </span>
          </Link>

          <nav className="flex items-center gap-4">
            <Button variant="ghost" size="sm" asChild>
              <Link to="/profile" className="gap-2">
                <User className="h-4 w-4" />
                Profile
              </Link>
            </Button>
            <Button variant="ghost" size="sm" onClick={handleLogout}>
              <LogOut className="h-4 w-4" />
            </Button>
          </nav>
        </div>
      </header>

      {/* Main Content */}
      <main className="container py-8">
        {/* Search and Filters */}
        <div className="mb-8 space-y-4">
          <form onSubmit={handleSearch} className="flex flex-col gap-4 md:flex-row">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search jobs, skills, or keywords..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>

            <div className="flex gap-2">
              <Select value={remoteFilter} onValueChange={setRemoteFilter}>
                <SelectTrigger className="w-[140px]">
                  <Filter className="mr-2 h-4 w-4" />
                  <SelectValue placeholder="Location" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Jobs</SelectItem>
                  <SelectItem value="remote">Remote Only</SelectItem>
                  <SelectItem value="onsite">On-site Only</SelectItem>
                </SelectContent>
              </Select>

              <Select value={jobType} onValueChange={setJobType}>
                <SelectTrigger className="w-[140px]">
                  <Briefcase className="mr-2 h-4 w-4" />
                  <SelectValue placeholder="Job Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="fulltime">Full-time</SelectItem>
                  <SelectItem value="parttime">Part-time</SelectItem>
                  <SelectItem value="contract">Contract</SelectItem>
                </SelectContent>
              </Select>

              <Button type="submit" disabled={isSearching}>
                {isSearching ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <RefreshCw className="h-4 w-4" />
                )}
                <span className="ml-2 hidden sm:inline">Search</span>
              </Button>
            </div>
          </form>

          <p className="text-sm text-muted-foreground">
            {isSearching ? (
              <span className="flex items-center gap-2">
                <Loader2 className="h-3 w-3 animate-spin" />
                Searching for jobs...
              </span>
            ) : (
              `Showing ${filteredJobs.length} jobs ${submittedQuery ? `for "${submittedQuery}"` : ''}`
            )}
          </p>
        </div>

        {/* Job Cards */}
        <div className="space-y-4">
          {filteredJobs.map((job) => (
            <Card
              key={job.id}
              className="transition-all hover:border-primary/30 hover:shadow-md"
            >
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="mb-2 flex items-center gap-2">
                      <Badge className={getMatchScoreColor(job.matchScore)}>
                        {job.matchScore}% Match
                      </Badge>
                      {job.remote && (
                        <Badge variant="outline" className="border-accent text-accent">
                          Remote
                        </Badge>
                      )}
                    </div>
                    <CardTitle className="text-xl">{job.title}</CardTitle>
                    <CardDescription className="mt-1 flex items-center gap-4">
                      <span className="flex items-center gap-1">
                        <Building2 className="h-4 w-4" />
                        {job.company}
                      </span>
                      <span className="flex items-center gap-1">
                        <MapPin className="h-4 w-4" />
                        {job.location}
                      </span>
                    </CardDescription>
                  </div>

                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => toggleSaveJob(job)}
                    className={
                      savedJobs.has(job.id)
                        ? "text-primary"
                        : "text-muted-foreground"
                    }
                  >
                    <Bookmark
                      className="h-5 w-5"
                      fill={savedJobs.has(job.id) ? "currentColor" : "none"}
                    />
                  </Button>
                </div>
              </CardHeader>

              <CardContent>
                <p className="mb-4 text-muted-foreground">{job.description}</p>

                <div className="flex flex-wrap items-center justify-between gap-4">
                  <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <DollarSign className="h-4 w-4" />
                      {job.salary}
                    </span>
                    <span className="flex items-center gap-1">
                      <Briefcase className="h-4 w-4" />
                      {job.jobType}
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className="h-4 w-4" />
                      {job.postedDate}
                    </span>
                  </div>

                  <Button asChild className="gap-2">
                    <a
                      href={job.applyUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      Apply Now
                      <ExternalLink className="h-4 w-4" />
                    </a>
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {filteredJobs.length === 0 && !isSearching && (
          <div className="py-12 text-center">
            <p className="text-lg text-muted-foreground">
              No jobs found matching your criteria. Try adjusting your filters.
            </p>
          </div>
        )}
      </main>
    </div>
  );
};

export default Dashboard;
