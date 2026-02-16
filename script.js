import { GoogleGenerativeAI } from "@google/generative-ai";

// Game State
let gameState = {
    simulationMode: false,
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


const keywords = [
    { word: 'saúde', stats: { health: 8, economy: -4, approval: 5 }, response: "Entendido. Aumentamos o investimento em hospitais e saneamento." },
    { word: 'hospital', stats: { health: 10, economy: -5, approval: 5 }, response: "Novos hospitais inaugurados. A capacidade de atendimento aumentou." },
    { word: 'escola', stats: { education: 8, economy: -4, approval: 5 }, response: "Escolas reformadas. O futuro da nação agradece." },
    { word: 'educação', stats: { education: 10, economy: -5, approval: 5 }, response: "Certo. Novas escolas e capacitação de professores em andamento." },
    { word: 'segurança', stats: { security: 8, economy: -4, approval: 5 }, response: "Medida aplicada. Reforçamos o policiamento e as fronteiras." },
    { word: 'polícia', stats: { security: 10, economy: -5, approval: 5 }, response: "Aumento de efetivo policial nas ruas para garantir a ordem." },
    { word: 'arma', stats: { security: 5, approval: -5 }, response: "Flexibilização/restrição de armas processada conforme seu desejo." },
    { word: 'imposto', stats: { economy: 10, approval: -10 }, response: "Impostos alterados. O tesouro agradece, mas o povo reclama." },
    { word: 'taxa', stats: { economy: 8, approval: -8 }, response: "Novas taxas aplicadas aos setores produtivos." },
    { word: 'grátis', stats: { approval: 10, economy: -10 }, response: "Serviços gratuitos distribuídos. Popularidade em alta, caixa em baixa." },
    { word: 'proibir', stats: { security: 5, approval: -5 }, response: "Proibição decretada. A ordem será mantida a qualquer custo." },
    { word: 'liberdade', stats: { approval: 10, security: -5 }, response: "Mais liberdades civis garantidas. O povo comemora nas ruas." },
    { word: 'privatizar', stats: { economy: 12, approval: -8 }, response: "Empresas vendidas ao setor privado. Eficiência aumentada, mas com protestos." },
    { word: 'estatizar', stats: { economy: -12, approval: 8 }, response: "O Estado assume o controle. O povo aprova a soberania, mas as contas pesam." },
    { word: 'trabalho', stats: { economy: 5, approval: 2 }, response: "Reformas trabalhistas processadas para incentivar o emprego." }
];

function applyLawsPassiveImpact() {
    // Passive impact remains a placeholder for now
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
        return { error: errorMsg, rawError: error.toString() };
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

function processSimulationAdvisor(message) {
    const lowerMessage = message.toLowerCase();
    let matched = false;
    let response = "Entendo sua visão, Líder Supremo. (Modo Simulado) Vou analisar como podemos integrar isso em nossa estratégia.";

    for (const k of keywords) {
        if (lowerMessage.includes(k.word)) {
            for (let stat in k.stats) {
                gameState.stats[stat] += k.stats[stat];
            }
            response = k.response + " (Modo Simulado)";
            matched = true;
            break;
        }
    }

    if (!matched) {
        const lawKeywords = ['lei', 'decreto', 'proibir', 'aprovar', 'liberar', 'taxar', 'investir', 'ordeno', 'quero'];
        if (lawKeywords.some(kw => lowerMessage.includes(kw))) {
            gameState.laws.push(message);
            gameState.stats.approval += 1;
            response = "Seu decreto foi registrado e será cumprido. (Modo Simulado)";
        }
    }

    addMessageToChat(response, 'advisor');
    recordHistory();
    updateUI();
}

async function processAIAdvisor(message) {
    if (gameState.simulationMode) {
        processSimulationAdvisor(message);
        return;
    }

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
        if (result && result.rawError) {
             addMessageToChat(`Detalhes técnicos: ${result.rawError}`, 'advisor');
        }
        addMessageToChat("Dica: Verifique sua chave nas configurações ou limpe-a para usar o Modo Simulado.", 'advisor');
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
            gameState.simulationMode = false;
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

        const skipBtn = document.getElementById('skip-setup');
        if (skipBtn) {
            skipBtn.addEventListener('click', () => {
                gameState.simulationMode = true;
                document.getElementById('setup-modal').classList.add('hidden');
                document.getElementById('game-container').classList.remove('hidden');
                addMessageToChat("Bem-vindo, Líder Supremo. Iniciamos em MODO SIMULADO (sem IA). Você pode inserir uma chave nas configurações a qualquer momento.", 'advisor');
                updateUI();
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
                const key = apiKeyInput.value.trim();
                localStorage.setItem('gemini_api_key', key);
                alert('Configurações salvas!');
                settingsModal.classList.add('hidden');
                if (key) gameState.simulationMode = false;
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
