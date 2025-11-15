// Even an Ayah - AI-Native Quran Learning Assistant

class EvenAnAyah {
  constructor() {
    this.state = {
      currentView: 'welcome',
      surahs: [],
      currentSurah: null,
      currentAyah: 1,
      surahAyahs: [],
      ayahData: null,
      currentStage: 0, // 0 = not started
      isRecording: false,
      mediaRecorder: null,
      audioChunks: [],
      uploadedImage: null,
      keyboardText: '',
      settings: {
        reciter: 'ar.alafasy',
        translation: 'en.sahih',
        fontSize: 32,
        darkMode: false
      },
      progress: {
        ayahsLearned: 0,
        daysActive: [],
        streak: 0,
        surahProgress: {}
      }
    };

    this.stages = [
      { id: 1, name: 'listen', title: 'Listen & Memorize by Tongue' },
      { id: 2, name: 'write', title: 'Write Without Harakat' },
      { id: 3, name: 'read', title: 'Read from Your Writing' },
      { id: 4, name: 'memory', title: 'Write from Memory' },
      { id: 5, name: 'harakat', title: 'Add Harakat' },
      { id: 6, name: 'final', title: 'Final Recitation & Word Study' }
    ];

    this.init();
  }

  async init() {
    this.loadSettings();
    this.loadProgress();
    this.cacheElements();
    this.bindEvents();
    this.applySettings();
    await this.loadSurahs();
    this.addWelcomeMessage();
  }

  cacheElements() {
    // Views
    this.elements = {
      quranWelcome: document.getElementById('quranWelcome'),
      surahListView: document.getElementById('surahListView'),
      quranPageView: document.getElementById('quranPageView'),
      progressView: document.getElementById('progressView'),
      surahList: document.getElementById('surahList'),
      surahSearch: document.getElementById('surahSearch'),
      ayahsContainer: document.getElementById('ayahsContainer'),
      quranPanelTitle: document.getElementById('quranPanelTitle'),
      surahTitleDisplay: document.getElementById('surahTitleDisplay'),
      pageBismillah: document.getElementById('pageBismillah'),
      zoomOverlay: document.getElementById('zoomOverlay'),
      focusedAyah: document.getElementById('focusedAyah'),

      // Chat
      chatMessages: document.getElementById('chatMessages'),
      actionButtons: document.getElementById('actionButtons'),
      aiStatus: document.getElementById('aiStatus'),

      // Modals
      settingsModal: document.getElementById('settingsModal'),
      uploadModal: document.getElementById('uploadModal'),
      arabicKeyboardModal: document.getElementById('arabicKeyboardModal'),
      uploadArea: document.getElementById('uploadArea'),
      uploadPreview: document.getElementById('uploadPreview'),
      previewImage: document.getElementById('previewImage'),
      keyboardOutput: document.getElementById('keyboardOutput'),

      // Settings
      reciterSelect: document.getElementById('reciterSelect'),
      translationSelect: document.getElementById('translationSelect'),
      fontSizeRange: document.getElementById('fontSizeRange'),
      fontSizeValue: document.getElementById('fontSizeValue'),
      darkModeToggle: document.getElementById('darkModeToggle'),

      // Audio
      audioPlayer: document.getElementById('audioPlayer'),

      // Loading
      loadingOverlay: document.getElementById('loadingOverlay'),
      loadingText: document.getElementById('loadingText'),
      toastContainer: document.getElementById('toastContainer')
    };
  }

  bindEvents() {
    // Menu
    document.getElementById('menuBtn').addEventListener('click', () => this.openMenu());
    document.getElementById('closeMenuBtn').addEventListener('click', () => this.closeMenu());
    document.getElementById('menuOverlay').addEventListener('click', () => this.closeMenu());

    document.querySelectorAll('.menu-list a').forEach(link => {
      link.addEventListener('click', (e) => {
        e.preventDefault();
        this.handleMenuAction(e.target.dataset.action);
        this.closeMenu();
      });
    });

    // Welcome
    document.getElementById('selectSurahBtn').addEventListener('click', () => this.showSurahList());

    // Surah search
    this.elements.surahSearch.addEventListener('input', (e) => this.filterSurahs(e.target.value));

    // Settings
    document.getElementById('settingsBtn').addEventListener('click', () => this.openModal('settingsModal'));
    document.getElementById('closeSettingsBtn').addEventListener('click', () => this.closeModal('settingsModal'));

    this.elements.reciterSelect.addEventListener('change', (e) => {
      this.state.settings.reciter = e.target.value;
      this.saveSettings();
    });

    this.elements.translationSelect.addEventListener('change', (e) => {
      this.state.settings.translation = e.target.value;
      this.saveSettings();
    });

    this.elements.fontSizeRange.addEventListener('input', (e) => {
      this.state.settings.fontSize = parseInt(e.target.value);
      this.elements.fontSizeValue.textContent = `${e.target.value}px`;
      document.documentElement.style.setProperty('--arabic-font-size', `${e.target.value}px`);
      this.saveSettings();
    });

    this.elements.darkModeToggle.addEventListener('change', (e) => {
      this.state.settings.darkMode = e.target.checked;
      this.applyDarkMode();
      this.saveSettings();
    });

    document.getElementById('resetProgressBtn').addEventListener('click', () => {
      if (confirm('Reset all progress?')) this.resetProgress();
    });

    // Upload Modal
    document.getElementById('closeUploadBtn').addEventListener('click', () => this.closeModal('uploadModal'));
    document.getElementById('imageUpload').addEventListener('change', (e) => this.handleImageUpload(e));
    document.getElementById('retakeBtn').addEventListener('click', () => this.resetUpload());
    document.getElementById('submitImageBtn').addEventListener('click', () => this.submitImage());

    // Drag and drop
    this.elements.uploadArea.addEventListener('dragover', (e) => {
      e.preventDefault();
      this.elements.uploadArea.classList.add('dragover');
    });
    this.elements.uploadArea.addEventListener('dragleave', () => {
      this.elements.uploadArea.classList.remove('dragover');
    });
    this.elements.uploadArea.addEventListener('drop', (e) => {
      e.preventDefault();
      this.elements.uploadArea.classList.remove('dragover');
      if (e.dataTransfer.files.length) {
        this.processUploadedFile(e.dataTransfer.files[0]);
      }
    });

    // Arabic Keyboard Modal
    document.getElementById('closeKeyboardBtn').addEventListener('click', () => this.closeModal('arabicKeyboardModal'));
    document.getElementById('keyboardCancelBtn').addEventListener('click', () => this.closeModal('arabicKeyboardModal'));
    document.getElementById('keyboardSubmitBtn').addEventListener('click', () => this.submitKeyboardText());
    document.getElementById('keyboardBackspace').addEventListener('click', () => this.keyboardBackspace());
    document.getElementById('keyboardClear').addEventListener('click', () => this.keyboardClear());

    document.querySelectorAll('#arabicKeyboard .key[data-char]').forEach(key => {
      key.addEventListener('click', (e) => {
        const char = e.target.dataset.char;
        this.state.keyboardText += char;
        this.elements.keyboardOutput.textContent = this.state.keyboardText;
      });
    });

    // Zoom controls
    document.getElementById('zoomInBtn').addEventListener('click', () => this.adjustFontSize(4));
    document.getElementById('zoomOutBtn').addEventListener('click', () => this.adjustFontSize(-4));
    document.getElementById('fullPageBtn').addEventListener('click', () => this.toggleZoom());

    // Click on zoom overlay to close
    this.elements.zoomOverlay.addEventListener('click', (e) => {
      if (e.target === this.elements.zoomOverlay) this.closeZoom();
    });
  }

