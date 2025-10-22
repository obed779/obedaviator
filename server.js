const path = require("path");

const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const path = require('path');
const cors = require('cors');
const fs = require('fs');
const Database = require('better-sqlite3');

const PORT = process.env.PORT || 3000;
const DB_PATH = process.env.DB_PATH || './data/aviator.db';

// ✅ Ensure data directory exists
const dataDir = path.dirname(DB_PATH);
if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });

// ✅ Initialize SQLite database
const db = new Database(DB_PATH);
db.prepare(`
  CREATE TABLE IF NOT EXISTS history (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    round_id TEXT,
    result REAL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )
`).run();

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: '*' }
});

app.use(cors());
app.use(express.json());app.use(express.static(path.join(__dirname, "public")));

app.use(express.static(path.join(__dirname, 'public')));

// ✅ API: Get last 50 crash results
app.get('/api/history', (req, res) => {
  const rows = db.prepare('SELECT * FROM history ORDER BY created_at DESC LIMIT 50').all();
  res.json(rows);
});

// ✅ Save round results to DB
function saveResult(roundId, result) {
  const stmt = db.prepare('INSERT INTO history (round_id, result) VALUES (?, ?)');
  stmt.run(roundId, result);
}

// ✅ Aviator Game Simulation Logic
let currentRound = null;
let roundInterval = null;

function startRound() {
  // Random crash multiplier (biased toward lower values)
  const crash = Math.max(1.00, (Math.random() * Math.random() * 10).toFixed(2));
  const roundId = Date.now().toString(36) + Math.floor(Math.random() * 1000).toString(36);
  currentRound = { id: roundId, crash: parseFloat(crash), timeStart: Date.now() };

  io.emit('round:start', { roundId });

  // Simulate multiplier increase
  let multiplier = 1.00;
  const tickMs = 100;
  const growthRate = 0.005 + Math.random() * 0.02;

  roundInterval = setInterval(() => {
    multiplier = parseFloat((multiplier + multiplier * growthRate).toFixed(2));
    io.emit('round:tick', { roundId, multiplier });

    if (multiplier >= currentRound.crash) {
      io.emit('round:crash', { roundId, crash: currentRound.crash });
      saveResult(roundId, currentRound.crash);

      clearInterval(roundInterval);
      currentRound = null;

      // Start next round after 3–6 seconds
      setTimeout(startRound, 3000 + Math.random() * 3000);
    }
  }, tickMs);
}

// ✅ Socket.io events
io.on('connection', (socket) => {
  console.log('Client connected:', socket.id);

  // Send recent history to new clients
  const rows = db.prepare('SELECT * FROM history ORDER BY created_at DESC LIMIT 20').all();
  socket.emit('history', rows);

  socket.on('place:bet', (data) => {
    console.log('Bet received:', data);
    socket.emit('bet:ack', { ok: true, id: data.id || null });
  });
});
// Serve a simple homepage
app.get("/", (req, res) => {app.get("/dashboard", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "dashboard.html"));
});

  res.send("✅ Aviator Game API is live and running!");
});
// Serve the dashboard HTML file
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

app.use(express.static(path.join(__dirname, "public")));

app.get("/dashboard", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "dashboard.html"));
});

// ✅ Start server and begin rounds
server.listen(PORT, () => {
  console.log(`✅ Server listening on port ${PORT}`);
  setTimeout(startRound, 2000);
});
