const express = require('express');
const router = express.Router();
const { getAuth } = require('@clerk/express');
const Profile = require('../models/Profile');
const Job = require('../models/Job');

// JSearch API configuration
const JSEARCH_API_HOST = 'jsearch.p.rapidapi.com';
const JSEARCH_API_KEY = process.env.JSEARCH_API_KEY;

// Cron refresh secret (optional, for securing the refresh endpoint)
const CRON_SECRET = process.env.CRON_SECRET || '';

// Popular job queries to auto-fetch daily
const POPULAR_QUERIES = [
    'Software Engineer',
    'Data Analyst',
    'Product Manager',
    'Web Developer',
    'UI/UX Designer',
];

// How many hours before cached results are considered stale and trigger a background refresh
const CACHE_STALE_HOURS = 24;

// Minimum number of cached results to consider a cache hit
const CACHE_HIT_THRESHOLD = 10;

// ============================================================
// GET /search — Cache-first job search
// ============================================================
router.get('/search', async (req, res) => {
    try {
        const { query, location = 'India', remote, jobType, experience, limit = 20, page = 1 } = req.query;

        if (!query) {
            return res.status(400).json({
                success: false,
                error: 'Search query is required'
            });
        }

        const normalizedQuery = query.trim().toLowerCase();
        console.log(`[Search] query="${query}", normalized="${normalizedQuery}", location=${location}, experience=${experience || 'any'}, page=${page}`);

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
                    console.log('[Search] User profile loaded for match scoring:', {
                        skills: userProfile.skills.length,
                        hasPrefs: !!userProfile.preferences,
                    });
                }
            }
        } catch (authErr) {
            // No auth token or invalid — that's fine, use fallback scoring
            console.log('[Search] No auth for match scoring, using data-richness scores');
        }

        // ---- STEP 1: Search MongoDB cache ----
        let cachedJobs = await searchJobsFromDB(normalizedQuery, {
            remote,
            jobType,
            experience,
            limit: parseInt(limit),
            page: parseInt(page),
        });

        let fromCache = false;

        if (cachedJobs.length >= CACHE_HIT_THRESHOLD) {
            // Cache HIT
            console.log(`[Search] Cache HIT: found ${cachedJobs.length} jobs in MongoDB`);
            fromCache = true;

            // Check if cached data is stale — trigger background refresh if so
            const oldestFetch = cachedJobs.reduce((oldest, j) => {
                const fetchedAt = j.lastRefreshed || j.fetchedAt;
                return fetchedAt < oldest ? fetchedAt : oldest;
            }, new Date());

            const hoursOld = (Date.now() - oldestFetch.getTime()) / (1000 * 60 * 60);
            if (hoursOld > CACHE_STALE_HOURS) {
                console.log(`[Search] Cache is ${Math.round(hoursOld)}h old — triggering background refresh`);
                // Fire-and-forget background refresh
                refreshQueryInBackground(normalizedQuery, location, remote, jobType, experience).catch(err => {
                    console.error('[Search] Background refresh error:', err.message);
                });
            }
        } else {
            // Cache MISS — fetch from JSearch API
            console.log(`[Search] Cache MISS (only ${cachedJobs.length} results) — fetching from JSearch API`);

            const searchQuery = buildJSearchQuery(query, location, remote);
            const { jobs: rawMappedJobs, rawResults } = await searchJSearchAPI(
                searchQuery, parseInt(limit), remote, jobType, experience, parseInt(page)
            );

            // Store fetched jobs in MongoDB (fire-and-forget)
            if (rawMappedJobs.length > 0) {
                storeJobsInDB(rawMappedJobs, rawResults, normalizedQuery).catch(err => {
                    console.error('[Search] Error storing jobs in DB:', err.message);
                });
            }

            cachedJobs = rawMappedJobs;
            console.log(`[Search] JSearch returned ${cachedJobs.length} jobs`);
        }

        // ---- STEP 2: Apply match scoring (computed per-user, not stored) ----
        const scoredJobs = cachedJobs.map(job => {
            const rawJobForScoring = {
                job_required_skills: job.rawRequiredSkills || job.requiredSkills || [],
                job_title: job.title,
                job_description: job.rawDescription || job.description || '',
                job_is_remote: job.rawIsRemote ?? job.remote,
                job_min_salary: job.rawSalaryMin,
                job_max_salary: job.rawSalaryMax,
                job_required_experience: job.rawRequiredExperience,
            };

            return {
                id: job.jobId || job.id,
                title: job.title,
                company: job.company,
                location: job.location,
                remote: job.remote,
                salary: job.salary,
                description: job.description,
                fullDescription: job.fullDescription,
                matchScore: calculateMatchScore(rawJobForScoring, job.skills || [], job.jobType, job.location, userProfile),
                postedDate: job.postedDate,
                jobType: job.jobType,
                experienceLevel: job.experienceLevel,
                applyUrl: job.applyUrl,
                skills: job.skills,
                requiredSkills: job.requiredSkills,
                highlights: job.highlights,
                companyLogo: job.companyLogo,
                source: job.source,
            };
        });

        // Remove duplicates by title
        const uniqueJobs = [];
        const seenTitles = new Set();
        for (const job of scoredJobs) {
            const key = job.title.toLowerCase();
            if (!seenTitles.has(key)) {
                seenTitles.add(key);
                uniqueJobs.push(job);
            }
        }

        // Limit to requested count
        const limitedJobs = uniqueJobs.slice(0, parseInt(limit));
        console.log(`[Search] Returning ${limitedJobs.length} unique jobs (from ${fromCache ? 'cache' : 'API'})`);

        // hasMore estimation
        const hasMore = fromCache
            ? uniqueJobs.length >= parseInt(limit)
            : uniqueJobs.length >= parseInt(limit) * 0.8;

        res.json({
            success: true,
            data: limitedJobs,
            count: limitedJobs.length,
            hasMore,
            fromCache,
        });

    } catch (error) {
        console.error('[Search] Job search error:', error);
        res.status(500).json({
            success: false,
            error: error.message || 'Failed to search for jobs',
            details: error.response?.data || error.stack?.split('\n')[0] || undefined
        });
    }
});

