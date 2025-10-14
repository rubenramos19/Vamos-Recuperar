import React, { useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Shield, Loader2 } from "lucide-react";

const AdminLogin = () => {
  const { user, isAdmin, login } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [isLoading, setIsLoading] = React.useState(false);

  // Redirect if already logged in as admin
  useEffect(() => {
    if (user && isAdmin()) {
      navigate("/admin");
    } else if (user && !isAdmin()) {
      navigate("/");
    }
  }, [user, isAdmin, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      await login(email, password);
      
      // Wait a moment for auth state to update
      setTimeout(() => {
        // Check if user has admin role
        if (!isAdmin()) {
          toast({
            variant: "destructive",
            title: "Access Denied",
            description: "You do not have administrator privileges.",
          });
          setIsLoading(false);
          return;
        }

        toast({
          title: "Success",
          description: "Welcome to the admin dashboard.",
        });
        
        navigate("/admin");
      }, 500);
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Login Failed",
        description: error.message || "Invalid credentials. Please try again.",
      });
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 bg-gradient-to-br from-secondary/5 via-background to-primary/5">
      <div className="text-center mb-8">
        <Link to="/" className="flex items-center justify-center mb-4">
          <div className="relative h-12 w-12 mr-3">
            <div className="absolute inset-0 bg-secondary rounded-full opacity-20"></div>
            <div className="absolute inset-0 flex items-center justify-center">
              <Shield className="h-6 w-6 text-secondary" />
            </div>
          </div>
          <span className="text-2xl font-bold">CivicSpot Admin</span>
        </Link>
        <p className="text-muted-foreground">
          Administrator Access Portal
        </p>
      </div>

      <Card className="w-full max-w-md border-secondary/20">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold text-center">Admin Login</CardTitle>
          <CardDescription className="text-center">
            Enter your administrator credentials to access the dashboard
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="admin@civicspot.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={isLoading}
                className="border-secondary/30 focus:border-secondary"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                disabled={isLoading}
                className="border-secondary/30 focus:border-secondary"
              />
            </div>
            <Button
              type="submit"
              className="w-full bg-secondary hover:bg-secondary/90 text-secondary-foreground"
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Authenticating...
                </>
              ) : (
                <>
                  <Shield className="mr-2 h-4 w-4" />
                  Sign In as Admin
                </>
              )}
            </Button>
          </form>

          <div className="mt-6 text-center text-sm text-muted-foreground">
            <Link to="/login" className="text-primary hover:underline">
              Regular user login
            </Link>
          </div>
        </CardContent>
      </Card>

      <p className="mt-6 text-xs text-muted-foreground text-center max-w-md">
        This area is restricted to authorized administrators only. 
        All access attempts are logged for security purposes.
      </p>
    </div>
  );
};

export default AdminLogin;
