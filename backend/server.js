import express from "express";
import cors from "cors";
import { WebSocket } from "ws";

const AIS_WS_URL = "wss://stream.aisstream.io/v0/stream";
const AIS_API_KEY = process.env.AISSTREAM_API_KEY;
const PORT = process.env.PORT || 4000;

const app = express();
app.use(cors());

app.get("/api/ais", (req, res) => {
  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");

  const ws = new WebSocket(AIS_WS_URL, {
    headers: {
      "x-api-key": AIS_API_KEY
    }
  });

  ws.on("open", () => {
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

  ws.on("close", () => res.end());
  ws.on("error", () => res.end());

  req.on("close", () => ws.close());
});

app.listen(PORT, () => {
  console.log(`[AIS] Backend running on port ${PORT}`);
});
