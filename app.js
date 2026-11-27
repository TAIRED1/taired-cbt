// DOM Elements - Screens
const courseSelectScreen = document.getElementById('course-select-screen');
const landingScreen = document.getElementById('landing-screen');
const quizScreen = document.getElementById('quiz-screen');
const resultsScreen = document.getElementById('results-screen');

// Header Elements
const headerTitle = document.getElementById('header-title');

// DOM Elements - Buttons
const startBtn = document.getElementById('start-btn');
const nextBtn = document.getElementById('next-btn');
const quitBtn = document.getElementById('quit-btn');
const restartBtn = document.getElementById('restart-btn');
const shareBtn = document.getElementById('share-btn');
const backToCoursesBtn = document.getElementById('back-to-courses-btn');
const exitToCoursesBtn = document.getElementById('exit-to-courses-btn');

// Configuration Elements
const questionCountSelect = document.getElementById('question-count');
const timeLimitSelect = document.getElementById('time-limit');
const customQCountInput = document.getElementById('custom-q-count');
const customTLimitInput = document.getElementById('custom-t-limit');

// Quiz Screen Elements
const questionText = document.getElementById('question-text');
const optionsContainer = document.getElementById('options-container');
const typingContainer = document.getElementById('typing-container');
const typingInput = document.getElementById('typing-input');
const typingSubmitBtn = document.getElementById('typing-submit-btn');
const typingFeedback = document.getElementById('typing-feedback');
const currentQNum = document.getElementById('current-q-num');
const totalQNum = document.getElementById('total-q-num');
const currentScoreDisplay = document.getElementById('current-score');
const progressBar = document.getElementById('progress-bar');
const timerDisplayWrapper = document.getElementById('timer-display');
const timeRemainingDisplay = document.getElementById('time-remaining');

// Results Screen Elements
const highScoreDisplay = document.getElementById('high-score-display');
const totalQDisplay = document.getElementById('total-q-display');
const finalScoreVal = document.getElementById('final-score-val');
const finalTotalVal = document.getElementById('final-total-val');
const feedbackText = document.getElementById('feedback-text');
const selectedCourseTitle = document.getElementById('selected-course-title');

// State Variables
let selectedCourse = 'fcs206'; // default
let currentSessionQuestions = [];
let currentQuestionIndex = 0;
let score = 0;
let answered = false;

let timerInterval = null;
let timeRemaining = 0;
let isTimed = false;

// Audio Context
const AudioContext = window.AudioContext || window.webkitAudioContext;
let audioCtx = null;

function initAudio() {
    if (!audioCtx) {
        audioCtx = new AudioContext();
    }
}

function playTone(frequency, type, duration) {
    try {
        initAudio();
        if (audioCtx.state === 'suspended') audioCtx.resume();
        const oscillator = audioCtx.createOscillator();
        const gainNode = audioCtx.createGain();
        
        oscillator.type = type;
        oscillator.frequency.setValueAtTime(frequency, audioCtx.currentTime);
        gainNode.gain.setValueAtTime(0.1, audioCtx.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + duration);
        
        oscillator.connect(gainNode);
        gainNode.connect(audioCtx.destination);
        oscillator.start();
        oscillator.stop(audioCtx.currentTime + duration);
    } catch (e) {
        console.log("Audio play error:", e);
    }
}

function playCorrect() {
    playTone(600, 'sine', 0.1);
    setTimeout(() => playTone(800, 'sine', 0.2), 100);
}

function playWrong() { playTone(300, 'sawtooth', 0.3); }
function playTimeout() {
    playTone(400, 'square', 0.5);
    setTimeout(() => playTone(300, 'square', 0.8), 500);
}

// Navigation
function switchScreen(screen) {
    document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
    screen.classList.add('active');
    
    const mainContent = document.getElementById('main-content');
    if (mainContent) {
        mainContent.scrollTop = 0;
    }
    window.scrollTo(0, 0);
}

