import { useState } from "react";
import { createPortal } from "react-dom";
import { Eye, EyeOff, X } from "lucide-react";
import { supabase } from "../lib/supabase";

type Props = {
  open: boolean;
  onClose: () => void;
};

export default function AuthModal({ open, onClose }: Props) {
  const [isLogin, setIsLogin] = useState(true);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  if (!open) return null;

  function reset() {
    setName("");
    setEmail("");
    setPassword("");
    setShowPassword(false);
    setError(null);
  }

  async function handleSubmit() {
    setError(null);
    setLoading(true);

    if (isLogin) {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      setLoading(false);

      if (error) {
        setError(error.message);
        return;
      }
    } else {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: name,
          },
        },
      });

      setLoading(false);

      if (error) {
        setError(error.message);
        return;
      }

      // Supabase doesn't return an error for an email that's already
      // registered (to prevent account enumeration) — instead it
      // returns the existing user with an empty identities array.
      if (data.user?.identities?.length === 0) {
        setError(
          "An account with this email already exists. Please log in instead."
        );
        return;
      }
    }

    reset();
    onClose();
  }

  return createPortal(
    <>
      <div
        className="fixed inset-0 z-[100] bg-black/60"
        onClick={() => {
          reset();
          onClose();
        }}
      />

      <div className="fixed inset-0 z-[101] flex items-center justify-center p-4">
        <div className="w-full max-w-md rounded-2xl border border-white/10 bg-[#18181b] p-8 shadow-2xl">
          <div className="mb-6 flex items-center justify-between">
            <h2 className="text-xl font-semibold text-white">
              {isLogin ? "Log in" : "Sign up"}
            </h2>
            <div className="mt-5 border-t border-slate-300/40" />

            <button
              onClick={() => {
                reset();
                onClose();
              }}
              className="text-zinc-400 transition hover:text-white"
            >
              <X size={20} />
            </button>
          </div>

          <div className="space-y-4">
            <div>
              <label className="mb-1.5 block text-sm text-zinc-400">
                Email
              </label>
              <input
                type="email"
                placeholder="Email"
                autoFocus
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded-xl border border-zinc-700 bg-zinc-900 px-3.5 py-3 text-sm text-white outline-none focus:border-blue-500/50"
              />
            </div>

            <div>
              <label className="mb-1.5 block text-sm text-zinc-400">
                Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  placeholder="Password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
                  className="w-full rounded-xl border border-zinc-700 bg-zinc-900 px-3.5 py-3 pr-10 text-sm text-white outline-none focus:border-blue-500/50"
                />

                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 transition hover:text-white"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            {!isLogin && (
              <div>
                <label className="mb-1.5 block text-sm text-zinc-400">
                  Name
                </label>
                <input
                  type="text"
                  placeholder="Name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
                  className="w-full rounded-xl border border-zinc-700 bg-zinc-900 px-3.5 py-3 text-sm text-white outline-none focus:border-blue-500/50"
                />
              </div>
            )}
          </div>

          {error && <p className="mt-3 text-sm text-red-400">{error}</p>}

          <button
            onClick={handleSubmit}
            disabled={loading}
            className="mt-5 w-full rounded-xl bg-blue-600 py-3 font-medium text-white transition hover:bg-blue-500 disabled:opacity-50"
          >
            {loading ? "Please wait..." : isLogin ? "Log in" : "Sign up"}
          </button>

          <p className="mt-5 text-center text-sm text-zinc-400">
            {isLogin ? "Don't have an account?" : "Already have an account?"}{" "}
            <button
              onClick={() => {
                setIsLogin(!isLogin);
                setError(null);
              }}
              className="text-blue-400 hover:underline"
            >
              {isLogin ? "Sign up" : "Log in"}
            </button>
          </p>

          
        </div>
      </div>
    </>,
    document.body
  );
}
