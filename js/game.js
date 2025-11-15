document.addEventListener('DOMContentLoaded', async () => {
    // Intro Screen
    const introContainer = document.getElementById('intro-container');
    const startTeamsBtn = document.getElementById('start-teams-btn');

    // Team Creation
    const teamCreationContainer = document.getElementById('team-creation-container');
    const teamNameInput = document.getElementById('team-name-input');
    const addTeamBtn = document.getElementById('add-team-btn');
    const teamsList = document.getElementById('teams-list');
    const startGameBtn = document.getElementById('start-game-btn');

    // Game
    const gameContainer = document.getElementById('game-container');
    const compactLeaderboard = document.getElementById('compact-leaderboard');
    const currentTeamTurn = document.getElementById('current-team-turn');
    const currentTeamScore = document.getElementById('current-team-score');
    const progressBar = document.getElementById('progress-bar');
    const questionText = document.getElementById('question-text');
    const optionsList = document.getElementById('options-list');
    const skipTeamBtn = document.getElementById('skip-team-btn');
    const nextBtn = document.getElementById('next-btn');
    const currentQuestionSpan = document.getElementById('current-question');
    const totalQuestionsSpan = document.getElementById('total-questions');
    const timerElement = document.getElementById('timer');
    const timerContainer = document.querySelector('.timer-container');

    // End of Game
    const endGameContainer = document.getElementById('end-game-container');
    const winnerAnnouncement = document.getElementById('winner-announcement');
    const celebration = document.getElementById('celebration');
    const finalScores = document.getElementById('final-scores');
    const restartBtn = document.getElementById('restart-btn');

    let teams = [];
    let currentTeamIndex = 0;
    let currentQuestionIndex = 0;
    let allQuestions = [];
    let teamQuestionCounts = []; // Track how many questions each team has answered
    let teamQuestionAssignments = []; // Track which questions each team should answer
    
    // Timer variables
    let timer;
    let timeLeft = 30; // 30 seconds per question
    const totalTime = 30;

    // Load questions from Firestore
    async function loadQuestions() {
        try {
            const snapshot = await db.collection('questions').orderBy('order', 'asc').get();
            if (snapshot.empty) {
                alert('No questions found in the database. Please use the question editor to add questions.');
                allQuestions = [];
            } else {
                allQuestions = snapshot.docs.map(doc => doc.data());
            }
        } catch (error) {
            console.error('Error loading questions from Firestore:', error);
            alert('Error loading questions. Please check your internet connection.');
            allQuestions = [];
        }
    }

    await loadQuestions();

    // Intro screen button
    startTeamsBtn.addEventListener('click', () => {
        switchView(introContainer, teamCreationContainer);
    });

    addTeamBtn.addEventListener('click', () => {
        const teamName = teamNameInput.value.trim();
        if (teamName) {
            teams.push({ name: teamName, score: 0, id: teams.length });
            teamNameInput.value = '';
            renderTeams();
            if (teams.length > 0) {
                startGameBtn.classList.remove('hidden');
            }
        }
    });

    function renderTeams() {
        teamsList.innerHTML = '';
        teams.forEach(team => {
            const teamElement = document.createElement('div');
            teamElement.classList.add('team-item');
            teamElement.textContent = team.name;
            teamsList.appendChild(teamElement);
        });
    }

    startGameBtn.addEventListener('click', () => {
        // Initialize question assignments for fair distribution
        initializeQuestionAssignments();
        switchView(teamCreationContainer, gameContainer);
        startQuiz();
    });

    // Create fair question distribution among teams
    function initializeQuestionAssignments() {
        if (teams.length === 0) return;
        
        // Initialize tracking arrays
        teamQuestionCounts = new Array(teams.length).fill(0);
        teamQuestionAssignments = new Array(teams.length).fill().map(() => []);
        
        // Assign questions in a round-robin fashion
        for (let i = 0; i < allQuestions.length; i++) {
            const teamIndex = i % teams.length;
            teamQuestionAssignments[teamIndex].push(i);
        }
    }

    function startQuiz() {
        currentQuestionIndex = 0;
        currentTeamIndex = 0;
        // Find the first team that should answer question 0
        for (let i = 0; i < teamQuestionAssignments.length; i++) {
            if (teamQuestionAssignments[i].includes(currentQuestionIndex)) {
                currentTeamIndex = i;
                break;
            }
        }
        totalQuestionsSpan.textContent = allQuestions.length;
        showQuestion();
        updateCompactLeaderboard();
    }

    function showQuestion() {
        resetState();
        updateProgressBar();
        const question = allQuestions[currentQuestionIndex];
        questionText.textContent = question.question;
        currentQuestionSpan.textContent = currentQuestionIndex + 1;

        question.options.forEach((option, index) => {
            const button = document.createElement('button');
            button.textContent = option;
            button.classList.add('option-btn');
            button.dataset.correct = (index === question.correct);
            button.addEventListener('click', selectAnswer);
            optionsList.appendChild(button);
        });

        updateTurnHeader();
        updateCompactLeaderboard();
        
        // Start timer for this question
        startTimer();
    }

    function selectAnswer(e) {
        // Stop the timer when an answer is selected
        stopTimer();
        
        const selectedBtn = e.target;
        const isCorrect = selectedBtn.dataset.correct === 'true';

        if (isCorrect) {
            teams[currentTeamIndex].score += 10; // Award 10 points for correct answer
            selectedBtn.classList.add('correct');
        } else {
            selectedBtn.classList.add('incorrect');
        }

        // Increment the question count for this team
        teamQuestionCounts[currentTeamIndex]++;

        Array.from(optionsList.children).forEach(button => {
            if (button.dataset.correct === 'true') {
                button.classList.add('correct');
            }
            button.disabled = true;
        });

        nextBtn.classList.remove('hidden');
        skipTeamBtn.classList.add('hidden');
        updateCompactLeaderboard();
    }

    nextBtn.addEventListener('click', () => {
        moveToNextQuestion();
    });

    skipTeamBtn.addEventListener('click', () => {
        moveToNextQuestion();
    });

    function moveToNextQuestion() {
        // Stop the timer when moving to next question
        stopTimer();
        
        currentQuestionIndex++;
        
        if (currentQuestionIndex >= allQuestions.length) {
            showResult();
            return;
        }
        
        // Find which team should answer the next question
        let foundTeam = false;
        for (let i = 0; i < teamQuestionAssignments.length; i++) {
            if (teamQuestionAssignments[i].includes(currentQuestionIndex)) {
                currentTeamIndex = i;
                foundTeam = true;
                break;
            }
        }
        
        // Fallback to round-robin if no assignment found
        if (!foundTeam) {
            currentTeamIndex = currentQuestionIndex % teams.length;
        }
        
        showQuestion();
    }

    function showResult() {
        switchView(gameContainer, endGameContainer);
        
        // Sort teams by score to determine winner
        const sortedTeams = [...teams].sort((a, b) => b.score - a.score);
        const winningTeam = sortedTeams[0];
        
        winnerAnnouncement.textContent = `الفريق الفائز هو ${winningTeam.name}!`;
        celebration.textContent = '🎉';
        
        // Show all teams and their scores in a leaderboard-style format
        finalScores.innerHTML = '<h3>النتائج النهائية</h3>';
        
        sortedTeams.forEach((team, index) => {
            const teamScoreElement = document.createElement('div');
            teamScoreElement.classList.add('leaderboard-team');
            
            // Add medal classes for top 3 teams
            if (index === 0) teamScoreElement.classList.add('gold');
            else if (index === 1) teamScoreElement.classList.add('silver');
            else if (index === 2) teamScoreElement.classList.add('bronze');
            
            // Find how many questions this team answered
            const questionsAnswered = teamQuestionCounts[team.id] || 0;
            
            teamScoreElement.innerHTML = `
                <span class="rank">${index + 1}</span>
                <span class="team-name">${team.name}</span>
                <span class="team-score">${team.score}</span>
                <span class="question-count">${questionsAnswered}</span>
            `;
            finalScores.appendChild(teamScoreElement);
        });
    }

    restartBtn.addEventListener('click', () => location.reload());

    function switchView(hide, show) {
        hide.classList.add('hidden');
        show.classList.remove('hidden');
        show.classList.add('animated');
    }

    function resetState() {
        nextBtn.classList.add('hidden');
        skipTeamBtn.classList.remove('hidden');
        while (optionsList.firstChild) {
            optionsList.removeChild(optionsList.firstChild);
        }
        // Reset timer display
        if (timerElement) {
            timerElement.textContent = totalTime;
            if (timerContainer) {
                timerContainer.classList.remove('warning', 'danger');
            }
        }
    }

    function updateProgressBar() {
        const progressPercent = ((currentQuestionIndex + 1) / allQuestions.length) * 100;
        progressBar.style.width = `${progressPercent}%`;
    }

    function updateCompactLeaderboard() {
        compactLeaderboard.innerHTML = '';
        
        // Add leaderboard header
        const headerElement = document.createElement('div');
        headerElement.classList.add('compact-leaderboard-header');
        headerElement.textContent = 'المتصدرون';
        compactLeaderboard.appendChild(headerElement);
        
        // Sort teams by score (descending) for leaderboard
        const sortedTeams = [...teams].sort((a, b) => b.score - a.score);
        
        sortedTeams.forEach((team, index) => {
            const teamElement = document.createElement('div');
            teamElement.classList.add('compact-leaderboard-team');
            
            // Add medal classes for top 3 teams
            if (index === 0) teamElement.classList.add('gold');
            else if (index === 1) teamElement.classList.add('silver');
            else if (index === 2) teamElement.classList.add('bronze');
            
            // Highlight the current team with green color
            if (team.id === currentTeamIndex) {
                teamElement.classList.add('active');
            }
            
            // Find how many questions this team answered
            const questionsAnswered = teamQuestionCounts[team.id] || 0;
            
            teamElement.innerHTML = `
                <span class="compact-rank">${index + 1}</span>
                <span class="compact-team-name">${team.name}</span>
                <span class="compact-team-score">${team.score}</span>
            `;
            compactLeaderboard.appendChild(teamElement);
        });
    }

    function updateTurnHeader() {
        const currentTeam = teams.find(t => t.id === currentTeamIndex);
        currentTeamTurn.textContent = `دور فريق: ${currentTeam.name}`;
        currentTeamScore.textContent = `النقاط: ${currentTeam.score}`;
    }
    
    // Timer functions
    function startTimer() {
        // Reset timer
        timeLeft = totalTime;
        timerElement.textContent = timeLeft;
        timerContainer.classList.remove('warning', 'danger');
        
        // Clear any existing timer
        if (timer) {
            clearInterval(timer);
        }
        
        // Start new timer
        timer = setInterval(() => {
            timeLeft--;
            timerElement.textContent = timeLeft;
            
            // Update timer styling based on remaining time
            if (timeLeft <= 10 && timeLeft > 5) {
                timerContainer.classList.add('warning');
                timerContainer.classList.remove('danger');
            } else if (timeLeft <= 5) {
                timerContainer.classList.add('danger');
                timerContainer.classList.remove('warning');
            }
            
            // If time runs out, skip to next question
            if (timeLeft <= 0) {
                clearInterval(timer);
                handleTimeOut();
            }
        }, 1000);
    }
    
    function stopTimer() {
        if (timer) {
            clearInterval(timer);
            timer = null;
        }
    }
    
    function handleTimeOut() {
        // Increment the question count for this team (even if they didn't answer)
        teamQuestionCounts[currentTeamIndex]++;
        
        // Disable all options
        Array.from(optionsList.children).forEach(button => {
            button.disabled = true;
        });
        
        // Hide skip button and show next button
        skipTeamBtn.classList.add('hidden');
        nextBtn.classList.remove('hidden');
        
        // Update leaderboard
        updateCompactLeaderboard();
        
        // Show correct answer
        const question = allQuestions[currentQuestionIndex];
        Array.from(optionsList.children).forEach((button, index) => {
            if (index === question.correct) {
                button.classList.add('correct');
            }
        });
    }
});