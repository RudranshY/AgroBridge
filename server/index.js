require("dotenv").config();
require("./config/connectDB.js");

const express = require("express");
const cors = require("cors");
const http = require("http");
const { Server } = require("socket.io");

const { setupWebSocket } = require("./services/setupWebSocket");

const product = require("./routes/product");
const review = require("./routes/review");
const order = require("./routes/order");
const faq = require("./routes/faq");
const graph = require("./routes/graph.js");
const ai = require("./routes/ai.js");
const auth = require("./routes/auth");

const PORT = process.env.PORT || 8080;
const app = express();

// If running behind a proxy (heroku/nginx), enable trust proxy in prod
if (process.env.TRUST_PROXY === "true") {
  app.set("trust proxy", 1);
}

// parse allowed origins from env (comma separated)
const allowedOrigins = (process.env.ALLOWED_ORIGINS || "http://localhost:5173")
  .split(",")
  .map(u => u.trim())
  .filter(Boolean);

app.use(cors({
  origin: function(origin, callback) {
    // allow requests with no origin (curl, server-to-server, mobile)
    if (!origin) return callback(null, true);

    if (allowedOrigins.includes(origin)) {
      return callback(null, true);
    } else {
      // pass an Error so it can be handled by the error handler below
      return callback(new Error('CORS: Origin not allowed - ' + origin), false);
    }

  },
  credentials: true,
  methods: ["GET","POST","PUT","DELETE","PATCH","OPTIONS"],
  allowedHeaders: ["Content-Type","Authorization","Accept","X-Requested-With"]
}));

// helpful for JSON payloads; keep body limits reasonable for production
app.use(express.json({ limit: "10kb" }));
app.use(express.urlencoded({ extended: true, limit: "10kb" }));

// create http server + socket.io (allow same origins)
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: allowedOrigins,
    methods: ["GET","POST"],
    credentials: true
  }
});

setupWebSocket(io);

// Health Check
app.get("/", (req, res) => {
  res.send("AgroBridge Server is running");
});

// Routes
app.use("/auth", auth);
app.use("/products", product);
app.use("/reviews", review);
app.use("/order", order);
app.use("/faqs", faq);
app.use("/graph", graph);
app.use("/ai", ai);

// CORS / other error handler (so CORS errors return a clear 403)
app.use((err, req, res, next) => {
  if (err && err.message && err.message.startsWith("CORS:")) {
    return res.status(403).json({ message: err.message });
  }
  console.error("Unhandled server error:", err);
  res.status(500).json({ message: "Internal server error" });
});

server.listen(PORT, () => {
  console.log(`Server is running on PORT: ${PORT}`);
  console.log("Allowed origins:", allowedOrigins);
});
