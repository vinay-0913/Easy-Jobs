import { useState, useEffect, useMemo, useRef } from "react";
import { Link } from "react-router-dom";
import { useUser, useClerk, useAuth } from "@clerk/clerk-react";
import { appliedJobsApi, AppliedJob } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import { BriefcaseDoodle } from "@/components/doodles";

type StatusType = AppliedJob["status"];

const STATUS_OPTIONS: StatusType[] = [
    "Applied",
    "Not Applied",
    "Interview",
    "Offer Received",
    "Rejected",
];

const STATUS_STYLES: Record<StatusType, string> = {
    Applied:
        "bg-blue-50 text-blue-700 border-blue-200",
    "Not Applied":
        "bg-gray-50 text-gray-600 border-gray-200",
    Interview:
        "bg-indigo-50 text-indigo-700 border-indigo-200",
    "Offer Received":
        "bg-emerald-50 text-emerald-700 border-emerald-200",
    Rejected:
        "bg-red-50 text-red-600 border-red-200",
};

const STATUS_DOT: Record<StatusType, string> = {
    Applied: "bg-blue-500",
    "Not Applied": "bg-gray-400",
    Interview: "bg-indigo-500",
    "Offer Received": "bg-emerald-500",
    Rejected: "bg-red-500",
};

const ITEMS_PER_PAGE = 6;

