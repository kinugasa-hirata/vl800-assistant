// Keyence VL-800 Mobile AI Chatbot Module

window.VL800_Chat = {
  history: [],
  isProcessing: false,

  init() {
    const sendBtn = document.getElementById('chat-send-btn');
    const input = document.getElementById('chat-input');
    const voiceBtn = document.getElementById('chat-voice-btn');

    if (sendBtn && input) {
      sendBtn.addEventListener('click', () => this.handleSend());
      input.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
          e.preventDefault();
          this.handleSend();
        }
      });
    }

    if (voiceBtn) {
      voiceBtn.addEventListener('click', () => this.startVoiceInput());
    }

    // Load initial greeting
    this.appendBotMessage(
      `こんにちは！**Keyence VL-800 3Dスキャナ型三次元測定機**のAIアシスタントです。\n\n8冊の公式マニュアル（全340+ページ）に基づき、スキャン手順・3D寸法・幾何公差・CAD比較・キャリブレーション等の操作やエラー対処を即答します。\n\n気になる操作や画面のエラーについてお気軽にご質問ください。`
    );
  },

  askPreset(query) {
    const input = document.getElementById('chat-input');
    if (input) {
      input.value = query;
      this.handleSend();
    }
  },

  async handleSend() {
    if (this.isProcessing) return;
    const input = document.getElementById('chat-input');
    const message = input.value.trim();
    if (!message) return;

    input.value = '';
    this.appendUserMessage(message);
    this.history.push({ role: 'user', text: message });

    this.isProcessing = true;
    const typingId = this.appendTypingIndicator();

    const apiKey = localStorage.getItem('vl800_gemini_api_key') || '';

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: message,
          history: this.history,
          clientApiKey: apiKey
        })
      });

      this.removeTypingIndicator(typingId);

      if (!response.ok) {
        throw new Error(`Server returned ${response.status}`);
      }

      const data = await response.json();
      const reply = data.reply || '回答を取得できませんでした。';
      this.appendBotMessage(reply);
      this.history.push({ role: 'model', text: reply });

    } catch (err) {
      console.warn('Chat API error, fallback to local search:', err);
      this.removeTypingIndicator(typingId);

      // Local search matching
      const localReply = this.searchLocalKnowledge(message);
      this.appendBotMessage(localReply);
      this.history.push({ role: 'model', text: localReply });
    } finally {
      this.isProcessing = false;
    }
  },

  searchLocalKnowledge(query) {
    const q = query.toLowerCase();

    // Check FAQs
    for (const faq of window.VL800_KB.faqs) {
      if (q.includes(faq.q.substring(0, 4)) || q.includes(faq.tag.toLowerCase())) {
        return `【ナレッジベースからの回答】\n\n**${faq.q}**\n\n${faq.a}\n\n[📘 参照: VL-800 操作ガイド]`;
      }
    }

    // Check Workflows
    for (const wf of window.VL800_KB.workflows) {
      if (q.includes(wf.title.substring(0, 4)) || (wf.badge && q.includes(wf.badge))) {
        const stepsText = wf.steps.map(s => `${s.num}. **${s.title}**: ${s.desc}`).join('\n');
        return `【${wf.title}の標準手順】\n\n${stepsText}\n\n[📘 参照: ${wf.doc}]`;
      }
    }

    // Check Faults
    for (const fault of window.VL800_KB.faults) {
      if (q.includes('穴') || q.includes('黒') || q.includes('光沢') || q.includes('ズレ') || q.includes('エラー') || q.includes('校正')) {
        return `【トラブルシューティング: ${fault.title}】\n\n**主な原因:**\n・${fault.causes.join('\n・')}\n\n**推奨対処法:**\n・${fault.solutions.join('\n・')}\n\n[📘 参照: ${fault.citation}]`;
      }
    }

    return `ご質問「${query}」について：\n\n対象物をステージ中央に正しく配置し、合焦インジケータ（緑色の帯）に合わせて測定を行ってください。\n\n詳細な操作手順は画面下の「手順ガイド」または「マニュアル一覧」タブから各専門ガイドをご確認いただけます。\n\n[📘 参照: VL-800 リファレンスマニュアル (AS_159000)]`;
  },

  appendUserMessage(text) {
    const container = document.getElementById('chat-messages-list');
    if (!container) return;

    const div = document.createElement('div');
    div.className = 'msg-bubble user';
    div.textContent = text;
    container.appendChild(div);
    container.scrollTop = container.scrollHeight;
  },

  appendBotMessage(text) {
    const container = document.getElementById('chat-messages-list');
    if (!container) return;

    const div = document.createElement('div');
    div.className = 'msg-bubble bot';
    
    // Simple markdown formatting
    let formatted = text
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\[📘(.*?)\]/g, '<div class="citation-badge">📘$1</div>')
      .replace(/\n/g, '<br>');

    div.innerHTML = formatted;
    container.appendChild(div);
    container.scrollTop = container.scrollHeight;
  },

  appendTypingIndicator() {
    const container = document.getElementById('chat-messages-list');
    if (!container) return null;

    const id = 'typing-' + Date.now();
    const div = document.createElement('div');
    div.id = id;
    div.className = 'msg-bubble bot';
    div.innerHTML = '<span style="opacity: 0.7;">回答を生成中...</span>';
    container.appendChild(div);
    container.scrollTop = container.scrollHeight;
    return id;
  },

  removeTypingIndicator(id) {
    if (!id) return;
    const el = document.getElementById(id);
    if (el) el.remove();
  },

  startVoiceInput() {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert('お使いのブラウザは音声入力に対応していません。');
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = 'ja-JP';
    recognition.interimResults = false;

    const input = document.getElementById('chat-input');
    const voiceBtn = document.getElementById('chat-voice-btn');
    if (voiceBtn) voiceBtn.style.color = 'var(--status-err)';

    recognition.onresult = (event) => {
      const transcript = event.results[0][0].transcript;
      if (input) {
        input.value = transcript;
        this.handleSend();
      }
    };

    recognition.onend = () => {
      if (voiceBtn) voiceBtn.style.color = '';
    };

    recognition.onerror = (err) => {
      console.warn('Speech recognition error:', err);
      if (voiceBtn) voiceBtn.style.color = '';
    };

    recognition.start();
  }
};
