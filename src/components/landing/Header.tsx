import { Link } from "react-router-dom";
import { BriefcaseDoodle } from "@/components/doodles";

const Header = () => {
  return (
    <nav className="bg-white fixed top-0 w-full z-50 border-b border-gray-200 shadow-sm">
      <div className="flex justify-between items-center h-20 px-4 md:px-6 max-w-[1280px] mx-auto">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-2 font-hanken text-2xl font-bold text-[#137fec]">
          <BriefcaseDoodle className="h-8 w-8 text-[#137fec]" />
          <span>Easy Jobs</span>
        </Link>

        {/* Nav Links */}
        <div className="hidden md:flex gap-6 items-center">
          <Link
            to="/dashboard"
            className="text-[#137fec] border-b-2 border-[#137fec] pb-1 text-sm font-semibold hover:opacity-80 transition-opacity"
          >
            Find Jobs
          </Link>
          <a
            href="#how-it-works"
            className="text-[#4d5f7b] text-sm font-semibold hover:text-[#137fec] transition-colors"
          >
            How it works
          </a>
        </div>

        {/* Auth Buttons */}
        <div className="flex items-center gap-4">
          <Link
            to="/auth"
            className="hidden md:inline-block text-sm font-semibold text-[#137fec] bg-white border border-[#137fec] px-4 py-2 rounded hover:bg-gray-50 transition-colors"
          >
            Sign In
          </Link>
          <Link
            to="/auth?mode=signup"
            className="text-sm font-semibold text-white bg-[#137fec] px-4 py-2 rounded hover:bg-[#0f66be] transition-colors"
          >
            Sign Up
          </Link>
        </div>
      </div>
    </nav>
  );
};

export default Header;