const MyApplications = () => {
    const { user, isLoaded } = useUser();
    const { signOut } = useClerk();
    const { getToken } = useAuth();
    const { toast } = useToast();

    const [applications, setApplications] = useState<AppliedJob[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [currentPage, setCurrentPage] = useState(1);
    const [openStatusId, setOpenStatusId] = useState<string | null>(null);
    const [openActionId, setOpenActionId] = useState<string | null>(null);
    const statusRef = useRef<HTMLDivElement>(null);
    const actionRef = useRef<HTMLDivElement>(null);

    // Close dropdowns when clicking outside
    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (
                statusRef.current &&
                !statusRef.current.contains(e.target as Node)
            ) {
                setOpenStatusId(null);
            }
            if (
                actionRef.current &&
                !actionRef.current.contains(e.target as Node)
            ) {
                setOpenActionId(null);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    // Load applied jobs
    useEffect(() => {
        if (user) {
            loadApplications();
        }
    }, [user]);

    const loadApplications = async () => {
        if (!user) return;
        setIsLoading(true);
        try {
            const token = await getToken();
            const response = await appliedJobsApi.get(user.id, token || undefined);
            if (response.success && response.data) {
                setApplications(response.data);
            }
        } catch (error) {
            console.error("Error loading applications:", error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleStatusChange = async (jobId: string, newStatus: StatusType) => {
        if (!user) return;
        try {
            const token = await getToken();
            const res = await appliedJobsApi.updateStatus(
                user.id,
                jobId,
                newStatus,
                token || undefined
            );
            if (res.success) {
                setApplications((prev) =>
                    prev.map((app) =>
                        (app.id || app.job_id) === jobId
                            ? { ...app, status: newStatus }
                            : app
                    )
                );
                toast({ title: `Status updated to "${newStatus}"` });
            }
        } catch (error) {
            console.error("Error updating status:", error);
            toast({
                title: "Error",
                description: "Could not update status.",
                variant: "destructive",
            });
        }
        setOpenStatusId(null);
    };

    const handleRemove = async (jobId: string) => {
        if (!user) return;
        try {
            const token = await getToken();
            const res = await appliedJobsApi.remove(
                user.id,
                jobId,
                token || undefined
            );
            if (res.success) {
                setApplications((prev) =>
                    prev.filter((app) => (app.id || app.job_id) !== jobId)
                );
                toast({ title: "Application removed" });
            }
        } catch (error) {
            console.error("Error removing application:", error);
            toast({
                title: "Error",
                description: "Could not remove application.",
                variant: "destructive",
            });
        }
        setOpenActionId(null);
    };

    // Stats
    const stats = useMemo(() => {
        const total = applications.length;
        const notApplied = applications.filter(
            (a) => a.status === "Not Applied"
        ).length;
        const interview = applications.filter(
            (a) => a.status === "Interview"
        ).length;
        const offers = applications.filter(
            (a) => a.status === "Offer Received"
        ).length;
        const rejected = applications.filter(
            (a) => a.status === "Rejected"
        ).length;
        return { total, notApplied, interview, offers, rejected };
    }, [applications]);

    // Pagination
    const totalPages = Math.ceil(applications.length / ITEMS_PER_PAGE);
    const paginatedApps = useMemo(() => {
        const start = (currentPage - 1) * ITEMS_PER_PAGE;
        return applications.slice(start, start + ITEMS_PER_PAGE);
    }, [applications, currentPage]);

    const formatDate = (dateStr?: string) => {
        if (!dateStr) return "—";
        const date = new Date(dateStr);
        return date.toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
            year: "numeric",
        });
    };

    const timeAgo = (dateStr?: string) => {
        if (!dateStr) return "";
        const now = new Date();
        const date = new Date(dateStr);
        const diffMs = now.getTime() - date.getTime();
        const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
        if (diffDays === 0) return "today";
        if (diffDays === 1) return "1 day ago";
        if (diffDays < 7) return `${diffDays} days ago`;
        if (diffDays < 14) return "1 week ago";
        if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
        if (diffDays < 60) return "1 month ago";
        return `${Math.floor(diffDays / 30)} months ago`;
    };

    const getJobId = (app: AppliedJob) =>
        app.id || (app as any).job_id || (app as any)._id;

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
                        <span className="material-symbols-outlined text-[20px]">
                            dashboard
                        </span>
                        <p className="text-sm font-medium">Dashboard</p>
                    </Link>
                    <div className="flex items-center gap-3 px-3 py-2 rounded-lg cursor-pointer transition-colors bg-primary/10 text-primary">
                        <span
                            className="material-symbols-outlined text-[20px]"
                            style={{ fontVariationSettings: "'FILL' 1" }}
                        >
                            work
                        </span>
                        <p className="text-sm font-bold">My Applications</p>
                    </div>
                    <Link
                        to="/saved-jobs"
                        className="flex items-center gap-3 px-3 py-2 rounded-lg cursor-pointer transition-colors hover:bg-[#f0f2f4] dark:hover:bg-[#23303e] text-[#617589] dark:text-[#94a3b8]"
                    >
                        <span className="material-symbols-outlined text-[20px]">
                            bookmark
                        </span>
                        <p className="text-sm font-medium">Saved Jobs</p>
                    </Link>
                </div>

                <div className="mt-auto p-4">
                    <button
                        onClick={() => signOut()}
                        className="flex items-center gap-3 px-3 py-2 rounded-lg cursor-pointer transition-colors hover:bg-red-50 dark:hover:bg-red-500/10 text-[#617589] dark:text-[#94a3b8] hover:text-red-600 w-full"
                    >
                        <span className="material-symbols-outlined text-[20px]">
                            logout
                        </span>
                        <p className="text-sm font-medium">Sign Out</p>
                    </button>
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 flex flex-col min-w-0 overflow-hidden bg-[#f8f9fb] dark:bg-background-dark">
                <div className="flex-1 overflow-y-auto px-8 py-8">
                    <div className="max-w-6xl mx-auto">
                        {/* Page Title */}
                        <div className="mb-8">
                            <h1 className="text-2xl font-bold text-[#111418] dark:text-white">
                                My Applications
                            </h1>
                            <p className="text-sm text-[#617589] dark:text-[#94a3b8] mt-1">
                                Manage your automated job search progress.
                            </p>
                        </div>

                        {/* Stats Cards */}
                        <div className="grid grid-cols-5 gap-4 mb-8">
                            <div className="bg-white dark:bg-[#1a2632] rounded-xl border border-[#e5e7eb] dark:border-[#2a3642] p-5 flex items-center justify-between">
                                <div>
                                    <p className="text-xs font-bold text-[#617589] dark:text-[#94a3b8] uppercase tracking-wider mb-1">
                                        Total Applied
                                    </p>
                                    <p className="text-3xl font-bold text-[#111418] dark:text-white">
                                        {stats.total}
                                    </p>
                                </div>
                                <div className="w-10 h-10 rounded-lg bg-blue-50 dark:bg-blue-500/10 flex items-center justify-center">
                                    <span className="material-symbols-outlined text-blue-600 text-[22px]">
                                        description
                                    </span>
                                </div>
                            </div>
                            <div className="bg-white dark:bg-[#1a2632] rounded-xl border border-[#e5e7eb] dark:border-[#2a3642] p-5 flex items-center justify-between">
                                <div>
                                    <p className="text-xs font-bold text-[#617589] dark:text-[#94a3b8] uppercase tracking-wider mb-1">
                                        Not Applied
                                    </p>
                                    <p className="text-3xl font-bold text-[#111418] dark:text-white">
                                        {stats.notApplied}
                                    </p>
                                </div>
                                <div className="w-10 h-10 rounded-lg bg-amber-50 dark:bg-amber-500/10 flex items-center justify-center">
                                    <span className="material-symbols-outlined text-amber-600 text-[22px]">
                                        emoji_events
                                    </span>
                                </div>
                            </div>
                            <div className="bg-white dark:bg-[#1a2632] rounded-xl border border-[#e5e7eb] dark:border-[#2a3642] p-5 flex items-center justify-between">
                                <div>
                                    <p className="text-xs font-bold text-[#617589] dark:text-[#94a3b8] uppercase tracking-wider mb-1">
                                        Interviews
                                    </p>
                                    <p className="text-3xl font-bold text-[#111418] dark:text-white">
                                        {stats.interview}
                                    </p>
                                </div>
                                <div className="w-10 h-10 rounded-lg bg-indigo-50 dark:bg-indigo-500/10 flex items-center justify-center">
                                    <span className="material-symbols-outlined text-indigo-600 text-[22px]">
                                        chat
                                    </span>
                                </div>
                            </div>
                            <div className="bg-white dark:bg-[#1a2632] rounded-xl border border-[#e5e7eb] dark:border-[#2a3642] p-5 flex items-center justify-between">
                                <div>
                                    <p className="text-xs font-bold text-[#617589] dark:text-[#94a3b8] uppercase tracking-wider mb-1">
                                        Offers
                                    </p>
                                    <p className="text-3xl font-bold text-[#111418] dark:text-white">
                                        {stats.offers}
                                    </p>
                                </div>
                                <div className="w-10 h-10 rounded-lg bg-emerald-50 dark:bg-emerald-500/10 flex items-center justify-center">
                                    <span className="material-symbols-outlined text-emerald-600 text-[22px]">
                                        celebration
                                    </span>
                                </div>
                            </div>
                            <div className="bg-white dark:bg-[#1a2632] rounded-xl border border-[#e5e7eb] dark:border-[#2a3642] p-5 flex items-center justify-between">
                                <div>
                                    <p className="text-xs font-bold text-[#617589] dark:text-[#94a3b8] uppercase tracking-wider mb-1">
                                        Rejected
                                    </p>
                                    <p className="text-3xl font-bold text-[#111418] dark:text-white">
                                        {stats.rejected}
                                    </p>
                                </div>
                                <div className="w-10 h-10 rounded-lg bg-red-50 dark:bg-red-500/10 flex items-center justify-center">
                                    <span className="material-symbols-outlined text-red-500 text-[22px]">
                                        cancel
                                    </span>
                                </div>
                            </div>
                        </div>

                        {/* Applications Table */}
                        <div className="bg-white dark:bg-[#1a2632] rounded-xl border border-[#e5e7eb] dark:border-[#2a3642] overflow-hidden">
                            {/* Table Header */}
                            <div className="grid grid-cols-[2fr_1fr_1fr_80px] gap-4 px-6 py-4 border-b border-[#e5e7eb] dark:border-[#2a3642]">
                                <span className="text-xs font-bold text-[#617589] dark:text-[#94a3b8] uppercase tracking-wider">
                                    Company & Role
                                </span>
                                <span className="text-xs font-bold text-[#617589] dark:text-[#94a3b8] uppercase tracking-wider">
                                    Date Applied
                                </span>
                                <span className="text-xs font-bold text-[#617589] dark:text-[#94a3b8] uppercase tracking-wider">
                                    Status
                                </span>
                                <span className="text-xs font-bold text-[#617589] dark:text-[#94a3b8] uppercase tracking-wider text-right">
                                    Action
                                </span>
                            </div>

                            {/* Table Body */}
                            {isLoading ? (
                                <div className="flex items-center justify-center py-16">
                                    <span className="material-symbols-outlined animate-spin text-primary text-3xl">
                                        refresh
                                    </span>
                                </div>
                            ) : paginatedApps.length === 0 ? (
                                <div className="text-center py-16">
                                    <span className="material-symbols-outlined text-[48px] text-[#d1d5db] dark:text-[#374151] mb-3 block">
                                        work_off
                                    </span>
                                    <p className="text-[#617589] dark:text-[#94a3b8] text-sm">
                                        No applications yet. Apply to jobs from the Dashboard!
                                    </p>
                                </div>
                            ) : (
                                paginatedApps.map((app) => {
                                    const jobId = getJobId(app);
                                    return (
                                        <div
                                            key={jobId}
                                            className="grid grid-cols-[2fr_1fr_1fr_80px] gap-4 items-center px-6 py-5 border-b border-[#f0f2f4] dark:border-[#2a3642] last:border-b-0 hover:bg-[#f8f9fb] dark:hover:bg-[#1e2d3d] transition-colors"
                                        >
                                            {/* Company & Role */}
                                            <div className="flex items-center gap-4 min-w-0">
                                                {app.company_logo || app.companyLogo ? (
                                                    <img
                                                        src={app.company_logo || app.companyLogo}
                                                        alt={`${app.company} logo`}
                                                        className="w-11 h-11 rounded-lg border border-gray-100 dark:border-gray-700 bg-white object-contain p-1 shrink-0"
                                                        onError={(e) => {
                                                            const target = e.currentTarget;
                                                            target.style.display = "none";
                                                            if (target.nextElementSibling)
                                                                (
                                                                    target.nextElementSibling as HTMLElement
                                                                ).style.display = "flex";
                                                        }}
                                                    />
                                                ) : null}
                                                <div
                                                    className={`w-11 h-11 rounded-lg border border-gray-100 dark:border-gray-700 bg-gradient-to-br from-primary/20 to-primary/5 dark:from-primary/30 dark:to-primary/10 items-center justify-center shrink-0 ${app.company_logo || app.companyLogo
                                                        ? "hidden"
                                                        : "flex"
                                                        }`}
                                                >
                                                    <span className="text-base font-bold text-primary">
                                                        {app.company?.charAt(0)?.toUpperCase() || "?"}
                                                    </span>
                                                </div>
                                                <div className="min-w-0">
                                                    <p className="text-sm font-bold text-[#111418] dark:text-white truncate">
                                                        {app.title}
                                                    </p>
                                                    <p className="text-xs text-[#617589] dark:text-[#94a3b8] truncate">
                                                        {app.company} • {app.location}
                                                    </p>
                                                </div>
                                            </div>

                                            {/* Date Applied */}
                                            <div>
                                                <p className="text-sm text-[#111418] dark:text-white">
                                                    {formatDate(app.applied_at)}
                                                </p>
                                                <p className="text-xs text-[#617589] dark:text-[#94a3b8]">
                                                    {timeAgo(app.applied_at)}
                                                </p>
                                            </div>

                                            {/* Status */}
                                            <div className="relative" ref={openStatusId === jobId ? statusRef : undefined}>
                                                <button
                                                    onClick={() =>
                                                        setOpenStatusId(
                                                            openStatusId === jobId ? null : jobId
                                                        )
                                                    }
                                                    className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold border cursor-pointer transition-all hover:shadow-sm ${STATUS_STYLES[app.status]
                                                        }`}
                                                >
                                                    <span
                                                        className={`w-2 h-2 rounded-full ${STATUS_DOT[app.status]
                                                            }`}
                                                    ></span>
                                                    {app.status}
                                                    <span className="material-symbols-outlined text-[14px] ml-0.5 opacity-60">
                                                        expand_more
                                                    </span>
                                                </button>

                                                {openStatusId === jobId && (
                                                    <div className="absolute top-full left-0 mt-1 z-50 bg-white dark:bg-[#1a2632] rounded-lg shadow-lg border border-[#e5e7eb] dark:border-[#2a3642] py-1 min-w-[160px] animate-in fade-in slide-in-from-top-1 duration-150">
                                                        {STATUS_OPTIONS.map((opt) => (
                                                            <button
                                                                key={opt}
                                                                onClick={() =>
                                                                    handleStatusChange(jobId, opt)
                                                                }
                                                                className={`w-full flex items-center gap-2 px-3 py-2 text-xs font-medium text-left hover:bg-[#f0f2f4] dark:hover:bg-[#23303e] transition-colors ${app.status === opt
                                                                    ? "text-primary bg-primary/5"
                                                                    : "text-[#111418] dark:text-white"
                                                                    }`}
                                                            >
                                                                <span
                                                                    className={`w-2 h-2 rounded-full ${STATUS_DOT[opt]}`}
                                                                ></span>
                                                                {opt}
                                                                {app.status === opt && (
                                                                    <span className="material-symbols-outlined text-[14px] ml-auto text-primary">
                                                                        check
                                                                    </span>
                                                                )}
                                                            </button>
                                                        ))}
                                                    </div>
                                                )}
                                            </div>

                                            {/* Action */}
                                            <div className="relative flex justify-end" ref={openActionId === jobId ? actionRef : undefined}>
                                                <button
                                                    onClick={() =>
                                                        setOpenActionId(
                                                            openActionId === jobId ? null : jobId
                                                        )
                                                    }
                                                    className="p-1.5 rounded-lg hover:bg-[#f0f2f4] dark:hover:bg-[#23303e] transition-colors text-[#617589]"
                                                >
                                                    <span className="material-symbols-outlined text-[20px]">
                                                        more_vert
                                                    </span>
                                                </button>

                                                {openActionId === jobId && (
                                                    <div className="absolute top-full right-0 mt-1 z-50 bg-white dark:bg-[#1a2632] rounded-lg shadow-lg border border-[#e5e7eb] dark:border-[#2a3642] py-1 min-w-[120px] animate-in fade-in slide-in-from-top-1 duration-150">
                                                        <button
                                                            onClick={() => handleRemove(jobId)}
                                                            className="w-full flex items-center gap-2 px-3 py-2 text-xs font-medium text-red-600 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors"
                                                        >
                                                            <span className="material-symbols-outlined text-[16px]">
                                                                delete
                                                            </span>
                                                            Remove
                                                        </button>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    );
                                })
                            )}

                            {/* Pagination */}
                            {applications.length > 0 && (
                                <div className="flex items-center justify-between px-6 py-4 border-t border-[#e5e7eb] dark:border-[#2a3642]">
                                    <p className="text-xs text-[#617589] dark:text-[#94a3b8]">
                                        Showing{" "}
                                        <span className="font-bold text-[#111418] dark:text-white">
                                            {(currentPage - 1) * ITEMS_PER_PAGE + 1}
                                        </span>{" "}
                                        to{" "}
                                        <span className="font-bold text-[#111418] dark:text-white">
                                            {Math.min(
                                                currentPage * ITEMS_PER_PAGE,
                                                applications.length
                                            )}
                                        </span>{" "}
                                        of{" "}
                                        <span className="font-bold text-primary">
                                            {applications.length}
                                        </span>{" "}
                                        results
                                    </p>
                                    <div className="flex items-center gap-2">
                                        <button
                                            onClick={() =>
                                                setCurrentPage((p) => Math.max(1, p - 1))
                                            }
                                            disabled={currentPage === 1}
                                            className="px-4 py-1.5 text-xs font-medium rounded-lg border border-[#e5e7eb] dark:border-[#2a3642] text-[#617589] dark:text-[#94a3b8] hover:bg-[#f0f2f4] dark:hover:bg-[#23303e] transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                                        >
                                            Previous
                                        </button>
                                        <button
                                            onClick={() =>
                                                setCurrentPage((p) =>
                                                    Math.min(totalPages, p + 1)
                                                )
                                            }
                                            disabled={currentPage >= totalPages}
                                            className="px-4 py-1.5 text-xs font-medium rounded-lg border border-[#e5e7eb] dark:border-[#2a3642] text-[#111418] dark:text-white hover:bg-[#f0f2f4] dark:hover:bg-[#23303e] transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                                        >
                                            Next
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
};

export default MyApplications;