  // === CHAT INTERFACE ===

  addMessage(sender, content, actions = []) {
    const messageDiv = document.createElement('div');
    messageDiv.className = `chat-message ${sender}`;

    const avatar = sender === 'ai' ? '🤖' : '👤';
    const avatarDiv = `<div class="message-avatar">${avatar}</div>`;

    let actionsHTML = '';
    if (actions.length > 0) {
      actionsHTML = '<div class="message-actions">' +
        actions.map(action => `<button class="message-btn ${action.class || ''}" data-action="${action.action}">${action.label}</button>`).join('') +
        '</div>';
    }

    messageDiv.innerHTML = `
      ${avatarDiv}
      <div class="message-content">
        <div class="message-text">${content}</div>
        ${actionsHTML}
      </div>
    `;

    this.elements.chatMessages.appendChild(messageDiv);

    // Bind action buttons
    messageDiv.querySelectorAll('.message-btn').forEach(btn => {
      btn.addEventListener('click', () => this.handleMessageAction(btn.dataset.action));
    });

    this.scrollChatToBottom();
  }

  addUserMessage(content) {
    this.addMessage('user', content);
  }

  addAIMessage(content, actions = []) {
    this.setAIStatus('Thinking...');
    setTimeout(() => {
      this.addMessage('ai', content, actions);
      this.setAIStatus('Ready to help');
    }, 500);
  }

  showTypingIndicator() {
    const typing = document.createElement('div');
    typing.className = 'chat-message ai';
    typing.id = 'typingIndicator';
    typing.innerHTML = `
      <div class="message-avatar">🤖</div>
      <div class="message-content">
        <div class="typing-indicator">
          <span></span><span></span><span></span>
        </div>
      </div>
    `;
    this.elements.chatMessages.appendChild(typing);
    this.scrollChatToBottom();
  }

  hideTypingIndicator() {
    const typing = document.getElementById('typingIndicator');
    if (typing) typing.remove();
  }

  scrollChatToBottom() {
    this.elements.chatMessages.scrollTop = this.elements.chatMessages.scrollHeight;
  }

  setAIStatus(status) {
    this.elements.aiStatus.textContent = status;
  }

  updateActionButtons(buttons) {
    this.elements.actionButtons.innerHTML = buttons.map(btn => `
      <button class="action-btn ${btn.class || ''}" data-action="${btn.action}">
        ${btn.icon || ''} ${btn.label}
      </button>
    `).join('');

    this.elements.actionButtons.querySelectorAll('.action-btn').forEach(btn => {
      btn.addEventListener('click', () => this.handleActionButton(btn.dataset.action));
    });
  }

  handleActionButton(action) {
    switch (action) {
      case 'play-audio':
        this.playAudio();
        this.addUserMessage('Playing audio recitation');
        break;
      case 'repeat-audio':
        this.repeatAudio();
        this.addUserMessage('Repeating audio');
        break;
      case 'record':
        this.toggleRecording();
        break;
      case 'confirm-memorized':
        this.confirmStageComplete();
        break;
      case 'upload-image':
        this.openModal('uploadModal');
        break;
      case 'open-keyboard':
        this.openArabicKeyboard();
        break;
      case 'show-reference':
        this.showReference();
        break;
      case 'confirm-understanding':
        this.confirmUnderstanding();
        break;
      case 'next-ayah':
        this.completeAyah();
        break;
    }
  }

  handleMessageAction(action) {
    this.handleActionButton(action);
  }

  // === WELCOME & NAVIGATION ===

  addWelcomeMessage() {
    const welcomeContent = `
      <strong>Assalamu Alaikum!</strong> 🌟<br><br>
      I'm your Quran learning assistant. I'll guide you through memorizing the Quran one ayah at a time using a proven method:<br><br>
      1️⃣ <strong>Listen & repeat</strong> until fluent<br>
      2️⃣ <strong>Write</strong> without vowel marks<br>
      3️⃣ <strong>Read</strong> from your handwriting<br>
      4️⃣ <strong>Write from memory</strong><br>
      5️⃣ <strong>Add harakat</strong> (vowels)<br>
      6️⃣ <strong>Learn root words</strong> & meanings<br><br>
      Let's begin your journey! Select a surah from the left panel.
    `;

    this.addAIMessage(welcomeContent, [
      { label: '📖 Select Surah', action: 'select-surah' }
    ]);

    this.updateActionButtons([
      { label: 'Select Surah', icon: '📖', action: 'select-surah' }
    ]);

    // Bind select surah action
    setTimeout(() => {
      document.querySelectorAll('[data-action="select-surah"]').forEach(btn => {
        btn.addEventListener('click', () => this.showSurahList());
      });
    }, 600);
  }

