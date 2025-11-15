function initializeAdmin() {
    window.auth.onAuthStateChanged((user) => {
        if (user) {
            document.getElementById('admin-container').style.display = 'block';
            document.getElementById('user-email').textContent = user.email;
            loadQuizResults();
        } else {
            window.location.href = 'login.html?redirect=admin.html';
        }
    });
}

document.getElementById('logout-btn')?.addEventListener('click', async () => {
    await window.auth.signOut();
    window.location.href = 'login.html';
});

document.getElementById('question-editor-btn')?.addEventListener('click', () => {
    window.location.href = 'question-editor.html';
});

let allResults = [];
let filteredResults = [];

async function loadQuizResults() {
    try {
        // Load individual quiz results
        const quizResultsSnapshot = await db.collection('quizResults')
            .orderBy('timestamp', 'desc')
            .get();
        
        // Load group competition results
        const groupResultsSnapshot = await db.collection('groupCompetitionResults')
            .orderBy('timestamp', 'desc')
            .get();
        
        allResults = [];
        
        // Process individual quiz results
        quizResultsSnapshot.forEach((doc) => {
            allResults.push({ 
                id: doc.id, 
                ...doc.data(),
                resultType: 'individual'
            });
        });
        
        // Process group competition results
        groupResultsSnapshot.forEach((doc) => {
            allResults.push({ 
                id: doc.id, 
                ...doc.data(),
                resultType: 'group'
            });
        });
        
        // Sort all results by timestamp (newest first)
        allResults.sort((a, b) => {
            const dateA = a.timestamp?.toDate ? a.timestamp.toDate() : new Date(a.timestamp);
            const dateB = b.timestamp?.toDate ? b.timestamp.toDate() : new Date(b.timestamp);
            return dateB - dateA;
        });
        
        filteredResults = [...allResults];
        displayResults(filteredResults);
        updateStats(filteredResults);
    } catch (error) {
        console.error('Error loading quiz results:', error);
        document.getElementById('results-tbody').innerHTML = 
            '<tr><td colspan="5" style="text-align: center; padding: 2rem; color: red;">خطأ في تحميل البيانات</td></tr>';
    }
}

function displayResults(results) {
    const tbody = document.getElementById('results-tbody');
    
    if (results.length === 0) {
        tbody.innerHTML = '<tr><td colspan="5" style="text-align: center; padding: 2rem;">لا توجد نتائج متاحة</td></tr>';
        return;
    }
    
    tbody.innerHTML = '';
    results.forEach(result => {
        const tr = document.createElement('tr');
        
        const date = result.timestamp?.toDate ? result.timestamp.toDate() : new Date(result.timestamp);
        const formattedDate = date.toLocaleString('ar-LB', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit'
        });
        
        if (result.resultType === 'group') {
            // Handle group competition results
            const winningTeam = result.teams[0];
            const totalTeams = result.teams.length;
            
            tr.innerHTML = `
                <td>مسابقة جماعية (${totalTeams} فرق)</td>
                <td>${winningTeam.name} (${winningTeam.score} نقطة)</td>
                <td class="good">-</td>
                <td>مسابقة جماعية</td>
                <td>${formattedDate}</td>
            `;
        } else {
            // Handle individual quiz results
            const difficultyMap = {
                'easy': 'سهل',
                'medium': 'متوسط',
                'hard': 'صعب',
                'all': 'كل الأسئلة'
            };
            
            const percentageClass = 
                result.percentage >= 90 ? 'excellent' :
                result.percentage >= 70 ? 'good' :
                result.percentage >= 50 ? 'average' : 'poor';
            
            tr.innerHTML = `
                <td>${result.userName}</td>
                <td>${result.score} / ${result.totalQuestions}</td>
                <td class="${percentageClass}">${result.percentage}%</td>
                <td>${difficultyMap[result.difficulty] || result.difficulty}</td>
                <td>${formattedDate}</td>
            `;
        }
        
        tbody.appendChild(tr);
    });
}

