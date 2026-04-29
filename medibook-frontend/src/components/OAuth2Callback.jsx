import { useEffect } from "react";
import { useNavigate } from "react-router-dom";

/**
 * NEW FILE – add to medibook-frontend/src/components/OAuth2Callback.jsx
 *
 * This page is the OAuth2 redirect target.
 * After Google/GitHub login, the backend redirects here with:
 *   ?token=<jwt>&userId=<id>&role=<PATIENT|PROVIDER>
 *
 * This component reads those params, stores them exactly the same way
 * the existing Login component does, then navigates to the dashboard.
 *
 * UI: Same as the rest of the app — spinner while processing.
 * No new styles needed.
 *
 * Add this route to App.jsx:
 *   <Route path="/oauth2/callback" element={<OAuth2Callback />} />
 */
export default function OAuth2Callback() {
  const navigate = useNavigate();

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const token  = params.get("token");
    const userId = params.get("userId");
    const role   = params.get("role");
    const error  = params.get("error");

    if (error) {
      console.error("OAuth2 error:", error);
      navigate("/login?error=" + error);
      return;
    }

    if (!token) {
      navigate("/login?error=no_token");
      return;
    }

    // Store in localStorage – same keys used by the existing authService.jsx
    localStorage.setItem("token", token);
    localStorage.setItem("userId", userId);
    localStorage.setItem("role", role);

    // Navigate to the correct dashboard – same logic as Login.jsx
    if (role === "PROVIDER") {
      navigate("/provider-dashboard");
    } else {
      navigate("/dashboard");
    }
  }, [navigate]);

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        height: "100vh",
        gap: "1rem",
      }}
    >
      <div className="spinner" aria-label="Loading" />
      <p style={{ color: "var(--color-text-muted, #6b7280)" }}>
        Completing sign-in, please wait…
      </p>
    </div>
  );
}
