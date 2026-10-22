import app from "./app.js";
import { env } from "./config/env.js";

app.listen(env.PORT, () => {
  console.log(`API server listening on port ${env.PORT} (${env.NODE_ENV})`);
});