  handleMenuAction(action) {
    switch (action) {
      case 'home':
        this.showView('quranWelcome');
        this.addAIMessage('Back to home. Ready to continue learning?', [
          { label: '📖 Select Surah', action: 'select-surah' }
        ]);
        break;
      case 'select-surah':
        this.showSurahList();
        break;
      case 'progress':
        this.showProgressView();
        break;
      case 'settings':
        this.openModal('settingsModal');
        break;
      case 'about':
        this.showAbout();
        break;
    }
  }

  showView(viewName) {
    document.querySelectorAll('.quran-content-view').forEach(view => view.classList.remove('active'));
    document.getElementById(viewName).classList.add('active');
    this.state.currentView = viewName;
  }

  // === SURAH SELECTION ===

  async loadSurahs() {
    this.showLoading('Loading Quran data...');
    try {
      const response = await fetch('/api/surahs');
      const data = await response.json();
      if (data.data) {
        this.state.surahs = data.data;
        this.renderSurahList();
      }
    } catch (error) {
      console.error('Failed to load surahs:', error);
      this.showToast('Failed to load surahs', 'error');
    }
    this.hideLoading();
  }

  renderSurahList() {
    this.elements.surahList.innerHTML = this.state.surahs.map(surah => `
      <div class="surah-card" data-surah="${surah.number}">
        <div class="surah-number">${surah.number}</div>
        <div class="surah-info">
          <div class="surah-name-arabic">${surah.name}</div>
          <div class="surah-name-english">${surah.englishName}</div>
          <div class="surah-meta">${surah.numberOfAyahs} Ayahs</div>
        </div>
      </div>
    `).join('');

    document.querySelectorAll('.surah-card').forEach(card => {
      card.addEventListener('click', () => this.selectSurah(parseInt(card.dataset.surah)));
    });
  }

  filterSurahs(query) {
    const cards = document.querySelectorAll('.surah-card');
    const lowerQuery = query.toLowerCase();

    cards.forEach(card => {
      const surahNum = parseInt(card.dataset.surah);
      const surah = this.state.surahs.find(s => s.number === surahNum);
      const matches = surah.name.includes(query) ||
                      surah.englishName.toLowerCase().includes(lowerQuery) ||
                      surah.number.toString() === query;
      card.style.display = matches ? 'flex' : 'none';
    });
  }

  showSurahList() {
    this.showView('surahListView');
    this.addAIMessage('Please select a surah to begin memorizing. You can search by name or number.');
    this.updateActionButtons([]);
  }

  async selectSurah(surahNum) {
    this.showLoading('Loading surah...');
    this.state.currentSurah = this.state.surahs.find(s => s.number === surahNum);

    try {
      // Load entire surah
      const response = await fetch(`/api/surah/${surahNum}?edition=quran-uthmani`);
      const data = await response.json();

      if (data.data) {
        this.state.surahAyahs = data.data.ayahs;
        this.renderQuranPage();

        // Determine starting ayah
        const progress = this.state.progress.surahProgress[surahNum] || 0;
        this.state.currentAyah = Math.min(progress + 1, this.state.currentSurah.numberOfAyahs);

        this.showView('quranPageView');
        this.elements.quranPanelTitle.textContent = this.state.currentSurah.name;

        this.addUserMessage(`Selected Surah ${this.state.currentSurah.englishName}`);

        const aiMessage = `Excellent choice! <strong>Surah ${this.state.currentSurah.englishName}</strong> (${this.state.currentSurah.name}) has ${this.state.currentSurah.numberOfAyahs} ayahs.<br><br>`;

        if (progress > 0) {
          this.addAIMessage(aiMessage + `You've memorized ${progress} ayahs already. Let's continue with ayah ${this.state.currentAyah}. Ready to begin?`, [
            { label: 'Start Ayah ' + this.state.currentAyah, action: 'start-learning', class: 'success' }
          ]);
        } else {
          this.addAIMessage(aiMessage + `Let's start from the beginning. Ready to learn ayah 1?`, [
            { label: 'Start Learning', action: 'start-learning', class: 'success' }
          ]);
        }

        this.updateActionButtons([
          { label: 'Start Learning', icon: '▶️', action: 'start-learning' }
        ]);

        // Bind start learning
        setTimeout(() => {
          document.querySelectorAll('[data-action="start-learning"]').forEach(btn => {
            btn.addEventListener('click', () => this.startLearningAyah());
          });
        }, 600);
      }
    } catch (error) {
      console.error('Failed to load surah:', error);
      this.showToast('Failed to load surah', 'error');
    }

    this.hideLoading();
  }

  renderQuranPage() {
    // Update title
    this.elements.surahTitleDisplay.querySelector('.surah-name-ar').textContent = this.state.currentSurah.name;
    this.elements.surahTitleDisplay.querySelector('.surah-name-en').textContent = this.state.currentSurah.englishName;

    // Show/hide bismillah (not for Surah 9)
    this.elements.pageBismillah.style.display = this.state.currentSurah.number === 9 ? 'none' : 'block';

    // Render ayahs
    let html = '';
    this.state.surahAyahs.forEach(ayah => {
      const ayahNum = ayah.numberInSurah;
      const progress = this.state.progress.surahProgress[this.state.currentSurah.number] || 0;
      let classes = 'ayah-text';
      if (ayahNum <= progress) classes += ' learned';

      html += `<span class="${classes}" data-ayah="${ayahNum}">${ayah.text}</span>`;
      html += `<span class="ayah-number">${ayahNum}</span> `;
    });

    this.elements.ayahsContainer.innerHTML = html;
  }

