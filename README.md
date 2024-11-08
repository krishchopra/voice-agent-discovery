# Voice Agent Discovery System

An automated system for discovering and mapping AI voice agent conversation flows.

_(Take-home assignment for Hamming AI)_

## Prerequisites

-   Node.js
-   npm or yarn
-   A Deepgram API key
-   A Hamming AI API token

## Setup

1. Clone the repository:

```bash
git clone https://github.com/krishchopra/voice-agent-discovery.git
cd voice-agent-discovery
```

2. Install dependencies:

```bash
npm install
```

3. Install and set up ngrok:

*Install ngrok globally:*

```bash
npm install -g ngrok
```

*Start ngrok on port 3000:*

```bash
ngrok http 3000
```

Copy the HTTPS URL provided by ngrok (e.g., `https://xxxx-xx-xx-xxx-xx.ngrok-free.app/webhook`).

4. Create a `.env` file in the root directory with the following variables:

```env
API_TOKEN=your_hamming_api_token_here
WEBHOOK_PORT=3000
WEBHOOK_URL=your_webhook_url_here
DEEPGRAM_API_KEY=your_deepgram_api_key_here
API_BASE_URL=https://app.hamming.ai
TEST_PHONE_NUMBER=your_test_phone_number_here
```

Similarly, create a `.env.test` file with the same variables, but with test values.

## Running the Application

Start the application:

```bash
npm start
```

## Architecture

The system consists of several key components:

-   **WebhookServer**: Handles incoming call status updates
-   **CallService**: Manages voice agent API interactions
-   **TranscriptionService**: Processes audio recordings using Deepgram
-   **CallTree**: Tracks and manages the discovery process

## Development

To run in development mode with auto-reload:

```bash
npm run dev
```

## Testing

Run the test suite:

```bash
npm test
```
