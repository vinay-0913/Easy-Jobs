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
  ArrowLeft,
  Upload,
  X,
  Plus,
  Loader2,
  User,
  FileText,
  Settings,
  Bookmark,
  Briefcase,
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

  const addSkill = () => {
    if (newSkill.trim() && !skills.includes(newSkill.trim())) {
      setSkills([...skills, newSkill.trim()]);
      setNewSkill("");
    }
  };

  const removeSkill = (skill: string) => {
    setSkills(skills.filter((s) => s !== skill));
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

  const handleResumeUpload = useCallback(async (file: File) => {
    if (!user) return;
    
    setIsUploading(true);
    try {
      // Here we would upload to Supabase Storage and parse with AI
      // For now, just show a success message
      toast({
        title: "Resume uploaded",
        description: "Your resume has been uploaded and is being processed.",
      });
      setResumeFile(file);
    } catch (error: any) {
      toast({
        title: "Upload failed",
        description: error.message || "Failed to upload resume",
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
    }
  }, [user, toast]);

  const handleSaveProfile = async () => {
    setIsSaving(true);
    try {
      // Here we would save to Supabase
      await new Promise((resolve) => setTimeout(resolve, 1000));
      toast({
        title: "Profile saved",
        description: "Your profile has been updated successfully.",
      });
    } catch (error: any) {
      toast({
        title: "Save failed",
        description: error.message || "Failed to save profile",
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

          <Tabs defaultValue="profile" className="space-y-6">
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
                      />
                      <Button type="button" onClick={addSkill}>
                        <Plus className="h-4 w-4" />
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
