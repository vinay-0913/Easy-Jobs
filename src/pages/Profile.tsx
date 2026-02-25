import { useState, useEffect, useMemo } from "react";
import { Link } from "react-router-dom";
import { useUser, useAuth, useClerk } from "@clerk/clerk-react";
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
import { useToast } from "@/hooks/use-toast";
import { BriefcaseDoodle } from "@/components/doodles";
import {
  profileApi,
  skillsApi,
  preferencesApi,
  sectionApi,
  Education,
  Experience,
} from "@/lib/api";
import {
  ArrowLeft,
  X,
  Plus,
  Loader2,
  User,
  Briefcase,
  MapPin,
  Trash2,
  Pencil,
  Mail,
  Phone,
  Calendar,
  Users,
  Check,
  LogOut,
  GraduationCap,
  Settings,
} from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const Profile = () => {
  const { user, isLoaded } = useUser();
  const { getToken } = useAuth();
  const { signOut } = useClerk();
  const { toast } = useToast();
  const [isSaving, setIsSaving] = useState(false);

  // Profile state
  const [displayName, setDisplayName] = useState("");
  const [bio, setBio] = useState("");
  const [role, setRole] = useState("");
  const [mobile, setMobile] = useState("");
  const [userLocationField, setUserLocationField] = useState("");
  const [gender, setGender] = useState("");
  const [dob, setDob] = useState("");

  // Skills state
  const [skills, setSkills] = useState<string[]>([]);
  const [newSkill, setNewSkill] = useState("");
  const [isAddingSkill, setIsAddingSkill] = useState(false);

  // Education state
  const [educationList, setEducationList] = useState<Education[]>([]);
  const [showEducationForm, setShowEducationForm] = useState(false);
  const [editingEducation, setEditingEducation] = useState<Education | null>(null);
  const [eduForm, setEduForm] = useState<Partial<Education>>({});

  // Experience state
  const [experienceList, setExperienceList] = useState<Experience[]>([]);
  const [showExperienceForm, setShowExperienceForm] = useState(false);
  const [editingExperience, setEditingExperience] = useState<Experience | null>(null);
  const [expForm, setExpForm] = useState<Partial<Experience>>({});

  // Preferences state
  const [prefRoles, setPrefRoles] = useState<string[]>([]);
  const [newPrefRole, setNewPrefRole] = useState("");
  const [prefLocations, setPrefLocations] = useState<string[]>([]);
  const [newPrefLocation, setNewPrefLocation] = useState("");
  const [salaryMin, setSalaryMin] = useState<number | undefined>();
  const [salaryMax, setSalaryMax] = useState<number | undefined>();
  const [jobTypes, setJobTypes] = useState<string[]>([]);
  const [remotePreference, setRemotePreference] = useState("any");
  const [experienceLevel, setExperienceLevel] = useState("");
  const [isSavingPrefs, setIsSavingPrefs] = useState(false);

  // Load user data from MongoDB
  useEffect(() => {
    if (user) {
      loadUserData();
    }
  }, [user]);

  const loadUserData = async () => {
    if (!user) return;

    try {
      const token = await getToken();

      // Load profile
      const profileRes = await profileApi.get(user.id, token || undefined);
      if (profileRes.success && profileRes.data) {
        setDisplayName(profileRes.data.full_name || "");
        setRole(profileRes.data.role || "");
        setMobile(profileRes.data.mobile || "");
        setUserLocationField(profileRes.data.location || "");
        setGender(profileRes.data.gender || "");
        setDob(profileRes.data.dob || "");
        setBio(profileRes.data.bio || "");
      }

      // Load skills
      const skillsRes = await skillsApi.get(user.id, token || undefined);
      if (skillsRes.success && skillsRes.data) {
        setSkills(skillsRes.data.map(s => s.skill));
      }

      // Load education
      const eduRes = await sectionApi.get('education', token || undefined);
      if (eduRes.success && eduRes.data) setEducationList(eduRes.data);

      // Load experience
      const expRes = await sectionApi.get('experience', token || undefined);
      if (expRes.success && expRes.data) setExperienceList(expRes.data);

      // Load preferences
      const prefRes = await preferencesApi.get(user.id, token || undefined);
      if (prefRes.success && prefRes.data) {
        setPrefRoles(prefRes.data.preferred_roles || []);
        setPrefLocations(prefRes.data.preferred_locations || []);
        setSalaryMin(prefRes.data.salary_min);
        setSalaryMax(prefRes.data.salary_max);
        setJobTypes(prefRes.data.job_types || []);
        setRemotePreference(prefRes.data.remote_preference || 'any');
        setExperienceLevel(prefRes.data.experience_level || '');
      }
    } catch (error) {
      console.error('Error loading user data:', error);
    }
  };

  const addSkill = async () => {
    if (!newSkill.trim() || !user || skills.includes(newSkill.trim())) return;

    setIsAddingSkill(true);
    try {
      const token = await getToken();
      const response = await skillsApi.add(user.id, newSkill.trim(), undefined, token || undefined);
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
      const token = await getToken();
      await skillsApi.remove(user.id, skill, token || undefined);
      setSkills(skills.filter((s) => s !== skill));
      toast({ title: "Skill removed" });
    } catch (error) {
      console.error('Error removing skill:', error);
    }
  };

  // --- Education CRUD ---
  const handleSaveEducation = async () => {
    if (!user) return;
    try {
      const token = await getToken();
      if (editingEducation?._id) {
        await sectionApi.update('education', editingEducation._id, eduForm, token || undefined);
        toast({ title: "Education updated" });
      } else {
        const res = await sectionApi.add('education', eduForm, token || undefined);
        if (res.success) toast({ title: "Education added" });
      }
      // Reload
      const fresh = await sectionApi.get('education', token || undefined);
      if (fresh.success) setEducationList(fresh.data);
      setShowEducationForm(false);
      setEditingEducation(null);
      setEduForm({});
    } catch (error) {
      toast({ title: "Error saving education", variant: "destructive" });
    }
  };

  const deleteEducation = async (id: string) => {
    if (!user) return;
    try {
      const token = await getToken();
      await sectionApi.remove('education', id, token || undefined);
      setEducationList(educationList.filter(e => e._id !== id));
      toast({ title: "Education removed" });
    } catch (error) {
      toast({ title: "Error removing education", variant: "destructive" });
    }
  };

  // --- Experience CRUD ---
  const handleSaveExperience = async () => {
    if (!user) return;
    try {
      const token = await getToken();
      if (editingExperience?._id) {
        await sectionApi.update('experience', editingExperience._id, expForm, token || undefined);
        toast({ title: "Experience updated" });
      } else {
        const res = await sectionApi.add('experience', expForm, token || undefined);
        if (res.success) toast({ title: "Experience added" });
      }
      const fresh = await sectionApi.get('experience', token || undefined);
      if (fresh.success) setExperienceList(fresh.data);
      setShowExperienceForm(false);
      setEditingExperience(null);
      setExpForm({});
    } catch (error) {
      toast({ title: "Error saving experience", variant: "destructive" });
    }
  };

  const deleteExperience = async (id: string) => {
    if (!user) return;
    try {
      const token = await getToken();
      await sectionApi.remove('experience', id, token || undefined);
      setExperienceList(experienceList.filter(e => e._id !== id));
      toast({ title: "Experience removed" });
    } catch (error) {
      toast({ title: "Error removing experience", variant: "destructive" });
    }
  };

  // --- Preferences Save ---
  const handleSavePreferences = async () => {
    if (!user) return;
    setIsSavingPrefs(true);
    try {
      const token = await getToken();
      await preferencesApi.update({
        preferred_roles: prefRoles,
        preferred_locations: prefLocations,
        experience_level: experienceLevel as any,
        salary_min: salaryMin,
        salary_max: salaryMax,
        job_types: jobTypes,
        remote_preference: remotePreference as any,
      }, token || undefined);
      toast({ title: "Preferences saved", description: "Your job preferences have been updated. Match scores will reflect these preferences." });
    } catch (error) {
      toast({ title: "Error saving preferences", variant: "destructive" });
    } finally {
      setIsSavingPrefs(false);
    }
  };

  const toggleJobType = (type: string) => {
    setJobTypes(prev => prev.includes(type) ? prev.filter(t => t !== type) : [...prev, type]);
  };

  const handleSaveProfile = async () => {
    if (!user) return;

    setIsSaving(true);
    try {
      const token = await getToken();
      const email = user.emailAddresses[0]?.emailAddress || "";

      // Save profile (includes all personal fields)
      await profileApi.upsert({
        user_id: user.id,
        email: email,
        full_name: displayName,
        role,
        mobile,
        location: userLocationField,
        gender: gender as any,
        dob,
        bio,
      }, token || undefined);


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

  if (!isLoaded) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const userEmail = user?.emailAddresses[0]?.emailAddress || "";
  const userAvatar = user?.imageUrl || "";
  const userFullName = displayName || user?.fullName || "";
  const displayLocation = userLocationField || "";
  const displayMobile = mobile || user?.phoneNumbers?.[0]?.phoneNumber || "";

  // Format gender for display
  const genderDisplay = gender ? {
    male: "Male",
    female: "Female",
    other: "Other",
    prefer_not_to_say: "Prefer not to say",
  }[gender] || "" : "";

  // Format DOB for display
  const dobDisplay = dob ? new Date(dob).toLocaleDateString('en-IN', {
    day: 'numeric', month: 'long', year: 'numeric'
  }) : "";

  // Calculate profile completion
  const profileCompletion = useMemo(() => {
    const fields = [
      !!userFullName,
      !!userEmail,
      !!role,
      !!displayMobile,
      !!displayLocation,
      !!gender,
      !!dob,
      skills.length > 0,
      !!userAvatar,
      !!bio,
    ];
    const filled = fields.filter(Boolean).length;
    return Math.round((filled / fields.length) * 100);
  }, [userFullName, userEmail, role, displayMobile, displayLocation, gender, dob, skills, userAvatar, bio]);

  // SVG ring math
  const ringRadius = 54;
  const ringCircumference = 2 * Math.PI * ringRadius;
  const ringOffset = ringCircumference - (profileCompletion / 100) * ringCircumference;

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-border bg-background/95 backdrop-blur">
        <div className="container flex h-16 items-center justify-between">
          <div className="flex items-center gap-4">
            <Link to="/dashboard" className="flex items-center gap-2">
              <BriefcaseDoodle className="h-8 w-8 text-primary" />
              <span className="text-xl font-bold text-foreground">
                Easy <span className="text-primary">Jobs</span>
              </span>
            </Link>
          </div>

          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" asChild>
              <Link to="/dashboard" className="gap-2">
                <ArrowLeft className="h-4 w-4" />
                Back to Dashboard
              </Link>
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => signOut()}
              className="gap-2 text-destructive hover:text-destructive hover:bg-destructive/10"
            >
              <LogOut className="h-4 w-4" />
              Logout
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container py-8">
        <div className="mx-auto max-w-3xl">
          <h1 className="mb-6 text-3xl font-bold text-foreground">Your Profile</h1>

          {/* ===== Profile Banner ===== */}
          <div className="profile-banner">
            {/* SVG gradient definition (shared) */}
            <svg width="0" height="0" style={{ position: 'absolute' }}>
              <defs>
                <linearGradient id="orangeGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#f39c12" />
                  <stop offset="100%" stopColor="#e67e22" />
                </linearGradient>
              </defs>
            </svg>

            {/* Avatar with completion ring */}
            <div className="profile-banner__avatar-section">
              <div className="profile-banner__avatar-ring">
                <svg viewBox="0 0 120 120">
                  <circle className="ring-bg" cx="60" cy="60" r={ringRadius} />
                  <circle
                    className="ring-progress"
                    cx="60"
                    cy="60"
                    r={ringRadius}
                    strokeDasharray={ringCircumference}
                    strokeDashoffset={ringOffset}
                  />
                </svg>
                {userAvatar ? (
                  <img
                    src={userAvatar}
                    alt={userFullName || "Profile"}
                    className="profile-banner__avatar-img"
                  />
                ) : (
                  <div className="profile-banner__avatar-placeholder">
                    <User className="h-10 w-10" />
                  </div>
                )}
              </div>
              <span className="profile-banner__completion">{profileCompletion}%</span>
            </div>

            {/* Info section */}
            <div className="profile-banner__info">
              <div className="profile-banner__name-row">
                <span className="profile-banner__name">
                  {userFullName || "Your Name"}
                </span>
                <button
                  className="profile-banner__edit-btn"
                  title="Edit profile"
                  onClick={() => {
                    const nameInput = document.getElementById('displayName');
                    if (nameInput) nameInput.focus();
                  }}
                >
                  <Pencil className="h-3.5 w-3.5" />
                </button>
              </div>

              <div className="profile-banner__subtitle">
                {role || (skills.length > 0 ? skills.slice(0, 3).join(" · ") : "Add your role & skills below")}
              </div>
              <div className="profile-banner__institution">
                {displayLocation ? `📍 ${displayLocation}` : "Set your location in Profile tab"}
              </div>

              <div className="profile-banner__details-grid">
                {/* Row 1 */}
                <div className="profile-banner__detail-item">
                  <MapPin />
                  <span>{displayLocation || "Not set"}</span>
                </div>
                <div className="profile-banner__detail-item">
                  <Phone />
                  <span>{displayMobile || "Not set"}</span>
                  {displayMobile && (
                    <span className="profile-banner__verified">
                      <Check />
                    </span>
                  )}
                </div>

                {/* Row 2 */}
                <div className="profile-banner__detail-item">
                  <Users />
                  <span>{genderDisplay || "Not set"}</span>
                </div>
                <div className="profile-banner__detail-item">
                  <Mail />
                  <span>{userEmail ? (userEmail.length > 20 ? userEmail.slice(0, 20) + "..." : userEmail) : "Not set"}</span>
                  {userEmail && (
                    <span className="profile-banner__verified">
                      <Check />
                    </span>
                  )}
                </div>

                {/* Row 3 */}
                <div className="profile-banner__detail-item">
                  <Calendar />
                  <span>{dobDisplay || "Not set"}</span>
                </div>
              </div>

              {/* Skills badges */}
              {skills.length > 0 && (
                <div className="profile-banner__skills">
                  {skills.map((skill) => (
                    <Badge key={skill} variant="secondary" className="text-xs">
                      {skill}
                    </Badge>
                  ))}
                </div>
              )}
            </div>
          </div>

          <Tabs defaultValue="profile" className="space-y-6">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="profile" className="gap-2">
                <User className="h-4 w-4" />
                Profile
              </TabsTrigger>
              <TabsTrigger value="education" className="gap-2">
                <GraduationCap className="h-4 w-4" />
                Education
              </TabsTrigger>
              <TabsTrigger value="experience" className="gap-2">
                <Briefcase className="h-4 w-4" />
                Experience
              </TabsTrigger>
              <TabsTrigger value="preferences" className="gap-2">
                <Settings className="h-4 w-4" />
                Preferences
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
                      value={userEmail}
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
                    <Label htmlFor="role">Role / Title</Label>
                    <Input
                      id="role"
                      value={role}
                      onChange={(e) => setRole(e.target.value)}
                      placeholder="e.g. Senior Frontend Developer"
                    />
                  </div>

                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="mobile">Mobile Number</Label>
                      <Input
                        id="mobile"
                        value={mobile}
                        onChange={(e) => setMobile(e.target.value)}
                        placeholder="+91 9876543210"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="userLocation">Location</Label>
                      <Input
                        id="userLocation"
                        value={userLocationField}
                        onChange={(e) => setUserLocationField(e.target.value)}
                        placeholder="e.g. Bangalore, India"
                      />
                    </div>
                  </div>

                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="gender">Gender</Label>
                      <Select value={gender} onValueChange={setGender}>
                        <SelectTrigger id="gender">
                          <SelectValue placeholder="Select gender" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="male">Male</SelectItem>
                          <SelectItem value="female">Female</SelectItem>
                          <SelectItem value="other">Other</SelectItem>
                          <SelectItem value="prefer_not_to_say">Prefer not to say</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="dob">Date of Birth</Label>
                      <Input
                        id="dob"
                        type="date"
                        value={dob}
                        onChange={(e) => setDob(e.target.value)}
                      />
                    </div>
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

            {/* Education Tab */}
            <TabsContent value="education">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                  <div>
                    <CardTitle>Education</CardTitle>
                    <CardDescription>Add your educational background</CardDescription>
                  </div>
                  <Button
                    size="sm"
                    onClick={() => {
                      setEduForm({});
                      setEditingEducation(null);
                      setShowEducationForm(true);
                    }}
                  >
                    <Plus className="mr-2 h-4 w-4" /> Add
                  </Button>
                </CardHeader>
                <CardContent className="space-y-4">
                  {showEducationForm && (
                    <div className="rounded-lg border p-4 space-y-4 bg-muted/30">
                      <div className="grid gap-4 sm:grid-cols-2">
                        <div className="space-y-2">
                          <Label>Institution</Label>
                          <Input value={eduForm.institution || ''} onChange={e => setEduForm({ ...eduForm, institution: e.target.value })} placeholder="e.g. IIT Delhi" />
                        </div>
                        <div className="space-y-2">
                          <Label>Degree</Label>
                          <Input value={eduForm.degree || ''} onChange={e => setEduForm({ ...eduForm, degree: e.target.value })} placeholder="e.g. B.Tech" />
                        </div>
                      </div>
                      <div className="grid gap-4 sm:grid-cols-2">
                        <div className="space-y-2">
                          <Label>Field of Study</Label>
                          <Input value={eduForm.field || ''} onChange={e => setEduForm({ ...eduForm, field: e.target.value })} placeholder="e.g. Computer Science" />
                        </div>
                        <div className="space-y-2">
                          <Label>Grade / CGPA</Label>
                          <Input value={eduForm.grade || ''} onChange={e => setEduForm({ ...eduForm, grade: e.target.value })} placeholder="e.g. 8.5 / 10" />
                        </div>
                      </div>
                      <div className="grid gap-4 sm:grid-cols-2">
                        <div className="space-y-2">
                          <Label>Start Date</Label>
                          <Input type="month" value={eduForm.startDate || ''} onChange={e => setEduForm({ ...eduForm, startDate: e.target.value })} />
                        </div>
                        <div className="space-y-2">
                          <Label>End Date</Label>
                          <Input type="month" value={eduForm.endDate || ''} onChange={e => setEduForm({ ...eduForm, endDate: e.target.value })} />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label>Description</Label>
                        <Textarea value={eduForm.description || ''} onChange={e => setEduForm({ ...eduForm, description: e.target.value })} placeholder="Relevant coursework, achievements..." rows={3} />
                      </div>
                      <div className="flex gap-2">
                        <Button onClick={handleSaveEducation}>Save</Button>
                        <Button variant="ghost" onClick={() => { setShowEducationForm(false); setEditingEducation(null); setEduForm({}); }}>Cancel</Button>
                      </div>
                    </div>
                  )}

                  {educationList.length === 0 && !showEducationForm && (
                    <div className="py-8 text-center">
                      <GraduationCap className="mx-auto mb-3 h-10 w-10 text-muted-foreground" />
                      <p className="text-muted-foreground">No education added yet</p>
                    </div>
                  )}

                  {educationList.map(edu => (
                    <div key={edu._id} className="flex items-start justify-between rounded-lg border p-4">
                      <div>
                        <h4 className="font-semibold">{edu.degree} in {edu.field}</h4>
                        <p className="text-sm text-muted-foreground">{edu.institution}</p>
                        <p className="text-xs text-muted-foreground mt-1">
                          {edu.startDate} — {edu.endDate || 'Present'}
                          {edu.grade && ` • ${edu.grade}`}
                        </p>
                        {edu.description && <p className="text-sm mt-2">{edu.description}</p>}
                      </div>
                      <div className="flex gap-1 shrink-0">
                        <Button variant="ghost" size="icon" onClick={() => {
                          setEduForm(edu);
                          setEditingEducation(edu);
                          setShowEducationForm(true);
                        }}>
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => edu._id && deleteEducation(edu._id)}>
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Experience Tab */}
            <TabsContent value="experience">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                  <div>
                    <CardTitle>Experience</CardTitle>
                    <CardDescription>Add your work experience</CardDescription>
                  </div>
                  <Button
                    size="sm"
                    onClick={() => {
                      setExpForm({});
                      setEditingExperience(null);
                      setShowExperienceForm(true);
                    }}
                  >
                    <Plus className="mr-2 h-4 w-4" /> Add
                  </Button>
                </CardHeader>
                <CardContent className="space-y-4">
                  {showExperienceForm && (
                    <div className="rounded-lg border p-4 space-y-4 bg-muted/30">
                      <div className="grid gap-4 sm:grid-cols-2">
                        <div className="space-y-2">
                          <Label>Company</Label>
                          <Input value={expForm.company || ''} onChange={e => setExpForm({ ...expForm, company: e.target.value })} placeholder="e.g. Google" />
                        </div>
                        <div className="space-y-2">
                          <Label>Title</Label>
                          <Input value={expForm.title || ''} onChange={e => setExpForm({ ...expForm, title: e.target.value })} placeholder="e.g. Software Engineer" />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label>Location</Label>
                        <Input value={expForm.location || ''} onChange={e => setExpForm({ ...expForm, location: e.target.value })} placeholder="e.g. Bangalore, India" />
                      </div>
                      <div className="grid gap-4 sm:grid-cols-2">
                        <div className="space-y-2">
                          <Label>Start Date</Label>
                          <Input type="month" value={expForm.startDate || ''} onChange={e => setExpForm({ ...expForm, startDate: e.target.value })} />
                        </div>
                        <div className="space-y-2">
                          <Label>End Date</Label>
                          <Input type="month" value={expForm.endDate || ''} onChange={e => setExpForm({ ...expForm, endDate: e.target.value })} disabled={expForm.current} />
                        </div>
                      </div>
                      <label className="flex items-center gap-2 text-sm">
                        <input type="checkbox" checked={expForm.current || false} onChange={e => setExpForm({ ...expForm, current: e.target.checked, endDate: e.target.checked ? '' : expForm.endDate })} className="rounded" />
                        I currently work here
                      </label>
                      <div className="space-y-2">
                        <Label>Description</Label>
                        <Textarea value={expForm.description || ''} onChange={e => setExpForm({ ...expForm, description: e.target.value })} placeholder="Key responsibilities and achievements..." rows={3} />
                      </div>
                      <div className="flex gap-2">
                        <Button onClick={handleSaveExperience}>Save</Button>
                        <Button variant="ghost" onClick={() => { setShowExperienceForm(false); setEditingExperience(null); setExpForm({}); }}>Cancel</Button>
                      </div>
                    </div>
                  )}

                  {experienceList.length === 0 && !showExperienceForm && (
                    <div className="py-8 text-center">
                      <Briefcase className="mx-auto mb-3 h-10 w-10 text-muted-foreground" />
                      <p className="text-muted-foreground">No experience added yet</p>
                    </div>
                  )}

                  {experienceList.map(exp => (
                    <div key={exp._id} className="flex items-start justify-between rounded-lg border p-4">
                      <div>
                        <h4 className="font-semibold">{exp.title}</h4>
                        <p className="text-sm text-muted-foreground">{exp.company} • {exp.location}</p>
                        <p className="text-xs text-muted-foreground mt-1">
                          {exp.startDate} — {exp.current ? 'Present' : (exp.endDate || 'Present')}
                        </p>
                        {exp.description && <p className="text-sm mt-2">{exp.description}</p>}
                      </div>
                      <div className="flex gap-1 shrink-0">
                        <Button variant="ghost" size="icon" onClick={() => {
                          setExpForm(exp);
                          setEditingExperience(exp);
                          setShowExperienceForm(true);
                        }}>
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => exp._id && deleteExperience(exp._id)}>
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Preferences Tab */}
            <TabsContent value="preferences">
              <Card>
                <CardHeader>
                  <CardTitle>Job Preferences</CardTitle>
                  <CardDescription>These preferences improve your match scores on job listings</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Preferred Job Roles */}
                  <div className="space-y-2">
                    <Label>Preferred Job Roles / Titles</Label>
                    <div className="flex gap-2">
                      <Input
                        value={newPrefRole}
                        onChange={(e) => setNewPrefRole(e.target.value)}
                        placeholder="e.g. React Developer"
                        onKeyPress={(e) => {
                          if (e.key === "Enter" && newPrefRole.trim() && !prefRoles.includes(newPrefRole.trim())) {
                            setPrefRoles([...prefRoles, newPrefRole.trim()]);
                            setNewPrefRole("");
                          }
                        }}
                      />
                      <Button type="button" onClick={() => {
                        if (newPrefRole.trim() && !prefRoles.includes(newPrefRole.trim())) {
                          setPrefRoles([...prefRoles, newPrefRole.trim()]);
                          setNewPrefRole("");
                        }
                      }}>
                        <Plus className="h-4 w-4" />
                      </Button>
                    </div>
                    <div className="flex flex-wrap gap-2 pt-1">
                      {prefRoles.map((role) => (
                        <Badge key={role} variant="secondary" className="gap-1 pr-1">
                          {role}
                          <button onClick={() => setPrefRoles(prefRoles.filter(r => r !== role))} className="ml-1 rounded-full p-0.5 hover:bg-muted">
                            <X className="h-3 w-3" />
                          </button>
                        </Badge>
                      ))}
                      {prefRoles.length === 0 && <p className="text-sm text-muted-foreground">No preferred roles added</p>}
                    </div>
                  </div>

                  {/* Experience Level */}
                  <div className="space-y-2">
                    <Label>Experience Level</Label>
                    <Select value={experienceLevel} onValueChange={setExperienceLevel}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select experience level" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="fresher">Fresher (0-1 years)</SelectItem>
                        <SelectItem value="1-3">1-3 years</SelectItem>
                        <SelectItem value="3-5">3-5 years</SelectItem>
                        <SelectItem value="5-10">5-10 years</SelectItem>
                        <SelectItem value="10+">10+ years</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Preferred Locations */}
                  <div className="space-y-2">
                    <Label>Preferred Locations</Label>
                    <div className="flex gap-2">
                      <Input
                        value={newPrefLocation}
                        onChange={(e) => setNewPrefLocation(e.target.value)}
                        placeholder="e.g. Bangalore"
                        onKeyPress={(e) => {
                          if (e.key === "Enter" && newPrefLocation.trim() && !prefLocations.includes(newPrefLocation.trim())) {
                            setPrefLocations([...prefLocations, newPrefLocation.trim()]);
                            setNewPrefLocation("");
                          }
                        }}
                      />
                      <Button type="button" onClick={() => {
                        if (newPrefLocation.trim() && !prefLocations.includes(newPrefLocation.trim())) {
                          setPrefLocations([...prefLocations, newPrefLocation.trim()]);
                          setNewPrefLocation("");
                        }
                      }}>
                        <Plus className="h-4 w-4" />
                      </Button>
                    </div>
                    <div className="flex flex-wrap gap-2 pt-1">
                      {prefLocations.map((loc) => (
                        <Badge key={loc} variant="secondary" className="gap-1 pr-1">
                          {loc}
                          <button onClick={() => setPrefLocations(prefLocations.filter(l => l !== loc))} className="ml-1 rounded-full p-0.5 hover:bg-muted">
                            <X className="h-3 w-3" />
                          </button>
                        </Badge>
                      ))}
                      {prefLocations.length === 0 && <p className="text-sm text-muted-foreground">No preferred locations added</p>}
                    </div>
                  </div>

                  {/* Salary Range */}
                  <div className="space-y-2">
                    <Label>Expected Salary Range (₹ per annum)</Label>
                    <div className="grid gap-4 sm:grid-cols-2">
                      <Input
                        type="number"
                        value={salaryMin || ''}
                        onChange={(e) => setSalaryMin(e.target.value ? Number(e.target.value) : undefined)}
                        placeholder="Min salary (e.g. 500000)"
                      />
                      <Input
                        type="number"
                        value={salaryMax || ''}
                        onChange={(e) => setSalaryMax(e.target.value ? Number(e.target.value) : undefined)}
                        placeholder="Max salary (e.g. 1500000)"
                      />
                    </div>
                  </div>

                  {/* Job Types */}
                  <div className="space-y-2">
                    <Label>Preferred Job Types</Label>
                    <div className="flex flex-wrap gap-3">
                      {['Full-time', 'Part-time', 'Contract', 'Internship'].map(type => (
                        <label key={type} className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={jobTypes.includes(type)}
                            onChange={() => toggleJobType(type)}
                            className="rounded border-gray-300 text-primary focus:ring-primary"
                          />
                          <span className="text-sm">{type}</span>
                        </label>
                      ))}
                    </div>
                  </div>

                  {/* Remote Preference */}
                  <div className="space-y-2">
                    <Label>Remote Preference</Label>
                    <Select value={remotePreference} onValueChange={setRemotePreference}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select preference" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="any">Any (No preference)</SelectItem>
                        <SelectItem value="remote">Remote only</SelectItem>
                        <SelectItem value="onsite">On-site only</SelectItem>
                        <SelectItem value="hybrid">Hybrid</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <Button onClick={handleSavePreferences} disabled={isSavingPrefs}>
                    {isSavingPrefs && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Save Preferences
                  </Button>
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
