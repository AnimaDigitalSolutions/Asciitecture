#!/usr/bin/env just --justfile

# Asciitecture.io Development Commands
# Run 'just' to see all available commands

set shell := ["bash", "-c"]

# Default recipe to display help
default:
  @just --list

# Colors for output
export RED := '\033[0;31m'
export GREEN := '\033[0;32m'
export YELLOW := '\033[1;33m'
export BLUE := '\033[0;34m'
export PURPLE := '\033[0;35m'
export CYAN := '\033[0;36m'
export NC := '\033[0m' # No Color

# === QUICK START ===

# Interactive setup for first-time users
quickstart:
  @echo -e "${GREEN}🎯 Asciitecture.io Quick Start Setup${NC}"
  @echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
  @echo -e "\nThis will set up Asciitecture for development.\n"
  @just check-requirements
  @echo -e "\n${GREEN}✅ System requirements check passed!${NC}\n"
  @echo -e "${BLUE}📦 Installing dependencies...${NC}"
  @pnpm install
  @echo -e "\n${GREEN}🎉 Setup complete! Starting development server...${NC}\n"
  @just dev

# === PREREQUISITES ===

# Check if all requirements are installed
check-requirements:
  @echo -e "${BLUE}🔍 Checking system requirements...${NC}"
  @command -v node >/dev/null && echo -e "  ✅ Node.js: $(node -v)" || (echo -e "  ❌ Node.js: Not installed" && exit 1)
  @command -v pnpm >/dev/null && echo -e "  ✅ pnpm: $(pnpm -v)" || (echo -e "  ❌ pnpm: Not installed" && exit 1)
  @echo -e "${GREEN}✅ All requirements are met!${NC}"

# === DEVELOPMENT ===

# Start development server
dev:
  @echo -e "${GREEN}🚀 Starting Asciitecture Development Server...${NC}"
  @echo -e "${CYAN}📋 ASCII wireframe editor will open at http://localhost:3000${NC}"
  @pnpm dev

# Start development server with Bun runtime
dev-bun:
  @echo -e "${GREEN}🚀 Starting with Bun runtime...${NC}"
  @bun run dev

# === BUILD & PRODUCTION ===

# Build for production
build:
  @echo -e "${BLUE}🏗️  Building for production...${NC}"
  @pnpm build
  @echo -e "${GREEN}✅ Build complete! Output in ./dist${NC}"

# Build with Bun
build-bun:
  @echo -e "${BLUE}🏗️  Building with Bun...${NC}"
  @bun run build

# Preview production build
preview:
  @echo -e "${CYAN}👀 Previewing production build...${NC}"
  @pnpm preview

# === TESTING & VALIDATION ===

# Run linting
lint:
  @echo -e "${BLUE}🔍 Running linter...${NC}"
  @pnpm lint

# Run type checking
type-check:
  @echo -e "${BLUE}📝 Running type check...${NC}"
  @pnpm type-check

# Run tests
test:
  @echo -e "${BLUE}🧪 Running tests...${NC}"
  @pnpm test

# Run all validations
validate: lint type-check test
  @echo -e "${GREEN}✅ All validations passed!${NC}"

# === UTILITY COMMANDS ===

# Install dependencies
install:
  @echo -e "${BLUE}📦 Installing dependencies...${NC}"
  @pnpm install

# Install with Bun
install-bun:
  @echo -e "${BLUE}📦 Installing dependencies with Bun...${NC}"
  @bun install

# Clean build artifacts and dependencies
clean:
  @echo -e "${YELLOW}🧹 Cleaning project...${NC}"
  @rm -rf node_modules
  @rm -rf dist
  @rm -rf .vite
  @echo -e "${GREEN}✅ Clean complete!${NC}"

# Deep clean including lock files
clean-all: clean
  @echo -e "${RED}💣 Removing lock files...${NC}"
  @rm -f pnpm-lock.yaml
  @rm -f bun.lockb
  @echo -e "${GREEN}✅ Deep clean complete!${NC}"

