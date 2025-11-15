const PASSWORD = "rhhs2024";

let questions = [];
let editingIndex = null;
let deleteIndex = null;
let filteredQuestions = [];

async function initializeEditor() {
    window.auth.onAuthStateChanged(async (user) => {
        if (user) {
            document.getElementById('editor-container').style.display = 'block';
            document.getElementById('user-email').textContent = user.email;
            await loadQuestionsFromFirestore();
            initializeEventListeners();
        } else {
            window.location.href = 'login.html?redirect=question-editor.html';
        }
    });
}

async function loadQuestionsFromFirestore() {
    try {
        const snapshot = await db.collection('questions').orderBy('order', 'asc').get();
        
        if (snapshot.empty) {
            showNotification('لا توجد أسئلة في قاعدة البيانات. استخدم زر "رفع الأسئلة الأولية" لإضافتها.', 'info');
            questions = [];
        } else {
            questions = [];
            snapshot.forEach((doc) => {
                questions.push({ id: doc.id, ...doc.data() });
            });
        }
        
        filteredQuestions = [...questions];
        renderQuestions();
        updateStats();
    } catch (error) {
        console.error('Error loading questions:', error);
        showNotification('خطأ في تحميل الأسئلة من Firebase', 'error');
    }
}

async function importInitialQuestions() {
    if (typeof schoolQuestions === 'undefined') {
        showNotification('خطأ: لم يتم العثور على الأسئلة الأولية في ملف questions.js', 'error');
        return;
    }
    await importQuestionsFromFile(schoolQuestions, 'الأسئلة الأولية');
}

async function handleCustomFileUpload(event) {
    const file = event.target.files[0];
    if (!file) return;
    
    if (!file.name.endsWith('.js')) {
        showNotification('الرجاء اختيار ملف JavaScript (.js)', 'error');
        return;
    }
    
    try {
        const fileContent = await readFileAsText(file);
        // Extract the questions array from the file content
        const questionsData = extractQuestionsFromFileContent(fileContent);
        
        if (!questionsData || !Array.isArray(questionsData)) {
        showNotification('لم يتم العثور على بيانات الأسئلة في الملف', 'error');
        return;
        }
        
        await importQuestionsFromFile(questionsData, `ملف ${file.name}`);
    } catch (error) {
        console.error('Error processing file:', error);
        showNotification('خطأ في معالجة الملف', 'error');
    }
    
    // Reset file input
    event.target.value = '';
}

function readFileAsText(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = event => resolve(event.target.result);
        reader.onerror = error => reject(error);
        reader.readAsText(file);
    });
}

function extractQuestionsFromFileContent(content) {
    // Try to extract the questions array from the file content
    try {
        // Look for an array assignment in the file content
        // This regex looks for arrays that might contain questions
        const arrayPatterns = [
            /(?:var|let|const)\s+(?:schoolQuestions|questions)\s*=\s*(\[[\s\S]*?\]);/,
            /(?:schoolQuestions|questions)\s*=\s*(\[[\s\S]*?\]);/
        ];
        
        for (const pattern of arrayPatterns) {
            const match = content.match(pattern);
            if (match && match[1]) {
                try {
                    // Safely parse the array content
                    const parsed = JSON.parse(match[1]);
                    if (Array.isArray(parsed)) {
                        return parsed;
                    }
                } catch (parseError) {
                    console.warn('Could not parse as JSON, trying eval:', parseError);
                    // Fallback to eval if JSON parsing fails
                    try {
                        const evaluated = eval(`(${match[1]})`);
                        if (Array.isArray(evaluated)) {
                            return evaluated;
                        }
                    } catch (evalError) {
                        console.error('Error evaluating content:', evalError);
                    }
                }
            }
        }
        
        // If we can't find a pattern, try to evaluate the whole content
        const evalFunction = new Function(`
            ${content}
            return typeof schoolQuestions !== 'undefined' ? schoolQuestions : 
                   typeof questions !== 'undefined' ? questions : null;
        `);
        
        const result = evalFunction();
        if (Array.isArray(result)) {
            return result;
        }
        
        return null;
    } catch (error) {
        console.error('Error extracting questions:', error);
        showNotification('خطأ في استخراج الأسئلة من الملف', 'error');
        return null;
    }
}

