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
    correctAnswers: 0,
    totalAnswers: 0,
    quickAnswers: 0,
    totalTime: 0,
    roundScores: { countries: { A: 0, B: 0 }, football: { A: 0, B: 0 }, puzzles: { A: 0, B: 0 }, speed: { A: 0, B: 0 } },
    inputLocked: false
};

// --- Leaderboard System with Clear Functionality ---
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
        const entry = { id: Date.now(), teamName, score, stats, date: new Date().toLocaleDateString('ar-SA') };
        this.entries.push(entry);
        this.entries.sort((a, b) => b.score - a.score);
        this.entries = this.entries.slice(0, 10);
        this.saveLeaderboard();
    }
    
    getTopEntries(limit = 5) {
        return this.entries.slice(0, limit);
    }

    // NEW: Method to clear the leaderboard
    clear() {
        this.entries = [];
        localStorage.removeItem('triviaLeaderboard');
    }
}

const leaderboardManager = new LeaderboardManager();

// NEW: Function to handle clearing the leaderboard from the UI
function clearLeaderboard() {
    if (confirm('هل أنت متأكد من حذف سجل لوحة الصدارة بالكامل؟ لا يمكن التراجع عن هذا الإجراء.')) {
        leaderboardManager.clear();
        updateLeaderboardDisplay();
        alert('تم مسح سجل لوحة الصدارة بنجاح.');
    }
}

// Editor State
let editorState = { currentCategory: 'countries', currentQuestionId: null, isEditing: false };

function toggleFullScreen() {
    if (!document.fullscreenElement) {
        document.documentElement.requestFullscreen().catch(err => alert(`خطأ: ${err.message}`));
    } else if (document.exitFullscreen) {
        document.exitFullscreen();
    }
}

function showScreen(screenId) {
    document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
    document.getElementById(screenId + 'Screen').classList.add('active');
    gameState.currentScreen = screenId;
}

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
    const names = { countries: 'جولة الدول', football: 'جولة كرة القدم', puzzles: 'جولة الألغاز', speed: 'جولة السرعة' };
    const icons = { countries: '🌍', football: '⚽', puzzles: '❓', speed: '🕒' };
    document.getElementById('roundName').textContent = names[gameState.currentRound];
    document.getElementById('roundIcon').textContent = icons[gameState.currentRound];
}

