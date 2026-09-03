const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");
const crypto = require("crypto");

const app = express();
const PORT = Number(process.env.PORT || 3000);
const API_VERSION = "2.1";

app.disable("x-powered-by");
app.set("trust proxy", 1);

app.use(helmet());

app.use(cors({
  origin: true,
  methods: ["GET", "POST", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization", "X-Request-ID"]
}));

app.use(express.json({ limit: "32kb" }));

const limiter = rateLimit({
  windowMs: 60 * 1000,
  limit: 60,
  standardHeaders: "draft-8",
  legacyHeaders: false
});

app.use("/api/", limiter);

app.use((req, res, next) => {
  const requestId =
    req.get("X-Request-ID") ||
    crypto.randomBytes(12).toString("hex");

  res.setHeader("X-Request-ID", requestId);
  req.requestId = requestId;
  next();
});

app.get("/api/health", (req, res) => {
  res.json({
    ok: true,
    apiVersion: API_VERSION,
    service: "battle-the-brainrot-server",
    requestId: req.requestId,
    time: new Date().toISOString()
  });
});

/*
 * 第2章 2-1
 * サーバーAPIの入口だけを作る段階。
 *
 * - GoldやInventoryをクライアントから信用しない
 * - Fuse/Craft/Dropの結果をまだ受け入れない
 * - Player IDやパスワードの正式発行は2-2で実装する
 * - 永続DBも2-2以降で追加する
 *
 * この段階ではゲーム本体(index.html)を変更していない。
 */

app.use("/api", (req, res) => {
  res.status(501).json({
    ok: false,
    error: "API_NOT_IMPLEMENTED",
    message: "このAPIは第2章の実装途中です。",
    requestId: req.requestId
  });
});

app.use((err, req, res, next) => {
  console.error(`[${req.requestId}]`, err);

  if (err instanceof SyntaxError && "body" in err) {
    return res.status(400).json({
      ok: false,
      error: "INVALID_JSON",
      requestId: req.requestId
    });
  }

  res.status(500).json({
    ok: false,
    error: "INTERNAL_SERVER_ERROR",
    requestId: req.requestId
  });
});

app.listen(PORT, () => {
  console.log(`Battle The Brainrot API listening on port ${PORT}`);
});
