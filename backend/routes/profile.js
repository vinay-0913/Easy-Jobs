const express = require('express');
const { requireAuth, getAuth } = require('@clerk/express');
const Profile = require('../models/Profile');
const router = express.Router();

// Middleware to require authentication using Clerk
// This replaces the old JWT verification middleware
const authenticate = requireAuth();

// Helper to get user ID from Clerk auth
const getUserId = (req) => {
    const auth = getAuth(req);
    return auth.userId;
};

// Apply authentication to all profile routes
router.use(authenticate);

// --- Profile Basics ---

// Get Profile
router.get('/', async (req, res) => {
    try {
        const userId = getUserId(req);
        // Use findOneAndUpdate with upsert to avoid stale index issues
        const profile = await Profile.findOneAndUpdate(
            { clerkUserId: userId },
            { $setOnInsert: { clerkUserId: userId, skills: [], saved_jobs: [] } },
            { new: true, upsert: true }
        );

        res.json({ success: true, data: profile });
    } catch (err) {
        console.error('Profile get error:', err);
        res.status(500).json({ success: false, error: err.message });
    }
});

// Upsert Profile Basics
router.post('/', async (req, res) => {
    try {
        const userId = getUserId(req);
        const { full_name, avatar_url, email, role, mobile, location, gender, dob, bio } = req.body;

        const updateFields = { full_name, avatar_url, email, role, mobile, location, gender, dob, bio };
        // Remove undefined fields so we don't overwrite with undefined
        Object.keys(updateFields).forEach(key => {
            if (updateFields[key] === undefined) delete updateFields[key];
        });

        const profile = await Profile.findOneAndUpdate(
            { clerkUserId: userId },
            { $set: updateFields },
            { new: true, upsert: true }
        );

        res.json({ success: true, data: profile });
    } catch (err) {
        console.error('Profile upsert error:', err);
        res.status(500).json({ success: false, error: err.message });
    }
});

// --- Skills ---

