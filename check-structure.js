import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.VITE_SUPABASE_URL || "your-supabase-url",
  process.env.VITE_SUPABASE_PUBLISHABLE_KEY || "your-supabase-key",
);

(async () => {
  console.log("🔍 Checking current database structure...");

  // Check which tables actually exist and work
  const tables = ["jobs", "driver_requests", "profiles", "dealers", "drivers"];

  for (const table of tables) {
    try {
      const { data, error } = await supabase.from(table).select("*").limit(1);
      if (error) {
        console.log(`❌ ${table}: ${error.message}`);
      } else {
        console.log(`✅ ${table}: EXISTS (${data?.length || 0} rows)`);

        // If it's the jobs table, try to see what columns it accepts
        if (table === "jobs" && data?.length === 0) {
          console.log("   Testing jobs table structure...");
          // Try basic insert to see what columns are accepted
          const testResult = await supabase
            .from("jobs")
            .insert({
              type: "delivery",
              pickup_address: "test",
              delivery_address: "test",
              customer_name: "test",
              customer_phone: "test",
            })
            .select();

          if (testResult.error) {
            console.log(
              `   Error with basic insert: ${testResult.error.message}`,
            );
          } else {
            console.log(`   ✅ Basic insert works!`);
            // Clean up
            if (testResult.data?.[0]) {
              await supabase
                .from("jobs")
                .delete()
                .eq("id", testResult.data[0].id);
            }
          }
        }
      }
    } catch (err) {
      console.log(`❌ ${table}: ${err.message}`);
    }
  }
})();