  // === LEARNING FLOW ===

  async startLearningAyah() {
    this.showLoading('Loading ayah...');

    try {
      const ref = `${this.state.currentSurah.number}:${this.state.currentAyah}`;

      // Fetch ayah with translation
      const ayahResponse = await fetch(`/api/ayah/${ref}?editions=quran-uthmani,${this.state.settings.translation}`);
      const ayahData = await ayahResponse.json();

      if (ayahData.data) {
        this.state.ayahData = ayahData.data;
      }

      // Fetch audio
      const audioResponse = await fetch(`/api/audio/${ref}?reciter=${this.state.settings.reciter}`);
      const audioData = await audioResponse.json();

      if (audioData.data) {
        this.elements.audioPlayer.src = audioData.data.audio;
      }

      // Highlight current ayah and zoom in
      this.highlightCurrentAyah();
      this.zoomToAyah();

      // Start stage 1
      this.state.currentStage = 1;
      this.startStage1();

    } catch (error) {
      console.error('Failed to load ayah:', error);
      this.showToast('Failed to load ayah', 'error');
    }

    this.hideLoading();
  }

  highlightCurrentAyah() {
    // Remove previous highlights
    document.querySelectorAll('.ayah-text').forEach(el => {
      el.classList.remove('current', 'blurred');
    });

    // Highlight current
    const currentEl = document.querySelector(`.ayah-text[data-ayah="${this.state.currentAyah}"]`);
    if (currentEl) {
      currentEl.classList.add('current');
      currentEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }

  zoomToAyah() {
    const ayahText = this.state.ayahData[0].text;
    this.elements.focusedAyah.textContent = ayahText;
    this.elements.zoomOverlay.classList.add('active');
  }

  closeZoom() {
    this.elements.zoomOverlay.classList.remove('active');
  }

  toggleZoom() {
    if (this.elements.zoomOverlay.classList.contains('active')) {
      this.closeZoom();
    } else if (this.state.ayahData) {
      this.zoomToAyah();
    }
  }

  blurPreviousAyahs() {
    document.querySelectorAll('.ayah-text').forEach(el => {
      const ayahNum = parseInt(el.dataset.ayah);
      if (ayahNum < this.state.currentAyah) {
        el.classList.add('blurred');
      }
    });
  }

  // === STAGE 1: LISTEN & MEMORIZE ===

  startStage1() {
    const arabicText = this.state.ayahData[0].text;
    const translation = this.state.ayahData[1] ? this.state.ayahData[1].text : '';

    this.addAIMessage(`
      <strong>Stage 1: Listen & Memorize by Tongue</strong> 🎙️<br><br>
      Here is your ayah (${this.state.currentSurah.englishName} ${this.state.currentSurah.number}:${this.state.currentAyah}):<br>
      <span class="arabic">${arabicText}</span>
      <br><strong>Translation:</strong> ${translation}<br><br>
      Listen to the recitation and repeat it until you can recite fluently without stumbling. When ready, record yourself to verify.
    `);

    this.updateActionButtons([
      { label: 'Play Audio', icon: '▶️', action: 'play-audio' },
      { label: 'Repeat', icon: '🔄', action: 'repeat-audio' },
      { label: 'Record Myself', icon: '🎤', action: 'record' },
      { label: "I've Memorized It", icon: '✅', action: 'confirm-memorized' }
    ]);
  }

  playAudio() {
    if (this.elements.audioPlayer.src) {
      this.elements.audioPlayer.currentTime = 0;
      this.elements.audioPlayer.play();
      this.addAIMessage('Playing recitation... Listen carefully to the pronunciation and tajweed.');
    }
  }

  repeatAudio() {
    this.playAudio();
  }

  async toggleRecording() {
    if (!this.state.isRecording) {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        this.state.mediaRecorder = new MediaRecorder(stream);
        this.state.audioChunks = [];

        this.state.mediaRecorder.ondataavailable = (e) => this.state.audioChunks.push(e.data);

        this.state.mediaRecorder.onstop = () => {
          const audioBlob = new Blob(this.state.audioChunks, { type: 'audio/webm' });
          const audioUrl = URL.createObjectURL(audioBlob);

          this.addAIMessage(`
            Excellent! Here's your recording:<br>
            <audio controls src="${audioUrl}"></audio><br><br>
            Listen to yourself. Does it sound clear and fluent? Compare with the original recitation. If you're satisfied, confirm that you've memorized it.
          `);

          stream.getTracks().forEach(track => track.stop());
        };

        this.state.mediaRecorder.start();
        this.state.isRecording = true;
        this.addUserMessage('Started recording...');
        this.addAIMessage('Recording now... Recite the ayah clearly. Click "Stop Recording" when done.');

        // Update button to stop
        this.updateActionButtons([
          { label: 'Stop Recording', icon: '⏹️', action: 'record', class: 'recording' },
          { label: "I've Memorized It", icon: '✅', action: 'confirm-memorized' }
        ]);

      } catch (error) {
        this.showToast('Could not access microphone', 'error');
        this.addAIMessage('Unable to access your microphone. Please check permissions and try again.');
      }
    } else {
      this.state.mediaRecorder.stop();
      this.state.isRecording = false;
      this.addUserMessage('Stopped recording');

      // Restore buttons
      this.updateActionButtons([
        { label: 'Play Audio', icon: '▶️', action: 'play-audio' },
        { label: 'Record Again', icon: '🎤', action: 'record' },
        { label: "I've Memorized It", icon: '✅', action: 'confirm-memorized' }
      ]);
    }
  }

  // === STAGE 2: WRITE WITHOUT HARAKAT ===

