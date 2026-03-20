'use client';

import { useState } from 'react';
import { createClient } from '@/utils/supabase/client';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { UserPlus, Mail, Lock, User, Chrome } from 'lucide-react';
import Link from 'next/link';

export default function RegisterPage() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: name,
          role: 'student',
        },
      },
    });

    if (error) {
      toast.error('Erro ao cadastrar: ' + error.message);
      setLoading(false);
    } else {
      toast.success('Cadastro realizado! Verifique seu email para confirmar.');
      router.push('/login');
    }
  };

  const handleGoogleLogin = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    });

    if (error) {
      toast.error('Erro ao entrar com Google: ' + error.message);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0a0a0a] p-4">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-[#FF6B0022] via-transparent to-transparent pointer-events-none" />
      
      <Card className="w-full max-w-md bg-[#1a1a1a]/80 border-[#333] backdrop-blur-xl text-white">
        <CardHeader className="space-y-1 text-center">
          <div className="flex justify-center mb-4">
            <div className="w-12 h-12 bg-[#FF6B00] rounded-xl flex items-center justify-center shadow-[0_0_20px_rgba(255,107,0,0.4)]">
              <UserPlus className="text-white w-6 h-6" />
            </div>
          </div>
          <CardTitle className="text-2xl font-bold tracking-tight">Criar sua conta</CardTitle>
          <CardDescription className="text-gray-400">
            Junte-se ao Lioness Personal Estúdio hoje mesmo
          </CardDescription>
        </CardHeader>

        <form onSubmit={handleRegister}>
          <CardContent className="space-y-4">
            
            {/* NOME */}
            <div className="space-y-2">
              <Label htmlFor="name">Nome Completo</Label>
              <div className="relative">
                <User className="absolute left-3 top-3 h-4 w-4 text-gray-500" />
                <Input
                  id="name"
                  placeholder="Seu nome completo"
                  className="pl-10 bg-[#0a0a0a] border-[#333] focus:border-[#FF6B00] text-white"
                  value={name}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setName(e.target.value)}
                  required
                />
              </div>
            </div>

            {/* EMAIL */}
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-3 h-4 w-4 text-gray-500" />
                <Input
                  id="email"
                  type="email"
                  placeholder="seu@email.com"
                  className="pl-10 bg-[#0a0a0a] border-[#333] focus:border-[#FF6B00] text-white"
                  value={email}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setEmail(e.target.value)}
                  required
                />
              </div>
            </div>

            {/* SENHA */}
            <div className="space-y-2">
              <Label htmlFor="password">Senha</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-500" />
                <Input
                  id="password"
                  type="password"
                  placeholder="Mínimo 6 caracteres"
                  className="pl-10 bg-[#0a0a0a] border-[#333] focus:border-[#FF6B00] text-white"
                  value={password}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setPassword(e.target.value)}
                  required
                />
              </div>
            </div>

            <Button 
              type="submit" 
              className="w-full bg-[#FF6B00] hover:bg-[#e65a00] text-white font-bold py-6"
              disabled={loading}
            >
              {loading ? 'Cadastrando...' : 'Criar Conta'}
            </Button>

            {/* DIVISOR */}
            <div className="relative my-4">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t border-[#333]"></span>
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-[#1a1a1a] px-2 text-gray-500">Ou cadastre-se com</span>
              </div>
            </div>

            {/* GOOGLE */}
            <Button 
              type="button" 
              variant="outline" 
              className="w-full border-[#333] bg-transparent hover:bg-[#333] text-white py-6"
              onClick={handleGoogleLogin}
            >
              <Chrome className="mr-2 h-4 w-4" />
              Google
            </Button>

          </CardContent>

          <CardFooter className="flex flex-wrap items-center justify-center gap-1 text-sm text-gray-400">
            Já tem uma conta? 
            <Link href="/login" className="text-[#FF6B00] font-semibold hover:underline">
              Fazer login
            </Link>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}