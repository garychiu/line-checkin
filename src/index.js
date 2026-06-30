require("dotenv").config();
const express = require("express");
const path = require("path");

const app = express();
const PORT = process.env.PORT || 3100;

// /webhook 用自己的 raw body parser，其他路由用 json
app.use((req, res, next) => {
  if (req.path === "/webhook") return next();
  express.json()(req, res, next);
});

app.use(express.static(path.join(__dirname, "../public")));

// Routes
app.use("/webhook", require("./routes/webhook"));
app.use("/liff", require("./routes/liff"));
app.use("/auth", require("./routes/oauth"));
app.use("/admin", require("./middleware/adminAuth"), require("./routes/admin"));

// ngrok browser warning bypass
app.use((req, res, next) => {
  res.setHeader("ngrok-skip-browser-warning", "true");
  next();
});

// Health check
app.get("/health", (req, res) => res.json({ status: "ok" }));

app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
  console.log(`📡 Webhook: /webhook`);
  console.log(`🔑 OAuth Callback: /auth/google/callback`);
});
