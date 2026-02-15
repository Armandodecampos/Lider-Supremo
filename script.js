import { GoogleGenerativeAI } from "@google/generative-ai";

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
    try {
        // Stats
        for (let stat in gameState.stats) {
            const val = Math.max(0, Math.min(100, gameState.stats[stat]));
            gameState.stats[stat] = val; // Clamp
            const bar = document.getElementById(`stat-${stat}`);
            const text = document.getElementById(`value-${stat}`);
            if (bar) bar.style.width = `${val}%`;
            if (text) text.textContent = `${Math.round(val)}%`;
        }
    } catch (e) {
        console.error("Erro ao atualizar UI:", e);
    }
}


function applyLawsPassiveImpact() {
    // Passive impact could be implemented here in the future
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

async function testGeminiConnection(key) {
    if (!key) return { success: false, message: "Chave vazia." };
    try {
        const genAI = new GoogleGenerativeAI(key);
        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
        const result = await model.generateContent("Olá, responda apenas 'OK'.");
        if (result.response.text()) {
            return { success: true, message: "Conexão bem-sucedida!" };
        }
        return { success: false, message: "Resposta vazia da API." };
    } catch (error) {
        console.error("Erro no teste de conexão:", error);
        let msg = "Falha na conexão.";
        if (error.message.includes("API_KEY_INVALID")) msg = "Chave de API inválida.";
        if (error.message.includes("429")) msg = "Muitas requisições (429). Aguarde.";
        return { success: false, message: msg };
    }
}

async function processAIWithGemini(message) {
    const apiKey = localStorage.getItem('gemini_api_key');
    if (!apiKey) return { error: "Chave de API não encontrada." };

    try {
        const genAI = new GoogleGenerativeAI(apiKey);
        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

        const systemPrompt = `Você é o Conselheiro Imperial do Líder Supremo em um simulador de governo complexo.
Sua tarefa é analisar as ordens do Líder, aplicar impactos nas estatísticas do país e fornecer avisos realistas sobre a situação política.
Estatísticas atuais: Saúde: ${gameState.stats.health}%, Educação: ${gameState.stats.education}%, Segurança: ${gameState.stats.security}%, Economia: ${gameState.stats.economy}%, Aprovação: ${gameState.stats.approval}%.
Leis ativas: ${gameState.laws.join(', ') || 'Nenhuma'}.
Turno atual: ${gameState.turn}.

Regras de Impacto:
- Seja realista: grandes mudanças custam caro ou afetam a aprovação.
- Retorne RIGOROSAMENTE APENAS o JSON no formato abaixo, sem explicações fora dele:
{
  "response": "Sua resposta textual ao jogador, profunda e política.",
  "stats": { "health": delta, "education": delta, "security": delta, "economy": delta, "approval": delta },
  "isLaw": true/false,
  "report": "opcional"
}
Onde 'delta' é um número (ex: 5, -3.5, 0).`;

        const result = await model.generateContent([systemPrompt, message]);
        const responseText = result.response.text();

        // Find JSON in response (Gemini sometimes adds markdown blocks)
        const jsonMatch = responseText.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
            try {
                return JSON.parse(jsonMatch[0]);
            } catch (e) {
                console.error("Erro ao processar JSON da IA:", responseText);
                return { error: "O conselheiro enviou um relatório em formato inválido." };
            }
        }
        return { error: "O conselheiro não respondeu adequadamente. Tente novamente." };
    } catch (error) {
        console.error("Erro na API Gemini:", error);
        let errorMsg = "Erro na comunicação com o núcleo da IA.";
        if (error.message.includes("API_KEY_INVALID")) errorMsg = "Sua Chave de API é inválida.";
        if (error.message.includes("429")) errorMsg = "Limite de requisições excedido. Aguarde um momento.";
        if (error.message.includes("safety")) errorMsg = "A resposta foi bloqueada pelos filtros de segurança da IA.";
        return { error: errorMsg };
    }
}

