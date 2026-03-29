const express = require('express');
const router = express.Router();
const { getAuth } = require('@clerk/express');
const Profile = require('../models/Profile');

// JSearch API configuration
const JSEARCH_API_HOST = 'jsearch.p.rapidapi.com';
const JSEARCH_API_KEY = process.env.JSEARCH_API_KEY;

// Search for jobs using JSearch API - Returns structured job data with full descriptions, skills, and salary
router.get('/search', async (req, res) => {
    try {
        const { query, location = 'India', remote, jobType, experience, limit = 20, page = 1 } = req.query;

        if (!query) {
            return res.status(400).json({
                success: false,
                error: 'Search query is required'
            });
        }

        console.log(`Searching for jobs: "${query}", location: ${location}, experience: ${experience || 'any'}`);

        // Build JSearch query
        let searchQuery = `${query} in ${location}`;
        if (remote === 'true') {
            searchQuery += ' remote';
        }

        console.log('JSearch query:', searchQuery);

        // Try to get user profile for personalized match scoring
        let userProfile = null;
        try {
            const auth = getAuth(req);
            if (auth && auth.userId) {
                const profile = await Profile.findOne({ clerkUserId: auth.userId });
                if (profile) {
                    userProfile = {
                        skills: (profile.skills || []).map(s => s.skill),
                        preferences: profile.preferences || {},
                        location: profile.location || '',
                        role: profile.role || '',
                    };
                    console.log('User profile loaded for match scoring:', {
                        skills: userProfile.skills.length,
                        hasPrefs: !!userProfile.preferences,
                    });
                }
            }
        } catch (authErr) {
            // No auth token or invalid — that's fine, use fallback scoring
            console.log('No auth for match scoring, using data-richness scores');
        }

        // Call JSearch API
        const { jobs, rawCount } = await searchJSearchAPI(searchQuery, parseInt(limit), remote, jobType, experience, parseInt(page), userProfile);

        console.log(`JSearch returned ${jobs.length} jobs (${rawCount} raw)`);

        // Remove duplicates by title
        const uniqueJobs = [];
        const seenTitles = new Set();
        for (const job of jobs) {
            const key = job.title.toLowerCase();
            if (!seenTitles.has(key)) {
                seenTitles.add(key);
                uniqueJobs.push(job);
            }
        }

        // Limit to requested count
        const limitedJobs = uniqueJobs.slice(0, parseInt(limit));
        console.log(`Returning ${limitedJobs.length} unique jobs`);

        // hasMore = JSearch returned enough raw results to suggest more pages exist
        const hasMore = rawCount >= parseInt(limit) * 0.8;

        res.json({
            success: true,
            data: limitedJobs,
            count: limitedJobs.length,
            hasMore
        });

    } catch (error) {
        console.error('Job search error:', error);
        res.status(500).json({
            success: false,
            error: error.message || 'Failed to search for jobs',
            details: error.response?.data || error.stack?.split('\n')[0] || undefined
        });
    }
});