// ============================================================
// POST /refresh — Refresh popular job queries (called by Vercel Cron)
// ============================================================
router.get('/refresh', async (req, res) => {
    try {
        // Optional: verify cron secret
        const authHeader = req.headers['authorization'];
        if (CRON_SECRET && authHeader !== `Bearer ${CRON_SECRET}`) {
            return res.status(401).json({ success: false, error: 'Unauthorized' });
        }

        console.log('[Cron] Starting daily job refresh...');
        const results = {};

        for (const queryText of POPULAR_QUERIES) {
            try {
                const normalizedQuery = queryText.trim().toLowerCase();
                const searchQuery = buildJSearchQuery(queryText, 'India', undefined);

                console.log(`[Cron] Fetching: "${queryText}"...`);

                // Fetch up to 60 jobs per popular query (6 pages × 10 results)
                const { jobs: mappedJobs, rawResults } = await searchJSearchAPI(
                    searchQuery, 60, undefined, undefined, undefined, 1
                );

                if (mappedJobs.length > 0) {
                    const stored = await storeJobsInDB(mappedJobs, rawResults, normalizedQuery);
                    results[queryText] = { fetched: mappedJobs.length, stored };
                    console.log(`[Cron] "${queryText}": fetched ${mappedJobs.length}, stored/updated ${stored}`);
                } else {
                    results[queryText] = { fetched: 0, stored: 0 };
                    console.log(`[Cron] "${queryText}": no results from JSearch`);
                }

                // Small delay between queries to avoid rate limiting
                await new Promise(resolve => setTimeout(resolve, 1000));

            } catch (queryError) {
                console.error(`[Cron] Error fetching "${queryText}":`, queryError.message);
                results[queryText] = { error: queryError.message };
            }
        }

        console.log('[Cron] Daily refresh complete:', results);

        res.json({
            success: true,
            message: 'Daily job refresh complete',
            results,
            timestamp: new Date().toISOString(),
        });

    } catch (error) {
        console.error('[Cron] Refresh error:', error);
        res.status(500).json({
            success: false,
            error: error.message || 'Failed to refresh jobs',
        });
    }
});

// ============================================================
// DB HELPERS
// ============================================================

/**
 * Search for jobs in MongoDB using text search + query-based lookup.
 */
async function searchJobsFromDB(normalizedQuery, filters = {}) {
    const { remote, jobType, experience, limit = 20, page = 1 } = filters;

    try {
        // Build a combined query:
        // 1. Text search on title/company/skills
        // 2. OR exact match on searchQueries array
        const mongoQuery = {
            $or: [
                { $text: { $search: normalizedQuery } },
                { searchQueries: normalizedQuery },
            ],
        };

        // Apply filters
        if (remote === 'true') {
            mongoQuery.remote = true;
        }
        if (jobType) {
            mongoQuery.jobType = jobType;
        }
        if (experience) {
            // Map experience filter to experience levels
            const expMap = {
                '0-1 Years': ['Fresher', '0-1 Years'],
                '2-5 Years': ['1-3 Years', '3-5 Years'],
                '5+ Years': ['5-10 Years', '10+ Years'],
            };
            if (expMap[experience]) {
                mongoQuery.experienceLevel = { $in: expMap[experience] };
            }
        }

        // For page > 1, skip previous results
        const skip = (page - 1) * limit;

        const jobs = await Job.find(mongoQuery)
            .sort({ fetchedAt: -1 })
            .skip(skip)
            .limit(limit)
            .lean();

        return jobs;

    } catch (err) {
        // If text index doesn't exist yet, fall back to regex search
        if (err.code === 27 || err.codeName === 'IndexNotFound') {
            console.log('[DB] Text index not ready, falling back to regex search');
            const regexQuery = {
                $or: [
                    { title: { $regex: normalizedQuery, $options: 'i' } },
                    { company: { $regex: normalizedQuery, $options: 'i' } },
                    { searchQueries: normalizedQuery },
                ],
            };

            return Job.find(regexQuery)
                .sort({ fetchedAt: -1 })
                .limit(limit)
                .lean();
        }
        throw err;
    }
}

