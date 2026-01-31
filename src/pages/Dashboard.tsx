import { useState, useEffect } from "react";
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
} from "lucide-react";
import { User as SupabaseUser } from "@supabase/supabase-js";

// Mock job data for initial display
const mockJobs = [
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
  {
    id: "4",
    title: "Software Engineer II",
    company: "Enterprise Solutions",
    location: "Seattle, WA",
    remote: true,
    salary: "$140,000 - $170,000",
    description:
      "Work on enterprise-scale applications serving millions of users worldwide.",
    matchScore: 78,
    postedDate: "3 days ago",
    jobType: "Full-time",
    applyUrl: "https://example.com/apply",
  },
  {
    id: "5",
    title: "Frontend Engineer",
    company: "FinTech Innovations",
    location: "Chicago, IL",
    remote: true,
    salary: "$120,000 - $150,000",
    description:
      "Help us revolutionize the financial industry with modern web technologies.",
    matchScore: 75,
    postedDate: "4 days ago",
    jobType: "Full-time",
    applyUrl: "https://example.com/apply",
  },
];

const Dashboard = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState<SupabaseUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [jobType, setJobType] = useState("all");
  const [remoteFilter, setRemoteFilter] = useState("all");
  const [savedJobs, setSavedJobs] = useState<string[]>([]);

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

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/");
  };

  const toggleSaveJob = (jobId: string) => {
    setSavedJobs((prev) =>
      prev.includes(jobId)
        ? prev.filter((id) => id !== jobId)
        : [...prev, jobId]
    );
  };

  const filteredJobs = mockJobs.filter((job) => {
    const matchesSearch =
      job.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      job.company.toLowerCase().includes(searchQuery.toLowerCase()) ||
      job.location.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesRemote =
      remoteFilter === "all" ||
      (remoteFilter === "remote" && job.remote) ||
      (remoteFilter === "onsite" && !job.remote);

    return matchesSearch && matchesRemote;
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
          <div className="flex flex-col gap-4 md:flex-row">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search jobs, companies, or locations..."
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
            </div>
          </div>

          <p className="text-sm text-muted-foreground">
            Showing {filteredJobs.length} jobs matched to your profile
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
                    onClick={() => toggleSaveJob(job.id)}
                    className={
                      savedJobs.includes(job.id)
                        ? "text-primary"
                        : "text-muted-foreground"
                    }
                  >
                    <Bookmark
                      className="h-5 w-5"
                      fill={savedJobs.includes(job.id) ? "currentColor" : "none"}
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

        {filteredJobs.length === 0 && (
          <div className="py-12 text-center">
            <p className="text-lg text-muted-foreground">
              No jobs found matching your search criteria.
            </p>
          </div>
        )}
      </main>
    </div>
  );
};

export default Dashboard;
