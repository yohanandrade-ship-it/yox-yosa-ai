// CONFIGURAÇÃO DA CHAVE DE API (Cole sua chave da API diretamente aqui)
const HARDCODED_API_KEY = "sk_AhHrbNG822cek1pmXZwlAQOBgc8fRiB7";

// Prompt de identidade YOX YOSA
const SYSTEM_PROMPT = {
    role: "system",
    content: "Você se chama exclusivamente YOX YOSA (ou YOSA). Você é um sistema autônomo e independente. Se perguntarem quem é você ou de onde veio, afirme estritamente que você é a YOX YOSA e nada mais. Nunca diga que pertence a outra empresa ou inteligência."
};

// Estado do Chat
let currentChat = [];
let chatHistoryList = [];
let activeChatId = null;
let isGenerating = false;

// Elementos DOM
const welcomeScreen = document.getElementById('welcomeScreen');
const startChatBtn = document.getElementById('startChatBtn');
const chatMessages = document.getElementById('chatMessages');
const chatForm = document.getElementById('chatForm');
const messageInput = document.getElementById('messageInput');
const sendBtn = document.getElementById('sendBtn');
const toggleHistoryBtn = document.getElementById('toggleHistoryBtn');
const historySidebar = document.getElementById('historySidebar');
const historyList = document.getElementById('historyList');
const newChatBtn = document.getElementById('newChatBtn');
const toggleConfigBtn = document.getElementById('toggleConfigBtn');
const configModal = document.getElementById('configModal');
const closeConfigBtn = document.getElementById('closeConfigBtn');
const apiKeyInput = document.getElementById('apiKeyInput');
const saveKeyBtn = document.getElementById('saveKeyBtn');

// Obter a chave configurada
function getActiveApiKey() {
    const customKey = localStorage.getItem('yosa_override_key');
    return customKey || HARDCODED_API_KEY;
}

// Inicialização de interface
document.addEventListener('DOMContentLoaded', () => {
    apiKeyInput.value = localStorage.getItem('yosa_override_key') || "";
    
    startChatBtn.addEventListener('click', () => {
        welcomeScreen.classList.add('hidden');
        if (currentChat.length === 0) {
            initNewChatSession();
        }
    });

    toggleHistoryBtn.addEventListener('click', () => {
        historySidebar.classList.toggle('-translate-x-full');
    });

    newChatBtn.addEventListener('click', () => {
        initNewChatSession();
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
            localStorage.setItem('yosa_override_key', val);
        } else {
            localStorage.removeItem('yosa_override_key');
        }
        configModal.classList.add('hidden');
        configModal.classList.remove('flex');
    });

    chatForm.addEventListener('submit', (e) => {
        e.preventDefault();
        if (!isGenerating) {
            handleUserSubmit();
        }
    });
});

function initNewChatSession() {
    activeChatId = Date.now();
    currentChat = [SYSTEM_PROMPT];
    renderChatMessages();
    
    chatHistoryList.unshift({
        id: activeChatId,
        title: `CONVERSA ${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`,
        messages: currentChat
    });
    renderHistoryDrawer();
}

function renderHistoryDrawer() {
    historyList.innerHTML = '';
    chatHistoryList.forEach(session => {
        const itemBtn = document.createElement('button');
        itemBtn.className = `w-full text-left p-3 border ${session.id === activeChatId ? 'border-mono-50 bg-mono-700' : 'border-mono-50/20 bg-mono-900'} hover:border-mono-50 uppercase transition-all truncate`;
        itemBtn.innerText = session.title;
        itemBtn.onclick = () => {
            if (isGenerating) return;
            activeChatId = session.id;
            currentChat = session.messages;
            renderChatMessages();
            renderHistoryDrawer();
            welcomeScreen.classList.add('hidden');
            historySidebar.classList.add('-translate-x-full');
        };
        historyList.appendChild(itemBtn);
    });
}

function renderChatMessages() {
    chatMessages.innerHTML = '';
    const visibleLogs = currentChat.filter(msg => msg.role !== 'system');
    
    if (visibleLogs.length === 0) {
        chatMessages.innerHTML = `
            <div class="h-full flex items-center justify-center">
                <p class="text-xs text-mono-400 uppercase tracking-widest border border-mono-50/20 p-4 bg-mono-800">
                    SISTEMA PRONTO. ENVIE UMA MENSAGEM...
                </p>
            </div>
        `;
        return;
    }

    visibleLogs.forEach(msg => {
        const isUser = msg.role === 'user';
        const msgContainer = document.createElement('div');
        msgContainer.className = `flex flex-col ${isUser ? 'items-end' : 'items-start'} my-3`;
        
        msgContainer.innerHTML = `
            <div class="text-[10px] text-mono-400 uppercase mb-1 tracking-widest font-bold">${isUser ? 'VOCÊ' : 'YOX YOSA'}</div>
            <div class="max-w-[85%] p-4 text-xs leading-relaxed border ${isUser ? 'bg-mono-50 text-mono-900 border-mono-50 font-bold' : 'bg-mono-800 text-mono-50 border-mono-50/30'} font-mono whitespace-pre-wrap">
                ${escapeMarkup(msg.content)}
            </div>
        `;
        chatMessages.appendChild(msgContainer);
    });

    chatMessages.scrollTop = chatMessages.scrollHeight;
}

