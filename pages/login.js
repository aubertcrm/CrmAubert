import { useState } from "react";
import { useRouter } from "next/router";
import { Loader2, AlertCircle } from "lucide-react";
import { supabase } from "../lib/supabaseClient";

export default function Login() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (error) {
      setError("Email ou mot de passe incorrect.");
      return;
    }
    router.push("/");
  };

  return (
    <div
      className="min-h-screen flex items-center justify-center px-4"
      style={{ background: "radial-gradient(circle at 20% 0%, #2A1710 0%, #150E0B 55%, #0E0908 100%)" }}
    >
      <div className="bg-white rounded-2xl shadow-2xl border border-[#E4DCD1] p-7 w-full max-w-sm">
        <div className="flex flex-col items-center gap-1 mb-7">
          <div
            className="w-12 h-12 rounded-xl flex items-center justify-center mb-2 ticket-font text-white font-extrabold text-lg"
            style={{ background: "linear-gradient(135deg, #FF6B35, #B3202F)" }}
          >
            A
          </div>
          <h1 className="ticket-font text-2xl font-extrabold tracking-tight">AUBERT <span style={{ color: "#FF6B35" }}>CRM</span></h1>
          <p className="text-xs text-[#8b8677]">Plomberie · Serrurerie · Vitrerie</p>
        </div>
        {error && (
          <div className="mb-4 flex items-center gap-2 bg-[#B3202F]/10 border border-[#B3202F]/30 text-[#8f2431] px-3 py-2 rounded-lg text-sm">
            <AlertCircle className="w-4 h-4 shrink-0" /> {error}
          </div>
        )}
        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <label className="text-xs font-medium text-[#5c584d] block mb-1">Email</label>
            <input type="email" required className="input" value={email} onChange={(e) => setEmail(e.target.value)} />
          </div>
          <div>
            <label className="text-xs font-medium text-[#5c584d] block mb-1">Mot de passe</label>
            <input type="password" required className="input" value={password} onChange={(e) => setPassword(e.target.value)} />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full mt-2 flex items-center justify-center gap-2 text-white font-semibold py-2.5 rounded-lg hover:brightness-110 disabled:opacity-60 shadow-md"
            style={{ background: "linear-gradient(135deg, #FF6B35, #E8502A)" }}
          >
            {loading && <Loader2 className="w-4 h-4 animate-spin" />}
            Se connecter
          </button>
        </form>
        <p className="text-xs text-[#8b8677] text-center mt-4">
          Pas de compte ? Demandez au responsable de vous en créer un dans Supabase.
        </p>
      </div>
    </div>
  );
}
