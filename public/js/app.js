// Even an Ayah - Main Application Logic

class EvenAnAyah {
  constructor() {
    // App State
    this.state = {
      currentScreen: 'welcome',
      currentSurah: null,
      currentAyah: 1,
      currentStage: 1,
      surahs: [],
      ayahData: null,
      audioData: null,
      writtenImage: null,
      memoryWrittenImage: null,
      isRecording: false,
      mediaRecorder: null,
      audioChunks: [],
      canvasHistory: [],
      memoryCanvasHistory: [],
      settings: {
        reciter: 'ar.alafasy',
        translation: 'en.sahih',
        fontSize: 28,
        darkMode: false,
        autoPlayAudio: false
      },
      progress: {
        ayahsLearned: 0,
        daysActive: [],
        streak: 0,
        surahProgress: {}
      }
    };

    // DOM Elements
    this.elements = {};

    // Initialize
    this.init();
  }

  async init() {
    this.loadSettings();
    this.loadProgress();
    this.cacheElements();
    this.bindEvents();
    this.applySettings();
    await this.loadSurahs();
  }

  cacheElements() {
    // Screens
    this.elements.welcomeScreen = document.getElementById('welcomeScreen');
    this.elements.surahSelectScreen = document.getElementById('surahSelectScreen');
    this.elements.ayahSelectScreen = document.getElementById('ayahSelectScreen');
    this.elements.learningScreen = document.getElementById('learningScreen');
    this.elements.progressScreen = document.getElementById('progressScreen');
    this.elements.settingsScreen = document.getElementById('settingsScreen');
    this.elements.aboutScreen = document.getElementById('aboutScreen');

    // Menu
    this.elements.menuBtn = document.getElementById('menuBtn');
    this.elements.sideMenu = document.getElementById('sideMenu');
    this.elements.closeMenuBtn = document.getElementById('closeMenuBtn');
    this.elements.menuOverlay = document.getElementById('menuOverlay');

    // Surah Selection
    this.elements.surahList = document.getElementById('surahList');
    this.elements.surahSearch = document.getElementById('surahSearch');
    this.elements.selectedSurahName = document.getElementById('selectedSurahName');
    this.elements.totalAyahs = document.getElementById('totalAyahs');
    this.elements.surahProgress = document.getElementById('surahProgress');
    this.elements.surahTotal = document.getElementById('surahTotal');
    this.elements.ayahNumber = document.getElementById('ayahNumber');

    // Learning Screen
    this.elements.currentSurahAyah = document.getElementById('currentSurahAyah');
    this.elements.wordByWord = document.getElementById('wordByWord');
    this.elements.translationText = document.getElementById('translationText');
    this.elements.audioPlayer = document.getElementById('audioPlayer');

    // Canvases
    this.elements.writingCanvas = document.getElementById('writingCanvas');
    this.elements.memoryCanvas = document.getElementById('memoryCanvas');

    // Settings
    this.elements.reciterSelect = document.getElementById('reciterSelect');
    this.elements.translationSelect = document.getElementById('translationSelect');
    this.elements.fontSizeRange = document.getElementById('fontSizeRange');
    this.elements.fontSizeValue = document.getElementById('fontSizeValue');
    this.elements.darkModeToggle = document.getElementById('darkModeToggle');
    this.elements.autoPlayAudio = document.getElementById('autoPlayAudio');

    // Loading
    this.elements.loadingOverlay = document.getElementById('loadingOverlay');
    this.elements.loadingText = document.getElementById('loadingText');
    this.elements.toastContainer = document.getElementById('toastContainer');
  }

