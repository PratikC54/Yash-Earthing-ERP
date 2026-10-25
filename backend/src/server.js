import app from "./app.js";
import { env } from "./config/env.js";
import { NotificationScheduler } from "./features/notifications/notificationScheduler.js";

const server = app.listen(env.PORT, () => {
  console.log(`API server listening on port ${env.PORT} (${env.NODE_ENV})`);

  // Start background notifications & escalation scheduler (every 5 minutes)
  if (env.NODE_ENV !== "test") {
    NotificationScheduler.startScheduler(5 * 60 * 1000);
    console.log("Smart Alerts & Escalation background scheduler initialized.");
  }
});

export default server;
