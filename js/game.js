document.addEventListener('DOMContentLoaded', async () => {
    // تعريف العناصر
    const nameContainer = document.getElementById('name-container');
    const difficultyContainer = document.getElementById('difficulty-container');
    const quizContainer = document.getElementById('quiz-container');
    const resultContainer = document.getElementById('result-container');

    const nameInput = document.getElementById('name-input');
    const nextToDifficultyBtn = document.getElementById('next-to-difficulty-btn');
    const welcomeMessage = document.getElementById('welcome-message');
    const difficultyButtons = document.querySelectorAll('.difficulty-btn');
    
    const questionText = document.getElementById('question-text');
    const optionsList = document.getElementById('options-list');
    const nextBtn = document.getElementById('next-btn');
    
    const progressBar = document.getElementById('progress-bar');
    const currentQuestionSpan = document.getElementById('current-question');
    const totalQuestionsSpan = document.getElementById('total-questions');
    
    const resultTitle = document.getElementById('result-title');
    const resultRating = document.getElementById('result-rating');
    const scoreSpan = document.getElementById('score');
    const restartBtn = document.getElementById('restart-btn');

    // متغيرات الحالة
    let userName = "";
    let selectedDifficulty = "";
    let currentQuestionIndex = 0;
    let score = 0;
    let currentQuestions = [];
    let allQuestions = [];

    // تحميل الأسئلة من Firestore
    async function loadQuestions() {
        try {
            const snapshot = await db.collection('questions').orderBy('order', 'asc').get();
            
            if (snapshot.empty) {
                alert('لا توجد أسئلة في قاعدة البيانات. الرجاء استخدام محرر الأسئلة لإضافة أسئلة.');
                allQuestions = [];
            } else {
                allQuestions = [];
                snapshot.forEach((doc) => {
                    const data = doc.data();
                    allQuestions.push({
                        question: data.question,
                        options: data.options,
                        correct: data.correct,
                        difficulty: data.difficulty
                    });
                });
            }
        } catch (error) {
            console.error('Error loading questions from Firestore:', error);
            alert('خطأ في تحميل الأسئلة. تحقق من اتصالك بالإنترنت.');
            allQuestions = [];
        }
    }

    await loadQuestions();

    // الانتقال من شاشة الاسم إلى شاشة الصعوبة
    nextToDifficultyBtn.addEventListener('click', () => {
        userName = nameInput.value.trim();
        if (userName === "") {
            alert("الرجاء إدخال اسمك للمتابعة.");
            return;
        }
        welcomeMessage.textContent = `أهلاً بك يا ${userName}!`;
        switchView(nameContainer, difficultyContainer);
    });

    // بدء الاختبار عند اختيار الصعوبة
    difficultyButtons.forEach(button => {
        button.addEventListener('click', () => {
            selectedDifficulty = button.dataset.difficulty;
            startQuiz(selectedDifficulty);
        });
    });

    // دالة بدء الاختبار
    function startQuiz(difficulty) {
        switchView(difficultyContainer, quizContainer);
        currentQuestionIndex = 0;
        score = 0;
        nextBtn.classList.add('hidden');

        if (difficulty === 'all') {
            currentQuestions = [...allQuestions];
        } else {
            currentQuestions = allQuestions.filter(q => q.difficulty === difficulty);
        }
        currentQuestions.sort(() => Math.random() - 0.5);
        
        totalQuestionsSpan.textContent = currentQuestions.length;
        showQuestion();
    }

    function showQuestion() {
        resetState();
        updateProgressBar();
        const question = currentQuestions[currentQuestionIndex];
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
    }

    function selectAnswer(e) {
        const selectedBtn = e.target;
        const isCorrect = selectedBtn.dataset.correct === 'true';

        if (isCorrect) {
            score++;
            selectedBtn.classList.add('correct');
        } else {
            selectedBtn.classList.add('incorrect');
        }

        Array.from(optionsList.children).forEach(button => {
            if (button.dataset.correct === 'true') {
                button.classList.add('correct');
            }
            button.disabled = true;
        });
        nextBtn.classList.remove('hidden');
    }

    nextBtn.addEventListener('click', () => {
        currentQuestionIndex++;
        if (currentQuestionIndex < currentQuestions.length) {
            showQuestion();
        } else {
            showResult();
        }
    });

    async function showResult() {
        switchView(quizContainer, resultContainer);
        const percentage = Math.round((score / currentQuestions.length) * 100);
        const rating = getRating(percentage);
        
        resultTitle.textContent = `${rating.greeting} ${userName}!`;
        resultRating.textContent = rating.title;
        scoreSpan.textContent = `${score} من ${currentQuestions.length} (بنسبة ${percentage}%)`;
        
        try {
            await db.collection('quizResults').add({
                userName: userName,
                score: score,
                totalQuestions: currentQuestions.length,
                difficulty: selectedDifficulty,
                percentage: percentage,
                timestamp: firebase.firestore.FieldValue.serverTimestamp()
            });
            console.log('Quiz results saved successfully!');
        } catch (error) {
            console.error('Error saving quiz results:', error);
        }
    }

    restartBtn.addEventListener('click', () => location.reload()); // أسهل طريقة للبدء من جديد

    // --- دوال مساعدة ---
    
    function switchView(hide, show) {
        hide.classList.add('hidden');
        show.classList.remove('hidden');
        show.classList.add('animated');
    }

    function resetState() {
        nextBtn.classList.add('hidden');
        while (optionsList.firstChild) {
            optionsList.removeChild(optionsList.firstChild);
        }
    }
    
    function updateProgressBar() {
        const progressPercent = ((currentQuestionIndex + 1) / currentQuestions.length) * 100;
        progressBar.style.width = `${progressPercent}%`;
    }

    function getRating(percentage) {
        if (percentage === 100) return { title: "أسطورة التريفيا! 💯 أجبت على كل شيء بإتقان!", greeting: "🏆 رائع يا", color: "#28a745" };
        if (percentage >= 90) return { title: "أداء مدهش! 🔥 ذاكرتك قوية جداً!", greeting: "🌟 أحسنت يا", color: "#28a745" };
        if (percentage >= 80) return { title: "إجابات ممتازة! 🤩 واضح أنك متمكن!", greeting: "🎉 تهانينا يا", color: "#17a2b8" };
        if (percentage >= 70) return { title: "أداء رائع! 💪 ما زلت في الطريق إلى القمة!", greeting: "👏 جميل يا", color: "#17a2b8" };
        if (percentage >= 60) return { title: "نتيجة طيبة! 😎 تابع اللعب وطور مستواك!", greeting: "👍 جيد يا", color: "#ffc107" };
        if (percentage >= 50) return { title: "أداء لا بأس به! 😅 تحتاج قليلاً من التركيز فقط!", greeting: "🤔 مجهود طيب يا", color: "#ffc107" };
        if (percentage >= 40) return { title: "لا تقلق! 😉 المرة القادمة ستكون أفضل!", greeting: "💪 حاول مجددًا يا", color: "#ff9800" };
        return { title: "المهم أنك استمتعت! 😄 التجربة جزء من المتعة!", greeting: "🍀 لا تستسلم يا", color: "#dc3545" };
    }

    restartBtn.addEventListener('click', () => location.reload()); // أسهل طريقة للبدء من جديد

    // --- دوال مساعدة ---
});