  bindEvents() {
    // Menu Events
    this.elements.menuBtn.addEventListener('click', () => this.openMenu());
    this.elements.closeMenuBtn.addEventListener('click', () => this.closeMenu());
    this.elements.menuOverlay.addEventListener('click', () => this.closeMenu());

    // Menu Navigation
    document.querySelectorAll('.menu-list a').forEach(link => {
      link.addEventListener('click', (e) => {
        e.preventDefault();
        const action = e.target.dataset.action;
        this.handleMenuAction(action);
        this.closeMenu();
      });
    });

    // Welcome Screen
    document.getElementById('startBtn').addEventListener('click', () => {
      this.showScreen('surahSelect');
    });

    // Surah Selection
    this.elements.surahSearch.addEventListener('input', (e) => {
      this.filterSurahs(e.target.value);
    });

    // Ayah Selection
    document.getElementById('backToSurahBtn').addEventListener('click', () => {
      this.showScreen('surahSelect');
    });

    document.getElementById('startAyahBtn').addEventListener('click', () => {
      const ayahNum = parseInt(this.elements.ayahNumber.value);
      if (ayahNum >= 1 && ayahNum <= this.state.currentSurah.numberOfAyahs) {
        this.state.currentAyah = ayahNum;
        this.startLearning();
      } else {
        this.showToast('Invalid ayah number', 'error');
      }
    });

    // Stage 1 - Listen & Memorize
    document.getElementById('playAudioBtn').addEventListener('click', () => this.playAudio());
    document.getElementById('repeatAudioBtn').addEventListener('click', () => this.repeatAudio());
    document.getElementById('recordBtn').addEventListener('click', () => this.toggleRecording('recordBtn', 'recordingStatus'));
    document.getElementById('stage1CompleteBtn').addEventListener('click', () => this.completeStage(1));

    // Stage 2 - Write Without Harakat
    document.getElementById('toggleReferenceBtn').addEventListener('click', () => {
      this.toggleElement('referenceText', 'toggleReferenceBtn');
    });
    document.getElementById('clearCanvasBtn').addEventListener('click', () => this.clearCanvas('writingCanvas'));
    document.getElementById('undoCanvasBtn').addEventListener('click', () => this.undoCanvas('writingCanvas'));
    document.getElementById('stage2CompleteBtn').addEventListener('click', () => this.completeStage(2));

    // Stage 3 - Read from Handwriting
    document.getElementById('toggleReference2Btn').addEventListener('click', () => {
      this.toggleElement('referenceText2', 'toggleReference2Btn');
    });
    document.getElementById('recordBtn2').addEventListener('click', () => this.toggleRecording('recordBtn2', 'recordingStatus2'));
    document.getElementById('stage3CompleteBtn').addEventListener('click', () => this.completeStage(3));

    // Stage 4 - Write from Memory
    document.getElementById('clearMemoryCanvasBtn').addEventListener('click', () => this.clearCanvas('memoryCanvas'));
    document.getElementById('undoMemoryCanvasBtn').addEventListener('click', () => this.undoCanvas('memoryCanvas'));
    document.getElementById('stage4CompleteBtn').addEventListener('click', () => this.completeStage(4));

    // Stage 5 - Add Harakat
    document.getElementById('toggleReference3Btn').addEventListener('click', () => {
      this.toggleElement('referenceText3', 'toggleReference3Btn');
    });

    // Harakat Keyboard
    document.querySelectorAll('.harakat-key').forEach(key => {
      key.addEventListener('click', (e) => {
        const char = e.target.dataset.char;
        const input = document.getElementById('harakatInput');
        const pos = input.selectionStart;
        input.value = input.value.slice(0, pos) + char + input.value.slice(pos);
        input.focus();
        input.setSelectionRange(pos + 1, pos + 1);
      });
    });

    document.getElementById('stage5CompleteBtn').addEventListener('click', () => this.completeStage(5));

    // Stage 6 - Final Recitation & Root Words
    document.getElementById('recordBtn3').addEventListener('click', () => this.toggleRecording('recordBtn3', 'recordingStatus3'));
    document.getElementById('confirmUnderstanding').addEventListener('change', (e) => {
      document.getElementById('completeAyahBtn').disabled = !e.target.checked;
    });
    document.getElementById('completeAyahBtn').addEventListener('click', () => this.completeAyah());

    // Settings Events
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

    this.elements.autoPlayAudio.addEventListener('change', (e) => {
      this.state.settings.autoPlayAudio = e.target.checked;
      this.saveSettings();
    });

    document.getElementById('resetProgressBtn').addEventListener('click', () => {
      if (confirm('Are you sure you want to reset all progress? This cannot be undone.')) {
        this.resetProgress();
      }
    });

    // Canvas Drawing
    this.setupCanvas('writingCanvas', 'canvasHistory');
    this.setupCanvas('memoryCanvas', 'memoryCanvasHistory');

    // Hint Button
    document.getElementById('showHintBtn').addEventListener('click', () => {
      this.showToast('Keep practicing! You can do this! 💪', 'info');
    });
  }

