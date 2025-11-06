// Game State
let gameState = {
    currentScreen: 'intro',
    currentTeam: 'A',
    currentRound: 'countries',
    currentQuestionIndex: 0,
    teamAName: 'الفريق أ',
    teamBName: 'الفريق ب',
    teamAScore: 0,
    teamBScore: 0,
    timer: null,
    timeLeft: 30,
    currentQuestion: null,
    questionStartTime: null,
    rounds: ['countries', 'football', 'puzzles', 'speed'],
    currentRoundIndex: 0,
    // Enhanced stats
    correctAnswers: 0,
    totalAnswers: 0,
    quickAnswers: 0,
    totalTime: 0,
    roundScores: {
        countries: { A: 0, B: 0 },
        football: { A: 0, B: 0 },
        puzzles: { A: 0, B: 0 },
        speed: { A: 0, B: 0 }
    },
    inputLocked: false
};

// Leaderboard System
class LeaderboardManager {
    constructor() {
        this.entries = this.loadLeaderboard();
    }

    loadLeaderboard() {
        const stored = localStorage.getItem('triviaLeaderboard');
        return stored ? JSON.parse(stored) : [];
    }

    saveLeaderboard() {
        localStorage.setItem('triviaLeaderboard', JSON.stringify(this.entries));
    }

    addEntry(teamName, score, stats) {
        const entry = {
            id: Date.now(),
            teamName: teamName,
            score: score,
            stats: stats,
            date: new Date().toLocaleDateString('ar-SA'),
            timestamp: Date.now()
        };

        this.entries.push(entry);
        this.entries.sort((a, b) => b.score - a.score);
        this.entries = this.entries.slice(0, 10); // Keep top 10
        this.saveLeaderboard();
    }

    getTopEntries(limit = 5) {
        return this.entries.slice(0, limit);
    }
}

const leaderboardManager = new LeaderboardManager();

// Editor State
let editorState = {
    currentCategory: 'countries',
    currentQuestionId: null,
    isEditing: false
};

// --- NEW: Fullscreen Function ---
function toggleFullScreen() {
    if (!document.fullscreenElement) {
        document.documentElement.requestFullscreen().catch(err => {
            alert(`خطأ في تفعيل وضع ملء الشاشة: ${err.message}`);
        });
    } else {
        if (document.exitFullscreen) {
            document.exitFullscreen();
        }
    }
}


// Screen Management
function showScreen(screenId) {
    document.querySelectorAll('.screen').forEach(screen => {
        screen.classList.remove('active');
    });
    document.getElementById(screenId + 'Screen').classList.add('active');
    gameState.currentScreen = screenId;
}

// Game Functions
function startGame() {
    gameState.teamAName = document.getElementById('teamA').value || 'الفريق أ';
    gameState.teamBName = document.getElementById('teamB').value || 'الفريق ب';

    document.getElementById('teamAName').textContent = gameState.teamAName;
    document.getElementById('teamBName').textContent = gameState.teamBName;

    showScreen('instructions');
}

function showInstructions() {
    showScreen('game');
    startNewRound();
}

function startNewRound() {
    gameState.currentQuestionIndex = 0;
    gameState.currentRound = gameState.rounds[gameState.currentRoundIndex];
    updateRoundIndicator();
    updateTeamIndicator();
    loadQuestion();
}

function updateRoundIndicator() {
    const roundNames = {
        'countries': 'جولة الدول',
        'football': 'جولة كرة القدم',
        'puzzles': 'جولة الألغاز',
        'speed': 'جولة السرعة'
    };

    const roundIcons = {
        'countries': '🌍',
        'football': '⚽',
        'puzzles': '❓',
        'speed': '🕒'
    };

    document.getElementById('roundName').textContent = roundNames[gameState.currentRound];
    document.getElementById('roundIcon').textContent = roundIcons[gameState.currentRound];
}

function updateTeamIndicator() {
    const teamAScoreboard = document.getElementById('teamAScore');
    const teamBScoreboard = document.getElementById('teamBScore');

    if (gameState.currentTeam === 'A') {
        teamAScoreboard.classList.add('active');
        teamBScoreboard.classList.remove('active');
    } else {
        teamBScoreboard.classList.add('active');
        teamAScoreboard.classList.remove('active');
    }
}


