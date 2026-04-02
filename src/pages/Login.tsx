import { useState } from 'react'; // Added useState
import { LoginForm } from '@/components/LoginForm';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';
import { Shield, Loader2 } from 'lucide-react'; // Added Loader2
import { apiFetch } from '@/services/api';

const Login = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false); // New Loading State

  const handleLoginSubmit = async (data: { phone: string; password: string }) => {
    setIsLoading(true); // Start loading
    try {
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
    } finally {
      setIsLoading(false); // Stop loading
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-accent/30 flex flex-col">
      <div className="max-w-md mx-auto px-4 py-8 flex-1 flex flex-col justify-center w-full">
        <div className="text-center mb-8 slide-up">
          <div className="relative inline-flex items-center justify-center mb-4">
            <div className="absolute w-20 h-20 bg-primary/10 rounded-full animate-pulse" />
            <div className="relative w-16 h-16 bg-gradient-to-br from-primary to-primary/80 rounded-2xl flex items-center justify-center shadow-lg shadow-primary/30 rotate-3 hover:rotate-0 transition-transform duration-300">
              {isLoading ? (
                <Loader2 className="w-8 h-8 text-primary-foreground animate-spin" />
              ) : (
                <Shield className="w-8 h-8 text-primary-foreground" />
              )}
            </div>
          </div>
          <h2 className="text-sm font-semibold text-primary tracking-wider uppercase mb-1">
            Problem Reporter
          </h2>
          <p className="text-xs text-muted-foreground">
            {isLoading ? 'Verifying credentials...' : 'Report issues in your community'}
          </p>
        </div>

        <div className="glass-card rounded-2xl p-6 shadow-xl shadow-primary/5 border border-border/60">
          <LoginForm onSubmit={handleLoginSubmit} isLoading={isLoading} />
        </div>

        {/* ... rest of your badges and footer */}
      </div>
    </div>
  );
};

export default Login;