async function generateSituationReport() {
    const apiKey = localStorage.getItem('gemini_api_key');
    if (!apiKey) return;

    try {
        const genAI = new GoogleGenerativeAI(apiKey);
        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

        const systemPrompt = `Você é o Analista de Inteligência do Líder Supremo.
Analise o estado atual do país e forneça um relatório situacional curto (máximo 2 parágrafos).
Destaque problemas, avisos ou informações importantes.
Estatísticas atuais: Saúde: ${gameState.stats.health}%, Educação: ${gameState.stats.education}%, Segurança: ${gameState.stats.security}%, Economia: ${gameState.stats.economy}%, Aprovação: ${gameState.stats.approval}%.
Leis ativas: ${gameState.laws.join(', ') || 'Nenhuma'}.

Retorne APENAS JSON:
{
  "report": "Texto do seu relatório aqui."
}`;

        const result = await model.generateContent(systemPrompt);
        const responseText = result.response.text();
        const jsonMatch = responseText.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
            try {
                const data = JSON.parse(jsonMatch[0]);
                addMessageToChat(`📋 RELATÓRIO DE ESTADO (Mês ${gameState.turn}): ${data.report}`, 'advisor');
            } catch (e) {
                console.error("Erro ao parsear relatório situacional:", responseText);
            }
        }
    } catch (error) {
        console.error("Erro ao gerar relatório:", error);
    }
}