  setupCanvas(canvasId, historyKey) {
    const canvas = document.getElementById(canvasId);
    const ctx = canvas.getContext('2d');
    let isDrawing = false;
    let lastX = 0;
    let lastY = 0;

    // Set canvas size
    const resizeCanvas = () => {
      const rect = canvas.getBoundingClientRect();
      canvas.width = rect.width * window.devicePixelRatio;
      canvas.height = rect.height * window.devicePixelRatio;
      ctx.scale(window.devicePixelRatio, window.devicePixelRatio);
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
    };

    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    const getCoordinates = (e) => {
      const rect = canvas.getBoundingClientRect();
      if (e.touches) {
        return {
          x: e.touches[0].clientX - rect.left,
          y: e.touches[0].clientY - rect.top
        };
      }
      return {
        x: e.clientX - rect.left,
        y: e.clientY - rect.top
      };
    };

    const startDrawing = (e) => {
      e.preventDefault();
      isDrawing = true;
      const coords = getCoordinates(e);
      lastX = coords.x;
      lastY = coords.y;

      // Save state for undo
      this.state[historyKey].push(canvas.toDataURL());
    };

    const draw = (e) => {
      if (!isDrawing) return;
      e.preventDefault();

      const coords = getCoordinates(e);
      const penColor = document.getElementById('penColor').value;
      const penSize = document.getElementById('penSize').value;

      ctx.strokeStyle = penColor;
      ctx.lineWidth = penSize;
      ctx.beginPath();
      ctx.moveTo(lastX, lastY);
      ctx.lineTo(coords.x, coords.y);
      ctx.stroke();

      lastX = coords.x;
      lastY = coords.y;
    };

    const stopDrawing = () => {
      isDrawing = false;
    };

    // Mouse events
    canvas.addEventListener('mousedown', startDrawing);
    canvas.addEventListener('mousemove', draw);
    canvas.addEventListener('mouseup', stopDrawing);
    canvas.addEventListener('mouseout', stopDrawing);

    // Touch events
    canvas.addEventListener('touchstart', startDrawing, { passive: false });
    canvas.addEventListener('touchmove', draw, { passive: false });
    canvas.addEventListener('touchend', stopDrawing);
  }