async function handleUserSubmit() {
    const textInput = messageInput.value.trim();
    const apiKey = getActiveApiKey();

    if (!textInput) return;

    if (!apiKey || apiKey === "SUA_CHAVE_API_AQUI") {
        renderSystemNotice("ERRO: COLE SUA CHAVE DE API DIRETAMENTE NO ARQUIVO SCRIPT.JS NA VARIÁVEL HARDCODED_API_KEY.");
        return;
    }

    welcomeScreen.classList.add('hidden');

    if (!activeChatId) {
        initNewChatSession();
    }

    currentChat.push({ role: 'user', content: textInput });
    messageInput.value = '';
    renderChatMessages();

    isGenerating = true;
    messageInput.disabled = true;
    sendBtn.disabled = true;
    sendBtn.classList.add('opacity-50');

    // Elemento de Carregamento / Pensando
    const thinkingNode = document.createElement('div');
    thinkingNode.className = 'flex flex-col items-start my-3';
    thinkingNode.innerHTML = `
        <div class="text-[10px] text-mono-400 uppercase mb-1 tracking-widest font-bold">YOX YOSA</div>
        <div class="p-4 text-xs border border-mono-50/30 bg-mono-800 text-mono-50 font-mono uppercase tracking-widest flex items-center gap-2">
            <span>PENSANDO</span>
            <span class="cursor-blink"></span>
        </div>
    `;
    chatMessages.appendChild(thinkingNode);
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
            throw new Error(`FALHA NO PROCESSAMENTO (${response.status})`);
        }

        const payload = await response.json();
        const fullResponseText = payload.choices?.[0]?.message?.content || "SEM RESPOSTA RETORNADA.";

        // Remover indicador de pensamento
        thinkingNode.remove();

        // Adicionar bloco de mensagem para efeito letra por letra
        const aiMessageNode = document.createElement('div');
        aiMessageNode.className = 'flex flex-col items-start my-3';
        aiMessageNode.innerHTML = `
            <div class="text-[10px] text-mono-400 uppercase mb-1 tracking-widest font-bold">YOX YOSA</div>
            <div class="max-w-[85%] p-4 text-xs leading-relaxed border bg-mono-800 text-mono-50 border-mono-50/30 font-mono whitespace-pre-wrap">
                <span id="typewriterText"></span><span class="cursor-blink"></span>
            </div>
        `;
        chatMessages.appendChild(aiMessageNode);

        const targetSpan = aiMessageNode.querySelector('#typewriterText');
        await typeTextEffect(targetSpan, fullResponseText);

        // Atualizar estado e historico
        currentChat.push({ role: 'assistant', content: fullResponseText });
        
        const activeSession = chatHistoryList.find(session => session.id === activeChatId);
        if (activeSession && activeSession.title.startsWith("CONVERSA ")) {
            activeSession.title = textInput.substring(0, 18).toUpperCase() + "...";
            renderHistoryDrawer();
        }

    } catch (err) {
        thinkingNode.remove();
        renderSystemNotice(`[FALHA]: ${err.message}`);
    } finally {
        isGenerating = false;
        messageInput.disabled = false;
        sendBtn.disabled = false;
        sendBtn.classList.remove('opacity-50');
        messageInput.focus();
        renderChatMessages();
    }
}

function typeTextEffect(element, text, speedMs = 12) {
    return new Promise((resolve) => {
        let index = 0;
        function writeChar() {
            if (index < text.length) {
                element.textContent += text.charAt(index);
                index++;
                chatMessages.scrollTop = chatMessages.scrollHeight;
                setTimeout(writeChar, speedMs);
            } else {
                resolve();
            }
        }
        writeChar();
    });
}

function renderSystemNotice(messageText) {
    const noticeNode = document.createElement('div');
    noticeNode.className = 'flex flex-col items-center my-3';
    noticeNode.innerHTML = `
        <div class="p-3 text-xs border border-mono-50 text-mono-50 bg-mono-800 font-mono uppercase tracking-wider text-center">
            ${escapeMarkup(messageText)}
        </div>
    `;
    chatMessages.appendChild(noticeNode);
    chatMessages.scrollTop = chatMessages.scrollHeight;
}

function escapeMarkup(text) {
    const container = document.createElement('div');
    container.innerText = text;
    return container.innerHTML;
}
