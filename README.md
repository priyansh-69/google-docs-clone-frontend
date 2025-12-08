# 📝 FlowDocs - Client

> A modern, real-time collaborative document editor built with React

[![React](https://img.shields.io/badge/React-17.0.2-blue.svg)](https://reactjs.org/)
[![Socket.IO](https://img.shields.io/badge/Socket.IO-4.0.1-green.svg)](https://socket.io/)
[![License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)

## ✨ Features

### 🚀 Core Functionality
- **Real-time Collaboration** - Multiple users can edit documents simultaneously
- **Rich Text Editing** - Powered by Quill.js with full formatting support
- **Auto-save** - Documents save automatically every 2 seconds
- **Offline Support** - Continue editing offline, sync when reconnected
- **Document Sharing** - Generate shareable links with view/edit permissions

### 🎨 User Experience
- **Dark Mode** - Toggle between light and dark themes
- **Grid/List View** - Switch between document view modes
- **Live Cursors** - See where other users are editing in real-time
- **Active Users** - View who's currently in the document
- **Connection Status** - Real-time online/offline indicators

### 🤖 AI Features
- **Grammar Correction** - Fix grammar and spelling errors
- **Text Enhancement** - Make writing more professional
- **Summarization** - Generate concise summaries
- **Text Expansion** - Add more details and elaboration
- **Simplification** - Rewrite in simple, easy words

### 🔒 Security
- **JWT Authentication** - Secure user authentication
- **Protected Routes** - Private documents require authentication
- **Share Tokens** - Secure document sharing with unique tokens

## 🛠️ Tech Stack

| Technology | Purpose |
|------------|---------|
| **React 17** | UI framework |
| **Quill.js** | Rich text editor |
| **Socket.IO** | Real-time communication |
| **React Router** | Client-side routing |
| **Axios** | HTTP client |
| **React Hot Toast** | Toast notifications |
| **React Icons** | Icon library |

## 📦 Installation

### Prerequisites
- Node.js >= 14.x
- npm or yarn

### Setup

1. **Clone the repository**
```bash
git clone <repository-url>
cd google-clone/client
```

2. **Install dependencies**
```bash
npm install
```

3. **Configure environment variables**

Create a `.env` file in the client directory:

```env
REACT_APP_API_BASE_URL=http://localhost:3001
```

For production (Vercel):
```env
REACT_APP_API_BASE_URL=https://your-backend-url.com
```

4. **Start development server**
```bash
npm start
```

The app will open at [http://localhost:3000](http://localhost:3000)

## 🏗️ Build for Production

```bash
npm run build
```

Creates an optimized production build in the `build/` folder.

## 📁 Project Structure

```
client/
├── public/
│   ├── index.html          # HTML template
│   └── favicon.ico         # App icon
├── src/
│   ├── components/         # Reusable components
│   │   ├── AIAssistant.js  # AI writing assistant
│   │   ├── ErrorBoundary.js # Error handling
│   │   └── *.css           # Component styles
│   ├── context/
│   │   └── AuthContext.js  # Authentication context
│   ├── pages/
│   │   ├── Dashboard.js    # Document dashboard
│   │   ├── Login.js        # Login page
│   │   └── Register.js     # Registration page
│   ├── TextEditor.js       # Main editor component
│   ├── App.js              # Root component
│   ├── index.js            # Entry point
│   └── styles.css          # Global styles
├── .env                    # Environment variables
└── package.json            # Dependencies
```

## 🎯 Key Components

### TextEditor
The main collaborative editor component featuring:
- Real-time synchronization
- Cursor tracking
- Auto-save functionality
- Offline editing support
- AI writing assistant integration

### Dashboard
Document management interface with:
- Create new documents
- View all documents (grid/list view)
- Delete documents
- Search and filter
- Dark mode toggle

### AIAssistant
Intelligent writing assistant providing:
- Grammar correction
- Text enhancement
- Summarization
- Expansion
- Simplification

## 🔌 API Integration

The client communicates with the backend via:

### REST API
```javascript
// Authentication
POST /api/auth/register
POST /api/auth/login
GET /api/auth/user

// Documents
GET /api/documents
POST /api/documents
GET /api/documents/:id
PUT /api/documents/:id
DELETE /api/documents/:id

// AI
POST /api/ai/process
```

### WebSocket Events
```javascript
// Connection
socket.on('connect')
socket.on('disconnect')

// Document
socket.emit('get-document', { documentId, shareToken })
socket.emit('send-changes', delta)
socket.on('receive-changes', delta)
socket.emit('save-document', data)

// Collaboration
socket.on('user-joined', user)
socket.on('user-left', username)
socket.emit('cursor-position', { position, username })
```

## 🎨 Styling

FlowDocs uses a modern **glassmorphism** design system with:
- CSS custom properties for theming
- Dark mode support
- Responsive layouts
- Smooth animations
- Backdrop blur effects

### Color Palette
```css
--primary: #667eea
--secondary: #764ba2
--background: #0f0f1e
--surface: rgba(255, 255, 255, 0.05)
--text: #ffffff
```

## 🧪 Testing

```bash
# Run tests
npm test

# Run tests with coverage
npm test -- --coverage
```

## 🚀 Deployment

### Vercel (Recommended)

1. **Connect your repository** to Vercel
2. **Set environment variables**:
   - `REACT_APP_API_BASE_URL` = your backend URL
3. **Deploy** - Vercel will automatically build and deploy

### Manual Deployment

```bash
# Build the app
npm run build

# Deploy the build/ folder to your hosting service
```

## 🔧 Configuration

### Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `REACT_APP_API_BASE_URL` | Backend API URL | `http://localhost:3001` |

## 📝 Features in Detail

### Real-time Collaboration
- Uses Socket.IO for bidirectional communication
- Operational Transformation for conflict resolution
- Live cursor positions with user avatars
- Active user list with online status

### Offline Support
- Detects connection status
- Queues changes when offline
- Syncs automatically on reconnection
- Visual indicators for sync status

### AI Writing Assistant
- Powered by Google Gemini AI
- Context-aware suggestions
- Multiple enhancement modes
- Clean, label-free output

## 🐛 Known Issues

1. **Browser Cache** - After updates, users may need to hard refresh (Ctrl+Shift+R)
2. **AI Quota** - Free tier has limited requests (1500/day)

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License.

## 🙏 Acknowledgments

- [Quill.js](https://quilljs.com/) - Rich text editor
- [Socket.IO](https://socket.io/) - Real-time engine
- [React Icons](https://react-icons.github.io/react-icons/) - Icon library
- [Google Gemini](https://ai.google.dev/) - AI capabilities

## 📞 Support

For issues and questions:
- Create an issue on GitHub
- Check existing documentation
- Review the codebase analysis

---

**Built with ❤️ using React and modern web technologies**
