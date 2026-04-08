'use client';

import { useState, useRef, useEffect } from 'react';
import { MessageCircle, X, Send, Sparkles, Sprout } from 'lucide-react';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

export default function AIAssistant() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    { role: 'assistant', content: '¡Hola! Soy Raíz 🌿, el botánico experto del Vivero Libertad. ¿En qué rincón verde te puedo ayudar hoy?' }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll al mandar mensajes
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isOpen]);

  const sendMessage = async () => {
    if (!input.trim() || isLoading) return;
    
    // Optimistic UI update
    const userMsg = input.trim();
    const newChat = [...messages, { role: 'user', content: userMsg } as Message];
    setMessages(newChat);
    setInput('');
    setIsLoading(true);

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: userMsg, history: messages })
      });
      
      const data = await response.json();
      
      setMessages([...newChat, { role: 'assistant', content: data.reply }]);
    } catch (error) {
      setMessages([...newChat, { role: 'assistant', content: 'Lo siento, mi cerebro botánico falló la conexión. Intenta de nuevo.' }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end">
      
      {/* Ventana de Chat */}
      {isOpen && (
        <div className="mb-4 w-[340px] h-[500px] max-h-[80vh] flex flex-col glass dark:glass-dark border border-white/20 dark:border-white/5 rounded-3xl overflow-hidden shadow-2xl animate-in slide-in-from-bottom-8 fade-in duration-300">
          
          {/* Cabecera */}
          <div className="bg-gradient-to-r from-primary-600 to-secondary-600 p-4 flex items-center justify-between text-white shrink-0">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center backdrop-blur-md">
                <Sprout className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-bold leading-tight flex items-center gap-1">Raíz <Sparkles className="w-3 h-3 text-secondary-200" /></h3>
                <p className="text-xs text-white/80">Asistente en Botánica</p>
              </div>
            </div>
            <button onClick={() => setIsOpen(false)} className="p-2 hover:bg-white/10 rounded-full transition-colors">
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Historial de Mensajes */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-white/40 dark:bg-black/10">
            {messages.map((msg, i) => (
              <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[85%] p-3 rounded-2xl text-sm ${
                  msg.role === 'user' 
                    ? 'bg-foreground text-background rounded-br-sm' 
                    : 'bg-white dark:bg-slate-800 text-foreground border border-black/5 dark:border-white/5 rounded-bl-sm shadow-sm'
                }`}>
                  <p className="whitespace-pre-wrap leading-relaxed">{msg.content}</p>
                </div>
              </div>
            ))}
            {isLoading && (
              <div className="flex justify-start">
                <div className="bg-white dark:bg-slate-800 p-4 rounded-2xl rounded-bl-sm shadow-sm border border-black/5 dark:border-white/5 flex gap-1">
                  <span className="w-2 h-2 bg-primary-400 rounded-full animate-bounce"></span>
                  <span className="w-2 h-2 bg-primary-400 rounded-full animate-bounce [animation-delay:0.2s]"></span>
                  <span className="w-2 h-2 bg-primary-400 rounded-full animate-bounce [animation-delay:0.4s]"></span>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Caja de Texto */}
          <div className="p-3 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-t border-black/5 dark:border-white/5 flex items-center gap-2">
            <input 
              type="text" 
              placeholder="¿Qué planta buscas hoy?" 
              className="flex-1 bg-black/5 dark:bg-white/5 border-transparent outline-none px-4 py-3 rounded-2xl text-sm text-foreground focus:ring-2 focus:ring-primary-500 transition-all font-medium"
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && sendMessage()}
            />
            <button 
              onClick={sendMessage} disabled={!input.trim() || isLoading}
              className="p-3 bg-primary-600 hover:bg-primary-700 disabled:opacity-50 text-white rounded-full transition-all shadow-md active:scale-95"
            >
              <Send className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Botón Flotante Toggle */}
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="w-14 h-14 bg-gradient-to-tr from-primary-600 to-secondary-500 rounded-full flex items-center justify-center text-white shadow-xl shadow-primary-500/30 hover:scale-105 hover:shadow-2xl transition-all duration-300"
      >
        {isOpen ? <X className="w-6 h-6" /> : <MessageCircle className="w-6 h-6" />}
      </button>

    </div>
  );
}
