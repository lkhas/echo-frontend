import { useState } from 'react';
import { Phone, Lock, ArrowRight, Eye, EyeOff, Loader2 } from 'lucide-react'; // Added Loader2
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Link } from 'react-router-dom';

interface LoginFormProps {
  onSubmit: (data: { phone: string; password: string }) => void;
  isLoading?: boolean; // Added isLoading prop
}

export const LoginForm = ({ onSubmit, isLoading }: LoginFormProps) => {
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState<{ phone?: string; password?: string }>({});

  const validatePhone = (value: string) => {
    const phoneRegex = /^[+]?[(]?[0-9]{1,4}[)]?[-\s./0-9]*$/;
    return value.length >= 10 && phoneRegex.test(value);
  };

  const validatePassword = (value: string) => {
    return value.length >= 6;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isLoading) return; // Prevent submission if already loading

    const newErrors: { phone?: string; password?: string } = {};

    if (!phone.trim()) {
      newErrors.phone = 'Phone number is required';
    } else if (!validatePhone(phone)) {
      newErrors.phone = 'Please enter a valid phone number';
    }

    if (!password.trim()) {
      newErrors.password = 'Password is required';
    } else if (!validatePassword(password)) {
      newErrors.password = 'Password must be at least 6 characters';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    onSubmit({ phone: phone.trim(), password });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6 slide-up">
      <div className="text-center mb-8">
        <h1 className="text-2xl font-bold text-foreground mb-2">
          Welcome Back
        </h1>
        <p className="text-muted-foreground">
          Sign in to your account
        </p>
      </div>

      <div className="space-y-4">
        {/* Phone Field */}
        <div className="space-y-2">
          <Label htmlFor="phone" className="text-sm font-medium">
            Phone Number
          </Label>
          <div className="relative">
            <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <Input
              id="phone"
              type="tel"
              placeholder="Enter your phone number"
              disabled={isLoading} // Disable input during loading
              value={phone}
              onChange={(e) => {
                setPhone(e.target.value);
                if (errors.phone) setErrors({ ...errors, phone: undefined });
              }}
              className={`pl-11 h-12 ${errors.phone ? 'border-destructive' : ''}`}
            />
          </div>
          {errors.phone && (
            <p className="text-xs text-destructive">{errors.phone}</p>
          )}
        </div>

        {/* Password Field */}
        <div className="space-y-2">
          <Label htmlFor="password" className="text-sm font-medium">
            Password
          </Label>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <Input
              id="password"
              type={showPassword ? 'text' : 'password'}
              placeholder="Enter your password"
              disabled={isLoading} // Disable input during loading
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                if (errors.password) setErrors({ ...errors, password: undefined });
              }}
              className={`pl-11 pr-11 h-12 ${errors.password ? 'border-destructive' : ''}`}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              disabled={isLoading}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors disabled:opacity-50"
            >
              {showPassword ? (
                <EyeOff className="w-5 h-5" />
              ) : (
                <Eye className="w-5 h-5" />
              )}
            </button>
          </div>
          {errors.password && (
            <p className="text-xs text-destructive">{errors.password}</p>
          )}
        </div>
      </div>

      <Button 
        type="submit" 
        disabled={isLoading} // Button becomes unclickable
        className="w-full h-12 text-base font-semibold shadow-lg shadow-primary/25 transition-all"
      >
        {isLoading ? (
          <>
            <Loader2 className="w-5 h-5 mr-2 animate-spin" />
            Verifying...
          </>
        ) : (
          <>
            Login
            <ArrowRight className="w-5 h-5 ml-2" />
          </>
        )}
      </Button>

      <p className="text-center text-sm text-muted-foreground">
        Don't have an account?{' '}
        <Link to="/Login" className="text-primary font-medium hover:underline">
          Register
        </Link>
      </p>
    </form>
  );
};