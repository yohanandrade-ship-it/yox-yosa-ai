const SYSTEM_PROMPT = "Você é YOX YOSA, uma inteligência artificial avançada, prestativa, elegante e amigável desenvolvida para ajudar os usuários com qualquer dúvida, cálculos, textos e ideias. Responda em português brasileiro, seja clara, útil e cordial."

let state = {
  chats: [],
  currentChatId: null,
  settings: {
    theme: 'dark',
    soundEnabled: true,
    ttsEnabled: false,
    apiKey: ''
  },
  isGenerating: false,
  attachedFile: null,
  recognition: null,
  isListening: false
};

const API_KEY_STORAGE_KEY = 'yox_yosa_api_key';

window.addEventListener('DOMContentLoaded', () => {
  loadStateFromStorage();
  setupTheme();
  setupSpeechRecognition();
  renderHistory();

  if (state.chats.length === 0) {
    createNewChat();
  } else {
    loadChat(state.chats[0].id);
  }
});

function saveState() {
  localStorage.setItem('yox_yosa_chats', JSON.stringify(state.chats));
  localStorage.setItem('yox_yosa_settings', JSON.stringify(state.settings));

  if (state.settings.apiKey && state.settings.apiKey.trim()) {
    localStorage.setItem(API_KEY_STORAGE_KEY, state.settings.apiKey.trim());
  } else {
    localStorage.removeItem(API_KEY_STORAGE_KEY);
  }
}

function loadStateFromStorage() {
  const savedChats = localStorage.getItem('yox_yosa_chats');
  const savedSettings = localStorage.getItem('yox_yosa_settings');
  const savedApiKey = localStorage.getItem(API_KEY_STORAGE_KEY);

  if (savedChats) {
    try { state.chats = JSON.parse(savedChats); } catch (e) { state.chats = []; }
  }
  if (savedSettings) {
    try { state.settings = { ...state.settings, ...JSON.parse(savedSettings) }; } catch (e) {}
  }

  if (savedApiKey && !state.settings.apiKey) {
    state.settings.apiKey = savedApiKey;
  }

  document.getElementById('sound-toggle').checked = state.settings.soundEnabled;
  document.getElementById('tts-toggle').checked = state.settings.ttsEnabled;
  document.getElementById('theme-select').value = state.settings.theme;
  document.getElementById('api-key-input').value = state.settings.apiKey || '';
}

function setupTheme() {
  if (state.settings.theme === 'dark') {
    document.documentElement.classList.add('dark');
  } else {
    document.documentElement.classList.remove('dark');
  }
}

function toggleTheme() {
  state.settings.theme = state.settings.theme === 'dark' ? 'light' : 'dark';
  document.getElementById('theme-select').value = state.settings.theme;
  setupTheme();
  saveState();
}

function changeThemeFromSelect(val) {
  state.settings.theme = val;
  setupTheme();
  saveState();
}

function toggleSidebar() {
  const sidebar = document.getElementById('sidebar');
  const overlay = document.getElementById('sidebar-overlay');
  const isClosed = sidebar.classList.contains('-translate-x-full');

  if (isClosed) {
    sidebar.classList.remove('-translate-x-full');
    overlay.classList.remove('hidden');
  } else {
    sidebar.classList.add('-translate-x-full');
    overlay.classList.add('hidden');
  }
}

function createNewChat() {
  const newChat = {
    id: Date.now().toString(),
    title: 'Nova Conversa',
    createdAt: new Date().toISOString(),
    messages: []
  };

  state.chats.unshift(newChat);
  state.currentChatId = newChat.id;
  saveState();
  renderHistory();
  loadChat(newChat.id);

  if (window.innerWidth < 1024) {
    const sidebar = document.getElementById('sidebar');
    const overlay = document.getElementById('sidebar-overlay');
    sidebar.classList.add('-translate-x-full');
    overlay.classList.add('hidden');
  }
}

