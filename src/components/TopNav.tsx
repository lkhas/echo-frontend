import { useNavigate, useLocation } from 'react-router-dom';
import { LayoutDashboard, Plus, ImageIcon, LogOut, User, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ThemeToggle } from '@/components/ThemeToggle';

const navItems = [
  { label: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { label: 'New Report', href: '/observation', icon: Plus, isPrimary: true },
  { label: 'Gallery', href: '/gallery', icon: ImageIcon },
];

export const TopNav = () => {
  const navigate = useNavigate();
  const location = useLocation();

  return (
    <nav className="sticky top-0 z-50 w-full">
      {/* Backdrop blur layer */}
      <div className="absolute inset-0 bg-background/80 backdrop-blur-xl border-b border-violet-500/10" />
      
      {/* Purple gradient accent line at top */}
      <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-violet-500 to-transparent opacity-60" />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
        {/* Logo / Brand */}
        <div className="flex items-center gap-3">
          <div className="relative">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-violet-500 to-purple-700 flex items-center justify-center shadow-lg shadow-violet-500/30">
              <Zap className="w-4.5 h-4.5 text-white" strokeWidth={2.5} />
            </div>
            <div className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-emerald-400 rounded-full border-2 border-background" />
          </div>
          <div className="hidden sm:block">
            <p className="text-sm font-bold text-foreground tracking-tight leading-none">ECHO</p>
            <p className="text-[10px] text-violet-500/70 font-medium tracking-widest uppercase leading-none mt-0.5"> Evidence Collection Human Observation</p>
          </div>
        </div>

        {/* Center nav links */}
        <div className="hidden md:flex items-center gap-1 px-2 py-1.5 rounded-2xl bg-muted/40 border border-border/40">
          {navItems.map((item) => {
            const isActive = location.pathname === item.href;
            const Icon = item.icon;
            return (
              <button
                key={item.href}
                onClick={() => navigate(item.href)}
                className={`
                  flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200
                  ${item.isPrimary
                    ? 'bg-gradient-to-r from-violet-500 to-purple-600 text-white shadow-md shadow-violet-500/30 hover:shadow-violet-500/50 hover:scale-[1.02]'
                    : isActive
                    ? 'bg-background text-violet-600 dark:text-violet-400 shadow-sm border border-border/60'
                    : 'text-muted-foreground hover:text-foreground hover:bg-background/60'
                  }
                `}
              >
                <Icon className="w-3.5 h-3.5" />
                {item.label}
              </button>
            );
          })}
        </div>

        {/* Right controls */}
        <div className="flex items-center gap-2">
          {/* User pill */}
          <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-violet-500/5 border border-violet-500/15">
            <div className="w-6 h-6 rounded-full bg-gradient-to-br from-violet-400 to-purple-600 flex items-center justify-center">
              <User className="w-3 h-3 text-white" />
            </div>
            <span className="text-xs font-medium text-foreground">Admin</span>
          </div>

          <ThemeToggle />

          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate('/login')}
            className="rounded-xl gap-1.5 text-xs text-muted-foreground hover:text-destructive hover:bg-destructive/8 transition-all"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Logout</span>
          </Button>
        </div>
      </div>

      {/* Mobile bottom nav items */}
      <div className="md:hidden relative flex items-center justify-center gap-1 px-4 pb-2 border-t border-border/30 bg-background/60">
        {navItems.map((item) => {
          const isActive = location.pathname === item.href;
          const Icon = item.icon;
          return (
            <button
              key={item.href}
              onClick={() => navigate(item.href)}
              className={`
                flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-medium transition-all
                ${item.isPrimary
                  ? 'bg-gradient-to-r from-violet-500 to-purple-600 text-white shadow-md shadow-violet-500/20'
                  : isActive
                  ? 'text-violet-600 bg-violet-500/8'
                  : 'text-muted-foreground'
                }
              `}
            >
              <Icon className="w-3.5 h-3.5" />
              {item.label}
            </button>
          );
        })}
      </div>
    </nav>
  );
};
