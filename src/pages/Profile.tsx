import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useSubscription } from '@/hooks/useSubscription';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { toast } from 'sonner';
import { ArrowLeft, LogOut, KeyRound, Sparkles, CreditCard, Crown, Loader2 } from 'lucide-react';

const Profile = () => {
  const navigate = useNavigate();
  const { user, loading, signOut, resetPassword } = useAuth();
  const { isSubscribed, isCoachingClient, hasAccess, openPaymentLink } = useSubscription();
  const [isLoadingPortal, setIsLoadingPortal] = useState(false);
  const [isResettingPassword, setIsResettingPassword] = useState(false);

  useEffect(() => {
    if (!loading && !user) {
      navigate('/auth');
    }
  }, [user, loading, navigate]);

  if (loading || !user) {
    return (
      <div className="min-h-screen gradient-warm flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const handleManageSubscription = async () => {
    setIsLoadingPortal(true);
    try {
      const { data, error } = await supabase.functions.invoke('create-portal-session');

      if (error) throw error;
      if (data?.url) {
        window.location.href = data.url;
      } else {
        throw new Error('No portal URL returned');
      }
    } catch {
      toast.error('Could not open subscription management. Please try again.');
    } finally {
      setIsLoadingPortal(false);
    }
  };

  const handleResetPassword = async () => {
    if (!user?.email) return;
    setIsResettingPassword(true);
    const { error } = await resetPassword(user.email);
    if (error) {
      toast.error('Could not send reset email. Please try again.');
    } else {
      toast.success('Password reset email sent. Check your inbox.');
    }
    setIsResettingPassword(false);
  };

  const handleSignOut = async () => {
    await signOut();
    navigate('/auth');
  };

  const userName = user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'User';

  return (
    <div className="min-h-screen gradient-warm">
      <div className="max-w-lg mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center gap-3 mb-8">
          <Button variant="ghost" size="sm" onClick={() => navigate('/app')} className="h-8 w-8 p-0">
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <h1 className="font-display text-2xl font-bold text-foreground">Profile</h1>
        </div>

        <div className="space-y-4">
          {/* User Info */}
          <Card>
            <CardContent className="p-5">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-lg">
                  {userName.charAt(0).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-foreground truncate">{userName}</p>
                  <p className="text-sm text-muted-foreground truncate">{user?.email}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Subscription Status */}
          <Card>
            <CardContent className="p-5 space-y-4">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium text-muted-foreground uppercase tracking-wide">Subscription</p>
                {isCoachingClient ? (
                  <Badge className="bg-amber-100 text-amber-800 border-amber-200">
                    <Crown className="h-3 w-3 mr-1" /> Coaching Client
                  </Badge>
                ) : isSubscribed ? (
                  <Badge className="bg-primary/10 text-primary border-primary/20">
                    <Sparkles className="h-3 w-3 mr-1" /> Pro
                  </Badge>
                ) : (
                  <Badge variant="secondary">Free</Badge>
                )}
              </div>

              {isSubscribed && !isCoachingClient && (
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={handleManageSubscription}
                  disabled={isLoadingPortal}
                >
                  <CreditCard className="w-4 h-4 mr-2" />
                  {isLoadingPortal ? 'Opening...' : 'Manage Subscription'}
                </Button>
              )}

              {!hasAccess && (
                <Button
                  variant="coral"
                  className="w-full"
                  onClick={() => openPaymentLink()}
                >
                  <Sparkles className="w-4 h-4 mr-2" />
                  Upgrade to Pro
                </Button>
              )}
            </CardContent>
          </Card>

          {/* Account Actions */}
          <Card>
            <CardContent className="p-5 space-y-3">
              <Button
                variant="outline"
                className="w-full justify-start"
                onClick={handleResetPassword}
                disabled={isResettingPassword}
              >
                <KeyRound className="w-4 h-4 mr-2" />
                {isResettingPassword ? 'Sending...' : 'Change Password'}
              </Button>

              <Button
                variant="outline"
                className="w-full justify-start text-destructive hover:text-destructive hover:bg-destructive/5"
                onClick={handleSignOut}
              >
                <LogOut className="w-4 h-4 mr-2" />
                Sign Out
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Profile;