function loadQuestion() {
    const questions = questionsDatabase[gameState.currentRound];

    if (gameState.currentQuestionIndex >= questions.length) {
        nextRound();
        return;
    }

    gameState.currentQuestion = questions[gameState.currentQuestionIndex];
    gameState.questionStartTime = Date.now();
    gameState.inputLocked = false;

    document.getElementById('questionText').textContent = gameState.currentQuestion.question;

    const optionsContainer = document.getElementById('optionsContainer');
    optionsContainer.innerHTML = '';

    gameState.currentQuestion.options.forEach((option, index) => {
        const optionElement = document.createElement('div');
        optionElement.className = 'option';
        const span = document.createElement('span');
        span.textContent = option;
        optionElement.appendChild(span);
        optionElement.onclick = () => {
            if (gameState.inputLocked) return;
            selectAnswer(index);
        };
        optionsContainer.appendChild(optionElement);
    });

    document.getElementById('nextQuestionBtn').classList.add('hidden');

    startTimer();
}

function selectAnswer(answerIndex) {
    stopTimer();
    if (gameState.inputLocked) return;
    gameState.inputLocked = true;

    const timeTaken = (Date.now() - gameState.questionStartTime) / 1000;
    gameState.totalAnswers++;
    gameState.totalTime += timeTaken;

    const options = document.querySelectorAll('.option');
    const isCorrect = answerIndex === gameState.currentQuestion.correct;

    options.forEach((option, index) => {
        option.onclick = null;
        if (index === gameState.currentQuestion.correct) {
            option.classList.add('correct');
        } else if (index === answerIndex && !isCorrect) {
            option.classList.add('incorrect');
        }
    });

    let points = 0;
    if (isCorrect) {
        gameState.correctAnswers++;
        points = 1;

        if (timeTaken < 10) {
            points = 2;
            gameState.quickAnswers++;
            particleSystem.createCelebration('إجابة سريعة! ⚡');
        }
        
        gameState.roundScores[gameState.currentRound][gameState.currentTeam] += points;

        if (gameState.currentTeam === 'A') {
            gameState.teamAScore += points;
            updateScore('A', gameState.teamAScore);
        } else {
            gameState.teamBScore += points;
            updateScore('B', gameState.teamBScore);
        }
    } else if (answerIndex !== -1) {
        particleSystem.createCelebration('للأسف، إجابة خاطئة');
    }

    setTimeout(() => {
        gameState.currentTeam = gameState.currentTeam === 'A' ? 'B' : 'A';
        updateTeamIndicator();
        document.getElementById('nextQuestionBtn').classList.remove('hidden');
    }, 1200);
}

function nextQuestion() {
    gameState.currentQuestionIndex++;
    loadQuestion();
}

function nextRound() {
    gameState.currentRoundIndex++;
    if (gameState.currentRoundIndex >= gameState.rounds.length) {
        showResults();
    } else {
        startNewRound();
    }
}

function updateScore(team, totalScore) {
    const scoreElement = document.getElementById(`team${team}ScoreValue`);
    scoreElement.textContent = totalScore;
    scoreElement.classList.add('updating');
    setTimeout(() => scoreElement.classList.remove('updating'), 500);
}


function updateTeamRanking(elementId, badgeId, rank) {
    const element = document.getElementById(elementId);
    const badge = document.getElementById(badgeId);

    element.classList.remove('rank-1', 'rank-2', 'rank-3');
    badge.classList.remove('rank-1', 'rank-2', 'rank-3');

    if (rank > 0) {
        element.classList.add(`rank-${rank}`);
        badge.textContent = rank;
        badge.classList.add(`rank-${rank}`);
    } else {
        badge.textContent = '=';
    }
}

