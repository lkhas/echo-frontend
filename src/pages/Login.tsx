import { LoginForm } from '@/components/LoginForm';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';
import { Shield } from 'lucide-react';
import { apiFetch } from '@/services/api';

const Login = () => {
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleLoginSubmit = async (data: { phone: string; password: string }) => {
    try {
      // 🔹 Call FastAPI backend
      const response = await apiFetch<{ access_token: string }>(
        '/auth/login',
        {
          method: 'POST',
          body: JSON.stringify({
            phone_number: data.phone,
            password: data.password,
          }),
        }
      );

      // 🔹 TEMP (until cookies are used)
      localStorage.setItem('access_token', response.access_token);

      toast({
        title: 'Login successful',
        description: 'Welcome back to your account.',
      });

      navigate('/observation');
    } catch (error: any) {
      toast({
        title: 'Login failed',
        description: error.message || 'Invalid phone number or password.',
        variant: 'destructive',
      });
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-accent/30 flex flex-col">
      <div className="max-w-md mx-auto px-4 py-8 flex-1 flex flex-col justify-center w-full">

        {/* Hero Header */}
        <div className="text-center mb-8 slide-up">
          <div className="relative inline-flex items-center justify-center mb-4">
            <div className="absolute w-20 h-20 bg-primary/10 rounded-full animate-pulse" />
            <div className="relative w-16 h-16 bg-gradient-to-br from-primary to-primary/80 rounded-2xl flex items-center justify-center shadow-lg shadow-primary/30 rotate-3 hover:rotate-0 transition-transform duration-300">
              <Shield className="w-8 h-8 text-primary-foreground" />
            </div>
          </div>
          <h2 className="text-sm font-semibold text-primary tracking-wider uppercase mb-1">
            Problem Reporter
          </h2>
          <p className="text-xs text-muted-foreground">
            Report issues in your community
          </p>
        </div>

        {/* Form Container */}
        <div className="glass-card rounded-2xl p-6 shadow-xl shadow-primary/5 border border-border/60">
          <LoginForm onSubmit={handleLoginSubmit} />
        </div>

        {/* Trust Badges */}
        <div className="flex items-center justify-center gap-6 mt-8 fade-in">
          <div className="flex items-center gap-1.5 text-muted-foreground">
            <div className="w-2 h-2 rounded-full bg-success" />
            <span className="text-xs">Secure</span>
          </div>
          <div className="flex items-center gap-1.5 text-muted-foreground">
            <div className="w-2 h-2 rounded-full bg-primary" />
            <span className="text-xs">Encrypted</span>
          </div>
          <div className="flex items-center gap-1.5 text-muted-foreground">
            <div className="w-2 h-2 rounded-full bg-warning" />
            <span className="text-xs">Private</span>
          </div>
        </div>

        {/* Footer */}
        <p className="text-center text-xs text-muted-foreground mt-6">
          Your data is secure and will only be used to authenticate you
        </p>
      </div>
    </div>
  );
};

export default Login;
