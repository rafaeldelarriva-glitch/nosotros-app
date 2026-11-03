import React, { useState, useEffect } from 'react';
import { 
  Users, MapPin, DollarSign, Plus, CheckCircle, 
  Clock, Camera, Navigation, ArrowRight, Trash2, Shield, Calendar, Sparkles, User, Lock, Mail, Bell, Search, Check, X, UserPlus, Inbox, ArrowLeft, Image as ImageIcon, Utensils, Beer, PartyPopper, Compass, Flag, ThumbsUp, Trophy, Receipt, AlertCircle, ChevronRight, MessageSquare, Send, Map, CheckSquare, ListPlus, UserMinus, ShieldAlert, KeyRound, Archive
} from 'lucide-react';
import { supabase } from './supabaseClient';

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

  // Búsqueda dinámica de usuarios y perfiles
  const [friendSearchInput, setFriendSearchInput] = useState('');
  const [registeredUsers, setRegisteredUsers] = useState([]);
  const [passwordRequests, setPasswordRequests] = useState([]);

  // Sitios, GPS y Mapas
  const [newSpotName, setNewSpotName] = useState('');
  const [isGettingLocation, setIsGettingLocation] = useState(false);
  const [showGpsModal, setShowGpsModal] = useState(false);
  const [gpsCustomName, setGpsCustomName] = useState('');
  const [tempCoords, setTempCoords] = useState(null);

  const [mapSuggestions, setMapSuggestions] = useState([]);
  const [isSearchingMaps, setIsSearchingMaps] = useState(false);

  // Gastos, Tickets y Participantes del Gasto
  const [expenseDesc, setExpenseDesc] = useState('');
  const [expenseAmount, setExpenseAmount] = useState('');
  const [expenseSpotId, setExpenseSpotId] = useState('');
  const [expenseReceiptUrl, setExpenseReceiptUrl] = useState('');
  const [isUploadingReceipt, setIsUploadingReceipt] = useState(false);
  const [expenseParticipants, setExpenseParticipants] = useState([]);

  // Fotos y Ubicación de la Foto
  const [photoSpotId, setPhotoSpotId] = useState('');
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);

  // Comentarios (General y por Ubicación)
  const [generalCommentInput, setGeneralCommentInput] = useState('');
  const [spotCommentInputs, setSpotCommentInputs] = useState({});

  // Línea temporal interactiva
  const [expandedTimelineSpotId, setExpandedTimelineSpotId] = useState(null);

  // Modal para ver tickets grandes
  const [viewingReceiptUrl, setViewingReceiptUrl] = useState(null);

  // Modal de Recuperación de Contraseña
  const [showResetModal, setShowResetModal] = useState(false);
  const [resetEmailInput, setResetEmailInput] = useState('');
  const [resetNewPasswordInput, setResetNewPasswordInput] = useState('');

  const [events, setEvents] = useState([]);

  useEffect(() => {
    if (currentUser) {
      fetchAppData();
      fetchRegisteredUsers();
      fetchPasswordRequests();
    }
  }, [currentUser]);

  useEffect(() => {
    if (activeEvent && Array.isArray(activeEvent.members)) {
      setExpenseParticipants(activeEvent.members);
    }
  }, [activeEvent]);

  useEffect(() => {
    const timer = setTimeout(async () => {
      if (newSpotName.trim().length > 2) {
        setIsSearchingMaps(true);
        try {
          const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(newSpotName + ' Cádiz España')}&limit=5`);
          const data = await res.json();
          setMapSuggestions(Array.isArray(data) ? data : []);
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
      const { data, error } = await supabase.from('profiles').select('id, name, email, role, is_blocked');
      if (error) throw error;
      setRegisteredUsers(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Error cargando perfiles:', err.message);
    }
  };

  const fetchPasswordRequests = async () => {
    try {
      const { data, error } = await supabase.from('password_requests').select('*').eq('status', 'pending');
      if (error) {
        setPasswordRequests([]);
        return;
      }
      setPasswordRequests(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Error cargando solicitudes de clave:', err);
    }
  };

  const fetchAppData = async () => {
    try {
      const { data: eventsData, error } = await supabase
        .from('events')
        .select(`
          *,
          spots(*),
          expenses(*),
          photos(*),
          comments(*),
          event_members(*)
        `);

      if (error) throw error;

      const formattedEvents = (Array.isArray(eventsData) ? eventsData : []).map(ev => {
        const rawMembers = Array.isArray(ev.event_members) ? ev.event_members : [];
        return {
          ...ev,
          status: ev.status || 'active',
          members: rawMembers.filter(m => m.status === 'member').map(m => m.user_name),
          pendingInvitations: rawMembers.filter(m => m.status === 'pending_invite').map(m => m.user_name),
          pendingRequests: rawMembers.filter(m => m.status === 'pending_request').map(m => m.user_name),
          spots: Array.isArray(ev.spots) ? ev.spots : [],
          expenses: Array.isArray(ev.expenses) ? ev.expenses : [],
          photos: Array.isArray(ev.photos) ? ev.photos : [],
          comments: Array.isArray(ev.comments) ? ev.comments : []
        };
      });

      formattedEvents.sort((a, b) => new Date(b.date) - new Date(a.date));
      setEvents(formattedEvents);

      if (activeEvent) {
        const updatedActive = formattedEvents.find(e => e.id === activeEvent.id);
        if (updatedActive) {
          setActiveEvent(updatedActive);
        }
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
        await supabase.from('profiles').insert([{ 
          id: data.user.id, 
          name: userDisplayName, 
          email, 
          role: 'user', 
          is_blocked: false 
        }]);
        setCurrentUser({ id: data.user.id, name: userDisplayName, email, role: 'user' });
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
        if (profile && profile.is_blocked) {
          alert('Tu cuenta ha sido bloqueada por el administrador.');
          await supabase.auth.signOut();
          return;
        }
        const userDisplayName = profile ? profile.name : email.split('@')[0];
        const userRole = profile ? profile.role : 'user';
        setCurrentUser({ id: data.user.id, name: userDisplayName, email, role: userRole });
      }
    }
  };

  const handleRequestPasswordChange = async (e) => {
    e.preventDefault();
    if (!resetEmailInput || !resetNewPasswordInput) {
      alert('Por favor, completa todos los campos.');
      return;
    }

    const errorMsg = validateStrongPassword(resetNewPasswordInput);
    if (errorMsg) {
      alert('Contraseña no válida: ' + errorMsg);
      return;
    }

    try {
      const { error } = await supabase.from('password_requests').insert([{
        email: resetEmailInput.toLowerCase().trim(),
        new_password: resetNewPasswordInput,
        status: 'pending'
      }]);

      if (error) throw error;

      alert('✅ Solicitud enviada correctamente al administrador.');
      setShowResetModal(false);
      setResetEmailInput('');
      setResetNewPasswordInput('');
    } catch (err) {
      alert('Error al enviar la solicitud: ' + err.message);
    }
  };

  const handleApprovePasswordRequest = async (reqId, targetEmail, requestedPassword) => {
    if (!confirm(`¿Aprobar el cambio de contraseña para ${targetEmail}?`)) return;

    try {
      const { error } = await supabase.from('password_requests').update({ status: 'approved' }).eq('id', reqId);
      if (error) throw error;

      alert(`✅ Solicitud aprobada para ${targetEmail}.\n\n⚠️ RECUERDA: Ve a Supabase > Authentication > Users, pulsa en "Update user" para ${targetEmail} y asígnale la clave "${requestedPassword}".`);
      fetchPasswordRequests();
    } catch (err) {
      alert('Error al aprobar la solicitud: ' + err.message);
    }
  };

  const handleRejectPasswordRequest = async (reqId) => {
    try {
      const { error } = await supabase.from('password_requests').update({ status: 'rejected' }).eq('id', reqId);
      if (error) throw error;
      fetchPasswordRequests();
    } catch (err) {
      alert('Error al rechazar: ' + err.message);
    }
  };

  const toggleExpenseParticipant = (memberName) => {
    if (Array.isArray(expenseParticipants) && expenseParticipants.includes(memberName)) {
      setExpenseParticipants(expenseParticipants.filter(m => m !== memberName));
    } else {
      setExpenseParticipants([...(Array.isArray(expenseParticipants) ? expenseParticipants : []), memberName]);
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

      if (Array.isArray(selectedFriends) && selectedFriends.length > 0) {
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
      alert('Error al crear el evento: ' + err.message);
    }
  };

  const handleRemoveMember = async (memberName) => {
    if (!confirm(`¿Estás seguro de que ${memberName === currentUser.name ? 'quieres salir' : 'quieres eliminar a ' + memberName} del plan?`)) return;

    const { error } = await supabase
      .from('event_members')
      .delete()
      .eq('event_id', activeEvent.id)
      .eq('user_name', memberName);

    if (error) {
      alert('Error al quitar al asistente: ' + error.message);
    } else {
      if (memberName === currentUser.name) {
        setActiveEvent(null);
      }
      fetchAppData();
    }
  };

  const handleAddSpot = async (e, customName = null) => {
    if (e) e.preventDefault();
    const targetName = customName || newSpotName;
    if (!targetName.trim() || !activeEvent) return;

    const formattedSpotName = targetName.toLowerCase().includes('valdelagrana') || targetName.toLowerCase().includes('el puerto') 
      ? targetName.trim() 
      : `${targetName.trim()}, Valdelagrana, El Puerto de Santa María`;

    const { error } = await supabase.from('spots').insert([{
      event_id: activeEvent.id,
      name: formattedSpotName,
      category: 'bar',
      votes: 1,
      suggested_by: currentUser.name,
      active_now: false
    }]);

    if (error) {
      alert('Error al añadir sitio: ' + error.message);
      return;
    }

    setNewSpotName('');
    setMapSuggestions([]);
    fetchAppData();
  };

  const handleStartGpsCapture = () => {
    if (!navigator.geolocation) {
      alert('Tu navegador no soporta geolocalización GPS.');
      return;
    }

    setIsGettingLocation(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setTempCoords({
          lat: position.coords.latitude,
          lon: position.coords.longitude
        });
        setIsGettingLocation(false);
        setShowGpsModal(true);
      },
      () => {
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

  const handleToggleSelectSpot = async (spotId, currentSelectedState) => {
    await supabase.from('spots').update({ active_now: !currentSelectedState }).eq('id', spotId);
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

    if (!Array.isArray(expenseParticipants) || expenseParticipants.length === 0) {
      alert('Debes seleccionar al menos un participante para este gasto.');
      return;
    }

    try {
      const { error } = await supabase.from('expenses').insert([{
        event_id: activeEvent.id,
        description: expenseDesc.trim(),
        amount: parseFloat(expenseAmount),
        paid_by: currentUser.name,
        spot_id: expenseSpotId || null,
        receipt_url: expenseReceiptUrl || null,
        participants: expenseParticipants
      }]);

      if (error) throw error;

      setExpenseDesc('');
      setExpenseAmount('');
      setExpenseSpotId('');
      setExpenseReceiptUrl('');
      setExpenseParticipants(Array.isArray(activeEvent.members) ? activeEvent.members : []);
      await fetchAppData();
    } catch (err) {
      console.error('Error al guardar gasto:', err.message);
      alert('Error al guardar el gasto: ' + err.message);
    }
  };

  const handlePhotoUploadWithGPS = (e) => {
    const file = e.target.files[0];
    if (!file || !activeEvent) return;

    if (!photoSpotId) {
      alert('Por favor, selecciona primero el sitio o ubicación donde se ha tomado la foto.');
      return;
    }

    setIsUploadingPhoto(true);
    const reader = new FileReader();
    reader.onloadend = async () => {
      const base64Image = reader.result;
      await savePhotoToSupabase(base64Image, photoSpotId);
      setIsUploadingPhoto(false);
    };
    reader.readAsDataURL(file);
  };

  const savePhotoToSupabase = async (url, spotId) => {
    const { error } = await supabase.from('photos').insert([{
      event_id: activeEvent.id,
      url: url,
      user_name: currentUser.name,
      spot_id: spotId
    }]);

    if (error) {
      alert('Error al guardar la foto: ' + error.message);
    } else {
      setPhotoSpotId('');
      fetchAppData();
    }
  };

  const handleAddSpotComment = async (spotId) => {
    const text = spotCommentInputs[spotId];
    if (!text || !text.trim() || !activeEvent) return;

    const { error } = await supabase.from('comments').insert([{
      event_id: activeEvent.id,
      spot_id: spotId,
      user_name: currentUser.name,
      content: text.trim()
    }]);

    if (error) {
      alert('Error al enviar reseña: ' + error.message);
      return;
    }

    setSpotCommentInputs({ ...spotCommentInputs, [spotId]: '' });
    await fetchAppData();
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
    try {
      const { error } = await supabase.from('event_members').update({ status: 'member' }).eq('event_id', eventId).eq('user_name', userName);
      if (error) throw error;
      fetchAppData();
    } catch (err) {
      alert('Error al aprobar solicitud: ' + err.message);
    }
  };

  const handleRejectRequest = async (eventId, userName) => {
    try {
      const { error } = await supabase.from('event_members').delete().eq('event_id', eventId).eq('user_name', userName);
      if (error) throw error;
      fetchAppData();
    } catch (err) {
      alert('Error al rechazar solicitud: ' + err.message);
    }
  };

  const handleAcceptInvitation = async (eventId) => {
    try {
      const { error } = await supabase.from('event_members').update({ status: 'member' }).eq('event_id', eventId).eq('user_name', currentUser.name);
      if (error) throw error;
      fetchAppData();
    } catch (err) {
      alert('Error al aceptar invitación: ' + err.message);
    }
  };

  const handleRejectInvitation = async (eventId) => {
    try {
      const { error } = await supabase.from('event_members').delete().eq('event_id', eventId).eq('user_name', currentUser.name);
      if (error) throw error;
      fetchAppData();
    } catch (err) {
      alert('Error al rechazar invitación: ' + err.message);
    }
  };

  const myInvitations = Array.isArray(events) ? events.filter(e => Array.isArray(e.pendingInvitations) && e.pendingInvitations.includes(currentUser?.name)) : [];
  const myApprovalRequests = Array.isArray(events) ? events.filter(e => e.creator_name === currentUser?.name && Array.isArray(e.pendingRequests) && e.pendingRequests.length > 0) : [];
  
  const isAdmin = currentUser?.role === 'admin' || currentUser?.email === 'rafa@ejemplo.com';
  const totalNotifications = myInvitations.length + myApprovalRequests.reduce((acc, curr) => acc + (Array.isArray(curr.pendingRequests) ? curr.pendingRequests.length : 0), 0) + (isAdmin && Array.isArray(passwordRequests) ? passwordRequests.length : 0);

  const calculateDebts = (members = [], expenses = []) => {
    const validMembers = Array.isArray(members) ? members : [];
    const validExpenses = Array.isArray(expenses) ? expenses : [];

    if (validMembers.length === 0) return [];

    const balancesMap = {};
    validMembers.forEach(m => { balancesMap[m] = 0; });

    validExpenses.forEach(exp => {
      const amount = Number(exp.amount) || 0;
      const payer = exp.paid_by;
      
      if (!balancesMap[payer]) balancesMap[payer] = 0;
      balancesMap[payer] += amount;

      let participants = (Array.isArray(exp.participants) && exp.participants.length > 0) ? exp.participants : validMembers;
      if (participants.length === 0) participants = [...validMembers];

      const share = amount / participants.length;
      participants.forEach(p => {
        if (balancesMap[p] !== undefined) {
          balancesMap[p] -= share;
        } else {
          balancesMap[p] = -share;
        }
      });
    });

    const balances = Object.keys(balancesMap).map(name => ({
      name,
      balance: balancesMap[name]
    }));

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

  const renderSpotCard = (spot, isSelected, maxVotes) => {
    const isMajority = maxVotes > 0 && spot.votes === maxVotes;
    const spotComments = Array.isArray(activeEvent?.comments) ? activeEvent.comments.filter(c => c.spot_id === spot.id) : [];
    const currentInputText = spotCommentInputs[spot.id] || '';
    const canDeleteSpot = Array.isArray(activeEvent?.members) && activeEvent.members.includes(currentUser?.name);

    return (
      <div key={spot.id} className={`p-4 rounded-3xl border flex flex-col space-y-3 backdrop-blur-xl ${isSelected ? 'bg-sky-50/90 border-sky-300 shadow-sm' : isMajority ? 'bg-amber-50/60 border-amber-300' : 'bg-white/90 border-sky-100 shadow-sm'}`}>
        <div className="flex justify-between items-start">
          <div className="pr-2">
            <div className="flex items-center space-x-2 flex-wrap gap-y-1">
              <h3 className="font-bold text-slate-800 text-sm">{spot.name}</h3>
              {isSelected && (
                <span className="bg-sky-600 text-white text-[10px] font-black px-2 py-0.5 rounded-full shadow-xs">
                  ✓ En la Ruta
                </span>
              )}
              {isMajority && !isSelected && (
                <span className="bg-amber-500 text-white text-[10px] font-black px-2 py-0.5 rounded-full flex items-center space-x-1 shadow-xs">
                  <Trophy size={10} className="mr-0.5" /> Más votado
                </span>
              )}
            </div>
            <p className="text-[11px] text-slate-500 font-medium mt-0.5">
              Propuesto por <span className="font-bold text-sky-600">{spot.suggested_by}</span> • <span className="font-extrabold text-slate-800">{spot.votes} votos</span>
            </p>
          </div>

          {canDeleteSpot && (
            <button 
              onClick={() => handleDeleteSpot(spot.id)}
              title="Eliminar sitio propuesto"
              className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition shrink-0"
            >
              <Trash2 size={16} />
            </button>
          )}
        </div>

        <div className="flex gap-2 pt-1 border-t border-sky-100">
          <button 
            onClick={() => handleVoteSpot(spot.id, spot.votes)} 
            className="bg-sky-50 hover:bg-sky-100 text-slate-700 text-xs font-bold px-3 py-2 rounded-xl flex items-center space-x-1.5 transition border border-sky-200"
          >
            <ThumbsUp size={14} className="text-sky-600" />
            <span>Votar ({spot.votes})</span>
          </button>

          <button 
            onClick={() => handleToggleSelectSpot(spot.id, isSelected)} 
            className={`flex-1 font-bold text-xs py-2 rounded-xl transition shadow-sm ${isSelected ? 'bg-slate-200 hover:bg-slate-300 text-slate-700' : 'bg-sky-600 hover:bg-sky-700 text-white'}`}
          >
            {isSelected ? 'Quitar de la Ruta' : '✓ Añadir a la Ruta'}
          </button>

          <a 
            href={`https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(spot.name)}`} 
            target="_blank" 
            rel="noreferrer" 
            className="bg-emerald-600 hover:bg-emerald-700 text-white px-3 py-2 rounded-xl flex items-center justify-center transition shadow-sm"
          >
            <Navigation size={14} />
          </a>
        </div>

        <div className="pt-2 border-t border-sky-100 space-y-2">
          <div className="flex items-center space-x-1 text-[11px] font-bold text-slate-700">
            <MessageSquare size={12} className="text-sky-600" />
            <span>Reseñas y Recomendaciones ({spotComments.length})</span>
          </div>

          {spotComments.length > 0 && (
            <div className="space-y-1.5 max-h-28 overflow-y-auto pr-1">
              {spotComments.map(c => (
                <div key={c.id} className="bg-white p-2 rounded-xl border border-sky-100 text-xs space-y-0.5">
                  <p className="text-slate-800">{c.content}</p>
                  <p className="text-[10px] font-bold text-sky-600">— {c.user_name}</p>
                </div>
              ))}
            </div>
          )}

          <div className="flex gap-1.5 pt-1">
            <input 
              type="text" 
              placeholder="Ej. Recomiendo el plato X..." 
              value={currentInputText}
              onChange={(e) => setSpotCommentInputs({ ...spotCommentInputs, [spot.id]: e.target.value })}
              className="flex-1 bg-sky-50/50 border border-sky-200 rounded-xl px-3 py-1.5 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-sky-500 shadow-inner"
            />
            <button 
              type="button"
              onClick={() => handleAddSpotComment(spot.id)}
              className="bg-sky-600 hover:bg-sky-700 text-white px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center justify-center"
            >
              <Send size={12} />
            </button>
          </div>
        </div>
      </div>
    );
  };

  if (!currentUser) {
    return (
      <main className="min-h-screen bg-gradient-to-br from-sky-50 via-blue-50 to-indigo-100 flex flex-col items-center justify-center p-4 text-slate-800 relative overflow-hidden">
        <div className="absolute top-10 left-1/2 -translate-x-1/2 w-96 h-96 bg-sky-300/30 rounded-full blur-3xl pointer-events-none"></div>

        <div className="max-w-md w-full bg-white/90 backdrop-blur-2xl p-8 rounded-[2.5rem] shadow-xl border border-sky-100 relative z-10 space-y-6">
          <div className="text-center space-y-3">
            <div className="relative w-20 h-20 mx-auto flex items-center justify-center">
              <div className="absolute inset-0 bg-gradient-to-tr from-sky-400 to-indigo-500 rounded-3xl rotate-6 shadow-lg shadow-sky-400/30 animate-pulse"></div>
              <div className="absolute inset-0 bg-white rounded-3xl flex items-center justify-center border border-sky-200">
                <Compass className="w-10 h-10 text-sky-600 animate-spin-slow" />
              </div>
            </div>
            
            <div>
              <h1 className="text-3xl font-black tracking-tight bg-gradient-to-r from-sky-700 via-indigo-600 to-blue-700 bg-clip-text text-transparent">
                Nosotros
              </h1>
              <p className="text-xs font-bold uppercase tracking-widest text-sky-600 mt-1">El Punto de Encuentro</p>
            </div>
          </div>

          <div className="flex bg-sky-50 p-1.5 rounded-2xl border border-sky-100" role="tablist">
            <button 
              role="tab"
              aria-selected={authMode === 'login'}
              onClick={() => { setAuthMode('login'); setPasswordError(''); }}
              className={`flex-1 py-3 text-xs font-bold rounded-xl transition-all ${authMode === 'login' ? 'bg-sky-600 text-white shadow-md' : 'text-slate-600'}`}
            >
              Iniciar Sesión
            </button>
            <button 
              role="tab"
              aria-selected={authMode === 'register'}
              onClick={() => { setAuthMode('register'); setPasswordError(''); }}
              className={`flex-1 py-3 text-xs font-bold rounded-xl transition-all ${authMode === 'register' ? 'bg-sky-600 text-white shadow-md' : 'text-slate-600'}`}
            >
              Crear Cuenta
            </button>
          </div>

          <form onSubmit={handleAuth} className="space-y-4">
            {authMode === 'register' && (
              <div className="space-y-1">
                <label className="block text-xs font-bold text-slate-700 ml-1">Nombre Completo</label>
                <div className="relative flex items-center">
                  <User className="absolute left-3.5 text-slate-400" size={18} />
                  <input 
                    type="text" 
                    placeholder="Tu nombre en el grupo" 
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full bg-sky-50/50 border border-sky-200 rounded-2xl pl-10 pr-4 py-3 text-sm focus:outline-none focus:border-sky-500 text-slate-800 shadow-inner"
                    required
                  />
                </div>
              </div>
            )}

            <div className="space-y-1">
              <label className="block text-xs font-bold text-slate-700 ml-1">Correo Electrónico</label>
              <div className="relative flex items-center">
                <Mail className="absolute left-3.5 text-slate-400" size={18} />
                <input 
                  type="email" 
                  placeholder="correo@ejemplo.com" 
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-sky-50/50 border border-sky-200 rounded-2xl pl-10 pr-4 py-3 text-sm focus:outline-none focus:border-sky-500 text-slate-800 shadow-inner"
                  required
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="block text-xs font-bold text-slate-700 ml-1">Contraseña</label>
              <div className="relative flex items-center">
                <Lock className="absolute left-3.5 text-slate-400" size={18} />
                <input 
                  type="password" 
                  placeholder="••••••••" 
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-sky-50/50 border border-sky-200 rounded-2xl pl-10 pr-4 py-3 text-sm focus:outline-none focus:border-sky-500 text-slate-800 shadow-inner"
                  required
                />
              </div>
              {passwordError && (
                <div className="flex items-center space-x-1 text-red-600 text-[11px] font-bold mt-1 ml-1 bg-red-50 p-2 rounded-xl border border-red-200">
                  <AlertCircle size={14} className="shrink-0" />
                  <span>{passwordError}</span>
                </div>
              )}
            </div>

            <button 
              type="submit" 
              className="w-full bg-gradient-to-r from-sky-600 to-indigo-600 hover:from-sky-700 hover:to-indigo-700 text-white font-bold py-3.5 rounded-2xl text-sm transition shadow-lg mt-2"
            >
              {authMode === 'login' ? 'Entrar a mi cuenta' : 'Registrarme'}
            </button>

            {authMode === 'login' && (
              <div className="text-center pt-2">
                <button 
                  type="button"
                  onClick={() => setShowResetModal(true)}
                  className="text-xs font-bold text-sky-600 hover:underline"
                >
                  ¿Has olvidado tu contraseña?
                </button>
              </div>
            )}
          </form>
        </div>

        {showResetModal && (
          <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white max-w-sm w-full p-6 rounded-[2.5rem] shadow-2xl space-y-4 border border-sky-100">
              <div className="text-center space-y-1">
                <KeyRound className="w-8 h-8 text-sky-600 mx-auto" />
                <h3 className="font-black text-slate-800 text-base">Solicitar Cambio de Contraseña</h3>
                <p className="text-xs text-slate-500">Envía tu propuesta de nueva contraseña al administrador</p>
              </div>

              <form onSubmit={handleRequestPasswordChange} className="space-y-3">
                <input 
                  type="email" 
                  placeholder="Tu correo electrónico..." 
                  value={resetEmailInput} 
                  onChange={(e) => setResetEmailInput(e.target.value)} 
                  className="w-full bg-sky-50/50 border border-sky-200 rounded-2xl px-4 py-3 text-xs text-slate-800 focus:outline-none"
                  required
                />
                <input 
                  type="password" 
                  placeholder="Nueva contraseña deseada..." 
                  value={resetNewPasswordInput} 
                  onChange={(e) => setResetNewPasswordInput(e.target.value)} 
                  className="w-full bg-sky-50/50 border border-sky-200 rounded-2xl px-4 py-3 text-xs text-slate-800 focus:outline-none"
                  required
                />
                <div className="flex gap-2 pt-1">
                  <button 
                    type="button" 
                    onClick={() => setShowResetModal(false)}
                    className="w-1/2 bg-sky-50 text-slate-700 font-bold py-2.5 rounded-2xl text-xs hover:bg-sky-100 border border-sky-200"
                  >
                    Cancelar
                  </button>
                  <button 
                    type="submit" 
                    className="w-1/2 bg-sky-600 hover:bg-sky-700 text-white font-bold py-2.5 rounded-2xl text-xs shadow"
                  >
                    Enviar al Admin
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </main>
    );
  }

  if (activeEvent) {
    const validExpenses = Array.isArray(activeEvent.expenses) ? activeEvent.expenses : [];
    const validMembers = Array.isArray(activeEvent.members) ? activeEvent.members : [];
    const validSpots = Array.isArray(activeEvent.spots) ? activeEvent.spots : [];
    const validPhotos = Array.isArray(activeEvent.photos) ? activeEvent.photos : [];
    const validComments = Array.isArray(activeEvent.comments) ? activeEvent.comments : [];

    const totalSpent = validExpenses.reduce((acc, c) => acc + Number(c.amount), 0);
    const perPerson = validMembers.length > 0 ? (totalSpent / validMembers.length) : 0;
    
    const selectedSpots = validSpots.filter(s => s.active_now);
    const pendingSpots = validSpots.filter(s => !s.active_now);

    const calculatedDebts = calculateDebts(validMembers, validExpenses);
    const isCreator = activeEvent.creator_name === currentUser.name;
    const isClosed = activeEvent.status === 'closed';

    const maxVotes = Math.max(0, ...validSpots.map(s => s.votes || 0));

    return (
      <div className="min-h-screen bg-gradient-to-br from-sky-50 via-blue-50 to-indigo-100 text-slate-800 pb-28 relative overflow-hidden">
        <div className="fixed top-3 left-4 z-50">
          <button 
            onClick={() => setActiveEvent(null)} 
            className="flex items-center text-xs font-bold text-slate-800 bg-white/95 backdrop-blur-md px-3.5 py-2 rounded-full hover:bg-white transition shadow-lg border border-sky-200"
          >
            <ArrowLeft size={16} className="mr-1 text-sky-600" /> Volver
          </button>
        </div>

        <div className="relative h-14 w-full bg-gradient-to-r from-sky-100 via-blue-100 to-indigo-50 border-b border-sky-200 flex items-end px-4 pb-2 shadow-xs">
          <div className="w-full flex justify-between items-end">
            <div>
              <h1 className="text-sm font-black text-slate-800 truncate max-w-[210px]">{activeEvent.title}</h1>
              <span className="text-[10px] text-slate-500">📅 {activeEvent.date}</span>
            </div>
            <div className="flex items-center space-x-2">
              {isClosed && <span className="text-[9px] font-bold bg-amber-500 text-white px-2 py-0.5 rounded-full shadow">🔒 Cerrada</span>}
              <span className="text-[10px] font-bold text-sky-800 bg-white/80 px-2.5 py-0.5 rounded-full border border-sky-200">
                Org: {activeEvent.creator_name}
              </span>
            </div>
          </div>
        </div>

        <main className="max-w-md mx-auto p-4 space-y-4 relative z-10">
          
          {isCreator && !isClosed && (
            <button 
              onClick={handleCloseEvent}
              className="w-full bg-gradient-to-r from-amber-600 to-orange-600 text-white font-bold py-3 px-4 rounded-2xl text-xs shadow-lg flex items-center justify-center space-x-2 border border-amber-500/30"
            >
              <Flag size={16} /> <span>Cerrar Salida y Generar Línea Temporal</span>
            </button>
          )}

          {isClosed ? (
            <div className="space-y-6">
              <div className="bg-white/90 backdrop-blur-2xl p-5 rounded-[2.5rem] border border-sky-100 shadow-xl space-y-4">
                <div className="text-center space-y-1">
                  <span className="text-2xl">⏳</span>
                  <h2 className="text-base font-black text-slate-800">Línea Temporal e Historial del Día</h2>
                  <p className="text-[11px] text-slate-500">Pulsa sobre cada parada para consultar sus gastos y fotos</p>
                </div>

                <div className="relative pl-6 space-y-6 before:absolute before:left-2 before:top-2 before:bottom-2 before:w-0.5 before:bg-gradient-to-b before:from-sky-500 before:via-indigo-500 before:to-sky-300">
                  {(selectedSpots.length > 0 ? selectedSpots : validSpots).map((spot, idx) => {
                    const spotExpenses = validExpenses.filter(e => e.spot_id === spot.id);
                    const spotSpent = spotExpenses.reduce((sum, exp) => sum + Number(exp.amount), 0);
                    const isExpanded = expandedTimelineSpotId === spot.id;

                    return (
                      <div key={spot.id} className="relative group">
                        <div className="absolute -left-6 top-3.5 w-4 h-4 bg-sky-600 rounded-full border-2 border-white flex items-center justify-center shadow-md"></div>

                        <div 
                          onClick={() => setExpandedTimelineSpotId(isExpanded ? null : spot.id)}
                          className={`p-4 rounded-3xl border transition cursor-pointer backdrop-blur-xl ${isExpanded ? 'bg-sky-50/90 border-sky-300 shadow-lg' : 'bg-white/90 border-sky-100'}`}
                        >
                          <div className="flex justify-between items-center">
                            <div className="space-y-0.5">
                              <span className="text-[10px] font-black uppercase tracking-wider text-sky-600 flex items-center">
                                <Clock size={12} className="mr-1" /> Parada {idx + 1}
                              </span>
                              <h3 className="font-bold text-sm text-slate-800">{spot.name}</h3>
                            </div>
                            <ChevronRight size={16} className={`transition-transform ${isExpanded ? 'rotate-90 text-sky-600' : ''}`} />
                          </div>

                          {isExpanded && (
                            <div className="mt-4 pt-4 border-t border-sky-200/60 space-y-4">
                              <div className="space-y-2">
                                <span className="text-xs font-bold text-slate-700 flex items-center">
                                  <Receipt size={14} className="mr-1 text-emerald-600" /> Gastos ({spotSpent.toFixed(2)}€)
                                </span>
                                {spotExpenses.map(exp => (
                                  <div key={exp.id} className="flex justify-between items-center text-xs bg-white p-2.5 rounded-2xl border border-sky-100">
                                    <span className="font-bold text-slate-800">{exp.description}</span>
                                    <div className="flex items-center space-x-2">
                                      <span className="font-bold text-emerald-700">{Number(exp.amount).toFixed(2)}€</span>
                                      {exp.receipt_url && (
                                        <button 
                                          type="button"
                                          onClick={(e) => { e.stopPropagation(); setViewingReceiptUrl(exp.receipt_url); }}
                                          className="p-1.5 bg-sky-50 hover:bg-sky-100 text-sky-700 rounded-xl border border-sky-200"
                                          title="Ver ticket"
                                        >
                                          <Receipt size={14} />
                                        </button>
                                      )}
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          ) : (
            <>
              <div className="bg-white/90 backdrop-blur-2xl p-4 rounded-3xl border border-sky-100 shadow-sm space-y-3">
                <span className="text-xs font-black uppercase tracking-wider text-slate-700 flex items-center">
                  <Users size={14} className="mr-1.5 text-sky-600" /> Asistentes Confirmados ({validMembers.length})
                </span>
                <div className="flex flex-wrap gap-2">
                  {validMembers.map((member) => {
                    const canRemove = isCreator || member === currentUser.name;
                    return (
                      <div key={member} className="text-xs font-bold bg-sky-50 text-sky-700 px-3 py-1.5 rounded-xl border border-sky-200 flex items-center space-x-2">
                        <span>👤 {member}</span>
                        {canRemove && (
                          <button 
                            type="button"
                            onClick={() => handleRemoveMember(member)}
                            className="text-slate-400 hover:text-red-600 transition"
                          >
                            <UserMinus size={13} />
                          </button>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="flex bg-white/90 backdrop-blur-xl p-1 rounded-2xl border border-sky-100 shadow-sm" role="tablist">
                <button onClick={() => setEventSubTab('spots')} role="tab" aria-selected={eventSubTab === 'spots'} className={`flex-1 py-2 text-xs font-bold rounded-xl transition ${eventSubTab === 'spots' ? 'bg-sky-600 text-white shadow-md' : 'text-slate-600'}`}>Sitios</button>
                <button onClick={() => setEventSubTab('expenses')} role="tab" aria-selected={eventSubTab === 'expenses'} className={`flex-1 py-2 text-xs font-bold rounded-xl transition ${eventSubTab === 'expenses' ? 'bg-sky-600 text-white shadow-md' : 'text-slate-600'}`}>Gastos</button>
                <button onClick={() => setEventSubTab('gallery')} role="tab" aria-selected={eventSubTab === 'gallery'} className={`flex-1 py-2 text-xs font-bold rounded-xl transition ${eventSubTab === 'gallery' ? 'bg-sky-600 text-white shadow-md' : 'text-slate-600'}`}>Fotos</button>
              </div>

              {eventSubTab === 'spots' && (
                <div className="space-y-4">
                  <div className="bg-white/90 backdrop-blur-2xl p-4 rounded-3xl border border-sky-100 shadow-sm space-y-3">
                    <h3 className="text-xs font-black text-slate-800">Proponer nuevo sitio</h3>
                    <button 
                      type="button"
                      onClick={handleStartGpsCapture}
                      disabled={isGettingLocation}
                      className="w-full bg-gradient-to-r from-emerald-600 to-teal-600 text-white font-bold py-2.5 px-4 rounded-2xl text-xs shadow flex items-center justify-center space-x-2"
                    >
                      <Compass size={16} />
                      <span>📍 Marcar mi ubicación GPS actual</span>
                    </button>

                    <form onSubmit={handleAddSpot} className="space-y-2.5">
                      <input 
                        type="text" 
                        placeholder="Ej. Bar Shiko..." 
                        value={newSpotName} 
                        onChange={(e) => setNewSpotName(e.target.value)} 
                        className="w-full bg-sky-50/50 border border-sky-200 rounded-2xl px-4 py-2.5 text-xs text-slate-800 focus:outline-none" 
                      />
                      <button type="submit" className="w-full bg-sky-600 hover:bg-sky-700 text-white text-xs font-bold rounded-2xl py-2.5 shadow">
                        🔍 Añadir a la ruta
                      </button>
                    </form>
                  </div>

                  <div className="space-y-3">
                    <h4 className="text-xs font-black uppercase text-sky-800">Sitios Seleccionados ({selectedSpots.length})</h4>
                    {selectedSpots.map((spot) => renderSpotCard(spot, true, maxVotes))}
                  </div>

                  <div className="space-y-3 pt-2">
                    <h4 className="text-xs font-black uppercase text-slate-700">Propuestas Pendientes ({pendingSpots.length})</h4>
                    {pendingSpots.map((spot) => renderSpotCard(spot, false, maxVotes))}
                  </div>
                </div>
              )}

              {eventSubTab === 'expenses' && (
                <div className="space-y-5">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="bg-white/90 backdrop-blur-2xl p-4 rounded-3xl border border-sky-100 shadow-sm"><p className="text-[10px] font-bold text-slate-500">TOTAL GRUPO</p><p className="text-xl font-black text-emerald-600">{totalSpent.toFixed(2)}€</p></div>
                    <div className="bg-white/90 backdrop-blur-2xl p-4 rounded-3xl border border-sky-100 shadow-sm"><p className="text-[10px] font-bold text-slate-500">POR PERSONA</p><p className="text-xl font-black text-sky-600">{perPerson.toFixed(2)}€</p></div>
                  </div>

                  <div className="bg-gradient-to-br from-slate-900 to-sky-950 text-white p-5 rounded-3xl shadow-lg space-y-3 border border-sky-400/20">
                    <h3 className="text-xs font-black uppercase tracking-wider text-sky-300 flex items-center">
                      <DollarSign size={16} className="mr-1 text-emerald-400" /> Reparto y Liquidación de Deudas (Real)
                    </h3>
                    
                    {calculatedDebts.length === 0 ? (
                      <p className="text-xs text-sky-200">¡Cuentas saldadas!</p>
                    ) : (
                      <div className="space-y-2">
                        {calculatedDebts.map((debt, index) => (
                          <div key={index} className="bg-white/10 backdrop-blur-md p-3 rounded-2xl border border-white/10 flex justify-between items-center text-xs">
                            <div>
                              <span className="font-bold text-white">{debt.from}</span>
                              <span className="text-sky-200 mx-1.5">debe pagar a</span>
                              <span className="font-bold text-emerald-300">{debt.to}</span>
                            </div>
                            <span className="font-black text-emerald-400 text-sm bg-emerald-950/80 px-3 py-1 rounded-xl">
                              {debt.amount.toFixed(2)}€
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  <form onSubmit={handleAddExpense} className="bg-white/90 backdrop-blur-2xl p-4 rounded-3xl border border-sky-100 shadow-sm space-y-3">
                    <h4 className="text-xs font-bold text-slate-800">Añadir nuevo gasto</h4>
                    
                    <input 
                      type="text" 
                      placeholder="Concepto (ej. Cervezas, Comida...)" 
                      value={expenseDesc} 
                      onChange={(e) => setExpenseDesc(e.target.value)} 
                      className="w-full bg-sky-50/50 border border-sky-200 rounded-2xl px-3.5 py-2.5 text-xs text-slate-800 focus:outline-none" 
                      required
                    />

                    <input 
                      type="number" 
                      step="0.01" 
                      placeholder="Importe (€)" 
                      value={expenseAmount} 
                      onChange={(e) => setExpenseAmount(e.target.value)} 
                      className="w-full bg-sky-50/50 border border-sky-200 rounded-2xl px-3.5 py-2.5 text-xs text-slate-800 focus:outline-none" 
                      required
                    />

                    <div className="space-y-1">
                      <label className="block text-[11px] font-bold text-slate-700">Ubicación / Sitio del Gasto</label>
                      <select 
                        value={expenseSpotId} 
                        onChange={(e) => setExpenseSpotId(e.target.value)}
                        className="w-full bg-sky-50/50 border border-sky-200 rounded-2xl px-3.5 py-2.5 text-xs text-slate-800 focus:outline-none"
                      >
                        <option value="">Selecciona un sitio del plan...</option>
                        {validSpots.map((spot) => (
                          <option key={spot.id} value={spot.id}>{spot.name}</option>
                        ))}
                      </select>
                    </div>

                    <div className="space-y-1.5 pt-1">
                      <label className="block text-[11px] font-bold text-slate-700">¿Quiénes participan en este gasto? (Desmarca a los ausentes)</label>
                      <div className="flex flex-wrap gap-1.5 bg-sky-50/50 p-2.5 rounded-2xl border border-sky-200">
                        {validMembers.map((member) => {
                          const isParticipant = Array.isArray(expenseParticipants) && expenseParticipants.includes(member);
                          return (
                            <button
                              key={member}
                              type="button"
                              onClick={() => toggleExpenseParticipant(member)}
                              className={`text-xs px-2.5 py-1.5 rounded-xl font-bold border transition flex items-center space-x-1 ${isParticipant ? 'bg-sky-600 text-white border-sky-600' : 'bg-white text-slate-500 border-sky-200'}`}
                            >
                              <span>{member}</span>
                              {isParticipant && <Check size={12} />}
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <label className="block text-[11px] font-bold text-slate-700">Foto del Ticket (Opcional)</label>
                      <label className="flex items-center justify-center space-x-2 border-2 border-dashed border-sky-200 bg-sky-50/50 rounded-2xl p-3 cursor-pointer hover:bg-sky-50">
                        <Receipt size={16} className="text-sky-600" />
                        <span className="text-xs font-bold text-slate-700">
                          {isUploadingReceipt ? 'Cargando...' : expenseReceiptUrl ? '✓ Ticket adjuntado' : 'Subir foto del ticket'}
                        </span>
                        <input type="file" accept="image/*" onChange={handleReceiptUpload} className="hidden" />
                      </label>
                      {expenseReceiptUrl && (
                        <div className="w-16 h-16 rounded-xl overflow-hidden border border-sky-200 mt-1">
                          <img src={expenseReceiptUrl} alt="Vista previa ticket" className="w-full h-full object-cover" />
                        </div>
                      )}
                    </div>

                    <button type="submit" className="w-full bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-2xl py-2.5 shadow mt-1">
                      Añadir Gasto al Sitio
                    </button>
                  </form>

                  <div className="space-y-2">
                    <h4 className="text-xs font-bold text-slate-700 px-1">Historial de Gastos ({validExpenses.length})</h4>
                    {validExpenses.map((exp) => {
                      const spotObj = validSpots.find(s => s.id === exp.spot_id);
                      const parts = Array.isArray(exp.participants) ? exp.participants : validMembers;
                      return (
                        <div key={exp.id} className="bg-white/90 backdrop-blur-2xl p-3.5 rounded-2xl border border-sky-100 flex justify-between items-center text-xs shadow-sm">
                          <div>
                            <p className="font-bold text-slate-800">{exp.description}</p>
                            <p className="text-[10px] text-slate-500">
                              Pagado por <span className="font-bold text-sky-600">{exp.paid_by}</span> • Repartido entre: <span className="font-bold text-slate-700">{parts.join(', ')}</span>
                              {spotObj && <span className="ml-1 text-slate-600">• 📍 {spotObj.name}</span>}
                            </p>
                          </div>
                          <div className="flex items-center space-x-2">
                            <span className="font-black text-emerald-700 text-sm">{Number(exp.amount).toFixed(2)}€</span>
                            {exp.receipt_url && (
                              <button 
                                type="button"
                                onClick={() => setViewingReceiptUrl(exp.receipt_url)}
                                className="w-7 h-7 bg-sky-50 hover:bg-sky-100 rounded-xl flex items-center justify-center text-sky-700 transition border border-sky-200" 
                                title="Ver ticket asociado"
                              >
                                <Receipt size={14} />
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {eventSubTab === 'gallery' && (
                <div className="space-y-4">
                  <select 
                    value={photoSpotId} 
                    onChange={(e) => setPhotoSpotId(e.target.value)}
                    className="w-full bg-sky-50/50 border border-sky-200 rounded-2xl px-3.5 py-2.5 text-xs text-slate-800"
                    required
                  >
                    <option value="">Selecciona el sitio de la foto...</option>
                    {validSpots.map((spot) => (
                      <option key={spot.id} value={spot.id}>{spot.name}</option>
                    ))}
                  </select>

                  <label className="flex flex-col items-center justify-center border-2 border-dashed border-sky-300 bg-sky-50/60 rounded-3xl p-6 cursor-pointer">
                    <Camera className="w-6 h-6 text-sky-600 mb-1" />
                    <span className="text-xs font-bold text-sky-900">Tomar / Subir foto para este sitio</span>
                    <input type="file" accept="image/*" capture="environment" onChange={handlePhotoUploadWithGPS} className="hidden" />
                  </label>
                </div>
              )}
            </>
          )}
        </main>

        {viewingReceiptUrl && (
          <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white max-w-sm w-full p-4 rounded-[2rem] shadow-2xl space-y-4 border border-sky-100 text-center">
              <div className="flex justify-between items-center px-1">
                <h3 className="font-black text-slate-800 text-sm">Ticket de Gasto</h3>
                <button onClick={() => setViewingReceiptUrl(null)} className="p-1 bg-sky-50 rounded-full text-slate-600 hover:text-red-600">
                  <X size={18} />
                </button>
              </div>
              <div className="w-full max-h-96 rounded-2xl overflow-hidden border border-sky-200 bg-sky-50 flex items-center justify-center">
                <img src={viewingReceiptUrl} alt="Ticket completo" className="w-full h-auto object-contain max-h-96" />
              </div>
              <button onClick={() => setViewingReceiptUrl(null)} className="w-full bg-sky-600 text-white font-bold py-2.5 rounded-xl text-xs">
                Cerrar
              </button>
            </div>
          </div>
        )}
      </div>
    );
  }

  const validEvents = Array.isArray(events) ? events : [];
  const myEventsAll = validEvents.filter(e => 
    Array.isArray(e.members) && 
    e.members.includes(currentUser.name) && 
    (e.title.toLowerCase().includes(searchQuery.toLowerCase()) || e.creator_name.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const activeMyEvents = myEventsAll.filter(e => e.status !== 'closed');
  const closedMyEvents = myEventsAll.filter(e => e.status === 'closed');

  const filteredSearchEvents = validEvents.filter(e => 
    e.status !== 'closed' &&
    (e.title.toLowerCase().includes(searchQuery.toLowerCase()) || e.creator_name.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-sky-50 via-blue-50 to-indigo-100 text-slate-800 pb-28 relative overflow-hidden">
      <header className="bg-white/90 backdrop-blur-2xl border-b border-sky-100 p-4 sticky top-0 z-40 flex justify-between items-center shadow-sm">
        <div className="flex items-center space-x-2">
          <div className="w-9 h-9 bg-gradient-to-tr from-sky-500 to-indigo-600 rounded-2xl flex items-center justify-center text-white font-black text-sm shadow-md">N</div>
          <span className="font-extrabold text-slate-800 text-base">Nosotros</span>
        </div>
        <div className="flex items-center space-x-3">
          <span className="text-xs font-bold text-slate-700">Hola, {currentUser.name}</span>
          <button onClick={() => setCurrentUser(null)} className="text-xs bg-sky-50 hover:bg-red-50 text-slate-600 px-3 py-1.5 rounded-full font-bold border border-sky-200">Salir</button>
        </div>
      </header>

      <main className="max-w-md mx-auto p-4 space-y-4">
        {activeTab === 'my-events' && (
          <div className="space-y-4">
            <button onClick={() => setShowCreateModal(true)} className="w-full bg-gradient-to-r from-sky-600 to-indigo-600 text-white font-bold py-3 px-4 rounded-2xl text-sm shadow-lg flex items-center justify-center space-x-2">
              <Plus size={18} /> <span>Crear Nueva Salida / Plan</span>
            </button>

            <div className="space-y-3">
              <h2 className="text-sm font-black text-slate-800 px-1">Mis Salidas Activas ({activeMyEvents.length})</h2>
              {activeMyEvents.length === 0 ? (
                <p className="text-xs text-slate-400 px-1">No tienes salidas activas.</p>
              ) : (
                activeMyEvents.map((event) => (
                  <article 
                    key={event.id} 
                    onClick={() => setActiveEvent(event)} 
                    className="bg-white/90 rounded-2xl border border-sky-100 p-3.5 flex justify-between items-center cursor-pointer shadow-sm hover:shadow"
                  >
                    <div>
                      <span className="text-[10px] font-bold bg-sky-50 text-sky-700 px-2.5 py-0.5 rounded-full">📅 {event.date}</span>
                      <h3 className="font-black text-slate-800 text-sm mt-1">{event.title}</h3>
                    </div>
                    <span className="text-xs font-bold text-sky-700 bg-sky-50 px-3 py-2 rounded-xl border border-sky-200">Entrar →</span>
                  </article>
                ))
              )}
            </div>

            {closedMyEvents.length > 0 && (
              <div className="space-y-3 pt-4 border-t border-sky-200/60">
                <h2 className="text-sm font-black text-slate-600 px-1 flex items-center">
                  <Archive size={16} className="mr-1.5 text-amber-600" /> Historial de Salidas Cerradas ({closedMyEvents.length})
                </h2>
                {closedMyEvents.map((event) => (
                  <article 
                    key={event.id} 
                    onClick={() => setActiveEvent(event)} 
                    className="bg-amber-50/50 rounded-2xl border border-amber-200 p-3.5 flex justify-between items-center cursor-pointer shadow-xs hover:shadow"
                  >
                    <div>
                      <span className="text-[10px] font-bold bg-amber-500 text-white px-2.5 py-0.5 rounded-full">🔒 Cerrada • 📅 {event.date}</span>
                      <h3 className="font-bold text-slate-800 text-sm mt-1">{event.title}</h3>
                    </div>
                    <span className="text-xs font-bold text-amber-800 bg-amber-100 px-3 py-2 rounded-xl border border-amber-300">Ver Timeline →</span>
                  </article>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'search' && (
          <div className="space-y-4">
            <input type="text" placeholder="Buscar por título o creador..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="w-full bg-white/90 border border-sky-200 rounded-2xl px-4 py-3 text-sm" />
            <div className="space-y-3">
              <h2 className="text-sm font-black text-slate-800 px-1">Salidas Disponibles</h2>
              {filteredSearchEvents.map((event) => {
                const membersList = Array.isArray(event.members) ? event.members : [];
                const pendingInv = Array.isArray(event.pendingInvitations) ? event.pendingInvitations : [];
                const pendingReq = Array.isArray(event.pendingRequests) ? event.pendingRequests : [];

                const isMember = membersList.includes(currentUser.name);
                const isPending = pendingInv.includes(currentUser.name);
                const hasRequested = pendingReq.includes(currentUser.name);

                return (
                  <article key={event.id} className="bg-white/90 rounded-2xl border border-sky-100 p-4 shadow-sm flex justify-between items-center">
                    <div>
                      <span className="text-[10px] font-bold text-sky-700 bg-sky-50 px-2 py-0.5 rounded-full">📅 {event.date} • {event.creator_name}</span>
                      <h3 className="font-bold text-sm text-slate-800 mt-1">{event.title}</h3>
                    </div>
                    {isMember ? (
                      <button onClick={() => setActiveEvent(event)} className="text-xs font-bold text-sky-700 bg-sky-50 px-3 py-2 rounded-xl border">Ver Plan</button>
                    ) : hasRequested ? (
                      <span className="text-xs font-bold text-amber-700 bg-amber-50 px-3 py-2 rounded-xl">Solicitado</span>
                    ) : isPending ? (
                      <span className="text-xs font-bold text-sky-700 bg-sky-50 px-3 py-2 rounded-xl">Invitado</span>
                    ) : (
                      <button onClick={() => handleRequestJoin(event.id)} className="bg-sky-600 text-white text-xs font-bold px-3.5 py-2 rounded-xl shadow">Unirme</button>
                    )}
                  </article>
                );
              })}
            </div>
          </div>
        )}

        {activeTab === 'notifications' && (
          <div className="space-y-4">
            <div className="bg-white/90 p-5 rounded-[2.5rem] border border-sky-100 shadow-sm space-y-3">
              <h2 className="text-sm font-black text-slate-800">Invitaciones Recibidas ({myInvitations.length})</h2>
              {myInvitations.length === 0 ? <p className="text-xs text-slate-500">Sin invitaciones pendientes.</p> : myInvitations.map((event) => (
                <div key={event.id} className="p-3.5 rounded-2xl border border-sky-200 bg-sky-50/60 flex justify-between items-center">
                  <p className="text-xs font-bold text-slate-800">{event.title}</p>
                  <div className="flex gap-2">
                    <button onClick={() => handleAcceptInvitation(event.id)} className="bg-emerald-600 text-white p-2 rounded-xl text-xs"><Check size={14} /></button>
                    <button onClick={() => handleRejectInvitation(event.id)} className="bg-slate-200 text-slate-700 p-2 rounded-xl text-xs"><X size={14} /></button>
                  </div>
                </div>
              ))}
            </div>

            <div className="bg-white/90 p-5 rounded-[2.5rem] border border-sky-100 shadow-sm space-y-3">
              <h2 className="text-sm font-black text-slate-800">Solicitudes para tus Eventos</h2>
              {myApprovalRequests.length === 0 ? <p className="text-xs text-slate-500">Sin solicitudes pendientes.</p> : myApprovalRequests.map((event) => {
                const pendingReqs = Array.isArray(event.pendingRequests) ? event.pendingRequests : [];
                return (
                  <div key={event.id} className="space-y-2">
                    <p className="text-xs font-bold text-slate-700">{event.title}</p>
                    {pendingReqs.map((userName) => (
                      <div key={userName} className="p-3.5 rounded-2xl border border-indigo-200 bg-indigo-50/60 flex justify-between items-center">
                        <p className="text-xs font-bold text-slate-800">{userName} quiere unirse</p>
                        <div className="flex gap-2">
                          <button onClick={() => handleApproveRequest(event.id, userName)} className="bg-indigo-600 text-white px-3 py-1.5 rounded-xl text-xs font-bold">Aprobar</button>
                          <button onClick={() => handleRejectRequest(event.id, userName)} className="bg-slate-200 text-slate-700 p-1.5 rounded-xl text-xs"><X size={14} /></button>
                        </div>
                      </div>
                    ))}
                  </div>
                );
              })}
            </div>

            {isAdmin && (
              <div className="bg-white/90 p-5 rounded-[2.5rem] border border-indigo-100 shadow-sm space-y-3">
                <h2 className="text-sm font-black text-slate-800 flex items-center">
                  <KeyRound size={16} className="mr-1.5 text-indigo-600" /> Solicitudes de Cambio de Contraseña ({passwordRequests.length})
                </h2>
                {passwordRequests.length === 0 ? (
                  <p className="text-xs text-slate-500">No hay solicitudes de nueva contraseña pendientes.</p>
                ) : (
                  <div className="space-y-2">
                    {passwordRequests.map(req => (
                      <div key={req.id} className="p-3 rounded-2xl border border-indigo-100 bg-indigo-50/40 flex justify-between items-center text-xs">
                        <div>
                          <p className="font-bold text-slate-800">{req.email}</p>
                          <p className="text-[10px] text-slate-500">Nueva clave: <span className="font-bold text-indigo-600">{req.new_password}</span></p>
                        </div>
                        <div className="flex gap-1.5">
                          <button onClick={() => handleApprovePasswordRequest(req.id, req.email, req.new_password)} className="px-2.5 py-1.5 rounded-xl font-bold text-[10px] bg-emerald-600 text-white">Aprobar</button>
                          <button onClick={() => handleRejectPasswordRequest(req.id)} className="px-2.5 py-1.5 rounded-xl font-bold text-[10px] bg-red-600 text-white">Rechazar</button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </main>

      {showCreateModal && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white max-w-md w-full p-6 rounded-[2.5rem] shadow-2xl space-y-4 border border-sky-100">
            <h2 className="font-black text-slate-800 text-lg">Organizar Nueva Salida</h2>
            <form onSubmit={handleCreateEvent} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Título del Plan</label>
                <input type="text" placeholder="Ej. Cervecitas" value={newTitle} onChange={(e) => setNewTitle(e.target.value)} className="w-full bg-sky-50/50 border border-sky-200 rounded-2xl px-4 py-2.5 text-sm" required />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Fecha</label>
                <input type="date" value={newDate} onChange={(e) => setNewDate(e.target.value)} className="w-full bg-sky-50/50 border border-sky-200 rounded-2xl px-4 py-2.5 text-sm" required />
              </div>

              <div className="flex gap-2 pt-2">
                <button type="button" onClick={() => setShowCreateModal(false)} className="w-1/2 bg-sky-50 text-slate-700 font-bold py-2.5 rounded-2xl text-xs border border-sky-200">Cancelar</button>
                <button type="submit" className="w-1/2 bg-sky-600 text-white font-bold py-2.5 rounded-2xl text-xs shadow">Crear Plan</button>
              </div>
            </form>
          </div>
        </div>
      )}

      <nav className="fixed bottom-3 left-4 right-4 bg-white/95 backdrop-blur-xl border border-sky-200 py-3 px-6 flex justify-around items-center z-40 rounded-[2rem] shadow-lg max-w-md mx-auto">
        <button onClick={() => setActiveTab('my-events')} className={`flex flex-col items-center ${activeTab === 'my-events' ? 'text-sky-600 font-bold' : 'text-slate-500'}`}>
          <Calendar size={20} />
          <span className="text-[10px] mt-0.5">Mis Salidas</span>
        </button>
        <button onClick={() => setActiveTab('search')} className={`flex flex-col items-center ${activeTab === 'search' ? 'text-sky-600 font-bold' : 'text-slate-500'}`}>
          <Search size={20} />
          <span className="text-[10px] mt-0.5">Buscar</span>
        </button>
        <button onClick={() => setActiveTab('notifications')} className={`flex flex-col items-center relative ${activeTab === 'notifications' ? 'text-sky-600 font-bold' : 'text-slate-500'}`}>
          <Inbox size={20} />
          <span className="text-[10px] mt-0.5">Aprobaciones</span>
          {totalNotifications > 0 && <span className="absolute -top-1 -right-1 bg-red-600 text-white text-[9px] w-4 h-4 rounded-full flex items-center justify-center font-bold">{totalNotifications}</span>}
        </button>
      </nav>
    </div>
  );
}
