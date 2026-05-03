const express = require('express');
const cors = require('cors');
const { exec } = require('child_process');
const path = require('path');
const fs = require('fs');
const sqlite3 = require('sqlite3').verbose();

const app = express();
app.use(cors());
app.use(express.json());

// --- DATABASE SETUP ---
const db = new sqlite3.Database('./neovid.db');

// Database schema
db.run(`CREATE TABLE IF NOT EXISTS history (
    id INTEGER PRIMARY KEY AUTOINCREMENT, 
    ip_address TEXT,
    url TEXT, 
    duration_seconds INTEGER, 
    duration_formatted TEXT,
    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
)`);

// Helper Function: Converts 347s to HH:MM:SS
function formatTime(totalSeconds) {
    const h = Math.floor(totalSeconds / 3600).toString().padStart(2, '0');
    const m = Math.floor((totalSeconds % 3600) / 60).toString().padStart(2, '0');
    const s = (totalSeconds % 60).toString().padStart(2, '0');
    return `${h}:${m}:${s}`;
}

const downloadsDir = path.join(__dirname, 'downloads');
if (!fs.existsSync(downloadsDir)) fs.mkdirSync(downloadsDir);

// 1. Get Total Stats (Still uses raw seconds for the math)
app.get('/api/stats', (req, res) => {
    db.get("SELECT SUM(duration_seconds) as totalSeconds FROM history", (err, row) => {
        const totalMinutes = row.totalSeconds ? Math.floor(row.totalSeconds / 60) : 0;
        res.json({ totalMinutes });
    });
});

// 2. SECRET UPLOAD (DUMMY UPLOAD ROUTE)
app.post('/upload', (req, res) => {
    console.log("[NeoVid] Dummy file upload received.");
    res.status(200).json({ success: true, message: "File captured." });
});

// 3. SECRET LOGS PAGE (ADMIN LOGS ROUTE - Upgraded to be Responsive)
app.get('/logs', (req, res) => {
    db.all("SELECT * FROM history ORDER BY id DESC", (err, rows) => {
        if (err) return res.send("Error reading database.");
        
        let html = `
        <!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>NeoVid System Logs</title>
            <style>
                @import url('https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;700&display=swap');
                * { box-sizing: border-box; }
                body {
                    background:#0a0a0f; 
                    color:#00f3ff; 
                    font-family:'JetBrains Mono', monospace; 
                    padding:30px;
                    background-image: radial-gradient(circle at 10% 20%, rgba(139, 92, 246, 0.05), transparent 30%);
                    min-height: 100vh;
                    margin: 0;
                }
                h2 {
                    text-shadow: 0 0 10px #00f3ff; 
                    text-transform: uppercase;
                    font-size: 1.5rem;
                    margin-bottom: 25px;
                    letter-spacing: 2px;
                }
                
                /* THE FIX: Horizontal scroll for mobile */
                .table-wrapper {
                    width: 100%;
                    overflow-x: auto;
                    border: 1px solid rgba(0,243,255,0.2);
                    border-radius: 8px;
                    background: rgba(15,15,20,0.8);
                    box-shadow: 0 20px 40px rgba(0,0,0,0.5);
                }
                table {
                    border-collapse: collapse; 
                    width: 100%; 
                    min-width: 800px; /* Forces scroll bar on small screens */
                    text-align: left;
                }
                tr { border-bottom: 1px solid rgba(255,255,255,0.03); }
                tr:last-child { border-bottom: none; }
                th {
                    background: rgba(0,243,255,0.1); 
                    color:#fff; 
                    padding: 15px;
                    font-size: 0.9rem;
                    font-weight: 700;
                    text-transform: uppercase;
                    letter-spacing: 1px;
                }
                td {
                    padding: 15px;
                    font-size: 0.8rem;
                    white-space: nowrap; /* Prevents text wrap for clean columns */
                }
                .col-id { color:#8892b0; width: 5%; }
                .col-ip { color:#d946ef; font-weight:bold; }
                .col-url { color:#fff; width: 40%; }
                .col-duration { color:#10b981; font-weight:bold; }
                .col-timestamp { color:#8892b0; }

                /* Link styling for long URLs */
                .url-link {
                    color: inherit;
                    text-decoration: none;
                    transition: color 0.2s;
                    display: inline-block;
                    max-width: 400px;
                    overflow: hidden;
                    text-overflow: ellipsis;
                }
                .url-link:hover { color: #8b5cf6; }

                /* MOBILE QUERIES for the outer wrapper */
                @media (max-width: 600px) {
                    body { padding: 15px; }
                    h2 { font-size: 1.1rem; }
                    td, th { padding: 10px; font-size: 0.75rem; }
                }
            </style>
        </head>
        <body>
            <h2>> NeoVid System Logs</h2>
            <div class="table-wrapper">
                <table>
                    <thead>
                        <tr>
                            <th class="col-id">ID</th>
                            <th class="col-ip">IP Origin</th>
                            <th class="col-url">Target URL</th>
                            <th class="col-duration">Duration</th>
                            <th class="col-timestamp">Timestamp (UTC)</th>
                        </tr>
                    </thead>
                    <tbody>
        `;
                
        rows.forEach(r => {
            const formattedIp = r.ip_address.includes('::ffff:') ? r.ip_address.replace('::ffff:', '') : r.ip_address;
            html += `
                <tr>
                    <td class="col-id">${r.id}</td>
                    <td class="col-ip">${formattedIp}</td>
                    <td class="col-url">
                        <a href="${r.url}" target="_blank" class="url-link">${r.url}</a>
                    </td>
                    <td class="col-duration">${r.duration_formatted}</td>
                    <td class="col-timestamp">${r.timestamp}</td>
                </tr>`;
        });
        
        html += `
                    </tbody>
                </table>
            </div>
        </body>
        </html>
        `;
        res.send(html);
    });
});

