// Game State
let gameState = {
    stats: {
        health: 50,
        education: 50,
        security: 50,
        economy: 50,
        approval: 50
    },
    history: {
        health: [50],
        education: [50],
        security: [50],
        economy: [50],
        approval: [50],
        labels: ['Início']
    },
    turn: 1
};

// Chart Initialization
let historyChart;

function initChart() {
    const ctx = document.getElementById('historyChart').getContext('2d');
    historyChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: gameState.history.labels,
            datasets: [
                { label: 'Saúde', data: gameState.history.health, borderColor: '#e74c3c', tension: 0.1 },
                { label: 'Educação', data: gameState.history.education, borderColor: '#3498db', tension: 0.1 },
                { label: 'Segurança', data: gameState.history.security, borderColor: '#8e44ad', tension: 0.1 },
                { label: 'Economia', data: gameState.history.economy, borderColor: '#27ae60', tension: 0.1 },
                { label: 'Aprovação', data: gameState.history.approval, borderColor: '#f39c12', tension: 0.1 }
            ]
        },
        options: {
            responsive: true,
            scales: {
                y: { beginAtZero: true, max: 100 }
            }
        }
    });
}

// Update UI
function updateUI() {
    // Stats
    for (let stat in gameState.stats) {
        const val = Math.max(0, Math.min(100, gameState.stats[stat]));
        gameState.stats[stat] = val; // Clamp
        const bar = document.getElementById(`stat-${stat}`);
        const text = document.getElementById(`value-${stat}`);
        if (bar) bar.style.width = `${val}%`;
        if (text) text.textContent = `${Math.round(val)}%`;
    }


    // Update Chart
    if (historyChart) {
        historyChart.data.labels = gameState.history.labels;
        historyChart.data.datasets.forEach((dataset) => {
            const labelMap = {
                'Saúde': 'health',
                'Educação': 'education',
                'Segurança': 'security',
                'Economia': 'economy',
                'Aprovação': 'approval'
            };
            dataset.data = gameState.history[labelMap[dataset.label]];
        });
        historyChart.update();
    }
}


function recordHistory() {
    gameState.turn++;
    gameState.history.labels.push(`Mês ${gameState.turn}`);
    gameState.history.health.push(gameState.stats.health);
    gameState.history.education.push(gameState.stats.education);
    gameState.history.security.push(gameState.stats.security);
    gameState.history.economy.push(gameState.stats.economy);
    gameState.history.approval.push(gameState.stats.approval);
}

// Keyword matching system for custom rules
const keywords = [
    { word: 'saúde', stats: { health: 8, economy: -4, approval: 5 } },
    { word: 'hospital', stats: { health: 10, economy: -5, approval: 5 } },
    { word: 'escola', stats: { education: 8, economy: -4, approval: 5 } },
    { word: 'educação', stats: { education: 10, economy: -5, approval: 5 } },
    { word: 'segurança', stats: { security: 8, economy: -4, approval: 5 } },
    { word: 'polícia', stats: { security: 10, economy: -5, approval: 5 } },
    { word: 'arma', stats: { security: 5, approval: -5 } },
    { word: 'imposto', stats: { economy: 10, approval: -10 } },
    { word: 'taxa', stats: { economy: 10, approval: -10 } },
    { word: 'grátis', stats: { approval: 10, economy: -10 } },
    { word: 'proibir', stats: { security: 5, approval: -5 } },
    { word: 'morte', stats: { security: 10, approval: -15 } },
    { word: 'liberdade', stats: { approval: 10, security: -5 } },
    { word: 'privatizar', stats: { economy: 12, approval: -8 } },
    { word: 'estatizar', stats: { economy: -12, approval: 8 } },
    { word: 'punição', stats: { security: 5, approval: -2 } },
    { word: 'trabalho', stats: { economy: 5, approval: 2 } }
];


