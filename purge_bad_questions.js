const fs = require('fs');
const qb = require('./questions_bank.js');

let finalBank = {};
let removedCount = 0;
let keptCount = 0;

for (const course in qb) {
    finalBank[course] = [];
    qb[course].forEach(q => {
        // Must have at least 2 options
        if (!q.options || q.options.length < 2) {
            removedCount++;
            return;
        }
        
        // Question text must not be empty or too short
        if (!q.question || q.question.trim().length < 10) {
            removedCount++;
            return;
        }
        
        // Check for severe garbling (e.g., words over 30 chars usually mean missing spaces, except in BIO/CHM but even then 30 is huge)
        const words = q.question.split(/\s+/);
        const hasGarbageWord = words.some(w => w.length > 35);
        if (hasGarbageWord) {
            removedCount++;
            return;
        }

        finalBank[course].push(q);
        keptCount++;
    });
    
    // Remove course if it became empty
    if (finalBank[course].length === 0) {
        delete finalBank[course];
    }
}

const jsContent = 'const questionsBank = ' + JSON.stringify(finalBank, null, 4) + ';\n\nif (typeof module !== "undefined") { module.exports = questionsBank; }';
fs.writeFileSync('questions_bank.js', jsContent);

console.log(`Purged ${removedCount} bad questions.`);
console.log(`Kept ${keptCount} good questions with options.`);
console.log(`Total courses remaining: ${Object.keys(finalBank).length}`);
