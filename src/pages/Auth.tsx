import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import projectLeanLogo from '@/assets/project-lean-logo.png';

const Auth = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSignUp, setIsSignUp] = useState(false);
  const [isForgotPassword, setIsForgotPassword] = useState(false);
  const { user, signIn, signUp, resetPassword } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (user) {
      navigate('/');
    }
  }, [user, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email) {
      toast.error('Please enter your email');
      return;
    }

    if (isForgotPassword) {
      setIsLoading(true);
      const { error } = await resetPassword(email);
      if (error) {
        toast.error(error.message || 'Failed to send reset email');
      } else {
        toast.success('Password reset email sent! Check your inbox.');
        setIsForgotPassword(false);
      }
      setIsLoading(false);
      return;
    }

    if (!password) {
      toast.error('Please enter your password');
      return;
    }

    if (isSignUp && !fullName) {
      toast.error('Please enter your name');
      return;
    }

    setIsLoading(true);

    if (isSignUp) {
      const { error } = await signUp(email, password, fullName);
      if (error) {
        toast.error(error.message || 'Failed to create account');
      } else {
        toast.success('Account created! You can now sign in.');
        setIsSignUp(false);
        setPassword('');
      }
    } else {
      const { error } = await signIn(email, password);
      if (error) {
        toast.error(error.message || 'Invalid login credentials');
      } else {
        navigate('/');
      }
    }
    
    setIsLoading(false);
  };

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
            {isForgotPassword ? 'Reset Password' : isSignUp ? 'Create your account' : 'Welcome back'}
          </h1>
          <p className="text-muted-foreground text-sm mt-2">
            {isForgotPassword 
              ? 'Enter your email to receive a reset link' 
              : isSignUp 
                ? 'Get 6 free meal scans to start' 
                : 'Sign in to continue'}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {isSignUp && !isForgotPassword && (
            <div className="space-y-2">
              <Label htmlFor="fullName">Full Name</Label>
              <Input
                id="fullName"
                type="text"
                placeholder="John Doe"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                disabled={isLoading}
                className="rounded-xl"
              />
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              placeholder="your@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={isLoading}
              className="rounded-xl"
            />
          </div>

          {!isForgotPassword && (
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
          )}

          <Button
            type="submit"
            variant="coral"
            size="lg"
            className="w-full"
            disabled={isLoading}
          >
            {isLoading 
              ? (isForgotPassword ? 'Sending...' : isSignUp ? 'Creating account...' : 'Signing in...') 
              : (isForgotPassword ? 'Send Reset Link' : isSignUp ? 'Create Account' : 'Sign in')
            }
          </Button>
        </form>

        {!isSignUp && !isForgotPassword && (
          <div className="text-center">
            <button
              type="button"
              onClick={() => setIsForgotPassword(true)}
              className="text-sm text-muted-foreground hover:text-primary hover:underline"
            >
              Forgot your password?
            </button>
          </div>
        )}

        <div className="text-center">
          <button
            type="button"
            onClick={() => {
              if (isForgotPassword) {
                setIsForgotPassword(false);
              } else {
                setIsSignUp(!isSignUp);
                setPassword('');
              }
            }}
            className="text-sm text-primary hover:underline"
          >
            {isForgotPassword 
              ? 'Back to sign in'
              : isSignUp 
                ? 'Already have an account? Sign in' 
                : "Don't have an account? Sign up for free"
            }
          </button>
        </div>
      </div>
    </div>
  );
};

export default Auth;
