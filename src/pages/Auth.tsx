import React, { useState, useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Loader2, Package } from 'lucide-react';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { SEO } from '@/components/SEO';

export const Auth = () => {
  const { user, signIn, signUp, isLoading } = useAuth();
  const [loginData, setLoginData] = useState({ email: '', password: '' });
  const [signupData, setSignupData] = useState({ email: '', password: '', name: '' });
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Redirect if already authenticated
  if (!isLoading && user) {
    return <Navigate to="/" replace />;
  }

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    await signIn(loginData.email, loginData.password);
    
    setIsSubmitting(false);
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    await signUp(signupData.email, signupData.password, signupData.name);
    
    setIsSubmitting(false);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background to-secondary/20 p-4">
      <SEO 
        title="Entrar - Sistema de Encomendas"
        description="Faça login ou cadastre-se no sistema de registro de encomendas por departamentos"
        keywords="login, cadastro, encomendas, sistema, autenticação"
      />
      
      <div className="w-full max-w-md">
        <div className="flex items-center justify-center mb-8">
          <div className="flex items-center space-x-2">
            <Package className="h-8 w-8 text-primary" />
            <h1 className="text-2xl font-bold text-foreground">Encomendas</h1>
          </div>
        </div>

        <Tabs defaultValue="login" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="login">Entrar</TabsTrigger>
            <TabsTrigger value="signup">Cadastrar</TabsTrigger>
          </TabsList>

          <TabsContent value="login">
            <Card className="border-border/50 shadow-lg">
              <CardHeader className="space-y-1">
                <CardTitle className="text-xl">Entrar na conta</CardTitle>
                <CardDescription>
                  Digite seu email e senha para acessar o sistema
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleLogin} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="login-email">Email</Label>
                    <Input
                      id="login-email"
                      type="email"
                      placeholder="seu@email.com"
                      value={loginData.email}
                      onChange={(e) => setLoginData({ ...loginData, email: e.target.value })}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="login-password">Senha</Label>
                    <Input
                      id="login-password"
                      type="password"
                      value={loginData.password}
                      onChange={(e) => setLoginData({ ...loginData, password: e.target.value })}
                      required
                    />
                  </div>
                  <Button 
                    type="submit" 
                    className="w-full" 
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Entrando...
                      </>
                    ) : (
                      'Entrar'
                    )}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="signup">
            <Card className="border-border/50 shadow-lg">
              <CardHeader className="space-y-1">
                <CardTitle className="text-xl">Criar conta</CardTitle>
                <CardDescription>
                  Crie uma nova conta para acessar o sistema
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSignup} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="signup-name">Nome completo</Label>
                    <Input
                      id="signup-name"
                      type="text"
                      placeholder="Seu nome completo"
                      value={signupData.name}
                      onChange={(e) => setSignupData({ ...signupData, name: e.target.value })}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="signup-email">Email</Label>
                    <Input
                      id="signup-email"
                      type="email"
                      placeholder="seu@email.com"
                      value={signupData.email}
                      onChange={(e) => setSignupData({ ...signupData, email: e.target.value })}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="signup-password">Senha</Label>
                    <Input
                      id="signup-password"
                      type="password"
                      placeholder="Mínimo 6 caracteres"
                      value={signupData.password}
                      onChange={(e) => setSignupData({ ...signupData, password: e.target.value })}
                      required
                      minLength={6}
                    />
                  </div>
                  <Button 
                    type="submit" 
                    className="w-full" 
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Criando conta...
                      </>
                    ) : (
                      'Criar conta'
                    )}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        <div className="mt-6 text-center">
          <p className="text-sm text-muted-foreground">
            Sistema de registro de encomendas por departamentos
          </p>
        </div>
      </div>
    </div>
  );
};