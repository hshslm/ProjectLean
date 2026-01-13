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
      navigate('/app');
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
        navigate('/app');
      }
    }
    
    setIsLoading(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-cream via-background to-cream-dark flex items-center justify-center px-4 py-8 relative overflow-hidden">
      {/* Background decorations */}
      <div className="absolute top-0 left-0 w-96 h-96 bg-sage/10 rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2" />
      <div className="absolute bottom-0 right-0 w-96 h-96 bg-coral/10 rounded-full blur-3xl translate-x-1/2 translate-y-1/2" />
      
      <div className="w-full max-w-md relative">
        {/* Card container */}
        <div className="bg-card/80 backdrop-blur-sm rounded-3xl shadow-elevated border border-border/50 p-8 md:p-10">
          {/* Logo */}
          <div className="text-center mb-8">
            <img 
              src={projectLeanLogo} 
              alt="Project Lean" 
              className="h-14 mx-auto mb-8"
            />
            <h1 className="font-display text-3xl font-bold text-foreground mb-2">
              {isForgotPassword ? 'Reset Password' : isSignUp ? 'Create your account' : 'Welcome back'}
            </h1>
            <p className="text-muted-foreground">
              {isForgotPassword 
                ? 'Enter your email to receive a reset link' 
                : isSignUp 
                  ? 'Get 6 free meal scans to start' 
                  : 'Sign in to continue'}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {isSignUp && !isForgotPassword && (
              <div className="space-y-2">
                <Label htmlFor="fullName" className="text-sm font-medium">Full Name</Label>
                <Input
                  id="fullName"
                  type="text"
                  placeholder="John Doe"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  disabled={isLoading}
                  className="h-12 rounded-xl bg-background/50 border-border/50 focus:border-sage focus:ring-sage/20 transition-all"
                />
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="email" className="text-sm font-medium">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="your@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={isLoading}
                className="h-12 rounded-xl bg-background/50 border-border/50 focus:border-sage focus:ring-sage/20 transition-all"
              />
            </div>

            {!isForgotPassword && (
              <div className="space-y-2">
                <Label htmlFor="password" className="text-sm font-medium">Password</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={isLoading}
                  className="h-12 rounded-xl bg-background/50 border-border/50 focus:border-sage focus:ring-sage/20 transition-all"
                />
              </div>
            )}

            <Button
              type="submit"
              variant="coral"
              size="lg"
              className="w-full h-12 text-base font-semibold rounded-xl shadow-md hover:shadow-lg transition-all mt-2"
              disabled={isLoading}
            >
              {isLoading 
                ? (isForgotPassword ? 'Sending...' : isSignUp ? 'Creating account...' : 'Signing in...') 
                : (isForgotPassword ? 'Send Reset Link' : isSignUp ? 'Create Account' : 'Sign in')
              }
            </Button>
          </form>

          {!isSignUp && !isForgotPassword && (
            <div className="text-center mt-6">
              <button
                type="button"
                onClick={() => setIsForgotPassword(true)}
                className="text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                Forgot your password?
              </button>
            </div>
          )}

          <div className="text-center mt-6 pt-6 border-t border-border/50">
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
              className="text-sm font-medium text-coral hover:text-coral-light transition-colors"
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
    </div>
  );
};

export default Auth;
