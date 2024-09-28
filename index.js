const { config } = require("dotenv");
const express = require("express");
const morgan = require("morgan");
const cookieParser = require("cookie-parser");
const cors = require("cors");
const http = require("http");
const path = require("path");
const os = require("os");
const MainRouter = require("./app/routers");
const errorHandlerMiddleware = require("./app/middlewares/error_middleware");
const whatsapp = require("wa-multi-session");
const multer = require("multer");
const fs = require("fs");

config();

var app = express();
app.use(morgan("dev"));
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.set("view engine", "ejs");

// Multer configuration for file uploads
const upload = multer({ dest: 'uploads/' });
// Public Path
app.use("/p", express.static(path.resolve("public")));
app.use("/p/*", (req, res) => res.status(404).send("Media Not Found"));

app.get("/", (req, res) => {
  res.sendFile("./client/index.html", {
    root: __dirname,
  });
});

app.get("/create-session", (req, res) => {
  res.sendFile("./client/create-session.html", {
    root: __dirname,
  });
});

app.get("/send-ma", (req, res) => {
  res.sendFile("./client/send-message.html", {
    root: __dirname,
  });
});

app.get("/usage", (req, res) => {
  res.sendFile("./client/usage.html", {
    root: __dirname,
  });
});

app.get("/send-media", (req, res) => {
  res.sendFile("./client/send-media.html", {
    root: __dirname,
  });
});

// API endpoint to fetch server stats
app.get("/api/stats", (req, res) => {
  const memoryUsage = process.memoryUsage();
  const cpuLoad = os.loadavg()[0];
  const cpuCount = os.cpus().length;
  const cpuUsage = (cpuLoad / cpuCount) * 100;

  res.json({
    memoryUsage: memoryUsage,
    cpuUsage: cpuUsage.toFixed(2),
  });
});

// New route for sending media
app.post("/send-media", upload.single('media'), async (req, res) => {
  try {
    const { session, to, caption } = req.body;
    const mediaPath = req.file.path;

    console.log('Received request to send media:');
    console.log('Session:', session);
    console.log('To:', to);
    console.log('Caption:', caption);
    console.log('Media path:', mediaPath);

    if (!session || !to || !mediaPath) {
      throw new Error('Missing required parameters');
    }

    // Determine the media type based on the file extension
    const fileExtension = path.extname(mediaPath).toLowerCase();
    let mediaType;
    if (['.jpg', '.jpeg', '.png'].includes(fileExtension)) {
      mediaType = 'image';
    } else if (['.mp4', '.mov'].includes(fileExtension)) {
      mediaType = 'video';
    } else if (['.mp3', '.ogg', '.wav'].includes(fileExtension)) {
      mediaType = 'audio';
    } else {
      mediaType = 'document';
    }

    // Send media using the appropriate method
    let result;
    switch (mediaType) {
      case 'image':
        result = await whatsapp.sendImage({ sessionId: session, to, image: mediaPath, caption });
        break;
      case 'video':
        result = await whatsapp.sendVideo({ sessionId: session, to, video: mediaPath, caption });
        break;
      case 'audio':
        result = await whatsapp.sendAudio({ sessionId: session, to, audio: mediaPath });
        break;
      case 'document':
        result = await whatsapp.sendDocument({ sessionId: session, to, document: mediaPath, caption });
        break;
    }

    console.log('WhatsApp API response:', result);
    
    // Delete the uploaded file after sending
    fs.unlinkSync(mediaPath);

    res.json({ success: true, result });
  } catch (error) {
    console.error('Error sending media:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});
// New route for extracting numbers from a list
app.post("/extract-numbers", (req, res) => {
  const { text } = req.body;
  const numberPattern = /\b\d{10,14}\b/g; // Matches 10 to 14 digit numbers
  const numbers = text.match(numberPattern) || [];
  res.json({ numbers });
});

app.use(MainRouter);

app.use(errorHandlerMiddleware);

const PORT = process.env.PORT || "5000";
app.set("port", PORT);

var server = http.createServer(app);

server.on("listening", () => {
  const interfaces = os.networkInterfaces();
  const addresses = [];
  for (const name of Object.keys(interfaces)) {
    for (const iface of interfaces[name]) {
      if (iface.family === 'IPv4' && !iface.internal) {
        addresses.push(iface.address);
      }
    }
  }
  console.log("APP IS RUNNING ON PORT " + PORT);
  addresses.forEach(address => {
    console.log(`Server is running at http://${address}:${PORT}`);
  });
});

server.listen(PORT);

whatsapp.onConnected((session) => {
  console.log("connected => ", session);
});

whatsapp.onDisconnected((session) => {
  console.log("disconnected => ", session);
});

whatsapp.onConnecting((session) => {
  console.log("connecting => ", session);
});

whatsapp.loadSessionsFromStorage();