import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
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

  const handleGoogleAuth = async () => {
    setLoading(true);
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/dashboard`,
        }
      });

      if (error) {
        toast({
          title: "Error",
          description: error.message,
          variant: "destructive",
        });
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "An unexpected error occurred",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (isLogin) {
        console.log("Attempting login with:", email);
        const { data, error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        console.log("Login response:", { data, error });

        if (error) {
          console.log("Login error:", error.message);
          
          // Check if it's an invalid credentials error
          if (error.message.includes("Invalid login credentials")) {
            console.log("Invalid credentials, checking if user exists...");
            
            try {
              // Check if user exists but is not approved
              const { data: profile, error: profileError } = await supabase
                .from('profiles')
                .select('is_approved, email')
                .eq('email', email)
                .single();

              console.log("Profile check result:", { profile, profileError });

              if (profile) {
                if (!profile.is_approved) {
                  console.log("User exists but not approved");
                  toast({
                    title: "Account Pending Approval",
                    description: "Your account is waiting for admin approval. You will receive an email once approved.",
                    variant: "destructive",
                  });
                  setLoading(false);
                  return;
                }
                // If user is approved but still getting invalid credentials, it's a password issue
                console.log("User is approved but wrong password");
                toast({
                  title: "Invalid Password",
                  description: "The password you entered is incorrect.",
                  variant: "destructive",
                });
                setLoading(false);
                return;
              } else {
                console.log("User not found in profiles");
                toast({
                  title: "User Not Found",
                  description: "No account found with this email address. Please sign up first.",
                  variant: "destructive",
                });
                setLoading(false);
                return;
              }
            } catch (profileError) {
              console.error("Error checking profile:", profileError);
              // If we can't check the profile, show generic error
              toast({
                title: "Login Failed",
                description: "Invalid email or password.",
                variant: "destructive",
              });
              setLoading(false);
              return;
            }
          } else {
            // Other auth errors
            console.log("Other auth error:", error.message);
            toast({
              title: "Login Failed",
              description: error.message,
              variant: "destructive",
            });
            setLoading(false);
            return;
          }
        }

        if (data.user) {
          console.log("User logged in successfully, checking approval...");
          // Double-check approval status after successful auth
          const { data: profile, error: profileError } = await supabase
            .from('profiles')
            .select('is_approved')
            .eq('id', data.user.id)
            .single();

          if (profileError) {
            console.error("Error checking approval:", profileError);
            throw profileError;
          }

          if (!profile?.is_approved) {
            console.log("User not approved, signing out");
            await supabase.auth.signOut();
            toast({
              title: "Account Pending Approval",
              description: "Your account is pending admin approval. You will receive an email once approved.",
              variant: "destructive",
            });
            setLoading(false);
            return;
          }

          console.log("User approved, navigating to dashboard");
          toast({
            title: "Welcome back!",
            description: "Successfully signed in.",
          });
          navigate("/dashboard");
        }
      } else {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: `${window.location.origin}/dashboard`,
            data: {
              full_name: fullName,
            }
          }
        });

        if (error) throw error;

        toast({
          title: "Registration Submitted",
          description: "Your registration has been submitted for admin approval. Please wait for approval.",
        });
        
        setIsLogin(true);
        setEmail("");
        setPassword("");
        setFullName("");
      }
    } catch (error: any) {
      console.error("Catch block error:", error);
      let errorMessage = "An error occurred during authentication.";
      
      if (error.message.includes("Invalid login credentials")) {
        errorMessage = "Invalid email or password.";
      } else if (error.message.includes("User already registered")) {
        errorMessage = "This email is already registered. Please sign in instead.";
      } else if (error.message.includes("Password should be at least")) {
        errorMessage = "Password should be at least 6 characters long.";
      } else if (error.message) {
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
        <div className="flex items-center gap-4 mb-8">
          <Link to="/">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Home
            </Button>
          </Link>
        </div>

        <Card>
          <CardHeader className="text-center">
            <CardTitle className="flex items-center justify-center gap-2">
              <img 
                src="/lovable-uploads/756c1423-2a04-4806-8117-719d07336118.png" 
                alt="VCrm Logo" 
                className="h-8 w-8"
              />
              VCrm
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