# Update dependencies
update:
  @echo -e "${BLUE}⬆️  Updating dependencies...${NC}"
  @pnpm update

# Check for outdated dependencies
outdated:
  @echo -e "${BLUE}📊 Checking for outdated dependencies...${NC}"
  @pnpm outdated

# === DEVELOPMENT TOOLS ===

# Format code
format:
  @echo -e "${BLUE}✨ Formatting code...${NC}"
  @pnpm format

# Check code formatting
format-check:
  @echo -e "${BLUE}🔍 Checking code formatting...${NC}"
  @pnpm format:check

# Open browser
open:
  @echo -e "${CYAN}🌐 Opening Asciitecture in browser...${NC}"
  @command -v xdg-open >/dev/null && xdg-open http://localhost:3000 || open http://localhost:3000

# === DEPLOYMENT ===

# Deploy to GitHub Pages
deploy-gh-pages:
  @echo -e "${BLUE}🚀 Deploying to GitHub Pages...${NC}"
  @pnpm build
  @echo -e "${YELLOW}📦 Publishing to gh-pages branch...${NC}"
  @npx gh-pages -d dist
  @echo -e "${GREEN}✅ Deployed successfully!${NC}"

# Build for Vercel
build-vercel:
  @echo -e "${BLUE}🏗️  Building for Vercel...${NC}"
  @pnpm build

# Build for Netlify
build-netlify:
  @echo -e "${BLUE}🏗️  Building for Netlify...${NC}"
  @pnpm build

# === AI TOOLS ===

# Generate AI documentation
ai-docs:
  @echo -e "${BLUE}📝 Generating AI documentation...${NC}"
  @echo -e "${GREEN}✅ AI_GUIDE.md is up to date${NC}"

# Show AI template examples
ai-examples:
  @echo -e "${CYAN}🤖 AI Template Examples${NC}"
  @echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
  @echo -e "\n${GREEN}Button:${NC}"
  @echo "┌──────────┐"
  @echo "│  Submit  │"
  @echo "└──────────┘"
  @echo -e "\n${GREEN}Input Field:${NC}"
  @echo "┌─────────────────────┐"
  @echo "│ Enter text...       │"
  @echo "└─────────────────────┘"
  @echo -e "\n${GREEN}Card:${NC}"
  @echo "╔═══════════════════╗"
  @echo "║ Card Title        ║"
  @echo "╠═══════════════════╣"
  @echo "║ Content here      ║"
  @echo "╚═══════════════════╝"

# === GIT SHORTCUTS ===

# Check git status
gs:
  @git status

# Git add and commit
gc MESSAGE:
  @git add -A
  @git commit -m "{{MESSAGE}}"

# Git add, commit, and push
gcp MESSAGE:
  @git add -A
  @git commit -m "{{MESSAGE}}"
  @git push

# === SYSTEM INFO ===

# Check system and project status
status:
  @echo -e "${CYAN}📊 Asciitecture Status${NC}"
  @echo -e "\n${BLUE}Project Info:${NC}"
  @[ -f package.json ] && echo -e "  ✅ package.json: Found" || echo -e "  ❌ package.json: Missing"
  @[ -d node_modules ] && echo -e "  ✅ Dependencies: Installed" || echo -e "  ❌ Dependencies: Not installed"
  @[ -d dist ] && echo -e "  ✅ Build: Found" || echo -e "  ℹ️  Build: Not found (run 'just build')"
  @echo -e "\n${BLUE}Development Server:${NC}"
  @lsof -ti:3000 >/dev/null 2>&1 && echo -e "  🟢 Port 3000: In use (server running)" || echo -e "  ⚪ Port 3000: Available"