function updateGameStatistics() {
    const averageTime = gameState.totalAnswers > 0 ?
        (gameState.totalTime / gameState.totalAnswers).toFixed(1) : 0;

    const bestRound = Object.keys(gameState.roundScores).reduce((best, round) => {
        const bestScore = (gameState.roundScores[best].A || 0) + (gameState.roundScores[best].B || 0);
        const currentScore = (gameState.roundScores[round].A || 0) + (gameState.roundScores[round].B || 0);
        return currentScore > bestScore ? round : best;
    }, 'countries');

    const roundNames = {
        'countries': 'الدول 🌍',
        'football': 'كرة القدم ⚽',
        'puzzles': 'الألغاز ❓',
        'speed': 'السرعة 🕒'
    };

    document.getElementById('correctAnswers').textContent = gameState.correctAnswers;
    document.getElementById('averageTime').textContent = `${averageTime} ثانية`;
    document.getElementById('bestRound').textContent = roundNames[bestRound];
    document.getElementById('quickAnswers').textContent = gameState.quickAnswers;
}

function updateLeaderboardDisplay() {
    const leaderboardList = document.getElementById('leaderboardList');
    const topEntries = leaderboardManager.getTopEntries(5);

    leaderboardList.innerHTML = '';

    if (topEntries.length === 0) {
        leaderboardList.innerHTML = '<div style="text-align: center; color: #999; padding: 20px;">لا توجد نتائج محفوظة بعد</div>';
        return;
    }

    topEntries.forEach((entry, index) => {
        const leaderboardEntry = document.createElement('div');
        leaderboardEntry.className = 'leaderboard-entry-item';
        leaderboardEntry.innerHTML = `
            <div class="leaderboard-rank">${index + 1}</div>
            <div class="leaderboard-info">
                <div class="leaderboard-name">${entry.teamName}</div>
                <div class="leaderboard-details">
                    ${entry.stats?.correctAnswers || 0} إجابات صحيحة • ${entry.date}
                </div>
            </div>
            <div class="leaderboard-score">${entry.score}</div>
        `;
        leaderboardList.appendChild(leaderboardEntry);
    });
}

function saveToLeaderboard() {
    const winnerTeam = gameState.teamAScore > gameState.teamBScore ? gameState.teamAName :
                      gameState.teamBScore > gameState.teamAScore ? gameState.teamBName :
                      `${gameState.teamAName} و ${gameState.teamBName}`;

    const winnerScore = Math.max(gameState.teamAScore, gameState.teamBScore);

    const stats = {
        correctAnswers: gameState.correctAnswers,
        totalAnswers: gameState.totalAnswers,
        quickAnswers: gameState.quickAnswers,
        averageTime: gameState.totalAnswers > 0 ?
            (gameState.totalTime / gameState.totalAnswers).toFixed(1) : 0,
        rounds: gameState.roundScores
    };

    leaderboardManager.addEntry(winnerTeam, winnerScore, stats);
    updateLeaderboardDisplay();
    particleSystem.createCelebration('تم الحفظ بنجاح! 💾');
}

function enhanceTitleAnimations() {
    document.querySelectorAll('.game-title').forEach(title => {
        title.setAttribute('data-text', title.textContent);
    });
}

function startTimer() {
    gameState.timeLeft = 30;
    updateTimerDisplay();
    if (gameState.timer) clearInterval(gameState.timer);
    gameState.timer = setInterval(() => {
        gameState.timeLeft--;
        updateTimerDisplay();
        if (gameState.timeLeft <= 5) {
            document.getElementById('timerCircle').classList.add('warning');
        }
        if (gameState.timeLeft <= 0) {
            stopTimer();
            if (!gameState.inputLocked) {
                selectAnswer(-1); // Time's up
            }
        }
    }, 1000);
}

function stopTimer() {
    if (gameState.timer) clearInterval(gameState.timer);
    gameState.timer = null;
    document.getElementById('timerCircle').classList.remove('warning');
}

function updateTimerDisplay() {
    document.getElementById('timerText').textContent = gameState.timeLeft;
    const progress = ((30 - gameState.timeLeft) / 30) * 360;
    document.getElementById('timerCircle').style.setProperty('--progress', `${progress}deg`);
}

// Editor Functions
function showEditor() {
    showScreen('editor');
    showEditorCategory('countries', document.querySelector('.editor-tab'));
}

function backToGame() {
    if (gameState.totalAnswers > 0) {
        showScreen('results');
    } else {
        showScreen('intro');
    }
}