function updateStats(results) {
    if (results.length === 0) {
        document.getElementById('total-participants').textContent = '0';
        document.getElementById('average-score').textContent = '0%';
        document.getElementById('highest-score').textContent = '0%';
        document.getElementById('lowest-score').textContent = '0%';
        return;
    }
    
    // Filter only individual quiz results for stats calculation
    const individualResults = results.filter(r => r.resultType !== 'group');
    
    if (individualResults.length === 0) {
        // If no individual results, show basic stats
        document.getElementById('total-participants').textContent = results.length;
        document.getElementById('average-score').textContent = '-';
        document.getElementById('highest-score').textContent = '-';
        document.getElementById('lowest-score').textContent = '-';
        return;
    }
    
    const percentages = individualResults.map(r => r.percentage);
    const total = individualResults.length;
    const average = Math.round(percentages.reduce((a, b) => a + b, 0) / total);
    const highest = Math.max(...percentages);
    const lowest = Math.min(...percentages);
    
    document.getElementById('total-participants').textContent = total;
    document.getElementById('average-score').textContent = `${average}%`;
    document.getElementById('highest-score').textContent = `${highest}%`;
    document.getElementById('lowest-score').textContent = `${lowest}%`;
}

document.getElementById('difficulty-filter')?.addEventListener('change', (e) => {
    const difficulty = e.target.value;
    
    if (difficulty === 'all') {
        filteredResults = [...allResults];
    } else {
        filteredResults = allResults.filter(r => r.difficulty === difficulty);
    }
    
    displayResults(filteredResults);
    updateStats(filteredResults);
});

document.getElementById('export-btn')?.addEventListener('click', () => {
    if (filteredResults.length === 0) {
        alert('لا توجد بيانات لتصديرها');
        return;
    }
    
    let csv = 'الاسم,النتيجة,النسبة المئوية,الصعوبة,التاريخ والوقت,نوع النتيجة\n';
    
    filteredResults.forEach(result => {
        const date = result.timestamp?.toDate ? result.timestamp.toDate() : new Date(result.timestamp);
        const formattedDate = date.toLocaleString('ar-LB');
        
        if (result.resultType === 'group') {
            // Handle group competition results
            const winningTeam = result.teams[0];
            const totalTeams = result.teams.length;
            csv += `"مسابقة جماعية (${totalTeams} فرق)",${winningTeam.name} (${winningTeam.score} نقطة),-,"مسابقة جماعية","${formattedDate}",مجموعة\n`;
        } else {
            // Handle individual quiz results
            csv += `"${result.userName}",${result.score}/${result.totalQuestions},${result.percentage}%,"${result.difficulty}","${formattedDate}",فرد\n`;
        }
    });
    
    const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    
    link.setAttribute('href', url);
    link.setAttribute('download', `quiz-results-${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
});

document.getElementById('clear-responses-btn')?.addEventListener('click', async () => {
    if (filteredResults.length === 0) {
        alert('لا توجد ردود لمسحها');
        return;
    }
    
    const confirmClear = confirm('هل أنت متأكد من مسح جميع الردود؟ لا يمكن التراجع عن هذا الإجراء.');
    if (!confirmClear) return;
    
    try {
        // Delete all quiz results from Firestore
        const batch = db.batch();
        
        // Delete individual quiz results
        const quizResultsSnapshot = await db.collection('quizResults').get();
        quizResultsSnapshot.forEach((doc) => {
            batch.delete(db.collection('quizResults').doc(doc.id));
        });
        
        // Delete group competition results
        const groupResultsSnapshot = await db.collection('groupCompetitionResults').get();
        groupResultsSnapshot.forEach((doc) => {
            batch.delete(db.collection('groupCompetitionResults').doc(doc.id));
        });
        
        await batch.commit();
        
        // Reload the results
        await loadQuizResults();
        alert('تم مسح جميع الردود بنجاح!');
    } catch (error) {
        console.error('Error clearing responses:', error);
        alert('خطأ في مسح الردود: ' + (error.message || 'حدث خطأ غير متوقع'));
    }
});

window.onload = initializeAdmin;