  startStage2() {
    this.addAIMessage(`
      <strong>Stage 2: Write Without Harakat (Vowels)</strong> ✍️<br><br>
      Excellent progress! Now write the ayah <strong>without vowel marks</strong> (no fathah, dammah, kasrah, etc.).<br><br>
      You can:<br>
      • 📷 <strong>Upload a photo</strong> of your handwritten text<br>
      • ⌨️ <strong>Type it</strong> using the Arabic keyboard<br><br>
      If you need to see the text for reference, click "Show Reference".
    `, [
      { label: 'Show Reference', action: 'show-reference', class: 'secondary' }
    ]);

    this.updateActionButtons([
      { label: 'Upload Photo', icon: '📷', action: 'upload-image' },
      { label: 'Type Arabic', icon: '⌨️', action: 'open-keyboard' },
      { label: 'Show Reference', icon: '👁️', action: 'show-reference' }
    ]);
  }

  showReference() {
    const arabicText = this.state.ayahData[0].text;
    this.addAIMessage(`
      Here's the ayah for reference:<br>
      <span class="arabic">${arabicText}</span><br><br>
      Study it carefully, then write it without the harakat.
    `);
  }

  openArabicKeyboard() {
    this.state.keyboardText = '';
    this.elements.keyboardOutput.textContent = '';
    this.openModal('arabicKeyboardModal');
  }

  keyboardBackspace() {
    this.state.keyboardText = this.state.keyboardText.slice(0, -1);
    this.elements.keyboardOutput.textContent = this.state.keyboardText;
  }

  keyboardClear() {
    this.state.keyboardText = '';
    this.elements.keyboardOutput.textContent = '';
  }

  submitKeyboardText() {
    if (!this.state.keyboardText.trim()) {
      this.showToast('Please type something', 'error');
      return;
    }

    const text = this.state.keyboardText;
    this.closeModal('arabicKeyboardModal');
    this.addUserMessage(`<span class="arabic">${text}</span>`);

    if (this.state.currentStage === 2) {
      this.verifyWriting(text);
    } else if (this.state.currentStage === 4) {
      this.verifyMemoryWriting(text);
    } else if (this.state.currentStage === 5) {
      this.verifyHarakat(text);
    }
  }

  handleImageUpload(e) {
    if (e.target.files.length) {
      this.processUploadedFile(e.target.files[0]);
    }
  }

  processUploadedFile(file) {
    if (!file.type.startsWith('image/')) {
      this.showToast('Please upload an image file', 'error');
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      this.state.uploadedImage = e.target.result;
      this.elements.previewImage.src = e.target.result;
      this.elements.uploadArea.classList.add('hidden');
      this.elements.uploadPreview.classList.remove('hidden');
    };
    reader.readAsDataURL(file);
  }

  resetUpload() {
    this.elements.uploadArea.classList.remove('hidden');
    this.elements.uploadPreview.classList.add('hidden');
    this.state.uploadedImage = null;
    document.getElementById('imageUpload').value = '';
  }

  submitImage() {
    if (!this.state.uploadedImage) {
      this.showToast('No image uploaded', 'error');
      return;
    }

    this.closeModal('uploadModal');
    this.addUserMessage(`<img src="${this.state.uploadedImage}" style="max-width: 200px; border-radius: 8px;">`);

    // AI "analyzes" the image
    this.showTypingIndicator();
    setTimeout(() => {
      this.hideTypingIndicator();

      if (this.state.currentStage === 2) {
        this.addAIMessage(`
          Great handwriting! 📝 I can see you've written the ayah without harakat.<br><br>
          Your writing looks good! The letter forms are clear. Remember, writing by hand helps encode the ayah into your long-term memory.<br><br>
          Now let's move to the next stage where you'll read from your handwriting.
        `, [
          { label: 'Continue to Stage 3', action: 'confirm-memorized', class: 'success' }
        ]);
      } else if (this.state.currentStage === 4) {
        this.addAIMessage(`
          Excellent memory work! 🧠 You've written the ayah from memory.<br><br>
          This is a crucial step in cementing the ayah in your memory. Your recall is strengthening!<br><br>
          Ready to add the harakat (vowel marks)?
        `, [
          { label: 'Continue to Stage 5', action: 'confirm-memorized', class: 'success' }
        ]);
      }
    }, 1500);

    this.resetUpload();
  }

  verifyWriting(text) {
    const correctText = this.removeHarakat(this.state.ayahData[0].text);
    const similarity = this.calculateSimilarity(this.removeHarakat(text), correctText);

    this.showTypingIndicator();
    setTimeout(() => {
      this.hideTypingIndicator();

      if (similarity > 0.85) {
        this.addAIMessage(`
          Excellent! ✅ Your writing is very accurate (${Math.round(similarity * 100)}% match).<br><br>
          You've successfully written the ayah without harakat. This is great practice for understanding the root letters.<br><br>
          Ready to move to the next stage?
        `, [
          { label: 'Continue to Stage 3', action: 'confirm-memorized', class: 'success' }
        ]);
      } else if (similarity > 0.6) {
        this.addAIMessage(`
          Good attempt! 📝 Your writing is ${Math.round(similarity * 100)}% accurate.<br><br>
          There are some differences. Would you like to see the reference and try again?
        `, [
          { label: 'Show Reference', action: 'show-reference', class: 'secondary' },
          { label: 'Try Again', action: 'open-keyboard' },
          { label: 'Continue Anyway', action: 'confirm-memorized' }
        ]);
      } else {
        this.addAIMessage(`
          Let's try again. 🔄 The text doesn't quite match yet.<br><br>
          Here's a hint: Make sure you're copying all the letters carefully, just without the harakat marks.
        `, [
          { label: 'Show Reference', action: 'show-reference', class: 'secondary' },
          { label: 'Try Again', action: 'open-keyboard' }
        ]);
      }
    }, 1000);
  }

  // === STAGE 3: READ FROM HANDWRITING ===

  startStage3() {
    this.blurPreviousAyahs();

    this.addAIMessage(`
      <strong>Stage 3: Read from Your Writing</strong> 📖<br><br>
      Now read the ayah aloud from what you just wrote (without harakat).<br><br>
      This tests your ability to recognize and vocalize the letters correctly. If you need a reminder of the pronunciation, you can show the reference with harakat.<br><br>
      Record yourself reading from your writing.
    `);

    this.updateActionButtons([
      { label: 'Record Reading', icon: '🎤', action: 'record' },
      { label: 'Show Reference', icon: '👁️', action: 'show-reference' },
      { label: 'I Can Read It', icon: '✅', action: 'confirm-memorized' }
    ]);
  }

