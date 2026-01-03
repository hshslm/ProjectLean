import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, ChevronLeft, ChevronRight } from 'lucide-react';
import { format, addDays, subDays, isToday, parseISO } from 'date-fns';
import projectLeanLogo from '@/assets/project-lean-logo.png';
import { DailyTotals } from '@/components/DailyTotals';
import { MealLogCard } from '@/components/MealLogCard';

interface MealLog {
  id: string;
  logged_at: string;
  meal_date: string;
  food_identified: string;
  calories_low: number;
  calories_high: number;
  protein_low: number;
  protein_high: number;
  carbs_low: number;
  carbs_high: number;
  fat_low: number;
  fat_high: number;
  confidence: string | null;
  notes: string | null;
  image_url: string | null;
}

interface Profile {
  full_name: string | null;
  email: string;
}

const ClientView = () => {
  const { clientId } = useParams<{ clientId: string }>();
  const { user, role, loading } = useAuth();
  const navigate = useNavigate();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [mealLogs, setMealLogs] = useState<MealLog[]>([]);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [isLoadingData, setIsLoadingData] = useState(true);

  useEffect(() => {
    if (!loading && (!user || role !== 'admin')) {
      navigate('/auth');
    }
  }, [user, role, loading, navigate]);

  useEffect(() => {
    if (clientId && role === 'admin') {
      fetchClientData();
    }
  }, [clientId, role, selectedDate]);

  const fetchClientData = async () => {
    setIsLoadingData(true);
    
    // Fetch profile
    const { data: profileData } = await supabase
      .from('profiles')
      .select('full_name, email')
      .eq('user_id', clientId)
      .maybeSingle();
    
    setProfile(profileData);

    // Fetch meal logs for selected date
    const dateStr = format(selectedDate, 'yyyy-MM-dd');
    const { data: logsData } = await supabase
      .from('meal_logs')
      .select('*')
      .eq('user_id', clientId)
      .eq('meal_date', dateStr)
      .order('logged_at', { ascending: false });
    
    setMealLogs(logsData || []);
    setIsLoadingData(false);
  };

  const handlePrevDay = () => {
    setSelectedDate(prev => subDays(prev, 1));
  };

  const handleNextDay = () => {
    if (!isToday(selectedDate)) {
      setSelectedDate(prev => addDays(prev, 1));
    }
  };

  if (loading || isLoadingData) {
    return (
      <div className="min-h-screen gradient-warm flex items-center justify-center">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen gradient-warm">
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Header */}
        <header className="flex items-center gap-4 mb-8">
          <Button variant="ghost" size="icon" onClick={() => navigate('/admin')}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div className="flex-1">
            <h1 className="font-display text-xl font-bold text-foreground">
              {profile?.full_name || profile?.email || 'Client'}
            </h1>
            <p className="text-sm text-muted-foreground">{profile?.email}</p>
          </div>
          <img src={projectLeanLogo} alt="Project Lean" className="h-8" />
        </header>

        {/* Date Navigation */}
        <div className="flex items-center justify-center gap-4 mb-6">
          <Button variant="ghost" size="icon" onClick={handlePrevDay}>
            <ChevronLeft className="w-5 h-5" />
          </Button>
          <div className="text-center min-w-[160px]">
            <p className="font-medium text-foreground">
              {isToday(selectedDate) ? 'Today' : format(selectedDate, 'EEEE')}
            </p>
            <p className="text-sm text-muted-foreground">
              {format(selectedDate, 'MMM d, yyyy')}
            </p>
          </div>
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={handleNextDay}
            disabled={isToday(selectedDate)}
          >
            <ChevronRight className="w-5 h-5" />
          </Button>
        </div>

        {/* Daily Totals */}
        <DailyTotals mealLogs={mealLogs} />

        {/* Meal Logs */}
        <div className="mt-6 space-y-4">
          <h2 className="font-medium text-foreground">Meals</h2>
          {mealLogs.length === 0 ? (
            <Card className="p-8 text-center">
              <p className="text-muted-foreground">No meals logged this day</p>
            </Card>
          ) : (
            mealLogs.map((log) => (
              <MealLogCard key={log.id} log={log} />
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default ClientView;