router.get('/skills', async (req, res) => {
    try {
        const userId = getUserId(req);
        const profile = await Profile.findOne({ clerkUserId: userId });
        res.json({ success: true, data: profile ? profile.skills : [] });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

router.post('/skills', async (req, res) => {
    try {
        const userId = getUserId(req);
        const { skill, proficiency } = req.body;
        
        let profile = await Profile.findOne({ clerkUserId: userId });
        if (!profile) {
            await Profile.create({ clerkUserId: userId, skills: [] });
        }

        // Add skill if it doesn't exist
        await Profile.findOneAndUpdate(
            { clerkUserId: userId, 'skills.skill': { $ne: skill } },
            { $push: { skills: { skill, proficiency } } }
        );

        res.json({ success: true, data: { skill, proficiency } });
    } catch (err) {
        console.error('Profile POST /skills error:', err);
        res.status(500).json({ success: false, error: err.message });
    }
});

router.delete('/skills', async (req, res) => {
    try {
        const userId = getUserId(req);
        const { skill } = req.body;
        await Profile.findOneAndUpdate(
            { clerkUserId: userId },
            { $pull: { skills: { skill: skill } } }
        );
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

// --- Preferences ---

router.get('/preferences', async (req, res) => {
    try {
        const userId = getUserId(req);
        const profile = await Profile.findOne({ clerkUserId: userId });
        res.json({ success: true, data: profile ? profile.preferences : {} });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

router.post('/preferences', async (req, res) => {
    try {
        const userId = getUserId(req);
        const { preferred_roles, preferred_locations, experience_level, salary_min, salary_max, job_types, remote_preference, industries } = req.body;

        // Construct update object to only update provided fields
        const update = {};
        if (preferred_roles) update['preferences.preferred_roles'] = preferred_roles;
        if (preferred_locations) update['preferences.preferred_locations'] = preferred_locations;
        if (experience_level !== undefined) update['preferences.experience_level'] = experience_level;
        if (salary_min !== undefined) update['preferences.salary_min'] = salary_min;
        if (salary_max !== undefined) update['preferences.salary_max'] = salary_max;
        if (job_types) update['preferences.job_types'] = job_types;
        if (remote_preference) update['preferences.remote_preference'] = remote_preference;
        if (industries) update['preferences.industries'] = industries;
        update['preferences.updated_at'] = new Date();

        const profile = await Profile.findOneAndUpdate(
            { clerkUserId: userId },
            { $set: update },
            { new: true, upsert: true }
        );

        res.json({ success: true, data: profile.preferences });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

// --- Saved Jobs ---

router.get('/saved-jobs', async (req, res) => {
    try {
        const userId = getUserId(req);
        const profile = await Profile.findOne({ clerkUserId: userId });
        // Transform DB fields (snake_case) to frontend fields (camelCase)
        const jobs = profile ? profile.saved_jobs.map(j => {
            const obj = j.toObject();
            return {
                id: obj.job_id || obj._id.toString(),
                job_id: obj.job_id,
                title: obj.title,
                company: obj.company,
                location: obj.location,
                salary: obj.salary,
                description: obj.description,
                remote: obj.remote,
                matchScore: obj.matchScore || 0,
                skills: obj.skills || [],
                saved_at: obj.saved_at,
                // Map snake_case to camelCase for frontend compatibility
                applyUrl: obj.apply_url || '',
                apply_url: obj.apply_url,
                companyLogo: obj.company_logo || null,
                company_logo: obj.company_logo,
            };
        }) : [];
        res.json({ success: true, data: jobs });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

router.post('/saved-jobs', async (req, res) => {
    try {
        const userId = getUserId(req);
        const { job_id, title, company, location, salary, description, apply_url, remote, matchScore, skills, company_logo } = req.body;

        let profile = await Profile.findOne({ clerkUserId: userId });

        if (!profile) {
            await Profile.create({ clerkUserId: userId, saved_jobs: [] });
        }

        // Atomically push if job_id isn't already saved
        await Profile.findOneAndUpdate(
            { clerkUserId: userId, 'saved_jobs.job_id': { $ne: job_id } },
            { $push: { saved_jobs: {
                job_id, title, company, location, salary, description, apply_url, remote,
                matchScore, skills, company_logo
            } } }
        );

        res.json({ success: true, data: { job_id, title } });
    } catch (err) {
        console.error('Profile POST /saved-jobs error:', err);
        res.status(500).json({ success: false, error: err.message });
    }
});

router.delete('/saved-jobs', async (req, res) => {
    try {
        const userId = getUserId(req);
        const { job_id } = req.body;
        await Profile.findOneAndUpdate(
            { clerkUserId: userId },
            { $pull: { saved_jobs: { job_id: job_id } } }
        );
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

// --- Applied Jobs ---

router.get('/applied-jobs', async (req, res) => {
    try {
        const userId = getUserId(req);
        console.log('[GET /applied-jobs] userId:', userId);
        const profile = await Profile.findOne({ clerkUserId: userId });
        console.log('[GET /applied-jobs] applied_jobs count:', profile?.applied_jobs?.length || 0);
        const jobs = profile && profile.applied_jobs ? profile.applied_jobs.map(j => ({
            ...j.toObject(),
            id: j.job_id || j._id.toString()
        })) : [];
        console.log('[GET /applied-jobs] returning:', jobs.length, 'jobs');
        res.json({ success: true, data: jobs });
    } catch (err) {
        console.error('[GET /applied-jobs] ERROR:', err);
        res.status(500).json({ success: false, error: err.message });
    }
});

router.post('/applied-jobs', async (req, res) => {
    try {
        const userId = getUserId(req);
        const { job_id, title, company, location, salary, description, apply_url, remote, company_logo } = req.body;
        console.log('[POST /applied-jobs] userId:', userId, 'job_id:', job_id, 'title:', title);

        let profile = await Profile.findOne({ clerkUserId: userId });
        console.log('[POST /applied-jobs] profile found:', !!profile);

        if (!profile) {
            await Profile.create({ clerkUserId: userId, applied_jobs: [] });
            console.log('[POST /applied-jobs] Created new profile');
        }

        // Atomically push if job_id isn't already applied
        const updated = await Profile.findOneAndUpdate(
            { clerkUserId: userId, 'applied_jobs.job_id': { $ne: job_id } },
            { $push: { applied_jobs: {
                job_id, title, company, location, salary, description, apply_url, remote, company_logo,
                status: 'Applied',
                applied_at: new Date()
            } } },
            { new: true }
        );
        
        if (updated) {
            console.log('[POST /applied-jobs] Saved! Now has', updated.applied_jobs.length, 'applied jobs');
        } else {
            console.log('[POST /applied-jobs] Job already exists or user not found, skipping array push');
        }

        res.json({ success: true, data: { job_id, title } });
    } catch (err) {
        console.error('[POST /applied-jobs] ERROR:', err);
        res.status(500).json({ success: false, error: err.message });
    }
});

router.put('/applied-jobs/:jobId/status', async (req, res) => {
    try {
        const userId = getUserId(req);
        const { jobId } = req.params;
        const { status } = req.body;

        const validStatuses = ['Applied', 'Not Applied', 'Interview', 'Offer Received', 'Rejected'];
        if (!validStatuses.includes(status)) {
            return res.status(400).json({ success: false, error: 'Invalid status' });
        }

        const profile = await Profile.findOneAndUpdate(
            { clerkUserId: userId, 'applied_jobs.job_id': jobId },
            { $set: { 'applied_jobs.$.status': status } },
            { new: true }
        );

        if (!profile) {
            return res.status(404).json({ success: false, error: 'Application not found' });
        }

        res.json({ success: true, data: { job_id: jobId, status } });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

router.delete('/applied-jobs', async (req, res) => {
    try {
        const userId = getUserId(req);
        const { job_id } = req.body;
        await Profile.findOneAndUpdate(
            { clerkUserId: userId },
            { $pull: { applied_jobs: { job_id: job_id } } }
        );
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

// --- Education / Experience / Projects (generic CRUD for embedded arrays) ---
// IMPORTANT: These catch-all /:section routes must be LAST

const SECTION_FIELDS = ['education', 'experience', 'projects'];

function validateSection(req, res, next) {
    if (!SECTION_FIELDS.includes(req.params.section)) {
        return res.status(404).json({ success: false, error: 'Invalid section' });
    }
    next();
}

router.get('/:section', validateSection, async (req, res) => {
    try {
        const userId = getUserId(req);
        const { section } = req.params;
        const profile = await Profile.findOne({ clerkUserId: userId });
        res.json({ success: true, data: profile ? profile[section] : [] });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

router.post('/:section', validateSection, async (req, res) => {
    try {
        const userId = getUserId(req);
        const { section } = req.params;
        const item = req.body;
        const profile = await Profile.findOneAndUpdate(
            { clerkUserId: userId },
            { $push: { [section]: item } },
            { new: true, upsert: true }
        );
        const added = profile[section][profile[section].length - 1];
        res.json({ success: true, data: added });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

router.put('/:section/:itemId', validateSection, async (req, res) => {
    try {
        const userId = getUserId(req);
        const { section, itemId } = req.params;
        const updates = req.body;
        const setObj = {};
        Object.keys(updates).forEach(key => {
            setObj[`${section}.$[elem].${key}`] = updates[key];
        });
        const profile = await Profile.findOneAndUpdate(
            { clerkUserId: userId },
            { $set: setObj },
            { new: true, arrayFilters: [{ 'elem._id': itemId }] }
        );
        res.json({ success: true, data: profile ? profile[section] : [] });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

router.delete('/:section/:itemId', validateSection, async (req, res) => {
    try {
        const userId = getUserId(req);
        const { section, itemId } = req.params;
        await Profile.findOneAndUpdate(
            { clerkUserId: userId },
            { $pull: { [section]: { _id: itemId } } }
        );
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

module.exports = router;