  // === STAGE 4: WRITE FROM MEMORY ===

  startStage4() {
    this.closeZoom(); // Remove visual aid

    this.addAIMessage(`
      <strong>Stage 4: Write from Memory</strong> 🧠<br><br>
      Now for the real test! Write the ayah <strong>from memory</strong> without looking at any reference.<br><br>
      Don't worry if it's not perfect - this step strengthens your memorization. Trust what you've learned!
    `);

    this.updateActionButtons([
      { label: 'Upload Photo', icon: '📷', action: 'upload-image' },
      { label: 'Type from Memory', icon: '⌨️', action: 'open-keyboard' }
    ]);
  }

  verifyMemoryWriting(text) {
    const correctText = this.removeHarakat(this.state.ayahData[0].text);
    const similarity = this.calculateSimilarity(this.removeHarakat(text), correctText);

    this.showTypingIndicator();
    setTimeout(() => {
      this.hideTypingIndicator();

      if (similarity > 0.8) {
        this.addAIMessage(`
          Mashallah! 🌟 Your memory recall is ${Math.round(similarity * 100)}% accurate!<br><br>
          This shows that the ayah is firmly planted in your memory. Excellent work!<br><br>
          Now let's perfect the pronunciation by adding the harakat.
        `, [
          { label: 'Continue to Stage 5', action: 'confirm-memorized', class: 'success' }
        ]);
      } else {
        this.addAIMessage(`
          Good effort! Your recall is ${Math.round(similarity * 100)}% accurate.<br><br>
          Let's strengthen this. Would you like to review the ayah and try again?
        `, [
          { label: 'Review & Retry', action: 'show-reference', class: 'secondary' },
          { label: 'Try Again', action: 'open-keyboard' },
          { label: 'Continue Anyway', action: 'confirm-memorized' }
        ]);
      }
    }, 1000);
  }

  // === STAGE 5: ADD HARAKAT ===

  startStage5() {
    const textWithoutHarakat = this.removeHarakat(this.state.ayahData[0].text);

    this.addAIMessage(`
      <strong>Stage 5: Add Harakat (Vowel Marks)</strong> 🔤<br><br>
      Here's the text without harakat:<br>
      <span class="arabic">${textWithoutHarakat}</span><br><br>
      Now add the correct harakat to each letter. This ensures you know the exact pronunciation.<br><br>
      Use the Arabic keyboard - it has all the harakat marks (fathah, dammah, kasrah, sukoon, shaddah, tanween).
    `);

    this.updateActionButtons([
      { label: 'Type with Harakat', icon: '⌨️', action: 'open-keyboard' },
      { label: 'Show Correct Harakat', icon: '👁️', action: 'show-reference' }
    ]);
  }

  verifyHarakat(text) {
    const correctText = this.state.ayahData[0].text;
    const similarity = this.calculateSimilarity(text.trim(), correctText.trim());

    this.showTypingIndicator();
    setTimeout(() => {
      this.hideTypingIndicator();

      if (similarity > 0.9) {
        this.addAIMessage(`
          Perfect! ✨ Your harakat placement is ${Math.round(similarity * 100)}% accurate!<br><br>
          You've demonstrated excellent understanding of the pronunciation marks. This is crucial for correct recitation.<br><br>
          Now for the final stage - recite from memory and learn the meanings!
        `, [
          { label: 'Final Stage', action: 'confirm-memorized', class: 'success' }
        ]);
      } else {
        this.addAIMessage(`
          Close! Your harakat accuracy is ${Math.round(similarity * 100)}%.<br><br>
          Some marks might be in the wrong place. Check carefully and try again.
        `, [
          { label: 'Show Correct', action: 'show-reference', class: 'secondary' },
          { label: 'Try Again', action: 'open-keyboard' },
          { label: 'Continue Anyway', action: 'confirm-memorized' }
        ]);
      }
    }, 1000);
  }

  // === STAGE 6: FINAL RECITATION & ROOT WORDS ===

  startStage6() {
    const arabicText = this.state.ayahData[0].text;
    const rootWords = this.analyzeRootWords(arabicText);

    let rootWordsHTML = rootWords.map(w => `
      <div style="margin-bottom: 0.5rem; padding: 0.5rem; background: var(--background); border-radius: 4px;">
        <strong style="font-family: var(--font-arabic);">${w.word}</strong> (${w.root})<br>
        <small>${w.meaning}</small>
      </div>
    `).join('');

    this.addAIMessage(`
      <strong>Stage 6: Final Recitation & Word Study</strong> 📚<br><br>
      You've done amazing work! One last step - recite the complete ayah from memory.<br><br>
      <span class="arabic">${arabicText}</span><br><br>
      <strong>Root Words & Meanings:</strong><br>
      ${rootWordsHTML}<br>
      Reflect on these meanings as you recite. Understanding the words deepens your connection to the ayah.
    `);

    this.updateActionButtons([
      { label: 'Final Recitation', icon: '🎤', action: 'record' },
      { label: 'I Understand & Confirm', icon: '✅', action: 'confirm-understanding' }
    ]);
  }

