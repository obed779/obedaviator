
import express from "express";
import http from "http";
import { Server } from "socket.io";
import path from "path";
import { fileURLToPath } from "url";
import cors from "cors";

// Setup for ES modules (__dirname)
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: "*", methods: ["GET", "POST"] },
});

app.use(cors());
app.use(express.json());

// ✅ Serve static files
app.use(express.static(path.join(__dirname, "public")));

// ✅ Homepage route
app.get("/", (req, res) => {
  res.send("✅ FlyWithObed Aviator API is live and running!");
});

// ✅ Serve dashboard
app.get("/dashboard", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "dashboard.html"));
});

// ==============================
// ✈️ Live Aviator Simulation
// ==============================
let round = 0;
let isFlying = false;
let balances = {
  playerA: 5000,
  playerB: 5000,
};

function startRound() {
  if (isFlying) return;
  isFlying = true;
  round++;
  let multiplier = 1.00;
  const targetCrash = (Math.random() * 6 + 1).toFixed(2);

  console.log(`✈️ Round ${round} started | Crash target: ${targetCrash}x`);

  const flight = setInterval(() => {
    multiplier += 0.1;
    io.emit("flight_update", { round, multiplier: multiplier.toFixed(2) });

    if (multiplier >= targetCrash) {
      clearInterval(flight);
      io.emit("crash", { round, crashPoint: targetCrash });
      console.log(`💥 Round ${round} crashed at ${targetCrash}x`);
      isFlying = false;
      setTimeout(startRound, 5000);
    }
  }, 200);
}

// ✅ WebSocket connections
io.on("connection", (socket) => {
  console.log("✅ New dashboard connected");
  socket.emit("aviator_status", { status: "connected", balances });

  socket.on("place_bet", ({ player, amount }) => {
    if (balances[player] >= amount) {
      balances[player] -= amount;
      io.emit("balance_update", balances);
      console.log(`🎲 ${player} placed bet of ${amount}`);
    } else {
      socket.emit("bet_failed", { message: "Insufficient balance" });
    }
  });

  socket.on("cashout", ({ player, multiplier }) => {
    const winAmount = Math.round(100 * multiplier);
    balances[player] += winAmount;
    io.emit("balance_update", balances);
    console.log(`💰 ${player} cashed out ${winAmount} at ${multiplier}x`);
  });

  socket.on("disconnect", () => console.log("❌ Dashboard disconnected"));
});

// ✅ Start server
const PORT = process.env.PORT || 10000;
server.listen(PORT, () => {
  console.log(`✅ Server running on port ${PORT}`);
  setTimeout(startRound, 2000);
});
