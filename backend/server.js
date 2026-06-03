import express from "express";
import cors from "cors";
import WebSocket from "ws";

const AIS_WS_URL = "wss://stream.aisstream.io/v0/stream";
const PORT = process.env.PORT || 4000;

const app = express();
app.use(cors());

app.get("/", (_req, res) => {
  res.json({ status: "ok", endpoint: "/api/ais", protocol: "SSE" });
});

app.get("/api/ais", (req, res) => {
  const apiKey = process.env.AISSTREAM_API_KEY;

  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache, no-transform");
  res.setHeader("Connection", "keep-alive");
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.flushHeaders?.();

  if (!apiKey) {
    console.error("[AIS ERROR] Missing AISSTREAM_API_KEY");
    res.write(`event: error\ndata: ${JSON.stringify({ error: "Missing AISSTREAM_API_KEY" })}\n\n`);
    return res.end();
  }

  let upstream = null;
  let reconnectTimer = null;
  let clientClosed = false;

  const cleanupUpstream = () => {
    if (reconnectTimer) {
      clearTimeout(reconnectTimer);
      reconnectTimer = null;
    }

    if (upstream) {
      upstream.removeAllListeners();
      if (upstream.readyState === WebSocket.OPEN || upstream.readyState === WebSocket.CONNECTING) {
        try {
          upstream.close();
        } catch {
          // no-op
        }
      }
      upstream = null;
    }
  };

  const scheduleReconnect = () => {
    if (clientClosed || reconnectTimer) return;
    reconnectTimer = setTimeout(() => {
      reconnectTimer = null;
      connectUpstream();
    }, 3000);
  };

  const connectUpstream = () => {
    if (clientClosed) return;

    cleanupUpstream();

    upstream = new WebSocket(AIS_WS_URL, {
      headers: { "x-api-key": process.env.AISSTREAM_API_KEY }
    });

    upstream.on("open", () => {
      console.log("[AIS] Upstream WebSocket open — sending subscription");

      upstream.send(
        JSON.stringify({
          APIKey: process.env.AISSTREAM_API_KEY,
          BoundingBoxes: [
            [
              [-90, -180],
              [90, 180]
            ]
          ],
          FilterMessageTypes: ["PositionReport"]
        })
      );
    });

    upstream.on("message", (data) => {
      res.write(`data: ${data}\n\n`);
    });

    upstream.on("close", (code, reason) => {
      const details = reason?.toString?.() || "";
      console.warn(`[AIS] Upstream WebSocket closed (${code}) ${details}`.trim());
      if (!clientClosed) {
        res.write(`event: close\ndata: ${JSON.stringify({ code, reason: details || null })}\n\n`);
        scheduleReconnect();
      }
    });

    upstream.on("error", (error) => {
      console.error("[AIS ERROR] Upstream WebSocket error:", error?.message || error);
      if (!clientClosed) {
        res.write(`event: error\ndata: ${JSON.stringify({ error: "AIS upstream error" })}\n\n`);
        scheduleReconnect();
      }
    });
  };

  const heartbeat = setInterval(() => {
    if (!clientClosed) {
      res.write(": keep-alive\n\n");
    }
  }, 15000);

  connectUpstream();

  const closeClient = () => {
    clientClosed = true;
    clearInterval(heartbeat);
    cleanupUpstream();
  };

  req.on("close", closeClient);
  res.on("close", closeClient);
});

app.listen(PORT, () => {
  console.log(`[AIS] Backend listening on port ${PORT}`);
});
