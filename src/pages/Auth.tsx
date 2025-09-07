import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
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
            <form onSubmit={handleAuth} className="space-y-4">
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