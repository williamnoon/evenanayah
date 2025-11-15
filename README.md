# بلغوا عني ولو آية - Even an Ayah

> "Convey from me even an Ayah of the Qur'an"
> — Prophet Muhammad ﷺ (Al-Bukhari)

An AI-native Quran memorization application that helps you learn the Quran one ayah at a time through a structured, multi-stage learning process.

## Features

### 📖 Structured Learning Process

1. **Listen & Memorize by Tongue** - Listen to correct recitation and repeat until you can recite fluently
2. **Write Without Harakat** - Practice writing the ayah without vowel marks
3. **Read from Your Writing** - Recite from your own handwriting
4. **Write from Memory** - Write the ayah from memory to reinforce retention
5. **Add Harakat** - Learn to add the correct vowel marks
6. **Study Root Words & Tafsir** - Understand etymology and commentary

### 🎯 Key Features

- **Mobile & Tablet Friendly** - Responsive design works on all devices
- **Progressive Web App (PWA)** - Install on your device for offline access
- **Audio Recitation** - Multiple renowned reciters available
- **Handwriting Canvas** - Practice writing Arabic with touch support
- **Multiple Translations** - English, Urdu, Indonesian, and more
- **Progress Tracking** - Track your memorization journey
- **Dark Mode** - Comfortable reading in any lighting
- **Daily Streak** - Stay motivated with streak tracking

## Quick Start

### Prerequisites

- Node.js 18 or higher
- npm or yarn

### Installation

```bash
# Clone the repository
git clone <repository-url>
cd evenanayah

# Install dependencies
npm install

# Start the server
npm start
```

The app will be available at `http://localhost:3000`

### Development

```bash
# Run with auto-reload
npm run dev
```

## Technology Stack

- **Backend**: Node.js with Express
- **Frontend**: Vanilla JavaScript (no framework dependencies)
- **Styling**: Custom CSS with CSS Variables
- **PWA**: Service Worker for offline support
- **Data Source**: QuranHub MCP Server API

## API Integration

This app uses the QuranHub MCP Server for Quran data:

- **Ayahs**: Arabic text with translations
- **Audio**: Recitations from various narrators
- **Metadata**: Surah information and structure

## Project Structure

```
evenanayah/
├── server.js           # Express server
├── package.json        # Project configuration
├── public/
│   ├── index.html      # Main HTML file
│   ├── manifest.json   # PWA manifest
│   ├── sw.js           # Service Worker
│   ├── css/
│   │   └── app.css     # Styles
│   ├── js/
│   │   └── app.js      # Main application logic
│   └── assets/
│       └── icon.svg    # App icon
└── README.md           # This file
```

## Customization

### Settings

Users can customize:
- **Reciter**: Choose from multiple renowned reciters
- **Translation**: Select preferred language
- **Font Size**: Adjust Arabic text size
- **Dark Mode**: Toggle light/dark theme
- **Auto-play Audio**: Automatically play recitation

### Adding Reciters

Edit the reciter options in `public/index.html`:

```html
<select id="reciterSelect">
  <option value="ar.alafasy">Mishary Rashid Alafasy</option>
  <!-- Add more options -->
</select>
```

## Deployment

### Docker (Recommended)

```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install --production
COPY . .
EXPOSE 3000
CMD ["npm", "start"]
```

### Cloud Platforms

Works with:
- Heroku
- Railway
- Render
- Google Cloud Run
- AWS Elastic Beanstalk
- Azure App Service

## Chat Platform Integration

This app can be embedded in chat platforms:

### Web Embed

```html
<iframe
  src="https://your-domain.com"
  width="100%"
  height="600px"
  frameborder="0">
</iframe>
```

### Telegram Web App

Configure as a Telegram Mini App by setting the web app URL.

### WhatsApp Cloud API

Can be integrated as a message template with quick reply buttons.

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## Roadmap

- [ ] AI-powered recitation verification
- [ ] Advanced tajweed feedback
- [ ] Social features (study groups)
- [ ] Spaced repetition algorithm
- [ ] Offline audio caching
- [ ] Multi-language UI
- [ ] Gamification elements
- [ ] Teacher/student mode

## License

MIT License - see LICENSE file for details

## Acknowledgments

- **Hadith**: Riyad as-Salihin 1380, In-book reference: Book 12, Hadith 5
- **Quran Data**: QuranHub MCP Server
- **Audio Recitations**: Various renowned reciters
- **Fonts**: Google Fonts (Amiri, Noto Sans Arabic, Inter)

## Support

For issues and feature requests, please open an issue on the repository.

---

**May Allah accept this effort and make it beneficial for the Ummah. Ameen.**

بارك الله فيكم
