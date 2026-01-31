import { useState, useEffect, useCallback } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
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
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { BriefcaseDoodle, DocumentDoodle } from "@/components/doodles";
import {
  profileApi,
  skillsApi,
  preferencesApi,
  savedJobsApi,
  SavedJob,
} from "@/lib/api";
import {
  ArrowLeft,
  X,
  Plus,
  Loader2,
  User,
  FileText,
  Settings,
  Bookmark,
  Briefcase,
  ExternalLink,
  MapPin,
  Building2,
  Trash2,
} from "lucide-react";
import { User as SupabaseUser } from "@supabase/supabase-js";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const Profile = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [user, setUser] = useState<SupabaseUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  // Profile state
  const [displayName, setDisplayName] = useState("");
  const [bio, setBio] = useState("");
  
  // Skills state
  const [skills, setSkills] = useState<string[]>([]);
  const [newSkill, setNewSkill] = useState("");
  const [isAddingSkill, setIsAddingSkill] = useState(false);
  
  // Preferences state
  const [preferredLocations, setPreferredLocations] = useState<string[]>([]);
  const [newLocation, setNewLocation] = useState("");
  const [salaryMin, setSalaryMin] = useState("");
  const [salaryMax, setSalaryMax] = useState("");
  const [jobType, setJobType] = useState("fulltime");
  const [remotePreference, setRemotePreference] = useState(true);

  // Resume state
  const [resumeFile, setResumeFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  // Saved jobs state
  const [savedJobs, setSavedJobs] = useState<SavedJob[]>([]);
  const [isLoadingSavedJobs, setIsLoadingSavedJobs] = useState(false);

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

  // Load user data from MongoDB
  useEffect(() => {
    if (user) {
      loadUserData();
    }
  }, [user]);

  const loadUserData = async () => {
    if (!user) return;

    try {
      // Load profile
      const profileRes = await profileApi.get(user.id);
      if (profileRes.success && profileRes.data) {
        setDisplayName(profileRes.data.full_name || "");
      }

      // Load skills
      const skillsRes = await skillsApi.get(user.id);
      if (skillsRes.success && skillsRes.data) {
        setSkills(skillsRes.data.map(s => s.skill));
      }

      // Load preferences
      const prefsRes = await preferencesApi.get(user.id);
      if (prefsRes.success && prefsRes.data) {
        setPreferredLocations(prefsRes.data.preferred_locations || []);
        setSalaryMin(prefsRes.data.salary_min?.toString() || "");
        setSalaryMax(prefsRes.data.salary_max?.toString() || "");
        setRemotePreference(prefsRes.data.remote_preference === 'remote' || prefsRes.data.remote_preference === 'any');
        if (prefsRes.data.job_types?.length > 0) {
          setJobType(prefsRes.data.job_types[0]);
        }
      }
    } catch (error) {
      console.error('Error loading user data:', error);
    }
  };

  const loadSavedJobs = async () => {
    if (!user) return;
    
    setIsLoadingSavedJobs(true);
    try {
      const response = await savedJobsApi.get(user.id);
      if (response.success && response.data) {
        setSavedJobs(response.data);
      }
    } catch (error) {
      console.error('Error loading saved jobs:', error);
    } finally {
      setIsLoadingSavedJobs(false);
    }
  };

  const addSkill = async () => {
    if (!newSkill.trim() || !user || skills.includes(newSkill.trim())) return;
    
    setIsAddingSkill(true);
    try {
      const response = await skillsApi.add(user.id, newSkill.trim());
      if (response.success) {
        setSkills([...skills, newSkill.trim()]);
        setNewSkill("");
        toast({ title: "Skill added" });
      }
    } catch (error) {
      console.error('Error adding skill:', error);
      toast({ title: "Error adding skill", variant: "destructive" });
    } finally {
      setIsAddingSkill(false);
    }
  };

  const removeSkill = async (skill: string) => {
    if (!user) return;
    
    try {
      await skillsApi.remove(user.id, skill);
      setSkills(skills.filter((s) => s !== skill));
      toast({ title: "Skill removed" });
    } catch (error) {
      console.error('Error removing skill:', error);
    }
  };

  const addLocation = () => {
    if (newLocation.trim() && !preferredLocations.includes(newLocation.trim())) {
      setPreferredLocations([...preferredLocations, newLocation.trim()]);
      setNewLocation("");
    }
  };

  const removeLocation = (location: string) => {
    setPreferredLocations(preferredLocations.filter((l) => l !== location));
  };

  const removeSavedJob = async (jobId: string) => {
    if (!user) return;
    
    try {
      await savedJobsApi.unsave(user.id, jobId);
      setSavedJobs(savedJobs.filter(j => j.id !== jobId));
      toast({ title: "Job removed from saved" });
    } catch (error) {
      console.error('Error removing saved job:', error);
    }
  };

  const handleResumeUpload = useCallback(async (file: File) => {
    if (!user) return;
    
    setIsUploading(true);
    try {
      // Here we would upload to storage and parse with AI
      toast({
        title: "Resume uploaded",
        description: "Your resume has been uploaded and is being processed.",
      });
      setResumeFile(file);
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : "Failed to upload resume";
      toast({
        title: "Upload failed",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
    }
  }, [user, toast]);

  const handleSaveProfile = async () => {
    if (!user) return;
    
    setIsSaving(true);
    try {
      // Save profile
      await profileApi.upsert({
        user_id: user.id,
        email: user.email || "",
        full_name: displayName,
      });

      // Save preferences
      await preferencesApi.update({
        user_id: user.id,
        preferred_locations: preferredLocations,
        salary_min: salaryMin ? parseInt(salaryMin) : undefined,
        salary_max: salaryMax ? parseInt(salaryMax) : undefined,
        job_types: [jobType],
        remote_preference: remotePreference ? 'remote' : 'onsite',
        industries: [],
      });

      toast({
        title: "Profile saved",
        description: "Your profile has been updated successfully.",
      });
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : "Failed to save profile";
      toast({
        title: "Save failed",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
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
          <div className="flex items-center gap-4">
            <Link to="/dashboard" className="flex items-center gap-2">
              <BriefcaseDoodle className="h-8 w-8 text-primary" />
              <span className="text-xl font-bold text-foreground">
                Simplify<span className="text-primary">.jobs</span>
              </span>
            </Link>
          </div>

          <Button variant="ghost" size="sm" asChild>
            <Link to="/dashboard" className="gap-2">
              <ArrowLeft className="h-4 w-4" />
              Back to Dashboard
            </Link>
          </Button>
        </div>
      </header>

      {/* Main Content */}
      <main className="container py-8">
        <div className="mx-auto max-w-3xl">
          <h1 className="mb-6 text-3xl font-bold text-foreground">Your Profile</h1>

          <Tabs defaultValue="profile" className="space-y-6" onValueChange={(tab) => {
            if (tab === 'saved') {
              loadSavedJobs();
            }
          }}>
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="profile" className="gap-2">
                <User className="h-4 w-4" />
                Profile
              </TabsTrigger>
              <TabsTrigger value="resume" className="gap-2">
                <FileText className="h-4 w-4" />
                Resume
              </TabsTrigger>
              <TabsTrigger value="preferences" className="gap-2">
                <Settings className="h-4 w-4" />
                Preferences
              </TabsTrigger>
              <TabsTrigger value="saved" className="gap-2">
                <Bookmark className="h-4 w-4" />
                Saved Jobs
              </TabsTrigger>
            </TabsList>

            {/* Profile Tab */}
            <TabsContent value="profile">
              <Card>
                <CardHeader>
                  <CardTitle>Personal Information</CardTitle>
                  <CardDescription>
                    Update your profile details visible to employers
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      value={user?.email || ""}
                      disabled
                      className="bg-muted"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="displayName">Display Name</Label>
                    <Input
                      id="displayName"
                      value={displayName}
                      onChange={(e) => setDisplayName(e.target.value)}
                      placeholder="John Doe"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="bio">Bio</Label>
                    <Textarea
                      id="bio"
                      value={bio}
                      onChange={(e) => setBio(e.target.value)}
                      placeholder="Tell us about yourself and your career goals..."
                      rows={4}
                    />
                  </div>

                  {/* Skills */}
                  <div className="space-y-2">
                    <Label>Skills</Label>
                    <div className="flex gap-2">
                      <Input
                        value={newSkill}
                        onChange={(e) => setNewSkill(e.target.value)}
                        placeholder="Add a skill..."
                        onKeyPress={(e) => e.key === "Enter" && addSkill()}
                        disabled={isAddingSkill}
                      />
                      <Button type="button" onClick={addSkill} disabled={isAddingSkill}>
                        {isAddingSkill ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
                      </Button>
                    </div>
                    <div className="flex flex-wrap gap-2 pt-2">
                      {skills.map((skill) => (
                        <Badge
                          key={skill}
                          variant="secondary"
                          className="gap-1 pr-1"
                        >
                          {skill}
                          <button
                            onClick={() => removeSkill(skill)}
                            className="ml-1 rounded-full p-0.5 hover:bg-muted"
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </Badge>
                      ))}
                      {skills.length === 0 && (
                        <p className="text-sm text-muted-foreground">
                          No skills added yet
                        </p>
                      )}
                    </div>
                  </div>

                  <Button onClick={handleSaveProfile} disabled={isSaving}>
                    {isSaving && (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    )}
                    Save Changes
                  </Button>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Resume Tab */}
            <TabsContent value="resume">
              <Card>
                <CardHeader>
                  <CardTitle>Resume</CardTitle>
                  <CardDescription>
                    Upload your resume for AI-powered skill extraction
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Upload area */}
                  <div
                    className="flex cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed border-border p-12 transition-colors hover:border-primary/50"
                    onDragOver={(e) => e.preventDefault()}
                    onDrop={(e) => {
                      e.preventDefault();
                      const file = e.dataTransfer.files[0];
                      if (file) handleResumeUpload(file);
                    }}
                    onClick={() => {
                      const input = document.createElement("input");
                      input.type = "file";
                      input.accept = ".pdf,.doc,.docx";
                      input.onchange = (e) => {
                        const file = (e.target as HTMLInputElement).files?.[0];
                        if (file) handleResumeUpload(file);
                      };
                      input.click();
                    }}
                  >
                    {isUploading ? (
                      <Loader2 className="h-12 w-12 animate-spin text-primary" />
                    ) : (
                      <>
                        <DocumentDoodle className="mb-4 h-16 w-16 text-primary" />
                        <p className="mb-2 font-medium text-foreground">
                          {resumeFile
                            ? resumeFile.name
                            : "Drop your resume here or click to upload"}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          PDF, DOC, or DOCX (max 10MB)
                        </p>
                      </>
                    )}
                  </div>

                  {resumeFile && (
                    <div className="rounded-lg bg-secondary/50 p-4">
                      <h4 className="mb-2 font-medium">AI-Extracted Skills</h4>
                      <p className="text-sm text-muted-foreground">
                        Processing your resume to extract skills and experience...
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Preferences Tab */}
            <TabsContent value="preferences">
              <Card>
                <CardHeader>
                  <CardTitle>Job Preferences</CardTitle>
                  <CardDescription>
                    Configure your job search preferences
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Preferred Locations */}
                  <div className="space-y-2">
                    <Label>Preferred Locations</Label>
                    <div className="flex gap-2">
                      <Input
                        value={newLocation}
                        onChange={(e) => setNewLocation(e.target.value)}
                        placeholder="Add a location..."
                        onKeyPress={(e) => e.key === "Enter" && addLocation()}
                      />
                      <Button type="button" onClick={addLocation}>
                        <Plus className="h-4 w-4" />
                      </Button>
                    </div>
                    <div className="flex flex-wrap gap-2 pt-2">
                      {preferredLocations.map((location) => (
                        <Badge
                          key={location}
                          variant="secondary"
                          className="gap-1 pr-1"
                        >
                          {location}
                          <button
                            onClick={() => removeLocation(location)}
                            className="ml-1 rounded-full p-0.5 hover:bg-muted"
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </Badge>
                      ))}
                      {preferredLocations.length === 0 && (
                        <p className="text-sm text-muted-foreground">
                          No locations added
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Salary Range */}
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="salaryMin">Minimum Salary</Label>
                      <Input
                        id="salaryMin"
                        type="number"
                        value={salaryMin}
                        onChange={(e) => setSalaryMin(e.target.value)}
                        placeholder="$80,000"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="salaryMax">Maximum Salary</Label>
                      <Input
                        id="salaryMax"
                        type="number"
                        value={salaryMax}
                        onChange={(e) => setSalaryMax(e.target.value)}
                        placeholder="$150,000"
                      />
                    </div>
                  </div>

                  {/* Job Type */}
                  <div className="space-y-2">
                    <Label>Job Type</Label>
                    <Select value={jobType} onValueChange={setJobType}>
                      <SelectTrigger>
                        <Briefcase className="mr-2 h-4 w-4" />
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="fulltime">Full-time</SelectItem>
                        <SelectItem value="parttime">Part-time</SelectItem>
                        <SelectItem value="contract">Contract</SelectItem>
                        <SelectItem value="any">Any</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Remote Preference */}
                  <div className="flex items-center justify-between rounded-lg border p-4">
                    <div>
                      <p className="font-medium">Remote Work</p>
                      <p className="text-sm text-muted-foreground">
                        Include remote job opportunities
                      </p>
                    </div>
                    <Switch
                      checked={remotePreference}
                      onCheckedChange={setRemotePreference}
                    />
                  </div>

                  <Button onClick={handleSaveProfile} disabled={isSaving}>
                    {isSaving && (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    )}
                    Save Preferences
                  </Button>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Saved Jobs Tab */}
            <TabsContent value="saved">
              <Card>
                <CardHeader>
                  <CardTitle>Saved Jobs</CardTitle>
                  <CardDescription>
                    Jobs you've bookmarked for later
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {isLoadingSavedJobs ? (
                    <div className="flex items-center justify-center py-12">
                      <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    </div>
                  ) : savedJobs.length === 0 ? (
                    <div className="py-12 text-center">
                      <Bookmark className="mx-auto mb-4 h-12 w-12 text-muted-foreground" />
                      <p className="text-muted-foreground">
                        No saved jobs yet. Start exploring and bookmark jobs you're
                        interested in!
                      </p>
                      <Button asChild className="mt-4">
                        <Link to="/dashboard">Browse Jobs</Link>
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {savedJobs.map((job) => (
                        <div
                          key={job.id}
                          className="flex items-start justify-between rounded-lg border p-4"
                        >
                          <div className="flex-1">
                            <h4 className="font-medium">{job.title}</h4>
                            <div className="mt-1 flex items-center gap-3 text-sm text-muted-foreground">
                              <span className="flex items-center gap-1">
                                <Building2 className="h-3 w-3" />
                                {job.company}
                              </span>
                              <span className="flex items-center gap-1">
                                <MapPin className="h-3 w-3" />
                                {job.location}
                              </span>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              asChild
                            >
                              <a
                                href={job.applyUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                              >
                                Apply
                                <ExternalLink className="ml-1 h-3 w-3" />
                              </a>
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => removeSavedJob(job.id)}
                            >
                              <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </main>
    </div>
  );
};

export default Profile;
