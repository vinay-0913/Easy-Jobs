const http = require('http');
const fs = require('fs');

const options = {
    hostname: 'localhost',
    port: 5000,
    path: '/api/jobs/search?query=software%20engineer&location=India&limit=20',
    method: 'GET'
};

http.get(options, (res) => {
    let data = '';
    res.on('data', chunk => data += chunk);
    res.on('end', () => {
        const result = JSON.parse(data);

        // Save full result
        fs.writeFileSync('jobs-result.json', JSON.stringify(result, null, 2));

        console.log('Success:', result.success);
        console.log('Total Jobs:', result.count);
        console.log('\n=========== JOB LISTINGS ===========\n');

        if (result.data && result.data.length > 0) {
            result.data.forEach((job, index) => {
                console.log(`[${index + 1}] ${job.title}`);
                console.log(`    Company:  ${job.company}`);
                console.log(`    Location: ${job.location}`);
                console.log(`    Salary:   ${job.salary}`);
                console.log(`    Remote:   ${job.remote ? 'Yes' : 'No'}`);
                console.log(`    Match:    ${Math.round(job.matchScore)}%`);
                console.log(`    Type:     ${job.jobType}`);
                console.log(`    Apply:    ${job.applyUrl}`);
                console.log('-'.repeat(50));
            });
        } else {
            console.log('No jobs found.');
        }
        console.log('\nFull details saved to jobs-result.json');
    });
}).on('error', (e) => {
    console.error('Error:', e.message);
});
