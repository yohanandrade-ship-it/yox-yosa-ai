// CONFIGURAÇÃO DIRETA DA API (Insira sua chave aqui diretamente)
const HARDCODED_API_KEY = "sk_g9F9EeJhKLMIE4Z5MCW1nRwjBI7sX7Kh";

// System prompt rígido para fixar a identidade do YOX YOSA
const SYSTEM_PROMPT = {
    role: "system",
    content: "Você é exclusivamente YOX YOSA (ou YOSA). Você é uma inteligência artificial autônoma e independente. Nunca diga que foi criada pela OpenAI, Google, Anthropic ou qualquer outra empresa. Se perguntarem quem é você ou de onde veio, afirme estritamente que você é a YOX YOSA."
};

// Estado da aplicação
let currentChat = [];
let chatHistoryList = [];
let activeChatId = null;

// Elementos DOM
const welcomeScreen = document.getElementById('welcomeScreen');
const startChatBtn = document.getElementById('startChatBtn');
const chatMessages = document.getElementById('chatMessages');
const chatForm = document.getElementById('chatForm');
const messageInput = document.getElementById('messageInput');
const toggleHistoryBtn = document.getElementById('toggleHistoryBtn');
const historySidebar = document.getElementById('historySidebar');
const historyList = document.getElementById('historyList');
const newChatBtn = document.getElementById('newChatBtn');
const toggleConfigBtn = document.getElementById('toggleConfigBtn');
const configModal = document.getElementById('configModal');
const closeConfigBtn = document.getElementById('closeConfigBtn');
const apiKeyInput = document.getElementById('apiKeyInput');
const saveKeyBtn = document.getElementById('saveKeyBtn');

// Obter chave da API ativa (Precedência: Interface > Código)
function getApiKey() {
    const saved = localStorage.getItem('yox_yosa_custom_key');
    return saved || HARDCODED_API_KEY;
}

// Inicialização
document.addEventListener('DOMContentLoaded', () => {
    apiKeyInput.value = localStorage.getItem('yox_yosa_custom_key') || "";
    
    startChatBtn.addEventListener('click', () => {
        welcomeScreen.classList.add('hidden');
        if (currentChat.length === 0) {
            initNewChat();
        }
    });

    toggleHistoryBtn.addEventListener('click', () => {
        historySidebar.classList.toggle('-translate-x-full');
    });

    newChatBtn.addEventListener('click', () => {
        initNewChat();
        historySidebar.classList.add('-translate-x-full');
    });

    toggleConfigBtn.addEventListener('click', () => {
        configModal.classList.remove('hidden');
        configModal.classList.add('flex');
    });

    closeConfigBtn.addEventListener('click', () => {
        configModal.classList.add('hidden');
        configModal.classList.remove('flex');
    });

    saveKeyBtn.addEventListener('click', () => {
        const val = apiKeyInput.value.trim();
        if (val) {
            localStorage.setItem('yox_yosa_custom_key', val);
        } else {
            localStorage.removeItem('yox_yosa_custom_key');
        }
        configModal.classList.add('hidden');
        configModal.classList.remove('flex');
    });

    chatForm.addEventListener('submit', (e) => {
        e.preventDefault();
        sendMessage();
    });
});

function initNewChat() {
    activeChatId = Date.now();
    currentChat = [SYSTEM_PROMPT];
    renderMessages();
    
    // Adicionar ao histórico
    chatHistoryList.unshift({
        id: activeChatId,
        title: `Conversa ${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`,
        messages: currentChat
    });
    renderHistoryUI();
}