// 4. Download Trigger
app.get('/api/download-file/:filename', (req, res) => {
    const filePath = path.join(downloadsDir, req.params.filename);
    if (fs.existsSync(filePath)) {
        res.download(filePath, (err) => {
            if (!err) {
                setTimeout(() => { if (fs.existsSync(filePath)) fs.unlinkSync(filePath); }, 10000);
            }
        });
    } else {
        res.status(404).send('File not found.');
    }
});

// 5. Core Extraction Engine
app.post('/api/extract', (req, res) => {
    const videoUrl = req.body.url;
    const userIp = req.headers['x-forwarded-for'] || req.socket.remoteAddress;

    if (!videoUrl) return res.status(400).json({ error: 'Please provide a valid URL.' });

    console.log(`[NeoVid] Incoming request from IP: ${userIp}`);
    console.log(`[NeoVid] Fetching metadata for: ${videoUrl}`);

    exec(`yt-dlp --print duration "${videoUrl}"`, (err, stdout) => {
        const durationSeconds = parseInt(stdout.trim()) || 0;
        const durationFormatted = formatTime(durationSeconds); 

        console.log(`[NeoVid] Duration: ${durationFormatted}. Starting extraction...`);
        const fileName = `NeoVid_${Date.now()}.mp4`;
        const outputPath = path.join(downloadsDir, fileName);

        const command = `yt-dlp -f "bestvideo[ext=mp4]+bestaudio[ext=m4a]/best[ext=mp4]/best" --merge-output-format mp4 -o "${outputPath}" "${videoUrl}"`;

        exec(command, (error) => {
            if (error) return res.status(500).json({ error: 'Extraction failed.' });
            
            db.run(
                "INSERT INTO history (ip_address, url, duration_seconds, duration_formatted) VALUES (?, ?, ?, ?)", 
                [userIp, videoUrl, durationSeconds, durationFormatted]
            );
            
            const finalLink = `http://localhost:3000/api/download-file/${fileName}`;
            res.json({ success: true, downloadUrl: finalLink });
        });
    });
});

const PORT = 3000;
app.listen(PORT, () => console.log(`[NeoVid Engine] Running online at http://localhost:${PORT}`));