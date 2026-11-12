import { useState, type FormEvent } from "react";
import { Link, useNavigate } from "react-router";
import { register } from "../api/auth";
import { useAuth } from "../auth/useAuth";
import { errorMessage } from "../lib/errors";
import { isValidEmail, passwordError } from "../lib/validation";

export function RegisterPage() {
  const { signIn } = useAuth();
  const navigate = useNavigate();

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
      void navigate("/", { replace: true });
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
      <h1 className="text-2xl font-semibold">Create account</h1>

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
          className="w-full rounded-md bg-orange-600 px-4 py-2 font-medium text-white hover:bg-orange-700 disabled:bg-stone-300"
        >
          Create account
        </button>
      </form>

      <p className="text-sm text-stone-600">
        Already have an account? <Link to="/login">Sign in</Link>
      </p>
    </section>
  );
}
