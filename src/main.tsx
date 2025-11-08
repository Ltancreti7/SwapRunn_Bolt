import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import { DevErrorBoundary } from "@/components/DevErrorBoundary";
import "./index.css";
import { isNativeIos } from "./lib/native";
import { Capacitor } from "@capacitor/core";
import { SessionContextProvider } from "@supabase/auth-helpers-react";
import { supabase } from "@/integrations/supabase/client";

if (isNativeIos()) {
  document.body.classList.add("native-ios");
}

createRoot(document.getElementById("root")!).render(
  <SessionContextProvider supabaseClient={supabase}>
    {import.meta.env.DEV ? (
      <DevErrorBoundary>
        <App />
      </DevErrorBoundary>
    ) : (
      <App />
    )}
  </SessionContextProvider>,
);

if (import.meta.env.DEV) {
  // Extra global error visibility in dev (console + overlay boundary)
  window.addEventListener('error', (e) => {
    // eslint-disable-next-line no-console
    console.error('[GlobalError]', e.error || e.message);
  });
  window.addEventListener('unhandledrejection', (e) => {
    // eslint-disable-next-line no-console
    console.error('[UnhandledPromise]', e.reason);
  });
}
