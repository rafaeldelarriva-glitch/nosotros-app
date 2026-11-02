import React, { useState } from 'react';
import { 
  Users, MapPin, DollarSign, Plus, CheckCircle, 
  Clock, Camera, Navigation, ArrowRight, Trash2, Shield, Calendar, Sparkles, User, Lock, Mail, Bell, Search, Check, X, UserPlus, Inbox, ArrowLeft, Image as ImageIcon
} from 'lucide-react';

export default function App() {
  const [currentUser, setCurrentUser] = useState(null);
  const [authMode, setAuthMode] = useState('login');
  
  // Auth
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');

  // Navegación en Área Personal: 'my-events', 'search', 'notifications'
  const [activeTab, setActiveTab] = useState('my-events');
  // Evento activo en el que se ha entrado para ver detalles/gastos/sitios
  const [activeEvent, setActiveEvent] = useState(null);
  const [eventSubTab, setEventSubTab] = useState('spots'); // 'spots', 'expenses', 'gallery'

  // Modal para crear salida
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newDate, setNewDate] = useState('');
  const [selectedFriends, setSelectedFriends] = useState([]);

  // Buscador de salidas
  const [searchQuery, setSearchQuery] = useState('');

  // Formulario de sitios y gastos
  const [newSpotName, setNewSpotName] = useState('');
  const [newSpotCategory, setNewSpotCategory] = useState('cervecitas');
  const [expenseDesc, setExpenseDesc] = useState('');
  const [expenseAmount, setExpenseAmount] = useState('');

  // Amigos disponibles para invitar
  const availableFriends = ['Kike', 'Nacho', 'Rulo', 'Pelu', 'Joaquín', 'Paco', 'Pablo', 'Fer', 'Javi'];

  // Base de datos de salidas con datos interactivos
  const [events, setEvents] = useState([
    {
      id: 1,
      title: 'Ruta de tapas y cervecitas',
      date: '2026-11-07',
      creator: 'Rafa',
      members: ['Rafa', 'Kike', 'Nacho'],
      pendingInvitations: ['Rulo'],
      pendingRequests: ['Paco'],
      spots: [
        { id: 101, name: 'La Tasquita del Mar', category: 'comida', votes: 2, suggestedBy: 'Rafa', activeNow: true },
        { id: 102, name: 'Bar El Refugio', category: 'cervecitas', votes: 1, suggestedBy: 'Kike', activeNow: false }
      ],
      expenses: [
        { id: 201, description: 'Ronda de cervezas', amount: 15.50, paidBy: 'Rafa' }
      ],
      photos: []
    },
    {
      id: 2,
      title: 'Cena fin de semana',
      date: '2026-11-14',
      creator: 'Paco',
      members: ['Paco', 'Javi', 'Rafa'],
      pendingInvitations: [],
      pendingRequests: [],
      spots: [],
      expenses: [],
      photos: []
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
      pendingInvitations: selectedFriends,
      pendingRequests: [],
      spots: [],
      expenses: [],
      photos: []
    };

    setEvents([newEvent, ...events]);
    setNewTitle('');
    setNewDate('');
    setSelectedFriends([]);
    setShowCreateModal(false);
  };

  // Acciones dentro de una Salida (Sitios, Gastos, Fotos)
  const handleAddSpot = (e) => {
    e.preventDefault();
    if (!newSpotName.trim() || !activeEvent) return;
    
    const newSpot = {
      id: Date.now(),
      name: newSpotName,
      category: newSpotCategory,
      votes: 1,
      suggestedBy: currentUser.name,
      activeNow: false
    };

    const updatedEvents = events.map(ev => ev.id === activeEvent.id ? { ...ev, spots: [...ev.spots, newSpot] } : ev);
    setEvents(updatedEvents);
    setActiveEvent(updatedEvents.find(ev => ev.id === activeEvent.id));
    setNewSpotName('');
  };

  const handleVoteSpot = (spotId) => {
    const updatedEvents = events.map(ev => {
      if (ev.id === activeEvent.id) {
        return {
          ...ev,
          spots: ev.spots.map(s => s.id === spotId ? { ...s, votes: s.votes + 1 } : s)
        };
      }
      return ev;
    });
    setEvents(updatedEvents);
    setActiveEvent(updatedEvents.find(ev => ev.id === activeEvent.id));
  };

  const handleActivateSpot = (spotId) => {
    const updatedEvents = events.map(ev => {
      if (ev.id === activeEvent.id) {
        return {
          ...ev,
          spots: ev.spots.map(s => ({ ...s, activeNow: s.id === spotId }))
        };
      }
      return ev;
    });
    setEvents(updatedEvents);
    setActiveEvent(updatedEvents.find(ev => ev.id === activeEvent.id));
  };

  const handleAddExpense = (e) => {
    e.preventDefault();
    if (!expenseDesc.trim() || !expenseAmount || !activeEvent) return;

    const newExp = {
      id: Date.now(),
      description: expenseDesc,
      amount: parseFloat(expenseAmount),
      paidBy: currentUser.name
    };

    const updatedEvents = events.map(ev => ev.id === activeEvent.id ? { ...ev, expenses: [...ev.expenses, newExp] } : ev);
    setEvents(updatedEvents);
    setActiveEvent(updatedEvents.find(ev => ev.id === activeEvent.id));
    setExpenseDesc('');
    setExpenseAmount('');
  };

  const handlePhotoUpload = (e) => {
    const file = e.target.files[0];
    if (file && activeEvent) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const newPhoto = { id: Date.now(), url: reader.result, user: currentUser.name };
        const updatedEvents = events.map(ev => ev.id === activeEvent.id ? { ...ev, photos: [...ev.photos, newPhoto] } : ev);
        setEvents(updatedEvents);
        setActiveEvent(updatedEvents.find(ev => ev.id === activeEvent.id));
      };
      reader.readAsDataURL(file);
    }
  };

  // Gestión de Solicitudes/Invitaciones
  const handleRequestJoin = (eventId) => {
    setEvents(events.map(ev => ev.id === eventId ? { ...ev, pendingRequests: [...ev.pendingRequests, currentUser.name] } : ev));
  };

  const handleApproveRequest = (eventId, userName) => {
    setEvents(events.map(ev => ev.id === eventId ? { ...ev, pendingRequests: ev.pendingRequests.filter(u => u !== userName), members: [...ev.members, userName] } : ev));
  };

  const handleRejectRequest = (eventId, userName) => {
    setEvents(events.map(ev => ev.id === eventId ? { ...ev, pendingRequests: ev.pendingRequests.filter(u => u !== userName) } : ev));
  };

  const handleAcceptInvitation = (eventId) => {
    setEvents(events.map(ev => ev.id === eventId ? { ...ev, pendingInvitations: ev.pendingInvitations.filter(u => u !== currentUser.name), members: [...ev.members, currentUser.name] } : ev));
  };

  const handleRejectInvitation = (eventId) => {
    setEvents(events.map(ev => ev.id === eventId ? { ...ev, pendingInvitations: ev.pendingInvitations.filter(u => u !== currentUser.name) } : ev));
  };

  const myInvitations = events.filter(e => e.pendingInvitations.includes(currentUser?.name));
  const myApprovalRequests = events.filter(e => e.creator === currentUser?.name && e.pendingRequests.length > 0);
  const totalNotifications = myInvitations.length + myApprovalRequests.reduce((acc, curr) => acc + curr.pendingRequests.length, 0);

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
              className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 rounded-2
