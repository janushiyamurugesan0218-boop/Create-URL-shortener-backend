const express = require('express');
const app = express();
const PORT = 3000;

// Middleware to parse incoming JSON data
app.use(express.json());

// In-memory database to store URLs (Resets when the server restarts)
const urlDatabase = {};

// Helper function to generate a random 6-character string
function generateShortCode() {
    return Math.random().toString(36).substring(2, 8);
}

// 1. FRONTEND: Serve the HTML, CSS, and Frontend JavaScript directly
app.get('/', (req, res) => {
    res.send(`
        <!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Single-File URL Shortener</title>
            <style>
                body {
                    font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
                    background-color: #f4f7f6;
                    display: flex;
                    justify-content: center;
                    align-items: center;
                    height: 100vh;
                    margin: 0;
                }
                .container {
                    background-color: #ffffff;
                    padding: 30px;
                    border-radius: 12px;
                    box-shadow: 0 4px 15px rgba(0, 0, 0, 0.1);
                    text-align: center;
                    max-width: 450px;
                    width: 100%;
                }
                h1 { color: #333; margin-bottom: 20px; }
                input[type="url"] {
                    width: 85%;
                    padding: 12px;
                    border: 2px solid #ddd;
                    border-radius: 6px;
                    font-size: 16px;
                    outline: none;
                    transition: border-color 0.3s;
                }
                input[type="url"]:focus { border-color: #007bff; }
                button {
                    margin-top: 15px;
                    background-color: #007bff;
                    color: white;
                    border: none;
                    padding: 12px 25px;
                    font-size: 16px;
                    border-radius: 6px;
                    cursor: pointer;
                    width: 92%;
                    transition: background-color 0.3s;
                }
                button:hover { background-color: #0056b3; }
                .result-box {
                    margin-top: 25px;
                    padding: 15px;
                    background-color: #e9ecef;
                    border-radius: 6px;
                    display: none;
                    word-break: break-all;
                }
                .result-box a {
                    color: #28a745;
                    font-weight: bold;
                    text-decoration: none;
                }
                .result-box a:hover { text-decoration: underline; }
            </style>
        </head>
        <body>

            <div class="container">
                <h1>URL Shortener</h1>
                <input type="url" id="longUrl" placeholder="Paste your long URL here..." required>
                <button onclick="shortenUrl()">Shorten URL</button>

                <div class="result-box" id="resultBox">
                    <p>Your short URL:</p>
                    <a id="shortLink" href="#" target="_blank"></a>
                </div>
            </div>

            <script>
                async function shortenUrl() {
                    const longUrlInput = document.getElementById('longUrl').value;
                    const resultBox = document.getElementById('resultBox');
                    const shortLink = document.getElementById('shortLink');

                    if (!longUrlInput) {
                        alert("Please enter a valid URL.");
                        return;
                    }

                    try {
                        // Request sent directly back to the self-hosting server
                        const response = await fetch('/shorten', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ longUrl: longUrlInput })
                        });

                        const data = await response.json();

                        if (response.ok) {
                            shortLink.href = data.shortUrl;
                            shortLink.innerText = data.shortUrl;
                            resultBox.style.display = 'block';
                        } else {
                            alert(data.error || "Something went wrong.");
                        }
                    } catch (error) {
                        console.error("Error linking to backend:", error);
                        alert("Could not connect to the backend processing API.");
                    }
                }
            </script>
        </body>
        </html>
    `);
});

// 2. BACKEND API: Endpoint to create and save short link configurations
app.post('/shorten', (req, res) => {
    const { longUrl } = req.body;
    
    if (!longUrl) {
        return res.status(400).json({ error: 'URL string context is required' });
    }

    const shortCode = generateShortCode();
    urlDatabase[shortCode] = longUrl;

    // Dynamically tracks back to local server address rules
    res.json({ shortUrl: `http://localhost:${PORT}/${shortCode}` });
});

// 3. BACKEND REDIRECTION: Route handler mapping short paths to live targets
app.get('/:code', (req, res) => {
    const longUrl = urlDatabase[req.params.code];

    if (longUrl) {
        // Enforce safe global routing schemes protocols
        const redirectUrl = longUrl.startsWith('http') ? longUrl : `https://${longUrl}`;
        return res.redirect(redirectUrl);
    } else {
        return res.status(404).send('<h1>URL Not Found</h1>');
    }
});

// Initialize server pipeline routing configuration
app.listen(PORT, () => {
    console.log(`Application interface and backend live at: http://localhost:${PORT}`);
});