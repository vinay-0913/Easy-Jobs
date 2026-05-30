import { Link } from "react-router-dom";

interface AuthGateModalProps {
  open: boolean;
  onClose: () => void;
}

const AuthGateModal = ({ open, onClose }: AuthGateModalProps) => {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative bg-white dark:bg-[#1a2632] rounded-2xl shadow-2xl border border-gray-200 dark:border-[#2a3642] max-w-md w-full mx-4 overflow-hidden animate-fade-in">
        {/* Top accent bar */}
        <div className="h-1.5 bg-gradient-to-r from-[#137fec] via-[#0056d2] to-[#137fec]" />

        <div className="p-8 text-center">
          {/* Icon */}
          <div className="w-16 h-16 mx-auto mb-5 rounded-2xl bg-[#137fec]/10 flex items-center justify-center">
            <span className="material-symbols-outlined text-[#137fec] text-3xl">
              lock_open
            </span>
          </div>

          {/* Heading */}
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
            Sign in to see more jobs
          </h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-6 max-w-sm mx-auto leading-relaxed">
            Create a free account to browse job listings, save your
            favorites, and track your applications.
          </p>

          {/* CTAs */}
          <div className="flex flex-col gap-3">
            <Link
              to="/auth?mode=signup"
              className="w-full inline-flex items-center justify-center gap-2 px-6 py-3 bg-[#137fec] hover:bg-[#0f66be] text-white text-sm font-bold rounded-lg transition-colors shadow-lg shadow-blue-500/20"
            >
              <span className="material-symbols-outlined text-[18px]">
                person_add
              </span>
              Create Free Account
            </Link>
            <Link
              to="/auth"
              className="w-full inline-flex items-center justify-center gap-2 px-6 py-3 bg-white hover:bg-gray-50 dark:bg-[#23303e] dark:hover:bg-[#2a3642] text-[#137fec] text-sm font-bold rounded-lg transition-colors border border-[#137fec]"
            >
              <span className="material-symbols-outlined text-[18px]">
                login
              </span>
              Sign In
            </Link>
          </div>

          {/* Dismiss */}
          <button
            onClick={onClose}
            className="mt-4 text-xs text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
          >
            Maybe later
          </button>
        </div>

      </div>
    </div>
  );
};

export default AuthGateModal;
