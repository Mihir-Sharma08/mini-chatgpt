// src/pages/RegisterPage.jsx
import { Navigate } from "react-router";
import AuthForm from "../components/AuthForm";
import { useAuth } from "../hooks/useAuth";

const fields = [
  {
    name: "username",
    label: "Username",
    type: "text",
    autoComplete: "username",
    placeholder: "aarav_dev",
    hint: "3 to 30 characters: letters, numbers and underscores",
  },
  { name: "email", label: "Email", type: "email", autoComplete: "email", placeholder: "you@example.com" },
  {
    name: "password",
    label: "Password",
    type: "password",
    autoComplete: "new-password",
    placeholder: "At least 8 characters",
    hint: "Use at least 8 characters. A long passphrase is best.",
  },
];

export default function RegisterPage() {
  const { user, isAuthLoading, register } = useAuth();

  if (isAuthLoading) return null;
  if (user) return <Navigate to="/" replace />;

  return (
    <AuthForm
      title="Create your account"
      subtitle="Start chatting with Mini ChatGPT"
      fields={fields}
      submitLabel="Create account"
      onSubmit={register}
      footerText="Already have an account?"
      footerLinkText="Log in"
      footerLinkTo="/login"
    />
  );
}