  analyzeRootWords(text) {
    // Simplified root word analysis
    const words = text.split(' ').filter(w => w.length > 2).slice(0, 6);
    const meanings = {
      'الله': { root: 'إله', meaning: 'God, The One True God' },
      'الرحمن': { root: 'رحم', meaning: 'The Most Merciful (intensive form)' },
      'الرحيم': { root: 'رحم', meaning: 'The Especially Merciful (continuous form)' },
      'الحمد': { root: 'حمد', meaning: 'Praise, gratitude' },
      'رب': { root: 'ربب', meaning: 'Lord, Sustainer, Nurturer' },
      'العالمين': { root: 'علم', meaning: 'The worlds, all creation' },
      'مالك': { root: 'ملك', meaning: 'Owner, Master, King' },
      'يوم': { root: 'يوم', meaning: 'Day' },
      'الدين': { root: 'دين', meaning: 'Judgment, Religion' },
      'نعبد': { root: 'عبد', meaning: 'We worship' },
      'نستعين': { root: 'عون', meaning: 'We seek help' },
      'اهدنا': { root: 'هدي', meaning: 'Guide us' },
      'الصراط': { root: 'صرط', meaning: 'The path' },
      'المستقيم': { root: 'قوم', meaning: 'The straight' }
    };

    return words.map(word => {
      const cleanWord = this.removeHarakat(word);
      if (meanings[cleanWord]) {
        return { word: cleanWord, ...meanings[cleanWord] };
      }
      return {
        word: cleanWord,
        root: this.extractRoot(cleanWord),
        meaning: 'Research this root for deeper understanding'
      };
    });
  }

  confirmUnderstanding() {
    this.addUserMessage('I understand the meanings and have completed my final recitation');
    this.completeAyah();
  }

  // === STAGE COMPLETION ===

  confirmStageComplete() {
    this.addUserMessage(`Completed Stage ${this.state.currentStage}`);

    const encouragements = [
      'Excellent progress! May Allah bless your efforts. 🌟',
      'Mashallah! You\'re doing wonderfully! 💪',
      'Great work! Keep up this momentum! ⭐',
      'Alhamdulillah! Your dedication is inspiring! 🎯',
      'Well done! You\'re making real progress! 🏆'
    ];

    const randomEncouragement = encouragements[Math.floor(Math.random() * encouragements.length)];

    this.showTypingIndicator();
    setTimeout(() => {
      this.hideTypingIndicator();
      this.addAIMessage(randomEncouragement);

      this.state.currentStage++;
      this.startNextStage();
    }, 800);
  }

  startNextStage() {
    switch (this.state.currentStage) {
      case 2: this.startStage2(); break;
      case 3: this.startStage3(); break;
      case 4: this.startStage4(); break;
      case 5: this.startStage5(); break;
      case 6: this.startStage6(); break;
      default: break;
    }
  }

  completeAyah() {
    // Update progress
    const surahNum = this.state.currentSurah.number;
    if (!this.state.progress.surahProgress[surahNum]) {
      this.state.progress.surahProgress[surahNum] = 0;
    }

    if (this.state.currentAyah > this.state.progress.surahProgress[surahNum]) {
      this.state.progress.surahProgress[surahNum] = this.state.currentAyah;
      this.state.progress.ayahsLearned++;
    }

    // Update streak
    const today = new Date().toDateString();
    if (!this.state.progress.daysActive.includes(today)) {
      this.state.progress.daysActive.push(today);
      this.updateStreak();
    }

    this.saveProgress();
    this.renderQuranPage(); // Update learned status

    // Check if surah complete
    if (this.state.currentAyah >= this.state.currentSurah.numberOfAyahs) {
      this.addAIMessage(`
        🏆 <strong>CONGRATULATIONS!</strong> 🏆<br><br>
        You have completed Surah ${this.state.currentSurah.englishName}!<br><br>
        This is an incredible achievement. May Allah accept your efforts and grant you understanding of His words.<br><br>
        Total ayahs learned: <strong>${this.state.progress.ayahsLearned}</strong><br>
        Current streak: <strong>${this.state.progress.streak} days</strong>
      `, [
        { label: 'Select New Surah', action: 'select-surah', class: 'success' }
      ]);

      setTimeout(() => {
        document.querySelectorAll('[data-action="select-surah"]').forEach(btn => {
          btn.addEventListener('click', () => this.showSurahList());
        });
      }, 600);
    } else {
      this.addAIMessage(`
        🎉 <strong>Ayah ${this.state.currentAyah} Completed!</strong> 🎉<br><br>
        Mashallah! You've successfully memorized and understood this ayah.<br><br>
        Ready for the next ayah?
      `, [
        { label: 'Next Ayah (' + (this.state.currentAyah + 1) + ')', action: 'next-ayah', class: 'success' }
      ]);

      this.updateActionButtons([
        { label: 'Next Ayah', icon: '▶️', action: 'start-next-ayah' }
      ]);

      setTimeout(() => {
        document.querySelectorAll('[data-action="next-ayah"], [data-action="start-next-ayah"]').forEach(btn => {
          btn.addEventListener('click', () => {
            this.state.currentAyah++;
            this.state.currentStage = 0;
            this.startLearningAyah();
          });
        });
      }, 600);
    }
  }

  // === UTILITIES ===

  removeHarakat(text) {
    return text.replace(/[\u064B-\u065F\u0670]/g, '');
  }

  extractRoot(word) {
    let root = this.removeHarakat(word);
    root = root.replace(/^(ال|و|ف|ب|ل|ك)/, '');
    root = root.replace(/(ون|ين|ات|ة|ها|هم|كم|نا)$/, '');
    return root || word;
  }

  calculateSimilarity(str1, str2) {
    const longer = str1.length > str2.length ? str1 : str2;
    const shorter = str1.length > str2.length ? str2 : str1;
    if (longer.length === 0) return 1.0;
    const editDistance = this.levenshteinDistance(longer, shorter);
    return (longer.length - editDistance) / longer.length;
  }