function showEditorCategory(category, el) {
    editorState.currentCategory = category;
    editorState.isEditing = false;
    editorState.currentQuestionId = null;

    document.querySelectorAll('.editor-tab').forEach(tab => tab.classList.remove('active'));
    if (el) el.classList.add('active');

    updateQuestionList();
    clearQuestionForm();
}

function updateQuestionList() {
    const questionList = document.getElementById('questionList');
    questionList.innerHTML = '';
    const questions = questionsDatabase[editorState.currentCategory];
    questions.forEach((q) => {
        const item = document.createElement('div');
        item.className = 'question-item';
        item.textContent = q.question;
        item.onclick = () => loadQuestionToForm(q.id);
        questionList.appendChild(item);
    });
}

function loadQuestionToForm(questionId) {
    const question = questionsDatabase[editorState.currentCategory].find(q => q.id === questionId);
    if (question) {
        editorState.isEditing = true;
        editorState.currentQuestionId = questionId;

        document.getElementById('questionTextInput').value = question.question;
        ['option1Input', 'option2Input', 'option3Input', 'option4Input'].forEach((id, i) => {
            document.getElementById(id).value = question.options[i];
        });
        document.getElementById('correctAnswerSelect').value = question.correct;

        document.querySelectorAll('.question-item').forEach(item => {
            item.classList.toggle('selected', item.textContent === question.question);
        });
    }
}

function saveQuestion() {
    const questionText = document.getElementById('questionTextInput').value.trim();
    const options = [
        document.getElementById('option1Input').value.trim(),
        document.getElementById('option2Input').value.trim(),
        document.getElementById('option3Input').value.trim(),
        document.getElementById('option4Input').value.trim()
    ];
    const correctAnswer = parseInt(document.getElementById('correctAnswerSelect').value);

    if (!questionText || options.some(opt => !opt)) {
        alert('يرجى ملء جميع الحقول!');
        return;
    }

    const questions = questionsDatabase[editorState.currentCategory];
    if (editorState.isEditing && editorState.currentQuestionId) {
        const index = questions.findIndex(q => q.id === editorState.currentQuestionId);
        if (index !== -1) {
            questions[index] = { ...questions[index], question: questionText, options, correct: correctAnswer };
        }
    } else {
        questions.push({
            id: `${editorState.currentCategory}_${Date.now()}`,
            question: questionText, options, correct: correctAnswer,
            icon: questions[0]?.icon || '❓'
        });
    }

    saveQuestionsToStorage();
    updateQuestionList();
    clearQuestionForm();
    alert('تم حفظ السؤال بنجاح!');
}

function addNewQuestion() {
    clearQuestionForm();
}

function deleteQuestion() {
    if (!editorState.isEditing || !editorState.currentQuestionId) {
        alert('يرجى اختيار سؤال للحذف!');
        return;
    }

    if (confirm('هل أنت متأكد من حذف هذا السؤال؟')) {
        let questions = questionsDatabase[editorState.currentCategory];
        questionsDatabase[editorState.currentCategory] = questions.filter(q => q.id !== editorState.currentQuestionId);
        saveQuestionsToStorage();
        updateQuestionList();
        clearQuestionForm();
        alert('تم حذف السؤال بنجاح!');
    }
}

function clearQuestionForm() {
    document.getElementById('questionTextInput').value = '';
    ['option1Input', 'option2Input', 'option3Input', 'option4Input'].forEach(id => document.getElementById(id).value = '');
    document.getElementById('correctAnswerSelect').value = '0';
    editorState.isEditing = false;
    editorState.currentQuestionId = null;
    document.querySelectorAll('.question-item').forEach(item => item.classList.remove('selected'));
}

function resetToDefault() {
    if (confirm('هل أنت متأكد؟ سيتم فقدان جميع التعديلات!')) {
        questionsDatabase = getDefaultQuestions();
        saveQuestionsToStorage();
        updateQuestionList();
        clearQuestionForm();
        alert('تم استعادة الأسئلة الافتراضية!');
    }
}

// Storage Functions
function saveQuestionsToStorage() {
    localStorage.setItem('triviaQuestions', JSON.stringify(questionsDatabase));
}

