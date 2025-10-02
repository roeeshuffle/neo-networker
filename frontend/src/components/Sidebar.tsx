import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { LogOut, Settings, User } from "lucide-react";
import alistLogo from "@/assets/alist-logo-new.svg";

interface SidebarProps {
  className?: string;
}

const Sidebar = ({ className = "" }: SidebarProps) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await logout();
      navigate("/auth");
    } catch (error) {
      console.error("Logout failed:", error);
    }
  };

  const isAdmin = user?.email && ['guy@wershuffle.com', 'roee2912@gmail.com'].includes(user.email);

  return (
    <aside className={`w-16 border-r border-border-soft bg-card/80 backdrop-blur-md sticky top-0 z-50 h-screen flex flex-col items-center py-6 space-y-6 ${className}`}>
      {/* Logo */}
      <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center shadow-lg">
        <img 
          src={alistLogo} 
          alt="Alist Logo" 
          className="h-8 w-8 object-contain"
        />
      </div>

      {/* User Info */}
      <div className="flex flex-col items-center space-y-2">
        <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center">
          <User className="h-4 w-4 text-primary" />
        </div>
        <div className="text-xs text-center text-muted-foreground max-w-12 break-words">
          {user?.email?.split('@')[0] || 'User'}
        </div>
      </div>

      {/* Admin Panel Button */}
      {isAdmin && (
        <Button 
          onClick={() => navigate('/admin')}
          variant="ghost" 
          size="sm"
          className="w-10 h-10 p-0 hover:bg-primary/10"
          title="Admin Panel"
        >
          <Settings className="h-4 w-4" />
        </Button>
      )}

      {/* Spacer */}
      <div className="flex-1" />

      {/* Logout Button */}
      <Button 
        onClick={handleLogout} 
        variant="ghost" 
        size="sm"
        className="w-10 h-10 p-0 hover:bg-destructive/10 hover:text-destructive"
        title="Logout"
      >
        <LogOut className="h-4 w-4" />
      </Button>
    </aside>
  );
};

export default Sidebar;
