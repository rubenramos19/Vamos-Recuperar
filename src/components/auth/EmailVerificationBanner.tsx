import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export default function EmailVerificationBanner() {
  const [show, setShow] = useState(false);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      const user = data.user;
      if (!user) return setShow(false);

      // No Supabase, email_confirmed_at pode existir dependendo da config
      const confirmed = Boolean((user as any).email_confirmed_at);
      setShow(!confirmed);
    });
  }, []);

  if (!show) return null;

  return (
    <div className="mb-4 border rounded p-3 text-sm">
      ⚠️ Confirma o teu email para ativar a conta. Verifica a caixa de entrada e o spam.
    </div>
  );
}