// Call JSearch API and return mapped job objects
async function searchJSearchAPI(query, limit = 20, remote, jobType, experience, page = 1, userProfile = null) {
    const numPages = Math.ceil(limit / 10);
    const startPage = (page - 1) * numPages + 1;
    const params = new URLSearchParams({
        query: query,
        page: startPage.toString(),
        num_pages: numPages.toString(),
        date_posted: 'month'
    });

    // Add remote filter
    if (remote === 'true') {
        params.append('remote_jobs_only', 'true');
    }

    // Add job type filter
    if (jobType) {
        const typeMap = {
            'Full-time': 'FULLTIME',
            'Part-time': 'PARTTIME',
            'Contract': 'CONTRACTOR',
            'Internship': 'INTERN'
        };
        if (typeMap[jobType]) {
            params.append('employment_types', typeMap[jobType]);
        }
    }

    // Add experience / job requirements filter
    if (experience) {
        const expMap = {
            '0-1 Years': 'no_experience',
            '2-5 Years': 'under_3_years_experience',
            '5+ Years': 'more_than_3_years_experience'
        };
        if (expMap[experience]) {
            params.append('job_requirements', expMap[experience]);
        }
    }

    const url = `https://${JSEARCH_API_HOST}/search?${params.toString()}`;
    console.log('JSearch API URL:', url);

    const response = await fetch(url, {
        method: 'GET',
        headers: {
            'X-RapidAPI-Key': JSEARCH_API_KEY,
            'X-RapidAPI-Host': JSEARCH_API_HOST
        }
    });

    if (!response.ok) {
        const errorText = await response.text();
        console.error('JSearch API error:', response.status, errorText);
        throw new Error(`JSearch API error: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    const results = data.data || [];
    console.log(`JSearch returned ${results.length} raw results`);

    return {
        jobs: results.map((job, index) => mapJSearchJob(job, index, userProfile)),
        rawCount: results.length
    };
}

// Map JSearch API response to our job object format
function mapJSearchJob(job, index, userProfile = null) {
    // Format salary
    let salary = 'Salary not disclosed';
    if (job.job_min_salary && job.job_max_salary) {
        const currency = job.job_salary_currency === 'INR' ? '₹' :
            job.job_salary_currency === 'USD' ? '$' :
                job.job_salary_currency || '₹';
        const period = job.job_salary_period === 'YEAR' ? '/year' :
            job.job_salary_period === 'MONTH' ? '/month' :
                job.job_salary_period === 'HOUR' ? '/hour' : '';
        salary = `${currency}${formatSalaryNumber(job.job_min_salary)} - ${currency}${formatSalaryNumber(job.job_max_salary)}${period}`;
    } else if (job.job_min_salary) {
        const currency = job.job_salary_currency === 'INR' ? '₹' : job.job_salary_currency === 'USD' ? '$' : '₹';
        salary = `${currency}${formatSalaryNumber(job.job_min_salary)}+`;
    }

    // Extract experience level from job_required_experience
    let experienceLevel = null;
    const expInfo = job.job_required_experience;
    if (expInfo) {
        if (expInfo.no_experience_required) {
            experienceLevel = 'Fresher';
        } else if (expInfo.required_experience_in_months) {
            const years = Math.round(expInfo.required_experience_in_months / 12);
            if (years <= 1) experienceLevel = '0-1 Years';
            else if (years <= 3) experienceLevel = '1-3 Years';
            else if (years <= 5) experienceLevel = '3-5 Years';
            else if (years <= 10) experienceLevel = '5-10 Years';
            else experienceLevel = '10+ Years';
        }
    }
    // Fallback: try to infer from title
    if (!experienceLevel) {
        const titleLower = (job.job_title || '').toLowerCase();
        if (titleLower.includes('intern') || titleLower.includes('fresher') || titleLower.includes('trainee')) {
            experienceLevel = 'Fresher';
        } else if (titleLower.includes('junior') || titleLower.includes('jr.') || titleLower.includes('associate')) {
            experienceLevel = '0-1 Years';
        } else if (titleLower.includes('senior') || titleLower.includes('sr.') || titleLower.includes('lead')) {
            experienceLevel = '5-10 Years';
        } else if (titleLower.includes('staff') || titleLower.includes('principal') || titleLower.includes('architect')) {
            experienceLevel = '10+ Years';
        }
    }

    // Extract ALL required skills from JSearch
    let requiredSkills = [];
    if (job.job_required_skills && Array.isArray(job.job_required_skills) && job.job_required_skills.length > 0) {
        requiredSkills = job.job_required_skills;
    }

    // Extract skills for matching (top 5 for cards)
    let skills = [];
    if (requiredSkills.length > 0) {
        skills = requiredSkills.slice(0, 5);
    } else {
        // Try to extract from highlights qualifications
        const qualifications = job.job_highlights?.Qualifications || [];
        skills = extractSkillsFromHighlights(qualifications);
    }

    // If still no skills, extract from title + description
    if (skills.length === 0) {
        skills = extractSkills((job.job_title || '') + ' ' + (job.job_description || '').substring(0, 500));
    }

    // Extract job highlights
    const highlights = {};
    if (job.job_highlights) {
        if (job.job_highlights.Qualifications && job.job_highlights.Qualifications.length > 0) {
            highlights.Qualifications = job.job_highlights.Qualifications.map(q => stripHtml(q));
        }
        if (job.job_highlights.Responsibilities && job.job_highlights.Responsibilities.length > 0) {
            highlights.Responsibilities = job.job_highlights.Responsibilities.map(r => stripHtml(r));
        }
        if (job.job_highlights.Benefits && job.job_highlights.Benefits.length > 0) {
            highlights.Benefits = job.job_highlights.Benefits.map(b => stripHtml(b));
        }
    }

    // Format location
    let location = [job.job_city, job.job_state, job.job_country]
        .filter(Boolean)
        .join(', ') || 'Location not specified';

    // Format job type
    const jobTypeMap = {
        'FULLTIME': 'Full-time',
        'PARTTIME': 'Part-time',
        'CONTRACTOR': 'Contract',
        'INTERN': 'Internship',
        'TEMPORARY': 'Contract'
    };
    const jobType = jobTypeMap[job.job_employment_type] || 'Full-time';

    // Format posted date
    let postedDate = 'Recently posted';
    if (job.job_posted_at_datetime_utc) {
        const posted = new Date(job.job_posted_at_datetime_utc);
        const now = new Date();
        const diffDays = Math.floor((now - posted) / (1000 * 60 * 60 * 24));
        if (diffDays === 0) postedDate = 'Posted today';
        else if (diffDays === 1) postedDate = 'Posted yesterday';
        else if (diffDays < 7) postedDate = `Posted ${diffDays} days ago`;
        else if (diffDays < 30) postedDate = `Posted ${Math.floor(diffDays / 7)} weeks ago`;
        else postedDate = `Posted ${Math.floor(diffDays / 30)} months ago`;
    }

    // Clean and format description - get first meaningful sentence
    const description = cleanJobDescription(
        job.job_description || '',
        job.job_title || '',
        job.employer_name || ''
    );

    // Full description for the detail panel — structured markdown
    // Try raw description first, then fall back to job_highlights
    let fullDescription = '';
    if (job.job_description && job.job_description.trim().length > 30) {
        fullDescription = formatFullDescription(job.job_description, job.job_title || '', job.employer_name || '');
    }

    // If description is still short, try to build from job_highlights
    if (fullDescription.length < 50 && job.job_highlights) {
        const sections = [];
        if (job.job_highlights.Qualifications && job.job_highlights.Qualifications.length > 0) {
            sections.push('## Qualifications\n\n' + job.job_highlights.Qualifications.map(q => `- ${stripHtml(q)}`).join('\n'));
        }
        if (job.job_highlights.Responsibilities && job.job_highlights.Responsibilities.length > 0) {
            sections.push('## Responsibilities\n\n' + job.job_highlights.Responsibilities.map(r => `- ${stripHtml(r)}`).join('\n'));
        }
        if (job.job_highlights.Benefits && job.job_highlights.Benefits.length > 0) {
            sections.push('## Benefits\n\n' + job.job_highlights.Benefits.map(b => `- ${stripHtml(b)}`).join('\n'));
        }
        if (sections.length > 0) {
            fullDescription = sections.join('\n\n');
        }
    }

    // Final fallback
    if (!fullDescription || fullDescription.length < 20) {
        fullDescription = '';
    }

    return {
        id: job.job_id || `jsearch_${Date.now()}_${index}`,
        title: stripHtml(job.job_title || 'Job Position'),
        company: stripHtml(job.employer_name || 'Company'),
        location: location,
        remote: job.job_is_remote || false,
        salary: salary,
        description: description,
        fullDescription: fullDescription,
        matchScore: calculateMatchScore(job, skills, jobType, location, userProfile),
        postedDate: postedDate,
        jobType: jobType,
        experienceLevel: experienceLevel,
        applyUrl: job.job_apply_link || '#',
        skills: skills,
        requiredSkills: requiredSkills,
        highlights: Object.keys(highlights).length > 0 ? highlights : null,
        companyLogo: job.employer_logo || null,
        source: job.job_publisher || 'JSearch'
    };
}

// Format salary numbers with commas (Indian format for INR)
function formatSalaryNumber(num) {
    if (!num) return '0';
    return Number(num).toLocaleString('en-IN');
}

// Weighted multi-factor match score (profile-aware) or fallback data-richness score
function calculateMatchScore(rawJob, jobSkills, jobType, jobLocation, userProfile) {
    // No profile data — return -1 so frontend hides the match score
    if (!userProfile || (!userProfile.skills.length && !userProfile.preferences)) {
        return -1;
    }

    const prefs = userProfile.preferences || {};

    // --- SKILLS (40%) ---
    let skillsScore = 50; // Default if no job skills listed
    const userSkills = (userProfile.skills || []).map(s => s.toLowerCase().trim());
    const requiredSkills = (rawJob.job_required_skills || jobSkills || []).map(s => s.toLowerCase().trim());
    if (requiredSkills.length > 0 && userSkills.length > 0) {
        const matched = requiredSkills.filter(rs => userSkills.some(us => us.includes(rs) || rs.includes(us))).length;
        skillsScore = Math.round((matched / requiredSkills.length) * 100);
    } else if (userSkills.length > 0) {
        // Check title/description for skill keywords
        const textToSearch = ((rawJob.job_title || '') + ' ' + (rawJob.job_description || '').substring(0, 1000)).toLowerCase();
        const found = userSkills.filter(s => textToSearch.includes(s)).length;
        skillsScore = Math.min(80, Math.round((found / Math.max(userSkills.length, 1)) * 100));
    }

    // --- LOCATION (15%) ---
    let locationScore = 50; // Default neutral
    const prefLocations = (prefs.preferred_locations || []).map(l => l.toLowerCase().trim());
    if (prefLocations.length > 0 && jobLocation) {
        const jobLoc = jobLocation.toLowerCase();
        if (prefLocations.some(l => jobLoc.includes(l) || l.includes(jobLoc.split(',')[0].trim()))) {
            locationScore = 100;
        } else if (prefLocations.some(l => jobLoc.includes(l.split(' ')[0]))) {
            locationScore = 50;
        } else {
            locationScore = 20;
        }
    }

    // --- EXPERIENCE (15%) ---
    let experienceScore = 50;
    if (prefs.experience_level) {
        const expRanges = { 'fresher': [0, 1], '1-3': [1, 3], '3-5': [3, 5], '5-10': [5, 10], '10+': [10, 30] };
        const userRange = expRanges[prefs.experience_level] || [0, 30];
        // Try to parse experience from job
        const jobDesc = (rawJob.job_title || '') + ' ' + (rawJob.job_description || '').substring(0, 500);
        const expMatch = jobDesc.match(/(\d+)\s*[-–+]\s*(\d+)?\s*(?:years?|yrs?)/i);
        if (expMatch) {
            const jobMin = parseInt(expMatch[1]);
            const jobMax = expMatch[2] ? parseInt(expMatch[2]) : jobMin + 2;
            // Check overlap
            if (userRange[0] <= jobMax && userRange[1] >= jobMin) {
                experienceScore = 100;
            } else if (Math.abs(userRange[0] - jobMin) <= 2) {
                experienceScore = 60;
            } else {
                experienceScore = 20;
            }
        }
    }

    // --- JOB TYPE (10%) ---
    let jobTypeScore = 50;
    const prefJobTypes = (prefs.job_types || []).map(t => t.toLowerCase().trim());
    if (prefJobTypes.length > 0 && jobType) {
        jobTypeScore = prefJobTypes.includes(jobType.toLowerCase()) ? 100 : 20;
    }

    // --- SALARY (10%) ---
    let salaryScore = 50;
    if (prefs.salary_min !== undefined || prefs.salary_max !== undefined) {
        if (rawJob.job_min_salary && rawJob.job_max_salary) {
            const userMin = prefs.salary_min || 0;
            const userMax = prefs.salary_max || Infinity;
            const jobMin = rawJob.job_min_salary;
            const jobMax = rawJob.job_max_salary;
            // Full overlap
            if (jobMin >= userMin && jobMax <= userMax) salaryScore = 100;
            // Partial overlap
            else if (jobMin <= userMax && jobMax >= userMin) salaryScore = 70;
            // No overlap
            else salaryScore = 15;
        }
        // No salary data on job = neutral
    }

    // --- REMOTE (10%) ---
    let remoteScore = 50;
    if (prefs.remote_preference && prefs.remote_preference !== 'any') {
        const isRemote = rawJob.job_is_remote || false;
        if (prefs.remote_preference === 'remote') {
            remoteScore = isRemote ? 100 : 10;
        } else if (prefs.remote_preference === 'onsite') {
            remoteScore = isRemote ? 10 : 100;
        } else if (prefs.remote_preference === 'hybrid') {
            remoteScore = isRemote ? 60 : 70;
        }
    }

    // Weighted combination
    const finalScore = Math.round(
        skillsScore * 0.40 +
        locationScore * 0.15 +
        experienceScore * 0.15 +
        jobTypeScore * 0.10 +
        salaryScore * 0.10 +
        remoteScore * 0.10
    );

    return Math.min(99, Math.max(30, finalScore));
}

// Extract skills from job highlights qualifications
function extractSkillsFromHighlights(qualifications) {
    if (!qualifications || qualifications.length === 0) return [];

    const text = qualifications.join(' ');
    return extractSkills(text);
}

// Strip HTML tags and decode entities from any text
function stripHtml(text) {
    if (!text) return '';
    let cleaned = text;
    // Decode HTML entities first
    cleaned = cleaned.replace(/&amp;/g, '&');
    cleaned = cleaned.replace(/&lt;/g, '<');
    cleaned = cleaned.replace(/&gt;/g, '>');
    cleaned = cleaned.replace(/&quot;/g, '"');
    cleaned = cleaned.replace(/&#0?39;/g, "'");
    cleaned = cleaned.replace(/&nbsp;/g, ' ');
    cleaned = cleaned.replace(/&#x27;/g, "'");
    cleaned = cleaned.replace(/&#x2F;/g, '/');
    // Remove all HTML tags
    cleaned = cleaned.replace(/<[^>]*>/g, ' ');
    // Normalize whitespace
    cleaned = cleaned.replace(/\s+/g, ' ').trim();
    return cleaned;
}

// Clean job description - remove HTML tags, URLs, table artifacts, and provide fallback
function cleanJobDescription(description, title, company) {
    if (!description) {
        return `${title} position at ${company}`;
    }

    // Strip HTML tags and entities first
    let cleaned = stripHtml(description);

    // Remove markdown table artifacts: |, ##, []
    cleaned = cleaned.replace(/\|/g, ' ');
    cleaned = cleaned.replace(/#{1,6}\s*/g, '');
    cleaned = cleaned.replace(/\*\*/g, '');

    // Remove markdown links [text](url)
    cleaned = cleaned.replace(/\[([^\]]*)\]\([^)]+\)/g, '$1');

    // Remove raw URLs
    cleaned = cleaned.replace(/https?:\/\/[^\s)]+/g, '');

    // Remove "Salary Search:" prefix and similar
    cleaned = cleaned.replace(/Salary Search:\s*/gi, '');

    // Remove leftover parentheses and brackets
    cleaned = cleaned.replace(/\(\s*\)/g, '');
    cleaned = cleaned.replace(/\[\s*\]/g, '');
    cleaned = cleaned.replace(/\]/g, '');
    cleaned = cleaned.replace(/\[/g, '');

    // Clean up extra whitespace
    cleaned = cleaned.replace(/\s+/g, ' ').trim();

    // Remove leading punctuation or brackets
    cleaned = cleaned.replace(/^[[\]()\-\*\s:|]+/, '');

    // Check if description is just repeating the title/company/location
    const titleWords = title.toLowerCase().split(/\s+/);
    const companyWords = (company || '').toLowerCase().split(/\s+/);
    const descWords = cleaned.toLowerCase().split(/\s+/);
    const titleCompanyWords = [...titleWords, ...companyWords];
    const meaningfulWords = descWords.filter(w =>
        w.length > 2 &&
        !titleCompanyWords.includes(w) &&
        !['india', 'remote', 'bangalore', 'bengaluru', 'mumbai', 'delhi', 'pune',
            'hyderabad', 'chennai', 'noida', 'gurgaon', 'kolkata', 'maharashtra',
            'karnataka', 'telangana', 'tamil', 'nadu', 'the', 'and', 'for', 'with',
            'from', 'posted', 'recently', 'ago', 'days', 'hours', 'full-time',
            'part-time', 'internship', 'contract', 'position', 'salary', 'not',
            'disclosed', 'health', 'insurance', 'paid', 'sick', 'time'].includes(w)
    );

    // If most words are just title/company/location repetition, use fallback
    if (cleaned.length < 15 || meaningfulWords.length < 5 || cleaned.toLowerCase().includes('salaries in')) {
        return `${title} position at ${company}`;
    }

    // Extract the first meaningful sentence for a clean one-liner
    const sentences = cleaned.split(/(?<=[.!?])\s+/);
    let bestSentence = null;
    for (const sentence of sentences) {
        const trimmed = sentence.trim();
        // A good sentence starts with a capital letter, is 30+ chars, and isn't just title repetition
        if (trimmed.length >= 30 && /^[A-Z]/.test(trimmed)) {
            const sentenceLower = trimmed.toLowerCase();
            const isTitleRepetition = titleWords.length > 0 &&
                titleWords.every(w => w.length < 3 || sentenceLower.includes(w));
            if (!isTitleRepetition || trimmed.length > 80) {
                bestSentence = trimmed;
                break;
            }
        }
    }

    if (!bestSentence) {
        bestSentence = meaningfulWords.length >= 5 ? cleaned : `${title} position at ${company}`;
    }

    // Cap at 200 chars for a clean one-liner
    if (bestSentence.length > 200) {
        bestSentence = bestSentence.substring(0, 200).replace(/\s+\S*$/, '') + '...';
    }

    return bestSentence;
}

// Format full description into structured markdown for the detail panel
function formatFullDescription(rawDescription, title, company) {
    if (!rawDescription) {
        return `${stripHtml(title)} position at ${stripHtml(company)}`;
    }

    let text = rawDescription;

    // 1. Convert HTML block elements to newlines BEFORE stripping tags
    text = text.replace(/<br\s*\/?>/gi, '\n');
    text = text.replace(/<\/p>/gi, '\n\n');
    text = text.replace(/<\/div>/gi, '\n');
    text = text.replace(/<\/li>/gi, '\n');
    text = text.replace(/<li[^>]*>/gi, '- ');
    text = text.replace(/<\/h[1-6]>/gi, '\n\n');
    text = text.replace(/<h([1-6])[^>]*>/gi, '\n\n## ');
    text = text.replace(/<\/?ul[^>]*>/gi, '\n');
    text = text.replace(/<\/?ol[^>]*>/gi, '\n');
    text = text.replace(/<\/?tr[^>]*>/gi, '\n');
    text = text.replace(/<\/?table[^>]*>/gi, '\n');
    text = text.replace(/<td[^>]*>/gi, ' ');
    text = text.replace(/<\/?strong>/gi, '**');
    text = text.replace(/<\/?b>/gi, '**');

    // 2. Decode HTML entities (DO NOT use stripHtml — it kills newlines)
    text = text.replace(/&amp;/g, '&');
    text = text.replace(/&lt;/g, '<');
    text = text.replace(/&gt;/g, '>');
    text = text.replace(/&quot;/g, '"');
    text = text.replace(/&#0?39;/g, "'");
    text = text.replace(/&nbsp;/g, ' ');
    text = text.replace(/&#x27;/g, "'");
    text = text.replace(/&#x2F;/g, '/');

    // 3. Strip remaining HTML tags (but preserve newlines)
    text = text.replace(/<[^>]*>/g, '');

    // 4. Normalize spaces on each line (but keep newlines)
    text = text.split('\n').map(line => line.replace(/[ \t]+/g, ' ').trim()).join('\n');

    // 5. Convert bullet markers to proper markdown list items
    text = text.replace(/^\s*[•●◦▪■►]\s*/gm, '- ');

    // 6. Detect section headers (common patterns in JSearch descriptions)
    const headerPatterns = [
        'Key Responsibilities', 'Role and Responsibilities', 'Responsibilities',
        'Key Requirements', 'Required Skills', 'Required Qualifications', 'Requirements',
        'Minimum Qualifications', 'Preferred Qualifications', 'Qualifications',
        'Skills Required', 'Technical Skills', 'Skills Needed', 'Skills',
        'What You Will Do', 'What We Are Looking For',
        "What You'll Do", "What You'll Bring", 'What We Offer',
        'About the Role', 'About Us', 'About The Company', 'About The Team',
        'Job Description', 'Role Description', 'Position Overview',
        'Nice to Have', 'Benefits', 'Perks', 'Compensation',
        'Educational Qualifications', 'Education', 'Desired Skills',
        'Experience With', 'Experience',
        'WHAT YOU\'LL DO', 'WHAT WE ARE LOOKING FOR',
        'Duties',
    ];

    // Sort by length descending so longer patterns match first
    headerPatterns.sort((a, b) => b.length - a.length);

    for (const header of headerPatterns) {
        const escapedHeader = header.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        // Match at start of line, optionally followed by : 
        const regex = new RegExp(`^\\s*${escapedHeader}\\s*:?\\s*$`, 'gim');
        text = text.replace(regex, `\n## ${header}\n`);
    }

    // 7. Clean up multiple blank lines
    text = text.replace(/\n{3,}/g, '\n\n');

    // 8. Ensure list items have a blank line before the first one
    text = text.replace(/([^\n])\n(- )/g, '$1\n\n$2');

    // 9. Trim
    text = text.trim();

    // 10. Fallback
    if (text.length < 20) {
        return `${stripHtml(title)} position at ${stripHtml(company)}`;
    }

    return text;
}

function extractSkills(text) {
    if (!text) return [];

    const commonSkills = [
        // Frontend & Frameworks
        "React", "Angular", "Vue", "Next.js", "Redux", "Tailwind", "Bootstrap", "Sass",
        // Backend & Languages
        "Node.js", "Python", "Java", "C++", "C#", "Go", "Rust", "Swift", "Kotlin",
        "Express", "Django", "Flask", "Spring", "Ruby", "PHP", "Scala",
        // Web fundamentals
        "TypeScript", "JavaScript", "HTML", "CSS", "GraphQL", "REST API", "APIs",
        // Databases
        "SQL", "NoSQL", "MongoDB", "PostgreSQL", "MySQL", "Redis", "Elasticsearch",
        // Cloud & DevOps
        "AWS", "Azure", "GCP", "Docker", "Kubernetes", "Git", "CI/CD",
        "Linux", "Jenkins", "Terraform", "DevOps",
        // AI & Data
        "Machine Learning", "Deep Learning", "AI", "Data Science", "NLP",
        "TensorFlow", "PyTorch", "LLM", "Data Analytics", "Power BI", "Tableau",
        // Product & Management
        "Product Management", "Project Management", "Agile", "Scrum",
        "JIRA", "Confluence", "Figma", "UX Design",
        // Soft skills & Domain
        "Communication skills", "Leadership", "Information Security", "Cybersecurity",
        "Blockchain", "IoT", "Microservices", "System Design",
        // Testing
        "Selenium", "Jest", "Cypress", "Testing"
    ];

    const textLower = text.toLowerCase();
    const foundSkills = new Set();

    // Check for exact matches (case-insensitive)
    commonSkills.forEach(skill => {
        const escapedSkill = skill.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        const regex = new RegExp(`(^|[^a-z0-9])${escapedSkill}([^a-z0-9]|$)`, 'i');

        if (regex.test(textLower)) {
            foundSkills.add(skill);
        }
    });

    return Array.from(foundSkills).slice(0, 5); // Return top 5 found skills
}

module.exports = router;
