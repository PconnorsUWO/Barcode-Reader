# Camera App

A simple, lightweight web application that accesses the device camera, displays a live preview, and allows users to capture photos. Built with vanilla HTML, CSS, and JavaScript.

## Features

- Camera access using the MediaDevices API
- Live camera preview
- Capture still photos from the video stream
- Responsive design that works on mobile devices
- Compatible with Safari on iOS 13+

## Files

- `index.html` - The main HTML structure
- `styles.css` - Styling for the application
- `app.js` - JavaScript for camera access and photo capture

## Hosting Instructions

You can host this application on any static web server. Here are instructions for some common options:

### Option 1: GitHub Pages

1. Create a new repository on GitHub
2. Upload the files (index.html, styles.css, app.js) to the repository
3. Go to repository settings > Pages
4. Select the branch you want to deploy from (usually main)
5. Click Save, and your site will be available at `https://[username].github.io/[repository-name]/`

### Option 2: Netlify

1. Sign up for a free account at [Netlify](https://www.netlify.com/)
2. Drag and drop the folder containing your files onto the Netlify dashboard
3. Your site will be deployed instantly with a unique URL

### Option 3: Local Testing

1. Navigate to the folder containing these files in your terminal/command prompt
2. Start a simple HTTP server:
   - Python 3: `python -m http.server 8000`
   - Python 2: `python -m SimpleHTTPServer 8000`
   - Node.js: Install `http-server` with `npm install -g http-server` then run `http-server`
3. Open your browser and navigate to `http://localhost:8000`

## Important Notes for iOS

- iOS requires HTTPS for camera access when deployed to the web (except for localhost)
- On iOS, the user must interact with the page before camera access is permitted
- Camera access requires user permission via a browser prompt

## Browser Compatibility

- Safari on iOS 13+
- Chrome on Android 
- Modern desktop browsers (Chrome, Firefox, Safari, Edge)

## License

This project is available under the MIT License. Feel free to use, modify, and distribute as needed.