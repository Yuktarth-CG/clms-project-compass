import { Link, useNavigate } from 'react-router-dom';
import { isAuthenticated, clearAuthToken } from '@/lib/auth';
import { Button } from '@/components/ui/button';
import { LogIn, LogOut, Settings, LayoutDashboard, Inbox } from 'lucide-react';
import { ThemeToggle } from '@/components/ThemeToggle';

export const Header = () => {
  const navigate = useNavigate();
  const authenticated = isAuthenticated();

  const handleLogout = () => {
    clearAuthToken();
    navigate('/');
  };

  return (
    <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-50">
      <div className="container mx-auto px-4 h-14 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
            <LayoutDashboard className="w-4 h-4 text-primary-foreground" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-foreground tracking-tight">CLMS Planner</h1>
          </div>
        </Link>

        <nav className="flex items-center gap-2">
          <ThemeToggle />
          {authenticated ? (
            <>
              <Button variant="ghost" size="sm" asChild>
                <Link to="/pipeline">
                  <Inbox className="w-4 h-4 mr-2" />
                  Pipeline
                </Link>
              </Button>
              <Button variant="ghost" size="sm" asChild>
                <Link to="/admin">
                  <Settings className="w-4 h-4 mr-2" />
                  Admin
                </Link>
              </Button>
              <Button variant="ghost" size="sm" onClick={handleLogout}>
                <LogOut className="w-4 h-4 mr-2" />
                Logout
              </Button>
            </>
          ) : (
            <Button variant="ghost" size="sm" asChild>
              <Link to="/login">
                <LogIn className="w-4 h-4 mr-2" />
                Admin Login
              </Link>
            </Button>
          )}
        </nav>
      </div>
    </header>
  );
};