import React, { useState, useEffect } from 'react';
import { 
  Users, MapPin, DollarSign, Plus, CheckCircle, 
  Clock, Camera, Navigation, ArrowRight, Trash2, Shield, Calendar, Sparkles, User, Lock, Mail, Bell, Search, Check, X, UserPlus, Inbox, ArrowLeft, Image as ImageIcon
} from 'lucide-react';
import { supabase } from './supabaseClient';

export default function App() {
  const [currentUser, setCurrentUser] = useState(null);
  const [authMode, setAuthMode] = useState('login');
  
  // Auth inputs
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');

  // Navegación
  const [activeTab, setActiveTab] = useState('my-events');
  const [activeEvent, setActiveEvent] = useState(null);
  const [eventSubTab, setEventSubTab] = useState('spots');

  // Modales y formularios
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newDate, setNewDate] = useState('');
  const [selectedFriends, setSelectedFriends] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');

  const [newSpotName, setNewSpotName] = useState('');
  const [newSpotCategory, setNewSpotCategory] = useState('cervecitas');
  const [expenseDesc, setExpenseDesc] = useState('');
  const [expenseAmount, setExpenseAmount] = useState('');

  const availableFriends = ['Kike', 'Nacho', 'Rulo', 'Pelu', 'Joaquín', 'Paco', 'Pablo', 'Fer', 'Javi'];
  const [events, setEvents] = useState([]);

  // Cargar datos iniciales al arrancar o loguearse
  useEffect(() => {
    if (currentUser) {
      fetchAppData();
    }
  }, [currentUser]);

  const fetchAppData = async () => {
    try {
      const { data: eventsData, error } = await supabase.from('events').select('*, spots(*), expenses(*), photos(*), event_members(*)');
      if (error) throw error;

      // Transformar datos para adaptarlos al formato visual de la app
      const formattedEvents = eventsData.map(ev => ({
        ...ev,
        members: ev.event_members.filter(m => m.status === 'member').map(m => m.user_name),
        pendingInvitations: ev.event_members.filter(m => m.status === 'pending_invite').map(m => m.user_name),
        pendingRequests: ev.event_members.filter(m => m.status === 'pending_request').map(m => m.user_name),
      }));

      setEvents(formattedEvents);
      if (activeEvent) {
        const updatedActive = formattedEvents.find(e => e.id === activeEvent.id);
        if (updatedActive) setActiveEvent(updatedActive);
      }
    } catch (err) {
      console.error('Error cargando datos de Supabase:', err.message);
    }
  };

  const handleAuth = async (e) => {
    e.preventDefault();
    if (!email || !password) return;

    if (authMode === 'register') {
      const { data, error } = await supabase.auth.signUp({ email, password });
      if (error) {
        alert(error.message);
        return;
      }
      if (data.user) {
        await supabase.from('profiles').insert([{ id: data.user.id, name: name || 'Usuario', email }]);
        setCurrentUser({ id: data.user.id, name: name || 'Usuario', email });
      }
    } else {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) {
        alert(error.message);
        return;
      }
      if (data.user) {
        const { data: profile } = await supabase.from('profiles').select('*').eq('id', data.user.id).single();
        setCurrentUser({ id: data.user.id, name: profile ? profile.name : email.split('@')[0], email });
      }
    }
  };

  const toggleFriendSelection = (friend) => {
    if (selectedFriends.includes(friend)) {
      setSelectedFriends(selectedFriends.filter(f => f !== friend));
    } else {
      setSelectedFriends([...selectedFriends, friend]);
    }
  };

  const handleCreateEvent = async (e) => {
    e.preventDefault();
    if (!newTitle.trim() || !newDate) return;

    try {
      const { data: newEv, error } = await supabase.from('events').insert([{
        title: newTitle,
        date: newDate,
        creator_id: currentUser.id,
        creator_name: currentUser.name
      }]).select().single();

      if (error) throw error;

      // Añadir creador como miembro
      await supabase.from('event_members').insert([{ event_id: newEv.id, user_name: currentUser.name, status: 'member' }]);

      // Añadir invitaciones pendientes
      for (const friend of selectedFriends) {
        await supabase.from('event_members').insert([{ event_id: newEv.id, user_name: friend, status: 'pending_invite' }]);
      }

      setNewTitle('');
      setNewDate('');
      setSelectedFriends([]);
      setShowCreateModal(false);
      fetchAppData();
    } catch (err) {
      console.error('Error creando evento:', err.message);
    }
  };

  const handleAddSpot = async (e) => {
    e.preventDefault();
    if (!newSpotName.trim() || !activeEvent) return;

    await supabase.from('spots').insert([{
      event_id: activeEvent.id,
      name: newSpotName,
      category: newSpotCategory,
      votes: 1,
      suggested_by: currentUser.name,
      active_now: false
    }]);

    setNewSpotName('');
    fetchAppData();
  };

  const handleVoteSpot = async (spotId, currentVotes) => {
    await supabase.from('spots').update({ votes: currentVotes + 1 }).eq('id', spotId);
    fetchAppData();
  };

  const handleActivateSpot = async (spotId) => {
    await supabase.from('spots').update({ active_now: false }).eq('event_id', activeEvent.id);
    await supabase.from('spots').update({ active_now: true }).eq('id', spotId);
    fetchAppData();
  };

  const handleAddExpense = async (e) => {
    e.preventDefault();
    if (!expenseDesc.trim() || !expenseAmount || !activeEvent) return;

    await supabase.from('expenses').insert([{
      event_id: activeEvent.id,
      description: expenseDesc,
      amount: parseFloat(expenseAmount),
      paid_by: currentUser.name
    }]);

    setExpenseDesc('');
    setExpenseAmount('');
    fetchAppData();
  };

  const handlePhotoUpload = async (e) => {
    const file = e.target.files[0];
    if (file && activeEvent) {
      const reader = new FileReader();
      reader.onloadend = async () => {
        await supabase.from('photos').insert([{
          event_id: activeEvent.id,
          url: reader.result,
          user_name: currentUser.name
        }]);
        fetchAppData();
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRequestJoin = async (eventId) => {
    await supabase.from('event_members').insert([{
      event_id: eventId,
      user_name: currentUser.name,
      status: 'pending_request'
    }]);
    fetchAppData();
  };

  const handleApproveRequest = async (eventId, userName) => {
    await supabase.from('event_members').update({ status: 'member' }).eq('event_id', eventId).eq('user_name', userName);
    fetchAppData();
  };

  const handleRejectRequest = async (eventId, userName) => {
    await supabase.from('event_members').delete().eq('event_id', eventId).eq('user_name', userName);
    fetchAppData();
  };

  const handleAcceptInvitation = async (eventId) => {
    await supabase.from('event_members').update({ status: 'member' }).eq('event_id', eventId).eq('user_name', currentUser.name);
    fetchAppData();
  };

  const handleRejectInvitation = async (eventId) => {
    await supabase.from('event_members').delete().eq('event_id', eventId).eq('user_name', currentUser.name);
    fetchAppData();
  };

  const myInvitations = events.filter(e => e.pendingInvitations.includes(currentUser?.name));
  const myApprovalRequests = events.filter(e => e.creator_name === currentUser?.name && e.pendingRequests.length > 0);
  const totalNotifications = myInvitations.length + myApprovalRequests.reduce((acc, curr) => acc + curr.pendingRequests.length, 0);

  // -------------------------------------------------------------
  // LOGIN / REGISTRO
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
          <p className="text-slate-500 text-center mb-6 text-xs">Organiza tus salidas y experiencias con Supabase</p>

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
                <label className="block text-xs font-bold text-slate-600 mb-1">Nombre</label>
                <input 
                  type="text" 
                  placeholder="Tu nombre" 
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-2.5 text-sm focus:outline-none focus:border-indigo-500 text-slate-900"
                />
              </div>
            )}
            <div>
              <label className="block text-xs font-bold text-slate-600 mb-1">Correo Electrónico</label>
              <input 
                type="email" 
                placeholder="correo@ejemplo.com" 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-2.5 text-sm focus:outline-none focus:border-indigo-500 text-slate-900"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-600 mb-1">Contraseña</label>
              <input 
                type="password" 
                placeholder="••••••••" 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-2.5 text-sm focus:outline-none focus:border-indigo-500 text-slate-900"
              />
            </div>
            <button type="submit" className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 rounded-2xl text-sm transition shadow-md shadow-indigo-500/20">
              {authMode === 'login' ? 'Entrar' : 'Registrarse'}
            </button>
          </form>
        </div>
      </div>
    );
  }

  // -------------------------------------------------------------
  // VISTA EVENTO ACTIVO
  // -------------------------------------------------------------
  if (activeEvent) {
    const totalSpent = (activeEvent.expenses || []).reduce((acc, c) => acc + Number(c.amount), 0);
    const perPerson = activeEvent.members.length > 0 ? (totalSpent / activeEvent.members.length) : 0;
    const currentActiveSpot = (activeEvent.spots || []).find(s => s.active_now);

    return (
      <div className="min-h-screen bg-slate-50 text-slate-800 pb-24">
        <header className="bg-white/80 backdrop-blur-md border-b border-slate-200 p-4 sticky top-0 z-40 flex items-center justify-between shadow-sm">
          <button onClick={() => setActiveEvent(null)} className="flex items-center text-xs font-bold text-indigo-600 bg-indigo-50 px-3 py-1.5 rounded-full hover:bg-indigo-100 transition">
            <ArrowLeft size={16} className="mr-1" /> Volver
          </button>
          <span className="text-xs font-bold text-slate-500">{activeEvent.date}</span>
        </header>

        <main className="max-w-md mx-auto p-4 space-y-5">
          <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-sm">
            <h1 className="text-xl font-black text-slate-900">{activeEvent.title}</h1>
            <p className="text-xs text-slate-500 mt-0.5">Creador: <span className="font-semibold text-slate-700">{activeEvent.creator_name}</span></p>
          </div>

          <div className="bg-gradient-to-br from-indigo-600 to-purple-700 text-white p-5 rounded-3xl shadow-lg relative overflow-hidden">
            <span className="text-[10px] font-black uppercase tracking-wider bg-white/20 px-2.5 py-0.5 rounded-full">Ubicación Activa</span>
            <h2 className="text-lg font-black mt-2 mb-1">📍 {currentActiveSpot ? currentActiveSpot.name : 'Ningún sitio seleccionado'}</h2>
            {currentActiveSpot && (
              <a href={`https://maps.google.com/?q=${encodeURIComponent(currentActiveSpot.name)}`} target="_blank" rel="noreferrer" className="mt-3 inline-flex items-center space-x-1.5 bg-white text-indigo-700 font-bold text-xs px-4 py-2 rounded-xl shadow">
                <Navigation size={14} /> <span>Abrir en Google Maps</span>
              </a>
            )}
          </div>

          <div className="flex bg-white p-1 rounded-2xl border border-slate-200 shadow-sm">
            <button onClick={() => setEventSubTab('spots')} className={`flex-1 py-2 text-xs font-bold rounded-xl transition ${eventSubTab === 'spots' ? 'bg-indigo-600 text-white' : 'text-slate-500'}`}>Sitios</button>
            <button onClick={() => setEventSubTab('expenses')} className={`flex-1 py-2 text-xs font-bold rounded-xl transition ${eventSubTab === 'expenses' ? 'bg-indigo-600 text-white' : 'text-slate-500'}`}>Gastos</button>
            <button onClick={() => setEventSubTab('gallery')} className={`flex-1 py-2 text-xs font-bold rounded-xl transition ${eventSubTab === 'gallery' ? 'bg-indigo-600 text-white' : 'text-slate-500'}`}>Fotos</button>
          </div>

          {eventSubTab === 'spots' && (
            <div className="space-y-4">
              <form onSubmit={handleAddSpot} className="bg-white p-4 rounded-3xl border border-slate-200/80 shadow-sm space-y-3">
                <input type="text" placeholder="Nombre del sitio" value={newSpotName} onChange={(e) => setNewSpotName(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-3.5 py-2 text-xs text-slate-900" />
                <button type="submit" className="w-full bg-indigo-600 text-white text-xs font-bold rounded-2xl py-2 shadow-sm">Añadir Sitio</button>
              </form>
              <div className="space-y-2.5">
                {(activeEvent.spots || []).map((spot) => (
                  <div key={spot.id} className={`p-4 rounded-2xl border flex items-center justify-between ${spot.active_now ? 'bg-indigo-50 border-indigo-300' : 'bg-white border-slate-200'}`}>
                    <div>
                      <h4 className="font-bold text-slate-900 text-sm">{spot.name}</h4>
                      <p className="text-[11px] text-slate-500">{spot.votes} votos</p>
                    </div>
                    <div className="flex gap-1.5">
                      <button onClick={() => handleVoteSpot(spot.id, spot.votes)} className="bg-slate-100 px-3 py-1.5 rounded-xl text-xs font-bold">👍</button>
                      {!spot.active_now && <button onClick={() => handleActivateSpot(spot.id)} className="bg-indigo-100 text-indigo-700 px-3 py-1.5 rounded-xl text-xs font-bold">Ir aquí</button>}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {eventSubTab === 'expenses' && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-white p-4 rounded-2xl border border-slate-200"><p className="text-[10px] font-bold text-slate-400">TOTAL</p><p className="text-xl font-black text-emerald-600">{totalSpent.toFixed(2)}€</p></div>
                <div className="bg-white p-4 rounded-2xl border border-slate-200"><p className="text-[10px] font-bold text-slate-400">POR PERSONA</p><p className="text-xl font-black text-indigo-600">{perPerson.toFixed(2)}€</p></div>
              </div>
              <form onSubmit={handleAddExpense} className="bg-white p-4 rounded-3xl border border-slate-200 shadow-sm space-y-3">
                <input type="text" placeholder="Concepto" value={expenseDesc} onChange={(e) => setExpenseDesc(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-3.5 py-2 text-xs text-slate-900" />
                <input type="number" step="0.01" placeholder="Euros" value={expenseAmount} onChange={(e) => setExpenseAmount(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-3.5 py-2 text-xs text-slate-900" />
                <button type="submit" className="w-full bg-emerald-600 text-white text-xs font-bold rounded-2xl py-2 shadow-sm">Añadir Gasto</button>
              </form>
              <div className="space-y-2">
                {(activeEvent.expenses || []).map((exp) => (
                  <div key={exp.id} className="bg-white p-3.5 rounded-2xl border border-slate-200 flex justify-between items-center text-xs">
                    <div><p className="font-bold text-slate-900">{exp.description}</p><p className="text-[10px] text-slate-500">Pagado por {exp.paid_by}</p></div>
                    <span className="font-black text-emerald-600 text-sm">{Number(exp.amount).toFixed(2)}€</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {eventSubTab === 'gallery' && (
            <div className="space-y-4">
              <label className="flex flex-col items-center justify-center border-2 border-dashed border-slate-300 bg-white rounded-3xl p-6 cursor-pointer">
                <Camera className="w-6 h-6 text-indigo-600 mb-1" />
                <span className="text-xs font-bold text-slate-700">Subir foto</span>
                <input type="file" accept="image/*" onChange={handlePhotoUpload} className="hidden" />
              </label>
              <div className="grid grid-cols-2 gap-3">
                {(activeEvent.photos || []).map((photo) => (
                  <div key={photo.id} className="bg-white border border-slate-200 rounded-2xl overflow-hidden">
                    <img src={photo.url} alt="Recuerdo" className="w-full aspect-square object-cover" />
                    <p className="p-2 text-[10px] text-slate-500 text-center">{photo.user_name}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </main>
      </div>
    );
  }

  const filteredEvents = events.filter(e => e.title.toLowerCase().includes(searchQuery.toLowerCase()) || e.creator_name.toLowerCase().includes(searchQuery.toLowerCase()));
  const myEvents = events.filter(e => e.members.includes(currentUser.name));

  // -------------------------------------------------------------
  // ÁREA PERSONAL
  // -------------------------------------------------------------
  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 pb-24">
      <header className="bg-white/80 backdrop-blur-md border-b border-slate-200 p-4 sticky top-0 z-40 flex justify-between items-center shadow-sm">
        <div className="flex items-center space-x-2">
          <div className="w-8 h-8 bg-indigo-600 rounded-xl flex items-center justify-center text-white font-black text-sm">N</div>
          <span className="font-extrabold text-slate-900">Área Personal</span>
        </div>
        <div className="flex items-center space-x-3">
          <span className="text-xs font-bold text-slate-600">Hola, {currentUser.name}</span>
          <button onClick={() => setCurrentUser(null)} className="text-xs bg-slate-100 hover:bg-red-50 text-slate-500 hover:text-red-600 px-3 py-1.5 rounded-full">Salir</button>
        </div>
      </header>

      <main className="max-w-md mx-auto p-4 space-y-5">
        {activeTab === 'my-events' && (
          <div className="space-y-4">
            <button onClick={() => setShowCreateModal(true)} className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-bold py-3.5 px-4 rounded-2xl text-sm shadow-md flex items-center justify-center space-x-2">
              <Plus size={18} /> <span>Crear Nueva Salida / Plan</span>
            </button>
            <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm space-y-4">
              <h2 className="text-lg font-black text-slate-900">Tus Salidas Confirmadas ({myEvents.length})</h2>
              {myEvents.length === 0 ? (
                <p className="text-xs text-slate-400 py-4 text-center">No estás en ninguna salida.</p>
              ) : (
                <div className="space-y-3">
                  {myEvents.map((event) => (
                    <div key={event.id} onClick={() => setActiveEvent(event)} className="p-4 rounded-2xl border border-slate-200 bg-slate-50/50 space-y-2 cursor-pointer hover:border-indigo-400">
                      <div className="flex justify-between items-start">
                        <div>
                          <h3 className="font-bold text-slate-900 text-sm">{event.title}</h3>
                          <p className="text-xs text-slate-500">{event.date} • Creador: {event.creator_name}</p>
                        </div>
                        <span className="text-[10px] uppercase font-bold bg-indigo-100 text-indigo-700 px-2.5 py-1 rounded-full">Entrar</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'search' && (
          <div className="space-y-4">
            <input type="text" placeholder="Buscar salida..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="w-full bg-white border border-slate-200 rounded-2xl px-4 py-3 text-sm text-slate-900 shadow-sm" />
            <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm space-y-4">
              <h2 className="text-lg font-black text-slate-900">Salidas Disponibles</h2>
              <div className="space-y-3">
                {filteredEvents.map((event) => {
                  const isMember = event.members.includes(currentUser.name);
                  const isPending = event.pendingInvitations.includes(currentUser.name);
                  const hasRequested = event.pendingRequests.includes(currentUser.name);

                  return (
                    <div key={event.id} className="p-4 rounded-2xl border border-slate-200 bg-slate-50/50 flex flex-col gap-3">
                      <div>
                        <h3 className="font-bold text-slate-900 text-sm">{event.title}</h3>
                        <p className="text-xs text-slate-500">{event.date} • Creador: {event.creator_name}</p>
                      </div>
                      <div className="flex justify-between items-center pt-2 border-t border-slate-200">
                        <span className="text-xs text-slate-500">{event.members.length} miembros</span>
                        {isMember ? (
                          <button onClick={() => setActiveEvent(event)} className="text-xs font-bold text-indigo-600 bg-indigo-50 px-3 py-1 rounded-xl">Ver Plan</button>
                        ) : hasRequested ? (
                          <span className="text-xs font-bold text-amber-600">Solicitud enviada</span>
                        ) : isPending ? (
                          <span className="text-xs font-bold text-indigo-600">Invitación pendiente</span>
                        ) : (
                          <button onClick={() => handleRequestJoin(event.id)} className="bg-indigo-600 text-white text-xs font-bold px-3 py-1.5 rounded-xl flex items-center gap-1">
                            <UserPlus size={14} /> Solicitar unirse
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'notifications' && (
          <div className="space-y-4">
            <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm space-y-3">
              <h2 className="text-base font-black text-slate-900">Invitaciones ({myInvitations.length})</h2>
              {myInvitations.map((event) => (
                <div key={event.id} className="p-3.5 rounded-2xl border border-indigo-100 bg-indigo-50/40 flex justify-between items-center">
                  <p className="text-xs font-bold text-slate-900">{event.title}</p>
                  <div className="flex gap-1.5">
                    <button onClick={() => handleAcceptInvitation(event.id)} className="bg-emerald-600 text-white p-2 rounded-xl text-xs"><Check size={14} /></button>
                    <button onClick={() => handleRejectInvitation(event.id)} className="bg-slate-200 text-slate-600 p-2 rounded-xl text-xs"><X size={14} /></button>
                  </div>
                </div>
              ))}
            </div>

            <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm space-y-3">
              <h2 className="text-base font-black text-slate-900">Solicitudes para tus eventos</h2>
              {myApprovalRequests.map((event) => (
                <div key={event.id} className="space-y-2">
                  <p className="text-xs font-bold text-slate-700">{event.title}</p>
                  {event.pendingRequests.map((userName) => (
                    <div key={userName} className="p-3.5 rounded-2xl border border-purple-100 bg-purple-50/40 flex justify-between items-center">
                      <p className="text-xs font-bold text-slate-900">{userName} quiere unirse</p>
                      <div className="flex gap-1.5">
                        <button onClick={() => handleApproveRequest(event.id, userName)} className="bg-purple-600 text-white px-3 py-1.5 rounded-xl text-xs font-bold">Aprobar</button>
                        <button onClick={() => handleRejectRequest(event.id, userName)} className="bg-slate-200 text-slate-600 p-1.5 rounded-xl text-xs"><X size={14} /></button>
                      </div>
                    </div>
                  ))}
                </div>
              ))}
            </div>
          </div>
        )}
      </main>

      {showCreateModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white max-w-md w-full p-6 rounded-3xl shadow-2xl space-y-4">
            <h3 className="font-black text-slate-900 text-lg">Organizar Nueva Salida</h3>
            <form onSubmit={handleCreateEvent} className="space-y-4">
              <input type="text" placeholder="Título" value={newTitle} onChange={(e) => setNewTitle(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-2.5 text-sm text-slate-900" />
              <input type="date" value={newDate} onChange={(e) => setNewDate(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-2.5 text-sm text-slate-900" />
              <div className="flex flex-wrap gap-2 max-h-36 overflow-y-auto">
                {availableFriends.map((friend) => {
                  const isSelected = selectedFriends.includes(friend);
                  return (
                    <button type="button" key={friend} onClick={() => toggleFriendSelection(friend)} className={`text-xs px-3 py-1.5 rounded-xl font-bold border ${isSelected ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-slate-100 text-slate-600 border-slate-200'}`}>
                      {friend}
                    </button>
                  );
                })}
              </div>
              <div className="flex gap-2">
                <button type="button" onClick={() => setShowCreateModal(false)} className="w-1/2 bg-slate-100 text-slate-700 font-bold py-2.5 rounded-2xl text-xs">Cancelar</button>
                <button type="submit" className="w-1/2 bg-indigo-600 text-white font-bold py-2.5 rounded-2xl text-xs">Crear</button>
              </div>
            </form>
          </div>
        </div>
      )}

      <nav className="fixed bottom-3 left-4 right-4 bg-white/90 backdrop-blur-xl border border-slate-200 py-2.5 px-6 flex justify-around items-center z-40 rounded-3xl shadow-xl max-w-md mx-auto">
        <button onClick={() => setActiveTab('my-events')} className={`flex flex-col items-center ${activeTab === 'my-events' ? 'text-indigo-600 font-bold' : 'text-slate-400'}`}><Calendar size={20} /><span className="text-[10px]">Mis Salidas</span></button>
        <button onClick={() => setActiveTab('search')} className={`flex flex-col items-center ${activeTab === 'search' ? 'text-indigo-600 font-bold' : 'text-slate-400'}`}><Search size={20} /><span className="text-[10px]">Buscar</span></button>
        <button onClick={() => setActiveTab('notifications')} className={`flex flex-col items-center relative ${activeTab === 'notifications' ? 'text-indigo-600 font-bold' : 'text-slate-400'}`}>
          <Inbox size={20} /><span className="text-[10px]">Aprobaciones</span>
          {totalNotifications > 0 && <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[9px] w-4 h-4 rounded-full flex items-center justify-center">{totalNotifications}</span>}
        </button>
      </nav>
    </div>
  );
}
