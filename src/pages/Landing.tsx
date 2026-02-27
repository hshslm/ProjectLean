import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { ChevronRight, Check, Brain, Shield, Zap, Target, BarChart3, AlertTriangle, Users, Sparkles } from 'lucide-react';
import projectLeanLogo from '@/assets/project-lean-logo.png';

const Landing = () => {
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
            Upgrade Your Thinking.
            <br />
            <span className="text-primary">Not Just Your Diet.</span>
          </h1>
          
          <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto mb-10 leading-relaxed">
            The Lean Brain™ is your AI-powered behavior system designed to eliminate all-or-nothing thinking, emotional eating, and inconsistency — for good.
          </p>
          
          <div className="flex flex-col items-center gap-4">
            <Link to="/auth">
              <Button size="lg" className="h-14 px-8 text-lg font-semibold shadow-elevated">
                Start Using The Lean Brain™
                <ChevronRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
            <p className="text-sm text-muted-foreground">79 AED/month — Cancel anytime</p>
          </div>
        </div>
      </section>

      {/* SECTION 2 — THE REAL PROBLEM */}
      <section className="py-24 px-4 bg-secondary/50">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-10 leading-tight">
            You Don't Have a Knowledge Problem.
            <br />
            <span className="text-primary">You Have a Pattern Problem.</span>
          </h2>
          
          <div className="space-y-6 text-lg text-muted-foreground leading-relaxed">
            <p>You know how to lose fat. You've done it before.</p>
            <p>But you fall into:</p>
            
            <ul className="space-y-3 pl-6">
              {[
                'All-or-nothing thinking',
                '"I already ruined the day"',
                'Emotional eating',
                'Restarting every Monday',
              ].map((item) => (
                <li key={item} className="flex items-start gap-3">
                  <AlertTriangle className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
            
            <p className="font-medium text-foreground">
              The issue isn't calories.<br />
              It's the way you think when things go wrong.
            </p>
            <p className="font-semibold text-foreground text-xl">
              That's what The Lean Brain™ fixes.
            </p>
          </div>
        </div>
      </section>

      {/* SECTION 3 — WHAT IS THE LEAN BRAIN™ */}
      <section className="py-24 px-4">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-10">
            What Is The Lean Brain™?
          </h2>
          
          <p className="text-lg text-muted-foreground text-center mb-10">
            The Lean Brain™ is a behavior intelligence system that:
          </p>
          
          <div className="grid sm:grid-cols-2 gap-4 mb-10">
            {[
              { icon: BarChart3, text: 'Tracks your daily execution' },
              { icon: Brain, text: 'Detects your cognitive patterns' },
              { icon: AlertTriangle, text: 'Identifies your risk triggers' },
              { icon: Zap, text: 'Coaches your recovery speed' },
              { icon: Target, text: 'Builds consistency without perfection' },
            ].map((item) => (
              <div key={item.text} className="flex items-center gap-4 p-5 rounded-xl bg-card border border-border">
                <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <item.icon className="h-5 w-5 text-primary" />
                </div>
                <span className="font-medium text-foreground">{item.text}</span>
              </div>
            ))}
          </div>
          
          <div className="text-center space-y-1">
            <p className="text-muted-foreground">This is not a macro tracker.</p>
            <p className="text-xl font-semibold text-foreground">This is your decision system.</p>
          </div>
        </div>
      </section>

      {/* SECTION 4 — HOW IT WORKS */}
      <section className="py-24 px-4 bg-secondary/50">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-16">
            Simple. Fast. Intelligent.
          </h2>
          
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { step: '01', text: 'Complete a 60-second daily check-in.' },
              { step: '02', text: 'Select which thought pattern showed up (if any).' },
              { step: '03', text: "Receive a direct AI response in Karim's coaching style." },
              { step: '04', text: 'Get weekly behavior insights and a focus theme.' },
            ].map((item) => (
              <div key={item.step} className="relative bg-card rounded-2xl p-6 border border-border">
                <div className="text-5xl font-bold text-primary/10 mb-4">{item.step}</div>
                <p className="text-foreground font-medium leading-relaxed">{item.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* SECTION 5 — WHAT IT TARGETS */}
      <section className="py-24 px-4">
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

      {/* SECTION 6 — INSIGHTS DASHBOARD */}
      <section className="py-24 px-4 bg-secondary/50">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-10">
            Your Behavior Intelligence Dashboard
          </h2>
          
          <div className="grid sm:grid-cols-2 gap-4 mb-8">
            {[
              { label: 'Consistency Score', desc: 'How often you execute your daily behaviors' },
              { label: 'Recovery Score', desc: 'How fast you bounce back after a bad day — this matters more than never failing' },
              { label: 'Pattern Frequency', desc: 'Which cognitive patterns are showing up most' },
              { label: 'Weekly Behavior Focus', desc: 'A targeted theme to improve each week' },
              { label: 'Personal Trigger Map', desc: 'Your unique risk situations and how to handle them' },
            ].map((item) => (
              <div key={item.label} className="p-5 rounded-xl bg-card border border-border">
                <h3 className="font-semibold text-foreground mb-1">{item.label}</h3>
                <p className="text-sm text-muted-foreground">{item.desc}</p>
              </div>
            ))}
          </div>
          
          <p className="text-center font-semibold text-foreground text-lg">
            Recovery speed matters more than mistakes.
          </p>
        </div>
      </section>

      {/* SECTION 7 — WHO THIS IS FOR */}
      <section className="py-24 px-4">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-10">
            The Lean Brain™ Is For You If:
          </h2>
          
          <div className="space-y-3 mb-10">
            {[
              "You've lost weight before but regained it",
              'You struggle with consistency',
              "You're disciplined in business but not with food",
              "You're tired of restarting",
              'You want structure without coaching calls',
            ].map((item) => (
              <div key={item} className="flex items-center gap-4 p-4 rounded-lg bg-card border border-border">
                <Check className="h-5 w-5 text-primary flex-shrink-0" />
                <span className="text-foreground">{item}</span>
              </div>
            ))}
          </div>
          
          <p className="text-center text-muted-foreground">
            If you want full coaching,{' '}
            <span className="font-semibold text-foreground">Project Lean Performance</span>{' '}
            may be better for you.
          </p>
        </div>
      </section>

      {/* SECTION 8 — VALUE STACK */}
      <section className="py-24 px-4 bg-secondary/50">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-10">
            Everything Inside The Lean Brain™
          </h2>
          
          <div className="grid sm:grid-cols-2 gap-3 mb-10">
            {[
              'Daily AI Behavior Coaching',
              'Pattern Detection Engine',
              '10-Minute Reset Protocol',
              'Weekly Behavior Themes',
              'Macro Photo Estimation',
              'Trigger Mapping System',
              'Progress Tracking Dashboard',
            ].map((item) => (
              <div key={item} className="flex items-center gap-3 p-4 rounded-lg bg-card border border-border">
                <Check className="h-5 w-5 text-primary flex-shrink-0" />
                <span className="font-medium text-foreground">{item}</span>
              </div>
            ))}
          </div>
          
          <div className="text-center space-y-2">
            <p className="text-muted-foreground">Comparable coaching tools cost 200–400 AED/month.</p>
            <p className="text-2xl font-bold text-foreground">The Lean Brain™: 79 AED/month.</p>
          </div>
        </div>
      </section>

      {/* SECTION 9 — PRICING */}
      <section className="py-24 px-4">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-16">
            Simple Pricing
          </h2>
          
          <div className="grid md:grid-cols-2 gap-8 max-w-3xl mx-auto">
            {/* Standard */}
            <div className="bg-card rounded-2xl p-8 border border-border shadow-soft">
              <h3 className="text-xl font-semibold mb-2">The Lean Brain™</h3>
              <div className="text-4xl font-bold text-foreground mb-1">79 AED</div>
              <p className="text-sm text-muted-foreground mb-6">per month</p>
              <ul className="space-y-3 mb-8">
                {['Cancel anytime', 'No long-term commitment', 'Full access to all features'].map((item) => (
                  <li key={item} className="flex items-center gap-3 text-muted-foreground">
                    <Check className="h-5 w-5 text-primary flex-shrink-0" />
                    {item}
                  </li>
                ))}
              </ul>
              <Link to="/auth" className="block">
                <Button className="w-full h-12 font-semibold">
                  Start Using The Lean Brain™
                </Button>
              </Link>
            </div>
            
            {/* Founding Member */}
            <div className="bg-foreground text-background rounded-2xl p-8 shadow-elevated relative overflow-hidden">
              <div className="absolute top-4 right-4 px-3 py-1 bg-primary text-primary-foreground text-xs font-medium rounded-full">
                Limited Spots
              </div>
              <h3 className="text-xl font-semibold mb-2">Founding Member</h3>
              <div className="text-4xl font-bold mb-1">69 AED</div>
              <p className="text-sm opacity-70 mb-6">per month — locked in</p>
              <ul className="space-y-3 mb-8">
                {['Everything in standard', 'Founding member pricing forever', 'Early access to new features'].map((item) => (
                  <li key={item} className="flex items-center gap-3 opacity-90">
                    <Check className="h-5 w-5 text-primary flex-shrink-0" />
                    {item}
                  </li>
                ))}
              </ul>
              <Link to="/auth" className="block">
                <Button className="w-full h-12 font-semibold bg-primary hover:bg-primary/90">
                  Claim Founding Access
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 10 — FINAL CLOSE */}
      <section className="py-24 px-4 bg-secondary/50">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-6 leading-tight">
            Stop Restarting.
            <br />
            <span className="text-primary">Start Thinking Differently.</span>
          </h2>
          
          <p className="text-lg text-muted-foreground max-w-xl mx-auto mb-10 leading-relaxed">
            You don't need more motivation.<br />
            You need a system that corrects you when you drift.<br /><br />
            That's The Lean Brain™.
          </p>
          
          <Link to="/auth">
            <Button size="lg" className="h-14 px-10 text-lg font-semibold shadow-elevated">
              Activate The Lean Brain™
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