function loadChat(chatId) {
  state.currentChatId = chatId;
  const chat = state.chats.find(c => c.id === chatId);
  if (!chat) return;

  document.getElementById('current-chat-title').innerText = chat.title;

  const welcomeScreen = document.getElementById('welcome-screen');
  const messagesList = document.getElementById('messages-list');
  messagesList.innerHTML = '';

  if (chat.messages.length === 0) {
    welcomeScreen.classList.remove('hidden');
    welcomeScreen.classList.add('flex');
    messagesList.classList.add('hidden');
  } else {
    welcomeScreen.classList.add('hidden');
    welcomeScreen.classList.remove('flex');
    messagesList.classList.remove('hidden');

    chat.messages.forEach(msg => {
      appendMessageUI(msg.role, msg.content, false);
    });

    scrollToBottom();
  }

  renderHistory();
}

function deleteChat(chatId, event) {
  event.stopPropagation();
  state.chats = state.chats.filter(c => c.id !== chatId);
  saveState();

  if (state.chats.length === 0) {
    createNewChat();
  } else if (state.currentChatId === chatId) {
    loadChat(state.chats[0].id);
  } else {
    renderHistory();
  }
}

function renderHistory() {
  const container = document.getElementById('chat-history-container');
  container.innerHTML = '';

  if (state.chats.length === 0) return;

  const groupDiv = document.createElement('div');
  groupDiv.className = 'space-y-1';

  const label = document.createElement('div');
  label.className = 'text-[11px] font-semibold text-zinc-400 px-2 py-1 uppercase tracking-wider';
  label.innerText = 'Conversas Recentes';
  groupDiv.appendChild(label);

  state.chats.forEach(chat => {
    const isActive = chat.id === state.currentChatId;
    const btn = document.createElement('div');
    btn.onclick = () => loadChat(chat.id);
    btn.className = `group flex items-center justify-between px-3 py-2 rounded-xl text-sm cursor-pointer transition ${
      isActive 
        ? 'bg-zinc-200/80 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 font-medium' 
        : 'text-zinc-600 dark:text-zinc-400 hover:bg-zinc-200/50 dark:hover:bg-zinc-800/50'
    }`;

    btn.innerHTML = `
      <div class="flex items-center gap-2.5 overflow-hidden">
        <i class="fa-regular fa-message text-xs shrink-0 text-zinc-400"></i>
        <span class="truncate">${escapeHtml(chat.title)}</span>
      </div>
      <button onclick="deleteChat('${chat.id}', event)" class="opacity-0 group-hover:opacity-100 p-1 text-zinc-400 hover:text-red-500 transition">
        <i class="fa-solid fa-trash-can text-xs"></i>
      </button>
    `;

    groupDiv.appendChild(btn);
  });

  container.appendChild(groupDiv);
}

function handleKeyDown(event) {
  if (event.key === 'Enter' && !event.shiftKey) {
    event.preventDefault();
    handleSendMessage(event);
  }
}

function autoResizeTextarea(textarea) {
  textarea.style.height = 'auto';
  textarea.style.height = Math.min(textarea.scrollHeight, 128) + 'px';
}