function loadQuestionsFromStorage() {
    const stored = localStorage.getItem('triviaQuestions');
    try {
        if (stored) questionsDatabase = JSON.parse(stored);
    } catch (e) {
        console.error('Error loading questions:', e);
    }
}

function exportQuestions() {
    const dataStr = `data:text/json;charset=utf-8,${encodeURIComponent(JSON.stringify(questionsDatabase, null, 2))}`;
    const downloadAnchorNode = document.createElement('a');
    downloadAnchorNode.setAttribute("href", dataStr);
    downloadAnchorNode.setAttribute("download", "trivia_questions.json");
    document.body.appendChild(downloadAnchorNode);
    downloadAnchorNode.click();
    downloadAnchorNode.remove();
}

function importQuestions() {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = e => {
        const file = e.target.files[0];
        const reader = new FileReader();
        reader.onload = readerEvent => {
            try {
                const imported = JSON.parse(readerEvent.target.result);
                if (confirm('هل تريد استبدال الأسئلة الحالية؟')) {
                    questionsDatabase = imported;
                    saveQuestionsToStorage();
                    updateQuestionList();
                    alert('تم استيراد الأسئلة بنجاح!');
                }
            } catch (error) {
                alert('خطأ في قراءة الملف!');
            }
        };
        reader.readAsText(file);
    };
    input.click();
}

// Particle Effects System
class ParticleSystem {
    constructor() {
        this.particleContainer = document.getElementById('particleLayer');
    }
    createCelebration(text) {
        const celebration = document.createElement('div');
        celebration.className = 'celebration-text';
        celebration.textContent = text;
        document.body.appendChild(celebration);
        setTimeout(() => celebration.remove(), 2000);
    }
}
const particleSystem = new ParticleSystem();

function resetGame() {
    Object.assign(gameState, {
        currentScreen: 'intro', currentTeam: 'A', currentRoundIndex: 0,
        teamAScore: 0, teamBScore: 0, correctAnswers: 0, totalAnswers: 0,
        quickAnswers: 0, totalTime: 0,
        roundScores: { countries: {A:0,B:0}, football: {A:0,B:0}, puzzles: {A:0,B:0}, speed: {A:0,B:0} }
    });
    document.getElementById('teamAScoreValue').textContent = '0';
    document.getElementById('teamBScoreValue').textContent = '0';
    document.getElementById('teamA').value = 'الفريق أ';
    document.getElementById('teamB').value = 'الفريق ب';
    showScreen('intro');
}

function showResults() {
    showScreen('results');
    document.getElementById('finalTeamAName').textContent = gameState.teamAName;
    document.getElementById('finalTeamBName').textContent = gameState.teamBName;
    document.getElementById('finalTeamAScore').textContent = gameState.teamAScore;
    document.getElementById('finalTeamBScore').textContent = gameState.teamBScore;
    updateLeaderboardDisplay();
    updateGameStatistics();

    const winnerAnnouncement = document.getElementById('winnerAnnouncement');
    if (gameState.teamAScore > gameState.teamBScore) {
        winnerAnnouncement.textContent = `🏆 ${gameState.teamAName} هو الفريق الفائز! 🏆`;
        updateTeamRanking('teamALeaderboard', 'teamARank', 1);
        updateTeamRanking('teamBLeaderboard', 'teamBRank', 2);
    } else if (gameState.teamBScore > gameState.teamAScore) {
        winnerAnnouncement.textContent = `🏆 ${gameState.teamBName} هو الفريق الفائز! 🏆`;
        updateTeamRanking('teamALeaderboard', 'teamARank', 2);
        updateTeamRanking('teamBLeaderboard', 'teamBRank', 1);
    } else {
        winnerAnnouncement.textContent = `🏆 تعادل! 🏆`;
        updateTeamRanking('teamALeaderboard', 'teamARank', 0);
        updateTeamRanking('teamBLeaderboard', 'teamBRank', 0);
    }
}

function handleErrors() {
    window.addEventListener('error', (e) => console.error('Game Error:', e.error));
    window.addEventListener('unhandledrejection', (e) => console.error('Unhandled Promise Rejection:', e.reason));
}

function init() {
    loadQuestionsFromStorage();
    showScreen('intro');
    enhanceTitleAnimations();
    handleErrors();
}

window.onload = init;