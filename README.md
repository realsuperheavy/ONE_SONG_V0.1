# OneSong Project

## Overview

OneSong is a real-time collaborative music playlist application that allows attendees to request songs during live events.

## Features

- User authentication via Firebase Auth.
- Real-time event updates using Firestore listeners.
- Spotify API integration for song search and playback.
- Event management for DJs to create and manage events.
- Webhook support for event notifications.

## Setup Instructions

1. **Clone the repository**:
   ```bash
   git clone https://github.com/yourusername/onesong.git
   cd onesong
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Set up environment variables**:

   - Create a `.env.local` file in the root directory.
   - Add your Firebase and Spotify API credentials.

4. **Run the development server**:
   ```bash
   npm run dev
   ```

5. **Deploy to Firebase**:
   ```bash
   firebase deploy
   ```

## Code Structure

- `src/`: Main application source code.
  - `components/`: React components organized by feature.
  - `context/`: React context providers.
  - `hooks/`: Custom React hooks.
  - `lib/`: Library code including Firebase and Spotify services.
  - `types/`: TypeScript type definitions.
- `functions/`: Firebase Functions code.

## Contributing

Contributions are welcome! Please open an issue or submit a pull request.

## License

MIT License