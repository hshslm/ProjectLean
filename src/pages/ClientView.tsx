import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import SkeletonCard from '@/components/SkeletonCard';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { ArrowLeft, ChevronLeft, ChevronRight, UtensilsCrossed, ClipboardCheck, BarChart3, MessageSquare, MessageCircle, Check, Beef, Footprints, Dumbbell, Moon, Utensils, Brain, Loader2 } from 'lucide-react';
import { format, addDays, subDays, isToday } from 'date-fns';
import projectLeanLogo from '@/assets/project-lean-logo.png';
import { DailyTotals } from '@/components/DailyTotals';
import { MealLogCard } from '@/components/MealLogCard';
import { WeeklyInsights } from '@/components/WeeklyInsights';
import ReactMarkdown from 'react-markdown';

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

interface CheckInData {
  id: string;
  checkin_date: string;
  protein_hit: boolean;
  steps_hit: boolean;
  training_hit: boolean;
  sleep_hit: boolean;
  aligned_eating_hit: boolean;
  cognitive_patterns: string[];
  mood_score: number | null;
  stress_score: number | null;
  reset_protocol_used: boolean;
}

interface ChatMessage {
  id: string;
  role: string;
  content: string;
  session_id: string;
  created_at: string;
}

const HABIT_META = [
  { key: 'protein_hit', label: 'Protein', icon: Beef },
  { key: 'steps_hit', label: 'Steps', icon: Footprints },
  { key: 'training_hit', label: 'Training', icon: Dumbbell },
  { key: 'sleep_hit', label: 'Sleep', icon: Moon },
  { key: 'aligned_eating_hit', label: 'Aligned Eating', icon: Utensils },
] as const;

const PATTERN_LABELS: Record<string, string> = {
  'all-or-nothing': 'All-or-nothing thinking',
  'ruined-day': '"I already ruined the day"',
  'start-tomorrow': '"I\'ll start tomorrow / Monday"',
  'emotional-eating': 'Emotional eating (stress)',
  'social-pressure': 'Social pressure',
  'perfectionism': 'Perfectionism',
  'scale-anxiety': 'Scale anxiety',
  'over-restricting': 'Over-restricting / compensating',
  'none': 'No negative pattern today',
};

