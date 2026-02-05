 import { LoginForm } from '@/components/LoginForm';
 import { useNavigate } from 'react-router-dom';
 import { useToast } from '@/hooks/use-toast';

const Login = () => {
   const navigate = useNavigate();
   const { toast } = useToast();
 
  const handleLoginSubmit = (data: { phone: string; password: string }) => {
    console.log('Login submitted:', data);
     toast({
       title: "Login successful!",
       description: "Welcome back to your account.",
     });
     // Navigate to home after successful login
     navigate('/');
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-md mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-center mb-6">
          <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center">
            <svg
              className="w-6 h-6 text-primary-foreground"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
          </div>
        </div>

        {/* Form Container */}
        <div className="glass-card rounded-2xl p-6">
          <LoginForm onSubmit={handleLoginSubmit} />
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
