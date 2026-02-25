import { useState, useEffect, useMemo } from "react";
import { Link } from "react-router-dom";
import { useUser, useClerk, useAuth } from "@clerk/clerk-react";
import { savedJobsApi, appliedJobsApi, SavedJob } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import { BriefcaseDoodle } from "@/components/doodles";

const ITEMS_PER_PAGE = 6;

const SavedJobs = () => {
    const { user, isLoaded } = useUser();
    const { signOut } = useClerk();
    const { getToken } = useAuth();
    const { toast } = useToast();

    const [savedJobs, setSavedJobs] = useState<SavedJob[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [currentPage, setCurrentPage] = useState(1);

    // Load saved jobs
    useEffect(() => {
        if (user) {
            loadSavedJobs();
        }
    }, [user]);

    const loadSavedJobs = async () => {
        if (!user) return;
        setIsLoading(true);
        try {
            const token = await getToken();
            const response = await savedJobsApi.get(user.id, token || undefined);
            if (response.success && response.data) {
                setSavedJobs(response.data);
            }
        } catch (error) {
            console.error("Error loading saved jobs:", error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleUnsave = async (jobId: string) => {
        if (!user) return;
        try {
            const token = await getToken();
            const res = await savedJobsApi.unsave(user.id, jobId, token || undefined);
            if (res.success) {
                setSavedJobs((prev) => prev.filter((j) => (j.id || (j as any).job_id) !== jobId));
                toast({ title: "Job removed from saved" });
            }
        } catch (error) {
            console.error("Error unsaving job:", error);
            toast({
                title: "Error",
                description: "Could not remove saved job.",
                variant: "destructive",
            });
        }
    };

    const handleApply = async (job: SavedJob) => {
        if (!user) return;
        try {
            const token = await getToken();
            await appliedJobsApi.apply(user.id, {
                ...job,
                id: job.id || (job as any).job_id,
                matchScore: (job as any).matchScore || 0,
                postedDate: (job as any).postedDate || "",
                jobType: (job as any).jobType || "Full-time",
                applyUrl: job.applyUrl || (job as any).apply_url || "",
            }, token || undefined);
            toast({ title: "Application tracked!" });
        } catch (err) {
            console.error("Error tracking application:", err);
            toast({
                title: "Error",
                description: "Could not track application.",
                variant: "destructive",
            });
        }
        // Open the apply URL
        const url = job.applyUrl || (job as any).apply_url;
        if (url) {
            window.open(url, "_blank");
        }
    };

    const getJobId = (job: SavedJob) =>
        job.id || (job as any).job_id || (job as any)._id;

    // Pagination
    const totalPages = Math.ceil(savedJobs.length / ITEMS_PER_PAGE);
    const paginatedJobs = useMemo(() => {
        const start = (currentPage - 1) * ITEMS_PER_PAGE;
        return savedJobs.slice(start, start + ITEMS_PER_PAGE);
    }, [savedJobs, currentPage]);

    // Generate page numbers with ellipsis
    const getPageNumbers = () => {
        const pages: (number | string)[] = [];
        if (totalPages <= 7) {
            for (let i = 1; i <= totalPages; i++) pages.push(i);
        } else {
            pages.push(1);
            if (currentPage > 3) pages.push("...");
            const start = Math.max(2, currentPage - 1);
            const end = Math.min(totalPages - 1, currentPage + 1);
            for (let i = start; i <= end; i++) pages.push(i);
            if (currentPage < totalPages - 2) pages.push("...");
            pages.push(totalPages);
        }
        return pages;
    };

    if (!isLoaded) return null;

    return (
        <div className="bg-background-light dark:bg-background-dark text-[#111418] dark:text-white h-screen overflow-hidden flex font-sans">
            {/* Sidebar */}
            <aside className="w-72 bg-white dark:bg-[#1a2632] border-r border-[#e5e7eb] dark:border-[#2a3642] flex flex-col shrink-0 h-full overflow-y-auto">
                <div className="p-6 pb-2">
                    <div className="flex items-center gap-2 font-bold text-xl tracking-tight">
                        <BriefcaseDoodle className="h-8 w-8 text-primary" />
                        <span className="text-foreground">
                            Easy <span className="text-primary">Jobs</span>
                        </span>
                    </div>
                </div>
                <div className="px-4 py-4">
                    <Link
                        to="/profile"
                        className="flex items-center gap-3 p-3 rounded-lg bg-[#f0f2f4] dark:bg-[#23303e] hover:bg-[#e5e7eb] dark:hover:bg-[#2a3642] transition-colors cursor-pointer"
                    >
                        <div
                            className="bg-center bg-no-repeat bg-cover rounded-full size-10 shrink-0"
                            style={{ backgroundImage: `url("${user?.imageUrl}")` }}
                        ></div>
                        <div className="flex flex-col overflow-hidden">
                            <h1 className="text-[#111418] dark:text-white text-sm font-bold leading-normal truncate">
                                {user?.firstName} {user?.lastName}
                            </h1>
                            <p className="text-[#617589] dark:text-[#94a3b8] text-xs font-normal leading-normal truncate">
                                Senior Frontend Dev
                            </p>
                        </div>
                    </Link>
                </div>

                <div className="flex flex-col gap-1 px-4">
                    <Link
                        to="/dashboard"
                        className="flex items-center gap-3 px-3 py-2 rounded-lg cursor-pointer transition-colors hover:bg-[#f0f2f4] dark:hover:bg-[#23303e] text-[#617589] dark:text-[#94a3b8]"
                    >
                        <span className="material-symbols-outlined text-[20px]">dashboard</span>
                        <p className="text-sm font-medium">Dashboard</p>
                    </Link>
                    <Link
                        to="/my-applications"
                        className="flex items-center gap-3 px-3 py-2 rounded-lg cursor-pointer transition-colors hover:bg-[#f0f2f4] dark:hover:bg-[#23303e] text-[#617589] dark:text-[#94a3b8]"
                    >
                        <span className="material-symbols-outlined text-[20px]">work</span>
                        <p className="text-sm font-medium">My Applications</p>
                    </Link>
                    <div className="flex items-center gap-3 px-3 py-2 rounded-lg cursor-pointer transition-colors bg-primary/10 text-primary">
                        <span
                            className="material-symbols-outlined text-[20px]"
                            style={{ fontVariationSettings: "'FILL' 1" }}
                        >
                            bookmark
                        </span>
                        <p className="text-sm font-bold">Saved Jobs</p>
                    </div>
                </div>

                <div className="mt-auto p-4">
                    <button
                        onClick={() => signOut()}
                        className="flex items-center gap-3 px-3 py-2 rounded-lg cursor-pointer transition-colors hover:bg-red-50 dark:hover:bg-red-500/10 text-[#617589] dark:text-[#94a3b8] hover:text-red-600 w-full"
                    >
                        <span className="material-symbols-outlined text-[20px]">logout</span>
                        <p className="text-sm font-medium">Sign Out</p>
                    </button>
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 flex flex-col min-w-0 overflow-hidden bg-[#f8f9fb] dark:bg-background-dark">
                <div className="flex-1 overflow-y-auto px-8 py-8">
                    <div className="max-w-5xl mx-auto">
                        {/* Page Header */}
                        <div className="flex items-start justify-between mb-8">
                            <div>
                                <h1 className="text-2xl font-bold text-[#111418] dark:text-white">
                                    Saved Jobs
                                </h1>
                                <p className="text-sm text-[#617589] dark:text-[#94a3b8] mt-1">
                                    Manage the positions you're interested in.
                                </p>
                            </div>
                            <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-bold border border-primary/20">
                                <span className="material-symbols-outlined text-[18px]">bookmark</span>
                                {savedJobs.length} Jobs Saved
                            </div>
                        </div>

                        {/* Job Cards */}
                        <div className="flex flex-col gap-4">
                            {isLoading ? (
                                <div className="flex items-center justify-center py-16">
                                    <span className="material-symbols-outlined animate-spin text-primary text-3xl">
                                        refresh
                                    </span>
                                </div>
                            ) : savedJobs.length === 0 ? (
                                <div className="flex flex-col items-center justify-center py-20 gap-5">
                                    <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary/20 to-primary/5 dark:from-primary/30 dark:to-primary/10 flex items-center justify-center border border-primary/10">
                                        <span className="material-symbols-outlined text-primary text-3xl">bookmark_border</span>
                                    </div>
                                    <div className="text-center">
                                        <h2 className="text-lg font-bold text-[#111418] dark:text-white mb-1">No saved jobs yet</h2>
                                        <p className="text-sm text-[#617589] dark:text-[#94a3b8]">
                                            Save interesting jobs from the Dashboard to review them later.
                                        </p>
                                    </div>
                                    <Link
                                        to="/dashboard"
                                        className="flex items-center gap-2 px-6 py-2.5 bg-primary hover:bg-blue-600 text-white text-sm font-bold rounded-xl transition-all shadow-lg shadow-blue-500/25 hover:shadow-blue-500/40"
                                    >
                                        <span className="material-symbols-outlined text-[18px]">search</span>
                                        Browse Jobs
                                    </Link>
                                </div>
                            ) : (
                                paginatedJobs.map((job) => {
                                    const jobId = getJobId(job);
                                    const matchScore = (job as any).matchScore || 0;
                                    const applyUrl = job.applyUrl || (job as any).apply_url;

                                    return (
                                        <div
                                            key={jobId}
                                            className="flex items-center gap-5 rounded-xl bg-white dark:bg-[#1a2632] px-6 py-5 border border-[#e5e7eb] dark:border-[#2a3642] hover:shadow-md transition-shadow"
                                        >
                                            {/* Company Logo */}
                                            <div className="shrink-0">
                                                {(job as any).companyLogo || (job as any).company_logo ? (
                                                    <img
                                                        src={(job as any).companyLogo || (job as any).company_logo}
                                                        alt={`${job.company} logo`}
                                                        className="w-12 h-12 rounded-lg border border-gray-100 dark:border-gray-700 bg-white object-contain p-1"
                                                        onError={(e) => {
                                                            const target = e.currentTarget;
                                                            target.style.display = "none";
                                                            if (target.nextElementSibling)
                                                                (target.nextElementSibling as HTMLElement).style.display = "flex";
                                                        }}
                                                    />
                                                ) : null}
                                                <div
                                                    className={`w-12 h-12 rounded-lg border border-gray-100 dark:border-gray-700 bg-gradient-to-br from-primary/20 to-primary/5 dark:from-primary/30 dark:to-primary/10 items-center justify-center ${(job as any).companyLogo || (job as any).company_logo ? "hidden" : "flex"
                                                        }`}
                                                >
                                                    <span className="text-base font-bold text-primary">
                                                        {job.company?.charAt(0)?.toUpperCase() || "?"}
                                                    </span>
                                                </div>
                                            </div>

                                            {/* Job Info */}
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center gap-3 flex-wrap">
                                                    <h2 className="text-[15px] font-bold text-[#111418] dark:text-white leading-tight">
                                                        {job.title}
                                                    </h2>
                                                    {matchScore > 0 && (
                                                        <div
                                                            className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold whitespace-nowrap ${matchScore >= 90
                                                                ? "bg-primary/10 text-primary"
                                                                : matchScore >= 80
                                                                    ? "bg-yellow-500/10 text-yellow-700"
                                                                    : "bg-orange-500/10 text-orange-600"
                                                                }`}
                                                        >
                                                            <span
                                                                className="material-symbols-outlined text-[14px]"
                                                                style={{ fontVariationSettings: "'FILL' 1" }}
                                                            >
                                                                pie_chart
                                                            </span>
                                                            {matchScore}% Match
                                                        </div>
                                                    )}
                                                </div>
                                                <p className="text-xs text-[#617589] dark:text-[#94a3b8] mt-0.5 flex items-center gap-1">
                                                    {job.company}
                                                    <span className="text-[#d1d5db] dark:text-[#4b5563]">·</span>
                                                    <span className="material-symbols-outlined text-[14px]">location_on</span>
                                                    {job.location}
                                                </p>
                                            </div>

                                            {/* Actions */}
                                            <div className="flex items-center gap-3 shrink-0">
                                                <button
                                                    onClick={() => handleApply(job)}
                                                    className="h-10 px-6 bg-primary hover:bg-blue-600 text-white text-sm font-bold rounded-lg transition-colors flex items-center justify-center gap-2 whitespace-nowrap shadow-sm shadow-blue-500/30"
                                                >
                                                    Apply Now
                                                </button>
                                                <button
                                                    onClick={() => handleUnsave(jobId)}
                                                    className="p-2 text-primary hover:bg-primary/10 rounded-lg transition-colors focus:outline-none"
                                                    title="Remove from saved"
                                                >
                                                    <span
                                                        className="material-symbols-outlined text-[22px]"
                                                        style={{ fontVariationSettings: "'FILL' 1" }}
                                                    >
                                                        bookmark
                                                    </span>
                                                </button>
                                            </div>
                                        </div>
                                    );
                                })
                            )}
                        </div>

                        {/* Pagination */}
                        {totalPages > 1 && (
                            <div className="flex items-center justify-center gap-2 pt-8 pb-4">
                                <button
                                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                                    disabled={currentPage === 1}
                                    className="flex items-center justify-center w-9 h-9 rounded-lg border border-[#e5e7eb] dark:border-[#2a3642] bg-white dark:bg-[#1a2632] text-[#617589] dark:text-[#94a3b8] hover:bg-[#f0f2f4] dark:hover:bg-[#23303e] disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                                >
                                    <span className="material-symbols-outlined text-[18px]">chevron_left</span>
                                </button>
                                {getPageNumbers().map((page, idx) =>
                                    typeof page === "string" ? (
                                        <span
                                            key={`ellipsis-${idx}`}
                                            className="px-2 text-[#617589] dark:text-[#94a3b8] text-sm select-none"
                                        >
                                            …
                                        </span>
                                    ) : (
                                        <button
                                            key={page}
                                            onClick={() => setCurrentPage(page)}
                                            className={`min-w-[36px] h-9 px-2 text-sm font-medium rounded-lg transition-colors ${currentPage === page
                                                ? "bg-primary text-white shadow-sm shadow-blue-500/30"
                                                : "border border-[#e5e7eb] dark:border-[#2a3642] bg-white dark:bg-[#1a2632] text-[#617589] dark:text-[#94a3b8] hover:bg-[#f0f2f4] dark:hover:bg-[#23303e]"
                                                }`}
                                        >
                                            {page}
                                        </button>
                                    )
                                )}
                                <button
                                    onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                                    disabled={currentPage >= totalPages}
                                    className="flex items-center justify-center w-9 h-9 rounded-lg border border-[#e5e7eb] dark:border-[#2a3642] bg-white dark:bg-[#1a2632] text-[#617589] dark:text-[#94a3b8] hover:bg-[#f0f2f4] dark:hover:bg-[#23303e] disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                                >
                                    <span className="material-symbols-outlined text-[18px]">chevron_right</span>
                                </button>
                            </div>
                        )}
                    </div>
                </div>

                {/* Footer */}
                <footer className="border-t border-[#e5e7eb] dark:border-[#2a3642] bg-white dark:bg-[#1a2632] px-8 py-4 flex items-center justify-between text-xs text-[#617589] dark:text-[#94a3b8]">
                    <p>© 2025 Easy Jobs. All rights reserved.</p>
                    <div className="flex items-center gap-6">
                        <a href="#" className="hover:text-primary transition-colors">Privacy Policy</a>
                        <a href="#" className="hover:text-primary transition-colors">Terms of Service</a>
                        <a href="#" className="hover:text-primary transition-colors">Help Center</a>
                    </div>
                </footer>
            </main>
        </div>
    );
};

export default SavedJobs;
