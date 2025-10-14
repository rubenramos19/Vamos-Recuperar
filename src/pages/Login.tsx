
import React, { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import LoginForm from "@/components/auth/LoginForm";
import { useAuth } from "@/contexts/AuthContext";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Shield, User, Loader2 } from "lucide-react";

const Login = () => {
  const { user, isAdmin, login } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [adminEmail, setAdminEmail] = useState("");
  const [adminPassword, setAdminPassword] = useState("");
  const [isAdminLoading, setIsAdminLoading] = useState(false);

  // Redirect if already logged in
  useEffect(() => {
    if (user && isAdmin()) {
      navigate("/admin");
    } else if (user) {
      navigate("/");
    }
  }, [user, isAdmin, navigate]);

  const handleAdminLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsAdminLoading(true);

    try {
      await login(adminEmail, adminPassword);
      
      // Wait for auth state to update
      setTimeout(() => {
        if (!isAdmin()) {
          toast({
            variant: "destructive",
            title: "Access Denied",
            description: "You do not have administrator privileges.",
          });
          setIsAdminLoading(false);
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
      setIsAdminLoading(false);
    }
  };

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
          <span className="text-2xl font-bold">CivicSpot</span>
        </Link>
        <p className="mt-2 text-muted-foreground">
          Report and track community issues in your area
        </p>
      </div>

      <Tabs defaultValue="user" className="w-full max-w-md">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="user" className="flex items-center gap-2">
            <User className="h-4 w-4" />
            User Login
          </TabsTrigger>
          <TabsTrigger value="admin" className="flex items-center gap-2">
            <Shield className="h-4 w-4" />
            Admin Login
          </TabsTrigger>
        </TabsList>

        <TabsContent value="user">
          <LoginForm />
        </TabsContent>

        <TabsContent value="admin">
          <Card className="border-secondary/20">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5 text-secondary" />
                Administrator Access
              </CardTitle>
              <CardDescription>
                Enter your administrator credentials to access the dashboard
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleAdminLogin} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="admin-email">Email</Label>
                  <Input
                    id="admin-email"
                    type="email"
                    placeholder="admin@civicspot.com"
                    value={adminEmail}
                    onChange={(e) => setAdminEmail(e.target.value)}
                    required
                    disabled={isAdminLoading}
                    className="border-secondary/30 focus:border-secondary"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="admin-password">Password</Label>
                  <Input
                    id="admin-password"
                    type="password"
                    placeholder="••••••••"
                    value={adminPassword}
                    onChange={(e) => setAdminPassword(e.target.value)}
                    required
                    disabled={isAdminLoading}
                    className="border-secondary/30 focus:border-secondary"
                  />
                </div>
                <Button
                  type="submit"
                  className="w-full bg-secondary hover:bg-secondary/90 text-secondary-foreground"
                  disabled={isAdminLoading}
                >
                  {isAdminLoading ? (
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
              <p className="mt-4 text-xs text-muted-foreground text-center">
                This area is restricted to authorized administrators only.
              </p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Login;
