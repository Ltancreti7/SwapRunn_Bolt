// Load dotenv (if available) before reading process.env. Use top-level await so the env file
// is applied before we import and use @supabase/supabase-js.
try {
  const dotenv = await import("dotenv");
  dotenv.config({ path: "./supabase/.env.local" });
} catch (e) {
  // dotenv optional — proceed relying on shell env
}

const { createClient } = await import("@supabase/supabase-js");

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_ANON_KEY =
  process.env.SUPABASE_ANON_KEY ||
  process.env.SUPABASE_KEY ||
  process.env.SUPABASE_ANON;

if (!SUPABASE_URL) {
  console.error(
    "Missing SUPABASE_URL in environment. Set SUPABASE_URL in supabase/.env.local or your shell env.",
  );
  process.exit(2);
}

if (!SUPABASE_ANON_KEY) {
  console.error(
    "Missing SUPABASE_ANON_KEY (or SUPABASE_KEY) in environment. Set SUPABASE_ANON_KEY in supabase/.env.local or your shell env.",
  );
  process.exit(2);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function run() {
  try {
    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .limit(1);
    if (error) {
      console.error("Supabase query error:", error);
      process.exitCode = 3;
      return;
    }
    console.log("Query result:", data);
  } catch (err) {
    console.error("Unexpected error:", err);
    process.exitCode = 4;
  }
}

run();
// mark as module so top-level await is allowed
export {};
