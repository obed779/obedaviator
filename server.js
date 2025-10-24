
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
  cors: { origin: "*", methods: ["GET", "POST"] },
});

app.use(cors());
app.use(express.json());

// ✅ Serve static files from /public
app.use(express.static(path.join(__dirname, "public")));

// ✅ Homepage
app.get("/", (req, res) => {
  res.send("✅ FlyWithObed Aviator API is running!");
});

// ✅ Dashboard route
app.get("/dashboard", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "dashboard.html"));
});

// =============================
// 🛠️ Game Simulation (Real-Time)
// =============================

let round = 0;
let activeFlights = false;
let balances = {
  playerA: 5000, // starting balance
  playerB: 5000,
};

function startRound() {
  if (activeFlights) return;
  activeFlights = true;
  round++;

  let multiplier = 1.0;
  const targetCrash = (Math.random() * 5 + 1).toFixed(2);

  console.log(`✈️ Round ${round} started — target crash ${targetCrash}x`);

  const flight = setInterval(() => {
    multiplier += 0.1;
    io.emit("flight_update", {
      round,
      multiplier: multiplier.toFixed(2),
    });

    if (multiplier >= targetCrash) {
      clearInterval(flight);
      activeFlights = false;
      console.log(`💥 Round ${round} crashed at ${targetCrash}x`);
      io.emit("crash", {
        round,
        crashPoint: targetCrash,
      });

      // Start next round after 5 seconds
      setTimeout(startRound, 5000);
    }
  }, 200);
}

// ✅ Handle bets & cashouts
io.on("connection", (socket) => {
  console.log("✅ Client connected");

  socket.emit("aviator_status", { status: "connected", balances });

  socket.on("place_bet", (data) => {
    const { player, amount } = data;
    if (balances[player] >= amount) {
      balances[player] -= amount;
      io.emit("balance_update", balances);
      socket.emit("bet_placed", { player, amount });
      console.log(`🎲 ${player} placed bet of ${amount}`);
    } else {
      socket.emit("bet_failed", { reason: "Insufficient balance" });
    }
  });

  socket.on("cashout", (data) => {
    const { player, multiplier } = data;
    const winAmount = Math.round(data.amount * multiplier);
    balances[player] += winAmount;
    io.emit("balance_update", balances);
    console.log(`💰 ${player} cashed out ${winAmount} at ${multiplier}x`);
  });

  socket.on("disconnect", () => {
    console.log("❌ Client disconnected");
  });
});

// ✅ Start the game server
const PORT = process.env.PORT || 10000;
server.listen(PORT, () => {
  console.log(`✅ Server live on port ${PORT}`);
  setTimeout(startRound, 2000);
});

