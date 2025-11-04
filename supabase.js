// supabase.js (NON-MODULE)
const SUPABASE_URL = "https://jwomoxtdrwbezyhqmevb.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp3b21veHRkcndiZXp5aHFtZXZiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjIwMjk3MTgsImV4cCI6MjA3NzYwNTcxOH0.TjXfNClNZu4M_YRYqW9T-zkR5noDYCW7_4c9mSSfcdE";

window.sb = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

window.getSession = async () => {
  const { data: { session } } = await sb.auth.getSession();
  return session;
};

sb.auth.onAuthStateChange((event, session) => {
  console.log("Auth state:", event, session);
});