function sanitizeInput(text) {
  return text.replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

function handleSendMessage(event) {
  if (event) event.preventDefault();
  if (state.isGenerating) return;

  const input = document.getElementById('user-input');
  let rawText = input.value.trim();
  if (!rawText) return;

  let text = sanitizeInput(rawText);

  if (state.attachedFile) {
    text = `[Arquivo: ${escapeHtml(state.attachedFile.name)}] ${text}`;
    cancelStatus();
  }

  const chat = state.chats.find(c => c.id === state.currentChatId);
  if (!chat) return;

  if (chat.messages.length === 0) {
    chat.title = text.length > 28 ? text.substring(0, 28) + '...' : text;
    document.getElementById('current-chat-title').innerText = chat.title;
  }

  chat.messages.push({ role: 'user', content: text });

  document.getElementById('welcome-screen').classList.add('hidden');
  document.getElementById('welcome-screen').classList.remove('flex');
  const messagesList = document.getElementById('messages-list');
  messagesList.classList.remove('hidden');

  appendMessageUI('user', text, false);

  input.value = '';
  input.style.height = 'auto';
  saveState();
  renderHistory();
  scrollToBottom();

  fetchAIResponse(text);
}

function appendMessageUI(role, content, isThinking = false) {
  const messagesList = document.getElementById('messages-list');
  const wrapper = document.createElement('div');
  wrapper.className = `flex gap-3 sm:gap-4 ${role === 'user' ? 'justify-end' : 'justify-start'}`;

  if (role === 'assistant') {
    wrapper.innerHTML = `
      <div class="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-zinc-800 dark:bg-zinc-100 text-white dark:text-zinc-900 flex items-center justify-center font-bold text-xs shrink-0 mt-0.5">
        Y
      </div>
      <div class="flex-1 max-w-2xl space-y-2">
        <div class="text-xs font-semibold text-zinc-400">YOX YOSA</div>
        <div class="msg-content text-sm sm:text-base text-zinc-800 dark:text-zinc-100 leading-relaxed font-normal ${isThinking ? 'text-zinc-400 italic' : ''}">
          ${isThinking ? 'Pensando...' : escapeHtml(content)}
        </div>
      </div>
    `;
  } else {
    wrapper.innerHTML = `
      <div class="max-w-xl bg-zinc-200 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 px-4 py-2.5 rounded-2xl rounded-tr-none text-sm sm:text-base leading-relaxed break-words">
        ${escapeHtml(content)}
      </div>
    `;
  }

  messagesList.appendChild(wrapper);
  return wrapper;
}

async function fetchAIResponse(userPrompt) {
  state.isGenerating = true;
  document.getElementById('send-btn').disabled = true;

  const thinkingBubble = appendMessageUI('assistant', '', true);
  scrollToBottom();

  let aiTextResponse = '';
  const activeKey = (state.settings.apiKey || '').trim();
  const fullPrompt = `${SYSTEM_PROMPT}\n\nUsuário pergunta: ${userPrompt}`;

  try {
    let url = `https://text.pollinations.ai/${encodeURIComponent(fullPrompt)}`;
    if (activeKey) {
      url += `?key=${encodeURIComponent(activeKey)}`;
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 6000);

    const res = await fetch(url, { signal: controller.signal });
    clearTimeout(timeoutId);

    if (res.ok) {
      aiTextResponse = await res.text();
    }
  } catch (e) {
    console.warn('Attempt 1 failed, trying POST fallback...', e);
  }

  if (!aiTextResponse || aiTextResponse.trim() === '') {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 6000);

      const res = await fetch('https://text.pollinations.ai/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [
            { role: 'system', content: SYSTEM_PROMPT },
            { role: 'user', content: userPrompt }
          ]
        }),
        signal: controller.signal
      });
      clearTimeout(timeoutId);

      if (res.ok) {
        aiTextResponse = await res.text();
      }
    } catch (e) {
      console.warn('Attempt 2 failed, switching to local intelligence fallback', e);
    }
  }

  if (!aiTextResponse || aiTextResponse.trim() === '') {
    aiTextResponse = generateEmergencyResponse(userPrompt);
  }

  const contentDiv = thinkingBubble.querySelector('.msg-content');
  contentDiv.classList.remove('text-zinc-400', 'italic');
  contentDiv.innerText = '';
  contentDiv.classList.add('typing-cursor');

  let charIndex = 0;
  const speed = 10;

  function typeChar() {
    if (charIndex < aiTextResponse.length) {
      contentDiv.innerText += aiTextResponse.charAt(charIndex);
      charIndex++;
      scrollToBottom();

      if (state.settings.soundEnabled && charIndex % 3 === 0) {
        playClickSound();
      }

      setTimeout(typeChar, speed);
    } else {
      contentDiv.classList.remove('typing-cursor');
      state.isGenerating = false;
      document.getElementById('send-btn').disabled = false;

      const chat = state.chats.find(c => c.id === state.currentChatId);
      if (chat) {
        chat.messages.push({ role: 'assistant', content: aiTextResponse });
        saveState();
      }

      if (state.settings.ttsEnabled) {
        speakText(aiTextResponse);
      }
    }
  }

  typeChar();
}

