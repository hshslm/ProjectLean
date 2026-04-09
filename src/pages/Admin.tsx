import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { Plus, Users, LogOut, Eye, Mail, Crown, Camera, Trash2, RefreshCw, Loader2 } from 'lucide-react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { invokeEdgeFunction } from '@/lib/edge-functions';
import projectLeanLogo from '@/assets/project-lean-logo.png';

interface Client {
  id: string;
  user_id: string;
  email: string;
  full_name: string | null;
  created_at: string;
  is_subscribed: boolean;
  is_coaching_client: boolean;
  scan_count: number;
  subscription_expires_at: string | null;
}

const PAGE_SIZE = 20;

const getAdminError = (status: number, serverError: string, fallback: string): string => {
  if (serverError.includes('already been registered') || serverError.includes('already exists'))
    return 'This email is already registered.';
  switch (status) {
    case 401: return 'Your session expired. Please sign out and sign back in.';
    case 429: return 'Too many requests. Please wait a moment.';
    default: return serverError || fallback;
  }
};

const Admin = () => {
  const { user, role, loading, signOut } = useAuth();
  const navigate = useNavigate();
  const [clients, setClients] = useState<Client[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [hasMore, setHasMore] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [resendingFor, setResendingFor] = useState<string | null>(null);
  const [renewalFor, setRenewalFor] = useState<string | null>(null);
  const [deletingFor, setDeletingFor] = useState<string | null>(null);
  const [newClient, setNewClient] = useState({
    email: '',
    password: '',
    fullName: '',
  });

  useEffect(() => {
    if (!loading && (!user || role !== 'admin')) {
      navigate('/auth');
    }
  }, [user, role, loading, navigate]);

  useEffect(() => {
    if (role === 'admin') {
      fetchClients();
    }
  }, [role]);

  const fetchClients = async (append = false) => {
    if (append) setLoadingMore(true);

    try {
      // Get admin IDs for exclusion
      const { data: adminRoles } = await supabase
        .from('user_roles')
        .select('user_id')
        .eq('role', 'admin');

      const adminIds = (adminRoles?.map(r => r.user_id) || []);

      const from = append ? clients.length : 0;
      const to = from + PAGE_SIZE - 1;

      let query = supabase
        .from('profiles')
        .select('*', { count: 'exact' })
        .order('created_at', { ascending: false })
        .range(from, to);

      if (adminIds.length > 0) {
        query = query.not('user_id', 'in', `(${adminIds.join(',')})`);
      }

      const { data, error, count } = await query;

      if (error) {
        console.error('Error fetching clients:', error);
        return;
      }

      const fetched = (data as unknown as Client[]) || [];
      const newClients = append ? [...clients, ...fetched] : fetched;
      setClients(newClients);
      setTotalCount(count ?? newClients.length);
      setHasMore(newClients.length < (count ?? 0));
    } catch (err) {
      console.error('Error fetching clients:', err);
    } finally {
      setLoadingMore(false);
    }
  };

  const toggleCoachingClient = async (clientUserId: string, currentValue: boolean) => {
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ is_coaching_client: !currentValue } as Record<string, unknown>)
        .eq('user_id', clientUserId);

      if (error) throw error;

      toast.success(!currentValue ? 'Coaching access granted' : 'Coaching access removed');
      fetchClients();
    } catch (error: any) {
      toast.error('Could not update client status. Please try again.');
    }
  };

  const handleCreateClient = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!newClient.email || !newClient.password) {
      toast.error('Email and password are required');
      return;
    }

    if (newClient.password.length < 6) {
      toast.error('Password must be at least 6 characters');
      return;
    }

    setIsCreating(true);

    try {
      const { data, status, error } = await invokeEdgeFunction('create-client', {
        email: newClient.email,
        password: newClient.password,
        fullName: newClient.fullName || newClient.email,
      });

      if (error) {
        toast.error(getAdminError(status, error, 'Could not create client. Please try again.'));
        return;
      }

      toast.success(`Client created! An invitation email has been sent to ${newClient.email}`);
      setNewClient({ email: '', password: '', fullName: '' });
      setShowForm(false);
      fetchClients();
    } catch (error: any) {
      console.error('Create client error:', error);
      toast.error(!navigator.onLine ? 'You\'re offline. Please check your connection.' : 'Could not create client. Please try again.');
    } finally {
      setIsCreating(false);
    }
  };

  const handleViewClient = (clientUserId: string) => {
    navigate(`/admin/client/${clientUserId}`);
  };

  const handleResendLogin = async (clientUserId: string, clientEmail: string) => {
    setResendingFor(clientUserId);
    try {
      const { status, error } = await invokeEdgeFunction('resend-login', { clientUserId });

      if (error) {
        toast.error(getAdminError(status, error, 'Could not send login details. Please try again.'));
        return;
      }

      toast.success(`Login details sent to ${clientEmail}`);
    } catch (error: any) {
      console.error('Resend login error:', error);
      toast.error(!navigator.onLine ? 'You\'re offline. Please check your connection.' : 'Could not send login details. Please try again.');
    } finally {
      setResendingFor(null);
    }
  };
  const handleSendRenewal = async (clientEmail: string) => {
    setRenewalFor(clientEmail);
    try {
      const { status, error } = await invokeEdgeFunction('send-renewal-email', { email: clientEmail });

      if (error) {
        toast.error(getAdminError(status, error, 'Could not send renewal email. Please try again.'));
        return;
      }

      toast.success(`Renewal email sent to ${clientEmail}`);
    } catch (error: any) {
      console.error('Send renewal error:', error);
      toast.error(!navigator.onLine ? 'You\'re offline. Please check your connection.' : 'Could not send renewal email. Please try again.');
    } finally {
      setRenewalFor(null);
    }
  };

  const handleDeleteClient = async (clientUserId: string, clientEmail: string) => {
    setDeletingFor(clientUserId);
    try {
      const { status, error } = await invokeEdgeFunction('delete-client', { clientUserId });

      if (error) {
        toast.error(getAdminError(status, error, 'Could not delete client. Please try again.'));
        return;
      }

      toast.success(`${clientEmail} has been deleted`);
      fetchClients();
    } catch (error: any) {
      console.error('Delete client error:', error);
      toast.error(!navigator.onLine ? 'You\'re offline. Please check your connection.' : 'Could not delete client. Please try again.');
    } finally {
      setDeletingFor(null);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen gradient-warm flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="min-h-screen gradient-warm">
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Header */}
        <header className="flex items-center justify-between mb-8">
          <img 
            src={projectLeanLogo} 
            alt="Project Lean" 
            className="h-16 sm:h-20"
          />
          <Button variant="ghost" size="sm" onClick={signOut}>
            <LogOut className="w-4 h-4 mr-2" />
            Sign out
          </Button>
        </header>

        <div className="space-y-6">
          {/* Title & Actions */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="font-display text-2xl font-bold text-foreground">
                Clients
              </h1>
              <p className="text-muted-foreground text-sm">
                Manage your clients and view their progress
              </p>
            </div>
            <Button
              variant="coral"
              onClick={() => { if (showForm) setNewClient({ email: '', password: '', fullName: '' }); setShowForm(!showForm); }}
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Client
            </Button>
          </div>

          {/* Create Client Form */}
          {showForm && (
            <Card className="animate-fade-up">
              <CardHeader>
                <CardTitle className="text-lg">Create New Client</CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleCreateClient} className="space-y-4">
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="fullName">Name</Label>
                      <Input
                        id="fullName"
                        placeholder="Client name"
                        value={newClient.fullName}
                        onChange={(e) => setNewClient(prev => ({ ...prev, fullName: e.target.value }))}
                        className="rounded-xl"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="clientEmail">Email</Label>
                      <Input
                        id="clientEmail"
                        type="email"
                        placeholder="client@email.com"
                        value={newClient.email}
                        onChange={(e) => setNewClient(prev => ({ ...prev, email: e.target.value }))}
                        className="rounded-xl"
                        required
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="clientPassword">Password</Label>
                    <Input
                      id="clientPassword"
                      type="text"
                      placeholder="Temporary password"
                      value={newClient.password}
                      onChange={(e) => setNewClient(prev => ({ ...prev, password: e.target.value }))}
                      className="rounded-xl"
                      required
                    />
                    <p className="text-xs text-muted-foreground">
                      Share this with your client so they can log in
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Button type="submit" variant="coral" disabled={isCreating}>
                      {isCreating ? 'Creating...' : 'Create Client'}
                    </Button>
                    <Button type="button" variant="outline" onClick={() => { setNewClient({ email: '', password: '', fullName: '' }); setShowForm(false); }}>
                      Cancel
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          )}

          {/* Client count */}
          {clients.length > 0 && (
            <p className="text-sm text-muted-foreground">
              Showing {clients.length} of {totalCount} clients
            </p>
          )}

          {/* Clients List */}
          {clients.length === 0 ? (
            <Card className="p-12 text-center">
              <Users className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="font-medium text-foreground mb-2">No clients yet</h3>
              <p className="text-sm text-muted-foreground">
                Add your first client to get started
              </p>
            </Card>
          ) : (
            <div className="grid gap-3">
              {clients.map((client) => (
                <Card key={client.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <p className="font-medium text-foreground">
                            {client.full_name || client.email}
                          </p>
                          {client.is_coaching_client && (
                            <Badge variant="secondary" className="bg-amber-100 text-amber-700 border-amber-300">
                              <Crown className="w-3 h-3 mr-1" />
                              Coaching
                            </Badge>
                          )}
                          {client.is_subscribed && !client.is_coaching_client && (
                            <Badge variant="secondary" className="bg-green-100 text-green-700 border-green-300">
                              Subscribed
                            </Badge>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground">{client.email}</p>
                        <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Camera className="w-3 h-3" />
                            {client.scan_count || 0} scans
                          </span>
                          {client.subscription_expires_at && (
                            <span>
                              Expires: {new Date(client.subscription_expires_at).toLocaleDateString()}
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-muted-foreground">Coaching</span>
                          <Switch
                            checked={client.is_coaching_client}
                            onCheckedChange={() => toggleCoachingClient(client.user_id, client.is_coaching_client)}
                          />
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleResendLogin(client.user_id, client.email)}
                          disabled={resendingFor === client.user_id}
                        >
                          <Mail className="w-4 h-4 mr-2" />
                          {resendingFor === client.user_id ? 'Sending...' : 'Resend Login'}
                        </Button>
                        {!client.is_coaching_client && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleSendRenewal(client.email)}
                            disabled={renewalFor === client.email}
                          >
                            <RefreshCw className="w-4 h-4 mr-2" />
                            {renewalFor === client.email ? 'Sending...' : 'Renewal'}
                          </Button>
                        )}
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleViewClient(client.user_id)}
                        >
                          <Eye className="w-4 h-4 mr-2" />
                          View
                        </Button>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-destructive hover:text-destructive hover:bg-destructive/10"
                              disabled={deletingFor === client.user_id}
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Delete Client</AlertDialogTitle>
                              <AlertDialogDescription>
                                Are you sure you want to delete <strong>{client.full_name || client.email}</strong>? This action cannot be undone and will permanently remove their account and all meal logs.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() => handleDeleteClient(client.user_id, client.email)}
                                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                              >
                                {deletingFor === client.user_id ? 'Deleting...' : 'Delete'}
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
              {hasMore && (
                <Button
                  variant="outline"
                  className="w-full mt-2"
                  onClick={() => fetchClients(true)}
                  disabled={loadingMore}
                >
                  {loadingMore ? 'Loading...' : 'Load more'}
                </Button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Admin;
