
import express from "express";
import http from "http";
import { Server } from "socket.io";
import path from "path";
import { fileURLToPath } from "url";
import cors from "cors";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: "*", methods: ["GET", "POST"] },
});

app.use(cors());
app.use(express.json());

// ✅ Serve static dashboard files
app.use(express.static(path.join(__dirname, "public")));

app.get("/", (req, res) => {
  res.send("✅ FlyWithObed Aviator API is live!");
});

app.get("/dashboard", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "dashboard.html"));
});

// ======================
// ✈️ Aviator Game Engine
// ======================
let round = 0;
let isFlying = false;
let balances = { playerA: 5000, playerB: 5000 };

function startRound() {
  if (isFlying) return;
  isFlying = true;
  round++;

  let multiplier = 1.0;
  const crashPoint = (Math.random() * 6 + 1).toFixed(2);
  console.log(`✈️ Round ${round} started — crash at ${crashPoint}x`);

  const flightInterval = setInterval(() => {
    multiplier += 0.05;
    io.emit("flight_update", { round, multiplier: multiplier.toFixed(2) });

    if (multiplier >= crashPoint) {
      clearInterval(flightInterval);
      io.emit("crash", { round, crashPoint });
      console.log(`💥 Round ${round} crashed at ${crashPoint}x`);
      isFlying = false;
      setTimeout(startRound, 5000);
    }
  }, 150);
}

io.on("connection", (socket) => {
  console.log("✅ Dashboard connected");
  socket.emit("aviator_status", { status: "connected", balances });

  socket.on("place_bet", ({ player, amount }) => {
    if (balances[player] >= amount) {
      balances[player] -= amount;
      io.emit("balance_update", balances);
      console.log(`🎲 ${player} placed bet of ${amount}`);
    } else {
      socket.emit("bet_failed", { message: "❌ Insufficient balance" });
    }
  });

  socket.on("cashout", ({ player, multiplier }) => {
    const winAmount = Math.round(100 * multiplier);
    balances[player] += winAmount;
    io.emit("balance_update", balances);
    console.log(`💰 ${player} cashed out ${winAmount} at ${multiplier}x`);
  });

  socket.on("disconnect", () => {
    console.log("❌ Dashboard disconnected");
  });
});

const PORT = process.env.PORT || 10000;
server.listen(PORT, () => {
  console.log(`✅ Server running on port ${PORT}`);
  setTimeout(startRound, 2000);
});