/**
 * Store mapped jobs into MongoDB (upsert by jobId).
 * Returns the count of successfully stored/updated jobs.
 */
async function storeJobsInDB(mappedJobs, rawResults, normalizedQuery) {
    let storedCount = 0;

    const bulkOps = mappedJobs.map((job, index) => {
        const raw = rawResults[index] || {};

        return {
            updateOne: {
                filter: { jobId: job.id },
                update: {
                    $set: {
                        jobId: job.id,
                        title: job.title,
                        company: job.company,
                        location: job.location,
                        remote: job.remote,
                        salary: job.salary,
                        description: job.description,
                        fullDescription: job.fullDescription,
                        postedDate: job.postedDate,
                        jobType: job.jobType,
                        experienceLevel: job.experienceLevel,
                        applyUrl: job.applyUrl,
                        skills: job.skills,
                        requiredSkills: job.requiredSkills,
                        highlights: job.highlights,
                        companyLogo: job.companyLogo,
                        source: job.source,
                        // Raw data for re-scoring
                        rawSalaryMin: raw.job_min_salary || null,
                        rawSalaryMax: raw.job_max_salary || null,
                        rawSalaryCurrency: raw.job_salary_currency || null,
                        rawSalaryPeriod: raw.job_salary_period || null,
                        rawIsRemote: raw.job_is_remote || false,
                        rawRequiredExperience: raw.job_required_experience || null,
                        rawRequiredSkills: raw.job_required_skills || [],
                        rawDescription: raw.job_description || '',
                        rawEmploymentType: raw.job_employment_type || null,
                        // Refresh timestamp
                        lastRefreshed: new Date(),
                    },
                    $addToSet: {
                        searchQueries: normalizedQuery,
                    },
                    $setOnInsert: {
                        fetchedAt: new Date(),
                    },
                },
                upsert: true,
            },
        };
    });

    if (bulkOps.length > 0) {
        const result = await Job.bulkWrite(bulkOps, { ordered: false });
        storedCount = (result.upsertedCount || 0) + (result.modifiedCount || 0);
    }

    return storedCount;
}

/**
 * Background refresh: fetch fresh data from JSearch for a query and update cache.
 */
async function refreshQueryInBackground(normalizedQuery, location, remote, jobType, experience) {
    const searchQuery = buildJSearchQuery(normalizedQuery, location || 'India', remote);
    const { jobs: mappedJobs, rawResults } = await searchJSearchAPI(
        searchQuery, 60, remote, jobType, experience, 1
    );

    if (mappedJobs.length > 0) {
        const stored = await storeJobsInDB(mappedJobs, rawResults, normalizedQuery);
        console.log(`[Background] Refreshed "${normalizedQuery}": ${mappedJobs.length} fetched, ${stored} stored`);
    }
}

/**
 * Build the JSearch query string from user inputs.
 */
function buildJSearchQuery(query, location, remote) {
    let searchQuery = `${query} in ${location || 'India'}`;
    if (remote === 'true') {
        searchQuery += ' remote';
    }
    return searchQuery;
}

// ============================================================
// JSEARCH API
// ============================================================

/**
 * Call JSearch API and return both mapped job objects AND raw results.
 */
async function searchJSearchAPI(query, limit = 20, remote, jobType, experience, page = 1) {
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
    console.log('[JSearch] API URL:', url);

    const response = await fetch(url, {
        method: 'GET',
        headers: {
            'X-RapidAPI-Key': JSEARCH_API_KEY,
            'X-RapidAPI-Host': JSEARCH_API_HOST
        }
    });

    if (!response.ok) {
        const errorText = await response.text();
        console.error('[JSearch] API error:', response.status, errorText);
        throw new Error(`JSearch API error: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    const results = data.data || [];
    console.log(`[JSearch] Returned ${results.length} raw results`);

    return {
        jobs: results.map((job, index) => mapJSearchJob(job, index, experience)),
        rawResults: results,
        rawCount: results.length,
    };
}

// ============================================================
// JOB MAPPING (JSearch → our format)
// ============================================================

/**
 * Map JSearch API response to our job object format.
 * Note: matchScore is NOT set here — it's computed at query time per user.
 */
function mapJSearchJob(job, index, requestedExperience = null) {
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

    // Final fallback: use the requested experience filter if it was provided
    if (!experienceLevel && requestedExperience) {
        const fallbackMap = {
            '0-1 Years': '0-1 Years',
            '2-5 Years': '3-5 Years', // Map to a value that falls in the '2-5 Years' range
            '5+ Years': '5-10 Years'
        };
        experienceLevel = fallbackMap[requestedExperience] || null;
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
        matchScore: -1, // Will be computed at query time per user
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

// ============================================================
// UTILITY FUNCTIONS
// ============================================================

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
    cleaned = cleaned.replace(/^[[\]()\\-\\*\s:|]+/, '');

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