function updateTeamIndicator() {
    document.getElementById('teamAScore').classList.toggle('active', gameState.currentTeam === 'A');
    document.getElementById('teamBScore').classList.toggle('active', gameState.currentTeam === 'B');
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
        const optEl = document.createElement('div');
        optEl.className = 'option';
        optEl.textContent = option;
        optEl.onclick = () => !gameState.inputLocked && selectAnswer(index);
        optionsContainer.appendChild(optEl);
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
    const isCorrect = answerIndex === gameState.currentQuestion.correct;
    document.querySelectorAll('.option').forEach((opt, idx) => {
        opt.onclick = null;
        if (idx === gameState.currentQuestion.correct) opt.classList.add('correct');
        else if (idx === answerIndex && !isCorrect) opt.classList.add('incorrect');
    });

    if (isCorrect) {
        let points = 1;
        gameState.correctAnswers++;
        if (timeTaken < 10) {
            points = 2;
            gameState.quickAnswers++;
            particleSystem.createCelebration('إجابة سريعة! ⚡');
        }
        gameState.roundScores[gameState.currentRound][gameState.currentTeam] += points;
        if (gameState.currentTeam === 'A') gameState.teamAScore += points; else gameState.teamBScore += points;
        updateScore(gameState.currentTeam, gameState.currentTeam === 'A' ? gameState.teamAScore : gameState.teamBScore);
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
    if (gameState.currentRoundIndex >= gameState.rounds.length) showResults();
    else startNewRound();
}

function updateScore(team, totalScore) {
    const scoreEl = document.getElementById(`team${team}ScoreValue`);
    scoreEl.textContent = totalScore;
    scoreEl.classList.add('updating');
    setTimeout(() => scoreEl.classList.remove('updating'), 500);
}

function updateTeamRanking(elementId, badgeId, rank) {
    const el = document.getElementById(elementId);
    const badge = document.getElementById(badgeId);
    el.classList.remove('rank-1', 'rank-2');
    badge.classList.remove('rank-1', 'rank-2');
    if (rank > 0) {
        el.classList.add(`rank-${rank}`);
        badge.textContent = rank;
        badge.classList.add(`rank-${rank}`);
    } else {
        badge.textContent = '=';
    }
}

function updateGameStatistics() {
    const avgTime = gameState.totalAnswers > 0 ? (gameState.totalTime / gameState.totalAnswers).toFixed(1) : 0;
    const bestRound = Object.keys(gameState.roundScores).reduce((a, b) => (gameState.roundScores[a].A + gameState.roundScores[a].B > gameState.roundScores[b].A + gameState.roundScores[b].B ? a : b));
    const roundNames = { countries: 'الدول 🌍', football: 'كرة القدم ⚽', puzzles: 'الألغاز ❓', speed: 'السرعة 🕒' };
    document.getElementById('correctAnswers').textContent = gameState.correctAnswers;
    document.getElementById('averageTime').textContent = `${avgTime} ثانية`;
    document.getElementById('bestRound').textContent = roundNames[bestRound];
    document.getElementById('quickAnswers').textContent = gameState.quickAnswers;
}

function updateLeaderboardDisplay() {
    const list = document.getElementById('leaderboardList');
    list.innerHTML = '';
    const entries = leaderboardManager.getTopEntries(5);
    if (entries.length === 0) {
        list.innerHTML = '<div style="text-align: center; color: #999; padding: 20px;">لا توجد نتائج محفوظة بعد</div>';
        return;
    }
    entries.forEach((entry, index) => {
        const item = document.createElement('div');
        item.className = 'leaderboard-entry-item'; // Re-use style from results
        item.innerHTML = `<div class="leaderboard-rank">${index + 1}</div><div class="leaderboard-info"><div class="leaderboard-name">${entry.teamName}</div><div class="leaderboard-details">${entry.stats.correctAnswers || 0} إجابات صحيحة • ${entry.date}</div></div><div class="leaderboard-score">${entry.score}</div>`;
        list.appendChild(item);
    });
}

function saveToLeaderboard() {
    const winnerScore = Math.max(gameState.teamAScore, gameState.teamBScore);
    const winnerTeam = gameState.teamAScore > gameState.teamBScore ? gameState.teamAName : gameState.teamBScore > gameState.teamAScore ? gameState.teamBName : `${gameState.teamAName} و ${gameState.teamBName}`;
    const stats = { correctAnswers: gameState.correctAnswers, quickAnswers: gameState.quickAnswers };
    leaderboardManager.addEntry(winnerTeam, winnerScore, stats);
    updateLeaderboardDisplay();
    particleSystem.createCelebration('تم الحفظ بنجاح! 💾');
}

function startTimer() {
    gameState.timeLeft = 30;
    updateTimerDisplay();
    if (gameState.timer) clearInterval(gameState.timer);
    gameState.timer = setInterval(() => {
        gameState.timeLeft--;
        updateTimerDisplay();
        if (gameState.timeLeft <= 5) document.getElementById('timerCircle').classList.add('warning');
        if (gameState.timeLeft <= 0) {
            stopTimer();
            if (!gameState.inputLocked) selectAnswer(-1);
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

function showResults() {
    showScreen('results');
    document.getElementById('finalTeamAName').textContent = gameState.teamAName;
    document.getElementById('finalTeamBName').textContent = gameState.teamBName;
    document.getElementById('finalTeamAScore').textContent = gameState.teamAScore;
    document.getElementById('finalTeamBScore').textContent = gameState.teamBScore;
    updateLeaderboardDisplay();
    updateGameStatistics();
    const ann = document.getElementById('winnerAnnouncement');
    if (gameState.teamAScore > gameState.teamBScore) {
        ann.textContent = `🏆 ${gameState.teamAName} هو الفريق الفائز! 🏆`;
        updateTeamRanking('teamALeaderboard', 'teamARank', 1); updateTeamRanking('teamBLeaderboard', 'teamBRank', 2);
    } else if (gameState.teamBScore > gameState.teamAScore) {
        ann.textContent = `🏆 ${gameState.teamBName} هو الفريق الفائز! 🏆`;
        updateTeamRanking('teamALeaderboard', 'teamARank', 2); updateTeamRanking('teamBLeaderboard', 'teamBRank', 1);
    } else {
        ann.textContent = '🏆 تعادل! 🏆';
        updateTeamRanking('teamALeaderboard', 'teamARank', 0); updateTeamRanking('teamBLeaderboard', 'teamBRank', 0);
    }
}

// (Rest of the script: Editor, Storage, Particles, Init... remains the same as the previous good version)
class ParticleSystem { constructor() { this.pC = document.getElementById('particleLayer'); } createCelebration(t) { const c = document.createElement('div'); c.className = 'celebration-text'; c.textContent = t; document.body.appendChild(c); setTimeout(() => c.remove(), 2000); } }
const particleSystem = new ParticleSystem();
function resetGame() { Object.assign(gameState, { currentScreen:'intro', currentTeam:'A', currentRoundIndex:0, teamAScore:0, teamBScore:0, correctAnswers:0, totalAnswers:0, quickAnswers:0, totalTime:0, roundScores:{countries:{A:0,B:0},football:{A:0,B:0},puzzles:{A:0,B:0},speed:{A:0,B:0}} }); document.getElementById('teamAScoreValue').textContent = '0'; document.getElementById('teamBScoreValue').textContent = '0'; showScreen('intro'); }
function showEditor() { showScreen('editor'); showEditorCategory('countries', document.querySelector('.editor-tab')); }
function backToGame() { if (gameState.totalAnswers > 0) showResults(); else showScreen('intro'); }
function showEditorCategory(cat, el) { editorState.currentCategory = cat; document.querySelectorAll('.editor-tab').forEach(t => t.classList.remove('active')); if (el) el.classList.add('active'); updateQuestionList(); clearQuestionForm(); }
function updateQuestionList() { const ql = document.getElementById('questionList'); ql.innerHTML = ''; questionsDatabase[editorState.currentCategory].forEach(q => { const i = document.createElement('div'); i.className = 'question-item'; i.textContent = q.question; i.onclick = () => loadQuestionToForm(q.id); ql.appendChild(i); }); }
function loadQuestionToForm(id) { const q = questionsDatabase[editorState.currentCategory].find(q => q.id === id); if (q) { editorState.isEditing = true; editorState.currentQuestionId = id; document.getElementById('questionTextInput').value = q.question; ['option1Input','option2Input','option3Input','option4Input'].forEach((el, i) => document.getElementById(el).value = q.options[i]); document.getElementById('correctAnswerSelect').value = q.correct; document.querySelectorAll('.question-item').forEach(i => i.classList.toggle('selected', i.textContent === q.question)); } }
function saveQuestion() { const txt = document.getElementById('questionTextInput').value.trim(); const opts = [document.getElementById('option1Input').value.trim(), document.getElementById('option2Input').value.trim(), document.getElementById('option3Input').value.trim(), document.getElementById('option4Input').value.trim()]; const correct = parseInt(document.getElementById('correctAnswerSelect').value); if (!txt || opts.some(o => !o)) return alert('يرجى ملء جميع الحقول!'); const questions = questionsDatabase[editorState.currentCategory]; if (editorState.isEditing && editorState.currentQuestionId) { const i = questions.findIndex(q => q.id === editorState.currentQuestionId); if (i !== -1) Object.assign(questions[i], { question: txt, options: opts, correct }); } else { questions.push({ id: `${editorState.currentCategory}_${Date.now()}`, question: txt, options: opts, correct, icon: '❓' }); } saveQuestionsToStorage(); updateQuestionList(); clearQuestionForm(); alert('تم الحفظ!'); }
function addNewQuestion() { clearQuestionForm(); }
function deleteQuestion() { if (!editorState.isEditing || !editorState.currentQuestionId) return alert('اختر سؤالاً للحذف'); if (confirm('هل أنت متأكد؟')) { questionsDatabase[editorState.currentCategory] = questionsDatabase[editorState.currentCategory].filter(q => q.id !== editorState.currentQuestionId); saveQuestionsToStorage(); updateQuestionList(); clearQuestionForm(); alert('تم الحذف'); } }
function clearQuestionForm() { document.getElementById('questionTextInput').value = ''; ['option1Input','option2Input','option3Input','option4Input'].forEach(el => document.getElementById(el).value = ''); document.getElementById('correctAnswerSelect').value = '0'; editorState.isEditing = false; editorState.currentQuestionId = null; document.querySelectorAll('.question-item').forEach(i => i.classList.remove('selected')); }
function resetToDefault() { if (confirm('هل أنت متأكد؟ ستفقد التعديلات.')) { questionsDatabase = getDefaultQuestions(); saveQuestionsToStorage(); updateQuestionList(); clearQuestionForm(); alert('تمت الاستعادة'); } }
function saveQuestionsToStorage() { localStorage.setItem('triviaQuestions', JSON.stringify(questionsDatabase)); }
function loadQuestionsFromStorage() { const s = localStorage.getItem('triviaQuestions'); try { if (s) questionsDatabase = JSON.parse(s); } catch (e) { console.error('Error loading questions:', e); } }
function exportQuestions() { const a = document.createElement('a'); a.href = `data:text/json;charset=utf-8,${encodeURIComponent(JSON.stringify(questionsDatabase, null, 2))}`; a.download = 'trivia_questions.json'; a.click(); }
function importQuestions() { const i = document.createElement('input'); i.type = 'file'; i.accept = '.json'; i.onchange = e => { const f = e.target.files[0]; const r = new FileReader(); r.onload = re => { try { const imp = JSON.parse(re.target.result); if (confirm('استبدال الأسئلة الحالية؟')) { questionsDatabase = imp; saveQuestionsToStorage(); updateQuestionList(); alert('تم الاستيراد'); } } catch (err) { alert('ملف غير صالح'); } }; r.readAsText(f); }; i.click(); }
function init() { loadQuestionsFromStorage(); showScreen('intro'); document.querySelectorAll('.game-title').forEach(t => t.setAttribute('data-text', t.textContent)); window.addEventListener('error', e => console.error('Error:', e.error)); }
window.onload = init;