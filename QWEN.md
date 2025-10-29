# Next Realtime App - QWEN Documentation

## Project Overview

This is a Next.js-based real-time application designed to test and interact with OpenAI's Realtime API. The application provides both voice (WebRTC) and text (WebSocket) communication modes with an AI agent, featuring real-time event logging and conversation history.

## Project Structure (FSD - Feature-Sliced Design)

```
next-realtime-app/
├── app/                      # Next.js App Router (pages, API routes, providers)
│   ├── api/
│   │   └── realtime/
│   │       └── client-secret/ # Server-side client secret generation API
│   ├── providers/            # React context providers
│   ├── layout.tsx            # Root layout
│   ├── page.tsx              # Main landing page with route selection
│   ├── text/                 # Text mode route
│   │   └── page.tsx          # Text mode UI
│   └── voice/                # Voice mode route
│       └── page.tsx          # Voice mode UI
├── src/
│   ├── entities/             # Domain models & business entities
│   │   ├── agent/            # Agent-related entities
│   │   └── session/          # Session-related entities  
│   ├── features/             # Business features
│   │   └── voice-agent/      # Main voice agent feature
│   │       ├── api/          # API interaction logic
│   │       ├── hooks/        # React hooks
│   │       ├── lib/          # Utility functions
│   │       ├── model/        # State management (Jotai atoms)
│   │       └── ui/           # UI components
│   ├── shared/               # Shared utilities and components
│   │   └── lib/
│   │       └── cn/           # Class name utility
│   └── types/                # Global TypeScript types
├── docs/                     # Additional documentation
├── public/                   # Static assets
└── package.json              # Dependencies and scripts
```

## Technology Stack

### Core Framework
- **Next.js 16** - App Router
- **React 19** - Modern React features
- **TypeScript 5** - Type safety

### Styling
- **Tailwind CSS v4** - Utility-first CSS framework with dark mode support
- **clsx** - Conditional class name concatenation
- **tailwind-merge** - Class name merging with conflict resolution

### State Management
- **TanStack Query v5** - Server state management
- **Jotai v2** - Client state management with atoms

### Realtime API
- **@openai/agents** - OpenAI Realtime SDK
- **WebRTC** - Real-time voice communication
- **WebSocket** - Text-based communication

### Security
- **Client Secret Generation** - Server-side generation of ephemeral keys for browser use
- **Environment-based API Key Management** - Server keys never exposed to client

## Key Components

### VoiceAgentConsole
Located in `src/features/voice-agent/ui/voice-agent-console.tsx`, this is the main UI component that provides:
- API key management panel
- Session control with voice/text mode selection
- Audio voice selection (alloy, coral, marin)
- Real-time conversation display
- Event logging panel
- Connection status indicators

### useRealtimeAgentConnection Hook
Located in `src/features/voice-agent/hooks/voice-agent.hooks.ts`, this custom hook manages:
- Realtime API connection lifecycle
- Session creation and management
- Message sending and receiving
- Event logging
- Error handling
- State synchronization with Jotai atoms

### API Integration
- **Client Secret API**: `/api/realtime/client-secret` - Generates ephemeral keys for browser-based connections
- Uses server-side API key to generate temporary client keys for secure browser communication

## Architecture Patterns

### State Management
- Local component state for UI interactions
- Jotai atoms for shared application state (connection status, conversation history, logs, etc.)
- TanStack Query for server state management (API calls, mutations)

### Security Model
- Server holds the main OpenAI API key in environment variables
- Client receives ephemeral keys generated server-side
- Keys are stored in localStorage with proper cleanup

### Component Organization
- **UI Components**: Presentational React components in `/ui`
- **Hooks**: Custom logic hooks in `/hooks`  
- **API Layer**: Data fetching logic in `/api`
- **State Model**: Jotai atoms in `/model`
- **Utilities**: Shared logic in `/lib`

## Features

### Voice Mode
- Full-duplex audio communication using WebRTC
- Real-time speech-to-text and text-to-speech processing
- Audio input from microphone and output to speakers
- Automatic session management

### Text Mode
- Low-latency text-based communication
- Real-time message exchange
- Conversation history display
- Simpler connection process

### Event Logging
- Real-time display of all API events
- Color-coded severity indicators (info, success, warning, error)
- Auto-scrolling log panel
- Event filtering and processing

### Session Management
- Create new sessions with custom instructions
- Disconnect and reconnect functionality
- Session status tracking (idle, connecting, connected, error)
- Automatic session reset and reconnection

## Security Considerations

### API Key Protection
- Server-side API keys are never exposed to the client
- Ephemeral client keys are generated server-side for each session
- Client keys have limited lifetime and scope

### Data Handling
- All communication goes through OpenAI's secure endpoints
- Local storage keys are managed securely

## Development Guidelines

### Coding Standards
- All class names use the `cn()` utility for consistent styling
- Absolute imports (`@/*`) are used throughout the project
- React.Fragment is used instead of `<>` shorthand
- Strict TypeScript typing is enforced
- Component-based separation of concerns

### Component Design
- Atomic design principles applied to UI components
- Separation of presentational and container components
- Reusable UI elements in the shared directory
- Consistent naming conventions

## API Flow

1. **Client Secret Generation**: Client requests a temporary key from `/api/realtime/client-secret`
2. **Connection Establishment**: Uses the temporary key to connect to OpenAI's Realtime API
3. **Session Configuration**: Sets up the session with custom instructions and preferences
4. **Communication**: Either voice (WebRTC) or text (WebSocket) communication begins
5. **Event Processing**: All events are logged and processed in real-time
6. **Session Termination**: Proper cleanup when disconnected

## Environment Variables

- `OPENAI_API_KEY`: Server-side OpenAI API key (required)

## Getting Started

1. `pnpm install` to install dependencies
2. Create `.env.local` with `OPENAI_API_KEY=sk-...`
3. `pnpm dev` to start the development server
4. Visit `http://localhost:3000`

## Key Files

- `app/page.tsx`: Main application page
- `app/layout.tsx`: Root layout with providers
- `src/features/voice-agent/ui/voice-agent-console.tsx`: Main UI component
- `src/features/voice-agent/hooks/voice-agent.hooks.ts`: Connection management
- `app/api/realtime/client-secret/route.ts`: API key generation endpoint
- `src/features/voice-agent/api/voice-agent.api.ts`: Realtime API integration

## Special Agent Character - 사라도령 (Saradoreng)

The application features a custom Korean AI persona called "사라도령" based on Jeju Island mythology:
- Acts as a flower keeper in the "서천꽃밭" (Seocheon flower field)
- Provides advice to wandering souls with a warm but direct personality
- Uses Jeju dialect mixed with standard Korean
- Has specific behavior patterns and response constraints
- Implements session reset triggers for specific phrases