function generateEmergencyResponse(input) {
  const clean = input.toLowerCase().trim();

  if (clean.includes("quem é você") || clean.includes("quem e voce") || clean.includes("qual seu nome") || clean.includes("quem voce e")) {
    return "Eu sou o YOX YOSA, sua inteligência artificial assistente! Como posso te ajudar agora?";
  }

  if (clean === "oi" || clean === "olá" || clean === "ola") {
    return "Oi! Tudo bem? Como posso ajudar você hoje?";
  }

  try {
    let mathExpr = clean
      .replace(/quanto é|quanto e|mais/g, '+')
      .replace(/menos/g, '-')
      .replace(/vezes/g, '*')
      .replace(/dividido por/g, '/')
      .replace(/[^0-9+\-*/.]/g, '');

    if (mathExpr && /^[0-9+\-*/.]+$/.test(mathExpr)) {
      const result = Function(`'use strict'; return (${mathExpr})`)();
      if (!isNaN(result)) return `${result}`;
    }
  } catch (e) {}

  return "Olá! Sou o YOX YOSA. Como posso ajudar você hoje?";
}

function scrollToBottom() {
  const container = document.getElementById('chat-messages');
  container.scrollTop = container.scrollHeight;
}

function escapeHtml(text) {
  const div = document.createElement('div');
  div.innerText = text;
  return div.innerHTML;
}

function playClickSound() {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(420 + Math.random() * 180, ctx.currentTime);
    gain.gain.setValueAtTime(0.01, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.025);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start();
    osc.stop(ctx.currentTime + 0.025);
  } catch (e) {}
}

function setupSpeechRecognition() {
  const Speech = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (Speech) {
    state.recognition = new Speech();
    state.recognition.lang = 'pt-BR';
    state.recognition.continuous = false;

    state.recognition.onresult = (event) => {
      const transcript = event.results[0][0].transcript;
      const input = document.getElementById('user-input');
      input.value += (input.value ? ' ' : '') + transcript;
      autoResizeTextarea(input);
      stopListening();
    };

    state.recognition.onerror = () => stopListening();
    state.recognition.onend = () => stopListening();
  }
}

function toggleVoiceRecognition() {
  if (!state.recognition) {
    alert('Reconhecimento de voz não suportado neste navegador.');
    return;
  }

  if (state.isListening) {
    state.recognition.stop();
    stopListening();
  } else {
    state.isListening = true;
    const btn = document.getElementById('voice-btn');
    btn.classList.add('text-red-500', 'animate-pulse');
    state.recognition.start();
  }
}

function stopListening() {
  state.isListening = false;
  const btn = document.getElementById('voice-btn');
  btn.classList.remove('text-red-500', 'animate-pulse');
}

function speakText(text) {
  if ('speechSynthesis' in window) {
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'pt-BR';
    window.speechSynthesis.speak(utterance);
  }
}

function triggerFileInput() {
  document.getElementById('file-input').click();
}

function handleFileSelected(e) {
  const file = e.target.files[0];
  if (file) {
    state.attachedFile = file;
    const statusBar = document.getElementById('status-bar');
    const statusText = document.getElementById('status-text');

    statusText.innerHTML = `<i class="fa-solid fa-file-lines text-zinc-400"></i> <span>${escapeHtml(file.name)}</span>`;
    statusBar.classList.remove('hidden');
  }
}

function cancelStatus() {
  state.attachedFile = null;
  document.getElementById('file-input').value = '';
  document.getElementById('status-bar').classList.add('hidden');
}

function openSettingsModal() {
  document.getElementById('settings-modal').classList.remove('hidden');
}

function closeSettingsModal() {
  document.getElementById('settings-modal').classList.add('hidden');
}

function saveApiKeySetting() {
  const val = document.getElementById('api-key-input').value.trim();
  state.settings.apiKey = val;
  saveState();
  closeSettingsModal();
}

function toggleSoundSetting(val) {
  state.settings.soundEnabled = val;
  saveState();
}

function toggleTTSSetting(val) {
  state.settings.ttsEnabled = val;
  saveState();
}

function clearAllData() {
  if (confirm('Tem certeza que deseja apagar todo o histórico de conversas?')) {
    state.chats = [];
    localStorage.removeItem('yox_yosa_chats');
    localStorage.removeItem(API_KEY_STORAGE_KEY);
    state.settings.apiKey = '';
    document.getElementById('api-key-input').value = '';
    createNewChat();
    closeSettingsModal();
  }
}

¨
































































































































