'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import Image from 'next/image';
import { Bell, Sparkles, Send, PlusCircle, CheckCircle2, Loader2, Trash2 } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { GoogleGenAI } from "@google/genai";
import { useToast } from './Toast';

interface Message {
  id?: number;
  role: 'user' | 'ai';
  content: string;
  created_at?: string;
}

export default function Coach({ user }: { user: any }) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [profile, setProfile] = useState<any>(null);
  const [workouts, setWorkouts] = useState<any[]>([]);
  const scrollRef = useRef<HTMLDivElement>(null);
  const { showToast } = useToast();

  const fetchProfileAndMessages = useCallback(async () => {
    if (!user) return;
    // Fetch profile
    const { data: profileData } = await supabase
      .from('users')
      .select('*')
      .eq('id', user.id)
      .single();
    setProfile(profileData);

    // Fetch recent workouts
    const { data: workoutData } = await supabase
      .from('workout_sessions')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(5);
    setWorkouts(workoutData || []);

    // Fetch messages
    const { data: messageData } = await supabase
      .from('chat_messages')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: true });
    
    if (messageData && messageData.length > 0) {
      setMessages(messageData);
    } else {
      // Initial message
      setMessages([{
        role: 'ai',
        content: `Olá! Sou seu coach LIONESS FIT. Analisei seu perfil (${profileData?.goal || 'Fitness'}) e seus últimos treinos. Estou pronto para ajudar. Como você está se sentindo hoje?`
      }]);
    }
  }, [user]);

  useEffect(() => {
    fetchProfileAndMessages();
  }, [fetchProfileAndMessages]);

  const handleSend = async () => {
    if (!input.trim() || loading) return;

    const userMessage = input.trim();
    setInput('');
    setLoading(true);

    // Optimistic update
    const newMessages: Message[] = [...messages, { role: 'user', content: userMessage }];
    setMessages(newMessages);

    // Save user message to Supabase
    await supabase.from('chat_messages').insert({
      user_id: user.id,
      role: 'user',
      content: userMessage
    });

    try {
      const apiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY;
      if (!apiKey) {
        throw new Error('Chave de API do Gemini não configurada.');
      }

      const genAI = new GoogleGenAI({ apiKey });
      const model = genAI.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: [
          {
            role: 'user',
            parts: [{ text: `Você é um coach de fitness premium da LIONESS FIT. 
              O perfil do usuário é: Idade ${profile?.age}, Peso ${profile?.weight}kg, Altura ${profile?.height}cm, Objetivo: ${profile?.goal}, Nível: ${profile?.fitness_level}.
              Histórico de treinos recentes: ${workouts.map(w => `${new Date(w.created_at).toLocaleDateString()}: ${w.duration_minutes} min`).join(', ')}
              Responda de forma motivadora, técnica e elegante em Português do Brasil.
              Histórico recente da conversa: ${messages.slice(-5).map(m => `${m.role}: ${m.content}`).join('\n')}
              Usuário: ${userMessage}` }]
          }
        ],
        config: {
          systemInstruction: "Você é um coach de fitness de elite. Seja conciso, profissional e use termos técnicos quando apropriado, mas mantenha a acessibilidade. Foque em performance e bem-estar. Use o histórico de treinos para dar conselhos específicos se relevante."
        }
      });

      const response = await model;
      const aiResponse = response.text || "Desculpe, tive um problema ao processar sua solicitação.";

      // Save AI response to Supabase
      await supabase.from('chat_messages').insert({
        user_id: user.id,
        role: 'ai',
        content: aiResponse
      });

      setMessages([...newMessages, { role: 'ai', content: aiResponse }]);
    } catch (error) {
      console.error('Gemini Error:', error);
      setMessages([...newMessages, { role: 'ai', content: "Houve um erro na conexão com a IA. Verifique sua chave de API." }]);
    } finally {
      setLoading(false);
    }
  };

  const handleClearChat = async () => {
    if (!confirm('Tem certeza que deseja limpar o histórico de conversa?')) return;
    
    try {
      const { error } = await supabase
        .from('chat_messages')
        .delete()
        .eq('user_id', user.id);
      
      if (error) throw error;
      
      setMessages([{
        role: 'ai',
        content: `Histórico limpo. Como posso ajudar você hoje, ${profile?.full_name?.split(' ')[0] || ''}?`
      }]);
      showToast('Histórico de conversa removido', 'success');
    } catch (error) {
      console.error('Error clearing chat:', error);
      showToast('Erro ao limpar histórico', 'error');
    }
  };

  return (
    <div className="bg-[#fcf9f8] text-[#1c1b1b] min-h-screen flex flex-col">
      {/* Top Bar */}
      <header className="fixed top-0 w-full z-50 bg-white/70 backdrop-blur-xl border-b border-stone-200/50">
        <div className="flex justify-between items-center w-full px-4 sm:px-6 py-3 sm:py-4">
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-2xl bg-stone-200 overflow-hidden relative shadow-inner">
              <Image 
                src="https://images.unsplash.com/photo-1594381898411-846e7d193883?q=80&w=1974&auto=format&fit=crop" 
                alt="Coach" 
                fill
                sizes="48px"
                className="object-cover"
                referrerPolicy="no-referrer"
              />
            </div>
            <div>
              <h1 className="font-display font-black tracking-tighter text-[#ab3600] uppercase text-base sm:text-xl leading-none">LIONESS FIT COACH</h1>
              <p className="text-[8px] sm:text-[10px] font-sans font-black tracking-[0.3em] text-stone-400 uppercase">Inteligência de Elite</p>
            </div>
          </div>
          <div className="flex items-center gap-2 sm:gap-4">
            <button 
              onClick={handleClearChat}
              className="p-2 text-stone-400 hover:text-red-500 transition-colors rounded-full hover:bg-red-50"
              title="Limpar conversa"
            >
              <Trash2 size={18} />
            </button>
            <div className="w-10 h-10 rounded-full bg-stone-100 flex items-center justify-center text-stone-600">
              <Bell size={18} />
            </div>
          </div>
        </div>
      </header>

      <main className="flex-grow pt-20 sm:pt-24 pb-40 sm:pb-44 px-4 sm:px-6 max-w-4xl mx-auto w-full flex flex-col overflow-hidden">
        <div 
          ref={scrollRef}
          className="flex-grow overflow-y-auto space-y-6 sm:space-y-8 pb-10 no-scrollbar scroll-smooth"
        >
          {messages.map((msg, idx) => (
            <div 
              key={idx} 
              className={cn(
                "flex flex-col gap-2 sm:gap-3 max-w-[95%] sm:max-w-[80%] lg:max-w-[70%] animate-in fade-in slide-in-from-bottom-2 duration-300",
                msg.role === 'user' ? "items-end ml-auto" : "items-start"
              )}
            >
              {msg.role === 'ai' && (
                <div className="flex items-center gap-2 mb-0.5 sm:mb-1">
                  <Sparkles className="text-[#ab3600] w-3 h-3 sm:w-3.5 sm:h-3.5" fill="currentColor" />
                  <span className="font-sans text-[8px] sm:text-[10px] font-bold tracking-widest uppercase text-[#ab3600]">LIONESS FIT IA</span>
                </div>
              )}
              <div className={cn(
                "p-4 sm:p-5 rounded-xl shadow-sm",
                msg.role === 'user' 
                  ? "bg-[#ff5f1f] text-white rounded-tr-none shadow-md font-medium" 
                  : "bg-stone-100 text-[#1c1b1b] rounded-tl-none"
              )}>
                <p className="leading-relaxed text-xs sm:text-sm whitespace-pre-wrap">
                  {msg.content}
                </p>
              </div>
              <div className="flex items-center gap-2 px-1">
                <span className="text-[8px] sm:text-[10px] text-stone-400 font-medium">
                  {msg.created_at ? new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Agora'}
                </span>
                {msg.role === 'user' && <CheckCircle2 className="text-[#ab3600] w-2.5 h-2.5 sm:w-3 sm:h-3" />}
              </div>
            </div>
          ))}
          
          {loading && (
            <div className="flex flex-col items-start gap-3 max-w-[85%] animate-pulse">
              <div className="flex items-center gap-2 mb-1">
                <Sparkles size={14} className="text-[#ab3600]" fill="currentColor" />
                <span className="font-sans text-[10px] font-bold tracking-widest uppercase text-[#ab3600]">LIONESS FIT IA está pensando...</span>
              </div>
              <div className="bg-stone-100 p-5 rounded-xl rounded-tl-none shadow-sm flex items-center gap-2">
                <Loader2 size={16} className="animate-spin text-[#ab3600]" />
                <span className="text-xs text-stone-500">Analisando dados de performance...</span>
              </div>
            </div>
          )}
        </div>

        {/* Input Area */}
        <div className="fixed bottom-20 sm:bottom-24 left-0 w-full px-4 sm:px-6 z-40">
          <div className="max-w-4xl mx-auto">
            <div className="flex gap-2 sm:gap-3 overflow-x-auto pb-3 sm:pb-4 no-scrollbar justify-start">
              {['O que devo comer?', 'Exercícios para as costas', 'Rastrear proteína'].map((s, i) => (
                <button 
                  key={i} 
                  onClick={() => setInput(s)}
                  className="whitespace-nowrap px-3 sm:px-4 py-1.5 sm:py-2 bg-white border border-stone-200 rounded-full text-[10px] sm:text-xs font-bold text-stone-500 hover:bg-[#ff5f1f] hover:text-white transition-all shadow-sm"
                >
                  {s}
                </button>
              ))}
            </div>
            <form 
              onSubmit={(e) => { e.preventDefault(); handleSend(); }}
              className="bg-stone-100/80 backdrop-blur-md p-1.5 sm:p-2 rounded-full flex items-center gap-1.5 sm:gap-2 shadow-lg border border-white/20"
            >
              <button type="button" className="w-8 h-8 sm:w-10 sm:h-10 flex items-center justify-center text-stone-400 hover:text-[#ab3600] transition-colors">
                <PlusCircle className="w-[18px] h-[18px] sm:w-5 sm:h-5" />
              </button>
              <input 
                className="flex-grow bg-transparent border-none focus:ring-0 text-xs sm:text-sm font-medium placeholder:text-stone-500" 
                placeholder="Pergunte qualquer coisa..." 
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
              />
              <button 
                type="submit"
                disabled={!input.trim() || loading}
                className="w-8 h-8 sm:w-10 sm:h-10 bg-[#ab3600] text-white rounded-full flex items-center justify-center active:scale-90 transition-transform disabled:opacity-50 disabled:scale-100"
              >
                <Send className="w-4 h-4 sm:w-[18px] sm:h-[18px]" fill="currentColor" />
              </button>
            </form>
          </div>
        </div>
      </main>
    </div>
  );
}

import { cn } from '@/lib/utils';
