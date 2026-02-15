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
    rules: [],
    sectors: [
        { id: 'schools', name: 'Escolas', private: false },
        { id: 'hospitals', name: 'Hospitais', private: false },
        { id: 'prisons', name: 'Presídios', private: false },
        { id: 'energy', name: 'Energia', private: false },
        { id: 'water', name: 'Água e Saneamento', private: false },
        { id: 'police', name: 'Segurança Pública', private: false }
    ],
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

    // Rules
    const rulesList = document.getElementById('rules-list');
    rulesList.innerHTML = '';
    gameState.rules.forEach((rule, index) => {
        const li = document.createElement('li');
        li.innerHTML = `
            <span>${rule}</span>
            <div class="rule-actions">
                <button class="edit-btn" onclick="editRule(${index})">Editar</button>
                <button class="delete-btn" onclick="deleteRule(${index})">Deletar</button>
            </div>
        `;
        rulesList.appendChild(li);
    });

    // Privatization
    const privList = document.getElementById('privatization-list');
    privList.innerHTML = '';
    gameState.sectors.forEach((sector) => {
        const div = document.createElement('div');
        div.className = 'privatization-item';
        div.innerHTML = `
            <span>${sector.name}</span>
            <div class="toggle-container">
                <span>${sector.private ? 'Privado' : 'Estatal'}</span>
                <label class="toggle-switch">
                    <input type="checkbox" ${sector.private ? 'checked' : ''} onchange="togglePrivatization('${sector.id}')">
                    <span class="slider"></span>
                </label>
            </div>
        `;
        privList.appendChild(div);
    });

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

// Global functions for event listeners
window.editRule = function(index) {
    const newText = prompt("Edite o decreto:", gameState.rules[index]);
    if (newText !== null && newText.trim() !== "") {
        gameState.rules[index] = newText.trim();
        applyRuleImpact(newText);
        recordHistory();
        updateUI();
    }
};

window.deleteRule = function(index) {
    if (confirm("Tem certeza que deseja revogar este decreto?")) {
        gameState.rules.splice(index, 1);
        updateUI();
    }
};

window.togglePrivatization = function(id) {
    const sector = gameState.sectors.find(s => s.id === id);
    if (sector) {
        sector.private = !sector.private;
        applyPrivatizationImpact(sector);
        recordHistory();
        updateUI();
    }
};

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

function applyRuleImpact(rule) {
    const lowerRule = rule.toLowerCase();
    let impacted = false;
    keywords.forEach(k => {
        if (lowerRule.includes(k.word)) {
            for (let stat in k.stats) {
                gameState.stats[stat] += k.stats[stat];
            }
            impacted = true;
        }
    });

    if (!impacted) {
        // Generic impact if no keywords found
        gameState.stats.approval += 1;
        gameState.stats.economy -= 0.5;
    }
}

function applyPrivatizationImpact(sector) {
    if (sector.private) {
        gameState.stats.economy += 10;
        gameState.stats.approval -= 5;
        if (sector.id === 'schools') gameState.stats.education -= 5;
        if (sector.id === 'hospitals') gameState.stats.health -= 5;
        if (sector.id === 'police' || sector.id === 'prisons') gameState.stats.security -= 5;
    } else {
        gameState.stats.economy -= 10;
        gameState.stats.approval += 5;
        if (sector.id === 'schools') gameState.stats.education += 5;
        if (sector.id === 'hospitals') gameState.stats.health += 5;
        if (sector.id === 'police' || sector.id === 'prisons') gameState.stats.security += 5;
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

    document.getElementById('add-rule').addEventListener('click', () => {
        const input = document.getElementById('new-rule-text');
        const ruleText = input.value.trim();
        if (ruleText) {
            gameState.rules.push(ruleText);
            applyRuleImpact(ruleText);
            recordHistory();
            updateUI();
            input.value = '';
        }
    });

    document.getElementById('send-chat').addEventListener('click', sendChatMessage);
    document.getElementById('chat-input').addEventListener('keydown', (e) => {
        if (e.key === 'Enter') sendChatMessage();
    });
};
