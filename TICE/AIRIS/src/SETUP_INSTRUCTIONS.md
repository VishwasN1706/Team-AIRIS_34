# CyberGuard IP Lookup - Local Setup Instructions

This guide will help you set up and run the CyberGuard IP Lookup application locally.

## Prerequisites

- Node.js (v18 or higher)
- npm or yarn package manager

## Setup Steps

### 1. Create a new React + TypeScript project with Vite

```bash
npm create vite@latest cyberguard-app -- --template react-ts
cd cyberguard-app
```

### 2. Install dependencies

```bash
npm install
```

### 3. Install required packages

```bash
npm install react-router-dom lucide-react motion clsx tailwind-merge class-variance-authority
npm install @radix-ui/react-slot
```

### 4. Install Tailwind CSS

```bash
npm install -D tailwindcss postcss autoprefixer
npx tailwindcss init -p
```

### 5. Replace/Create the following files:

Copy the content from each file section below into your project:

#### `tailwind.config.js`
```js
/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {},
  },
  plugins: [],
}
```

#### `src/index.css`
Copy the contents from the `styles/globals.css` file (provided below)

#### `src/main.tsx`
```tsx
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
```

#### Project Structure
```
src/
├── App.tsx
├── main.tsx
├── index.css
├── components/
│   ├── Landing.tsx
│   ├── IPDetails.tsx
│   └── ui/
│       ├── button.tsx
│       ├── input.tsx
│       ├── card.tsx
│       └── utils.ts
```

### 6. Run the application

```bash
npm run dev
```

The application will be available at `http://localhost:5173`

## Features

- **Landing Page**: Enter an IP address to analyze
- **IP Details Page**: Chat-based interface showing IP information
- **Quick Actions**: Predefined prompts for visualization and risk assessment
- **Real-time IP Lookup**: Uses ip-api.com for IP geolocation data

## Notes

- The application uses a free IP geolocation API (ip-api.com)
- Rate limits may apply to the free API
- For production use, consider upgrading to a paid API service

## Troubleshooting

If you encounter any issues:

1. Make sure all dependencies are installed correctly
2. Clear node_modules and reinstall: `rm -rf node_modules package-lock.json && npm install`
3. Verify Node.js version: `node --version` (should be v18+)
4. Check that all file paths match the project structure above