function shuffleArray(array) {
    const arr = [...array];
    for (let i = arr.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
}

// Timer Functions
function formatTime(seconds) {
    const m = Math.floor(seconds / 60).toString().padStart(2, '0');
    const s = (seconds % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
}

function startTimer() {
    if (timerInterval) clearInterval(timerInterval);
    timeRemainingDisplay.textContent = formatTime(timeRemaining);
    timerDisplayWrapper.style.display = 'flex';
    timerDisplayWrapper.classList.remove('danger');
    
    timerInterval = setInterval(() => {
        timeRemaining--;
        timeRemainingDisplay.textContent = formatTime(timeRemaining);
        if (timeRemaining <= 60) timerDisplayWrapper.classList.add('danger');
        if (timeRemaining <= 0) {
            clearInterval(timerInterval);
            handleTimeUp();
        }
    }, 1000);
}

function stopTimer() {
    if (timerInterval) clearInterval(timerInterval);
    timerDisplayWrapper.style.display = 'none';
    timerDisplayWrapper.classList.remove('danger');
}

function handleTimeUp() {
    playTimeout();
    alert("Time's up! Submitting your practice session now.");
    showResults();
}

// Select Course
function selectCourse(courseKey) {
    initAudio(); // Initialize audio on first click
    selectedCourse = courseKey;
    
    // Set course text
    let courseName = courseKey.toUpperCase();
    let courseFullName = "Practice Questions";
    
    if (courseKey === 'fcs206') {
        courseFullName = "Family & Consumer Science";
    } else if (courseKey === 'get202') {
        courseName = "GET 202";
        courseFullName = "Engineering Materials";
    } else if (courseKey === 'gst212') {
        courseName = "GST 212";
        courseFullName = "Logic, Philosophy & Human Existence";
    }
    
    selectedCourseTitle.textContent = `${courseName} Practice`;
    headerTitle.textContent = courseName;
    
    // Get question list
    const qList = questionsBank[courseKey] || [];
    totalQDisplay.textContent = qList.length;
    
    // Load high score
    const highScore = localStorage.getItem(`taired_highscore_${courseKey}`) || 0;
    highScoreDisplay.textContent = highScore;
    
    // Reset config inputs
    questionCountSelect.value = "20";
    timeLimitSelect.value = "0";
    customQCountInput.style.display = 'none';
    customTLimitInput.style.display = 'none';
    
    switchScreen(landingScreen);
}

// Start Quiz
function startQuiz() {
    const qList = questionsBank[selectedCourse] || [];
    if (qList.length === 0) {
        alert("No questions available for this course yet!");
        return;
    }
    
    let qCountStr = questionCountSelect.value;
    let qCount = qList.length;
    if (qCountStr === 'custom') {
        qCount = parseInt(customQCountInput.value, 10) || 20;
    } else if (qCountStr !== 'all') {
        qCount = parseInt(qCountStr, 10);
    }
    
    currentSessionQuestions = shuffleArray(qList).slice(0, Math.min(qCount, qList.length));
    currentQuestionIndex = 0;
    score = 0;
    
    totalQNum.textContent = currentSessionQuestions.length;
    currentScoreDisplay.textContent = score;
    
    let timeLimitStr = timeLimitSelect.value;
    let timeLimitMins = 0;
    if (timeLimitStr === 'custom') {
        timeLimitMins = parseInt(customTLimitInput.value, 10) || 0;
    } else {
        timeLimitMins = parseInt(timeLimitStr, 10);
    }
    
    if (timeLimitMins > 0) {
        isTimed = true;
        timeRemaining = timeLimitMins * 60;
        startTimer();
    } else {
        isTimed = false;
        stopTimer();
    }
    
    loadQuestion();
    switchScreen(quizScreen);
}

// Load Question
function loadQuestion() {
    answered = false;
    nextBtn.disabled = true;
    
    const q = currentSessionQuestions[currentQuestionIndex];
    currentQNum.textContent = currentQuestionIndex + 1;
    
    const progress = (currentQuestionIndex / currentSessionQuestions.length) * 100;
    progressBar.style.width = `${progress}%`;
    
    questionText.textContent = q.question;
    optionsContainer.innerHTML = '';
    
    if (q.type === 'typing') {
        optionsContainer.style.display = 'none';
        typingContainer.style.display = 'block';
        typingInput.value = '';
        typingInput.disabled = false;
        
        typingSubmitBtn.disabled = false;
        typingFeedback.style.display = 'none';
        
        typingSubmitBtn.onclick = () => submitTypingAnswer(q, typingSubmitBtn);
    } else {
        optionsContainer.style.display = 'grid';
        typingContainer.style.display = 'none';
        
        // Render options
    const opts = [];
    if (q.options && q.options.length > 0) {
        q.options.forEach((txt, i) => {
            const key = String.fromCharCode(97 + i); // a, b, c, d...
            opts.push({ key: key, text: txt });
        });
    } else {
        if (q.a) opts.push({ key: 'a', text: q.a });
        if (q.b) opts.push({ key: 'b', text: q.b });
        if (q.c) opts.push({ key: 'c', text: q.c });
        if (q.d) opts.push({ key: 'd', text: q.d });
        if (q.e) opts.push({ key: 'e', text: q.e });
    }
    
    const displayLetters = ['A', 'B', 'C', 'D', 'E', 'F'];
    
    opts.forEach((opt, index) => {
        const btn = document.createElement('button');
        btn.className = 'option-btn';
        btn.dataset.key = opt.key;
        btn.innerHTML = `<span class="opt-letter">${displayLetters[index] || opt.key.toUpperCase()}</span><span class="opt-text">${opt.text}</span>`;
        btn.addEventListener('click', () => selectAnswer(btn, opt.key, q));
        optionsContainer.appendChild(btn);
    });
    }
}

function submitTypingAnswer(q, btn) {
    if (answered) return;
    answered = true;
    
    const userInput = String(typingInput.value).trim().toLowerCase();
    const correctInput = String(q.correct).trim().toLowerCase();
    
    btn.disabled = true;
    typingInput.disabled = true;
    typingFeedback.style.display = 'block';
    
    if (userInput === correctInput) {
        score++;
        currentScoreDisplay.textContent = score;
        playCorrect();
        typingFeedback.textContent = "Correct! ✅";
        typingFeedback.style.color = "#10B981";
    } else {
        playWrong();
        typingFeedback.innerHTML = `Wrong ❌<br>Correct Answer: <span style="color: #10B981;">${q.correct}</span>`;
        typingFeedback.style.color = "#EF4444";
    }
    
    nextBtn.disabled = false;
}

function selectAnswer(btn, selectedKey, q) {
    if (answered) return;
    answered = true;
    
    let isCorrect = false;
    let correctKeys = [];
    
    if (Array.isArray(q.correct)) {
        correctKeys = q.correct.map(k => String(k).toLowerCase());
        isCorrect = correctKeys.includes(selectedKey.toLowerCase());
    } else {
        correctKeys = [String(q.correct).toLowerCase()];
        isCorrect = (selectedKey.toLowerCase() === correctKeys[0]);
    }
    
    const allBtns = document.querySelectorAll('.option-btn');
    
    allBtns.forEach(b => {
        b.classList.add('disabled');
        if (correctKeys.includes(b.dataset.key)) {
            b.classList.add('correct');
        }
    });
    
    if (isCorrect) {
        score++;
        currentScoreDisplay.textContent = score;
        playCorrect();
    } else {
        btn.classList.add('wrong');
        playWrong();
    }
    
    nextBtn.disabled = false;
}

// Next Question
function nextQuestion() {
    currentQuestionIndex++;
    if (currentQuestionIndex < currentSessionQuestions.length) {
        loadQuestion();
    } else {
        showResults();
    }
}

// Show Results
function showResults() {
    stopTimer();
    progressBar.style.width = '100%';
    
    finalScoreVal.textContent = score;
    finalTotalVal.textContent = currentSessionQuestions.length;
    
    const percentage = (score / currentSessionQuestions.length) * 100;
    
    if (percentage >= 80) {
        feedbackText.textContent = "Outstanding! You're definitely ready. 🌟";
    } else if (percentage >= 50) {
        feedbackText.textContent = "Good job! A little more practice and you'll ace it. 👍";
    } else {
        feedbackText.textContent = "Keep practicing! Don't give up. 💪";
    }
    
    // Save/Update high score
    const key = `taired_highscore_${selectedCourse}`;
    const currentHighScore = parseInt(localStorage.getItem(key), 10) || 0;
    if (score > currentHighScore) {
        localStorage.setItem(key, score);
        feedbackText.textContent += " NEW HIGH SCORE!";
        highScoreDisplay.textContent = score;
    }
    
    switchScreen(resultsScreen);
}

// Render course list dynamically
const coursesGrid = document.getElementById('courses-list');
const courseTitles = {
    'bio101': 'General Biology I',
    'bio102': 'General Biology II',
    'chm101': 'General Chemistry I',
    'chm102': 'General Chemistry II',
    'mth101': 'Elementary Mathematics I',
    'mth102': 'Elementary Mathematics II',
    'phy101': 'General Physics I',
    'phy102': 'General Physics II',
    'phy113': 'General Physics Laboratory I',
    'gst111': 'Communication in English I',
    'gst112': 'Communication in English II',
    'gst212': 'Peace and Conflict Resolution',
    'lib101': 'Use of Library',
    'get101': 'Introduction to Computing',
    'get202': 'Fundamentals of Entrepreneurship',
    'gns101': 'Use of English I',
    'gns102': 'Use of English II',
    'csc100': 'Introduction to Computer Science',
    'cse100': 'Introduction to Computer Engineering'
};

const filterBtns = document.querySelectorAll('.filter-btn');

function renderCourses(filter = 'all') {
    if (!coursesGrid || typeof questionsBank === 'undefined') return;
    coursesGrid.innerHTML = '';
    
    Object.keys(questionsBank).sort().forEach(courseKey => {
        const courseCode = courseKey.toUpperCase();
        
        // Filter logic: check if it matches 100 level (e.g. MTH101) or 200 level (e.g. MTH201)
        const is100Level = /\D1\d{2}/.test(courseCode);
        const is200Level = /\D2\d{2}/.test(courseCode);
        
        if (filter === '100' && !is100Level) return;
        if (filter === '200' && !is200Level) return;
        
        const title = courseTitles[courseKey.toLowerCase()] || 'PRACTICE QUESTIONS';
        
        const html = `
            <div class="course-card active-course" data-course="${courseKey}">
                <div class="course-icon" style="background: rgba(20, 184, 166, 0.2); color: var(--accent);">
                    <ion-icon name="document-text-outline"></ion-icon>
                </div>
                <div class="course-info">
                    <h3>${courseCode}</h3>
                    <p style="text-transform: uppercase; font-size: 0.8rem; letter-spacing: 0.5px;">${title}</p>
                    <span class="status-badge live">LIVE</span>
                </div>
                <ion-icon name="arrow-forward-outline" class="arrow-icon"></ion-icon>
            </div>
        `;
        coursesGrid.insertAdjacentHTML('beforeend', html);
    });

    // Reattach event listeners for dynamic cards
    document.querySelectorAll('.course-card.active-course').forEach(card => {
        card.addEventListener('click', () => {
            const course = card.getAttribute('data-course');
            selectCourse(course);
        });
    });
}

// Initial render
renderCourses();

// Filter button listeners
if (filterBtns.length > 0) {
    filterBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            filterBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            renderCourses(btn.getAttribute('data-filter'));
        });
    });
}

