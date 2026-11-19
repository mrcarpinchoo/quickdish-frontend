import { BrandLogo } from "../components/BrandLogo";
import { useState, type FormEvent } from "react";
import { Link, useLocation, useNavigate } from "react-router";
import { register } from "../api/auth";
import { redirectTarget } from "../auth/redirect";
import { useAuth } from "../auth/useAuth";
import { errorMessage } from "../lib/errors";
import { isValidEmail, passwordError } from "../lib/validation";

export function RegisterPage() {
  const { signIn } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function submit() {
    if (name.trim() === "") {
      setError("Enter your name.");
      return;
    }
    if (!isValidEmail(email)) {
      setError("Enter a valid email.");
      return;
    }
    const passwordProblem = passwordError(password);
    if (passwordProblem) {
      setError(passwordProblem);
      return;
    }

    setError(null);
    setSubmitting(true);
    try {
      const { token } = await register({
        name: name.trim(),
        email: email.trim(),
        password
      });
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
        <p className="text-lg font-semibold">¡Bienvenido a QuickDish!</p>
        <p className="text-sm text-brand-50">Crea tu cuenta en un minuto.</p>
      </div>
      <div className="space-y-6 p-6">
        <header className="space-y-1">
          <h1 className="text-2xl font-semibold">Create account</h1>
          <p className="text-sm text-stone-600">
            {redirectTarget(location.state) === "/cart" ?
              "Create an account to place your order. Your cart will move to it."
            : "Crea tu cuenta en un minuto y empieza a pedir."}
          </p>
        </header>

        <form
          className="space-y-4"
          onSubmit={handleSubmit}
          noValidate
        >
          <label className="block text-sm font-medium">
            Name
            <input
              autoComplete="name"
              value={name}
              onChange={event => setName(event.target.value)}
              className="mt-1 w-full rounded-md border border-stone-300 bg-white px-3 py-2"
            />
          </label>

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
            Password (at least 8 characters)
            <input
              type="password"
              autoComplete="new-password"
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
            Create account
          </button>
        </form>

        <p className="text-sm text-stone-600">
          Already have an account?{" "}
          <Link
            to="/login"
            state={{ from: redirectTarget(location.state) }}
            className="font-medium text-brand-700 hover:underline"
          >
            Sign in
          </Link>
        </p>
      </div>
    </section>
  );
}
