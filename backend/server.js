import express from "express";
import cors from "cors";
import { WebSocket } from "ws";

const AIS_WS_URL = "wss://stream.aisstream.io/v0/stream";
const AIS_API_KEY = process.env.AISSTREAM_API_KEY;
const PORT = process.env.PORT || 4000;

const app = express();
app.use(cors());

app.get("/", (_req, res) => {
  res.json({ status: "ok", endpoint: "/api/ais", protocol: "SSE" });
});

app.get("/api/ais", (req, res) => {
  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.flushHeaders?.();

  if (!AIS_API_KEY) {
    res.write(`event: error\ndata: ${JSON.stringify({ error: "Missing AISSTREAM_API_KEY" })}\n\n`);
    return res.end();
  }

  const ws = new WebSocket(AIS_WS_URL, {
    headers: {
      "x-api-key": AIS_API_KEY
    }
  });

  ws.on("open", () => {
    console.log("[AIS] Upstream WebSocket open — subscribing");
    ws.send(
      JSON.stringify({
        APIKey: AIS_API_KEY,
        BoundingBoxes: [
          {
            NorthEast: { lat: 90, lon: 180 },
            SouthWest: { lat: -90, lon: -180 }
          }
        ],
        FilterMessageTypes: ["PositionReport"]
      })
    );
  });

  ws.on("message", (data) => {
    res.write(`data: ${data.toString()}\n\n`);
  });

  ws.on("close", () => {
    console.warn("[AIS] Upstream closed");
    res.end();
  });
  ws.on("error", (err) => {
    console.error("[AIS ERROR]", err?.message || err);
    res.end();
  });

  // Heartbeat to keep proxies from killing the SSE stream
  const heartbeat = setInterval(() => {
    try { res.write(`: ping\n\n`); } catch { /* noop */ }
  }, 15000);

  req.on("close", () => {
    clearInterval(heartbeat);
    try { ws.close(); } catch { /* noop */ }
  });
});

app.listen(PORT, () => {
  console.log(`[AIS] Backend running on port ${PORT}`);
});
