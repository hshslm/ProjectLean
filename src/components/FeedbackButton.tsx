import { useState } from 'react';
import { MessageSquarePlus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { toast } from 'sonner';
import { useAuth } from '@/hooks/useAuth';

export const FeedbackButton: React.FC = () => {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [message, setMessage] = useState('');
  const [isSending, setIsSending] = useState(false);

  const handleSubmit = async () => {
    if (!message.trim()) {
      toast.error('Please enter your feedback');
      return;
    }

    setIsSending(true);
    try {
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/send-feedback`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'apikey': import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
          },
          body: JSON.stringify({
            message: message.trim(),
            email: user?.email,
            name: user?.user_metadata?.full_name,
          }),
        }
      );

      if (!response.ok) {
        throw new Error('Failed to send');
      }

      toast.success('Feedback sent! Thank you.');
      setMessage('');
      setOpen(false);
    } catch {
      toast.error('Could not send feedback. Please try again.');
    } finally {
      setIsSending(false);
    }
  };

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="fixed bottom-6 right-6 z-50 px-3 py-1.5 rounded-full bg-muted/80 backdrop-blur-sm text-muted-foreground text-xs font-medium flex items-center gap-1.5 hover:bg-muted transition-all active:scale-95 border border-border/50"
        aria-label="Send Feedback"
      >
        <MessageSquarePlus className="w-3.5 h-3.5" />
        Feedback
      </button>

      <Dialog open={open} onOpenChange={(o) => { if (!o) setMessage(''); setOpen(o); }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Send Feedback</DialogTitle>
            <DialogDescription>
              Help us improve The Lean Brain. What's working? What's not?
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <Textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Your feedback..."
              rows={5}
              disabled={isSending}
              className="resize-none"
            />
            <Button
              variant="coral"
              className="w-full"
              onClick={handleSubmit}
              disabled={isSending || !message.trim()}
            >
              {isSending ? 'Sending...' : 'Send Feedback'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};