async function importQuestionsFromFile(questionsArray, sourceName) {
    if (questions.length > 0) {
        const confirm = window.confirm(`تحذير: يوجد أسئلة في قاعدة البيانات. هل تريد حذفها واستبدالها بـ ${sourceName}؟`);
        if (!confirm) return;
        
        for (const q of questions) {
            await db.collection('questions').doc(q.id).delete();
        }
    }
    
    if (!questionsArray || !Array.isArray(questionsArray)) {
        showNotification(`خطأ: لم يتم العثور على الأسئلة في ${sourceName}`, 'error');
        return;
    }
    
    try {
        showNotification(`جاري رفع الأسئلة من ${sourceName}...`, 'info');
        
        for (let i = 0; i < questionsArray.length; i++) {
            const q = questionsArray[i];
            await db.collection('questions').add({
                question: q.question,
                options: q.options,
                correct: q.correct,
                difficulty: q.difficulty,
                order: i
            });
        }
        
        await loadQuestionsFromFirestore();
        showNotification(`تم رفع ${questionsArray.length} سؤال بنجاح من ${sourceName}!`, 'success');
    } catch (error) {
        console.error('Error importing questions:', error);
        showNotification('خطأ في رفع الأسئلة', 'error');
    }
}

function initializeEventListeners() {
    document.getElementById('logout-btn')?.addEventListener('click', async () => {
        await window.auth.signOut();
        window.location.href = 'login.html';
    });
    
    document.getElementById('admin-panel-btn')?.addEventListener('click', () => {
        window.location.href = 'admin.html';
    });
    
    document.getElementById('add-question-btn').addEventListener('click', openAddModal);
    document.getElementById('import-initial-btn').addEventListener('click', importInitialQuestions);
    document.getElementById('upload-custom-btn').addEventListener('click', () => {
        document.getElementById('questions-file-input').click();
    });
    document.getElementById('questions-file-input').addEventListener('change', handleCustomFileUpload);
    document.getElementById('save-all-btn').addEventListener('click', saveAllChanges);
    document.getElementById('export-json-btn').addEventListener('click', exportJSON);
    document.getElementById('save-question-btn').addEventListener('click', saveQuestion);
    document.getElementById('filter-difficulty').addEventListener('change', filterQuestions);
    document.getElementById('search-input').addEventListener('input', filterQuestions);
    
    document.querySelectorAll('.close-modal').forEach(btn => {
        btn.addEventListener('click', closeModal);
    });
    
    document.querySelectorAll('.close-delete-modal').forEach(btn => {
        btn.addEventListener('click', closeDeleteModal);
    });
    
    document.getElementById('confirm-delete-btn').addEventListener('click', confirmDelete);
    
    document.querySelectorAll('.difficulty-option').forEach(btn => {
        btn.addEventListener('click', function() {
            document.querySelectorAll('.difficulty-option').forEach(b => b.classList.remove('selected'));
            this.classList.add('selected');
        });
    });
    
    document.getElementById('question-modal').addEventListener('click', function(e) {
        if (e.target === this) closeModal();
    });
    
    document.getElementById('delete-modal').addEventListener('click', function(e) {
        if (e.target === this) closeDeleteModal();
    });
}

