import { useState } from 'react';
import { User, Phone, Lock, ArrowRight, Eye, EyeOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface BasicDetailsFormProps {
  onSubmit: (data: { name: string; phone: string; password: string }) => void;
}

export const BasicDetailsForm = ({ onSubmit }: BasicDetailsFormProps) => {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState<{ name?: string; phone?: string; password?: string }>({});

  const validatePhone = (value: string) => {
    const phoneRegex = /^[+]?[(]?[0-9]{1,4}[)]?[-\s./0-9]*$/;
    return value.length >= 10 && phoneRegex.test(value);
  };

  const validatePassword = (value: string) => {
    return value.length >= 6;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const newErrors: { name?: string; phone?: string; password?: string } = {};

    if (!name.trim()) {
      newErrors.name = 'Name is required';
    }

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

    onSubmit({ name: name.trim(), phone: phone.trim(), password });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6 slide-up">
      <div className="text-center mb-8">
        <h1 className="text-2xl font-bold text-foreground mb-2">
          Create Account
        </h1>
        <p className="text-muted-foreground">
          Please provide your details to register
        </p>
      </div>

      <div className="space-y-4">
        {/* Name Field */}
        <div className="space-y-2">
          <Label htmlFor="name" className="text-sm font-medium">
            Full Name
          </Label>
          <div className="relative">
            <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <Input
              id="name"
              type="text"
              placeholder="Enter your full name"
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                if (errors.name) setErrors({ ...errors, name: undefined });
              }}
              className={`pl-11 h-12 ${errors.name ? 'border-destructive' : ''}`}
            />
          </div>
          {errors.name && (
            <p className="text-xs text-destructive">{errors.name}</p>
          )}
        </div>

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
              placeholder="Create a password"
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
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
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
          <p className="text-xs text-muted-foreground">
            Must be at least 6 characters
          </p>
        </div>
      </div>

      <Button 
        type="submit" 
        className="w-full h-12 text-base font-semibold shadow-lg shadow-primary/25"
      >
        Continue
        <ArrowRight className="w-5 h-5 ml-2" />
      </Button>
    </form>
  );
};
