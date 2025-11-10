// ================================
// Lokal Newsletter Subscription
// ================================
(() => {
    // 🔗 Your live Google Apps Script Web App URL (from Deploy > Web app)
    const WEB_APP_URL = 'https://script.google.com/macros/s/AKfycbwtWLOlyvbL9Pk76_Z2P_1Kzx0Ybu1WuhoUJ5JBvTI5Duabhwh1OVENZUzNXSpZfdvFFQ/exec';

  
    // Grab elements
    const form    = document.getElementById('newsletterForm');
    const emailIn = document.getElementById('newsletterEmail');
    const consent = document.getElementById('newsletterConsent'); // may be required
    const btn     = document.getElementById('newsletterBtn');
    const msg     = document.getElementById('newsletterMsg');
  
    if (!form) return; // no form on this page
  
    // Helpers
    const setMsg = (text, ok = true) => {
      if (!msg) return;
      msg.textContent = text || '';
      msg.style.color = ok ? '#166534' : '#b91c1c'; // green / red
    };
    const validEmail = (s) => /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(String(s || '').trim());
  
    // Submit handler
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
  
      const email = (emailIn?.value || '').trim();
      const agreed = consent ? !!consent.checked : true;
  
      if (!email || !validEmail(email)) {
        setMsg('Please enter a valid email address.', false);
        emailIn?.focus();
        return;
      }
      if (!agreed) {
        setMsg('Please agree to the Terms & Privacy to subscribe.', false);
        return;
      }
  
      setMsg('');
      if (btn) { btn.disabled = true; btn.textContent = 'Subscribing…'; }
  
      // Build POST body (no custom headers to avoid CORS preflight)
      const body = new URLSearchParams({
        email,
        source: (location.pathname || '').replace(/^\//, '') || 'site',
        userAgent: navigator.userAgent,
        ip: '' // optional
      });
  
      try {
        const res = await fetch(WEB_APP_URL, { method: 'POST', body });
  
        // Apps Script may return opaque due to cross-domain; treat that as success
        let ok = res.ok || res.type === 'opaque';
  
        // If not opaque, try to parse JSON to check { ok: true }
        if (!ok) {
          try {
            const data = await res.json();
            ok = !!data?.ok;
          } catch {
            // If not JSON, try text (best-effort)
            const t = await res.text().catch(() => '');
            ok = /"ok"\s*:\s*true/i.test(t);
          }
        }
  
        if (ok) {
          form.reset();
          setMsg('Thanks! You’re subscribed. Check your inbox for our welcome email.');
        } else {
          setMsg('There was a problem subscribing. Please try again.', false);
        }
      } catch (err) {
        console.error(err);
        setMsg('Network error. Please try again.', false);
      } finally {
        if (btn) { btn.disabled = false; btn.textContent = 'Subscribe'; }
      }
    });
  })();
  