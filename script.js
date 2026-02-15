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
    laws: [],
    turn: 1
};


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


}


function applyLawsPassiveImpact() {
    gameState.laws.forEach(law => {
        const lowerLaw = law.toLowerCase();
        keywords.forEach(k => {
            if (lowerLaw.includes(k.word)) {
                // Laws have a smaller per-turn impact (10% of immediate impact)
                for (let stat in k.stats) {
                    gameState.stats[stat] += k.stats[stat] * 0.1;
                }
            }
        });
    });
}

function recordHistory() {
    applyLawsPassiveImpact();
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
    { word: 'saúde', stats: { health: 8, economy: -4, approval: 5 }, consequence: "O aumento na saúde atraiu refugiados buscando tratamento. O que faremos?" },
    { word: 'hospital', stats: { health: 10, economy: -5, approval: 5 }, consequence: "Os novos hospitais estão sem suprimentos básicos. Como resolver?" },
    { word: 'escola', stats: { education: 8, economy: -4, approval: 5 }, consequence: "As novas escolas estão sendo usadas para doutrinação política. Devemos intervir?" },
    { word: 'educação', stats: { education: 10, economy: -5, approval: 5 }, consequence: "Professores exigem autonomia total no currículo. O que o senhor diz?" },
    { word: 'segurança', stats: { security: 8, economy: -4, approval: 5 }, consequence: "A repressão aumentou, mas o crime organizado está revidando. Mais força?" },
    { word: 'polícia', stats: { security: 10, economy: -5, approval: 5 }, consequence: "A polícia pede tanques para patrulhar as favelas. Autorizamos?" },
    { word: 'arma', stats: { security: 5, approval: -5 }, consequence: "O mercado negro de armas está florescendo. Como lidar com isso?" },
    { word: 'imposto', stats: { economy: 10, approval: -10 }, consequence: "Os ricos estão fugindo do país para evitar as taxas. Fechamos as fronteiras?" },
    { word: 'taxa', stats: { economy: 10, approval: -10 }, consequence: "Pequenos comerciantes estão falindo devido aos novos custos. Auxílio ou ignorar?" },
    { word: 'grátis', stats: { approval: 10, economy: -10 }, consequence: "O 'grátis' gerou filas quilométricas. Como racionar o atendimento?" },
    { word: 'proibir', stats: { security: 5, approval: -5 }, consequence: "A proibição gerou um mercado paralelo lucrativo. Como agir?" },
    { word: 'morte', stats: { security: 10, approval: -15 }, consequence: "Grupos de direitos humanos iniciaram protestos globais contra nós." },
    { word: 'liberdade', stats: { approval: 10, security: -5 }, consequence: "A liberdade excessiva resultou em caos e desordem nas ruas." },
    { word: 'privatizar', stats: { economy: 12, approval: -8 }, consequence: "As empresas privadas demitiram milhares para lucrar mais." },
    { word: 'estatizar', stats: { economy: -12, approval: 8 }, consequence: "A corrupção nas estatais está drenando nossos cofres rapidamente." },
    { word: 'punição', stats: { security: 5, approval: -2 }, consequence: "Presídios superlotados estão à beira de uma rebelião sangrenta." },
    { word: 'trabalho', stats: { economy: 5, approval: 2 }, consequence: "Sindicatos exigem redução de jornada. Como o senhor responde?" }
];


function updateLawsModal() {
    const list = document.getElementById('laws-list');
    list.innerHTML = '';
    if (gameState.laws.length === 0) {
        list.innerHTML = '<li>Nenhuma lei decretada ainda.</li>';
    } else {
        gameState.laws.forEach(law => {
            const li = document.createElement('li');
            li.textContent = law;
            list.appendChild(li);
        });
    }
}

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

    // Detect Law/Rule creation
    const lawKeywords = ['lei', 'decreto', 'proibir', 'aprovar', 'liberar', 'taxar', 'investir', 'ordeno', 'quero'];
    const isLaw = lawKeywords.some(kw => lowerMessage.includes(kw));

    if (isLaw) {
        gameState.laws.push(message);
    }

    let matchedKeywords = [];
    let consequenceText = "";

    keywords.forEach(k => {
        if (lowerMessage.includes(k.word)) {
            for (let stat in k.stats) {
                gameState.stats[stat] += k.stats[stat];
            }
            matchedKeywords.push(k.word);
            if (k.consequence) consequenceText = k.consequence;
        }
    });

    let response = "";
    if (matchedKeywords.length > 0) {
        response = `Entendido, Líder. Apliquei as medidas solicitadas.`;
        if (consequenceText) {
            response += ` No entanto, surgiu uma consequência: ${consequenceText}`;
        }
    } else if (isLaw) {
        response = "Decreto anotado, Líder. Embora eu não tenha projeções exatas, sua vontade será cumprida.";
        // Generic impact for unspecified laws
        gameState.stats.approval += 1;
        gameState.stats.economy -= 0.5;
    } else {
        response = "Entendo sua visão, Líder Supremo. Vou analisar como podemos integrar isso em nossa estratégia de governo.";
    }

    addMessageToChat(response, 'advisor');
    recordHistory();
    updateUI();
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

    // Laws Modal Listeners
    const lawsModal = document.getElementById('laws-modal');
    const lawsBtn = document.getElementById('laws-btn');
    const closeLaws = document.getElementById('close-laws');

    lawsBtn.addEventListener('click', () => {
        updateLawsModal();
        lawsModal.classList.remove('hidden');
    });

    closeLaws.addEventListener('click', () => {
        lawsModal.classList.add('hidden');
    });

    window.addEventListener('click', (event) => {
        if (event.target == lawsModal) {
            lawsModal.classList.add('hidden');
        }
    });
};
