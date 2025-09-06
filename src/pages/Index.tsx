import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

const Index = () => {
  const navigate = useNavigate();

  useEffect(() => {
    // Check if user is already logged in
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        navigate("/dashboard");
      }
    });
  }, [navigate]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <Card className="w-full max-w-lg text-center">
        <CardHeader>
          <CardTitle className="text-3xl font-bold">VC Search Engine</CardTitle>
          <CardDescription className="text-lg">
            Manage and search your professional network database
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="text-muted-foreground">
            <p>Store and organize information about people and companies</p>
            <p>Search by hashtags, career, and professional specialties</p>
            <p>Integrate with Telegram for easy access</p>
          </div>
          <Button 
            onClick={() => navigate("/auth")}
            size="lg"
            className="w-full"
          >
            Get Started
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default Index;
