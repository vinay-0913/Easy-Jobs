const mongoose = require('mongoose');

const jobSchema = new mongoose.Schema({
    // Unique JSearch job ID
    jobId: {
        type: String,
        required: true,
        unique: true,
        index: true,
    },

    // The normalized search query that fetched this job (lowercase, trimmed)
    // A single job can appear for multiple queries, so we store an array
    searchQueries: [{
        type: String,
        index: true,
    }],

    // ---- Mapped job fields (served to frontend) ----
    title: { type: String, required: true },
    company: { type: String, default: 'Company' },
    location: { type: String, default: 'Location not specified' },
    remote: { type: Boolean, default: false },
    salary: { type: String, default: 'Salary not disclosed' },
    description: String,
    fullDescription: String,
    postedDate: String,
    jobType: { type: String, default: 'Full-time' },
    experienceLevel: String,
    applyUrl: { type: String, default: '#' },
    skills: [String],
    requiredSkills: [String],
    highlights: {
        type: mongoose.Schema.Types.Mixed,
        default: null,
    },
    companyLogo: String,
    source: { type: String, default: 'JSearch' },

    // ---- Raw JSearch data (kept for re-scoring per user profile) ----
    rawSalaryMin: Number,
    rawSalaryMax: Number,
    rawSalaryCurrency: String,
    rawSalaryPeriod: String,
    rawIsRemote: Boolean,
    rawRequiredExperience: mongoose.Schema.Types.Mixed,
    rawRequiredSkills: [String],
    rawDescription: String,
    rawEmploymentType: String,

    // ---- Cache metadata ----
    fetchedAt: {
        type: Date,
        default: Date.now,
    },
    lastRefreshed: {
        type: Date,
        default: Date.now,
    },
});

// Text index for flexible searching across title, company, and skills
jobSchema.index({
    title: 'text',
    company: 'text',
    skills: 'text',
    requiredSkills: 'text',
}, {
    weights: {
        title: 10,
        skills: 5,
        requiredSkills: 5,
        company: 3,
    },
    name: 'job_text_search',
});

// Compound index for query-based lookups
jobSchema.index({ searchQueries: 1, fetchedAt: -1 });

// TTL index: automatically delete documents 14 days after fetchedAt
jobSchema.index({ fetchedAt: 1 }, { expireAfterSeconds: 14 * 24 * 60 * 60 });

const Job = mongoose.model('Job', jobSchema);

module.exports = Job;
