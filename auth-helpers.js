// ===== auth-helpers.js =====

// Get current session (returns null if not logged in)
async function getSession() {
    const { data } = await sb.auth.getSession();
    return data.session;
  }
  
  // Redirect user if not logged in
  async function requireAuth(redirectTo = "login.html") {
    const session = await getSession();
    if (!session) {
      const here = encodeURIComponent(location.pathname);
      location.href = `${redirectTo}?redirect=${here}`;
    }
    return session;
  }
  
  // Listen for sign-in/out and update header user text if you have one
  sb.auth.onAuthStateChange((_event, session) => {
    const user = session?.user || null;
    const el = document.querySelector("[data-user-state]");
    if (!el) return;
    el.textContent = user
      ? `Hi, ${user.user_metadata?.first_name || "Member"}`
      : "Sign in";
  });
  