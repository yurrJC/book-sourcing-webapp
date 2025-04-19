# React + TypeScript + Vite

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Babel](https://babeljs.io/) for Fast Refresh
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/) for Fast Refresh

## Expanding the ESLint configuration

If you are developing a production application, we recommend updating the configuration to enable type-aware lint rules:

```js
export default tseslint.config({
  extends: [
    // Remove ...tseslint.configs.recommended and replace with this
    ...tseslint.configs.recommendedTypeChecked,
    // Alternatively, use this for stricter rules
    ...tseslint.configs.strictTypeChecked,
    // Optionally, add this for stylistic rules
    ...tseslint.configs.stylisticTypeChecked,
  ],
  languageOptions: {
    // other options...
    parserOptions: {
      project: ['./tsconfig.node.json', './tsconfig.app.json'],
      tsconfigRootDir: import.meta.dirname,
    },
  },
})
```

You can also install [eslint-plugin-react-x](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-x) and [eslint-plugin-react-dom](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-dom) for React-specific lint rules:

```js
// eslint.config.js
import reactX from 'eslint-plugin-react-x'
import reactDom from 'eslint-plugin-react-dom'

export default tseslint.config({
  plugins: {
    // Add the react-x and react-dom plugins
    'react-x': reactX,
    'react-dom': reactDom,
  },
  rules: {
    // other rules...
    // Enable its recommended typescript rules
    ...reactX.configs['recommended-typescript'].rules,
    ...reactDom.configs.recommended.rules,
  },
})
```

# Book Sourcing Web App

A progressive web app for book sourcing and analysis to help with book reselling decisions.

## Features

- ISBN lookup for book details
- eBay pricing and sales data analysis
- Terapeak historical sales integration
- Amazon Best Seller Rank evaluation
- Instant price checking with auto-reject for low-value books
- Progressive Web App (PWA) for mobile use

## Development Setup

1. Clone the repository
2. Install dependencies:
   ```
   npm install
   cd server
   npm install
   cd ..
   ```
3. Create `.env` file in the server directory with your API keys:
   ```
   ISBNDB_API_KEY=your_key_here
   EBAY_APP_ID=your_key_here
   EBAY_CERT_ID=your_key_here
   EBAY_DEV_ID=your_key_here
   EBAY_REDIRECT_URI=your_uri_here
   EBAY_MARKETPLACE_ID=EBAY_AU
   ```
4. Start the backend server:
   ```
   cd server
   npm run dev
   ```
5. In another terminal, start the frontend:
   ```
   npm run dev
   ```

## Deployment on Render

This app is configured for deployment on Render using the provided `render.yaml` blueprint.

### Prerequisites

1. Create a Render account at https://render.com
2. Push your code to a Git repository (GitHub, GitLab, etc.)

### Deployment Steps

1. In your Render dashboard, click on "Blueprints" in the sidebar
2. Click "New Blueprint Instance"
3. Connect your Git repository
4. Render will detect the `render.yaml` file and create both services:
   - Frontend static site (book-sourcing-frontend)
   - Backend API service (book-sourcing-api)
5. Before deploying, you'll need to add your API keys as environment variables for the backend service
6. Once configuration is complete, click "Create Resources" to deploy both services

### Environment Variables

Make sure to set these environment variables for the backend service in Render:

- `ISBNDB_API_KEY`: Your ISBN database API key
- `EBAY_APP_ID`: Your eBay App ID
- `EBAY_CERT_ID`: Your eBay Cert ID
- `EBAY_DEV_ID`: Your eBay Dev ID
- `EBAY_REDIRECT_URI`: Your eBay redirect URI
- `EBAY_MARKETPLACE_ID`: EBAY_AU (for Australia)
- `NODE_ENV`: production

## Accessing the App

After deployment, you can access the app at:
- Frontend: https://book-sourcing-frontend.onrender.com
- Backend API: https://book-sourcing-api.onrender.com

## Manual Deployment (Alternative)

If you prefer to deploy the services manually instead of using the blueprint:

1. Create a new Web Service for the backend:
   - Use your Git repository
   - Set the build command: `cd server && npm install && npm run build`
   - Set the start command: `cd server && npm start`
   - Add the environment variables listed above

2. Create a new Static Site for the frontend:
   - Use your Git repository
   - Set the build command: `npm install && npm run build`
   - Set the publish directory: `dist`

3. In the Static Site settings, add these redirect/rewrite rules:
   - Redirect `/api/*` to `https://your-backend-service.onrender.com/api/:splat`
   - Rewrite `/*` to `/index.html`
