/* supabase.js (guarded, non-module) */
(function () {
  // Provide your project values exactly once
  if (!window.SUPABASE_URL)      window.SUPABASE_URL      = "https://jwomoxtdrwbezyhqmevb.supabase.co";
  if (!window.SUPABASE_ANON_KEY) window.SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp3b21veHRkcndiZXp5aHFtZXZiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjIwMjk3MTgsImV4cCI6MjA3NzYwNTcxOH0.TjXfNClNZu4M_YRYqW9T-zkR5noDYCW7_4c9mSSfcdE";

  // Create client once
  if (!window.sb && window.supabase) {
    window.sb = window.supabase.createClient(window.SUPABASE_URL, window.SUPABASE_ANON_KEY);
    console.log("[supabase] client ready");
  }

  // Helper to get the current session
  window.getSession = async () => {
    const { data: { session } } = await sb.auth.getSession();
    return session;
  };

  // Hook auth events once
  if (!window.__sbAuthHooked && window.sb?.auth) {
    window.__sbAuthHooked = true;
    sb.auth.onAuthStateChange((event, session) => {
      console.log("Auth state:", event, session);
    });
  }
})();
