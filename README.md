# Dobon Game

Dobon card game web application for team play.

## Project Setup

### Prerequisites

- Node.js 18 LTS or higher
- npm or yarn

### Installation

```bash
npm install
```

### Development

```bash
npm run dev
```

The application will be available at `http://localhost:5173`

### Build

```bash
npm run build
```

### Preview Production Build

```bash
npm run preview
```

### Run Tests

```bash
npm run test
```

## Tech Stack

- **Framework**: Vue.js 3
- **Language**: TypeScript (strict mode)
- **State Management**: Pinia
- **Styling**: Tailwind CSS
- **Build Tool**: Vite
- **Testing**: Vitest
- **Communication**: Axios (REST API), Socket.io (WebSocket)

## Project Structure

```
dobon-game/
├── src/
│   ├── assets/          # Static assets
│   ├── components/      # Vue components
│   ├── mocks/           # Mock API and WebSocket
│   ├── router/          # Vue Router configuration
│   ├── services/        # Communication services
│   ├── stores/          # Pinia stores
│   ├── types/           # TypeScript type definitions
│   ├── utils/           # Utility functions
│   ├── views/           # View components
│   ├── App.vue          # Root component
│   └── main.ts          # Application entry point
├── tests/               # Unit tests
├── docs/                # Documentation
├── aidlc-docs/          # AIDLC documentation (design artifacts)
└── ...config files
```

## Documentation

Detailed documentation will be available in the `docs/` directory after Step 16.

## License

Private project for team use only.
