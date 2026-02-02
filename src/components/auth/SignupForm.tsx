import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";

export default function SignupForm() {
  const nav = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [msg, setMsg] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setMsg(null);
    setLoading(true);

    const { error } = await supabase.auth.signUp({ email, password });

    setLoading(false);

    if (error) {
      setMsg(error.message);
      return;
    }

    // Se tiveres confirmação de email ativa, vai pedir para confirmar
    nav("/login", { replace: true });
  }

  return (
    <form onSubmit={onSubmit} className="space-y-3">
      <input
        className="w-full border rounded p-2"
        placeholder="Email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
      />
      <input
        className="w-full border rounded p-2"
        placeholder="Password"
        type="password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
      />
      {msg && <div className="text-sm text-red-600">{msg}</div>}
      <button className="w-full bg-black text-white rounded p-2" disabled={loading}>
        {loading ? "A criar..." : "Criar conta"}
      </button>
    </form>
  );
}
