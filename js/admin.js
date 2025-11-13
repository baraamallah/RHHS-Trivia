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

let allResults = [];
let filteredResults = [];

async function loadQuizResults() {
    try {
        const snapshot = await db.collection('quizResults')
            .orderBy('timestamp', 'desc')
            .get();
        
        allResults = [];
        snapshot.forEach((doc) => {
            allResults.push({ id: doc.id, ...doc.data() });
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
    
    const percentages = results.map(r => r.percentage);
    const total = results.length;
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
    
    let csv = 'الاسم,النتيجة,إجمالي الأسئلة,النسبة المئوية,الصعوبة,التاريخ والوقت\n';
    
    filteredResults.forEach(result => {
        const date = result.timestamp?.toDate ? result.timestamp.toDate() : new Date(result.timestamp);
        const formattedDate = date.toLocaleString('ar-LB');
        
        csv += `"${result.userName}",${result.score},${result.totalQuestions},${result.percentage}%,"${result.difficulty}","${formattedDate}"\n`;
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

window.onload = initializeAdmin;