startBtn.addEventListener('click', startQuiz);
nextBtn.addEventListener('click', nextQuestion);
quitBtn.addEventListener('click', () => {
    if (confirm("Are you sure you want to quit the practice? Your current score will be evaluated.")) {
        showResults();
    }
});
restartBtn.addEventListener('click', startQuiz);

backToCoursesBtn.addEventListener('click', () => {
    headerTitle.textContent = "TAIRED CBT";
    switchScreen(courseSelectScreen);
});

exitToCoursesBtn.addEventListener('click', () => {
    headerTitle.textContent = "TAIRED CBT";
    switchScreen(courseSelectScreen);
});

shareBtn.addEventListener('click', () => {
    const courseName = selectedCourse.toUpperCase();
    const text = `I just scored ${score}/${currentSessionQuestions.length} on the ${courseName} CBT Practice! Can you beat my high score? Built by TAIRED.`;
    const url = window.location.href;
    const whatsappUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(text + " Try it here: " + url)}`;
    window.open(whatsappUrl, '_blank');
});

questionCountSelect.addEventListener('change', (e) => {
    if (e.target.value === 'custom') {
        customQCountInput.style.display = 'block';
    } else {
        customQCountInput.style.display = 'none';
    }
});

timeLimitSelect.addEventListener('change', (e) => {
    if (e.target.value === 'custom') {
        customTLimitInput.style.display = 'block';
    } else {
        customTLimitInput.style.display = 'none';
    }
});