const ClientView = () => {
  const { clientId } = useParams<{ clientId: string }>();
  const { user, role, loading } = useAuth();
  const navigate = useNavigate();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [mealLogs, setMealLogs] = useState<MealLog[]>([]);
  const [checkin, setCheckin] = useState<CheckInData | null>(null);
  const [coachingResponse, setCoachingResponse] = useState<string | null>(null);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [isLoadingData, setIsLoadingData] = useState(true);
  const [activeTab, setActiveTab] = useState<'meals' | 'checkin' | 'insights' | 'chat'>('meals');
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);

  useEffect(() => {
    if (!loading && (!user || role !== 'admin')) {
      navigate('/auth');
    }
  }, [user, role, loading, navigate]);

  useEffect(() => {
    if (clientId && role === 'admin') {
      fetchClientData();
      fetchChatHistory();
    }
  }, [clientId, role, selectedDate]);

  const fetchClientData = async () => {
    if (!clientId) return;
    setIsLoadingData(true);
    const dateStr = format(selectedDate, 'yyyy-MM-dd');

    const [profileRes, logsRes, checkinRes, coachingRes] = await Promise.all([
      supabase.from('profiles').select('full_name, email').eq('user_id', clientId).maybeSingle(),
      supabase.from('meal_logs').select('*').eq('user_id', clientId).eq('meal_date', dateStr).order('logged_at', { ascending: false }),
      (supabase.from('daily_checkins' as any).select('*').eq('user_id', clientId).eq('checkin_date', dateStr).maybeSingle() as any),
      (supabase.from('coaching_responses' as any).select('response_text').eq('user_id', clientId).eq('checkin_date', dateStr).order('created_at', { ascending: false }).limit(1).maybeSingle() as any),
    ]);

    setProfile(profileRes.data);
    setMealLogs(logsRes.data || []);
    setCheckin(checkinRes.data || null);
    setCoachingResponse(coachingRes.data?.response_text || null);
    setIsLoadingData(false);
  };

  const fetchChatHistory = async () => {
    if (!clientId) return;
    const dateStr = format(selectedDate, 'yyyy-MM-dd');
    const nextDateStr = format(addDays(selectedDate, 1), 'yyyy-MM-dd');
    
    const { data } = await (supabase
      .from('chat_messages' as any)
      .select('*')
      .eq('user_id', clientId)
      .gte('created_at', `${dateStr}T00:00:00`)
      .lt('created_at', `${nextDateStr}T00:00:00`)
      .order('created_at', { ascending: true }) as any);
    
    setChatMessages((data as any[]) || []);
  };

  const handlePrevDay = () => setSelectedDate(prev => subDays(prev, 1));
  const handleNextDay = () => { if (!isToday(selectedDate)) setSelectedDate(prev => addDays(prev, 1)); };

  if (loading) {
    return (
      <div className="min-h-screen gradient-warm flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const habitsCompleted = checkin ? HABIT_META.filter(h => checkin[h.key as keyof CheckInData]).length : 0;

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

        {/* Tab Navigation */}
        <div className="flex gap-1 bg-muted rounded-xl p-1 mb-6">
          {[
            { id: 'meals' as const, label: 'Meals', icon: UtensilsCrossed },
            { id: 'checkin' as const, label: 'Check-In', icon: ClipboardCheck },
            { id: 'insights' as const, label: 'Insights', icon: BarChart3 },
            { id: 'chat' as const, label: 'Chat', icon: MessageCircle },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-lg text-sm font-medium transition-all ${
                activeTab === tab.id
                  ? 'bg-card text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <tab.icon className="w-4 h-4" />
              {tab.label}
            </button>
          ))}
        </div>

        {activeTab === 'insights' ? (
          clientId ? <WeeklyInsights userId={clientId} /> : null
        ) : activeTab === 'chat' ? (
          <>
            {/* Date Navigation for Chat */}
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
              <Button variant="ghost" size="icon" onClick={handleNextDay} disabled={isToday(selectedDate)}>
                <ChevronRight className="w-5 h-5" />
              </Button>
            </div>

            {chatMessages.length === 0 ? (
              <Card className="p-8 text-center">
                <MessageCircle className="w-12 h-12 mx-auto text-muted-foreground mb-3" />
                <p className="text-muted-foreground">No chat messages this day</p>
              </Card>
            ) : (
              <div className="space-y-3">
                {/* Group by session */}
                {(() => {
                  const sessions = chatMessages.reduce<Record<string, ChatMessage[]>>((acc, msg) => {
                    if (!acc[msg.session_id]) acc[msg.session_id] = [];
                    acc[msg.session_id].push(msg);
                    return acc;
                  }, {});

                  return Object.entries(sessions).map(([sessionId, msgs]) => (
                    <Card key={sessionId}>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-xs text-muted-foreground font-normal">
                          Session — {format(new Date(msgs[0].created_at), 'h:mm a')}
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        {msgs.map(msg => (
                          <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                            {msg.role === 'assistant' && (
                              <img src={projectLeanLogo} alt="" className="w-5 h-5 mt-1 mr-2 flex-shrink-0" />
                            )}
                            <div className={`max-w-[85%] rounded-2xl px-3 py-2 text-sm ${
                              msg.role === 'user'
                                ? 'bg-foreground text-background rounded-br-md'
                                : 'bg-muted text-foreground rounded-bl-md'
                            }`}>
                              {msg.role === 'assistant' ? (
                                <div className="prose prose-sm max-w-none [&>p]:mb-2 [&>p:last-child]:mb-0">
                                  <ReactMarkdown>{msg.content}</ReactMarkdown>
                                </div>
                              ) : (
                                <p className="whitespace-pre-wrap">{msg.content}</p>
                              )}
                            </div>
                          </div>
                        ))}
                      </CardContent>
                    </Card>
                  ));
                })()}
              </div>
            )}
          </>
        ) : (
          <>
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
              <Button variant="ghost" size="icon" onClick={handleNextDay} disabled={isToday(selectedDate)}>
                <ChevronRight className="w-5 h-5" />
              </Button>
            </div>

            {isLoadingData ? (
              <div className="space-y-3">
                <SkeletonCard />
                <SkeletonCard />
                <SkeletonCard />
              </div>
            ) : activeTab === 'meals' ? (
              <>
                <DailyTotals mealLogs={mealLogs} />
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
              </>
            ) : (
              /* Check-In Tab (read-only) */
              <div className="space-y-4">
                {/* Coaching Response */}
                {coachingResponse && (
                  <Card className="border-primary/20 bg-primary/5">
                    <CardHeader className="pb-2">
                      <div className="flex items-center gap-2">
                        <MessageSquare className="w-4 h-4 text-primary" />
                        <CardTitle className="text-sm font-semibold text-primary">Karim</CardTitle>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-foreground leading-relaxed">{coachingResponse}</p>
                    </CardContent>
                  </Card>
                )}

                {!checkin ? (
                  <Card className="p-8 text-center">
                    <p className="text-muted-foreground">No check-in for this day</p>
                  </Card>
                ) : (
                  <>
                    {/* Habits */}
                    <Card>
                      <CardHeader className="pb-3">
                        <div className="flex items-center justify-between">
                          <CardTitle className="text-base font-semibold">Daily Habits</CardTitle>
                          <Badge variant="secondary" className="text-xs">{habitsCompleted}/5</Badge>
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-1">
                        {HABIT_META.map(({ key, label, icon: Icon }) => {
                          const hit = checkin[key as keyof CheckInData] as boolean;
                          return (
                            <div
                              key={key}
                              className={`flex items-center gap-3 p-3 rounded-xl ${
                                hit ? 'bg-primary/10 border border-primary/20' : 'bg-muted/50 border border-transparent'
                              }`}
                            >
                              <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                                hit ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'
                              }`}>
                                {hit ? <Check className="w-4 h-4" /> : <Icon className="w-4 h-4" />}
                              </div>
                              <span className={`text-sm font-medium ${hit ? 'text-foreground' : 'text-muted-foreground'}`}>
                                {label}
                              </span>
                            </div>
                          );
                        })}
                      </CardContent>
                    </Card>

                    {/* Mood & Stress */}
                    <Card>
                      <CardHeader className="pb-3">
                        <CardTitle className="text-base font-semibold">Mood & Stress</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="grid grid-cols-2 gap-4">
                          <div className="text-center">
                            <p className="text-2xl font-bold text-foreground">
                              {checkin.mood_score ?? '—'}
                            </p>
                            <p className="text-xs text-muted-foreground">Mood /10</p>
                          </div>
                          <div className="text-center">
                            <p className="text-2xl font-bold text-foreground">
                              {checkin.stress_score ?? '—'}
                            </p>
                            <p className="text-xs text-muted-foreground">Stress /10</p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    {/* Cognitive Patterns */}
                    <Card>
                      <CardHeader className="pb-3">
                        <div className="flex items-center gap-2">
                          <Brain className="w-4 h-4 text-primary" />
                          <CardTitle className="text-base font-semibold">Thought Patterns</CardTitle>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="flex flex-wrap gap-2">
                          {checkin.cognitive_patterns.map(p => (
                            <Badge
                              key={p}
                              variant="secondary"
                              className={p === 'none' ? 'bg-primary/10 text-primary' : 'bg-destructive/10 text-destructive'}
                            >
                              {PATTERN_LABELS[p] || p}
                            </Badge>
                          ))}
                        </div>
                        {checkin.reset_protocol_used && (
                          <p className="text-xs text-primary font-medium mt-3">✓ Reset Protocol completed</p>
                        )}
                      </CardContent>
                    </Card>
                  </>
                )}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default ClientView;
