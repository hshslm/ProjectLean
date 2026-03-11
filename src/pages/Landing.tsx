import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { ChevronRight, Check, Brain, Shield, Zap, Target, BarChart3, AlertTriangle, Users, Sparkles, Heart, Flame, TrendingUp, MessageSquare, Play } from 'lucide-react';
import projectLeanLogo from '@/assets/project-lean-logo.png';
import screenshotMeals from '@/assets/screenshot-meals.png';
import screenshotGoals from '@/assets/screenshot-goals.png';
import demoVideo from '@/assets/demo-video.mp4';
import { useState, useRef } from 'react';

const Landing = () => {
  const [isVideoPlaying, setIsVideoPlaying] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  return (
    <div className="min-h-screen bg-background">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-md border-b border-border">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <img src={projectLeanLogo} alt="Project Lean" className="h-8 w-auto" />
          </Link>
          <div className="flex items-center gap-3">
            <Link to="/auth">
              <Button variant="ghost" size="sm">Sign In</Button>
            </Link>
            <Link to="/auth">
              <Button size="sm" className="font-semibold">Get Started</Button>
            </Link>
          </div>
        </div>
      </nav>

      {/* SECTION 1 — HERO */}
      <section className="pt-32 pb-24 px-4">
        <div className="max-w-3xl mx-auto text-center">
          <h1 className="text-4xl md:text-6xl font-bold text-foreground mb-6 leading-tight">
            You Don't Have a Knowledge Problem.
            <br />
            <span className="text-primary">You Have a Pattern Problem.</span>
          </h1>
          
          <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto mb-10 leading-relaxed">
            You've lost weight before. You know what to do. But at 10pm, after a bad day, the plan breaks — and nothing catches you. That's what Lean Brain fixes.
          </p>
          
          <div className="flex flex-col items-center gap-4">
            <Link to="/auth?signup=true">
              <Button size="lg" className="h-14 px-8 text-lg font-semibold shadow-elevated">
                Create Your Free Account
                <ChevronRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
            <p className="text-sm text-muted-foreground">No card required. Your first check-in is free.</p>
          </div>

        </div>
      </section>

      {/* APP SHOWCASE — Screenshots + Video */}
      <section className="py-24 px-4 bg-secondary/50">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-4">
            See It In Action
          </h2>
          <p className="text-muted-foreground text-center mb-16 max-w-xl mx-auto">
            Check in daily, spot your patterns, and get a direct correction — all in one place.
          </p>
          
          <div className="flex flex-col md:flex-row items-start justify-center gap-10 md:gap-8">
            {/* Meal Tracker Screenshots */}
            <div className="flex flex-col items-center gap-6">
              <div className="flex gap-4">
                <div className="max-w-[200px]">
                  <div className="relative rounded-[2rem] overflow-hidden shadow-elevated bg-foreground p-1.5">
                    <div className="rounded-[1.75rem] overflow-hidden">
                      <img src={screenshotMeals} alt="Meal tracking with daily totals" className="w-full h-auto" />
                    </div>
                    <div className="absolute top-3 left-1/2 -translate-x-1/2 w-16 h-4 bg-foreground rounded-full" />
                  </div>
                  <p className="text-center text-xs text-muted-foreground mt-3">Meal Tracking</p>
                </div>
                <div className="max-w-[200px]">
                  <div className="relative rounded-[2rem] overflow-hidden shadow-elevated bg-foreground p-1.5">
                    <div className="rounded-[1.75rem] overflow-hidden">
                      <img src={screenshotGoals} alt="Daily goals tracking" className="w-full h-auto" />
                    </div>
                    <div className="absolute top-3 left-1/2 -translate-x-1/2 w-16 h-4 bg-foreground rounded-full" />
                  </div>
                  <p className="text-center text-xs text-muted-foreground mt-3">Goal Progress</p>
                </div>
              </div>
            </div>

            {/* Behavior Insights Mockup */}
            <div className="max-w-[220px]">
              <div className="relative rounded-[2rem] overflow-hidden shadow-elevated bg-foreground p-1.5">
                <div className="rounded-[1.75rem] overflow-hidden bg-background">
                  <div className="p-4 space-y-3" style={{ minHeight: '420px' }}>
                    <div className="text-center pb-2">
                      <p className="text-xs text-muted-foreground font-medium">Insights</p>
                    </div>
                    <div className="bg-primary/10 rounded-lg p-3">
                      <p className="text-xs font-semibold text-primary">🎯 Consistency Week</p>
                      <p className="text-[10px] text-muted-foreground">Strong habits — keep it rolling.</p>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      {[
                        { icon: Flame, val: '4', label: 'Day Streak' },
                        { icon: Zap, val: '3.9', label: 'Avg Habits/Day' },
                        { icon: TrendingUp, val: '7/7', label: 'Days Tracked' },
                        { icon: Heart, val: '93', label: 'Recovery Score' },
                      ].map((s) => (
                        <div key={s.label} className="bg-card rounded-lg p-3 border border-border text-center">
                          <s.icon className="h-4 w-4 text-primary mx-auto mb-1" />
                          <p className="text-lg font-bold text-foreground">{s.val}</p>
                          <p className="text-[9px] text-muted-foreground">{s.label}</p>
                        </div>
                      ))}
                    </div>
                    <div className="bg-card rounded-lg p-3 border border-border">
                      <p className="text-xs font-semibold text-foreground mb-2">Pattern Frequency</p>
                      {[
                        { name: 'All-or-nothing', count: '1x' },
                        { name: 'Emotional eating', count: '1x' },
                        { name: '"Ruined the day"', count: '1x' },
                      ].map((p) => (
                        <div key={p.name} className="flex justify-between items-center mb-1">
                          <span className="text-[10px] text-muted-foreground">{p.name}</span>
                          <span className="text-[10px] font-medium bg-primary/10 text-primary px-1.5 py-0.5 rounded">{p.count}</span>
                        </div>
                      ))}
                      <p className="text-[9px] text-primary mt-2">4 clean days with no negative patterns</p>
                    </div>
                  </div>
                </div>
                <div className="absolute top-3 left-1/2 -translate-x-1/2 w-16 h-4 bg-foreground rounded-full" />
              </div>
              <p className="text-center text-xs text-muted-foreground mt-3">Behavior Insights</p>
            </div>

            {/* Check-In Mockup */}
            <div className="max-w-[220px]">
              <div className="relative rounded-[2rem] overflow-hidden shadow-elevated bg-foreground p-1.5">
                <div className="rounded-[1.75rem] overflow-hidden bg-background">
                  <div className="p-4 space-y-3" style={{ minHeight: '420px' }}>
                    <div className="text-center pb-2">
                      <p className="text-xs text-muted-foreground font-medium">Check-In</p>
                    </div>
                    <div className="bg-primary/5 border border-primary/20 rounded-lg p-3">
                      <div className="flex items-center gap-1.5 mb-2">
                        <MessageSquare className="h-3 w-3 text-primary" />
                        <p className="text-[10px] font-semibold text-primary">Karim</p>
                      </div>
                      <p className="text-[10px] text-foreground leading-relaxed">
                        The all-or-nothing mindset is a structural trap. Next time the schedule breaks, execute a fifteen-minute movement session instead of skipping entirely. Consistency is found in your minimum standards.
                      </p>
                    </div>
                    <div className="bg-card rounded-lg p-3 border border-border">
                      <div className="flex justify-between items-center mb-2">
                        <p className="text-xs font-semibold text-foreground">Daily Habits</p>
                        <span className="text-[10px] text-primary font-medium">5/5</span>
                      </div>
                      {['Protein', 'Steps', 'Sleep', 'Training', 'Aligned Eating'].map((h) => (
                        <div key={h} className="flex items-center gap-2 mb-1.5">
                          <div className="h-4 w-4 rounded-full bg-primary/10 flex items-center justify-center">
                            <Check className="h-2.5 w-2.5 text-primary" />
                          </div>
                          <span className="text-[10px] text-foreground">{h}</span>
                        </div>
                      ))}
                    </div>
                    <div className="bg-card rounded-lg p-3 border border-border">
                      <p className="text-xs font-semibold text-foreground mb-2">Today's Pattern</p>
                      <div className="inline-block bg-primary/10 text-primary text-[10px] px-2 py-1 rounded">
                        No negative pattern today ✓
                      </div>
                    </div>
                  </div>
                </div>
                <div className="absolute top-3 left-1/2 -translate-x-1/2 w-16 h-4 bg-foreground rounded-full" />
              </div>
              <p className="text-center text-xs text-muted-foreground mt-3">AI Coaching Check-In</p>
            </div>
          </div>

          {/* Demo Video */}
          <div className="mt-16 max-w-xs mx-auto">
            <div className="relative rounded-[2.5rem] overflow-hidden shadow-elevated bg-foreground p-2">
              <div className="rounded-[2rem] overflow-hidden bg-black">
                <div className="aspect-[9/19.5] relative">
                  <video
                    ref={videoRef}
                    src={demoVideo}
                    className="w-full h-full object-cover"
                    loop
                    muted
                    playsInline
                    onClick={() => {
                      if (videoRef.current) {
                        if (videoRef.current.paused) {
                          videoRef.current.play();
                          setIsVideoPlaying(true);
                        } else {
                          videoRef.current.pause();
                          setIsVideoPlaying(false);
                        }
                      }
                    }}
                  />
                  {!isVideoPlaying && (
                    <button
                      onClick={() => {
                        if (videoRef.current) {
                          videoRef.current.play();
                          setIsVideoPlaying(true);
                        }
                      }}
                      className="absolute inset-0 flex items-center justify-center bg-black/40 transition-opacity hover:bg-black/50"
                    >
                      <div className="h-16 w-16 rounded-full bg-white/90 flex items-center justify-center shadow-lg">
                        <Play className="h-7 w-7 text-primary ml-1" fill="currentColor" />
                      </div>
                    </button>
                  )}
                </div>
              </div>
              <div className="absolute top-4 left-1/2 -translate-x-1/2 w-24 h-6 bg-foreground rounded-full" />
            </div>
            <p className="text-center text-sm text-muted-foreground mt-4">Watch the full demo</p>
          </div>
        </div>
      </section>

      {/* SECTION 2 — THE PROBLEM */}
      <section className="py-24 px-4 bg-secondary/50">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-10 leading-tight">
            The issue isn't your diet.
            <br />
            <span className="text-primary">It's what happens when things go wrong.</span>
          </h2>
          
          <div className="space-y-6 text-lg text-muted-foreground leading-relaxed">
            <p>Every restart looks the same. One bad meal becomes a bad day. One bad day becomes a bad week. Not because you lack discipline — because you have no system for the drift.</p>
            
            <p className="font-semibold text-foreground text-xl">
              Lean Brain catches you before the spiral completes.
            </p>
          </div>
        </div>
      </section>

      {/* SECTION 3 — WHAT IT IS */}
      <section className="py-24 px-4">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-10">
            This is not a tracker. <span className="text-primary">This is a correction system.</span>
          </h2>
          
          <div className="space-y-6 text-lg text-muted-foreground leading-relaxed">
            <p>Lean Brain detects the thinking pattern behind the decision — before the damage is done.</p>
            <p>Every day, you check in. If a pattern shows up — all-or-nothing, emotional eating, "I already ruined it" — Lean Brain names it, reframes it, and tells you exactly what to do next.</p>
            <p className="font-semibold text-foreground">No guilt. No motivation speech. Just a direct correction and a next move.</p>
          </div>
        </div>
      </section>

      {/* SECTION 4 — HOW IT WORKS */}
      <section className="py-24 px-4 bg-secondary/50">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-16">
            60 seconds a day. <span className="text-primary">Every day.</span>
          </h2>
          
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { step: '01', text: 'Complete your daily check-in' },
              { step: '02', text: 'Flag any pattern that showed up' },
              { step: '03', text: 'Get a direct response in structured coaching language' },
              { step: '04', text: 'Track your recovery speed over time' },
            ].map((item) => (
              <div key={item.step} className="relative bg-card rounded-2xl p-6 border border-border">
                <div className="text-5xl font-bold text-primary/10 mb-4">{item.step}</div>
                <p className="text-foreground font-medium leading-relaxed">{item.text}</p>
              </div>
            ))}
          </div>
          
          <p className="text-center text-lg text-muted-foreground mt-10">
            Most systems reward perfection. <span className="font-semibold text-foreground">Lean Brain rewards how fast you recover.</span>
          </p>
        </div>
      </section>



      {/* SECTION 5 — WHAT IT TARGETS */}
      <section className="py-24 px-4 bg-secondary/50">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-10">
            Designed to Eliminate These Patterns:
          </h2>
          
          <div className="grid sm:grid-cols-2 gap-3 mb-10">
            {[
              'All-or-nothing thinking',
              '"I already ruined the day"',
              'Emotional eating under stress',
              'Weekend sabotage',
              'Social pressure overeating',
              'Scale obsession',
              'Over-restricting and compensating',
            ].map((pattern) => (
              <div key={pattern} className="flex items-center gap-3 p-4 rounded-lg bg-card border border-border">
                <div className="h-2 w-2 rounded-full bg-primary flex-shrink-0" />
                <span className="text-foreground">{pattern}</span>
              </div>
            ))}
          </div>
          
          <div className="text-center space-y-1">
            <p className="text-muted-foreground">We don't chase perfection.</p>
            <p className="font-semibold text-foreground">We build minimum effective consistency.</p>
          </div>
        </div>
      </section>

      {/* SECTION 5 — THE DASHBOARD */}
      <section className="py-24 px-4 bg-secondary/50">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-10">
            Your behavior, measured — <span className="text-primary">not guessed.</span>
          </h2>
          
          <div className="grid sm:grid-cols-2 gap-4 mb-8">
            {[
              { label: 'Consistency Score', desc: 'How often you execute — not how perfectly' },
              { label: 'Recovery Score', desc: 'How fast you bounce back after a bad day' },
              { label: 'Pattern Frequency', desc: 'Which thought traps show up most in your life' },
              { label: 'Trigger Map', desc: 'The exact situations that break you — and your protocol for each' },
              { label: 'Weekly Focus', desc: 'One behavior to sharpen this week' },
            ].map((item) => (
              <div key={item.label} className="p-5 rounded-xl bg-card border border-border">
                <h3 className="font-semibold text-foreground mb-1">{item.label}</h3>
                <p className="text-sm text-muted-foreground">{item.desc}</p>
              </div>
            ))}
          </div>
          
          <p className="text-center font-semibold text-foreground text-lg mb-12">
            Recovery speed matters more than never failing. That's what Lean Brain tracks.
          </p>

          {/* Behavior Dashboard Mockups */}
          <div className="flex flex-col md:flex-row items-start justify-center gap-8">
            {/* Insights Mockup */}
            <div className="max-w-[220px] mx-auto">
              <div className="relative rounded-[2rem] overflow-hidden shadow-elevated bg-foreground p-1.5">
                <div className="rounded-[1.75rem] overflow-hidden bg-background">
                  <div className="p-4 space-y-3" style={{ minHeight: '400px' }}>
                    <div className="text-center pb-1">
                      <p className="text-xs text-muted-foreground font-medium">Insights</p>
                    </div>
                    <div className="bg-primary/10 rounded-lg p-3">
                      <p className="text-xs font-semibold text-primary">🎯 Consistency Week</p>
                      <p className="text-[10px] text-muted-foreground">Strong habits — keep it rolling.</p>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      {[
                        { icon: Flame, val: '4', label: 'Day Streak' },
                        { icon: Zap, val: '3.9', label: 'Avg Habits/Day' },
                        { icon: TrendingUp, val: '7/7', label: 'Days Tracked' },
                        { icon: Heart, val: '93', label: 'Recovery Score' },
                      ].map((s) => (
                        <div key={s.label} className="bg-card rounded-lg p-2.5 border border-border text-center">
                          <s.icon className="h-3.5 w-3.5 text-primary mx-auto mb-1" />
                          <p className="text-base font-bold text-foreground">{s.val}</p>
                          <p className="text-[8px] text-muted-foreground">{s.label}</p>
                        </div>
                      ))}
                    </div>
                    <div className="bg-card rounded-lg p-3 border border-border">
                      <p className="text-xs font-semibold text-foreground mb-2">Pattern Frequency</p>
                      {[
                        { name: 'All-or-nothing', count: '1x' },
                        { name: 'Emotional eating', count: '1x' },
                        { name: '"Ruined the day"', count: '1x' },
                      ].map((p) => (
                        <div key={p.name} className="flex justify-between items-center mb-1">
                          <span className="text-[10px] text-muted-foreground">{p.name}</span>
                          <span className="text-[10px] font-medium bg-primary/10 text-primary px-1.5 py-0.5 rounded">{p.count}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
                <div className="absolute top-3 left-1/2 -translate-x-1/2 w-16 h-4 bg-foreground rounded-full" />
              </div>
              <p className="text-center text-xs text-muted-foreground mt-3">Weekly Insights</p>
            </div>

            {/* Check-In Mockup */}
            <div className="max-w-[220px] mx-auto">
              <div className="relative rounded-[2rem] overflow-hidden shadow-elevated bg-foreground p-1.5">
                <div className="rounded-[1.75rem] overflow-hidden bg-background">
                  <div className="p-4 space-y-3" style={{ minHeight: '400px' }}>
                    <div className="text-center pb-1">
                      <p className="text-xs text-muted-foreground font-medium">Check-In</p>
                    </div>
                    <div className="bg-primary/5 border border-primary/20 rounded-lg p-3">
                      <div className="flex items-center gap-1.5 mb-2">
                        <MessageSquare className="h-3 w-3 text-primary" />
                        <p className="text-[10px] font-semibold text-primary">Karim</p>
                      </div>
                      <p className="text-[10px] text-foreground leading-relaxed">
                        The all-or-nothing mindset is a structural trap. Consistency is found in your minimum standards, not your peak performance.
                      </p>
                    </div>
                    <div className="bg-card rounded-lg p-3 border border-border">
                      <div className="flex justify-between items-center mb-2">
                        <p className="text-xs font-semibold text-foreground">Daily Habits</p>
                        <span className="text-[10px] text-primary font-medium">5/5</span>
                      </div>
                      {['Protein', 'Steps', 'Sleep', 'Training', 'Aligned Eating'].map((h) => (
                        <div key={h} className="flex items-center gap-2 mb-1.5">
                          <div className="h-4 w-4 rounded-full bg-primary/10 flex items-center justify-center">
                            <Check className="h-2.5 w-2.5 text-primary" />
                          </div>
                          <span className="text-[10px] text-foreground">{h}</span>
                        </div>
                      ))}
                    </div>
                    <div className="bg-card rounded-lg p-3 border border-border">
                      <p className="text-xs font-semibold text-foreground mb-2">Today's Pattern</p>
                      <div className="inline-block bg-primary/10 text-primary text-[10px] px-2 py-1 rounded">
                        No negative pattern today ✓
                      </div>
                    </div>
                  </div>
                </div>
                <div className="absolute top-3 left-1/2 -translate-x-1/2 w-16 h-4 bg-foreground rounded-full" />
              </div>
              <p className="text-center text-xs text-muted-foreground mt-3">AI Coaching</p>
            </div>

            {/* Mood & Patterns Mockup */}
            <div className="max-w-[220px] mx-auto">
              <div className="relative rounded-[2rem] overflow-hidden shadow-elevated bg-foreground p-1.5">
                <div className="rounded-[1.75rem] overflow-hidden bg-background">
                  <div className="p-4 space-y-3" style={{ minHeight: '400px' }}>
                    <div className="text-center pb-1">
                      <p className="text-xs text-muted-foreground font-medium">Behavior Map</p>
                    </div>
                    <div className="bg-card rounded-lg p-3 border border-border">
                      <p className="text-xs font-semibold text-foreground mb-2">Mood & Stress</p>
                      <div className="flex gap-1 items-end h-12 mb-1">
                        {[8,7,4,5,7,6,8].map((v, i) => (
                          <div key={i} className="flex-1 bg-primary rounded-sm" style={{ height: `${v * 10}%` }} />
                        ))}
                      </div>
                      <p className="text-[9px] text-muted-foreground">Avg Mood: 6.4/10</p>
                    </div>
                    <div className="bg-card rounded-lg p-3 border border-border">
                      <p className="text-xs font-semibold text-foreground mb-2">Stress Levels</p>
                      <div className="flex gap-1 items-end h-12 mb-1">
                        {[3,4,8,6,4,5,2].map((v, i) => (
                          <div key={i} className="flex-1 bg-primary/40 rounded-sm" style={{ height: `${v * 10}%` }} />
                        ))}
                      </div>
                      <p className="text-[9px] text-muted-foreground">Avg Stress: 4.6/10</p>
                    </div>
                    <div className="bg-card rounded-lg p-3 border border-border">
                      <p className="text-xs font-semibold text-foreground mb-2">Recovery Score</p>
                      <div className="flex items-center gap-2">
                        <Heart className="h-4 w-4 text-primary" />
                        <div className="flex-1 bg-secondary rounded-full h-2">
                          <div className="bg-primary rounded-full h-2" style={{ width: '93%' }} />
                        </div>
                        <span className="text-xs font-bold text-foreground">93</span>
                      </div>
                      <p className="text-[9px] text-muted-foreground mt-1">Bounced back 2 out of 2 tough days</p>
                    </div>
                    <div className="bg-primary/10 rounded-lg p-2.5">
                      <p className="text-[9px] text-primary font-medium">Reset Protocol used 1x this week</p>
                    </div>
                  </div>
                </div>
                <div className="absolute top-3 left-1/2 -translate-x-1/2 w-16 h-4 bg-foreground rounded-full" />
              </div>
              <p className="text-center text-xs text-muted-foreground mt-3">Trigger Map</p>
            </div>
          </div>
        </div>
      </section>

      {/* LEAN BRAIN CHAT */}
      <section className="py-24 px-4">
        <div className="max-w-4xl mx-auto">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <div className="inline-flex items-center gap-2 bg-primary/10 text-primary text-sm font-medium px-3 py-1.5 rounded-full mb-6">
                <MessageSquare className="h-4 w-4" />
                Lean Brain Chat
              </div>
              <h2 className="text-3xl md:text-4xl font-bold mb-6 leading-tight">
                AI that knows your
                <br />
                <span className="text-primary">patterns — and corrects them.</span>
              </h2>
              <p className="text-muted-foreground mb-6 leading-relaxed">
                Mid-spiral? Planning dinner? Not sure if the day is salvageable? Open the chat. Lean Brain knows your patterns, your macros, and your triggers — and gives you a direct, no-fluff response in seconds.
              </p>
              <div className="space-y-3">
                {[
                  "Handles spirals before they become binges",
                  "Plans meals based on your remaining macros",
                  "Breaks patterns with data, not motivation",
                  "Available 24/7 — no scheduling, no waiting",
                ].map((point) => (
                  <div key={point} className="flex items-center gap-3">
                    <Check className="h-4 w-4 text-primary flex-shrink-0" />
                    <span className="text-sm text-foreground">{point}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Chat Mockup */}
            <div className="max-w-[260px] mx-auto">
              <div className="relative rounded-[2rem] overflow-hidden shadow-elevated bg-foreground p-1.5">
                <div className="rounded-[1.75rem] overflow-hidden bg-background">
                  <div className="p-4 space-y-3" style={{ minHeight: '420px' }}>
                    <div className="text-center pb-2 border-b border-border">
                      <p className="text-xs font-semibold text-foreground">Lean Brain Chat</p>
                      <p className="text-[9px] text-muted-foreground">Your behavioral coach</p>
                    </div>
                    
                    {/* User message */}
                    <div className="flex justify-end">
                      <div className="bg-primary text-primary-foreground rounded-2xl rounded-br-sm px-3 py-2 max-w-[85%]">
                        <p className="text-[10px]">I already had pizza for lunch and I feel like the day is ruined. Should I just start fresh tomorrow?</p>
                      </div>
                    </div>
                    
                    {/* AI response */}
                    <div className="flex justify-start">
                      <div className="bg-card border border-border rounded-2xl rounded-bl-sm px-3 py-2 max-w-[90%]">
                        <div className="flex items-center gap-1 mb-1">
                          <Brain className="h-2.5 w-2.5 text-primary" />
                          <p className="text-[9px] font-semibold text-primary">Karim</p>
                        </div>
                        <p className="text-[10px] text-foreground leading-relaxed">
                          No. The day isn't ruined — that's the all-or-nothing trap. You have 800 cals left. Hit protein at dinner (grilled chicken + veg) and you'll close within range. One off-meal doesn't erase consistency.
                        </p>
                      </div>
                    </div>

                    {/* User follow-up */}
                    <div className="flex justify-end">
                      <div className="bg-primary text-primary-foreground rounded-2xl rounded-br-sm px-3 py-2 max-w-[85%]">
                        <p className="text-[10px]">What should I eat for dinner then?</p>
                      </div>
                    </div>

                    {/* AI meal suggestion */}
                    <div className="flex justify-start">
                      <div className="bg-card border border-border rounded-2xl rounded-bl-sm px-3 py-2 max-w-[90%]">
                        <div className="flex items-center gap-1 mb-1">
                          <Brain className="h-2.5 w-2.5 text-primary" />
                          <p className="text-[9px] font-semibold text-primary">Karim</p>
                        </div>
                        <p className="text-[10px] text-foreground leading-relaxed">
                          200g grilled chicken, roasted veg, small portion of rice. ~550 cal, 45g protein. You'll finish the day at 85% — that's a win.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="absolute top-3 left-1/2 -translate-x-1/2 w-16 h-4 bg-foreground rounded-full" />
              </div>
              <p className="text-center text-xs text-muted-foreground mt-3">Real-time AI coaching</p>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 6 — WHO IT'S FOR */}
      <section className="py-24 px-4 bg-secondary/50">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-10">
            Lean Brain is for you if:
          </h2>
          
          <div className="space-y-3 mb-10">
            {[
              "You've lost the weight before. More than once.",
              "You're structured at work, but food is still chaos.",
              "You're tired of Monday restarts.",
              "You want a system that works without coaching calls.",
              "You know what to do. You just need something there when you don't do it.",
            ].map((item) => (
              <div key={item} className="flex items-center gap-4 p-4 rounded-lg bg-card border border-border">
                <Check className="h-5 w-5 text-primary flex-shrink-0" />
                <span className="text-foreground">{item}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* SECTION 8 — VALUE STACK */}
      <section className="py-24 px-4 bg-secondary/50">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-10">
            Everything Inside The Lean Brain™
          </h2>
          
          <div className="space-y-4 mb-10">
            {[
              { title: 'Daily coaching response', desc: 'based on your actual check-in, not generic advice' },
              { title: 'Lean Brain Chat', desc: 'message your AI coach anytime — mid-spiral, pre-meal, or post-slip' },
              { title: 'Pattern recognition', desc: 'Lean Brain identifies which thought trap showed up and names it' },
              { title: '5-Minute Reset Protocol', desc: 'when the day breaks down, this is your next move' },
              { title: 'Weekly behavior focus', desc: 'one thing to sharpen this week, not ten' },
              { title: 'Meal photo logging', desc: 'no calorie counting, no apps, just a photo' },
              { title: 'Trigger mapping', desc: 'your personal list of high-risk situations and how to handle each one' },
              { title: 'Progress dashboard', desc: 'your consistency, recovery speed, and patterns tracked over time' },
            ].map((item) => (
              <div key={item.title} className="flex items-start gap-4 p-5 rounded-xl bg-card border border-border">
                <Check className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                <div>
                  <span className="font-semibold text-foreground">{item.title}</span>
                  <span className="text-muted-foreground"> — {item.desc}</span>
                </div>
              </div>
            ))}
          </div>
          
          <div className="text-center">
            <p className="text-2xl font-bold text-foreground">Early Access / Founders Pricing — 129 AED/month.</p>
          </div>
        </div>
      </section>

      {/* SECTION 9 — FREE TRIAL + PRICING */}
      <section className="py-24 px-4">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-6 leading-tight">
            Start With One Check-In.
            <br />
            <span className="text-primary">No Card Required.</span>
          </h2>
          
          <p className="text-lg text-muted-foreground text-center max-w-2xl mx-auto mb-16 leading-relaxed">
            Complete your first daily check-in for free. See exactly how Lean Brain reads your patterns and responds. If it doesn't feel different from anything you've tried — don't subscribe. If it does, you're in for 129 AED/month.
          </p>
          
          <div className="max-w-md mx-auto">
            <div className="bg-card rounded-2xl p-8 border border-border shadow-soft">
              <p className="text-xs text-primary font-medium uppercase tracking-wide mb-2">Founders Pricing — this price will not stay here.</p>
              <h3 className="text-xl font-semibold mb-2">The Lean Brain™</h3>
              <div className="text-4xl font-bold text-foreground mb-1">129 AED</div>
              <p className="text-sm text-muted-foreground mb-6">per month</p>
              
              <div className="space-y-3 mb-8">
                {[
                  'Daily behavior check-in and AI coaching response',
                  'Pattern detection and tracking',
                  'Real-time chat — available when the plan breaks',
                  'Macro tracking with meal photo logging',
                  'Recovery score and weekly behavior insights',
                  'Trigger mapping and personal risk protocols',
                ].map((item) => (
                  <div key={item} className="flex items-start gap-3 text-foreground">
                    <Check className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                    <span className="text-sm">{item}</span>
                  </div>
                ))}
              </div>
              
              <p className="text-xs text-muted-foreground text-center mb-6">
                No long-term commitment. Cancel anytime.
              </p>
              
              <Link to="/auth?signup=true" className="block">
                <Button className="w-full h-12 font-semibold">
                  Create Your Free Account
                </Button>
              </Link>
              
              <p className="text-xs text-center text-muted-foreground mt-4 font-medium">
                129 AED is founders pricing. When this closes, it closes.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-24 px-4">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-4">
            Common Questions
          </h2>
          <p className="text-muted-foreground text-center mb-12 max-w-xl mx-auto">
            Everything you need to know before getting started.
          </p>

          <div className="space-y-0 divide-y divide-border">
            {[
              {
                q: "How does the AI coaching actually work?",
                a: "Every day you complete a 60-second check-in — sleep, training, stress, eating patterns. Our AI analyzes your responses over time, identifies your specific behavioral triggers, and gives you a direct, personalized correction. It's not generic advice — it's pattern recognition trained on your data."
              },
              {
                q: "Is my data private and secure?",
                a: "Absolutely. Your data is encrypted, stored securely, and never shared with third parties. Only you and your AI coach can see your check-ins and patterns. We take privacy seriously — your health data stays yours."
              },
              {
                q: "How is this different from MyFitnessPal or Noom?",
                a: "Those apps track calories. We track behavior. MyFitnessPal tells you what you ate. Lean Brain tells you why you ate it — and what to do differently next time. We focus on the patterns that cause the plan to break, not the plan itself."
              },
              {
                q: "What if I miss a day?",
                a: "Nothing breaks. The system picks up right where you left off. In fact, gaps in your check-ins are data too — they often reveal avoidance patterns that your coach will flag. There's no streak pressure here, just honest pattern tracking."
              },
              {
                q: "Do I need to follow a specific diet or training plan?",
                a: "No. Lean Brain works with whatever plan you're already following. It doesn't replace your diet — it fixes the behavioral patterns that keep derailing it. Whether you're counting macros, doing keto, or just trying to eat better, the system adapts to you."
              },
              {
                q: "What happens after the free check-in?",
                a: "After your first free check-in, you can subscribe for 79 AED/month to get daily AI coaching, pattern recognition, recovery tracking, and your full behavior dashboard. No long-term commitment — cancel anytime."
              }
            ].map((faq, i) => (
              <details key={i} className="group py-5">
                <summary className="flex items-center justify-between cursor-pointer list-none">
                  <span className="font-medium text-foreground pr-4">{faq.q}</span>
                  <ChevronRight className="h-4 w-4 text-muted-foreground flex-shrink-0 transition-transform duration-200 group-open:rotate-90" />
                </summary>
                <p className="mt-3 text-sm text-muted-foreground leading-relaxed pr-8">
                  {faq.a}
                </p>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* CLOSING CTA */}
      <section className="py-24 px-4 bg-secondary/50">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-6 leading-tight">
            Stop restarting.
            <br />
            <span className="text-primary">Start correcting.</span>
          </h2>
          
          <p className="text-lg text-muted-foreground max-w-xl mx-auto mb-10 leading-relaxed">
            You don't need more information. You need something present at the moment the plan breaks.
          </p>
          
          <Link to="/auth?signup=true">
            <Button size="lg" className="h-14 px-10 text-lg font-semibold shadow-elevated">
              Start Your Free Check-In
              <ChevronRight className="ml-2 h-5 w-5" />
            </Button>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 px-4 border-t border-border">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <img src={projectLeanLogo} alt="Project Lean" className="h-6 w-auto opacity-70" />
          </div>
          <p className="text-sm text-muted-foreground">
            © {new Date().getFullYear()} Project Lean. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
};

export default Landing;
