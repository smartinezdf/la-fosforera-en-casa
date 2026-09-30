"use client";

import Image from "next/image";
import { useState } from "react";
import { createBrowserSupabaseClient } from "@/lib/supabase/client";

export function LoginForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState<string | null>(null);

  async function signIn(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const supabase = createBrowserSupabaseClient();
    if (!supabase) {
      setMessage("Conecta Supabase para activar el login real.");
      return;
    }
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setMessage(error ? error.message : "Listo. Abre /admin.");
  }

  return (
    <main className="page-shell">
      <form className="login-card card" onSubmit={signIn}>
        <Image src="/logo-la-fosforera.png" alt="La Fosforera en Casa" width={260} height={110} />
        <label className="field">
          <span>Email</span>
          <input type="email" required value={email} onChange={(event) => setEmail(event.target.value)} />
        </label>
        <label className="field">
          <span>Contraseña</span>
          <input type="password" required value={password} onChange={(event) => setPassword(event.target.value)} />
        </label>
        <button className="btn" type="submit">Entrar</button>
        {message ? <p className="result-message">{message}</p> : null}
      </form>
    </main>
  );
}
