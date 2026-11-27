const fs = require('fs');
const path = require('path');

// Read the file
let content = fs.readFileSync('questions_bank.js', 'utf8');

// Append export
content += '\nmodule.exports = questionsBank;';

// Write to temp file
fs.writeFileSync('temp_bank.js', content);

// Require it
const questionsBank = require('./temp_bank.js');

// Create API directory
const apiDir = path.join(__dirname, 'api', 'v1');
fs.mkdirSync(apiDir, { recursive: true });

const apiMetadata = {
    provider: "TAIRED CBT",
    developer: "TAIRED",
    website: "https://taired-cbt.puter.site",
    timestamp: new Date().toISOString(),
    description: "The official API for TAIRED CBT question bank."
};

let allQuestions = [];
let courses = [];

for (const [courseId, questions] of Object.entries(questionsBank)) {
    allQuestions = allQuestions.concat(questions);
    
    // Write individual course file
    const courseData = {
        status: 'success',
        meta: {
            ...apiMetadata,
            course_id: courseId.toUpperCase(),
            total_questions: questions.length
        },
        data: questions
    };
    fs.writeFileSync(path.join(apiDir, `${courseId}.json`), JSON.stringify(courseData, null, 2));
    
    courses.push({
        id: courseId,
        title: courseId.toUpperCase(),
        question_count: questions.length,
        endpoint: `https://taired-cbt.puter.site/api/v1/${courseId}.json`,
        sample_questions: questions.slice(0, 2).map(q => q.question) // Include a preview of 2 questions
    });
}

// Write all.json
const allData = {
    status: 'success',
    meta: {
        ...apiMetadata,
        collection: "ALL_COURSES",
        total_questions: allQuestions.length
    },
    data: allQuestions
};
fs.writeFileSync(path.join(apiDir, 'all.json'), JSON.stringify(allData, null, 2));

// Write courses.json
const coursesData = {
    status: 'success',
    meta: apiMetadata,
    total_courses: courses.length,
    courses: courses
};
fs.writeFileSync(path.join(apiDir, 'courses.json'), JSON.stringify(coursesData, null, 2));

// Cleanup
fs.unlinkSync('./temp_bank.js');

console.log('Static API generation complete!');
