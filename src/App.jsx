import React, { useState } from 'react';
import { 
  Users, MapPin, DollarSign, Plus, CheckCircle, 
  Clock, Camera, Navigation, ArrowRight, Trash2, Shield, Calendar, Sparkles, User, Lock, Mail, Bell, Search, Check, X
} from 'lucide-react';

export default function App() {
  const [currentUser, setCurrentUser] = useState(null);
  const [authMode, setAuthMode] = useState('login'); // 'login' o 'register'
  
  // Estados para formulario de Auth
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');

  // Simulación de salidas / eventos
  const [events, setEvents] = useState([
    {
      id: 1,
      title: 'Ruta de tapas y cervecitas',
      date: '2026-11-07',
      creator: 'Rafa',
      status: 'confirmado',
      members: ['Rafa', 'Kike', 'Nacho'],
      pendingMembers: ['Rulo']
    },
    {
      id: 2,
      title: 'Cena fin de semana',
      date: '2026-11-14',
      creator: 'Paco',
      status: 'abierto',
      members: ['Paco', 'Javi'],
      pendingMembers: []
    }
  ]);

  const handleAuth = (e) => {
    e.preventDefault();
    if (!email || !password) return;
    
    // Simulación de login/registro exitoso
    const userName = authMode === 'register' ? (name || 'Nuevo Usuario') : email.split('@')[0];
    setCurrentUser({ id: Date.now(), name: userName, email });
  };

  // -------------------------------------------------------------
  // PANTALLA DE LOGIN / REGISTRO (Fondo claro y moderno)
  // -------------------------------------------------------------
  if (!currentUser) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6 text-slate-800 relative overflow-hidden">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-lg h-72 bg-indigo-200/40 rounded-b-full blur-3xl pointer-events-none"></div>

        <div className="max-w-md w-full bg-white/90 backdrop-blur-xl p-8 rounded-3xl shadow-xl border border-slate-200/80 relative z-10">
          <div className="w-16 h-16 bg-gradient-to-tr from-indigo-600 to-purple-600 rounded-2xl mx-auto flex items-center justify-center text-3xl mb-4 shadow-lg shadow-indigo-500/20 text-white">
            🚀
          </div>
          <h1 className="text-2xl font-black text-center tracking-tight text-slate-900 mb-1">Nosotros APP</h1>
          <p className="text-slate-500 text-center mb-6 text-xs">Organiza tus salidas y experiencias con tu grupo</p>

          {/* Selector Login / Registro */}
          <div className="flex bg-slate-100 p-1 rounded-2xl mb-6 border border-slate-200">
            <button 
              onClick={() => setAuthMode('login')}
              className={`flex-1 py-2 text-xs font-bold rounded-xl transition ${authMode === 'login' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
            >
              Iniciar Sesión
            </button>
            <button 
              onClick={() => setAuthMode('register')}
              className={`flex-1 py-2 text-xs font-bold rounded-xl transition ${authMode === 'register' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
            >
              Crear Cuenta
            </button>
          </div>

          <form onSubmit={handleAuth} className="space-y-4">
            {authMode === 'register' && (
              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">Nombre Completo</label>
                <div className="relative">
                  <User className="absolute left-3.5 top-3 text-slate-400" size={18} />
                  <input 
                    type="text" 
                    placeholder="Tu nombre" 
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-2xl pl-10 pr-4 py-2.5 text-sm focus:outline-none focus:border-indigo-500 transition text-slate-900"
                  />
                </div>
              </div>
            )}

            <div>
              <label className="block text-xs font-bold text-slate-600 mb-1">Correo Electrónico</label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-3 text-slate-400" size={18} />
                <input 
                  type="email" 
                  placeholder="ejemplo@correo.com" 
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-2xl pl-10 pr-4 py-2.5 text-sm focus:outline-none focus:border-indigo-500 transition text-slate-900"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-600 mb-1">Contraseña</label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-3 text-slate-400" size={18} />
                <input 
                  type="password" 
                  placeholder="••••••••" 
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-2xl pl-10 pr-4 py-2.5 text-sm focus:outline-none focus:border-indigo-500 transition text-slate-900"
                />
              </div>
            </div>

            <button 
              type="submit" 
              className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 rounded-2xl text-sm transition shadow-md shadow-indigo-500/20 active:scale-[0.98] mt-2"
            >
              {authMode === 'login' ? 'Entrar a mi cuenta' : 'Registrarme'}
            </button>
          </form>
        </div>
      </div>
    );
  }

  // -------------------------------------------------------------
  // ÁREA PERSONAL DEL USUARIO (Una vez autenticado)
  // -------------------------------------------------------------
  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 pb-20">
      <header className="bg-white/80 backdrop-blur-md border-b border-slate-200 p-4 sticky top-0 z-50 flex justify-between items-center shadow-sm">
        <div className="flex items-center space-x-2">
          <div className="w-8 h-8 bg-indigo-600 rounded-xl flex items-center justify-center text-white font-black text-sm">
            N
          </div>
          <span className="font-extrabold text-slate-900">Área Personal</span>
        </div>
        <div className="flex items-center space-x-3">
          <span className="text-xs font-bold text-slate-600">Hola, {currentUser.name}</span>
          <button 
            onClick={() => setCurrentUser(null)}
            className="text-xs bg-slate-100 hover:bg-red-50 text-slate-500 hover:text-red-600 px-3 py-1.5 rounded-full font-medium transition"
          >
            Salir
          </button>
        </div>
      </header>

      <main className="max-w-md mx-auto p-4 space-y-6">
        <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-sm">
          <h2 className="text-xl font-black text-slate-900 mb-1">Tus Salidas y Planes</h2>
          <p className="text-xs text-slate-500 mb-4">Aquí puedes consultar tus experiencias activas o buscar nuevos planes.</p>
          
          <div className="space-y-3">
            {events.map((event) => (
              <div key={event.id} className="p-4 rounded-2xl border border-slate-200 bg-slate-50/50 flex justify-between items-center">
                <div>
                  <h3 className="font-bold text-slate-900 text-sm">{event.title}</h3>
                  <p className="text-xs text-slate-500 mt-0.5">Organiza: <span className="font-medium text-slate-700">{event.creator}</span> • {event.date}</p>
                </div>
                <span className="text-[10px] uppercase font-bold bg-indigo-100 text-indigo-700 px-2.5 py-1 rounded-full">
                  {event.members.includes(currentUser.name) ? 'Unido' : 'Buscar'}
                </span>
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}
