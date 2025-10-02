import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Link } from "react-router-dom";
import { Users, Database, Shield, Mail } from "lucide-react";

const Index = () => {
  return (
    <div className="min-h-screen bg-background">
      <header className="border-b">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <img 
                src="/alist-logo-new.svg" 
                alt="Alist Logo" 
                className="h-12 w-12"
              />
              <div>
                <h1 className="text-2xl font-bold">Alist</h1>
                <p className="text-muted-foreground">People, Notes, Tasks</p>
              </div>
            </div>
            <Link to="/auth">
              <Button>Sign In</Button>
            </Link>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-16">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold mb-4">Manage Your Contacts Effectively</h2>
          <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
            Alist helps you organize, track, and manage your professional contacts with powerful features and an intuitive interface.
          </p>
          <Link to="/auth">
            <Button size="lg" className="text-lg px-8 py-3">
              Get Started
            </Button>
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Contact Management
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                Store and organize all your professional contacts with detailed information and categories.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Database className="h-5 w-5" />
                Data Import
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                Easily import your existing contact data using CSV files with intelligent field mapping.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                Secure Access
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                Admin-approved accounts ensure only authorized users can access your valuable contact data.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Mail className="h-5 w-5" />
                Communication
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                Quick access to email and LinkedIn profiles for seamless professional communication.
              </p>
            </CardContent>
          </Card>
        </div>

        <div className="text-center">
          <h3 className="text-2xl font-bold mb-4">Ready to get started?</h3>
          <p className="text-muted-foreground mb-6">
            Sign up for an account and get admin approval to start managing your contacts.
          </p>
          <Link to="/auth">
            <Button size="lg" variant="outline">
              Create Account
            </Button>
          </Link>
        </div>
      </main>
    </div>
  );
};

export default Index;
