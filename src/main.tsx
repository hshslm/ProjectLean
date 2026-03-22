import * as Sentry from "@sentry/react";
import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

Sentry.init({
  dsn: "https://935d803163a369ea479357cb560dfd73@o4511048709767168.ingest.us.sentry.io/4511048711340032",
  integrations: [Sentry.browserTracingIntegration()],
  tracesSampleRate: 0.1,
  environment: import.meta.env.MODE,
});

createRoot(document.getElementById("root")!).render(<App />);
