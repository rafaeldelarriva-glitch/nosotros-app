import React, { useState, useEffect } from 'react';
import { 
  Users, MapPin, DollarSign, Plus, CheckCircle, 
  Clock, Camera, Navigation, ArrowRight, Trash2, Shield, Calendar, Sparkles, User, Lock, Mail, Bell, Search, Check, X, UserPlus, Inbox, ArrowLeft, Image as ImageIcon, Utensils, Beer, PartyPopper, Compass, Flag, ThumbsUp, Trophy, Receipt, AlertCircle
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
  const [passwordError, setPasswordError] = useState('');

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

  // Búsqueda dinámica de usuarios
  const [friendSearchInput, setFriendSearchInput] = useState('');
  const [registeredUsers, setRegisteredUsers] = useState([]);

  // Sitios, GPS y Mapas
  const [newSpotName, setNewSpotName] = useState('');
  const [isGettingLocation, setIsGettingLocation] = useState(false);
  const [mapSuggestions, setMapSuggestions] = useState([]);
  const [isSearchingMaps, setIsSearchingMaps] = useState(false);

  // Gastos, Tickets y Ubicación del Gasto
  const [expenseDesc, setExpenseDesc] = useState('');
  const [expenseAmount, setExpenseAmount] = useState('');
  const [expenseSpotId, setExpenseSpotId] = useState('');
  const [expenseReceiptUrl, setExpenseReceiptUrl] = useState('');
  const [isUploadingReceipt, setIsUploadingReceipt] = useState(false);

  const [events, setEvents] = useState([]);

  useEffect(() => {
    if (currentUser) {
      fetchAppData();
      fetchRegisteredUsers();
    }
  }, [currentUser]);

  useEffect(() => {
    const timer = setTimeout(async () => {
      if (newSpotName.trim().length > 2) {
        setIsSearchingMaps(true);
        try {
          const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(newSpotName)}&limit=5`);
          const data = await res.json();
          setMapSuggestions(data || []);
        } catch (err) {
          console.error('Error buscando lugares:', err);
          setMapSuggestions([]);
        } finally {
          setIsSearchingMaps(false);
        }
      } else {
        setMapSuggestions([]);
      }
    }, 400);

    return () => clearTimeout(timer);
  }, [newSpotName]);

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

  const validateStrongPassword = (pwd) => {
    const minLength = pwd.length >= 8;
    const hasUpperCase = /[A-Z]/.test(pwd);
    const hasNumber = /\d/.test(pwd);
    const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(pwd);

    if (!minLength) return 'Debe tener al menos 8 caracteres.';
    if (!hasUpperCase) return 'Debe incluir al menos una letra mayúscula.';
    if (!hasNumber) return 'Debe incluir al menos un número.';
    if (!hasSpecialChar) return 'Debe incluir al menos un carácter especial (ej. !, @, #, $).';
    return '';
  };

  const handleAuth = async (e) => {
    e.preventDefault();
    if (!email || !password) return;

    if (authMode === 'register') {
      const errorMsg = validateStrongPassword(password);
      if (errorMsg) {
        setPasswordError(errorMsg);
        return;
      }
      setPasswordError('');

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
      setPasswordError('');
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
          creator_name: currentUser.name,
          status: 'active'
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
      category: 'bar',
      votes: 1,
      suggested_by: currentUser.name,
      active_now: false
    }]);

    setNewSpotName('');
    setMapSuggestions([]);
    fetchAppData();
  };

  const handleSelectSuggestion = async (displayName) => {
    setNewSpotName(displayName);
    setMapSuggestions([]);
  };

  const handleAddCurrentLocation = () => {
    if (!navigator.geolocation) {
      alert('Tu navegador no soporta geolocalización GPS.');
      return;
    }

    setIsGettingLocation(true);
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const lat = position.coords.latitude;
        const lon = position.coords.longitude;
        const spotName = `📍 Ubicación GPS (${lat.toFixed(4)}, ${lon.toFixed(4)})`;

        await supabase.from('spots').insert([{
          event_id: activeEvent.id,
          name: spotName,
          category: 'gps',
          votes: 1,
          suggested_by: currentUser.name,
          active_now: true
        }]);

        setIsGettingLocation(false);
        fetchAppData();
      },
      (error) => {
        console.error('Error obteniendo GPS:', error);
        alert('No se pudo obtener tu ubicación GPS.');
        setIsGettingLocation(false);
      },
      { enableHighAccuracy: true }
    );
  };

  const handleVoteSpot = async (spotId, currentVotes) => {
    await supabase.from('spots').update({ votes: currentVotes + 1 }).eq('id', spotId);
    fetchAppData();
  };

  const handleConfirmSpot = async (spotId) => {
    await supabase.from('spots').update({ active_now: false }).eq('event_id', activeEvent.id);
    await supabase.from('spots').update({ active_now: true }).eq('id', spotId);
    fetchAppData();
  };

  const handleDeleteSpot = async (spotId) => {
    if (!confirm('¿Seguro que quieres eliminar este sitio propuesto?')) return;
    const { error } = await supabase.from('spots').delete().eq('id', spotId);
    if (error) {
      alert('Error al eliminar el sitio: ' + error.message);
    } else {
      fetchAppData();
    }
  };

  const handleReceiptUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setIsUploadingReceipt(true);
    const reader = new FileReader();
    reader.onloadend = () => {
      setExpenseReceiptUrl(reader.result);
      setIsUploadingReceipt(false);
    };
    reader.readAsDataURL(file);
  };

  const handleAddExpense = async (e) => {
    e.preventDefault();
    if (!expenseDesc.trim() || !expenseAmount || !activeEvent) return;

    await supabase.from('expenses').insert([{
      event_id: activeEvent.id,
      description: expenseDesc,
      amount: parseFloat(expenseAmount),
      paid_by: currentUser.name,
      spot_id: expenseSpotId || null,
      receipt_url: expenseReceiptUrl || null
    }]);

    setExpenseDesc('');
    setExpenseAmount('');
    setExpenseSpotId('');
    setExpenseReceiptUrl('');
    fetchAppData();
  };

  const handlePhotoUploadWithGPS = (e) => {
    const file = e.target.files[0];
    if (!file || !activeEvent) return;

    const reader = new FileReader();
    reader.onloadend = () => {
      const base64Image = reader.result;

      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          async (pos) => {
            const lat = pos.coords.latitude.toFixed(3);
            const lon = pos.coords.longitude.toFixed(3);
            await savePhotoToSupabase(base64Image, `GPS: ${lat}, ${lon}`);
          },
          async () => {
            await savePhotoToSupabase(base64Image, 'Ubicación actual');
          },
          { enableHighAccuracy: true }
        );
      } else {
        savePhotoToSupabase(base64Image, 'Ubicación actual');
      }
    };
    reader.readAsDataURL(file);
  };

  const savePhotoToSupabase = async (url, locationLabel) => {
    await supabase.from('photos').insert([{
      event_id: activeEvent.id,
      url: url,
      user_name: `${currentUser.name} (${locationLabel})`
    }]);
    fetchAppData();
  };

  const handleCloseEvent = async () => {
    if (!confirm('¿Estás seguro de cerrar esta salida? Pasará al modo línea temporal resumen.')) return;

    const { error } = await supabase
      .from('events')
      .update({ status: 'closed' })
      .eq('id', activeEvent.id);

    if (error) {
      alert('Error al cerrar la salida: ' + error.message);
    } else {
      fetchAppData();
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

  const calculateDebts = (members = [], expenses = []) => {
    if (members.length === 0) return [];
    const totalSpent = expenses.reduce((sum, exp) => sum + Number(exp.amount), 0);
    const sharePerPerson = totalSpent / members.length;

    const paidMap = {};
    members.forEach(m => { paidMap[m] = 0; });
    expenses.forEach(exp => {
      if (paidMap[exp.paid_by] !== undefined) {
        paidMap[exp.paid_by] += Number(exp.amount);
      } else {
        paidMap[exp.paid_by] = Number(exp.amount);
      }
    });

    const balances = [];
    const allNames = Array.from(new Set([...members, ...Object.keys(paidMap)]));
    
    allNames.forEach(name => {
      const paid = paidMap[name] || 0;
      const shouldPay = members.includes(name) ? sharePerPerson : 0;
      const balance = paid - shouldPay;
      balances.push({ name, balance });
    });

    let debtors = balances.filter(b => b.balance < -0.01).map(d => ({ ...d, balance: Math.abs(d.balance) }));
    let creditors = balances.filter(b => b.balance > 0.01);

    const transactions = [];
    let dIndex = 0;
    let cIndex = 0;

    while (dIndex < debtors.length && cIndex < creditors.length) {
      const debtor = debtors[dIndex];
      const creditor = creditors[cIndex];
      const amountToTransfer = Math.min(debtor.balance, creditor.balance);

      if (amountToTransfer > 0.01) {
        transactions.push({ from: debtor.name, to: creditor.name, amount: amountToTransfer });
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
      <main className="min-h-screen bg-gradient-to-br from-slate-900 via-indigo-950 to-purple-950 flex flex-col items-center justify-center p-4 text-slate-100 relative overflow-hidden">
        <div className="absolute top-10 left-1/2 -translate-x-1/2 w-96 h-96 bg-indigo-600/20 rounded-full blur-3xl pointer-events-none" aria-hidden="true"></div>

        <div className="max-w-md w-full bg-slate-900/80 backdrop-blur-2xl p-8 rounded-[2.5rem] shadow-2xl border border-white/10 relative z-10 space-y-6">
          <div className="text-center space-y-3">
            <div className="relative w-20 h-20 mx-auto flex items-center justify-center">
              <div className="absolute inset-0 bg-gradient-to-tr from-indigo-500 to-purple-600 rounded-3xl rotate-6 shadow-lg shadow-indigo-500/30 animate-pulse"></div>
              <div className="absolute inset-0 bg-slate-900 rounded-3xl flex items-center justify-center border border-white/20">
                <Compass className="w-10 h-10 text-indigo-400 animate-spin-slow" />
              </div>
            </div>
            
            <div>
              <h1 className="text-3xl font-black tracking-tight bg-gradient-to-r from-white via-indigo-200 to-indigo-400 bg-clip-text text-transparent">
                Nosotros
              </h1>
              <p className="text-xs font-bold uppercase tracking-widest text-indigo-300 mt-1">El Punto de Encuentro</p>
            </div>
          </div>

          <div className="flex bg-slate-800/80 p-1.5 rounded-2xl border border-white/10" role="tablist">
            <button 
              role="tab"
              aria-selected={authMode === 'login'}
              onClick={() => { setAuthMode('login'); setPasswordError(''); }}
              className={`flex-1 py-3 text-xs font-bold rounded-xl transition-all focus:outline-none ${authMode === 'login' ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30' : 'text-slate-400 hover:text-white'}`}
            >
              Iniciar Sesión
            </button>
            <button 
              role="tab"
              aria-selected={authMode === 'register'}
              onClick={() => { setAuthMode('register'); setPasswordError(''); }}
              className={`flex-1 py-3 text-xs font-bold rounded-xl transition-all focus:outline-none ${authMode === 'register' ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30' : 'text-slate-400 hover:text-white'}`}
            >
              Crear Cuenta
            </button>
          </div>

          <form onSubmit={handleAuth} className="space-y-4">
            {authMode === 'register' && (
              <div className="space-y-1">
                <label htmlFor="reg-name" className="block text-xs font-bold text-slate-300 ml-1">Nombre Completo</label>
                <div className="relative flex items-center">
                  <User className="absolute left-3.5 text-slate-400" size={18} />
                  <input 
                    id="reg-name"
                    type="text" 
                    placeholder="Tu nombre en el grupo" 
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full bg-slate-800/80 border border-slate-700 rounded-2xl pl-10 pr-4 py-3 text-sm focus:outline-none focus:border-indigo-500 focus:bg-slate-800 text-white transition-all shadow-inner"
                    required
                  />
                </div>
              </div>
            )}

            <div className="space-y-1">
              <label htmlFor="auth-email" className="block text-xs font-bold text-slate-300 ml-1">Correo Electrónico</label>
              <div className="relative flex items-center">
                <Mail className="absolute left-3.5 text-slate-400" size={18} />
                <input 
                  id="auth-email"
                  type="email" 
                  placeholder="correo@ejemplo.com" 
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-slate-800/80 border border-slate-700 rounded-2xl pl-10 pr-4 py-3 text-sm focus:outline-none focus:border-indigo-500 focus:bg-slate-800 text-white transition-all shadow-inner"
                  required
                />
              </div>
            </div>

            <div className="space-y-1">
              <label htmlFor="auth-password" className="block text-xs font-bold text-slate-300 ml-1">Contraseña</label>
              <div className="relative flex items-center">
                <Lock className="absolute left-3.5 text-slate-400" size={18} />
                <input 
                  id="auth-password"
                  type="password" 
                  placeholder="••••••••" 
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-slate-800/80 border border-slate-700 rounded-2xl pl-10 pr-4 py-3 text-sm focus:outline-none focus:border-indigo-500 focus:bg-slate-800 text-white transition-all shadow-inner"
                  required
                />
              </div>
              {authMode === 'register' && (
                <p className="text-[10px] text-slate-400 ml-1 mt-1">
                  Mínimo 8 caracteres, 1 mayúscula, 1 número y 1 símbolo.
                </p>
              )}
              {passwordError && (
                <div className="flex items-center space-x-1 text-red-400 text-[11px] font-bold mt-1 ml-1 bg-red-950/50 p-2 rounded-xl border border-red-900/50">
                  <AlertCircle size={14} className="shrink-0" />
                  <span>{passwordError}</span>
                </div>
              )}
            </div>

            <button 
              type="submit" 
              className="w-full bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white font-bold py-3.5 rounded-2xl text-sm transition shadow-lg shadow-indigo-500/25 active:scale-[0.98] focus:outline-none focus:ring-2 focus:ring-indigo-500 mt-2"
            >
              {authMode === 'login' ? 'Entrar a mi cuenta' : 'Registrarme'}
            </button>
          </form>
        </div>
      </main>
    );
  }

  // -------------------------------------------------------------
  // DETALLE DE UN EVENTO ACTIVO O LÍNEA TEMPORAL
  // -------------------------------------------------------------
  if (activeEvent) {
    const totalSpent = (activeEvent.expenses || []).reduce((acc, c) => acc + Number(c.amount), 0);
    const perPerson = activeEvent.members.length > 0 ? (totalSpent / activeEvent.members.length) : 0;
    const currentActiveSpot = (activeEvent.spots || []).find(s => s.active_now);
    const coverImage = getPlanCover(activeEvent.title);
    const calculatedDebts = calculateDebts(activeEvent.members, activeEvent.expenses);
    const isCreator = activeEvent.creator_name === currentUser.name;
    const isClosed = activeEvent.status === 'closed';

    const maxVotes = Math.max(0, ...(activeEvent.spots || []).map(s => s.votes || 0));

    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950 text-slate-100 pb-28 relative overflow-hidden">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-lg h-60 bg-indigo-600/15 rounded-b-full blur-3xl pointer-events-none" aria-hidden="true"></div>

        <div className="relative h-44 w-full bg-slate-900">
          <img src={coverImage} alt="" className="w-full h-full object-cover opacity-50" aria-hidden="true" />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/40 to-transparent"></div>
          
          <button 
            onClick={() => setActiveEvent(null)} 
            aria-label="Volver a mis salidas"
            className="absolute top-4 left-4 flex items-center text-xs font-bold text-white bg-slate-900/80 backdrop-blur-md px-3.5 py-2 rounded-full hover:bg-slate-800 transition shadow-lg border border-white/10"
          >
            <ArrowLeft size={16} className="mr-1 text-indigo-400" /> Volver
          </button>
          
          <div className="absolute bottom-4 left-4 right-4 text-white">
            <div className="flex items-center space-x-2 mb-1">
              <span className="text-[10px] font-bold uppercase tracking-wider bg-indigo-500/30 text-indigo-300 backdrop-blur-md px-2.5 py-0.5 rounded-full border border-indigo-500/30">
                📅 {activeEvent.date}
              </span>
              {isClosed && (
                <span className="text-[10px] font-black uppercase tracking-wider bg-amber-500 text-white px-2.5 py-0.5 rounded-full shadow">
                  🔒 Quedada Cerrada
                </span>
              )}
            </div>
            <h1 className="text-2xl font-black leading-tight drop-shadow-sm">{activeEvent.title}</h1>
            <p className="text-xs text-slate-400 mt-0.5">Organiza: <span className="font-semibold text-white">{activeEvent.creator_name}</span></p>
          </div>
        </div>

        <main className="max-w-md mx-auto p-4 space-y-5 relative z-10">
          
          {isCreator && !isClosed && (
            <button 
              onClick={handleCloseEvent}
              className="w-full bg-gradient-to-r from-amber-600 to-orange-600 text-white font-bold py-3 px-4 rounded-2xl text-xs shadow-lg shadow-amber-600/25 flex items-center justify-center space-x-2 transition hover:opacity-95 border border-amber-500/30"
            >
              <Flag size={16} /> <span>Cerrar Salida y Generar Línea Temporal</span>
            </button>
          )}

          {isClosed ? (
            <div className="space-y-6">
              <div className="bg-slate-900/80 backdrop-blur-2xl p-6 rounded-[2.5rem] border border-white/10 shadow-2xl space-y-4">
                <div className="text-center space-y-1">
                  <span className="text-2xl">🏆</span>
                  <h2 className="text-lg font-black text-white">Resumen de la Salida</h2>
                  <p className="text-xs text-slate-400">Línea temporal de la ruta, paradas y gastos</p>
                </div>

                <div className="border-l-2 border-indigo-500 pl-4 space-y-8 ml-2 pt-2">
                  {(activeEvent.spots || []).map((spot, idx) => {
                    const spotExpenses = (activeEvent.expenses || []).filter(e => e.spot_id === spot.id);
                    const spotSpent = spotExpenses.reduce((sum, exp) => sum + Number(exp.amount), 0);

                    return (
                      <div key={spot.id} className="relative space-y-3">
                        <div className="absolute -left-[21px] top-1 w-3 h-3 bg-indigo-500 rounded-full border-2 border-slate-900 shadow-glow"></div>
                        <div>
                          <span className="text-[10px] font-bold text-indigo-400 uppercase">Parada {idx + 1}</span>
                          <h3 className="font-bold text-sm text-white">{spot.name}</h3>
                          <p className="text-[11px] text-slate-400">Propuesto por {spot.suggested_by} • {spot.votes} votos</p>
                        </div>

                        {spotExpenses.length > 0 && (
                          <div className="bg-slate-800/80 p-3 rounded-2xl border border-white/10 space-y-2">
                            <div className="flex justify-between items-center text-xs font-bold text-slate-300">
                              <span>🧾 Gastos en este sitio:</span>
                              <span className="text-emerald-400">{spotSpent.toFixed(2)}€</span>
                            </div>
                            <div className="space-y-1.5">
                              {spotExpenses.map(exp => (
                                <div key={exp.id} className="flex justify-between items-center text-xs bg-slate-900/80 p-2.5 rounded-xl border border-white/5">
                                  <div>
                                    <span className="font-bold text-white">{exp.description}</span>
                                    <span className="text-[10px] text-slate-400 ml-1.5">({exp.paid_by})</span>
                                  </div>
                                  <div className="flex items-center space-x-2">
                                    <span className="font-bold text-emerald-400">{Number(exp.amount).toFixed(2)}€</span>
                                    {exp.receipt_url && (
                                      <a href={exp.receipt_url} target="_blank" rel="noreferrer" className="text-indigo-400 hover:text-indigo-300" title="Ver ticket">
                                        <Receipt size={14} />
                                      </a>
                                    )}
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="bg-slate-900/80 backdrop-blur-2xl p-6 rounded-[2.5rem] border border-white/10 shadow-2xl space-y-3">
                <h3 className="text-xs font-black uppercase tracking-wider text-slate-300">📸 Álbum de Fotos del Recuerdo</h3>
                {(activeEvent.photos || []).length === 0 ? (
                  <p className="text-xs text-slate-400">No se subieron fotos en este plan.</p>
                ) : (
                  <div className="grid grid-cols-3 gap-2">
                    {(activeEvent.photos || []).map((photo) => (
                      <div key={photo.id} className="relative group aspect-square rounded-2xl overflow-hidden border border-white/10 shadow-md bg-slate-800">
                        <img src={photo.url} alt="" className="w-full h-full object-cover group-hover:scale-105 transition" />
                        <span className="absolute bottom-1 left-1 right-1 bg-black/70 backdrop-blur-xs text-white text-[9px] font-bold px-1.5 py-0.5 rounded truncate text-center">
                          {photo.user_name}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ) : (
            <>
              <div className="bg-slate-900/80 backdrop-blur-2xl p-4 rounded-3xl border border-white/10 shadow-xl space-y-2.5">
                <span className="text-xs font-black uppercase tracking-wider text-slate-300 flex items-center">
                  <Users size={14} className="mr-1.5 text-indigo-400" /> Asistentes Confirmados ({activeEvent.members.length})
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {activeEvent.members.map((member) => (
                    <span key={member} className="text-xs font-bold bg-indigo-950/80 text-indigo-300 px-3 py-1.5 rounded-xl border border-indigo-500/20 flex items-center">
                      👤 {member}
                    </span>
                  ))}
                </div>
              </div>

              <div className="bg-gradient-to-br from-indigo-600 to-purple-700 text-white p-5 rounded-3xl shadow-xl relative overflow-hidden border border-white/10">
                <span className="text-[10px] font-black uppercase tracking-wider bg-white/20 px-2.5 py-1 rounded-full">📍 Sitio Confirmado Oficial</span>
                <h2 className="text-xl font-black mt-2 mb-1">{currentActiveSpot ? currentActiveSpot.name : 'Votando sitio entre el grupo...'}</h2>
                {currentActiveSpot && (
                  <a 
                    href={`https://maps.google.com/?q=${encodeURIComponent(currentActiveSpot.name)}`} 
                    target="_blank" 
                    rel="noreferrer" 
                    className="mt-3 inline-flex items-center space-x-2 bg-white text-indigo-900 font-bold text-xs px-4 py-2.5 rounded-xl shadow transition hover:bg-slate-100"
                  >
                    <Navigation size={14} /> <span>Abrir en Google Maps</span>
                  </a>
                )}
              </div>

              <div className="flex bg-slate-900/80 backdrop-blur-xl p-1 rounded-2xl border border-white/10 shadow-xl" role="tablist">
                <button onClick={() => setEventSubTab('spots')} role="tab" aria-selected={eventSubTab === 'spots'} className={`flex-1 py-2.5 text-xs font-bold rounded-xl transition ${eventSubTab === 'spots' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-400 hover:text-white'}`}>Votaciones y Sitios</button>
                <button onClick={() => setEventSubTab('expenses')} role="tab" aria-selected={eventSubTab === 'expenses'} className={`flex-1 py-2.5 text-xs font-bold rounded-xl transition ${eventSubTab === 'expenses' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-400 hover:text-white'}`}>Gastos y Deudas</button>
                <button onClick={() => setEventSubTab('gallery')} role="tab" aria-selected={eventSubTab === 'gallery'} className={`flex-1 py-2.5 text-xs font-bold rounded-xl transition ${eventSubTab === 'gallery' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-400 hover:text-white'}`}>Fotos</button>
              </div>

              {eventSubTab === 'spots' && (
                <div className="space-y-4">
                  <div className="bg-slate-900/80 backdrop-blur-2xl p-4 rounded-3xl border border-white/10 shadow-xl space-y-3 relative">
                    <h3 className="text-xs font-black text-white">Proponer nuevo sitio</h3>
                    
                    <button 
                      type="button"
                      onClick={handleAddCurrentLocation}
                      disabled={isGettingLocation}
                      className="w-full bg-gradient-to-r from-emerald-600 to-teal-600 text-white font-bold py-3 px-4 rounded-2xl text-xs shadow-lg hover:opacity-95 flex items-center justify-center space-x-2 transition border border-emerald-500/30"
                    >
                      <Compass size={16} className={isGettingLocation ? "animate-spin" : ""} />
                      <span>{isGettingLocation ? 'Obteniendo GPS...' : '📍 Marcar mi ubicación GPS actual'}</span>
                    </button>

                    <div className="relative pt-1">
                      <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-white/10"></div></div>
                      <div className="relative flex justify-center text-[10px] uppercase"><span className="bg-slate-900 px-2 text-slate-400 font-bold">o busca en el mapa</span></div>
                    </div>

                    <form onSubmit={handleAddSpot} className="space-y-2.5 relative">
                      <div className="relative flex items-center">
                        <Search className="absolute left-3.5 text-slate-400" size={16} />
                        <input 
                          type="text" 
                          placeholder="Escribe bar, restaurante, calle..." 
                          value={newSpotName} 
                          onChange={(e) => setNewSpotName(e.target.value)} 
                          className="w-full bg-slate-800/80 border border-slate-700 rounded-2xl pl-10 pr-4 py-2.5 text-xs text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 shadow-inner" 
                        />
                        {isSearchingMaps && (
                          <div className="absolute right-3.5 text-xs text-indigo-400 animate-pulse font-bold">Buscando...</div>
                        )}
                      </div>

                      {mapSuggestions.length > 0 && (
                        <div className="absolute left-0 right-0 top-full mt-1 bg-slate-900 border border-white/10 rounded-2xl shadow-2xl z-50 overflow-hidden max-h-56 overflow-y-auto">
                          {mapSuggestions.map((place) => (
                            <button
                              key={place.place_id}
                              type="button"
                              onClick={() => handleSelectSuggestion(place.display_name)}
                              className="w-full text-left px-4 py-2.5 text-xs text-slate-200 hover:bg-indigo-950 hover:text-indigo-300 border-b border-white/5 last:border-b-0 transition flex items-center space-x-2"
                            >
                              <MapPin size={14} className="text-indigo-400 shrink-0" />
                              <span className="truncate">{place.display_name}</span>
                            </button>
                          ))}
                        </div>
                      )}

                      <button type="submit" className="w-full bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-2xl py-2.5 shadow-lg shadow-indigo-600/25 transition mt-2">
                        🔍 Añadir propuesta
                      </button>
                    </form>
                  </div>

                  <div className="space-y-2.5">
                    <h4 className="text-xs font-bold text-slate-300 px-1">Votación de Sitios Propuestos</h4>
                    {(activeEvent.spots || []).length === 0 ? (
                      <p className="text-xs text-slate-400 px-1">Ningún lugar propuesto todavía.</p>
                    ) : (
                      (activeEvent.spots || []).map((spot) => {
                        const isMajority = maxVotes > 0 && spot.votes === maxVotes;
                        const isConfirmed = spot.active_now;

                        return (
                          <div key={spot.id} className={`p-4 rounded-3xl border flex flex-col space-y-3 backdrop-blur-xl ${isConfirmed ? 'bg-indigo-950/60 border-indigo-500/50 shadow-xl' : isMajority ? 'bg-amber-950/40 border-amber-500/40' : 'bg-slate-900/80 border-white/10 shadow-xl'}`}>
                            <div className="flex justify-between items-start">
                              <div className="pr-2">
                                <div className="flex items-center space-x-2 flex-wrap gap-y-1">
                                  <h3 className="font-bold text-white text-sm">{spot.name}</h3>
                                  {isMajority && !isConfirmed && (
                                    <span className="bg-amber-500 text-white text-[10px] font-black px-2 py-0.5 rounded-full flex items-center space-x-1 shadow-xs">
                                      <Trophy size={10} className="mr-0.5" /> Mayoría
                                    </span>
                                  )}
                                  {isConfirmed && (
                                    <span className="bg-indigo-600 text-white text-[10px] font-black px-2 py-0.5 rounded-full shadow-xs">
                                      ✓ Sitio Confirmado
                                    </span>
                                  )}
                                </div>
                                <p className="text-[11px] text-slate-400 font-medium mt-0.5">
                                  Propuesto por <span className="font-bold text-indigo-400">{spot.suggested_by}</span> • <span className="font-extrabold text-white">{spot.votes} votos</span>
                                </p>
                              </div>

                              {isCreator && (
                                <button 
                                  onClick={() => handleDeleteSpot(spot.id)}
                                  title="Eliminar sitio propuesto"
                                  className="p-2 text-slate-400 hover:text-red-400 hover:bg-red-950/50 rounded-xl transition shrink-0"
                                >
                                  <Trash2 size={16} />
                                </button>
                              )}
                            </div>

                            <div className="flex gap-2 pt-1 border-t border-white/10">
                              <button 
                                onClick={() => handleVoteSpot(spot.id, spot.votes)} 
                                className="bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold px-3 py-2 rounded-xl flex items-center space-x-1.5 transition border border-white/5"
                              >
                                <ThumbsUp size={14} className="text-indigo-400" />
                                <span>Votar ({spot.votes})</span>
                              </button>

                              {!isConfirmed ? (
                                <button 
                                  onClick={() => handleConfirmSpot(spot.id)} 
                                  className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs py-2 rounded-xl transition shadow-md shadow-indigo-600/25"
                                >
                                  ✓ Confirmar este Sitio
                                </button>
                              ) : (
                                <a 
                                  href={`https://maps.google.com/?q=${encodeURIComponent(spot.name)}`} 
                                  target="_blank" 
                                  rel="noreferrer" 
                                  className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white text-center font-bold text-xs py-2 rounded-xl flex items-center justify-center space-x-1 transition shadow-md shadow-emerald-600/25"
                                >
                                  <Navigation size={14} />
                                  <span>Abrir Maps</span>
                                </a>
                              )}
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>
              )}

              {eventSubTab === 'expenses' && (
                <div className="space-y-5">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="bg-slate-900/80 backdrop-blur-2xl p-4 rounded-3xl border border-white/10 shadow-xl"><p className="text-[10px] font-bold text-slate-400">TOTAL GRUPO</p><p className="text-xl font-black text-emerald-400">{totalSpent.toFixed(2)}€</p></div>
                    <div className="bg-slate-900/80 backdrop-blur-2xl p-4 rounded-3xl border border-white/10 shadow-xl"><p className="text-[10px] font-bold text-slate-400">POR PERSONA</p><p className="text-xl font-black text-indigo-400">{perPerson.toFixed(2)}€</p></div>
                  </div>

                  <div className="bg-gradient-to-br from-slate-900 to-indigo-950 text-white p-5 rounded-3xl shadow-xl space-y-3 border border-white/10">
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
                            <span className="font-black text-emerald-400 text-sm bg-emerald-950/80 px-3 py-1 rounded-xl border border-emerald-500/30">
                              {debt.amount.toFixed(2)}€
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  <form onSubmit={handleAddExpense} className="bg-slate-900/80 backdrop-blur-2xl p-4 rounded-3xl border border-white/10 shadow-xl space-y-3">
                    <h4 className="text-xs font-bold text-white">Añadir nuevo gasto vinculado a un sitio</h4>
                    
                    <input 
                      type="text" 
                      aria-label="Concepto" 
                      placeholder="Concepto (ej. Cervezas, Comida...)" 
                      value={expenseDesc} 
                      onChange={(e) => setExpenseDesc(e.target.value)} 
                      className="w-full bg-slate-800/80 border border-slate-700 rounded-2xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 shadow-inner" 
                      required
                    />

                    <input 
                      type="number" 
                      step="0.01" 
                      aria-label="Importe" 
                      placeholder="Importe (€)" 
                      value={expenseAmount} 
                      onChange={(e) => setExpenseAmount(e.target.value)} 
                      className="w-full bg-slate-800/80 border border-slate-700 rounded-2xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 shadow-inner" 
                      required
                    />

                    <div className="space-y-1">
                      <label className="block text-[11px] font-bold text-slate-300">Ubicación / Sitio del Gasto</label>
                      <select 
                        value={expenseSpotId} 
                        onChange={(e) => setExpenseSpotId(e.target.value)}
                        className="w-full bg-slate-800/80 border border-slate-700 rounded-2xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 shadow-inner"
                      >
                        <option value="">Selecciona un sitio del plan...</option>
                        {(activeEvent.spots || []).map((spot) => (
                          <option key={spot.id} value={spot.id} className="bg-slate-900">{spot.name}</option>
                        ))}
                      </select>
                    </div>

                    <div className="space-y-1.5">
                      <label className="block text-[11px] font-bold text-slate-300">Foto del Ticket (Opcional)</label>
                      <label className="flex items-center justify-center space-x-2 border-2 border-dashed border-slate-700 bg-slate-800/50 rounded-2xl p-3 cursor-pointer hover:bg-slate-800 transition">
                        <Receipt size={16} className="text-indigo-400" />
                        <span className="text-xs font-bold text-slate-200">
                          {isUploadingReceipt ? 'Cargando...' : expenseReceiptUrl ? '✓ Ticket adjuntado correctamente' : 'Subir foto del ticket'}
                        </span>
                        <input type="file" accept="image/*" onChange={handleReceiptUpload} className="hidden" />
                      </label>
                      {expenseReceiptUrl && (
                        <div className="w-16 h-16 rounded-xl overflow-hidden border border-white/10 mt-1">
                          <img src={expenseReceiptUrl} alt="Vista previa ticket" className="w-full h-full object-cover" />
                        </div>
                      )}
                    </div>

                    <button type="submit" className="w-full bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-2xl py-2.5 shadow-lg shadow-emerald-600/25 transition mt-1">
                      Añadir Gasto al Sitio
                    </button>
                  </form>

                  <div className="space-y-2">
                    <h4 className="text-xs font-bold text-slate-300 px-1">Historial de Gastos</h4>
                    {(activeEvent.expenses || []).length === 0 ? (
                      <p className="text-xs text-slate-400 px-1">No hay gastos registrados todavía.</p>
                    ) : (
                      (activeEvent.expenses || []).map((exp) => {
                        const spotObj = (activeEvent.spots || []).find(s => s.id === exp.spot_id);
                        return (
                          <div key={exp.id} className="bg-slate-900/80 backdrop-blur-2xl p-3.5 rounded-2xl border border-white/10 flex justify-between items-center text-xs shadow-xl">
                            <div>
                              <p className="font-bold text-white">{exp.description}</p>
                              <p className="text-[10px] text-slate-400">
                                Pagado por <span className="font-bold text-indigo-400">{exp.paid_by}</span>
                                {spotObj && <span className="ml-1 text-slate-300">• 📍 {spotObj.name}</span>}
                              </p>
                            </div>
                            <div className="flex items-center space-x-2">
                              <span className="font-black text-emerald-400 text-sm">{Number(exp.amount).toFixed(2)}€</span>
                              {exp.receipt_url && (
                                <a href={exp.receipt_url} target="_blank" rel="noreferrer" className="w-7 h-7 bg-indigo-950 hover:bg-indigo-900 rounded-xl flex items-center justify-center text-indigo-300 transition border border-indigo-500/30" title="Ver ticket">
                                  <Receipt size={14} />
                                </a>
                              )}
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>
              )}

              {eventSubTab === 'gallery' && (
                <div className="space-y-4">
                  <label className="flex flex-col items-center justify-center border-2 border-dashed border-indigo-500/40 bg-indigo-950/40 backdrop-blur-xl rounded-3xl p-6 cursor-pointer hover:bg-indigo-950/60 transition shadow-xl">
                    <Camera className="w-6 h-6 text-indigo-400 mb-1" />
                    <span className="text-xs font-bold text-indigo-200">Tomar / Subir foto con GPS actual</span>
                    <span className="text-[10px] text-slate-400 mt-0.5">Se guardará con la ubicación exacta en miniatura</span>
                    <input type="file" accept="image/*" capture="environment" onChange={handlePhotoUploadWithGPS} className="hidden" />
                  </label>

                  <div className="grid grid-cols-2 gap-3">
                    {(activeEvent.photos || []).map((photo) => (
                      <div key={photo.id} className="bg-slate-900 border border-white/10 rounded-2xl overflow-hidden shadow-xl flex flex-col">
                        <div className="aspect-square w-full bg-slate-800">
                          <img src={photo.url} alt="" className="w-full h-full object-cover" />
                        </div>
                        <p className="p-2 text-[10px] text-slate-300 text-center font-bold truncate">{photo.user_name}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </main>
      </div>
    );
  }

  const filteredEvents = events.filter(e => e.title.toLowerCase().includes(searchQuery.toLowerCase()) || e.creator_name.toLowerCase().includes(searchQuery.toLowerCase()));
  const myEvents = events.filter(e => e.members.includes(currentUser.name));

  // -------------------------------------------------------------
  // ÁREA PERSONAL (DASHBOARD)
  // -------------------------------------------------------------
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950 text-slate-100 pb-28 relative overflow-hidden">
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-lg h-72 bg-indigo-600/15 rounded-b-full blur-3xl pointer-events-none" aria-hidden="true"></div>

      <header className="bg-slate-900/80 backdrop-blur-2xl border-b border-white/10 p-4 sticky top-0 z-40 flex justify-between items-center shadow-xl">
        <div className="flex items-center space-x-2">
          <div className="w-9 h-9 bg-gradient-to-tr from-indigo-500 to-purple-600 rounded-2xl flex items-center justify-center text-white font-black text-sm shadow-lg shadow-indigo-500/30" aria-hidden="true">N</div>
          <span className="font-extrabold text-white text-base tracking-tight">Nosotros</span>
        </div>
        <div className="flex items-center space-x-3">
          <span className="text-xs font-bold text-slate-300">Hola, {currentUser.name}</span>
          <button onClick={() => setCurrentUser(null)} className="text-xs bg-slate-800 hover:bg-red-950/60 text-slate-300 hover:text-red-400 px-3 py-1.5 rounded-full font-bold transition border border-white/10">Salir</button>
        </div>
      </header>

      <main className="max-w-md mx-auto p-4 space-y-5 relative z-10">
        {activeTab === 'my-events' && (
          <div className="space-y-4">
            <button onClick={() => setShowCreateModal(true)} className="w-full bg-gradient-to-r from-indigo-500 to-purple-600 text-white font-bold py-3.5 px-4 rounded-2xl text-sm shadow-lg shadow-indigo-500/25 flex items-center justify-center space-x-2 transition hover:opacity-95">
              <Plus size={18} /> <span>Crear Nueva Salida / Plan</span>
            </button>

            <div className="space-y-3">
              <h2 className="text-base font-black text-white px-1">Tus Salidas Confirmadas ({myEvents.length})</h2>
              
              {myEvents.length === 0 ? (
                <div className="bg-slate-900/80 backdrop-blur-2xl p-6 rounded-[2.5rem] border border-white/10 text-center shadow-2xl">
                  <p className="text-xs text-slate-400 font-medium">No estás participando en ninguna salida aún.</p>
                </div>
              ) : (
                myEvents.map((event) => {
                  const cover = getPlanCover(event.title);
                  const isClosed = event.status === 'closed';
                  return (
                    <article 
                      key={event.id} 
                      onClick={() => setActiveEvent(event)} 
                      className="bg-slate-900/80 backdrop-blur-2xl rounded-[2.5rem] border border-white/10 overflow-hidden shadow-2xl hover:border-indigo-500/50 transition cursor-pointer group"
                    >
                      <div className="h-32 w-full relative bg-slate-800">
                        <img src={cover} alt="" className="w-full h-full object-cover opacity-60 group-hover:scale-105 transition duration-300" aria-hidden="true" />
                        <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-transparent to-transparent"></div>
                        <div className="absolute top-3 right-3 flex gap-1">
                          {isClosed && <span className="text-[10px] font-bold bg-amber-500 text-white px-2 py-0.5 rounded-full shadow">🔒 Cerrada</span>}
                          <span className="text-[10px] font-bold bg-slate-900/95 backdrop-blur-md text-white px-2.5 py-1 rounded-full shadow border border-white/10">📅 {event.date}</span>
                        </div>
                        <h3 className="absolute bottom-3 left-3 right-3 text-white font-black text-lg drop-shadow">{event.title}</h3>
                      </div>
                      
                      <div className="p-4 flex justify-between items-center">
                        <p className="text-xs text-slate-400 font-medium">Organiza: <span className="font-bold text-white">{event.creator_name}</span></p>
                        <span className="text-xs font-bold text-indigo-300 bg-indigo-950/80 px-3 py-1.5 rounded-xl border border-indigo-500/20 group-hover:bg-indigo-600 group-hover:text-white transition">
                          {isClosed ? 'Ver Timeline →' : 'Entrar →'}
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
            <input type="text" aria-label="Buscar salida" placeholder="Buscar por título o creador..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="w-full bg-slate-900/80 backdrop-blur-2xl border border-white/10 rounded-2xl px-4 py-3 text-sm text-white shadow-xl focus:outline-none focus:ring-2 focus:ring-indigo-500" />
            
            <div className="space-y-3">
              <h2 className="text-base font-black text-white px-1">Salidas Disponibles</h2>
              {filteredEvents.map((event) => {
                const isMember = event.members.includes(currentUser.name);
                const isPending = event.pendingInvitations.includes(currentUser.name);
                const hasRequested = event.pendingRequests.includes(currentUser.name);
                const cover = getPlanCover(event.title);

                return (
                  <article key={event.id} className="bg-slate-900/80 backdrop-blur-2xl rounded-[2.5rem] border border-white/10 overflow-hidden shadow-2xl flex flex-col">
                    <div className="h-24 w-full relative bg-slate-800">
                      <img src={cover} alt="" className="w-full h-full object-cover opacity-60" aria-hidden="true" />
                      <div className="absolute inset-0 bg-black/50"></div>
                      <h3 className="absolute bottom-2.5 left-3 text-white font-bold text-sm drop-shadow">{event.title}</h3>
                    </div>
                    
                    <div className="p-3.5 flex justify-between items-center">
                      <span className="text-xs text-slate-400 font-medium">{event.date} • {event.creator_name}</span>
                      {isMember ? (
                        <button onClick={() => setActiveEvent(event)} className="text-xs font-bold text-indigo-300 bg-indigo-950 px-3 py-1.5 rounded-xl border border-indigo-500/20">Ver Plan</button>
                      ) : hasRequested ? (
                        <span className="text-xs font-bold text-amber-300 bg-amber-950 px-3 py-1.5 rounded-xl border border-amber-500/20">Solicitado</span>
                      ) : isPending ? (
                        <span className="text-xs font-bold text-indigo-300 bg-indigo-950 px-3 py-1.5 rounded-xl border border-indigo-500/20">Invitado</span>
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
            <div className="bg-slate-900/80 backdrop-blur-2xl p-5 rounded-[2.5rem] border border-white/10 shadow-2xl space-y-3">
              <h2 className="text-base font-black text-white">Invitaciones Recibidas ({myInvitations.length})</h2>
              {myInvitations.length === 0 ? <p className="text-xs text-slate-400">Sin invitaciones pendientes.</p> : myInvitations.map((event) => (
                <div key={event.id} className="p-3.5 rounded-2xl border border-indigo-500/30 bg-indigo-950/60 flex justify-between items-center">
                  <p className="text-xs font-bold text-white">{event.title}</p>
                  <div className="flex gap-2">
                    <button onClick={() => handleAcceptInvitation(event.id)} aria-label="Aceptar" className="bg-emerald-600 text-white p-2 rounded-xl text-xs"><Check size={14} /></button>
                    <button onClick={() => handleRejectInvitation(event.id)} aria-label="Rechazar" className="bg-slate-800 text-slate-300 p-2 rounded-xl text-xs border border-white/10"><X size={14} /></button>
                  </div>
                </div>
              ))}
            </div>

            <div className="bg-slate-900/80 backdrop-blur-2xl p-5 rounded-[2.5rem] border border-white/10 shadow-2xl space-y-3">
              <h2 className="text-base font-black text-white">Solicitudes para tus Eventos</h2>
              {myApprovalRequests.length === 0 ? <p className="text-xs text-slate-400">Sin solicitudes pendientes.</p> : myApprovalRequests.map((event) => (
                <div key={event.id} className="space-y-2">
                  <p className="text-xs font-bold text-slate-300">{event.title}</p>
                  {event.pendingRequests.map((userName) => (
                    <div key={userName} className="p-3.5 rounded-2xl border border-purple-500/30 bg-purple-950/60 flex justify-between items-center">
                      <p className="text-xs font-bold text-white">{userName} quiere unirse</p>
                      <div className="flex gap-2">
                        <button onClick={() => handleApproveRequest(event.id, userName)} className="bg-purple-600 text-white px-3 py-1.5 rounded-xl text-xs font-bold">Aprobar</button>
                        <button onClick={() => handleRejectRequest(event.id, userName)} aria-label="Rechazar" className="bg-slate-800 text-slate-300 p-1.5 rounded-xl text-xs border border-white/10"><X size={14} /></button>
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
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 max-w-md w-full p-6 rounded-[2.5rem] shadow-2xl space-y-4 border border-white/10">
            <h2 className="font-black text-white text-lg">Organizar Nueva Salida</h2>
            <form onSubmit={handleCreateEvent} className="space-y-4">
              <div>
                <label htmlFor="plan-title" className="block text-xs font-bold text-slate-300 mb-1">Título del Plan</label>
                <input id="plan-title" type="text" placeholder="Ej. Cervecitas en el centro" value={newTitle} onChange={(e) => setNewTitle(e.target.value)} className="w-full bg-slate-800 border border-slate-700 rounded-2xl px-4 py-2.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-indigo-500" required />
              </div>
              <div>
                <label htmlFor="plan-date" className="block text-xs font-bold text-slate-300 mb-1">Fecha</label>
                <input id="plan-date" type="date" value={newDate} onChange={(e) => setNewDate(e.target.value)} className="w-full bg-slate-800 border border-slate-700 rounded-2xl px-4 py-2.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-indigo-500" required />
              </div>
              
              <div>
                <label htmlFor="friend-search" className="block text-xs font-bold text-slate-300 mb-1">Invitar Usuarios Registrados</label>
                <div className="relative mb-2">
                  <Search className="absolute left-3.5 top-2.5 text-slate-400" size={16} />
                  <input 
                    id="friend-search"
                    type="text" 
                    placeholder="Buscar por nombre o email..." 
                    value={friendSearchInput} 
                    onChange={(e) => setFriendSearchInput(e.target.value)} 
                    className="w-full bg-slate-800 border border-slate-700 rounded-2xl pl-9 pr-4 py-2 text-xs text-white focus:outline-none focus:ring-2 focus:ring-indigo-500" 
                  />
                </div>

                <div className="flex flex-wrap gap-2 max-h-36 overflow-y-auto p-1 bg-slate-800/50 rounded-2xl border border-white/5">
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
                          className={`text-xs px-3 py-1.5 rounded-xl font-bold border transition flex items-center space-x-1 ${isSelected ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-slate-800 text-slate-300 border-slate-700 hover:border-indigo-500'}`}
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
                <button type="button" onClick={() => setShowCreateModal(false)} className="w-1/2 bg-slate-800 text-slate-300 font-bold py-2.5 rounded-2xl text-xs hover:bg-slate-700 transition border border-white/10">Cancelar</button>
                <button type="submit" className="w-1/2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2.5 rounded-2xl text-xs shadow-lg shadow-indigo-600/25 transition">Crear Plan</button>
              </div>
            </form>
          </div>
        </div>
      )}

      <nav className="fixed bottom-3 left-4 right-4 bg-slate-900/90 backdrop-blur-2xl border border-white/10 py-3 px-6 flex justify-around items-center z-40 rounded-[2rem] shadow-2xl max-w-md mx-auto" aria-label="Navegación principal">
        <button onClick={() => setActiveTab('my-events')} className={`flex flex-col items-center ${activeTab === 'my-events' ? 'text-indigo-400 font-bold' : 'text-slate-400 hover:text-white'}`}>
          <Calendar size={20} />
          <span className="text-[10px] mt-0.5">Mis Salidas</span>
        </button>
        <button onClick={() => setActiveTab('search')} className={`flex flex-col items-center ${activeTab === 'search' ? 'text-indigo-400 font-bold' : 'text-slate-400 hover:text-white'}`}>
          <Search size={20} />
          <span className="text-[10px] mt-0.5">Buscar</span>
        </button>
        <button onClick={() => setActiveTab('notifications')} className={`flex flex-col items-center relative ${activeTab === 'notifications' ? 'text-indigo-400 font-bold' : 'text-slate-400 hover:text-white'}`}>
          <Inbox size={20} />
          <span className="text-[10px] mt-0.5">Aprobaciones</span>
          {totalNotifications > 0 && <span className="absolute -top-1 -right-1 bg-red-600 text-white text-[9px] w-4 h-4 rounded-full flex items-center justify-center font-bold shadow-lg">{totalNotifications}</span>}
        </button>
      </nav>
    </div>
  );
}
