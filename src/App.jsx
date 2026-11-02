import React, { useState, useEffect } from 'react';
import { 
  Users, MapPin, DollarSign, Plus, CheckCircle, 
  Clock, Camera, Navigation, ArrowRight, Trash2, Shield, Calendar, Sparkles, User, Lock, Mail, Bell, Search, Check, X, UserPlus, Inbox, ArrowLeft, Image as ImageIcon, Utensils, Beer, PartyPopper
} from 'lucide-react';
import { supabase } from './supabaseClient';

const PLAN_IMAGES = {
  cervecitas: 'https://images.unsplash.com/photo-1535958636474-b021ee887b13?auto=format&fit=crop&w=600&q=80',
  tapas: 'https://images.unsplash.com/photo-1515443961218-a51367888e4b?auto=format&fit=crop&w=600&q=80',
  cena: 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=600&q=80',
  barbacoa: 'https://images.unsplash.com/photo-1555939594-58d7cb561ad1?auto=format&fit=crop&w=600&q=80',
  default: 'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?auto=format&fit=crop&w=600&q=80'
};

const getPlanCover = (title = '') => {
  const t = title.toLowerCase();
  if (t.includes('cerveza') || t.includes('tapa') || t.includes('caña')) return PLAN_IMAGES.tapas;
  if (t.includes('cena') || t.includes('restaurante')) return PLAN_IMAGES.cena;
  if (t.includes('barbacoa') || t.includes('campo')) return PLAN_IMAGES.barbacoa;
  return PLAN_IMAGES.default;
};

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

  // Búsqueda dinámica de usuarios reales
  const [friendSearchInput, setFriendSearchInput] = useState('');
  const [registeredUsers, setRegisteredUsers] = useState([]);

  const [newSpotName, setNewSpotName] = useState('');
  const [newSpotCategory, setNewSpotCategory] = useState('cervecitas');
  const [expenseDesc, setExpenseDesc] = useState('');
  const [expenseAmount, setExpenseAmount] = useState('');

  const [events, setEvents] = useState([]);

  useEffect(() => {
    if (currentUser) {
      fetchAppData();
      fetchRegisteredUsers();
    }
  }, [currentUser]);

  const fetchRegisteredUsers = async () => {
    try {
      const { data, error } = await supabase.from('profiles').select('name, email');
      if (error) throw error;
      setRegisteredUsers(data || []);
    } catch (err) {
      console.error('Error cargando perfiles:', err.message);
    }
  };

  const fetchAppData = async () => {
    try {
      const { data: eventsData, error } = await supabase.from('events').select('*, spots(*), expenses(*), photos(*), event_members(*)');
      if (error) throw error;

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
        const userDisplayName = name.trim() || email.split('@')[0];
        await supabase.from('profiles').insert([{ id: data.user.id, name: userDisplayName, email }]);
        setCurrentUser({ id: data.user.id, name: userDisplayName, email });
      }
    } else {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) {
        alert(error.message);
        return;
      }
      if (data.user) {
        const { data: profile } = await supabase.from('profiles').select('*').eq('id', data.user.id).single();
        const userDisplayName = profile ? profile.name : email.split('@')[0];
        setCurrentUser({ id: data.user.id, name: userDisplayName, email });
      }
    }
  };

  const toggleFriendSelection = (friendName) => {
    if (selectedFriends.includes(friendName)) {
      setSelectedFriends(selectedFriends.filter(f => f !== friendName));
    } else {
      setSelectedFriends([...selectedFriends, friendName]);
    }
  };

  const handleCreateEvent = async (e) => {
    e.preventDefault();
    if (!newTitle.trim() || !newDate) return;

    try {
      const { data: newEv, error: eventError } = await supabase
        .from('events')
        .insert([{
          title: newTitle,
          date: newDate,
          creator_id: currentUser.id,
          creator_name: currentUser.name
        }])
        .select()
        .single();

      if (eventError) throw eventError;

      await supabase.from('event_members').insert([{ 
        event_id: newEv.id, 
        user_name: currentUser.name, 
        status: 'member' 
      }]);

      if (selectedFriends.length > 0) {
        const memberInserts = selectedFriends.map(friend => ({
          event_id: newEv.id,
          user_name: friend,
          status: 'pending_invite'
        }));
        await supabase.from('event_members').insert(memberInserts);
      }

      setNewTitle('');
      setNewDate('');
      setSelectedFriends([]);
      setFriendSearchInput('');
      setShowCreateModal(false);
      await fetchAppData();

    } catch (err) {
      console.error('Error al crear evento:', err.message);
      alert('Error al crear el evento: ' + err.message);
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

  const filteredUsersToInvite = registeredUsers.filter(u => 
    u.name.toLowerCase() !== currentUser?.name.toLowerCase() &&
    (u.name.toLowerCase().includes(friendSearchInput.toLowerCase()) || 
     u.email.toLowerCase().includes(friendSearchInput.toLowerCase()))
  );

  // -------------------------------------------------------------
  // LÓGICA DE REPARTO DE GASTOS Y DEUDAS CRUZADAS
  // -------------------------------------------------------------
  const calculateDebts = (members = [], expenses = []) => {
    if (members.length === 0) return [];

    const totalSpent = expenses.reduce((sum, exp) => sum + Number(exp.amount), 0);
    const sharePerPerson = totalSpent / members.length;

    // Calcular lo que ha pagado cada miembro
    const paidMap = {};
    members.forEach(m => { paidMap[m] = 0; });
    expenses.forEach(exp => {
      if (paidMap[exp.paid_by] !== undefined) {
        paidMap[exp.paid_by] += Number(exp.amount);
      } else {
        // Si pagó alguien que ya no está formalmente en miembros
        paidMap[exp.paid_by] = Number(exp.amount);
      }
    });

    // Balance neto: positivo = le deben (acreedor), negativo = debe (deudor)
    const balances = [];
    const allNames = Array.from(new Set([...members, ...Object.keys(paidMap)]));
    
    allNames.forEach(name => {
      const paid = paidMap[name] || 0;
      const shouldPay = members.includes(name) ? sharePerPerson : 0;
      const balance = paid - shouldPay; // > 0 cobra, < 0 paga
      balances.push({ name, balance });
    });

    // Separar deudores y acreedores
    let debtors = balances.filter(b => b.balance < -0.01).map(d => ({ ...d, balance: Math.abs(d.balance) }));
    let creditors = balances.filter(b => b.balance > 0.01);

    const transactions = [];

    // Algoritmo de liquidación de deudas
    let dIndex = 0;
    let cIndex = 0;

    while (dIndex < debtors.length && cIndex < creditors.length) {
      const debtor = debtors[dIndex];
      const creditor = creditors[cIndex];

      const amountToTransfer = Math.min(debtor.balance, creditor.balance);

      if (amountToTransfer > 0.01) {
        transactions.push({
          from: debtor.name,
          to: creditor.name,
          amount: amountToTransfer
        });
      }

      debtor.balance -= amountToTransfer;
      creditor.balance -= amountToTransfer;

      if (debtor.balance <= 0.01) dIndex++;
      if (creditor.balance <= 0.01) cIndex++;
    }

    return transactions;
  };

  // -------------------------------------------------------------
  // LOGIN / REGISTRO
  // -------------------------------------------------------------
  if (!currentUser) {
    return (
      <main className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4 text-slate-900 relative overflow-hidden">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-lg h-80 bg-gradient-to-tr from-indigo-300/40 to-purple-300/40 rounded-b-full blur-3xl pointer-events-none" aria-hidden="true"></div>

        <div className="max-w-md w-full bg-white/90 backdrop-blur-xl p-8 rounded-[2.5rem] shadow-xl border border-slate-200/80 relative z-10 space-y-6">
          <div className="text-center space-y-2">
            <div className="w-16 h-16 bg-gradient-to-tr from-indigo-600 to-purple-600 rounded-2xl mx-auto flex items-center justify-center text-3xl shadow-lg shadow-indigo-500/20 text-white" aria-hidden="true">
              🚀
            </div>
            <h1 className="text-2xl font-black tracking-tight text-slate-900">Nosotros APP</h1>
            <p className="text-xs font-medium text-slate-500">Organiza tus salidas, gastos y quedadas con tu grupo</p>
          </div>

          <div className="flex bg-slate-100 p-1.5 rounded-2xl border border-slate-200" role="tablist">
            <button 
              role="tab"
              aria-selected={authMode === 'login'}
              onClick={() => setAuthMode('login')}
              className={`flex-1 py-3 text-xs font-bold rounded-xl transition-all focus:outline-none ${authMode === 'login' ? 'bg-white text-indigo-700 shadow-sm' : 'text-slate-500 hover:text-slate-800'}`}
            >
              Iniciar Sesión
            </button>
            <button 
              role="tab"
              aria-selected={authMode === 'register'}
              onClick={() => setAuthMode('register')}
              className={`flex-1 py-3 text-xs font-bold rounded-xl transition-all focus:outline-none ${authMode === 'register' ? 'bg-white text-indigo-700 shadow-sm' : 'text-slate-500 hover:text-slate-800'}`}
            >
              Crear Cuenta
            </button>
          </div>

          <form onSubmit={handleAuth} className="space-y-4">
            {authMode === 'register' && (
              <div className="space-y-1">
                <label htmlFor="reg-name" className="block text-xs font-bold text-slate-700 ml-1">Nombre Completo</label>
                <div className="relative flex items-center">
                  <User className="absolute left-3.5 text-slate-400" size={18} />
                  <input 
                    id="reg-name"
                    type="text" 
                    placeholder="Tu nombre" 
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-2xl pl-10 pr-4 py-3 text-sm focus:outline-none focus:border-indigo-500 focus:bg-white text-slate-900 transition-all shadow-sm"
                    required
                  />
                </div>
              </div>
            )}

            <div className="space-y-1">
              <label htmlFor="auth-email" className="block text-xs font-bold text-slate-700 ml-1">Correo Electrónico</label>
              <div className="relative flex items-center">
                <Mail className="absolute left-3.5 text-slate-400" size={18} />
                <input 
                  id="auth-email"
                  type="email" 
                  placeholder="correo@ejemplo.com" 
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-2xl pl-10 pr-4 py-3 text-sm focus:outline-none focus:border-indigo-500 focus:bg-white text-slate-900 transition-all shadow-sm"
                  required
                />
              </div>
            </div>

            <div className="space-y-1">
              <label htmlFor="auth-password" className="block text-xs font-bold text-slate-700 ml-1">Contraseña</label>
              <div className="relative flex items-center">
                <Lock className="absolute left-3.5 text-slate-400" size={18} />
                <input 
                  id="auth-password"
                  type="password" 
                  placeholder="••••••••" 
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-2xl pl-10 pr-4 py-3 text-sm focus:outline-none focus:border-indigo-500 focus:bg-white text-slate-900 transition-all shadow-sm"
                  required
                />
              </div>
            </div>

            <button 
              type="submit" 
              className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-bold py-3.5 rounded-2xl text-sm transition shadow-md shadow-indigo-600/20 active:scale-[0.98] focus:outline-none focus:ring-2 focus:ring-indigo-600 mt-2"
            >
              {authMode === 'login' ? 'Entrar a mi cuenta' : 'Registrarme'}
            </button>
          </form>
        </div>
      </main>
    );
  }

  // -------------------------------------------------------------
  // DETALLE DE UN EVENTO ACTIVO
  // -------------------------------------------------------------
  if (activeEvent) {
    const totalSpent = (activeEvent.expenses || []).reduce((acc, c) => acc + Number(c.amount), 0);
    const perPerson = activeEvent.members.length > 0 ? (totalSpent / activeEvent.members.length) : 0;
    const currentActiveSpot = (activeEvent.spots || []).find(s => s.active_now);
    const coverImage = getPlanCover(activeEvent.title);
    const calculatedDebts = calculateDebts(activeEvent.members, activeEvent.expenses);

    return (
      <div className="min-h-screen bg-slate-50 text-slate-900 pb-24">
        <div className="relative h-44 w-full bg-slate-800">
          <img src={coverImage} alt="" className="w-full h-full object-cover opacity-60" aria-hidden="true" />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-black/30"></div>
          
          <button 
            onClick={() => setActiveEvent(null)} 
            aria-label="Volver a mis salidas"
            className="absolute top-4 left-4 flex items-center text-xs font-bold text-slate-900 bg-white/90 backdrop-blur-md px-3.5 py-2 rounded-full hover:bg-white transition shadow-md focus:outline-none focus:ring-2 focus:ring-indigo-600"
          >
            <ArrowLeft size={16} className="mr-1" /> Volver
          </button>
          
          <div className="absolute bottom-4 left-4 right-4 text-white">
            <span className="text-[10px] font-bold uppercase tracking-wider bg-white/25 backdrop-blur-md px-2.5 py-0.5 rounded-full inline-block mb-1">
              📅 {activeEvent.date}
            </span>
            <h1 className="text-2xl font-black leading-tight drop-shadow-sm">{activeEvent.title}</h1>
            <p className="text-xs text-slate-200 mt-0.5">Organiza: <span className="font-semibold text-white">{activeEvent.creator_name}</span></p>
          </div>
        </div>

        <main className="max-w-md mx-auto p-4 space-y-5">
          
          {/* ASISTENTES */}
          <div className="bg-white p-4 rounded-3xl border border-slate-200 shadow-sm space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-black uppercase tracking-wider text-slate-700 flex items-center">
                <Users size={14} className="mr-1.5 text-indigo-600" /> Asistentes Confirmados ({activeEvent.members.length})
              </span>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {activeEvent.members.map((member) => (
                <span key={member} className="text-xs font-bold bg-indigo-50 text-indigo-700 px-3 py-1.5 rounded-xl border border-indigo-100 flex items-center">
                  👤 {member}
                </span>
              ))}
            </div>
          </div>

          <div className="bg-gradient-to-br from-indigo-600 to-purple-700 text-white p-5 rounded-3xl shadow-lg relative overflow-hidden">
            <span className="text-[10px] font-black uppercase tracking-wider bg-white/20 px-2.5 py-1 rounded-full">📍 Ubicación Elegida</span>
            <h2 className="text-xl font-black mt-2 mb-1">{currentActiveSpot ? currentActiveSpot.name : 'Ningún sitio seleccionado'}</h2>
            {currentActiveSpot && (
              <a 
                href={`https://maps.google.com/?q=${encodeURIComponent(currentActiveSpot.name)}`} 
                target="_blank" 
                rel="noreferrer" 
                className="mt-3 inline-flex items-center space-x-2 bg-white text-indigo-700 font-bold text-xs px-4 py-2.5 rounded-xl shadow transition hover:bg-slate-100"
              >
                <Navigation size={14} /> <span>Abrir en Google Maps</span>
              </a>
            )}
          </div>

          <div className="flex bg-white p-1 rounded-2xl border border-slate-200 shadow-sm" role="tablist">
            <button onClick={() => setEventSubTab('spots')} role="tab" aria-selected={eventSubTab === 'spots'} className={`flex-1 py-2.5 text-xs font-bold rounded-xl transition ${eventSubTab === 'spots' ? 'bg-indigo-600 text-white shadow' : 'text-slate-600'}`}>Sitios Propuestos</button>
            <button onClick={() => setEventSubTab('expenses')} role="tab" aria-selected={eventSubTab === 'expenses'} className={`flex-1 py-2.5 text-xs font-bold rounded-xl transition ${eventSubTab === 'expenses' ? 'bg-indigo-600 text-white shadow' : 'text-slate-600'}`}>Gastos y Deudas</button>
            <button onClick={() => setEventSubTab('gallery')} role="tab" aria-selected={eventSubTab === 'gallery'} className={`flex-1 py-2.5 text-xs font-bold rounded-xl transition ${eventSubTab === 'gallery' ? 'bg-indigo-600 text-white shadow' : 'text-slate-600'}`}>Fotos</button>
          </div>

          {eventSubTab === 'spots' && (
            <div className="space-y-4">
              <form onSubmit={handleAddSpot} className="bg-white p-4 rounded-3xl border border-slate-200 shadow-sm space-y-3">
                <label htmlFor="new-spot-input" className="block text-xs font-bold text-slate-700">Proponer sitio o bar</label>
                <input id="new-spot-input" type="text" placeholder="Ej. Bar Pepe" value={newSpotName} onChange={(e) => setNewSpotName(e.target.value)} className="w-full bg-slate-50 border border-slate-300 rounded-2xl px-3.5 py-2.5 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-600" />
                <button type="submit" className="w-full bg-indigo-600 text-white text-xs font-bold rounded-2xl py-2.5 shadow hover:bg-indigo-700">Añadir Propuesta</button>
              </form>
              <div className="space-y-2.5">
                {(activeEvent.spots || []).map((spot) => (
                  <div key={spot.id} className={`p-4 rounded-2xl border flex items-center justify-between ${spot.active_now ? 'bg-indigo-50 border-indigo-300' : 'bg-white border-slate-200'}`}>
                    <div>
                      <h3 className="font-bold text-slate-900 text-sm">{spot.name}</h3>
                      <p className="text-[11px] text-slate-500 font-medium">
                        Propuesto por <span className="font-bold text-indigo-600">{spot.suggested_by}</span> • {spot.votes} votos
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <button onClick={() => handleVoteSpot(spot.id, spot.votes)} className="bg-slate-100 border border-slate-300 px-3 py-1.5 rounded-xl text-xs font-bold text-slate-800">👍 Votar</button>
                      {!spot.active_now && <button onClick={() => handleActivateSpot(spot.id)} className="bg-indigo-100 text-indigo-800 px-3 py-1.5 rounded-xl text-xs font-bold">Ir aquí</button>}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* GASTOS Y REPARTO EXACTO DE DEUDAS */}
          {eventSubTab === 'expenses' && (
            <div className="space-y-5">
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm"><p className="text-[10px] font-bold text-slate-500">TOTAL GRUPO</p><p className="text-xl font-black text-emerald-600">{totalSpent.toFixed(2)}€</p></div>
                <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm"><p className="text-[10px] font-bold text-slate-500">POR PERSONA</p><p className="text-xl font-black text-indigo-600">{perPerson.toFixed(2)}€</p></div>
              </div>

              {/* MÓDULO DE LIQUIDACIÓN DE DEUDAS (QUIÉN PAGA A QUIÉN) */}
              <div className="bg-gradient-to-br from-slate-900 to-indigo-950 text-white p-5 rounded-3xl shadow-lg space-y-3">
                <h3 className="text-xs font-black uppercase tracking-wider text-indigo-300 flex items-center">
                  <DollarSign size={16} className="mr-1 text-emerald-400" /> Reparto y Liquidación de Deudas
                </h3>
                
                {calculatedDebts.length === 0 ? (
                  <p className="text-xs text-slate-300">¡Cuentas saldadas! Nadie debe dinero a nadie en este momento.</p>
                ) : (
                  <div className="space-y-2">
                    {calculatedDebts.map((debt, index) => (
                      <div key={index} className="bg-white/10 backdrop-blur-md p-3 rounded-2xl border border-white/10 flex justify-between items-center text-xs">
                        <div>
                          <span className="font-bold text-white">{debt.from}</span>
                          <span className="text-slate-300 mx-1.5">debe pagar a</span>
                          <span className="font-bold text-emerald-300">{debt.to}</span>
                        </div>
                        <span className="font-black text-emerald-400 text-sm bg-emerald-950/60 px-3 py-1 rounded-xl">
                          {debt.amount.toFixed(2)}€
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <form onSubmit={handleAddExpense} className="bg-white p-4 rounded-3xl border border-slate-200 shadow-sm space-y-3">
                <h4 className="text-xs font-bold text-slate-800">Añadir nuevo gasto</h4>
                <input type="text" aria-label="Concepto" placeholder="Concepto (ej. Cervezas, Comida...)" value={expenseDesc} onChange={(e) => setExpenseDesc(e.target.value)} className="w-full bg-slate-50 border border-slate-300 rounded-2xl px-3.5 py-2.5 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-600" />
                <input type="number" step="0.01" aria-label="Importe" placeholder="Importe (€)" value={expenseAmount} onChange={(e) => setExpenseAmount(e.target.value)} className="w-full bg-slate-50 border border-slate-300 rounded-2xl px-3.5 py-2.5 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-600" />
                <button type="submit" className="w-full bg-emerald-600 text-white text-xs font-bold rounded-2xl py-2.5 shadow hover:bg-emerald-700 transition">Añadir Gasto</button>
              </form>

              <div className="space-y-2">
                <h4 className="text-xs font-bold text-slate-700 px-1">Historial de Gastos</h4>
                {(activeEvent.expenses || []).length === 0 ? (
                  <p className="text-xs text-slate-400 px-1">No hay gastos registrados todavía.</p>
                ) : (
                  (activeEvent.expenses || []).map((exp) => (
                    <div key={exp.id} className="bg-white p-3.5 rounded-2xl border border-slate-200 flex justify-between items-center text-xs shadow-sm">
                      <div>
                        <p className="font-bold text-slate-900">{exp.description}</p>
                        <p className="text-[10px] text-slate-500">Pagado por <span className="font-bold text-indigo-600">{exp.paid_by}</span></p>
                      </div>
                      <span className="font-black text-emerald-700 text-sm">{Number(exp.amount).toFixed(2)}€</span>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {eventSubTab === 'gallery' && (
            <div className="space-y-4">
              <label className="flex flex-col items-center justify-center border-2 border-dashed border-slate-300 bg-white rounded-3xl p-6 cursor-pointer hover:border-indigo-500 transition shadow-sm">
                <Camera className="w-6 h-6 text-indigo-600 mb-1" />
                <span className="text-xs font-bold text-slate-800">Subir foto del plan</span>
                <input type="file" accept="image/*" onChange={handlePhotoUpload} className="hidden" />
              </label>
              <div className="grid grid-cols-2 gap-3">
                {(activeEvent.photos || []).map((photo) => (
                  <div key={photo.id} className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
                    <img src={photo.url} alt={`Foto de ${photo.user_name}`} className="w-full aspect-square object-cover" />
                    <p className="p-2 text-[10px] text-slate-600 text-center font-bold">{photo.user_name}</p>
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
    <div className="min-h-screen bg-slate-50 text-slate-900 pb-24">
      <header className="bg-white/90 backdrop-blur-md border-b border-slate-200 p-4 sticky top-0 z-40 flex justify-between items-center shadow-sm">
        <div className="flex items-center space-x-2">
          <div className="w-8 h-8 bg-indigo-600 rounded-xl flex items-center justify-center text-white font-black text-sm" aria-hidden="true">N</div>
          <span className="font-extrabold text-slate-900 text-base">Área Personal</span>
        </div>
        <div className="flex items-center space-x-3">
          <span className="text-xs font-bold text-slate-700">Hola, {currentUser.name}</span>
          <button onClick={() => setCurrentUser(null)} className="text-xs bg-slate-100 hover:bg-red-50 text-slate-600 hover:text-red-600 px-3 py-1.5 rounded-full font-bold transition">Salir</button>
        </div>
      </header>

      <main className="max-w-md mx-auto p-4 space-y-5">
        {activeTab === 'my-events' && (
          <div className="space-y-4">
            <button onClick={() => setShowCreateModal(true)} className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-bold py-3.5 px-4 rounded-2xl text-sm shadow-md shadow-indigo-600/20 flex items-center justify-center space-x-2 transition hover:opacity-95">
              <Plus size={18} /> <span>Crear Nueva Salida / Plan</span>
            </button>

            <div className="space-y-3">
              <h2 className="text-base font-black text-slate-900 px-1">Tus Salidas Confirmadas ({myEvents.length})</h2>
              
              {myEvents.length === 0 ? (
                <div className="bg-white p-6 rounded-3xl border border-slate-200 text-center">
                  <p className="text-xs text-slate-500 font-medium">No estás participando en ninguna salida aún.</p>
                </div>
              ) : (
                myEvents.map((event) => {
                  const cover = getPlanCover(event.title);
                  return (
                    <article 
                      key={event.id} 
                      onClick={() => setActiveEvent(event)} 
                      className="bg-white rounded-3xl border border-slate-200/80 overflow-hidden shadow-sm hover:shadow-md transition cursor-pointer group"
                    >
                      <div className="h-32 w-full relative bg-slate-200">
                        <img src={cover} alt="" className="w-full h-full object-cover group-hover:scale-105 transition duration-300" aria-hidden="true" />
                        <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-transparent"></div>
                        <span className="absolute top-3 right-3 text-[10px] font-bold bg-white/90 backdrop-blur-md text-slate-900 px-2.5 py-1 rounded-full shadow">
                          📅 {event.date}
                        </span>
                        <h3 className="absolute bottom-3 left-3 right-3 text-white font-black text-lg drop-shadow">{event.title}</h3>
                      </div>
                      
                      <div className="p-4 flex justify-between items-center">
                        <p className="text-xs text-slate-600 font-medium">Organiza: <span className="font-bold text-slate-900">{event.creator_name}</span></p>
                        <span className="text-xs font-bold text-indigo-700 bg-indigo-50 px-3 py-1.5 rounded-xl group-hover:bg-indigo-600 group-hover:text-white transition">
                          Entrar →
                        </span>
                      </div>
                    </article>
                  );
                })
              )}
            </div>
          </div>
        )}

        {activeTab === 'search' && (
          <div className="space-y-4">
            <input type="text" aria-label="Buscar salida" placeholder="Buscar por título o creador..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="w-full bg-white border border-slate-300 rounded-2xl px-4 py-3 text-sm text-slate-900 shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-600" />
            
            <div className="space-y-3">
              <h2 className="text-base font-black text-slate-900 px-1">Salidas Disponibles</h2>
              {filteredEvents.map((event) => {
                const isMember = event.members.includes(currentUser.name);
                const isPending = event.pendingInvitations.includes(currentUser.name);
                const hasRequested = event.pendingRequests.includes(currentUser.name);
                const cover = getPlanCover(event.title);

                return (
                  <article key={event.id} className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-sm flex flex-col">
                    <div className="h-24 w-full relative bg-slate-200">
                      <img src={cover} alt="" className="w-full h-full object-cover" aria-hidden="true" />
                      <div className="absolute inset-0 bg-black/40"></div>
                      <h3 className="absolute bottom-2.5 left-3 text-white font-bold text-sm drop-shadow">{event.title}</h3>
                    </div>
                    
                    <div className="p-3.5 flex justify-between items-center">
                      <span className="text-xs text-slate-600 font-medium">{event.date} • {event.creator_name}</span>
                      {isMember ? (
                        <button onClick={() => setActiveEvent(event)} className="text-xs font-bold text-indigo-700 bg-indigo-50 px-3 py-1.5 rounded-xl">Ver Plan</button>
                      ) : hasRequested ? (
                        <span className="text-xs font-bold text-amber-700 bg-amber-50 px-3 py-1.5 rounded-xl">Solicitado</span>
                      ) : isPending ? (
                        <span className="text-xs font-bold text-indigo-700 bg-indigo-50 px-3 py-1.5 rounded-xl">Invitado</span>
                      ) : (
                        <button onClick={() => handleRequestJoin(event.id)} className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold px-3 py-1.5 rounded-xl shadow">Unirme</button>
                      )}
                    </div>
                  </article>
                );
              })}
            </div>
          </div>
        )}

        {activeTab === 'notifications' && (
          <div className="space-y-4">
            <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm space-y-3">
              <h2 className="text-base font-black text-slate-900">Invitaciones Recibidas ({myInvitations.length})</h2>
              {myInvitations.length === 0 ? <p className="text-xs text-slate-500">Sin invitaciones pendientes.</p> : myInvitations.map((event) => (
                <div key={event.id} className="p-3.5 rounded-2xl border border-indigo-200 bg-indigo-50/50 flex justify-between items-center">
                  <p className="text-xs font-bold text-slate-900">{event.title}</p>
                  <div className="flex gap-2">
                    <button onClick={() => handleAcceptInvitation(event.id)} aria-label="Aceptar" className="bg-emerald-600 text-white p-2 rounded-xl text-xs"><Check size={14} /></button>
                    <button onClick={() => handleRejectInvitation(event.id)} aria-label="Rechazar" className="bg-slate-200 text-slate-700 p-2 rounded-xl text-xs"><X size={14} /></button>
                  </div>
                </div>
              ))}
            </div>

            <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm space-y-3">
              <h2 className="text-base font-black text-slate-900">Solicitudes para tus Eventos</h2>
              {myApprovalRequests.length === 0 ? <p className="text-xs text-slate-500">Sin solicitudes pendientes.</p> : myApprovalRequests.map((event) => (
                <div key={event.id} className="space-y-2">
                  <p className="text-xs font-bold text-slate-800">{event.title}</p>
                  {event.pendingRequests.map((userName) => (
                    <div key={userName} className="p-3.5 rounded-2xl border border-purple-200 bg-purple-50/50 flex justify-between items-center">
                      <p className="text-xs font-bold text-slate-900">{userName} quiere unirse</p>
                      <div className="flex gap-2">
                        <button onClick={() => handleApproveRequest(event.id, userName)} className="bg-purple-600 text-white px-3 py-1.5 rounded-xl text-xs font-bold">Aprobar</button>
                        <button onClick={() => handleRejectRequest(event.id, userName)} aria-label="Rechazar" className="bg-slate-200 text-slate-700 p-1.5 rounded-xl text-xs"><X size={14} /></button>
                      </div>
                    </div>
                  ))}
                </div>
              ))}
            </div>
          </div>
        )}
      </main>

      {/* MODAL CREAR SALIDA */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white max-w-md w-full p-6 rounded-3xl shadow-2xl space-y-4 border border-slate-200">
            <h2 className="font-black text-slate-900 text-lg">Organizar Nueva Salida</h2>
            <form onSubmit={handleCreateEvent} className="space-y-4">
              <div>
                <label htmlFor="plan-title" className="block text-xs font-bold text-slate-700 mb-1">Título del Plan</label>
                <input id="plan-title" type="text" placeholder="Ej. Cervecitas en el centro" value={newTitle} onChange={(e) => setNewTitle(e.target.value)} className="w-full bg-slate-50 border border-slate-300 rounded-2xl px-4 py-2.5 text-sm text-slate-900" required />
              </div>
              <div>
                <label htmlFor="plan-date" className="block text-xs font-bold text-slate-700 mb-1">Fecha</label>
                <input id="plan-date" type="date" value={newDate} onChange={(e) => setNewDate(e.target.value)} className="w-full bg-slate-50 border border-slate-300 rounded-2xl px-4 py-2.5 text-sm text-slate-900" required />
              </div>
              
              <div>
                <label htmlFor="friend-search" className="block text-xs font-bold text-slate-700 mb-1">Invitar Usuarios Registrados</label>
                <div className="relative mb-2">
                  <Search className="absolute left-3.5 top-2.5 text-slate-400" size={16} />
                  <input 
                    id="friend-search"
                    type="text" 
                    placeholder="Buscar por nombre o email..." 
                    value={friendSearchInput} 
                    onChange={(e) => setFriendSearchInput(e.target.value)} 
                    className="w-full bg-slate-50 border border-slate-300 rounded-2xl pl-9 pr-4 py-2 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-600" 
                  />
                </div>

                <div className="flex flex-wrap gap-2 max-h-36 overflow-y-auto p-1 bg-slate-50 rounded-2xl border border-slate-200">
                  {filteredUsersToInvite.length === 0 ? (
                    <p className="text-[11px] text-slate-400 p-2 text-center w-full">No se encontraron usuarios registrados.</p>
                  ) : (
                    filteredUsersToInvite.map((u) => {
                      const isSelected = selectedFriends.includes(u.name);
                      return (
                        <button 
                          type="button" 
                          key={u.email} 
                          onClick={() => toggleFriendSelection(u.name)} 
                          className={`text-xs px-3 py-1.5 rounded-xl font-bold border transition flex items-center space-x-1 ${isSelected ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-white text-slate-700 border-slate-300 hover:border-indigo-400'}`}
                        >
                          <span>{u.name}</span>
                          {isSelected && <Check size={12} className="ml-1" />}
                        </button>
                      );
                    })
                  )}
                </div>
              </div>

              <div className="flex gap-2 pt-2">
                <button type="button" onClick={() => setShowCreateModal(false)} className="w-1/2 bg-slate-100 text-slate-800 font-bold py-2.5 rounded-2xl text-xs hover:bg-slate-200 transition">Cancelar</button>
                <button type="submit" className="w-1/2 bg-indigo-600 text-white font-bold py-2.5 rounded-2xl text-xs shadow hover:bg-indigo-700 transition">Crear Plan</button>
              </div>
            </form>
          </div>
        </div>
      )}

      <nav className="fixed bottom-3 left-4 right-4 bg-white/95 backdrop-blur-xl border border-slate-200 py-3 px-6 flex justify-around items-center z-40 rounded-3xl shadow-xl max-w-md mx-auto" aria-label="Navegación principal">
        <button onClick={() => setActiveTab('my-events')} className={`flex flex-col items-center ${activeTab === 'my-events' ? 'text-indigo-700 font-bold' : 'text-slate-500'}`}>
          <Calendar size={20} />
          <span className="text-[10px] mt-0.5">Mis Salidas</span>
        </button>
        <button onClick={() => setActiveTab('search')} className={`flex flex-col items-center ${activeTab === 'search' ? 'text-indigo-700 font-bold' : 'text-slate-500'}`}>
          <Search size={20} />
          <span className="text-[10px] mt-0.5">Buscar</span>
        </button>
        <button onClick={() => setActiveTab('notifications')} className={`flex flex-col items-center relative ${activeTab === 'notifications' ? 'text-indigo-700 font-bold' : 'text-slate-500'}`}>
          <Inbox size={20} />
          <span className="text-[10px] mt-0.5">Aprobaciones</span>
          {totalNotifications > 0 && <span className="absolute -top-1 -right-1 bg-red-600 text-white text-[9px] w-4 h-4 rounded-full flex items-center justify-center font-bold">{totalNotifications}</span>}
        </button>
      </nav>
    </div>
  );
}