function updateFeedbackModal() {
    const details = document.getElementById('feedback-details');
    details.innerHTML = '';

    const feedbacks = [
        {
            stat: 'health',
            low: "🏥 O povo reclama das filas intermináveis e da falta de médicos.",
            high: "🏥 Nossos hospitais são motivo de orgulho nacional!",
            neutral: "🏥 O sistema de saúde funciona, mas poderia ser melhor."
        },
        {
            stat: 'education',
            low: "🎓 Escolas abandonadas e professores em greve. O futuro está em risco.",
            high: "🎓 Nossa juventude está sendo preparada para liderar o mundo.",
            neutral: "🎓 A educação segue estável, com desafios pontuais."
        },
        {
            stat: 'security',
            low: "🛡️ A criminalidade assusta as famílias. Ninguém quer sair de casa.",
            high: "🛡️ A paz reina em nossas ruas graças à segurança eficiente.",
            neutral: "🛡️ A segurança é razoável, mas ainda há crimes comuns."
        },
        {
            stat: 'economy',
            low: "💰 Preços subindo e desemprego em alta. O povo está sofrendo.",
            high: "💰 Economia forte e oportunidades para todos!",
            neutral: "💰 As finanças do país estão equilibradas no momento."
        }
    ];

    feedbacks.forEach(f => {
        const val = gameState.stats[f.stat];
        let text = "";
        let type = "";
        if (val < 40) {
            text = f.low;
            type = "negative";
        } else if (val > 70) {
            text = f.high;
            type = "positive";
        } else {
            text = f.neutral;
            type = "neutral";
        }

        const div = document.createElement('div');
        div.className = `feedback-item ${type}`;
        div.textContent = text;
        details.appendChild(div);
    });

    if (gameState.stats.approval < 40) {
        const warning = document.createElement('div');
        warning.className = "feedback-item negative";
        warning.innerHTML = "<strong>⚠️ AVISO: A insatisfação popular pode levar a uma revolta!</strong>";
        details.appendChild(warning);
    }
}

function addMessageToChat(text, sender) {
    const chatHistory = document.getElementById('chat-history');
    const msgDiv = document.createElement('div');
    msgDiv.className = `message ${sender}-message`;
    msgDiv.textContent = text;
    chatHistory.appendChild(msgDiv);
    chatHistory.scrollTop = chatHistory.scrollHeight;
}

function processAIAdvisor(message) {
    const lowerMessage = message.toLowerCase();
    let response = "";
    let matchedKeywords = [];

    keywords.forEach(k => {
        if (lowerMessage.includes(k.word)) {
            for (let stat in k.stats) {
                gameState.stats[stat] += k.stats[stat];
            }
            matchedKeywords.push(k.word);
        }
    });

    if (matchedKeywords.length > 0) {
        response = `Compreendido, Líder. Tomei as medidas necessárias sobre: ${matchedKeywords.join(', ')}. As estatísticas do país foram atualizadas.`;
        recordHistory();
        updateUI();
    } else {
        // Generic response
        response = "Entendo sua preocupação, Líder Supremo. No momento não tenho recomendações específicas sobre esse assunto, mas continuarei monitorando a situação.";
    }

    addMessageToChat(response, 'advisor');
}

function sendChatMessage() {
    const input = document.getElementById('chat-input');
    const text = input.value.trim();
    if (text) {
        addMessageToChat(text, 'user');
        processAIAdvisor(text);
        input.value = '';
    }
}

window.onload = () => {
    initChart();
    updateUI();


    document.getElementById('send-chat').addEventListener('click', sendChatMessage);
    document.getElementById('chat-input').addEventListener('keydown', (e) => {
        if (e.key === 'Enter') sendChatMessage();
    });

    // Approval Modal Listeners
    const modal = document.getElementById('feedback-modal');
    const approvalCard = document.querySelector('.stat-card.approval');
    const closeBtn = document.querySelector('.close-modal');

    approvalCard.addEventListener('click', () => {
        updateFeedbackModal();
        modal.classList.remove('hidden');
    });

    closeBtn.addEventListener('click', () => {
        modal.classList.add('hidden');
    });

    window.addEventListener('click', (event) => {
        if (event.target == modal) {
            modal.classList.add('hidden');
        }
    });
};
