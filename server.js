
// server.js
import express from "express";
import http from "http";
import { Server } from "socket.io";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: "*", methods: ["GET", "POST"] },
});

// ---- Serve dashboard files ----
app.use(express.static(path.join(__dirname, "dashboard")));

app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "dashboard", "index.html"));
});

// ---- Simple Aviator simulation ----
let inProgress = false;
let multiplier = 1.0;
let round = 1;

function startRound() {
  if (inProgress) return;
  inProgress = true;
  multiplier = 1.0;

  const target = (Math.random() * 5 + 1).toFixed(2); // random crash 1–6x
  io.emit("round_start", { round, target });
  console.log(`✈️ Round ${round} started — crash at ${target}x`);

  const interval = setInterval(() => {
    multiplier += 0.02;
    io.emit("multiplier_update", { multiplier: multiplier.toFixed(2) });

    if (multiplier >= target) {
      clearInterval(interval);
      io.emit("round_crash", { round, crashPoint: target });
      console.log(`💥 Round ${round} crashed at ${target}x`);
      inProgress = false;
      round++;
      setTimeout(startRound, 4000);
    }
  }, 100);
}

io.on("connection", (socket) => {
  console.log("👨‍✈️ Player connected");
  socket.emit("connected", { message: "Welcome to FlyWithObed Live Aviator" });

  socket.on("disconnect", () => console.log("❌ Player disconnected"));
});

startRound();

// ---- Start server ----
const PORT = process.env.PORT || 10000;
server.listen(PORT, () => {
  console.log(`✅ Server running on port ${PORT}`);
});

