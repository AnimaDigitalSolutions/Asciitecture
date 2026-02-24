# Asciitecture

> AI-friendly ASCII wireframe editor for designing mockups that both humans and AI can understand.

<p align="center">
  <img src="https://img.shields.io/badge/ASCII-Wireframes-blue" alt="ASCII Wireframes">
  <img src="https://img.shields.io/badge/AI-Friendly-green" alt="AI Friendly">
  <img src="https://img.shields.io/badge/Zero-Dependencies-orange" alt="Zero Dependencies">
</p>

## ✨ Features

- 🎨 **Visual Editor** - Drag and drop ASCII components
- 🤖 **AI-Friendly** - Export designs that AI coding assistants can implement
- 💾 **Auto-Save** - Never lose your work with automatic local storage
- 🔗 **URL Sharing** - Share designs with a simple link
- 📋 **Markdown Export** - Copy and paste into Claude, Cursor, or any AI tool
- ⌨️ **Keyboard Shortcuts** - Fast workflow with intuitive shortcuts
- 🌙 **Dark Mode** - Easy on the eyes
- 📱 **Responsive** - Works on any screen size

## 🚀 Quick Start

```bash
# Clone the repository
git clone https://github.com/yourusername/Asciitecture.io.git
cd Asciitecture.io

# Install dependencies (choose one)
pnpm install    # Recommended
npm install     # Alternative
bun install     # Fastest

# Start the development server
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) and start designing!

## 🎯 Usage

1. **Select a component** from the left panel
2. **Click on the canvas** to place it
3. **Drag to reposition** objects
4. **Export as Markdown** to use with AI tools
5. **Share via URL** for collaboration

## ⌨️ Keyboard Shortcuts

- `Delete` / `Backspace` - Delete selected object
- `Escape` - Deselect / Close dialogs
- `Cmd/Ctrl + D` - Duplicate selected object  
- `Cmd/Ctrl + S` - Share design via URL

## 🤖 AI Integration

### For AI Assistants

When users ask for wireframes, generate ASCII art like this:

```
┌─────────────────────────┐
│      Contact Form       │
├─────────────────────────┤
│ Name:                   │
│ ┌─────────────────────┐ │
│ └─────────────────────┘ │
│                         │
│ Email:                  │
│ ┌─────────────────────┐ │
│ └─────────────────────┘ │
│                         │
│  ┌────────┐ ┌────────┐ │
│  │ Submit │ │ Cancel │ │
│  └────────┘ └────────┘ │
└─────────────────────────┘
```

Users can then import this directly into Asciitecture!

### For Developers

Use our AI-friendly template functions:

```javascript
import { ai } from './lib/ai-templates';

// Create components programmatically
const button = ai.button("Click me");
const form = ai.form("Contact", ["Name", "Email", "Message"]);
const dashboard = ai.dashboard("Admin", ["Users", "Settings"]);
```

See [AI_GUIDE.md](./AI_GUIDE.md) for complete documentation.

## 🛠️ Tech Stack

- **React** - UI library
- **Vite** - Build tool
- **No other dependencies** - Seriously!

## 📦 Project Structure

```
Asciitecture.io/
├── src/
│   ├── App.jsx              # Main editor component
│   ├── lib/
│   │   ├── templates.js     # ASCII component templates
│   │   ├── ai-templates.js  # AI-friendly generators
│   │   ├── storage.js       # Local storage & URL sharing
│   │   └── export.js        # Export utilities
│   └── main.jsx            # App entry point
├── AI_GUIDE.md             # Guide for AI assistants
└── README.md               # You are here!
```

## 🎨 Available Components

### UI Elements
- Buttons, Inputs, Textareas
- Cards, Modals, Tables  
- Checkboxes, Radio buttons
- Dropdowns, Toggles
- Progress bars, Badges

### Layout
- Navigation bars
- Sidebars
- Headers
- Grid systems

### Drawing Tools
- Boxes, Lines, Arrows
- Dividers

## 🤝 Contributing

Contributions are welcome! Feel free to:

- Report bugs
- Suggest new features
- Add new ASCII components
- Improve AI integration

## 📄 License

MIT License - feel free to use this in your projects!

## 🙏 Acknowledgments

Inspired by:
- [excalidraw](https://excalidraw.com) - For the sharing model
- [wireframe.cc](https://wireframe.cc) - For the simplicity
- [ASCIIFlow](https://asciiflow.com) - For ASCII art inspiration

---

Made with ❤️ for developers and AI
