import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { Mail, Lock, User, ArrowLeft } from "lucide-react";

const Auth = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();
  const { login, refreshUser, isAuthenticated } = useAuth();

  // Frontend version logging
  console.log("🚀 FRONTEND VERSION: 12.0 - SIDEBAR NAVIGATION");
  console.log("🔍 Auth page loaded with sidebar navigation");

  const handleGoogleAuth = async () => {
    setLoading(true);
    
    try {
      // Get Google OAuth authorization URL
      const response = await fetch(`${import.meta.env.VITE_API_URL}/auth/google`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Failed to initiate Google authentication');
      }

      const data = await response.json();
      const { authorization_url } = data;

      // Open Google OAuth in a popup window
      const popup = window.open(
        authorization_url,
        'googleAuth',
        'width=500,height=600,scrollbars=yes,resizable=yes'
      );

      // Listen for the popup to close or receive a message
      const checkClosed = setInterval(() => {
        if (popup?.closed) {
          clearInterval(checkClosed);
          setLoading(false);
          // Check if user was authenticated by refreshing user data
          // The actual authentication will be handled by the callback
        }
      }, 1000);

      // Listen for messages from the popup
      const messageListener = async (event: MessageEvent) => {
        if (event.origin !== window.location.origin) return;
        
        if (event.data.type === 'GOOGLE_AUTH_SUCCESS') {
          clearInterval(checkClosed);
          window.removeEventListener('message', messageListener);
          popup?.close();
          
          // Store the auth data
          const { user, access_token } = event.data;
          localStorage.setItem('auth_token', access_token);
          localStorage.setItem('auth_user', JSON.stringify(user));
          
          // Update the auth context
          await refreshUser();
          
          toast({
            title: "Welcome!",
            description: "Successfully signed in with Google.",
          });
          
          navigate("/dashboard");
          setLoading(false);
        } else if (event.data.type === 'GOOGLE_AUTH_ERROR') {
          clearInterval(checkClosed);
          window.removeEventListener('message', messageListener);
          popup?.close();
          
          toast({
            title: "Google Auth Failed",
            description: event.data.error || "Authentication failed",
            variant: "destructive",
          });
          setLoading(false);
        }
      };

      window.addEventListener('message', messageListener);

    } catch (error: any) {
      console.error("Google Auth error:", error);
      toast({
        title: "Error", 
        description: error.message || "An unexpected error occurred",
        variant: "destructive",
      });
      setLoading(false);
    }
  };

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (isLogin) {
        console.log("Attempting login with:", email);
        const success = await login(email, password);

        if (success) {
          console.log("Login successful");
          toast({
            title: "Welcome back!",
            description: "Successfully signed in.",
          });
          navigate("/dashboard");
        } else {
          console.log("Login failed");
          toast({
            title: "Login Failed",
            description: "Invalid email or password.",
            variant: "destructive",
          });
        }
      } else {
        console.log("Attempting registration with:", email);
        const response = await fetch(`${import.meta.env.VITE_API_URL}/auth/register`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            email,
            password,
            full_name: fullName,
          }),
        });

        const data = await response.json();

        if (response.ok) {
          if (data.requires_approval) {
            toast({
              title: "Registration Successful!",
              description: "Your account is pending admin approval. Please check back later or contact an administrator.",
              variant: "default",
            });
            // Switch to login mode
            setIsLogin(true);
            setEmail("");
            setPassword("");
            setFullName("");
          } else {
            // Auto-approved user
            toast({
              title: "Welcome!",
              description: "Account created and approved successfully.",
              variant: "default",
            });
            navigate("/dashboard");
          }
        } else {
          toast({
            title: "Registration Failed",
            description: data.error || "An error occurred during registration.",
            variant: "destructive",
          });
        }
      }
    } catch (error: any) {
      console.error("Catch block error:", error);
      let errorMessage = "An error occurred during authentication.";
      
      if (error.message) {
        errorMessage = error.message;
      }

      toast({
        title: "Authentication Error",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-md">

        <Card>
          <CardHeader className="text-center">
            <CardTitle className="flex items-center justify-center">
              <img 
                src="/alist-logo-new.svg" 
                alt="A-List Logo" 
                className="h-16 w-16"
              />
            </CardTitle>
            <p className="text-muted-foreground">
              {isLogin ? "Sign in to your account" : "Create a new account"}
            </p>
          </CardHeader>
          <CardContent>
            {/* Google Auth Button */}
            <Button 
              onClick={handleGoogleAuth} 
              disabled={loading}
              variant="outline" 
              className="w-full mb-6"
            >
              <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                />
              </svg>
              Continue with Google
            </Button>
            
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <Separator className="w-full" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-background px-2 text-muted-foreground">
                  Or continue with email
                </span>
              </div>
            </div>

            <form onSubmit={handleAuth} className="space-y-4 mt-6">
              {!isLogin && (
                <div className="space-y-2">
                  <Label htmlFor="fullName">Full Name</Label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="fullName"
                      type="text"
                      placeholder="Enter your full name"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      required={!isLogin}
                      className="pl-10"
                    />
                  </div>
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="Enter your email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="pl-10"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="password"
                    type="password"
                    placeholder="Enter your password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className="pl-10"
                  />
                </div>
              </div>

              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? "Processing..." : isLogin ? "Sign In" : "Sign Up"}
              </Button>
            </form>

            <div className="mt-4 text-center">
              <Button
                variant="link"
                onClick={() => setIsLogin(!isLogin)}
                className="text-sm"
              >
                {isLogin 
                  ? "Don't have an account? Sign up" 
                  : "Already have an account? Sign in"
                }
              </Button>
            </div>

            {!isLogin && (
              <div className="mt-4 p-3 bg-muted rounded-lg">
                <p className="text-xs text-muted-foreground text-center">
                  New accounts require admin approval. Please wait for approval from the administrator.
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Auth;