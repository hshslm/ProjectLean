import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { invokeEdgeFunction } from '@/lib/edge-functions';
import projectLeanLogo from '@/assets/project-lean-logo.png';

interface ValidationResult {
  valid: boolean;
  email?: string;
  error?: string;
}

const SetPassword = () => {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isValidating, setIsValidating] = useState(true);
  const [validationResult, setValidationResult] = useState<ValidationResult | null>(null);
  const [email, setEmail] = useState('');
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  useEffect(() => {
    const validateToken = async () => {
      const token = searchParams.get('token');
      
      if (!token) {
        setValidationResult({ valid: false, error: 'No invitation token provided' });
        setIsValidating(false);
        return;
      }

      try {
        const { data, status, error } = await invokeEdgeFunction('validate-invitation', { token });

        if (error) {
          const msg = status === 401
            ? 'This invitation link has expired or is invalid.'
            : 'Failed to validate invitation. Please try again.';
          setValidationResult({ valid: false, error: msg });
        } else if (data.valid) {
          setValidationResult({ valid: true });
          setEmail(data.email || '');
        } else {
          setValidationResult({ valid: false, error: data.error });
        }
      } catch (err: any) {
        const msg = !navigator.onLine
          ? 'You\'re offline. Please check your connection.'
          : 'Failed to validate invitation. Please try again.';
        setValidationResult({ valid: false, error: msg });
      }
      
      setIsValidating(false);
    };

    validateToken();
  }, [searchParams]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!password || !confirmPassword) {
      toast.error('Please fill in all fields');
      return;
    }

    if (password !== confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }

    if (password.length < 6) {
      toast.error('Password must be at least 6 characters');
      return;
    }

    setIsLoading(true);

    try {
      const token = searchParams.get('token');
      const { data, status, error } = await invokeEdgeFunction('validate-invitation', {
        token,
        newPassword: password,
      });

      if (error || !data?.success) {
        switch (status) {
          case 401:
            toast.error('This invitation link has expired. Please request a new one.');
            break;
          case 429:
            toast.error(error);
            break;
          default:
            toast.error(error || data?.error || 'Failed to set password. Please try again.');
        }
        setIsLoading(false);
        return;
      }

      toast.success('Password set successfully! You can now log in.');
      navigate('/auth');
    } catch (err: any) {
      console.error('Set password error:', err);
      toast.error(!navigator.onLine ? 'You\'re offline. Please check your connection.' : 'Failed to set password. Please try again.');
    }

    setIsLoading(false);
  };

  if (isValidating) {
    return (
      <div className="min-h-screen gradient-warm flex items-center justify-center px-4">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Verifying invitation link...</p>
        </div>
      </div>
    );
  }

  if (!validationResult?.valid) {
    return (
      <div className="min-h-screen gradient-warm flex items-center justify-center px-4">
        <div className="w-full max-w-sm space-y-8 text-center">
          <img 
            src={projectLeanLogo} 
            alt="Project Lean" 
            className="h-16 mx-auto mb-6"
          />
          <h1 className="font-display text-2xl font-bold text-foreground">
            Invalid or Expired Link
          </h1>
          <p className="text-muted-foreground">
            {validationResult?.error || 'This invitation link is invalid or has expired. Please contact your coach for a new link.'}
          </p>
          <Button
            variant="coral"
            onClick={() => navigate('/auth')}
            className="w-full"
          >
            Back to Sign In
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen gradient-warm flex items-center justify-center px-4">
      <div className="w-full max-w-sm space-y-8">
        <div className="text-center">
          <img 
            src={projectLeanLogo} 
            alt="Project Lean" 
            className="h-16 mx-auto mb-6"
          />
          <h1 className="font-display text-2xl font-bold text-foreground">
            Welcome to Project Lean!
          </h1>
          <p className="text-muted-foreground text-sm mt-2">
            Set your password to get started
          </p>
          {email && (
            <p className="text-sm text-foreground mt-2">
              Account: <strong>{email}</strong>
            </p>
          )}
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={isLoading}
              className="rounded-xl"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="confirmPassword">Confirm Password</Label>
            <Input
              id="confirmPassword"
              type="password"
              placeholder="••••••••"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              disabled={isLoading}
              className="rounded-xl"
            />
          </div>

          <Button
            type="submit"
            variant="coral"
            size="lg"
            className="w-full"
            disabled={isLoading}
          >
            {isLoading ? 'Setting Password...' : 'Set Password & Continue'}
          </Button>
        </form>
      </div>
    </div>
  );
};

export default SetPassword;
