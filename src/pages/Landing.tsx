import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { Camera, Zap, Target, ChevronRight, Check, Sparkles } from 'lucide-react';
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

      {/* Hero Section */}
      <section className="pt-32 pb-20 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-medium mb-8 animate-fade-up">
            <Sparkles className="h-4 w-4" />
            AI-Powered Macro Estimation
          </div>
          
          <h1 className="text-4xl md:text-6xl font-bold text-foreground mb-6 animate-fade-up" style={{ animationDelay: '0.1s' }}>
            Know Your Macros
            <span className="block text-primary">In Seconds</span>
          </h1>
          
          <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto mb-10 animate-fade-up" style={{ animationDelay: '0.2s' }}>
            Snap a photo of any meal and get instant calorie and macro estimates. 
            No tracking apps. No food diaries. Just informed decisions.
          </p>
          
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 animate-fade-up" style={{ animationDelay: '0.3s' }}>
            <Link to="/auth">
              <Button size="lg" className="h-14 px-8 text-lg font-semibold shadow-elevated">
                Start Free
                <ChevronRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
            <p className="text-sm text-muted-foreground">6 free scans • No credit card required</p>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-20 px-4 bg-secondary/50">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-4">
            How It Works
          </h2>
          <p className="text-muted-foreground text-center mb-16 max-w-xl mx-auto">
            Three simple steps to make smarter food choices
          </p>
          
          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                icon: Camera,
                step: '01',
                title: 'Snap a Photo',
                description: 'Take a quick photo of your meal or snack. Works with any food!'
              },
              {
                icon: Zap,
                step: '02',
                title: 'AI Analysis',
                description: 'Our AI identifies ingredients and estimates portions in seconds.'
              },
              {
                icon: Target,
                step: '03',
                title: 'Get Your Macros',
                description: 'See calories, protein, carbs, and fat ranges for your meal.'
              }
            ].map((item, index) => (
              <div 
                key={item.step}
                className="relative bg-card rounded-2xl p-8 shadow-soft animate-fade-up"
                style={{ animationDelay: `${0.1 * index}s` }}
              >
                <div className="absolute -top-4 left-8 text-6xl font-bold text-primary/10">
                  {item.step}
                </div>
                <div className="h-14 w-14 rounded-xl bg-primary/10 flex items-center justify-center mb-6">
                  <item.icon className="h-7 w-7 text-primary" />
                </div>
                <h3 className="text-xl font-semibold mb-3">{item.title}</h3>
                <p className="text-muted-foreground">{item.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-20 px-4">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-4">
            Why Project Lean?
          </h2>
          <p className="text-muted-foreground text-center mb-16 max-w-xl mx-auto">
            Built for people who want insight, not obsession
          </p>
          
          <div className="grid md:grid-cols-2 gap-6">
            {[
              {
                title: 'No Daily Tracking',
                description: "This isn't MyFitnessPal. Use it when you need it, skip it when you don't."
              },
              {
                title: 'Instant Results',
                description: 'Get macro estimates in under 10 seconds. No manual entry required.'
              },
              {
                title: 'Range-Based Estimates',
                description: 'We give you realistic ranges, not false precision. Because food varies.'
              },
              {
                title: 'Works Anywhere',
                description: 'Restaurant meals, home cooking, snacks — our AI handles it all.'
              },
              {
                title: 'Save Templates',
                description: 'Log your go-to meals once, use them forever with one tap.'
              },
              {
                title: 'Goal Tracking',
                description: 'Set daily calorie and protein targets. See your progress at a glance.'
              }
            ].map((feature, index) => (
              <div 
                key={feature.title}
                className="flex items-start gap-4 p-6 rounded-xl bg-card border border-border animate-fade-up"
                style={{ animationDelay: `${0.05 * index}s` }}
              >
                <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <Check className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <h3 className="font-semibold mb-1">{feature.title}</h3>
                  <p className="text-sm text-muted-foreground">{feature.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section className="py-20 px-4 bg-secondary/50">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-4">
            Simple Pricing
          </h2>
          <p className="text-muted-foreground text-center mb-16 max-w-xl mx-auto">
            Start free, upgrade when you need more
          </p>
          
          <div className="grid md:grid-cols-2 gap-8 max-w-3xl mx-auto">
            {/* Free Tier */}
            <div className="bg-card rounded-2xl p-8 shadow-soft border border-border">
              <h3 className="text-xl font-semibold mb-2">Free</h3>
              <div className="text-4xl font-bold mb-6">0 AED</div>
              <ul className="space-y-3 mb-8">
                <li className="flex items-center gap-3 text-muted-foreground">
                  <Check className="h-5 w-5 text-primary" />
                  6 meal scans
                </li>
                <li className="flex items-center gap-3 text-muted-foreground">
                  <Check className="h-5 w-5 text-primary" />
                  Full macro breakdown
                </li>
                <li className="flex items-center gap-3 text-muted-foreground">
                  <Check className="h-5 w-5 text-primary" />
                  Meal history
                </li>
              </ul>
              <Link to="/auth" className="block">
                <Button variant="outline" className="w-full h-12 font-semibold">
                  Get Started
                </Button>
              </Link>
            </div>
            
            {/* Pro Tier */}
            <div className="bg-foreground text-background rounded-2xl p-8 shadow-elevated relative overflow-hidden">
              <div className="absolute top-4 right-4 px-3 py-1 bg-primary text-primary-foreground text-xs font-medium rounded-full">
                Popular
              </div>
              <h3 className="text-xl font-semibold mb-2">Pro</h3>
              <div className="text-4xl font-bold mb-1">25 AED</div>
              <p className="text-sm opacity-70 mb-6">per month</p>
              <ul className="space-y-3 mb-8">
                <li className="flex items-center gap-3 opacity-90">
                  <Check className="h-5 w-5 text-primary" />
                  50 meal scans / month
                </li>
                <li className="flex items-center gap-3 opacity-90">
                  <Check className="h-5 w-5 text-primary" />
                  Full macro breakdown
                </li>
                <li className="flex items-center gap-3 opacity-90">
                  <Check className="h-5 w-5 text-primary" />
                  Complete meal history
                </li>
                <li className="flex items-center gap-3 opacity-90">
                  <Check className="h-5 w-5 text-primary" />
                  Goal tracking
                </li>
                <li className="flex items-center gap-3 opacity-90">
                  <Check className="h-5 w-5 text-primary" />
                  Saved templates
                </li>
              </ul>
              <Link to="/auth" className="block">
                <Button className="w-full h-12 font-semibold bg-primary hover:bg-primary/90">
                  Subscribe Now
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 px-4">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-6">
            Ready to Make Smarter<br />Food Choices?
          </h2>
          <p className="text-lg text-muted-foreground mb-10 max-w-xl mx-auto">
            Join hundreds of people using Project Lean to understand their meals better.
          </p>
          <Link to="/auth">
            <Button size="lg" className="h-14 px-10 text-lg font-semibold shadow-elevated">
              Start Your 6 Free Scans
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