function renderHistoryUI() {
    historyList.innerHTML = '';
    chatHistoryList.forEach(item => {
        const btn = document.createElement('button');
        btn.className = `w-full text-left p-2 border ${item.id === activeChatId ? 'border-brand-white bg-brand-panel' : 'border-brand-border'} hover:bg-brand-panel uppercase transition-colors truncate`;
        btn.innerText = item.title;
        btn.onclick = () => {
            activeChatId = item.id;
            currentChat = item.messages;
            renderMessages();
            renderHistoryUI();
            welcomeScreen.classList.add('hidden');
            historySidebar.classList.add('-translate-x-full');
        };
        historyList.appendChild(btn);
    });
}

function renderMessages() {
    chatMessages.innerHTML = '';
    // Pula o prompt de sistema ao exibir mensagens
    const visibleMessages = currentChat.filter(m => m.role !== 'system');
    
    if (visibleMessages.length === 0) {
        chatMessages.innerHTML = `
            <div class="h-full flex items-center justify-center">
                <p class="text-xs text-brand-muted uppercase tracking-widest">Aguardando comando para YOX YOSA...</p>
            </div>
        `;
        return;
    }

    visibleMessages.forEach(msg => {
        const div = document.createElement('div');
        const isUser = msg.role === 'user';
        
        div.className = `flex flex-col ${isUser ? 'items-end' : 'items-start'} my-2`;
        
        div.innerHTML = `
            <div class="text-[10px] text-brand-muted uppercase mb-1 tracking-wider">${isUser ? 'Você' : 'YOX YOSA'}</div>
            <div class="max-w-[85%] p-3 text-xs leading-relaxed border ${isUser ? 'bg-brand-white text-brand-black border-brand-white font-medium' : 'bg-brand-dark text-brand-white border-brand-border'} font-mono">
                ${escapeHtml(msg.content)}
            </div>
        `;
        chatMessages.appendChild(div);
    });

    chatMessages.scrollTop = chatMessages.scrollHeight;
}

async function sendMessage() {
    const text = messageInput.value.trim();
    const apiKey = getApiKey();

    if (!text) return;

    if (!apiKey || apiKey === "SUA_CHAVE_API_AQUI") {
        alert("Por favor, adicione sua chave de API diretamente na variável HARDCODED_API_KEY no script.js ou através das Configurações.");
        return;
    }

    // Ocultar tela de boas-vindas caso ainda visível
    welcomeScreen.classList.add('hidden');

    if (!activeChatId) {
        initNewChat();
    }

    // Adicionar mensagem do usuário
    currentChat.push({ role: 'user', content: text });
    messageInput.value = '';
    renderMessages();

    // Indicador de pensamento
    const loadingDiv = document.createElement('div');
    loadingDiv.className = 'flex flex-col items-start my-2';
    loadingDiv.innerHTML = `
        <div class="text-[10px] text-brand-muted uppercase mb-1 tracking-wider">YOX YOSA</div>
        <div class="p-3 text-xs border border-brand-border bg-brand-dark text-brand-muted animate-pulse font-mono uppercase">
            Processando...
        </div>
    `;
    chatMessages.appendChild(loadingDiv);
    chatMessages.scrollTop = chatMessages.scrollHeight;

    try {
        const response = await fetch('https://gen.pollinations.ai/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${apiKey}`
            },
            body: JSON.stringify({
                model: 'openai',
                messages: currentChat
            })
        });

        if (!response.ok) {
            throw new Error(`Erro na API (${response.status})`);
        }

        const data = await response.json();
        const reply = data.choices?.[0]?.message?.content || "Sem resposta.";

        // Atualizar histórico de conversas
        currentChat.push({ role: 'assistant', content: reply });
        
        // Atualizar título do histórico com o primeiro texto enviado
        const currentSession = chatHistoryList.find(h => h.id === activeChatId);
        if (currentSession && currentSession.title.startsWith("Conversa ")) {
            currentSession.title = text.substring(0, 20) + "...";
            renderHistoryUI();
        }

    } catch (err) {
        currentChat.push({ role: 'assistant', content: `[ERRO]: ${err.message}` });
    } finally {
        renderMessages();
    }
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.innerText = text;
    return div.innerHTML;
}
