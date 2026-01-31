

# Simplify.jobs - AI-Powered Job Application Platform

## Overview
A full-featured job search platform that uses AI to match users with relevant job opportunities based on their resume, skills, experience, and preferences. The platform features a professional blue color scheme with hand-drawn doodle illustrations for a human touch.

---

## Pages & Features

### 1. Landing Page
- **Hero section** with catchy headline and call-to-action buttons
- **How it works** section explaining the 3-step process (Upload Resume → Set Preferences → Get Matched Jobs)
- **Features overview** highlighting AI-powered matching, real job listings, and easy apply
- **Hand-drawn doodle illustrations** throughout - depicting job hunting themes (briefcases, handshakes, checkmarks, documents, people working)
- **Testimonials section** with user feedback
- **Footer** with links and contact info

### 2. Authentication Page
- **Email/password login and signup**
- **Google OAuth integration** for quick sign-in
- Clean, centered card design matching the professional blue theme

### 3. Dashboard (Job Listings)
- **Job cards** displaying:
  - Job title and company name
  - Location (remote/onsite indicator)
  - Salary range (when available)
  - Brief job description
  - "Apply" button linking to original job posting
  - "Save" button to bookmark jobs
- **Filters sidebar** for job type, location, salary range, date posted
- **Search bar** for keyword search
- **AI match score** showing how well each job matches the user's profile
- **Pagination** for browsing results

### 4. User Profile Page
- **Resume upload** section with drag-and-drop (stored in Supabase Storage)
- **AI-parsed resume display** showing extracted skills and experience
- **Manual skills entry** - add/remove skills tags
- **Experience section** - job history and education
- **Job preferences**:
  - Preferred locations
  - Salary expectations
  - Job types (full-time, part-time, contract)
  - Remote work preference
  - Industries of interest
- **Saved jobs list** with quick access to bookmarked positions
- **Profile settings** - name, email, avatar

---

## Backend Requirements

### Database (Supabase)
- **Users table** - extended profile information
- **Resumes table** - parsed resume data, original file reference
- **Skills table** - user skills with proficiency levels
- **Preferences table** - job search preferences
- **Saved jobs table** - bookmarked positions

### Edge Functions
- **Job search function** - integrates with Firecrawl to find jobs across the web based on user preferences
- **Resume parsing function** - uses Lovable AI to extract skills, experience, and qualifications from uploaded resumes
- **Job matching function** - AI-powered matching score calculation

### Authentication
- Email/password signup & login
- Google OAuth provider
- Protected routes for dashboard and profile

### Storage
- Resume file uploads (PDF, DOCX)
- User avatars

---

## Design System
- **Primary colors**: Professional blue palette (navy headers, sky blue accents)
- **Typography**: Clean, modern sans-serif fonts
- **Doodle illustrations**: Hand-drawn style SVG illustrations scattered throughout the landing page
- **Cards**: White backgrounds with subtle shadows
- **Buttons**: Rounded, blue primary actions with hover states

---

## Technical Stack
- **Frontend**: React + TypeScript + Tailwind CSS
- **Backend**: Lovable Cloud (Supabase)
- **Authentication**: Supabase Auth (Email + Google)
- **AI**: Lovable AI for resume parsing and job matching
- **Web Scraping**: Firecrawl for real job listings
- **Storage**: Supabase Storage for resumes

