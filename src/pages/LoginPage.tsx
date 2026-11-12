import { useState, type FormEvent } from "react";
import { Link, useLocation, useNavigate } from "react-router";
import { login } from "../api/auth";
import { redirectTarget } from "../auth/redirect";
import { useAuth } from "../auth/useAuth";
import { errorMessage } from "../lib/errors";
import { isValidEmail } from "../lib/validation";

export function LoginPage() {
  const { signIn } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function submit() {
    if (!isValidEmail(email)) {
      setError("Enter a valid email.");
      return;
    }
    if (password === "") {
      setError("Enter your password.");
      return;
    }

    setError(null);
    setSubmitting(true);
    try {
      const { token } = await login(email.trim(), password);
      signIn(token);
      void navigate(redirectTarget(location.state), { replace: true });
    } catch (caught) {
      setError(errorMessage(caught));
      setSubmitting(false);
    }
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    void submit();
  }

  return (
    <section className="mx-auto max-w-sm space-y-6">
      <h1 className="text-2xl font-semibold">Sign in</h1>

      <form
        className="space-y-4"
        onSubmit={handleSubmit}
        noValidate
      >
        <label className="block text-sm font-medium">
          Email
          <input
            type="email"
            autoComplete="email"
            value={email}
            onChange={event => setEmail(event.target.value)}
            className="mt-1 w-full rounded-md border border-stone-300 bg-white px-3 py-2"
          />
        </label>

        <label className="block text-sm font-medium">
          Password
          <input
            type="password"
            autoComplete="current-password"
            value={password}
            onChange={event => setPassword(event.target.value)}
            className="mt-1 w-full rounded-md border border-stone-300 bg-white px-3 py-2"
          />
        </label>

        {error && (
          <p
            role="alert"
            className="text-sm text-red-700"
          >
            {error}
          </p>
        )}

        <button
          type="submit"
          disabled={submitting}
          className="w-full rounded-md bg-orange-600 px-4 py-2 font-medium text-white hover:bg-orange-700 disabled:bg-stone-300"
        >
          Sign in
        </button>
      </form>

      <p className="text-sm text-stone-600">
        No account yet? <Link to="/register">Sign up</Link>
      </p>
    </section>
  );
}
