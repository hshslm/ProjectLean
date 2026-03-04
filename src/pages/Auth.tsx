import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { Camera, Sparkles, TrendingUp, Lock, Mail } from 'lucide-react';
import projectLeanLogo from '@/assets/project-lean-logo.png';

const Auth = () => {
  const [searchParams] = useSearchParams();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSignUp, setIsSignUp] = useState(searchParams.get('signup') === 'true');
  const [isForgotPassword, setIsForgotPassword] = useState(false);
  const [isResendVerification, setIsResendVerification] = useState(false);
  const { user, signIn, signUp, resetPassword } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (user) {
      navigate('/app');
    }
  }, [user, navigate]);

  const handleResendVerification = async () => {
    if (!email) {
      toast.error('Please enter your email');
      return;
    }

    setIsLoading(true);
    const { error } = await supabase.auth.resend({
      type: 'signup',
      email: email,
    });

    if (error) {
      toast.error(error.message || 'Failed to resend verification email');
    } else {
      toast.success('Verification email sent! Check your inbox.');
    }
    setIsLoading(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email) {
      toast.error('Please enter your email');
      return;
    }

    if (isResendVerification) {
      await handleResendVerification();
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
        // Send welcome email (no password - user already set it during signup)
        try {
          await fetch(
            `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/send-welcome-email`,
            {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'apikey': import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
              },
              body: JSON.stringify({
                email,
                fullName,
              }),
            }
          );
        } catch (emailError) {
          console.error('Failed to send welcome email:', emailError);
          // Don't block signup if email fails
        }
        
        toast.success('Account created! You can now sign in.');
        setIsSignUp(false);
        setPassword('');
      }
    } else {
      const { error } = await signIn(email, password);
      if (error) {
        // Check if the error is about email not confirmed
        if (error.message?.includes('Email not confirmed')) {
          toast.error('Please verify your email before signing in. Check your inbox or resend the verification email.');
        } else {
          toast.error(error.message || 'Invalid login credentials');
        }
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
          <div className="text-center mb-6">
            <img 
              src={projectLeanLogo} 
              alt="Project Lean" 
              className="h-12 mx-auto mb-6"
            />
            <h1 className="font-display text-3xl font-bold text-foreground mb-2">
              {isResendVerification 
                ? 'Resend Verification' 
                : isForgotPassword 
                  ? 'Reset Password' 
                  : isSignUp 
                    ? 'Join The Lean Brain™' 
                    : 'The Lean Brain™'}
            </h1>
            <p className="text-muted-foreground">
              {isResendVerification
                ? "Didn't receive the email? We'll send it again"
                : isForgotPassword 
                  ? 'Enter your email to receive a reset link' 
                  : isSignUp 
                    ? 'Your behavior intelligence system awaits' 
                    : 'Sign in to your behavior intelligence system'}
            </p>
          </div>

          {/* Resend verification info */}
          {isResendVerification && (
            <div className="mb-6 p-4 bg-sage/10 rounded-2xl flex items-start gap-3">
              <Mail className="w-5 h-5 text-sage-dark mt-0.5 flex-shrink-0" />
              <p className="text-sm text-foreground">
                Enter the email you signed up with and we'll send a new verification link.
              </p>
            </div>
          )}

          {/* Visual hint - 3 icon row (only show on sign in) */}
          {!isForgotPassword && !isSignUp && !isResendVerification && (
            <div className="mb-8">
              <p className="text-xs font-medium text-muted-foreground text-center mb-3 uppercase tracking-wide">How it works</p>
              <div className="flex items-center justify-center gap-3 py-4 px-3 bg-secondary/30 rounded-2xl">
                <div className="flex flex-col items-center gap-2 flex-1 opacity-0 animate-fade-up" style={{ animationDelay: '0.1s', animationFillMode: 'forwards' }}>
                  <div className="relative">
                    <span className="absolute -top-1 -left-1 w-4 h-4 bg-coral text-white text-[10px] font-bold rounded-full flex items-center justify-center">1</span>
                    <div className="w-11 h-11 rounded-xl bg-coral/10 flex items-center justify-center">
                      <Camera className="w-5 h-5 text-coral" />
                    </div>
                  </div>
                  <span className="text-xs font-medium text-foreground text-center leading-tight">Daily<br/>check-in</span>
                </div>
                <div className="text-coral font-bold opacity-0 animate-fade-up" style={{ animationDelay: '0.2s', animationFillMode: 'forwards' }}>→</div>
                <div className="flex flex-col items-center gap-2 flex-1 opacity-0 animate-fade-up" style={{ animationDelay: '0.3s', animationFillMode: 'forwards' }}>
                  <div className="relative">
                    <span className="absolute -top-1 -left-1 w-4 h-4 bg-coral text-white text-[10px] font-bold rounded-full flex items-center justify-center">2</span>
                    <div className="w-11 h-11 rounded-xl bg-coral/10 flex items-center justify-center">
                      <Sparkles className="w-5 h-5 text-coral" />
                    </div>
                  </div>
                  <span className="text-xs font-medium text-foreground text-center leading-tight">Detect<br/>patterns</span>
                </div>
                <div className="text-coral font-bold opacity-0 animate-fade-up" style={{ animationDelay: '0.4s', animationFillMode: 'forwards' }}>→</div>
                <div className="flex flex-col items-center gap-2 flex-1 opacity-0 animate-fade-up" style={{ animationDelay: '0.5s', animationFillMode: 'forwards' }}>
                  <div className="relative">
                    <span className="absolute -top-1 -left-1 w-4 h-4 bg-coral text-white text-[10px] font-bold rounded-full flex items-center justify-center">3</span>
                    <div className="w-11 h-11 rounded-xl bg-coral/10 flex items-center justify-center">
                      <TrendingUp className="w-5 h-5 text-coral" />
                    </div>
                  </div>
                  <span className="text-xs font-medium text-foreground text-center leading-tight">Build<br/>consistency</span>
                </div>
              </div>
            </div>
          )}

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

            {!isForgotPassword && !isResendVerification && (
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
                ? (isResendVerification ? 'Sending...' : isForgotPassword ? 'Sending...' : isSignUp ? 'Creating account...' : 'Signing in...') 
                : (isResendVerification ? 'Resend Verification Email' : isForgotPassword ? 'Send Reset Link' : isSignUp ? 'Create Account' : 'Sign In →')
              }
            </Button>

            {/* Trust line */}
            {!isForgotPassword && !isResendVerification && (
              <div className="flex items-center justify-center gap-1.5 text-xs text-muted-foreground pt-1">
                <Lock className="w-3 h-3" />
                <span>Your data is private and secure</span>
              </div>
            )}
          </form>

          {!isSignUp && !isForgotPassword && !isResendVerification && (
            <div className="text-center mt-5 space-y-2">
              <button
                type="button"
                onClick={() => setIsForgotPassword(true)}
                className="text-sm text-muted-foreground hover:text-foreground transition-colors block w-full"
              >
                Forgot your password?
              </button>
              <button
                type="button"
                onClick={() => setIsResendVerification(true)}
                className="text-sm text-muted-foreground hover:text-foreground transition-colors block w-full"
              >
                Didn't receive verification email?
              </button>
            </div>
          )}

          <div className="text-center mt-5 pt-5 border-t border-border/50">
            <button
              type="button"
              onClick={() => {
                if (isForgotPassword) {
                  setIsForgotPassword(false);
                } else if (isResendVerification) {
                  setIsResendVerification(false);
                } else {
                  setIsSignUp(!isSignUp);
                  setPassword('');
                }
              }}
              className={`text-sm transition-colors ${
                isForgotPassword || isSignUp || isResendVerification
                  ? 'font-medium text-coral hover:text-coral-light' 
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              {isForgotPassword || isResendVerification
                ? 'Back to sign in'
                : isSignUp 
                  ? 'Already have an account? Sign in' 
                  : "Don't have an account? Sign up for free"
              }
            </button>
          </div>
        </div>

        {/* Powered by line */}
        <p className="text-center text-xs text-muted-foreground mt-6">
          Behavior Intelligence by <span className="font-medium">Project Lean</span>
        </p>
      </div>
    </div>
  );
};

export default Auth;
