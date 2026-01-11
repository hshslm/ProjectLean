import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Bell, BellOff } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface NotificationSettingsProps {
  userId: string;
}

export const NotificationSettings = ({ userId }: NotificationSettingsProps) => {
  const [open, setOpen] = useState(false);
  const [pushEnabled, setPushEnabled] = useState(false);
  const [breakfastTime, setBreakfastTime] = useState('08:00');
  const [lunchTime, setLunchTime] = useState('12:00');
  const [dinnerTime, setDinnerTime] = useState('18:00');
  const [isSupported, setIsSupported] = useState(false);
  const [permission, setPermission] = useState<NotificationPermission>('default');
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    // Check if notifications are supported
    const supported = 'Notification' in window && 'serviceWorker' in navigator;
    setIsSupported(supported);
    
    if (supported) {
      setPermission(Notification.permission);
    }
    
    // Fetch existing settings
    fetchSettings();
  }, [userId]);

  const fetchSettings = async () => {
    const { data } = await supabase
      .from('notification_settings')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle();

    if (data) {
      setPushEnabled(data.push_enabled);
      if (data.breakfast_reminder) setBreakfastTime(data.breakfast_reminder.slice(0, 5));
      if (data.lunch_reminder) setLunchTime(data.lunch_reminder.slice(0, 5));
      if (data.dinner_reminder) setDinnerTime(data.dinner_reminder.slice(0, 5));
    }
  };

  const requestPermission = async () => {
    if (!isSupported) {
      toast.error('Notifications are not supported on this device');
      return false;
    }

    try {
      const result = await Notification.requestPermission();
      setPermission(result);
      
      if (result === 'granted') {
        // Register service worker for push notifications
        const registration = await navigator.serviceWorker.ready;
        toast.success('Notifications enabled!');
        return true;
      } else {
        toast.error('Notification permission denied');
        return false;
      }
    } catch (error) {
      toast.error('Failed to enable notifications');
      return false;
    }
  };

  const handleToggle = async (enabled: boolean) => {
    if (enabled && permission !== 'granted') {
      const granted = await requestPermission();
      if (!granted) return;
    }
    setPushEnabled(enabled);
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const settings = {
        user_id: userId,
        push_enabled: pushEnabled,
        breakfast_reminder: breakfastTime + ':00',
        lunch_reminder: lunchTime + ':00',
        dinner_reminder: dinnerTime + ':00',
        updated_at: new Date().toISOString(),
      };

      const { error } = await supabase
        .from('notification_settings')
        .upsert(settings, { onConflict: 'user_id' });

      if (error) throw error;

      // Schedule notifications if enabled
      if (pushEnabled && 'serviceWorker' in navigator) {
        scheduleNotifications();
      }

      toast.success('Notification settings saved!');
      setOpen(false);
    } catch (error: any) {
      toast.error(error.message || 'Failed to save settings');
    } finally {
      setIsSaving(false);
    }
  };

  const scheduleNotifications = () => {
    // In a real PWA, you'd use the Push API or background sync
    // For now, we'll use the Notification API when the app is open
    if (Notification.permission === 'granted') {
      // Store the reminder times in localStorage for the service worker
      localStorage.setItem('mealReminders', JSON.stringify({
        breakfast: breakfastTime,
        lunch: lunchTime,
        dinner: dinnerTime,
        enabled: pushEnabled,
      }));
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="icon" className="h-8 w-8">
          {pushEnabled ? (
            <Bell className="w-4 h-4" />
          ) : (
            <BellOff className="w-4 h-4" />
          )}
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[350px]">
        <DialogHeader>
          <DialogTitle>Meal Reminders</DialogTitle>
          <DialogDescription>
            Get notified when it's time to log your meals.
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-6 py-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Enable Notifications</Label>
              <p className="text-xs text-muted-foreground">
                {!isSupported 
                  ? 'Not supported on this device' 
                  : permission === 'denied'
                  ? 'Permission blocked in browser'
                  : 'Receive meal reminders'}
              </p>
            </div>
            <Switch
              checked={pushEnabled}
              onCheckedChange={handleToggle}
              disabled={!isSupported || permission === 'denied'}
            />
          </div>

          {pushEnabled && (
            <div className="space-y-4 pt-2">
              <div className="space-y-2">
                <Label htmlFor="breakfast">Breakfast Reminder</Label>
                <Input
                  id="breakfast"
                  type="time"
                  value={breakfastTime}
                  onChange={(e) => setBreakfastTime(e.target.value)}
                  className="rounded-xl"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="lunch">Lunch Reminder</Label>
                <Input
                  id="lunch"
                  type="time"
                  value={lunchTime}
                  onChange={(e) => setLunchTime(e.target.value)}
                  className="rounded-xl"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="dinner">Dinner Reminder</Label>
                <Input
                  id="dinner"
                  type="time"
                  value={dinnerTime}
                  onChange={(e) => setDinnerTime(e.target.value)}
                  className="rounded-xl"
                />
              </div>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button variant="coral" onClick={handleSave} disabled={isSaving}>
            {isSaving ? 'Saving...' : 'Save'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};