# Iffort Frontend

This is the frontend for the Iffort AI-powered phone call automation service.

## Features

- Landing page with phone number input for initiating calls
- Dashboard for viewing call logs and playing recordings
- Modern UI with responsive design
- Integration with backend API

## Prerequisites

- Node.js (v14 or higher)
- npm (v6 or higher)

## Installation

1. Clone the repository
2. Navigate to the frontend directory:
   ```
   cd frontend
   ```
3. Install dependencies:
   ```
   npm install
   ```

## Configuration

Create a `.env` file in the frontend directory with the following content:

```
REACT_APP_API_URL=http://localhost:8000
```

Replace the URL with your backend API URL if it's different.

## Running the Application

Start the development server:

```
npm start
```

The application will be available at http://localhost:3000.

## Building for Production

To build the application for production:

```
npm run build
```

The build files will be in the `build` directory.

## Project Structure

- `src/` - Source code
  - `components/` - Reusable UI components
  - `pages/` - Page components
  - `services/` - API services
  - `App.js` - Main application component
  - `index.js` - Application entry point
- `public/` - Static files
  - `index.html` - HTML template
  - `manifest.json` - Web app manifest
  - `favicon.ico` - Favicon
- `tailwind.config.js` - Tailwind CSS configuration
- `package.json` - Project dependencies and scripts 