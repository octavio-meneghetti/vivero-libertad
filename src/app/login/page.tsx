'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Leaf } from 'lucide-react';
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword 
} from 'firebase/auth';
import { auth } from '@/lib/firebase';

export default function LoginPage() {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (isLogin) {
        await signInWithEmailAndPassword(auth, email, password);
      } else {
        await createUserWithEmailAndPassword(auth, email, password);
      }
      router.push('/');
    } catch (err) {
      const error = err as Error;
      setError(error.message || 'Se produjo un error durante la autenticación.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen relative flex items-center justify-center p-4 overflow-hidden">
      <div className="absolute inset-0 z-0">
        <img 
          src="https://images.unsplash.com/photo-1497250681558-47209fe43a1d?auto=format&fit=crop&q=80&w=2000" 
          alt="Monstera background" 
          className="w-full h-full object-cover opacity-60 dark:opacity-20"
        />
        <div className="absolute inset-0 bg-background/50 backdrop-blur-sm"></div>
      </div>

      <div className="relative z-10 w-full max-w-md p-8 rounded-3xl glass shadow-2xl dark:glass-dark border border-white/20 dark:border-white/5">
        <div className="flex flex-col items-center mb-8">
          <div className="p-3 bg-primary-50 dark:bg-primary-900/30 rounded-2xl mb-4 text-primary-600 dark:text-primary-400">
            <Leaf className="w-8 h-8" />
          </div>
          <h2 className="text-3xl font-display font-bold text-center">
            {isLogin ? 'Bienvenido al Vivero' : 'Únete a la Comunidad'}
          </h2>
          <p className="text-foreground/60 text-sm mt-2">
            Tu oasis botánico personal
          </p>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-100/80 dark:bg-red-900/30 text-red-700 dark:text-red-300 text-sm rounded-xl text-center backdrop-blur-md">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Correo Electrónico</label>
            <input 
              type="email" 
              required 
              className="w-full px-4 py-3 rounded-xl bg-white/50 dark:bg-black/20 border border-black/10 dark:border-white/10 focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all outline-none"
              placeholder="ejemplo@correo.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Contraseña</label>
            <input 
              type="password" 
              required 
              className="w-full px-4 py-3 rounded-xl bg-white/50 dark:bg-black/20 border border-black/10 dark:border-white/10 focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all outline-none"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>
          <button 
            type="submit" 
            disabled={loading}
            className="w-full py-4 mt-2 rounded-xl bg-primary-600 hover:bg-primary-700 text-white font-medium shadow-lg shadow-primary-500/20 transition-all disabled:opacity-70"
          >
            {loading ? 'Cargando...' : (isLogin ? 'Ingresar' : 'Registrarse')}
          </button>
        </form>

        <div className="mt-8 text-center text-sm text-foreground/70">
          {isLogin ? '¿No tienes cuenta?' : '¿Ya eres miembro?'}
          <button 
            onClick={() => setIsLogin(!isLogin)}
            className="ml-2 font-bold text-primary-600 dark:text-primary-400 hover:underline"
          >
            {isLogin ? 'Regístrate aquí' : 'Ingresa aquí'}
          </button>
        </div>
      </div>
    </div>
  );
}
