import { BrandLogo } from "../components/BrandLogo";
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
    <section className="mx-auto w-full max-w-sm overflow-hidden rounded-3xl bg-white shadow-xl ring-1 ring-brand-100">
      <div className="bg-gradient-to-br from-brand-500 via-brand-500 to-sun-400 px-6 py-8 text-center text-white">
        <BrandLogo className="mx-auto mb-3 h-12 w-12 text-white" />
        <p className="text-lg font-semibold">¡Qué bueno verte de nuevo!</p>
        <p className="text-sm text-brand-50">Entra para armar tu pedido.</p>
      </div>
      <div className="space-y-6 p-6">
        <header className="space-y-1">
          <h1 className="text-2xl font-semibold">Sign in</h1>
          <p className="text-sm text-stone-600">
            {redirectTarget(location.state) === "/cart" ?
              "Sign in to place your order. Your cart will move to your account."
            : "Ingresa con tu correo y contraseña."}
          </p>
        </header>

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
            className="w-full rounded-xl bg-brand-600 px-4 py-3 font-semibold text-white shadow-sm hover:bg-brand-700 disabled:bg-stone-300"
          >
            Sign in
          </button>
        </form>

        <p className="text-sm text-stone-600">
          No account yet?{" "}
          <Link
            to="/register"
            state={{ from: redirectTarget(location.state) }}
            className="font-medium text-brand-700 hover:underline"
          >
            Sign up
          </Link>
        </p>
      </div>
    </section>
  );
}
