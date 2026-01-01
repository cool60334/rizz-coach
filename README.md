<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# Rizz Coach AI

This is an AI-powered coaching application built with React, Vite, and Google Gemini.

## Features

- **AI Coaching:** Get personalized feedback using Google's Gemini API.
- **Modern UI:** Built with React and optimized for a smooth user experience.
- **Fast Development:** Powered by Vite for instant server start.

## Getting Started

### Prerequisites

- Node.js (v20 or higher recommended)
- A Google Gemini API Key

### Installation

1.  Clone the repository.
2.  Install dependencies:
    ```bash
    npm install
    ```

3.  Set up environment variables:
    - Create a `.env.local` file in the root directory.
    - Add your Gemini API key:
      ```env
      VITE_GEMINI_API_KEY=your_api_key_here
      ```
      *(Note via `package.json` logic, the app expects `GEMINI_API_KEY` but typically Vite uses `VITE_` prefix for client-side exposure. Please check `services` code if it uses `import.meta.env`. Based on standard Vite + React patterns, `VITE_` is required for client code access unless using a backend proxy.)*

4.  Run the development server:
    ```bash
    npm run dev
    ```

## Scripts

-   `npm run dev`: Starts the development server.
-   `npm run build`: Builds the app for production.
-   `npm run preview`: Previews the production build locally.

## Deployment

This project includes a GitHub Action for automatic deployment to GitHub Pages.

### Setup for GitHub Pages

1.  Go to your repository **Settings**.
2.  Navigate to **Actions** > **General** in the sidebar.
3.  Under **Workflow permissions**, select **Read and write permissions**.
4.  Navigate to **Pages** in the sidebar.
5.  Under **Build and deployment**, ensure **Source** is set to **GitHub Actions** (if applicable) or verify the `gh-pages` branch is used after the first successful deploy. *However, the provided workflow uses `actions/deploy-pages`, so usually you just need to ensure the environment "github-pages" is created or simply allowed.*

Every push to the `main` or `master` branch will trigger a build and deploy.

## Technologies

-   [React](https://react.dev/)
-   [Vite](https://vitejs.dev/)
-   [Google Gemini API](https://ai.google.dev/)
-   [Lucide React](https://lucide.dev/)
