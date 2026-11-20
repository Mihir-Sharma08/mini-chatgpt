// src/pages/LoginPage.jsx
import { Navigate } from "react-router";
import AuthForm from "../components/AuthForm";
import { useAuth } from "../hooks/useAuth";

const fields = [
  { name: "email", label: "Email", type: "email", autoComplete: "email", placeholder: "you@example.com" },
  { name: "password", label: "Password", type: "password", autoComplete: "current-password", placeholder: "Your password" },
];

export default function LoginPage() {
  const { user, isAuthLoading, login, sessionNotice } = useAuth();

  if (isAuthLoading) return null;
  if (user) return <Navigate to="/" replace />;

  return (
    <AuthForm
      title="Welcome back"
      subtitle="Log in to continue your conversations"
      fields={fields}
      submitLabel="Log in"
      onSubmit={login}
      notice={sessionNotice}
      footerText="New here?"
      footerLinkText="Create an account"
      footerLinkTo="/register"
    />
  );
}