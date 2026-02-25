const mongoose = require('mongoose');

const profileSchema = new mongoose.Schema({
    // Clerk User ID - this is the primary identifier now
    clerkUserId: {
        type: String,
        required: true,
        unique: true,
        index: true
    },
    email: String,
    full_name: String,
    avatar_url: String,
    role: String,
    mobile: String,
    location: String,
    gender: {
        type: String,
        enum: ['male', 'female', 'other', 'prefer_not_to_say'],
    },
    dob: String,
    bio: String,

    // Embedded Skills
    skills: [{
        skill: String,
        proficiency: {
            type: String,
            enum: ['beginner', 'intermediate', 'advanced', 'expert'],
            default: 'intermediate'
        },
        created_at: { type: Date, default: Date.now }
    }],

    // Embedded Education
    education: [{
        institution: String,
        degree: String,
        field: String,
        startDate: String,
        endDate: String,
        grade: String,
        description: String,
        created_at: { type: Date, default: Date.now }
    }],

    // Embedded Experience
    experience: [{
        company: String,
        title: String,
        location: String,
        startDate: String,
        endDate: String,
        current: { type: Boolean, default: false },
        description: String,
        created_at: { type: Date, default: Date.now }
    }],

    // Embedded Projects
    projects: [{
        title: String,
        description: String,
        technologies: [String],
        url: String,
        startDate: String,
        endDate: String,
        created_at: { type: Date, default: Date.now }
    }],

    // Embedded Preferences
    preferences: {
        preferred_roles: [String],
        preferred_locations: [String],
        experience_level: {
            type: String,
            enum: ['fresher', '1-3', '3-5', '5-10', '10+'],
        },
        salary_min: Number,
        salary_max: Number,
        job_types: [String],
        remote_preference: {
            type: String,
            enum: ['remote', 'onsite', 'hybrid', 'any'],
            default: 'any'
        },
        industries: [String],
        updated_at: { type: Date, default: Date.now }
    },

    // Embedded Saved Jobs
    saved_jobs: [{
        job_id: String,
        title: String,
        company: String,
        location: String,
        salary: String,
        description: String,
        apply_url: String,
        remote: Boolean,
        matchScore: Number,
        skills: [String],
        company_logo: String,
        saved_at: { type: Date, default: Date.now }
    }],

    // Embedded Applied Jobs
    applied_jobs: [{
        job_id: String,
        title: String,
        company: String,
        location: String,
        salary: String,
        description: String,
        apply_url: String,
        remote: Boolean,
        company_logo: String,
        status: {
            type: String,
            enum: ['Applied', 'Not Applied', 'Interview', 'Offer Received', 'Rejected'],
            default: 'Applied'
        },
        applied_at: { type: Date, default: Date.now }
    }]
}, {
    timestamps: true
});

const Profile = mongoose.model('Profile', profileSchema);

module.exports = Profile;
