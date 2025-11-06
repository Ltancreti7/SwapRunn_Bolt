import { createRoot } from "react-dom/client";
import App from "./App.tsx";
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
    <App />
  </SessionContextProvider>,
);
