import { useState } from "react";
import { Link } from "react-router";
import { Bot, LoaderCircle } from "lucide-react";

export default function AuthForm({
  title,
  subtitle,
  fields,
  submitLabel,
  onSubmit,
  notice,
  footerText,
  footerLinkText,
  footerLinkTo,
}) {
  const [values, setValues] = useState(() =>
    Object.fromEntries(fields.map((field) => [field.name, ""])),
  );
  const [error, setError] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setValues((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (isSubmitting) return;

    setError(null);
    setIsSubmitting(true);

    try {
      await onSubmit(values);
    } catch (submitError) {
      setError(submitError.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex min-h-dvh items-center justify-center bg-zinc-900 px-4 py-8 text-zinc-100">
      <div className="w-full max-w-sm">
        <div className="mb-6 flex flex-col items-center text-center">
          <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-600">
            <Bot size={26} />
          </div>
          <h1 className="text-2xl font-semibold">{title}</h1>
          <p className="mt-1 text-sm text-zinc-400">{subtitle}</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 rounded-2xl border border-zinc-800 bg-zinc-950 p-6">
          {notice && (
            <p className="rounded-lg border border-amber-500/40 bg-amber-950/30 px-3 py-2 text-sm text-amber-200">
              {notice}
            </p>
          )}

          {fields.map((field) => (
            <div key={field.name}>
              <label htmlFor={field.name} className="mb-1 block text-sm text-zinc-300">
                {field.label}
              </label>
              <input
                id={field.name}
                name={field.name}
                type={field.type}
                value={values[field.name]}
                onChange={handleChange}
                autoComplete={field.autoComplete}
                placeholder={field.placeholder}
                required
                className="w-full rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm outline-none placeholder:text-zinc-600 focus:border-zinc-500"
              />
              {field.hint && <p className="mt-1 text-xs text-zinc-500">{field.hint}</p>}
            </div>
          ))}

          {error && (
            <p role="alert" className="rounded-lg border border-red-500/40 bg-red-950/40 px-3 py-2 text-sm text-red-200">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={isSubmitting}
            className="flex w-full items-center justify-center gap-2 rounded-lg bg-emerald-600 px-3 py-2 text-sm font-medium text-white transition hover:bg-emerald-500 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isSubmitting && <LoaderCircle size={16} className="animate-spin" />}
            {submitLabel}
          </button>
        </form>

        <p className="mt-4 text-center text-sm text-zinc-400">
          {footerText}{" "}
          <Link to={footerLinkTo} className="text-emerald-400 hover:underline">
            {footerLinkText}
          </Link>
        </p>
      </div>
    </div>
  );
}