  clearCanvas(canvasId) {
    const canvas = document.getElementById(canvasId);
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);
  }

  undoCanvas(canvasId) {
    const historyKey = canvasId === 'writingCanvas' ? 'canvasHistory' : 'memoryCanvasHistory';
    const history = this.state[historyKey];

    if (history.length > 0) {
      const canvas = document.getElementById(canvasId);
      const ctx = canvas.getContext('2d');
      const img = new Image();

      img.onload = () => {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(img, 0, 0, canvas.width / window.devicePixelRatio, canvas.height / window.devicePixelRatio);
      };

      img.src = history.pop();
    }
  }

  async loadSurahs() {
    this.showLoading('Loading Surahs...');
    try {
      const response = await fetch('/api/surahs');
      const data = await response.json();

      if (data.data) {
        this.state.surahs = data.data;
        this.renderSurahList();
      }
    } catch (error) {
      console.error('Failed to load surahs:', error);
      this.showToast('Failed to load surahs. Please try again.', 'error');
    }
    this.hideLoading();
  }

  renderSurahList() {
    const html = this.state.surahs.map(surah => `
      <div class="surah-card" data-surah="${surah.number}">
        <div class="surah-number">${surah.number}</div>
        <div class="surah-info">
          <div class="surah-name-arabic">${surah.name}</div>
          <div class="surah-name-english">${surah.englishName}</div>
          <div class="surah-meta">${surah.numberOfAyahs} Ayahs • ${surah.revelationType}</div>
        </div>
      </div>
    `).join('');

    this.elements.surahList.innerHTML = html;

    // Add click events
    document.querySelectorAll('.surah-card').forEach(card => {
      card.addEventListener('click', (e) => {
        const surahNum = parseInt(card.dataset.surah);
        this.selectSurah(surahNum);
      });
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
                      surah.englishNameTranslation.toLowerCase().includes(lowerQuery) ||
                      surah.number.toString() === query;

      card.style.display = matches ? 'flex' : 'none';
    });
  }

  selectSurah(surahNum) {
    this.state.currentSurah = this.state.surahs.find(s => s.number === surahNum);

    // Update ayah selection screen
    this.elements.selectedSurahName.textContent = `${this.state.currentSurah.englishName} (${this.state.currentSurah.name})`;
    this.elements.totalAyahs.textContent = this.state.currentSurah.numberOfAyahs;
    this.elements.surahTotal.textContent = this.state.currentSurah.numberOfAyahs;
    this.elements.ayahNumber.max = this.state.currentSurah.numberOfAyahs;

    // Load progress
    const progress = this.state.progress.surahProgress[surahNum] || 0;
    this.elements.surahProgress.textContent = progress;

    // Set starting ayah to next unlearned
    this.elements.ayahNumber.value = Math.min(progress + 1, this.state.currentSurah.numberOfAyahs);

    this.showScreen('ayahSelect');
  }

  async startLearning() {
    this.showLoading('Loading Ayah...');

    try {
      const ref = `${this.state.currentSurah.number}:${this.state.currentAyah}`;

      // Fetch ayah with translation
      const ayahResponse = await fetch(`/api/ayah/${ref}?editions=quran-uthmani,${this.state.settings.translation}`);
      const ayahData = await ayahResponse.json();

      if (ayahData.data) {
        this.state.ayahData = ayahData.data;
        this.setupLearningScreen();
      }

      // Fetch audio
      const audioResponse = await fetch(`/api/audio/${ref}?reciter=${this.state.settings.reciter}`);
      const audioData = await audioResponse.json();

      if (audioData.data) {
        this.state.audioData = audioData.data;
        this.elements.audioPlayer.src = audioData.data.audio;
      }

      this.showScreen('learning');
      this.state.currentStage = 1;
      this.updateStageUI();

      if (this.state.settings.autoPlayAudio) {
        setTimeout(() => this.playAudio(), 1000);
      }
    } catch (error) {
      console.error('Failed to load ayah:', error);
      this.showToast('Failed to load ayah. Please try again.', 'error');
    }

    this.hideLoading();
  }

  setupLearningScreen() {
    const arabicText = this.state.ayahData[0].text;
    const translationText = this.state.ayahData[1] ? this.state.ayahData[1].text : '';

    // Update header
    this.elements.currentSurahAyah.textContent = `${this.state.currentSurah.englishName} ${this.state.currentSurah.number}:${this.state.currentAyah}`;

    // Display word by word
    const words = arabicText.split(' ');
    this.elements.wordByWord.innerHTML = words.map((word, i) =>
      `<span class="word" data-index="${i}">${word}</span>`
    ).join('');

    // Add click events to words
    document.querySelectorAll('.word').forEach(wordEl => {
      wordEl.addEventListener('click', (e) => {
        document.querySelectorAll('.word').forEach(w => w.classList.remove('highlighted'));
        e.target.classList.add('highlighted');
      });
    });

    // Translation
    this.elements.translationText.textContent = translationText;

    // Reference texts
    document.getElementById('referenceText').textContent = arabicText;
    document.getElementById('referenceText2').textContent = arabicText;
    document.getElementById('referenceText3').textContent = arabicText;

    // Text without harakat for stage 5
    const textWithoutHarakat = this.removeHarakat(arabicText);
    document.getElementById('textWithoutHarakat').textContent = textWithoutHarakat;

    // Clear inputs
    document.getElementById('writtenTextInput').value = '';
    document.getElementById('memoryTextInput').value = '';
    document.getElementById('harakatInput').value = '';
    document.getElementById('confirmUnderstanding').checked = false;
    document.getElementById('completeAyahBtn').disabled = true;

    // Clear canvases
    this.clearCanvas('writingCanvas');
    this.clearCanvas('memoryCanvas');
    this.state.canvasHistory = [];
    this.state.memoryCanvasHistory = [];

    // Load root words and tafsir
    this.loadRootWords(arabicText);
    this.loadTafsir();
  }

  removeHarakat(text) {
    // Remove Arabic diacritics/harakat
    const harakatRegex = /[\u064B-\u065F\u0670]/g;
    return text.replace(harakatRegex, '');
  }

  playAudio() {
    if (this.elements.audioPlayer.src) {
      this.elements.audioPlayer.currentTime = 0;
      this.elements.audioPlayer.play();
    }
  }

  repeatAudio() {
    this.playAudio();
  }

  async toggleRecording(btnId, statusId) {
    const btn = document.getElementById(btnId);
    const status = document.getElementById(statusId);

    if (!this.state.isRecording) {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        this.state.mediaRecorder = new MediaRecorder(stream);
        this.state.audioChunks = [];

        this.state.mediaRecorder.ondataavailable = (e) => {
          this.state.audioChunks.push(e.data);
        };

        this.state.mediaRecorder.onstop = () => {
          const audioBlob = new Blob(this.state.audioChunks, { type: 'audio/webm' });
          status.innerHTML = `
            <audio controls src="${URL.createObjectURL(audioBlob)}"></audio>
            <p>Recording saved! Listen to check your recitation.</p>
          `;
          stream.getTracks().forEach(track => track.stop());
        };

        this.state.mediaRecorder.start();
        this.state.isRecording = true;
        btn.textContent = '⏹️ Stop Recording';
        btn.classList.add('recording');
        status.textContent = 'Recording... Speak now';
      } catch (error) {
        console.error('Recording error:', error);
        this.showToast('Could not access microphone. Please check permissions.', 'error');
      }
    } else {
      this.state.mediaRecorder.stop();
      this.state.isRecording = false;
      btn.textContent = '🎤 Start Recording';
      btn.classList.remove('recording');
    }
  }

  toggleElement(elementId, btnId) {
    const element = document.getElementById(elementId);
    const btn = document.getElementById(btnId);

    if (element.classList.contains('hidden')) {
      element.classList.remove('hidden');
      btn.textContent = 'Hide Text';
    } else {
      element.classList.add('hidden');
      btn.textContent = btn.textContent.replace('Hide', 'Show');
    }
  }

  completeStage(stageNum) {
    // Validate stage completion
    if (stageNum === 2) {
      const canvas = document.getElementById('writingCanvas');
      const textInput = document.getElementById('writtenTextInput').value;

      if (!textInput && !this.hasDrawing(canvas)) {
        this.showToast('Please write the ayah either on canvas or in the text field.', 'error');
        return;
      }

      // Save written content for stage 3
      if (this.hasDrawing(canvas)) {
        this.state.writtenImage = canvas.toDataURL();
        document.getElementById('yourWritingDisplay').innerHTML = `<img src="${this.state.writtenImage}" alt="Your handwriting">`;
      } else {
        document.getElementById('yourWritingDisplay').innerHTML = `<p class="arabic-display">${textInput}</p>`;
      }
    }

    if (stageNum === 4) {
      const canvas = document.getElementById('memoryCanvas');
      const textInput = document.getElementById('memoryTextInput').value;

      if (!textInput && !this.hasDrawing(canvas)) {
        this.showToast('Please write the ayah from memory.', 'error');
        return;
      }

      // Verify memory writing (simplified verification)
      const correctText = this.removeHarakat(this.state.ayahData[0].text);
      if (textInput) {
        const similarity = this.calculateSimilarity(this.removeHarakat(textInput), correctText);
        if (similarity < 0.7) {
          this.showToast('Your writing doesn\'t match well. Please try again or check the reference.', 'error');
          return;
        }
      }
    }

    if (stageNum === 5) {
      const harakatInput = document.getElementById('harakatInput').value;
      if (!harakatInput.trim()) {
        this.showToast('Please add the harakat to the text.', 'error');
        return;
      }

      // Verify harakat (simplified)
      const correctText = this.state.ayahData[0].text;
      const similarity = this.calculateSimilarity(harakatInput.trim(), correctText.trim());
      if (similarity < 0.8) {
        this.showToast('Some harakat may be incorrect. Check the reference and try again.', 'info');
      }
    }

    this.showToast(`Stage ${stageNum} completed! ✓`, 'success');
    this.state.currentStage = stageNum + 1;
    this.updateStageUI();
  }

  hasDrawing(canvas) {
    const ctx = canvas.getContext('2d');
    const pixelData = ctx.getImageData(0, 0, canvas.width, canvas.height).data;
    return pixelData.some(channel => channel !== 0);
  }

  calculateSimilarity(str1, str2) {
    // Simple Levenshtein distance based similarity
    const longer = str1.length > str2.length ? str1 : str2;
    const shorter = str1.length > str2.length ? str2 : str1;

    if (longer.length === 0) return 1.0;

    const editDistance = this.levenshteinDistance(longer, shorter);
    return (longer.length - editDistance) / longer.length;
  }

  levenshteinDistance(str1, str2) {
    const matrix = [];

    for (let i = 0; i <= str2.length; i++) {
      matrix[i] = [i];
    }

    for (let j = 0; j <= str1.length; j++) {
      matrix[0][j] = j;
    }

    for (let i = 1; i <= str2.length; i++) {
      for (let j = 1; j <= str1.length; j++) {
        if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
          matrix[i][j] = matrix[i - 1][j - 1];
        } else {
          matrix[i][j] = Math.min(
            matrix[i - 1][j - 1] + 1,
            matrix[i][j - 1] + 1,
            matrix[i - 1][j] + 1
          );
        }
      }
    }

    return matrix[str2.length][str1.length];
  }

  updateStageUI() {
    // Update progress steps
    document.querySelectorAll('.step').forEach((step, index) => {
      const stepNum = index + 1;
      step.classList.remove('active', 'completed');

      if (stepNum < this.state.currentStage) {
        step.classList.add('completed');
      } else if (stepNum === this.state.currentStage) {
        step.classList.add('active');
      }
    });

    // Show current stage
    for (let i = 1; i <= 6; i++) {
      const stage = document.getElementById(`stage${i}`);
      if (stage) {
        stage.classList.toggle('active', i === this.state.currentStage);
      }
    }
  }

  loadRootWords(text) {
    // Simulated root word analysis (in production, this would call a real API)
    const words = text.split(' ').filter(w => w.length > 2);
    const rootWordsList = document.getElementById('rootWordsList');

    const rootWordsHTML = words.slice(0, 10).map(word => {
      const root = this.extractRoot(word);
      return `
        <div class="root-word-item">
          <div class="root-word-arabic">${word} ← ${root}</div>
          <div class="root-word-meaning">Root meaning: ${this.getRootMeaning(root)}</div>
        </div>
      `;
    }).join('');

    rootWordsList.innerHTML = rootWordsHTML || '<p>Loading word analysis...</p>';
  }

  extractRoot(word) {
    // Simplified root extraction (removes common prefixes and suffixes)
    let root = this.removeHarakat(word);
    // Remove common prefixes
    root = root.replace(/^(ال|و|ف|ب|ل|ك)/, '');
    // Remove common suffixes
    root = root.replace(/(ون|ين|ات|ة|ها|هم|كم|نا)$/, '');
    return root || word;
  }

  getRootMeaning(root) {
    // Placeholder - in production, would use a real Arabic dictionary API
    const meanings = {
      'الله': 'The One True God',
      'رحم': 'Mercy, Compassion',
      'حمد': 'Praise, Gratitude',
      'ملك': 'Sovereignty, Kingdom',
      'عبد': 'Worship, Servitude',
      'صرط': 'Path, Way',
      'هدي': 'Guidance',
    };

    return meanings[root] || 'Consult Arabic dictionary for full meaning';
  }

  loadTafsir() {
    // Placeholder tafsir (in production, would fetch from API)
    const tafsirText = document.getElementById('tafsirText');
    tafsirText.innerHTML = `
      <p><strong>Brief Commentary:</strong></p>
      <p>This ayah is part of Surah ${this.state.currentSurah.englishName}.
      For detailed tafsir, consult scholars like Ibn Kathir, Al-Qurtubi, or At-Tabari.</p>
      <p><strong>Key Themes:</strong></p>
      <ul>
        <li>Reflect on the meaning in your own language</li>
        <li>Consider how it applies to your life</li>
        <li>Research classical and contemporary interpretations</li>
      </ul>
    `;
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

    this.showToast('🎉 Congratulations! You have completed this ayah!', 'success');

    // Check if surah is complete
    if (this.state.currentAyah >= this.state.currentSurah.numberOfAyahs) {
      this.showToast(`🏆 You have completed Surah ${this.state.currentSurah.englishName}!`, 'success');
      setTimeout(() => this.showScreen('surahSelect'), 2000);
    } else {
      // Move to next ayah
      setTimeout(() => {
        this.state.currentAyah++;
        this.state.currentStage = 1;
        this.startLearning();
      }, 2000);
    }
  }

  updateStreak() {
    const sortedDays = this.state.progress.daysActive.sort((a, b) => new Date(b) - new Date(a));
    let streak = 1;
    const today = new Date();

    for (let i = 0; i < sortedDays.length - 1; i++) {
      const currentDay = new Date(sortedDays[i]);
      const nextDay = new Date(sortedDays[i + 1]);
      const diffDays = (currentDay - nextDay) / (1000 * 60 * 60 * 24);

      if (diffDays === 1) {
        streak++;
      } else {
        break;
      }
    }

    this.state.progress.streak = streak;
  }

  handleMenuAction(action) {
    switch (action) {
      case 'home':
        this.showScreen('welcome');
        break;
      case 'select-surah':
        this.showScreen('surahSelect');
        break;
      case 'progress':
        this.updateProgressScreen();
        this.showScreen('progress');
        break;
      case 'settings':
        this.showScreen('settings');
        break;
      case 'about':
        this.showScreen('about');
        break;
    }
  }

  updateProgressScreen() {
    document.getElementById('totalAyahsLearned').textContent = this.state.progress.ayahsLearned;
    document.getElementById('totalDaysActive').textContent = this.state.progress.daysActive.length;
    document.getElementById('currentStreak').textContent = this.state.progress.streak;

    // Surah progress list
    const progressItems = document.querySelector('.progress-items');
    const surahProgressHTML = Object.entries(this.state.progress.surahProgress)
      .map(([surahNum, ayahNum]) => {
        const surah = this.state.surahs.find(s => s.number === parseInt(surahNum));
        if (!surah) return '';

        const percentage = (ayahNum / surah.numberOfAyahs) * 100;
        return `
          <div class="progress-item">
            <span>${surah.englishName}</span>
            <span>${ayahNum}/${surah.numberOfAyahs}</span>
            <div class="progress-bar">
              <div class="progress-fill" style="width: ${percentage}%"></div>
            </div>
          </div>
        `;
      }).join('');

    progressItems.innerHTML = surahProgressHTML || '<p style="padding: 1rem;">No progress yet. Start learning!</p>';
  }

  showScreen(screenName) {
    // Hide all screens
    document.querySelectorAll('.screen').forEach(screen => {
      screen.classList.remove('active');
    });

    // Show selected screen
    const screenMap = {
      'welcome': this.elements.welcomeScreen,
      'surahSelect': this.elements.surahSelectScreen,
      'ayahSelect': this.elements.ayahSelectScreen,
      'learning': this.elements.learningScreen,
      'progress': this.elements.progressScreen,
      'settings': this.elements.settingsScreen,
      'about': this.elements.aboutScreen
    };

    const screen = screenMap[screenName];
    if (screen) {
      screen.classList.add('active');
      this.state.currentScreen = screenName;
    }
  }

  openMenu() {
    this.elements.sideMenu.classList.add('open');
    this.elements.menuOverlay.classList.add('active');
  }

  closeMenu() {
    this.elements.sideMenu.classList.remove('open');
    this.elements.menuOverlay.classList.remove('active');
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

  loadSettings() {
    const saved = localStorage.getItem('evenanayah_settings');
    if (saved) {
      this.state.settings = { ...this.state.settings, ...JSON.parse(saved) };
    }
  }

  saveSettings() {
    localStorage.setItem('evenanayah_settings', JSON.stringify(this.state.settings));
  }

  applySettings() {
    // Apply dark mode
    this.elements.darkModeToggle.checked = this.state.settings.darkMode;
    this.applyDarkMode();

    // Apply font size
    this.elements.fontSizeRange.value = this.state.settings.fontSize;
    this.elements.fontSizeValue.textContent = `${this.state.settings.fontSize}px`;
    document.documentElement.style.setProperty('--arabic-font-size', `${this.state.settings.fontSize}px`);

    // Apply other settings
    this.elements.reciterSelect.value = this.state.settings.reciter;
    this.elements.translationSelect.value = this.state.settings.translation;
    this.elements.autoPlayAudio.checked = this.state.settings.autoPlayAudio;
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
    if (saved) {
      this.state.progress = { ...this.state.progress, ...JSON.parse(saved) };
    }
  }

  saveProgress() {
    localStorage.setItem('evenanayah_progress', JSON.stringify(this.state.progress));
  }

  resetProgress() {
    this.state.progress = {
      ayahsLearned: 0,
      daysActive: [],
      streak: 0,
      surahProgress: {}
    };
    this.saveProgress();
    this.showToast('Progress has been reset.', 'info');
  }
}

// Initialize the app when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  window.app = new EvenAnAyah();
});

// Service Worker Registration for PWA
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js')
      .then(registration => {
        console.log('ServiceWorker registered:', registration);
      })
      .catch(error => {
        console.log('ServiceWorker registration failed:', error);
      });
  });
}