# Quick diagnostics
doctor:
  @echo -e "${CYAN}🩺 Running Asciitecture Doctor...${NC}"
  @echo -e "\n${BLUE}📋 System Requirements:${NC}"
  @command -v node >/dev/null && echo -e "  ✅ Node.js: $(node -v)" || echo -e "  ❌ Node.js: Not found"
  @command -v pnpm >/dev/null && echo -e "  ✅ pnpm: $(pnpm -v)" || echo -e "  ❌ pnpm: Not found"
  @command -v bun >/dev/null && echo -e "  ✅ Bun: $(bun -v)" || echo -e "  ℹ️  Bun: Not found (optional)"
  @echo -e "\n${BLUE}📁 Project Structure:${NC}"
  @[ -f package.json ] && echo -e "  ✅ package.json: Found" || echo -e "  ❌ package.json: Missing"
  @[ -f vite.config.js ] && echo -e "  ✅ vite.config.js: Found" || echo -e "  ❌ vite.config.js: Missing"
  @[ -f index.html ] && echo -e "  ✅ index.html: Found" || echo -e "  ❌ index.html: Missing"
  @[ -d src ] && echo -e "  ✅ src/: Found" || echo -e "  ❌ src/: Missing"
  @[ -d node_modules ] && echo -e "  ✅ node_modules/: Installed" || echo -e "  ❌ node_modules/: Not installed"
  @echo -e "\n${BLUE}🔧 Quick Fixes:${NC}"
  @[ ! -d node_modules ] && echo -e "  → Run: just install" || true
  @[ ! -f package.json ] && echo -e "  → Project not initialized properly" || true

# === HELP ===

# Show detailed help
help:
  @echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
  @echo -e "${GREEN}                          Asciitecture Development Commands                          ${NC}"
  @echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
  @echo -e "\n${BLUE}🚀 Quick Start:${NC}"
  @echo -e "  just              - Show available commands"
  @echo -e "  just quickstart   - First-time setup"
  @echo -e "  just dev          - Start development server"
  @echo -e "  just build        - Build for production"
  @echo -e "\n${BLUE}⚙️  Development:${NC}"
  @echo -e "  just install      - Install dependencies"
  @echo -e "  just dev          - Start dev server (port 3000)"
  @echo -e "  just dev-bun      - Start with Bun runtime"
  @echo -e "  just preview      - Preview production build"
  @echo -e "  just open         - Open in browser"
  @echo -e "\n${BLUE}🏗️  Build & Deploy:${NC}"
  @echo -e "  just build        - Build for production"
  @echo -e "  just deploy-gh-pages - Deploy to GitHub Pages"
  @echo -e "  just build-vercel - Build for Vercel"
  @echo -e "  just build-netlify- Build for Netlify"
  @echo -e "\n${BLUE}✅ Code Quality:${NC}"
  @echo -e "  just lint         - Run linter"
  @echo -e "  just type-check   - Check TypeScript types"
  @echo -e "  just test         - Run tests"
  @echo -e "  just validate     - Run all checks"
  @echo -e "  just format       - Format code"
  @echo -e "  just format-check - Check formatting"
  @echo -e "\n${BLUE}🔧 Maintenance:${NC}"
  @echo -e "  just clean        - Clean build artifacts"
  @echo -e "  just clean-all    - Deep clean (including lock files)"
  @echo -e "  just update       - Update dependencies"
  @echo -e "  just outdated     - Check outdated dependencies"
  @echo -e "\n${BLUE}🤖 AI Tools:${NC}"
  @echo -e "  just ai-docs      - Check AI documentation"
  @echo -e "  just ai-examples  - Show AI template examples"
  @echo -e "\n${BLUE}📊 Information:${NC}"
  @echo -e "  just status       - Check project status"
  @echo -e "  just doctor       - System diagnostics"
  @echo -e "  just help         - Show this help"
  @echo -e "\n${BLUE}📝 Git Shortcuts:${NC}"
  @echo -e "  just gs           - Git status"
  @echo -e "  just gc \"msg\"     - Git commit"
  @echo -e "  just gcp \"msg\"    - Git commit and push"
  @echo -e "\n${GREEN}💡 Tips:${NC}"
  @echo -e "  • Use 'just quickstart' for first-time setup"
  @echo -e "  • The app runs on http://localhost:3000"
  @echo -e "  • Export wireframes as Markdown for AI tools"
  @echo -e "  • Supports both pnpm and Bun package managers"