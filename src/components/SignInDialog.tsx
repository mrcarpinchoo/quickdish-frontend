import { BrandLogo } from "./BrandLogo";
import { useEffect, useId, useState, type FormEvent } from "react";
import { login, register } from "../api/auth";
import { useAuth } from "../auth/useAuth";
import { errorMessage } from "../lib/errors";
import { isValidEmail, passwordError } from "../lib/validation";

type SignInDialogProps = {
  onClose: () => void;
  /** Called after a successful sign-in or sign-up, so the caller can continue the action. */
  onSignedIn: () => void;
};

type Mode = "login" | "register";

/**
 * Pop-up shown when an anonymous visitor tries to add a dish. It explains why an
 * account is needed, and lets them sign in or sign up without leaving the page,
 * so the dish they picked is still there afterwards.
 */
export function SignInDialog({ onClose, onSignedIn }: SignInDialogProps) {
  const { signIn } = useAuth();
  const titleId = useId();
  const [mode, setMode] = useState<Mode>("register");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") onClose();
    }
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [onClose]);

  function switchMode(next: Mode) {
    setMode(next);
    setError(null);
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (mode === "register" && name.trim() === "") {
      setError("Enter your name.");
      return;
    }
    if (!isValidEmail(email)) {
      setError("Enter a valid email.");
      return;
    }
    if (mode === "register") {
      const problem = passwordError(password);
      if (problem) {
        setError(problem);
        return;
      }
    } else if (password === "") {
      setError("Enter your password.");
      return;
    }

    setError(null);
    setSubmitting(true);
    try {
      const { token } =
        mode === "register" ?
          await register({
            name: name.trim(),
            email: email.trim(),
            password
          })
        : await login(email.trim(), password);
      signIn(token);
      onSignedIn();
    } catch (caught) {
      setError(errorMessage(caught));
      setSubmitting(false);
    }
  }

  const isRegister = mode === "register";

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-stone-900/50 sm:items-center sm:p-4"
      onMouseDown={event => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <form
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        noValidate
        onSubmit={event => void handleSubmit(event)}
        className="w-full max-w-md overflow-hidden rounded-t-3xl bg-white shadow-xl sm:rounded-3xl"
      >
        <div className="relative bg-gradient-to-br from-brand-500 via-brand-500 to-sun-400 px-6 pt-6 pb-8 text-white">
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="absolute top-4 right-4 flex h-9 w-9 items-center justify-center rounded-full bg-white/20 text-white hover:bg-white/30"
          >
            ✕
          </button>
          <BrandLogo className="mb-3 h-11 w-11 text-white" />
          <h2
            id={titleId}
            className="text-xl font-semibold"
          >
            ¡Tu próximo antojo está a un paso!
          </h2>
          <p className="mt-1 text-sm text-brand-50">
            Inicia sesión o crea una cuenta para agregar platillos a tu carrito
            y realizar tu pedido.
          </p>
        </div>

        <div className="space-y-5 bg-white p-6">
          <div
            role="tablist"
            aria-label="Account"
            className="grid grid-cols-2 gap-1 rounded-xl bg-stone-100 p-1 text-sm font-semibold"
          >
            <button
              type="button"
              role="tab"
              aria-selected={!isRegister}
              onClick={() => switchMode("login")}
              className={`rounded-lg py-2 ${
                !isRegister ?
                  "bg-white text-stone-900 shadow-sm"
                : "text-stone-600"
              }`}
            >
              Iniciar sesión
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={isRegister}
              onClick={() => switchMode("register")}
              className={`rounded-lg py-2 ${
                isRegister ?
                  "bg-white text-stone-900 shadow-sm"
                : "text-stone-600"
              }`}
            >
              Crear cuenta
            </button>
          </div>

          {isRegister && (
            <label className="block text-sm font-medium">
              Name
              <input
                autoComplete="name"
                value={name}
                onChange={event => setName(event.target.value)}
                className="mt-1 w-full rounded-xl border border-stone-200 bg-stone-50 px-3 py-2 focus:border-brand-400 focus:ring-2 focus:ring-brand-200 focus:outline-none"
              />
            </label>
          )}

          <label className="block text-sm font-medium">
            Email
            <input
              type="email"
              autoComplete="email"
              value={email}
              onChange={event => setEmail(event.target.value)}
              className="mt-1 w-full rounded-xl border border-stone-200 bg-stone-50 px-3 py-2 focus:border-brand-400 focus:ring-2 focus:ring-brand-200 focus:outline-none"
            />
          </label>

          <label className="block text-sm font-medium">
            {isRegister ? "Password (at least 8 characters)" : "Password"}
            <input
              type="password"
              autoComplete={isRegister ? "new-password" : "current-password"}
              value={password}
              onChange={event => setPassword(event.target.value)}
              className="mt-1 w-full rounded-xl border border-stone-200 bg-stone-50 px-3 py-2 focus:border-brand-400 focus:ring-2 focus:ring-brand-200 focus:outline-none"
            />
          </label>

          {error && (
            <p
              role="alert"
              className="rounded-xl bg-red-50 p-3 text-sm text-red-700"
            >
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={submitting}
            className="w-full rounded-xl bg-brand-600 px-4 py-3 font-semibold text-white shadow-sm hover:bg-brand-700 disabled:bg-stone-300"
          >
            {submitting ?
              "Un momento…"
            : isRegister ?
              "Crear cuenta y agregar"
            : "Iniciar sesión y agregar"}
          </button>
          <button
            type="button"
            onClick={onClose}
            className="block w-full text-center text-sm font-medium text-stone-500 hover:text-stone-800"
          >
            ¿Aún explorando? Cerrar y volver al menú.
          </button>
        </div>
      </form>
    </div>
  );
}
