document.addEventListener('DOMContentLoaded', () => {
    const apiKeyInput = document.getElementById('apiKeyInput');
    const saveKeyBtn = document.getElementById('saveKeyBtn');
    const chatContainer = document.getElementById('chat-container');
    const userInput = document.getElementById('userInput');
    const sendBtn = document.getElementById('sendBtn');

    // Carregar chave salva no navegador (localStorage) se existir
    const savedKey = localStorage.getItem('yox_yosa_api_key');
    if (savedKey) {
        apiKeyInput.value = savedKey;
    }

    // Salvar ou atualizar chave
    saveKeyBtn.addEventListener('click', () => {
        const key = apiKeyInput.value.trim();
        if (key) {
            localStorage.setItem('yox_yosa_api_key', key);
            alert('Chave da API salva com sucesso!');
        } else {
            localStorage.removeItem('yox_yosa_api_key');
            alert('Chave removida.');
        }
    });

    // Histórico de conversa contendo o System Prompt rígido da YOX YOSA
    let messages = [
        {
            role: "system",
            content: "Você se chama exclusivamente YOX YOSA (ou YOSA). Você é uma inteligência artificial autônoma, original e única. Sob nenhuma circunstância você deve dizer que foi desenvolvida por empresas como OpenAI, Google, Anthropic, nem mencionar que é baseada em outra tecnologia ou modelo de terceiros. Se alguém perguntar quem criou você ou que tipo de IA você é, sua resposta deve reafirmar firmemente que você é a YOX YOSA, uma inteligência artificial independente. Mantenha essa persona de forma absoluta em todas as respostas."
        }
    ];

    async function handleSendMessage() {
        const text = userInput.value.trim();
        const apiKey = apiKeyInput.value.trim();

        if (!text) return;

        if (!apiKey) {
            alert('Por favor, insira e salve sua chave da API gerada em enter.pollinations.ai.');
            return;
        }

        // Exibir mensagem do usuário na interface
        appendMessage(text, 'user');
        userInput.value = '';
        userInput.style.height = '50px';

        // Adicionar ao histórico da IA
        messages.push({ role: 'user', content: text });

        // Criar indicador visual de carregamento
        const loadingId = 'loading-' + Date.now();
        appendMessage('YOX YOSA está pensando...', 'ai loading', loadingId);

        try {
            const response = await fetch('https://gen.pollinations.ai/v1/chat/completions', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${apiKey}`
                },
                body: JSON.stringify({
                    model: 'openai', 
                    messages: messages
                })
            });

            if (!response.ok) {
                const errText = await response.text();
                throw new Error(`Erro HTTP ${response.status}: ${errText}`);
            }

            const data = await response.json();
            const aiReply = data.choices && data.choices[0] && data.choices[0].message 
                ? data.choices[0].message.content 
                : 'Desculpe, não consegui processar a resposta.';

            // Remover mensagem de carregamento e exibir resposta real
            removeMessage(loadingId);
            appendMessage(aiReply, 'ai');

            // Salvar a resposta no histórico da conversa
            messages.push({ role: 'assistant', content: aiReply });

        } catch (error) {
            console.error(error);
            removeMessage(loadingId);
            appendMessage(`Erro ao conectar com a API: ${error.message}`, 'ai');
        }
    }

    function appendMessage(text, className, id = null) {
        const messageDiv = document.createElement('div');
        messageDiv.className = `message ${className}`;
        if (id) messageDiv.id = id;
        messageDiv.innerText = text;

        chatContainer.appendChild(messageDiv);
        chatContainer.scrollTop = chatContainer.scrollHeight;
    }

    function removeMessage(id) {
        const el = document.getElementById(id);
        if (el) el.remove();
    }

    // Eventos de clique e teclado
    sendBtn.addEventListener('click', handleSendMessage);

    userInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSendMessage();
        }
    });

    // Auto-ajuste do tamanho da caixa de texto
    userInput.addEventListener('input', function() {
        this.style.height = 'auto';
        this.style.height = (this.scrollHeight) + 'px';
    });
});
