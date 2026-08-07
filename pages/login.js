import { useState } from "react";
import { useRouter } from "next/router";
import { Wrench, Loader2, AlertCircle } from "lucide-react";
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
    <div className="min-h-screen flex items-center justify-center bg-[#F5F3EE] px-4">
      <div className="bg-white rounded-lg shadow-md border border-[#E3DFD3] p-6 w-full max-w-sm">
        <div className="flex items-center gap-2 mb-6 justify-center">
          <div className="bg-[#3B6E8F] p-2 rounded-md">
            <Wrench className="w-5 h-5 text-white" />
          </div>
          <h1 className="ticket-font text-xl font-bold uppercase">Fiches d'intervention</h1>
        </div>
        {error && (
          <div className="mb-4 flex items-center gap-2 bg-[#C1495F]/10 border border-[#C1495F]/30 text-[#8f3247] px-3 py-2 rounded-md text-sm">
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
            className="w-full mt-2 flex items-center justify-center gap-2 bg-[#3B6E8F] text-white font-semibold py-2 rounded-md hover:brightness-110 disabled:opacity-60"
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