  levenshteinDistance(str1, str2) {
    const matrix = [];
    for (let i = 0; i <= str2.length; i++) matrix[i] = [i];
    for (let j = 0; j <= str1.length; j++) matrix[0][j] = j;

    for (let i = 1; i <= str2.length; i++) {
      for (let j = 1; j <= str1.length; j++) {
        if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
          matrix[i][j] = matrix[i - 1][j - 1];
        } else {
          matrix[i][j] = Math.min(matrix[i - 1][j - 1] + 1, matrix[i][j - 1] + 1, matrix[i - 1][j] + 1);
        }
      }
    }
    return matrix[str2.length][str1.length];
  }

  updateStreak() {
    const sortedDays = this.state.progress.daysActive.sort((a, b) => new Date(b) - new Date(a));
    let streak = 1;
    for (let i = 0; i < sortedDays.length - 1; i++) {
      const diff = (new Date(sortedDays[i]) - new Date(sortedDays[i + 1])) / (1000 * 60 * 60 * 24);
      if (diff === 1) streak++;
      else break;
    }
    this.state.progress.streak = streak;
  }

  adjustFontSize(delta) {
    const newSize = Math.max(20, Math.min(60, this.state.settings.fontSize + delta));
    this.state.settings.fontSize = newSize;
    document.documentElement.style.setProperty('--arabic-font-size', `${newSize}px`);
    this.elements.fontSizeRange.value = newSize;
    this.elements.fontSizeValue.textContent = `${newSize}px`;
    this.saveSettings();
  }

  // === PROGRESS VIEW ===

  showProgressView() {
    this.showView('progressView');
    document.getElementById('totalAyahsLearned').textContent = this.state.progress.ayahsLearned;
    document.getElementById('totalDaysActive').textContent = this.state.progress.daysActive.length;
    document.getElementById('currentStreak').textContent = this.state.progress.streak;

    const progressItems = document.querySelector('.progress-items');
    const html = Object.entries(this.state.progress.surahProgress).map(([num, ayahNum]) => {
      const surah = this.state.surahs.find(s => s.number === parseInt(num));
      if (!surah) return '';
      const pct = (ayahNum / surah.numberOfAyahs) * 100;
      return `
        <div class="progress-item">
          <span>${surah.englishName}</span>
          <span>${ayahNum}/${surah.numberOfAyahs}</span>
          <div class="progress-bar"><div class="progress-fill" style="width: ${pct}%"></div></div>
        </div>
      `;
    }).join('');

    progressItems.innerHTML = html || '<p style="padding: 1rem;">No progress yet</p>';

    this.addAIMessage(`
      Here's your learning journey so far:<br><br>
      📚 <strong>${this.state.progress.ayahsLearned}</strong> ayahs memorized<br>
      📅 <strong>${this.state.progress.daysActive.length}</strong> days active<br>
      🔥 <strong>${this.state.progress.streak}</strong> day streak<br><br>
      Keep up the excellent work! Consistency is key to memorization.
    `);
  }

  showAbout() {
    this.addAIMessage(`
      <strong>About Even an Ayah</strong> 📖<br><br>
      Based on the hadith:<br>
      <em>"بلغوا عني ولو آية"</em><br>
      "Convey from me even an Ayah of the Qur'an"<br>
      <small>— Al-Bukhari (Riyad as-Salihin 1380)</small><br><br>
      This AI-native app helps you memorize the Quran one ayah at a time using proven learning techniques:<br><br>
      ✅ Spaced repetition<br>
      ✅ Active recall<br>
      ✅ Multi-sensory learning<br>
      ✅ Understanding root words<br><br>
      May Allah accept our efforts. Ameen.
    `);
  }

  // === UI HELPERS ===

  openMenu() {
    document.getElementById('sideMenu').classList.add('open');
    document.getElementById('menuOverlay').classList.add('active');
  }

  closeMenu() {
    document.getElementById('sideMenu').classList.remove('open');
    document.getElementById('menuOverlay').classList.remove('active');
  }

  openModal(modalId) {
    document.getElementById(modalId).classList.remove('hidden');
  }

  closeModal(modalId) {
    document.getElementById(modalId).classList.add('hidden');
  }

  showLoading(text = 'Loading...') {
    this.elements.loadingText.textContent = text;
    this.elements.loadingOverlay.classList.remove('hidden');
  }

  hideLoading() {
    this.elements.loadingOverlay.classList.add('hidden');
  }

  showToast(message, type = 'info') {
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.textContent = message;
    this.elements.toastContainer.appendChild(toast);
    setTimeout(() => {
      toast.style.animation = 'slideIn 0.3s ease reverse';
      setTimeout(() => toast.remove(), 300);
    }, 3000);
  }

  // === PERSISTENCE ===

  loadSettings() {
    const saved = localStorage.getItem('evenanayah_settings');
    if (saved) this.state.settings = { ...this.state.settings, ...JSON.parse(saved) };
  }

  saveSettings() {
    localStorage.setItem('evenanayah_settings', JSON.stringify(this.state.settings));
  }

  applySettings() {
    this.elements.darkModeToggle.checked = this.state.settings.darkMode;
    this.applyDarkMode();
    this.elements.fontSizeRange.value = this.state.settings.fontSize;
    this.elements.fontSizeValue.textContent = `${this.state.settings.fontSize}px`;
    document.documentElement.style.setProperty('--arabic-font-size', `${this.state.settings.fontSize}px`);
    this.elements.reciterSelect.value = this.state.settings.reciter;
    this.elements.translationSelect.value = this.state.settings.translation;
  }

  applyDarkMode() {
    if (this.state.settings.darkMode) {
      document.documentElement.setAttribute('data-theme', 'dark');
    } else {
      document.documentElement.removeAttribute('data-theme');
    }
  }

  loadProgress() {
    const saved = localStorage.getItem('evenanayah_progress');
    if (saved) this.state.progress = { ...this.state.progress, ...JSON.parse(saved) };
  }

  saveProgress() {
    localStorage.setItem('evenanayah_progress', JSON.stringify(this.state.progress));
  }

  resetProgress() {
    this.state.progress = { ayahsLearned: 0, daysActive: [], streak: 0, surahProgress: {} };
    this.saveProgress();
    this.showToast('Progress reset', 'info');
    this.addAIMessage('Your progress has been reset. Ready for a fresh start!');
  }
}

// Initialize
document.addEventListener('DOMContentLoaded', () => {
  window.app = new EvenAnAyah();
});

// Service Worker
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').catch(err => console.log('SW failed:', err));
  });
}
