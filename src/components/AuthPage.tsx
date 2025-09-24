import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { z } from 'zod';

const authSchema = z.object({
  email: z.string().email('Invalid email format'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

export const AuthPage: React.FC = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleAuth = async (type: 'login' | 'signup', email: string, password: string) => {
    setIsLoading(true);
    setError('');

    try {
      // Validate input
      authSchema.parse({ email, password });

      if (type === 'signup') {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: `${window.location.origin}/`
          }
        });
        
        if (error) {
          if (error.message.includes('already registered')) {
            setError('This email is already registered. Please sign in instead.');
          } else {
            setError(error.message);
          }
          return;
        }
        
        toast.success('Check your email for verification link');
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        
        if (error) {
          if (error.message.includes('Invalid login credentials')) {
            setError('Invalid email or password. Please try again.');
          } else {
            setError(error.message);
          }
          return;
        }
        
        navigate('/');
      }
    } catch (err) {
      if (err instanceof z.ZodError) {
        setError(err.issues[0].message);
      } else {
        setError('An unexpected error occurred');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const AuthForm = ({ type }: { type: 'login' | 'signup' }) => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');

    return (
      <form
        onSubmit={(e) => {
          e.preventDefault();
          handleAuth(type, email, password);
        }}
        className="space-y-4"
      >
        <div className="space-y-2">
          <Label htmlFor={`${type}-email`}>Email</Label>
          <Input
            id={`${type}-email`}
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="your@email.com"
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor={`${type}-password`}>Password</Label>
          <Input
            id={`${type}-password`}
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Your password"
            required
            minLength={6}
          />
        </div>

        <Button type="submit" className="w-full" disabled={isLoading}>
          {isLoading ? 'Please wait...' : type === 'login' ? 'Sign In' : 'Sign Up'}
        </Button>
      </form>
    );
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-center">Cart Drawer App</CardTitle>
        </CardHeader>
        <CardContent>
          {error && (
            <Alert className="mb-4">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <Tabs defaultValue="login" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="login">Sign In</TabsTrigger>
              <TabsTrigger value="signup">Sign Up</TabsTrigger>
            </TabsList>

            <TabsContent value="login" className="mt-6">
              <AuthForm type="login" />
            </TabsContent>

            <TabsContent value="signup" className="mt-6">
              <AuthForm type="signup" />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};