function renderQuestions() {
    const container = document.getElementById('questions-container');
    container.innerHTML = '';
    
    if (filteredQuestions.length === 0) {
        container.innerHTML = '<div class="no-results">لا توجد أسئلة مطابقة للبحث</div>';
        return;
    }
    
    filteredQuestions.forEach((q, index) => {
        const realIndex = questions.indexOf(q);
        const card = document.createElement('div');
        card.className = 'question-card';
        card.setAttribute('data-difficulty', q.difficulty);
        
        const difficultyMap = {
            'easy': '🟢 سهل',
            'medium': '🟠 متوسط',
            'hard': '🔴 صعب'
        };
        
        card.innerHTML = `
            <div class="question-header">
                <span class="question-number">#${realIndex + 1}</span>
                <span class="difficulty-badge ${q.difficulty}">${difficultyMap[q.difficulty]}</span>
            </div>
            <div class="question-content">
                <p class="question-text">${q.question}</p>
                <div class="options-list">
                    ${q.options.map((opt, i) => `
                        <div class="option-item ${i === q.correct ? 'correct' : ''}">
                            ${i === q.correct ? '✓ ' : ''}${opt}
                        </div>
                    `).join('')}
                </div>
            </div>
            <div class="question-actions">
                <button class="btn-edit" onclick="editQuestion(${realIndex})">✏️ تعديل</button>
                <button class="btn-delete" onclick="deleteQuestion(${realIndex})">🗑️ حذف</button>
                <button class="btn-duplicate" onclick="duplicateQuestion(${realIndex})">📋 نسخ</button>
            </div>
        `;
        
        container.appendChild(card);
    });
}

function updateStats() {
    document.getElementById('total-questions').textContent = questions.length;
    document.getElementById('easy-count').textContent = questions.filter(q => q.difficulty === 'easy').length;
    document.getElementById('medium-count').textContent = questions.filter(q => q.difficulty === 'medium').length;
    document.getElementById('hard-count').textContent = questions.filter(q => q.difficulty === 'hard').length;
}

function filterQuestions() {
    const difficulty = document.getElementById('filter-difficulty').value;
    const searchTerm = document.getElementById('search-input').value.toLowerCase();
    
    filteredQuestions = questions.filter(q => {
        const matchesDifficulty = difficulty === 'all' || q.difficulty === difficulty;
        const matchesSearch = searchTerm === '' || 
            q.question.toLowerCase().includes(searchTerm) ||
            q.options.some(opt => opt.toLowerCase().includes(searchTerm));
        
        return matchesDifficulty && matchesSearch;
    });
    
    renderQuestions();
}

function openAddModal() {
    editingIndex = null;
    document.getElementById('modal-title').textContent = 'إضافة سؤال جديد';
    document.getElementById('question-text').value = '';
    
    for (let i = 0; i < 4; i++) {
        document.getElementById(`option-${i}`).value = '';
    }
    
    document.querySelector('input[name="correct-answer"]').checked = false;
    document.querySelectorAll('.difficulty-option').forEach(btn => btn.classList.remove('selected'));
    document.querySelector('[data-difficulty="easy"]').classList.add('selected');
    
    document.getElementById('question-modal').style.display = 'flex';
}

function editQuestion(index) {
    editingIndex = index;
    const q = questions[index];
    
    document.getElementById('modal-title').textContent = `تعديل السؤال #${index + 1}`;
    document.getElementById('question-text').value = q.question;
    
    for (let i = 0; i < 4; i++) {
        document.getElementById(`option-${i}`).value = q.options[i] || '';
    }
    
    document.querySelector(`input[name="correct-answer"][value="${q.correct}"]`).checked = true;
    
    document.querySelectorAll('.difficulty-option').forEach(btn => {
        btn.classList.remove('selected');
        if (btn.dataset.difficulty === q.difficulty) {
            btn.classList.add('selected');
        }
    });
    
    document.getElementById('question-modal').style.display = 'flex';
}

