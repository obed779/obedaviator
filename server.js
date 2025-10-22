
// server.js
import express from "express";
import http from "http";
import { Server } from "socket.io";
import path from "path";
import { fileURLToPath } from "url";
import cors from "cors";

// Required for __dirname in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*",
  },
});

app.use(cors());
app.use(express.json());

// ✅ Serve static files from /public
app.use(express.static(path.join(__dirname, "public")));

// ✅ Simple homepage message
app.get("/", (req, res) => {
  res.send("✅ Aviator Game API is live and running!");
});

// ✅ Serve dashboard.html when visiting /dashboard
app.get("/dashboard", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "dashboard.html"));
});

// =============================
// 🛠️ Simple game simulation logic
// =============================

let round = 0;
function startRound() {
  round++;
  const result = (Math.random() * 10).toFixed(2);
  const data = {
    round_id: "round_" + round,
    result: parseFloat(result),
    created_at: new Date().toISOString(),
  };
  io.emit("new_round", data);
  console.log(`🎯 Round ${round}: Crash point ${result}x`);

  // New round every 8 seconds
  setTimeout(startRound, 8000);
}

// ✅ WebSocket events
io.on("connection", (socket) => {
  console.log("🟢 New player connected");
  socket.on("disconnect", () => {
    console.log("🔴 Player disconnected");
  });
});
// Serve static files from the "public" folder
app.use(express.static(__dirname + '/public'));

// Root route
app.get("/", (req, res) => {
  res.send("✅ Aviator Game API is live and running!");
});

// Dashboard route
app.get("/dashboard", (req, res) => {
  res.sendFile(__dirname + "/public/dashboard.html");
});

server.listen(PORT, () => {
  console.log(`✅ Server listening on port ${PORT}`);
  setTimeout(startRound, 2000);
});

// ✅ Start server
const PORT = process.env.PORT || 10000;
server.listen(PORT, () => {
  console.log(`✅ Server listening on port ${PORT}`);
  setTimeout(startRound, 2000);
});
