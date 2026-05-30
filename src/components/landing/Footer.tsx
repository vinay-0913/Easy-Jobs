import { Link } from "react-router-dom";

const Footer = () => {
  return (
    <footer className="bg-white py-8 border-t border-gray-200">
      <div className="max-w-[1280px] mx-auto px-4 md:px-6">
        {/* Footer Grid */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6 mb-8">
          {/* Brand */}
          <div className="md:col-span-6 flex flex-col gap-2">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-[#137fec] text-3xl">
                business_center
              </span>
              <div className="font-hanken text-xl font-bold text-gray-900">
                Easy <span className="text-[#137fec]">Jobs</span>
              </div>
            </div>
            <p className="font-hanken text-base text-gray-500 max-w-sm leading-relaxed">
              A centralized job search and matching platform that helps you find
              your dream job. Upload your resume, set your preferences, and find
              the best jobs.
            </p>
          </div>

          {/* Product Links */}
          <div className="md:col-span-3 flex flex-col gap-2">
            <h4 className="font-hanken text-sm font-bold text-gray-900">
              Product
            </h4>
            <ul className="flex flex-col gap-1">
              <li>
                <a
                  href="#how-it-works"
                  className="font-hanken text-base text-gray-500 hover:text-[#137fec] transition-colors"
                >
                  How It Works
                </a>
              </li>
              <li>
                <a
                  href="#features"
                  className="font-hanken text-base text-gray-500 hover:text-[#137fec] transition-colors"
                >
                  Features
                </a>
              </li>
              <li>
                <Link
                  to="/dashboard"
                  className="font-hanken text-base text-gray-500 hover:text-[#137fec] transition-colors"
                >
                  Job Board
                </Link>
              </li>
            </ul>
          </div>

          {/* Company Links */}
          <div className="md:col-span-3 flex flex-col gap-2">
            <h4 className="font-hanken text-sm font-bold text-gray-900">
              Company
            </h4>
            <ul className="flex flex-col gap-1">
              <li>
                <a
                  href="#"
                  className="font-hanken text-base text-gray-500 hover:text-[#137fec] transition-colors"
                >
                  About Us
                </a>
              </li>
              <li>
                <a
                  href="#"
                  className="font-hanken text-base text-gray-500 hover:text-[#137fec] transition-colors"
                >
                  Privacy Policy
                </a>
              </li>
              <li>
                <a
                  href="#"
                  className="font-hanken text-base text-gray-500 hover:text-[#137fec] transition-colors"
                >
                  Terms of Service
                </a>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="border-t border-gray-200 pt-4 flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="font-hanken text-base text-gray-500">
            © {new Date().getFullYear()} Easy Jobs. All rights reserved.
          </div>
          <div className="flex items-center gap-4">
            {/* X/Twitter */}
            <a
              href="#"
              className="text-gray-500 hover:text-[#137fec] transition-colors"
            >
              <svg
                className="w-6 h-6 fill-current"
                viewBox="0 0 24 24"
                aria-hidden="true"
              >
                <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
              </svg>
            </a>
            {/* LinkedIn */}
            <a
              href="#"
              className="text-gray-500 hover:text-[#137fec] transition-colors"
            >
              <svg
                className="w-6 h-6 fill-current"
                viewBox="0 0 24 24"
                aria-hidden="true"
              >
                <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.454C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
              </svg>
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