function saveQuestion() {
    const questionText = document.getElementById('question-text').value.trim();
    const options = [];
    
    for (let i = 0; i < 4; i++) {
        const optValue = document.getElementById(`option-${i}`).value.trim();
        if (!optValue) {
            alert(`الرجاء ملء الخيار ${i + 1}`);
            return;
        }
        options.push(optValue);
    }
    
    const correctAnswer = document.querySelector('input[name="correct-answer"]:checked');
    if (!correctAnswer) {
        alert('الرجاء اختيار الإجابة الصحيحة');
        return;
    }
    
    const difficulty = document.querySelector('.difficulty-option.selected');
    if (!difficulty) {
        alert('الرجاء اختيار مستوى الصعوبة');
        return;
    }
    
    if (!questionText) {
        alert('الرجاء إدخال نص السؤال');
        return;
    }
    
    const newQuestion = {
        question: questionText,
        options: options,
        correct: parseInt(correctAnswer.value),
        difficulty: difficulty.dataset.difficulty,
        order: editingIndex !== null ? questions[editingIndex].order : questions.length
    };
    
    if (editingIndex !== null) {
        updateQuestionInFirestore(questions[editingIndex].id, newQuestion);
    } else {
        addQuestionToFirestore(newQuestion);
    }
    
    closeModal();
}

async function addQuestionToFirestore(question) {
    try {
        const docRef = await db.collection('questions').add(question);
        question.id = docRef.id;
        questions.push(question);
        filteredQuestions = [...questions];
        renderQuestions();
        updateStats();
        showNotification('تمت إضافة السؤال بنجاح!', 'success');
    } catch (error) {
        console.error('Error adding question:', error);
        showNotification('خطأ في إضافة السؤال', 'error');
    }
}

async function updateQuestionInFirestore(docId, updatedQuestion) {
    try {
        await db.collection('questions').doc(docId).update(updatedQuestion);
        questions[editingIndex] = { id: docId, ...updatedQuestion };
        filteredQuestions = [...questions];
        renderQuestions();
        updateStats();
        showNotification('تم تحديث السؤال بنجاح!', 'success');
    } catch (error) {
        console.error('Error updating question:', error);
        showNotification('خطأ في تحديث السؤال', 'error');
    }
}

function deleteQuestion(index) {
    deleteIndex = index;
    document.getElementById('delete-modal').style.display = 'flex';
}

function confirmDelete() {
    if (deleteIndex !== null) {
        deleteQuestionFromFirestore(questions[deleteIndex].id, deleteIndex);
    }
}

async function deleteQuestionFromFirestore(docId, index) {
    try {
        await db.collection('questions').doc(docId).delete();
        questions.splice(index, 1);
        filteredQuestions = [...questions];
        renderQuestions();
        updateStats();
        closeDeleteModal();
        showNotification('تم حذف السؤال بنجاح!', 'success');
    } catch (error) {
        console.error('Error deleting question:', error);
        showNotification('خطأ في حذف السؤال', 'error');
        closeDeleteModal();
    }
}

function duplicateQuestion(index) {
    const duplicate = {
        question: questions[index].question + ' (نسخة)',
        options: [...questions[index].options],
        correct: questions[index].correct,
        difficulty: questions[index].difficulty,
        order: questions.length
    };
    addQuestionToFirestore(duplicate);
}

function closeModal() {
    document.getElementById('question-modal').style.display = 'none';
}

function closeDeleteModal() {
    document.getElementById('delete-modal').style.display = 'none';
}

function saveAllChanges() {
    showNotification('✅ جميع التغييرات محفوظة تلقائياً في Firebase!', 'success');
}

function exportJSON() {
    const exportData = questions.map(q => ({
        question: q.question,
        options: q.options,
        correct: q.correct,
        difficulty: q.difficulty
    }));
    
    const dataStr = JSON.stringify(exportData, null, 4);
    const blob = new Blob([dataStr], { type: 'application/json;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    
    link.setAttribute('href', url);
    link.setAttribute('download', `quiz-questions-${new Date().toISOString().split('T')[0]}.json`);
    link.style.visibility = 'hidden';
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    showNotification('تم تصدير الأسئلة بصيغة JSON!', 'success');
}

function showNotification(message, type = 'success') {
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.textContent = message;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.classList.add('show');
    }, 10);
    
    setTimeout(() => {
        notification.classList.remove('show');
        setTimeout(() => {
            document.body.removeChild(notification);
        }, 300);
    }, 3000);
}

window.onload = initializeEditor;
