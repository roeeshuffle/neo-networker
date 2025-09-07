import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Link } from "react-router-dom";
import { Users, Database, Shield, Mail } from "lucide-react";
import vcrmLogoNew from "@/assets/vcrm-logo-new.png";

const Index = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-soft/20 via-background to-secondary-soft/20">
      <header className="border-b border-border-soft bg-card/80 backdrop-blur-md sticky top-0 z-50">
        <div className="container mx-auto px-6 py-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-5">
              <div className="w-12 h-12 rounded-xl bg-white flex items-center justify-center shadow-lg">
                <img 
                  src={vcrmLogoNew} 
                  alt="VCrm Logo" 
                  className="h-10 w-10 object-contain"
                />
              </div>
              <div>
                <h1 className="text-2xl font-bold tracking-tight">VCrm</h1>
                <p className="text-muted-foreground text-sm font-medium">Customer Relationship Management</p>
              </div>
            </div>
            <Link to="/auth">
              <Button className="shadow-lg">Sign In</Button>
            </Link>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-6 py-20">
        <div className="text-center mb-20">
          <h2 className="text-5xl font-bold mb-6 tracking-tight">Manage Your Contacts Effectively</h2>
          <p className="text-xl text-muted-foreground mb-10 max-w-3xl mx-auto leading-relaxed">
            VCrm helps you organize, track, and manage your professional contacts with powerful features and an intuitive, beautifully designed interface.
          </p>
          <Link to="/auth">
            <Button size="lg" className="text-lg px-10 py-4 h-14 shadow-xl">
              Get Started
            </Button>
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-20">
          <Card className="border-primary/20 bg-gradient-to-br from-primary-soft/30 to-primary-soft/10 hover:shadow-lg transition-all duration-300">
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center gap-3 text-primary-foreground">
                <div className="w-10 h-10 rounded-lg bg-primary/20 flex items-center justify-center">
                  <Users className="h-5 w-5 text-primary" />
                </div>
                Contact Management
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-primary-foreground/80 leading-relaxed">
                Store and organize all your professional contacts with detailed information and categories.
              </p>
            </CardContent>
          </Card>

          <Card className="border-secondary/20 bg-gradient-to-br from-secondary-soft/30 to-secondary-soft/10 hover:shadow-lg transition-all duration-300">
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center gap-3 text-secondary-foreground">
                <div className="w-10 h-10 rounded-lg bg-secondary/20 flex items-center justify-center">
                  <Database className="h-5 w-5 text-secondary" />
                </div>
                Data Import
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-secondary-foreground/80 leading-relaxed">
                Easily import your existing contact data using CSV files with intelligent field mapping.
              </p>
            </CardContent>
          </Card>

          <Card className="border-accent/20 bg-gradient-to-br from-accent-soft/30 to-accent-soft/10 hover:shadow-lg transition-all duration-300">
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center gap-3 text-accent-foreground">
                <div className="w-10 h-10 rounded-lg bg-accent/20 flex items-center justify-center">
                  <Shield className="h-5 w-5 text-accent" />
                </div>
                Secure Access
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-accent-foreground/80 leading-relaxed">
                Admin-approved accounts ensure only authorized users can access your valuable contact data.
              </p>
            </CardContent>
          </Card>

          <Card className="border-info/20 bg-gradient-to-br from-info-soft/30 to-info-soft/10 hover:shadow-lg transition-all duration-300">
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center gap-3 text-info-foreground">
                <div className="w-10 h-10 rounded-lg bg-info/20 flex items-center justify-center">
                  <Mail className="h-5 w-5 text-info" />
                </div>
                Communication
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-info-foreground/80 leading-relaxed">
                Quick access to email and LinkedIn profiles for seamless professional communication.
              </p>
            </CardContent>
          </Card>
        </div>

        <div className="text-center">
          <h3 className="text-3xl font-bold mb-6 tracking-tight">Ready to get started?</h3>
          <p className="text-lg text-muted-foreground mb-8 max-w-2xl mx-auto leading-relaxed">
            Sign up for an account and get admin approval to start managing your contacts with our beautiful, intuitive interface.
          </p>
          <Link to="/auth">
            <Button size="lg" variant="secondary" className="shadow-lg">
              Create Account
            </Button>
          </Link>
        </div>
      </main>
    </div>
  );
};

export default Index;
