import "dotenv/config";
import http from "http";
import app from "./app.js";
import { Server } from "socket.io";
import jwt from "jsonwebtoken";
import mongoose from "mongoose";
import projectModel from "./models/project.model.js";
import { generateResult } from "./services/ai.service.js";

const port = process.env.PORT || 3000;

const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: "*" },
});

// ===================================================
// SOCKET AUTH + PROJECT VALIDATION (FIXED)
// ===================================================
io.use(async (socket, next) => {
  try {
    // -------- TOKEN EXTRACTION (SAFE) --------
    let token = null;

    if (socket.handshake.auth?.token) {
      token = socket.handshake.auth.token;
    } else if (
      socket.handshake.headers.authorization?.startsWith("Bearer ")
    ) {
      token = socket.handshake.headers.authorization.split(" ")[1];
    }

    if (!token) {
      return next(new Error("Authentication token missing"));
    }

    // -------- JWT VERIFY --------
    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET);
    } catch {
      return next(new Error("Invalid or expired token"));
    }

    socket.user = decoded;

    // -------- PROJECT VALIDATION --------
    const { projectId } = socket.handshake.query;

    if (!projectId) {
      return next(new Error("projectId is required"));
    }

    if (!mongoose.Types.ObjectId.isValid(projectId)) {
      return next(new Error("Invalid projectId"));
    }

    const project = await projectModel.findById(projectId);

    if (!project) {
      return next(new Error("Project not found"));
    }

    socket.project = project;
    socket.roomId = project._id.toString();

    next();
  } catch (error) {
    console.error("Socket auth error:", error.message);
    next(new Error("Socket authentication failed"));
  }
});

// ===================================================
// SOCKET EVENTS
// ===================================================
io.on("connection", (socket) => {
  // SAFE JOIN
  socket.join(socket.roomId);

  console.log(
    `User connected: ${socket.user.email} | Project: ${socket.roomId}`
  );

  socket.on("project-message", async (data) => {
    if (!data?.message) return;

    const message = data.message;

    // Broadcast message to others
    socket.broadcast
      .to(socket.roomId)
      .emit("project-message", data);

    // -------- AI MENTION --------
    if (message.includes("@ai")) {
      const prompt = message.replace("@ai", "").trim();

      let aiResponse;
      try {
        aiResponse = await generateResult(prompt);
      } catch (err) {
        console.error("AI error:", err.message);
        aiResponse = JSON.stringify({
          text: "AI service temporarily unavailable.",
        });
      }

      io.to(socket.roomId).emit("project-message", {
        message: aiResponse,
        sender: { _id: "ai", email: "AI" },
      });
    }
  });

  socket.on("disconnect", () => {
    console.log(`User disconnected: ${socket.user.email}`);
    socket.leave(socket.roomId);
  });
});

// ===================================================
// START SERVER
// ===================================================
server.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
