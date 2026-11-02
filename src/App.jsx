import React, { useState } from 'react';
import { 
  Users, MapPin, DollarSign, Plus, CheckCircle, 
  Clock, Camera, Navigation, ArrowRight, Trash2, Shield, Calendar, Sparkles, User, Lock, Mail, Bell, Search, Check, X
} from 'lucide-react';

export default function App() {
  const [currentUser, setCurrentUser] = useState(null);
  const [authMode, setAuthMode] = useState('login');
  
  // Auth
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');

  // Modal para crear salida
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newDate, setNewDate] = useState('');
  const [selectedFriends, setSelectedFriends] = useState([]);

  // Amigos disponibles para invitar
  const availableFriends = ['Kike', 'Nacho', 'Rulo', 'Pelu', 'Joaquín', 'Paco', 'Pablo', 'Fer', 'Javi'];

  // Base de datos de salidas
  const [events, setEvents] = useState([
    {
      id: 1,
      title: 'Ruta de tapas y cervecitas',
      date: '2026-11-07',
      creator: 'Rafa',
      members: ['Rafa', 'Kike', 'Nacho'],
      pendingInvitations: ['Rulo']
    },
    {
      id: 2,
      title: 'Cena fin de semana',
      date: '2026-11-14',
      creator: 'Paco',
      members: ['Paco', 'Javi'],
      pendingInvitations: []
    }
  ]);

  const handleAuth = (e) => {
    e.preventDefault();
    if (!email || !password) return;
    const userName = authMode === 'register' ? (name || 'Nuevo Usuario') : email.split('@')[0];
    setCurrentUser({ id: Date.now(), name: userName, email });
  };

  const toggleFriendSelection = (friend) => {
    if (selectedFriends.includes(friend)) {
      setSelectedFriends(selectedFriends.filter(f => f !== friend));
    } else {
      setSelectedFriends([...selectedFriends, friend]);
    }
  };

  const handleCreateEvent = (e) => {
    e.preventDefault();
    if (!newTitle.trim() || !newDate) return;

    const newEvent = {
      id: Date.now(),
      title: newTitle,
      date: newDate,
      creator: currentUser.name,
      members: [currentUser.name],
      pendingInvitations: selectedFriends
    };

    setEvents([newEvent, ...events]);
    setNewTitle('');
    setNewDate('');
    setSelectedFriends([]);
    setShowCreateModal(false);
  };

  // -------------------------------------------------------------
  // PANTALLA DE LOGIN / REGISTRO
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
  // ÁREA PERSONAL DEL USUARIO
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
        {/* Botón Principal para Crear Salida */}
        <button 
          onClick={() => setShowCreateModal(true)}
          className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-bold py-3.5 px-4 rounded-2xl text-sm shadow-md shadow-indigo-500/20 flex items-center justify-center space-x-2 transition active:scale-[0.98]"
        >
          <Plus size={18} />
          <span>Crear Nueva Salida / Plan</span>
        </button>

        {/* Lista de Salidas */}
        <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-sm space-y-4">
          <h2 className="text-lg font-black text-slate-900">Tus Salidas y Experiencias</h2>
          
          <div className="space-y-3">
            {events.map((event) => (
              <div key={event.id} className="p-4 rounded-2xl border border-slate-200 bg-slate-50/50 space-y-2">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-bold text-slate-900 text-sm">{event.title}</h3>
                    <p className="text-xs text-slate-500 flex items-center gap-1 mt-0.5">
                      <Calendar size={12} /> {event.date} • Creador: <span className="font-medium text-slate-700">{event.creator}</span>
                    </p>
                  </div>
                  <span className="text-[10px] uppercase font-bold bg-indigo-100 text-indigo-700 px-2.5 py-1 rounded-full">
                    {event.members.includes(currentUser.name) ? 'Miembro' : 'Invitado'}
                  </span>
                </div>

                {/* Participantes */}
                <div className="pt-2 border-t border-slate-200/60 flex flex-wrap gap-1.5 items-center">
                  <span className="text-[11px] text-slate-400 font-medium mr-1">Equipo:</span>
                  {event.members.map((m, idx) => (
                    <span key={idx} className="bg-emerald-100 text-emerald-800 text-[10px] font-bold px-2 py-0.5 rounded-md flex items-center gap-1">
                      <Check size={10} /> {m}
                    </span>
                  ))}
                  {event.pendingInvitations.map((p, idx) => (
                    <span key={idx} className="bg-amber-100 text-amber-800 text-[10px] font-bold px-2 py-0.5 rounded-md flex items-center gap-1">
                      <Clock size={10} /> {p} (Pendiente)
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </main>

      {/* MODAL CREAR NUEVA SALIDA */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white max-w-md w-full p-6 rounded-3xl shadow-2xl border border-slate-200 animate-fadeIn space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="font-black text-slate-900 text-lg">Organizar Nueva Salida</h3>
              <button onClick={() => setShowCreateModal(false)} className="text-slate-400 hover:text-slate-600 p-1">
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleCreateEvent} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">Título de la Salida</label>
                <input 
                  type="text" 
                  placeholder="ej. Cervecitas por el centro" 
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-2.5 text-sm focus:outline-none focus:border-indigo-500 text-slate-900"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">Fecha</label>
                <input 
                  type="date" 
                  value={newDate}
                  onChange={(e) => setNewDate(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-2.5 text-sm focus:outline-none focus:border-indigo-500 text-slate-900"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 mb-2">Invitar Amigos al Equipo</label>
                <div className="flex flex-wrap gap-2 max-h-36 overflow-y-auto p-1">
                  {availableFriends.map((friend) => {
                    const isSelected = selectedFriends.includes(friend);
                    return (
                      <button
                        type="button"
                        key={friend}
                        onClick={() => toggleFriendSelection(friend)}
                        className={`text-xs px-3 py-1.5 rounded-xl font-bold transition flex items-center gap-1 border ${
                          isSelected 
                            ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm' 
                            : 'bg-slate-100 text-slate-600 border-slate-200 hover:bg-slate-200'
                        }`}
                      >
                        {isSelected && <Check size={12} />}
                        {friend}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="flex gap-2 pt-2">
                <button 
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="w-1/2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold py-2.5 rounded-2xl text-xs transition"
                >
                  Cancelar
                </button>
                <button 
                  type="submit"
                  className="w-1/2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2.5 rounded-2xl text-xs transition shadow-md shadow-indigo-500/20"
                >
                  Crear y Enviar Invitaciones
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
