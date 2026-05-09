import { useEffect } from "react";
import { useNavigate } from "react-router-dom";

export default function OAuth2Callback() {
  const navigate = useNavigate();

  useEffect(() => {
    const params   = new URLSearchParams(window.location.search);
    const token    = params.get("token");
    const userId   = params.get("userId");
    const role     = params.get("role");
    const fullName = params.get("fullName") || "";
    const error    = params.get("error");

    if (error) {
      console.error("OAuth2 error:", error);
      navigate("/login?error=" + error);
      return;
    }

    if (!token) {
      navigate("/login?error=no_token");
      return;
    }

    // Store in localStorage — same keys used by authService.jsx
    localStorage.setItem("token",    token);
    localStorage.setItem("userId",   userId);
    localStorage.setItem("role",     role);
    localStorage.setItem("fullName", fullName);

    //  ADMIN redirect  ──
    if (role === "ADMIN") {
      window.location.href = "/admin";
    } else if (role === "PROVIDER") {
      window.location.href = "/manage-slots";
    } else {
      window.location.href = "/dashboard";
    }
  }, [navigate]);

  return (
    <div style={{
      display: "flex", flexDirection: "column",
      alignItems: "center", justifyContent: "center",
      height: "100vh", gap: "1rem",
    }}>
      <div className="spinner" aria-label="Loading" />
      <p style={{ color: "var(--color-text-muted, #6b7280)" }}>
        Completing sign-in, please wait…
      </p>
    </div>
  );
}