async function processAIAdvisor(message) {
    // Try Gemini
    const result = await processAIWithGemini(message);

    if (result && !result.error) {
        // Apply stats from Gemini
        if (result.stats) {
            for (let stat in result.stats) {
                if (gameState.stats[stat] !== undefined) {
                    gameState.stats[stat] += result.stats[stat];
                }
            }
        }

        // Check if it's a law
        if (result.isLaw) {
            gameState.laws.push(message);
        }

        addMessageToChat(result.response, 'advisor');
        if (result.report && result.report !== "opcional") {
            setTimeout(() => addMessageToChat(`📢 RELATÓRIO: ${result.report}`, 'advisor'), 1000);
        }
    } else {
        const msg = result ? result.error : "Erro desconhecido no conselheiro.";
        addMessageToChat(`🚫 FALHA NO CONSELHEIRO: ${msg}`, 'advisor');
        addMessageToChat("Dica: Verifique se sua chave de API está correta nas configurações (ícone de engrenagem).", 'advisor');
    }

    recordHistory();
    updateUI();

    // Proactive reports every 3 turns
    if (gameState.turn % 3 === 0) {
        setTimeout(generateSituationReport, 2000);
    }
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

function checkApiKey() {
    try {
        const apiKey = localStorage.getItem('gemini_api_key');
        const setupModal = document.getElementById('setup-modal');
        const gameContainer = document.getElementById('game-container');

        if (apiKey && apiKey.trim() !== '') {
            if (setupModal) setupModal.classList.add('hidden');
            if (gameContainer) gameContainer.classList.remove('hidden');
            return true;
        } else {
            if (setupModal) setupModal.classList.remove('hidden');
            if (gameContainer) gameContainer.classList.add('hidden');
            return false;
        }
    } catch (e) {
        console.error("Erro ao verificar API Key:", e);
        return false;
    }
}

window.init = init;
function init() {
    console.log("Iniciando Simulador Líder Supremo...");

    // Setup Modal logic - Attached as early as possible
    const startGameBtn = document.getElementById('start-game');
    const setupApiKeyInput = document.getElementById('setup-api-key-input');

    if (startGameBtn && setupApiKeyInput) {
        startGameBtn.addEventListener('click', () => {
            const key = setupApiKeyInput.value.trim();
            if (key) {
                localStorage.setItem('gemini_api_key', key);
                if (checkApiKey()) {
                    addMessageToChat("Bem-vindo, Líder Supremo. Sou seu conselheiro IA. O país aguarda suas ordens.", 'advisor');
                    updateUI();
                }
            } else {
                alert("Por favor, insira uma chave de API válida para continuar.");
            }
        });

        const testBtn = document.getElementById('test-key-setup');
        if (testBtn) {
            testBtn.addEventListener('click', async () => {
                testBtn.disabled = true;
                testBtn.textContent = "Testando...";
                const res = await testGeminiConnection(setupApiKeyInput.value.trim());
                alert(res.message);
                testBtn.disabled = false;
                testBtn.textContent = "Testar Chave";
            });
        }
    }

    checkApiKey();
    updateUI();

    // Other Listeners
    try {
        const sendBtn = document.getElementById('send-chat');
        if (sendBtn) sendBtn.addEventListener('click', sendChatMessage);

        const chatInput = document.getElementById('chat-input');
        if (chatInput) chatInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') sendChatMessage();
        });

        // Approval Modal Listeners
        const modal = document.getElementById('feedback-modal');
        const approvalCard = document.querySelector('.stat-card.approval');
        const closeBtn = document.querySelector('.close-modal');

        if (approvalCard && modal) {
            approvalCard.addEventListener('click', () => {
                updateFeedbackModal();
                modal.classList.remove('hidden');
            });
        }

        if (closeBtn && modal) {
            closeBtn.addEventListener('click', () => {
                modal.classList.add('hidden');
            });
        }

        window.addEventListener('click', (event) => {
            if (event.target == modal) {
                modal.classList.add('hidden');
            }
        });

        // Laws Modal Listeners
        const lawsModal = document.getElementById('laws-modal');
        const lawsBtn = document.getElementById('laws-btn');
        const closeLaws = document.getElementById('close-laws');

        if (lawsBtn && lawsModal) {
            lawsBtn.addEventListener('click', () => {
                updateLawsModal();
                lawsModal.classList.remove('hidden');
            });
        }

        if (closeLaws && lawsModal) {
            closeLaws.addEventListener('click', () => {
                lawsModal.classList.add('hidden');
            });
        }

        window.addEventListener('click', (event) => {
            if (event.target == lawsModal) {
                lawsModal.classList.add('hidden');
            }
        });

        // Settings Modal Listeners
        const settingsModal = document.getElementById('settings-modal');
        const settingsBtn = document.getElementById('settings-btn');
        const closeSettings = document.getElementById('close-settings');
        const saveSettings = document.getElementById('save-settings');
        const apiKeyInput = document.getElementById('api-key-input');

        if (settingsBtn && settingsModal) {
            settingsBtn.addEventListener('click', () => {
                apiKeyInput.value = localStorage.getItem('gemini_api_key') || '';
                settingsModal.classList.remove('hidden');
            });
        }

        if (closeSettings && settingsModal) {
            closeSettings.addEventListener('click', () => {
                settingsModal.classList.add('hidden');
            });
        }

        if (saveSettings && settingsModal) {
            saveSettings.addEventListener('click', () => {
                localStorage.setItem('gemini_api_key', apiKeyInput.value.trim());
                alert('Configurações salvas!');
                settingsModal.classList.add('hidden');
                checkApiKey();
            });
        }

        const testSettingsBtn = document.getElementById('test-key-settings');
        if (testSettingsBtn) {
            testSettingsBtn.addEventListener('click', async () => {
                testSettingsBtn.disabled = true;
                testSettingsBtn.textContent = "Testando...";
                const res = await testGeminiConnection(apiKeyInput.value.trim());
                alert(res.message);
                testSettingsBtn.disabled = false;
                testSettingsBtn.textContent = "Testar Chave";
            });
        }

        window.addEventListener('click', (event) => {
            if (event.target == settingsModal) {
                settingsModal.classList.add('hidden');
            }
        });
    } catch (e) {
        console.warn("Alguns ouvintes de eventos não puderam ser anexados:", e);
    }
}

// Ensure init runs regardless of load event if script is loaded late
if (document.readyState === 'loading') {
    window.addEventListener('load', init);
} else {
    init();
}
