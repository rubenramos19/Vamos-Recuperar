import React, { useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import SignupForm from "@/components/auth/SignupForm";
import { useAuth } from "@/contexts/AuthContext";

const Signup = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  // Redirect if already logged in
  useEffect(() => {
    if (user) {
      navigate("/");
    }
  }, [user, navigate]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4">
      <div className="text-center mb-8">
        <Link to="/" className="flex items-center justify-center">
          <div className="relative h-10 w-10 mr-2">
            <div className="absolute inset-0 bg-primary rounded-full opacity-20"></div>
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="h-5 w-5 bg-primary rounded-full"></div>
            </div>
          </div>
          <span className="text-2xl font-bold">Vamos Recuperar</span>
        </Link>
        <p className="mt-2 text-muted-foreground">
          Junta-te ao Vamos Recuperar para reportares ocorrências e ajudares a melhorar a tua comunidade
        </p>
      </div>
      <SignupForm />
    </div>
  );
};

export default Signup;
