import React, { useState, useEffect } from 'react';
import { 
  Users, MapPin, DollarSign, Plus, CheckCircle, 
  Clock, Camera, Navigation, ArrowRight, Trash2, Shield, Calendar, Sparkles, User, Lock, Mail, Bell, Search, Check, X, UserPlus, Inbox, ArrowLeft, Image as ImageIcon, Utensils, Beer, PartyPopper, Compass, Flag, ThumbsUp, Trophy, Receipt, AlertCircle, ChevronRight, MessageSquare, Send, Map, CheckSquare, ListPlus, UserMinus, ShieldAlert, KeyRound, Archive, Share2, ArrowUp, ArrowDown, Radio, Settings, ShieldCheck, Edit3, QrCode, ExternalLink
} from 'lucide-react';
import { supabase } from './supabaseClient';

export default function App() {
  const [currentUser, setCurrentUser] = useState(null);
  const [authMode, setAuthMode] = useState('login');
  
  // Auth inputs
  const [usernameOrEmail, setUsernameOrEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [passwordError, setPasswordError] = useState('');

  // Navegación
  const [activeTab, setActiveTab] = useState('my-events');
  const [activeEvent, setActiveEvent] = useState(null);
  const [eventSubTab, setEventSubTab] = useState('spots');

  // Modales y formularios
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newDate, setNewDate] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  // Perfiles y solicitudes
  const [registeredUsers, setRegisteredUsers] = useState([]);
  const [passwordRequests, setPasswordRequests] = useState([]);
  const [pendingRegistrations, setPendingRegistrations] = useState([]);

  // Perfil
  const [editNameInput, setEditNameInput] = useState('');
  const [editEmailInput, setEditEmailInput] = useState('');
  const [oldPasswordInput, setOldPasswordInput] = useState('');
  const [newPasswordInput, setNewPasswordInput] = useState('');
  const [confirmNewPasswordInput, setConfirmNewPasswordInput] = useState('');
  const [profileMessage, setProfileMessage] = useState('');

  // Sitios, QR y GPS
  const [newSpotName, setNewSpotName] = useState('');
  const [isGettingLocation, setIsGettingLocation] = useState(false);
  const [activeQrSpotId, setActiveQrSpotId] = useState(null);
  const [customQrLabel, setCustomQrLabel] = useState('');
  const [customQrUrl, setCustomQrUrl] = useState('');

  // Gastos
  const [expenseDesc, setExpenseDesc] = useState('');
  const [expenseAmount, setExpenseAmount] = useState('');
  const [expenseSpotId, setExpenseSpotId] = useState('');
  const [expenseReceiptUrl, setExpenseReceiptUrl] = useState('');
  const [isUploadingReceipt, setIsUploadingReceipt] = useState(false);
  const [expenseParticipants, setExpenseParticipants] = useState([]);

  // Fotos y Comentarios
  const [photoSpotId, setPhotoSpotId] = useState('');
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);
  const [viewingPhotoUrl, setViewingPhotoUrl] = useState(null);
  const [spotCommentInputs, setSpotCommentInputs] = useState({});
  const [expandedTimelineSpotId, setExpandedTimelineSpotId] = useState(null);
  const [viewingReceiptUrl, setViewingReceiptUrl] = useState(null);

  // Recuperación clave
  const [showResetModal, setShowResetModal] = useState(false);
  const [resetEmailInput, setResetEmailInput] = useState('');
  const [resetNewPasswordInput, setResetNewPasswordInput] = useState('');

  const [events, setEvents] = useState([]);

  useEffect(() => {
    if (currentUser) {
      refreshAllData();
      setEditNameInput(currentUser.name || '');
      setEditEmailInput(currentUser.email || '');
    }
  }, [currentUser]);

  useEffect(() => {
    if (activeEvent && Array.isArray(activeEvent.members)) {
      setExpenseParticipants(activeEvent.members);
    }
  }, [activeEvent]);

  const refreshAllData = async () => {
    await Promise.all([
      fetchAppData(),
      fetchRegisteredUsers(),
      fetchPasswordRequests(),
      fetchPendingRegistrations()
    ]);
  };

  const fetchRegisteredUsers = async () => {
    try {
      const { data, error } = await supabase.from('profiles').select('id, name, email, role, is_blocked, is_approved');
      if (error) throw error;
      setRegisteredUsers(Array.isArray(data) ? data : []);
      setPendingRegistrations((Array.isArray(data) ? data : []).filter(p => !p.is_approved && p.role !== 'admin'));
    } catch (err) {
      console.error('Error cargando perfiles:', err.message);
    }
  };

  const fetchPendingRegistrations = async () => {
    try {
      const { data, error } = await supabase.from('profiles').select('*').eq('is_approved', false);
      if (error) throw error;
      setPendingRegistrations(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Error cargando registros:', err);
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
      console.error('Error cargando solicitudes:', err);
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
        const rawSpots = Array.isArray(ev.spots) ? ev.spots : [];
        rawSpots.sort((a, b) => (a.stop_order || 0) - (b.stop_order || 0));

        return {
          ...ev,
          status: ev.status || 'active',
          members: rawMembers.filter(m => m.status === 'member').map(m => m.user_name),
          pendingInvitations: rawMembers.filter(m => m.status === 'pending_invite').map(m => m.user_name),
          pendingRequests: rawMembers.filter(m => m.status === 'pending_request').map(m => m.user_name),
          spots: rawSpots,
          expenses: Array.isArray(ev.expenses) ? ev.expenses : [],
          photos: Array.isArray(ev.photos) ? ev.photos : [],
          comments: Array.isArray(ev.comments) ? ev.comments : []
        };
      });

      formattedEvents.sort((a, b) => new Date(b.date) - new Date(a.date));
      setEvents(formattedEvents);

      if (activeEvent) {
        const updatedActive = formattedEvents.find(e => e.id === activeEvent.id);
        if (updatedActive) setActiveEvent(updatedActive);
      }
    } catch (err) {
      console.error('Error cargando datos:', err.message);
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
    if (!hasSpecialChar) return 'Debe incluir al menos un carácter especial.';
    return '';
  };

  const handleAuth = async (e) => {
    e.preventDefault();

    if (authMode === 'register') {
      if (!email || !password || !name) return;
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
        await supabase.from('profiles').insert([{ 
          id: data.user.id, 
          name: name.trim(), 
          email: email.toLowerCase().trim(), 
          role: 'user', 
          is_blocked: false,
          is_approved: false
        }]);

        alert('✅ Cuenta registrada. El administrador debe aprobar tu usuario antes de poder entrar.');
        await supabase.auth.signOut();
        setAuthMode('login');
      }
    } else {
      if (!usernameOrEmail || !password) return;
      setPasswordError('');

      let loginEmail = usernameOrEmail.trim().toLowerCase();
      if (!loginEmail.includes('@')) {
        const { data: foundProfile } = await supabase
          .from('profiles')
          .select('email')
          .ilike('name', loginEmail)
          .maybeSingle();

        if (foundProfile && foundProfile.email) {
          loginEmail = foundProfile.email;
        } else {
          alert('No se encontró ningún usuario con ese nombre.');
          return;
        }
      }

      const { data, error } = await supabase.auth.signInWithPassword({ email: loginEmail, password });
      if (error) {
        alert(error.message);
        return;
      }

      if (data.user) {
        const { data: profile } = await supabase.from('profiles').select('*').eq('id', data.user.id).single();
        if (profile) {
          if (profile.is_blocked) {
            alert('Tu cuenta ha sido bloqueada por el administrador.');
            await supabase.auth.signOut();
            return;
          }
          if (!profile.is_approved) {
            alert('⏳ Tu cuenta está pendiente de aprobación por el administrador.');
            await supabase.auth.signOut();
            return;
          }
        }

        setCurrentUser({ id: data.user.id, name: profile ? profile.name : loginEmail.split('@')[0], email: loginEmail, role: profile ? profile.role : 'user' });
      }
    }
  };

  const handleApproveRegistration = async (userId, userName) => {
    try {
      await supabase.from('profiles').update({ is_approved: true }).eq('id', userId);
      await refreshAllData();
    } catch (err) {
      alert('Error: ' + err.message);
    }
  };

  const handleRejectRegistration = async (userId) => {
    if (!confirm('¿Rechazar solicitud?')) return;
    try {
      await supabase.from('profiles').delete().eq('id', userId);
      await refreshAllData();
    } catch (err) {
      alert('Error: ' + err.message);
    }
  };

  // AÑADIR ENLACE QR / CARTA AL SITIO
  const handleAddQrLink = async (e, spot) => {
    e.preventDefault();
    if (!customQrUrl.trim()) return;

    const formattedUrl = customQrUrl.trim().startsWith('http') ? customQrUrl.trim() : `https://${customQrUrl.trim()}`;
    const label = customQrLabel.trim() || 'Carta / Enlace QR';
    const newEntry = `${label}|${formattedUrl}`;

    const existingLinks = Array.isArray(spot.qr_links) ? spot.qr_links : [];
    const updatedLinks = [...existingLinks, newEntry];

    try {
      const { error } = await supabase.from('spots').update({ qr_links: updatedLinks }).eq('id', spot.id);
      if (error) throw error;

      setCustomQrLabel('');
      setCustomQrUrl('');
      setActiveQrSpotId(null);
      await refreshAllData();
    } catch (err) {
      alert('Error al guardar el enlace QR: ' + err.message);
    }
  };

  // ELIMINAR ENLACE QR
  const handleDeleteQrLink = async (spot, indexToRemove) => {
    const existingLinks = Array.isArray(spot.qr_links) ? spot.qr_links : [];
    const updatedLinks = existingLinks.filter((_, idx) => idx !== indexToRemove);

    try {
      await supabase.from('spots').update({ qr_links: updatedLinks }).eq('id', spot.id);
      await refreshAllData();
    } catch (err) {
      alert('Error al eliminar enlace: ' + err.message);
    }
  };

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    setProfileMessage('');

    try {
      const updates = { name: editNameInput.trim() };
      let emailChanged = false;

      if (editEmailInput.trim() && editEmailInput.trim().toLowerCase() !== currentUser.email.toLowerCase()) {
        updates.email = editEmailInput.trim().toLowerCase();
        emailChanged = true;
      }

      await supabase.from('profiles').update(updates).eq('id', currentUser.id);
      if (emailChanged) await supabase.auth.updateUser({ email: editEmailInput.trim().toLowerCase() });

      if (oldPasswordInput || newPasswordInput || confirmNewPasswordInput) {
        if (newPasswordInput !== confirmNewPasswordInput) {
          setProfileMessage('❌ Las contraseñas nuevas no coinciden.');
          return;
        }
        const errorMsg = validateStrongPassword(newPasswordInput);
        if (errorMsg) {
          setProfileMessage('❌ Contraseña no válida: ' + errorMsg);
          return;
        }
        const { error: loginError } = await supabase.auth.signInWithPassword({ email: currentUser.email, password: oldPasswordInput });
        if (loginError) {
          setProfileMessage('❌ Contraseña actual incorrecta.');
          return;
        }
        await supabase.auth.updateUser({ password: newPasswordInput });
      }

      setCurrentUser({ ...currentUser, name: editNameInput.trim(), email: emailChanged ? editEmailInput.trim().toLowerCase() : currentUser.email });
      setProfileMessage('✅ ¡Perfil guardado con éxito!');
      setOldPasswordInput('');
      setNewPasswordInput('');
      setConfirmNewPasswordInput('');
      await refreshAllData();
    } catch (err) {
      setProfileMessage('❌ Error: ' + err.message);
    }
  };

  const handleRequestPasswordChange = async (e) => {
    e.preventDefault();
    if (!resetEmailInput || !resetNewPasswordInput) return;
    try {
      await supabase.from('password_requests').insert([{ email: resetEmailInput.toLowerCase().trim(), new_password: resetNewPasswordInput, status: 'pending' }]);
      alert('✅ Solicitud enviada al administrador.');
      setShowResetModal(false);
      setResetEmailInput('');
      setResetNewPasswordInput('');
      await refreshAllData();
    } catch (err) {
      alert('Error: ' + err.message);
    }
  };

  const handleApprovePasswordRequest = async (reqId, targetEmail, requestedPassword) => {
    if (!confirm(`¿Aprobar clave para ${targetEmail}?`)) return;
    await supabase.from('password_requests').update({ status: 'approved' }).eq('id', reqId);
    await refreshAllData();
  };

  const handleRejectPasswordRequest = async (reqId) => {
    await supabase.from('password_requests').update({ status: 'rejected' }).eq('id', reqId);
    await refreshAllData();
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
        .insert([{ title: newTitle, date: newDate, creator_id: currentUser.id, creator_name: currentUser.name, status: 'active' }])
        .select()
        .single();

      if (eventError) throw eventError;
      await supabase.from('event_members').insert([{ event_id: newEv.id, user_name: currentUser.name, status: 'member' }]);

      setNewTitle('');
      setNewDate('');
      setShowCreateModal(false);
      await refreshAllData();
    } catch (err) {
      alert('Error: ' + err.message);
    }
  };

  const handleRemoveMember = async (memberName) => {
    if (!confirm(`¿Quitar a ${memberName}?`)) return;
    await supabase.from('event_members').delete().eq('event_id', activeEvent.id).eq('user_name', memberName);
    if (memberName === currentUser.name) setActiveEvent(null);
    await refreshAllData();
  };

  const handleAddSpot = async (e) => {
    if (e) e.preventDefault();
    if (!newSpotName.trim() || !activeEvent) return;

    const formattedSpotName = newSpotName.toLowerCase().includes('valdelagrana') || newSpotName.toLowerCase().includes('el puerto') 
      ? newSpotName.trim() 
      : `${newSpotName.trim()}, Valdelagrana, El Puerto de Santa María`;

    const currentSelectedCount = (activeEvent.spots || []).filter(s => s.active_now).length;

    await supabase.from('spots').insert([{
      event_id: activeEvent.id,
      name: formattedSpotName,
      category: 'bar',
      votes: 1,
      suggested_by: currentUser.name,
      active_now: false,
      stop_order: currentSelectedCount + 1
    }]);

    setNewSpotName('');
    await refreshAllData();
  };

  const handleVoteSpot = async (spotId, currentVotes) => {
    await supabase.from('spots').update({ votes: currentVotes + 1 }).eq('id', spotId);
    await refreshAllData();
  };

  const handleToggleSelectSpot = async (spotId, currentSelectedState) => {
    await supabase.from('spots').update({ active_now: !currentSelectedState }).eq('id', spotId);
    await refreshAllData();
  };

  const handleMoveSpotOrder = async (spotId, direction, selectedSpotsList) => {
    const currentIndex = selectedSpotsList.findIndex(s => s.id === spotId);
    if (currentIndex === -1) return;
    const targetIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;
    if (targetIndex < 0 || targetIndex >= selectedSpotsList.length) return;

    await supabase.from('spots').update({ stop_order: targetIndex + 1 }).eq('id', selectedSpotsList[currentIndex].id);
    await supabase.from('spots').update({ stop_order: currentIndex + 1 }).eq('id', selectedSpotsList[targetIndex].id);
    await refreshAllData();
  };

  const handleSetCurrentSpotAndGps = async (spot) => {
    if (!navigator.geolocation) {
      alert('Geolocalización no soportada.');
      return;
    }
    setIsGettingLocation(true);
    navigator.geolocation.getCurrentPosition(async (position) => {
      const { latitude, longitude } = position.coords;
      await supabase.from('spots').update({ is_current_here: false }).eq('event_id', activeEvent.id);
      await supabase.from('spots').update({ is_current_here: true }).eq('id', spot.id);
      await supabase.from('events').update({ live_lat: latitude, live_lon: longitude, live_updated_at: new Date().toISOString() }).eq('id', activeEvent.id);
      setIsGettingLocation(false);
      await refreshAllData();
    }, () => {
      setIsGettingLocation(false);
      alert('No se pudo obtener la ubicación GPS.');
    }, { enableHighAccuracy: true });
  };

  const handleShareLiveLocation = () => {
    if (!activeEvent.live_lat || !activeEvent.live_lon) return;
    const currentSpot = (activeEvent.spots || []).find(s => s.is_current_here);
    const mapsLink = `https://www.google.com/maps?q=${activeEvent.live_lat},${activeEvent.live_lon}`;
    const shareText = `📍 ¡Únete a nuestro plan "${activeEvent.title}"! ${currentSpot ? 'Estamos en ' + currentSpot.name : ''}. Mapa GPS: ${mapsLink}`;
    if (navigator.share) {
      navigator.share({ title: activeEvent.title, text: shareText, url: mapsLink }).catch(() => {});
    } else {
      navigator.clipboard.writeText(shareText);
      alert('📋 ¡Ubicación copiada al portapapeles!');
    }
  };

  const handleDeleteSpot = async (spotId) => {
    if (!confirm('¿Eliminar sitio?')) return;
    await supabase.from('spots').delete().eq('id', spotId);
    await refreshAllData();
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
      description: expenseDesc.trim(),
      amount: parseFloat(expenseAmount),
      paid_by: currentUser.name,
      spot_id: expenseSpotId || null,
      receipt_url: expenseReceiptUrl || null,
      participants: expenseParticipants
    }]);
    setExpenseDesc('');
    setExpenseAmount('');
    setExpenseSpotId('');
    setExpenseReceiptUrl('');
    await refreshAllData();
  };

  const handlePhotoUpload = (e) => {
    const file = e.target.files[0];
    if (!file || !activeEvent || !photoSpotId) return;
    setIsUploadingPhoto(true);
    const reader = new FileReader();
    reader.onloadend = async () => {
      await supabase.from('photos').insert([{ event_id: activeEvent.id, url: reader.result, user_name: currentUser.name, spot_id: photoSpotId }]);
      setIsUploadingPhoto(false);
      setPhotoSpotId('');
      await refreshAllData();
    };
    reader.readAsDataURL(file);
  };

  const handleAddSpotComment = async (spotId) => {
    const text = spotCommentInputs[spotId];
    if (!text || !text.trim() || !activeEvent) return;
    await supabase.from('comments').insert([{ event_id: activeEvent.id, spot_id: spotId, user_name: currentUser.name, content: text.trim() }]);
    setSpotCommentInputs({ ...spotCommentInputs, [spotId]: '' });
    await refreshAllData();
  };

  const handleCloseEvent = async () => {
    if (!confirm('¿Cerrar salida?')) return;
    await supabase.from('events').update({ status: 'closed' }).eq('id', activeEvent.id);
    await refreshAllData();
  };

  const calculateDebts = (members = [], expenses = []) => {
    if (members.length === 0) return [];
    const balancesMap = {};
    members.forEach(m => { balancesMap[m] = 0; });
    expenses.forEach(exp => {
      const amount = Number(exp.amount) || 0;
      balancesMap[exp.paid_by] = (balancesMap[exp.paid_by] || 0) + amount;
      const parts = (Array.isArray(exp.participants) && exp.participants.length > 0) ? exp.participants : members;
      const share = amount / parts.length;
      parts.forEach(p => { if (balancesMap[p] !== undefined) balancesMap[p] -= share; });
    });
    const balances = Object.keys(balancesMap).map(name => ({ name, balance: balancesMap[name] }));
    let debtors = balances.filter(b => b.balance < -0.01).map(d => ({ ...d, balance: Math.abs(d.balance) }));
    let creditors = balances.filter(b => b.balance > 0.01);
    const transactions = [];
    let dIndex = 0, cIndex = 0;
    while (dIndex < debtors.length && cIndex < creditors.length) {
      const amount = Math.min(debtors[dIndex].balance, creditors[cIndex].balance);
      if (amount > 0.01) transactions.push({ from: debtors[dIndex].name, to: creditors[cIndex].name, amount });
      debtors[dIndex].balance -= amount;
      creditors[cIndex].balance -= amount;
      if (debtors[dIndex].balance <= 0.01) dIndex++;
      if (creditors[cIndex].balance <= 0.01) cIndex++;
    }
    return transactions;
  };

  const renderSpotCard = (spot, isSelected, maxVotes, selectedSpotsList = []) => {
    const isMajority = maxVotes > 0 && spot.votes === maxVotes;
    const spotComments = Array.isArray(activeEvent?.comments) ? activeEvent.comments.filter(c => c.spot_id === spot.id) : [];
    const spotPhotos = Array.isArray(activeEvent?.photos) ? activeEvent.photos.filter(p => p.spot_id === spot.id) : [];
    const qrLinks = Array.isArray(spot.qr_links) ? spot.qr_links : [];
    const currentInputText = spotCommentInputs[spot.id] || '';
    const canDeleteSpot = Array.isArray(activeEvent?.members) && activeEvent.members.includes(currentUser?.name);
    const isCurrentHere = spot.is_current_here;
    const currentOrderIndex = selectedSpotsList.findIndex(s => s.id === spot.id);
    const isAddingQr = activeQrSpotId === spot.id;

    return (
      <div key={spot.id} className={`p-4 rounded-3xl border flex flex-col space-y-3 backdrop-blur-xl transition ${isCurrentHere ? 'bg-gradient-to-r from-emerald-500/10 to-teal-500/10 border-emerald-400 shadow-md ring-2 ring-emerald-400/30' : isSelected ? 'bg-sky-50/90 border-sky-300 shadow-sm' : isMajority ? 'bg-amber-50/60 border-amber-300' : 'bg-white/90 border-sky-100 shadow-sm'}`}>
        <div className="flex justify-between items-start">
          <div className="pr-2 space-y-1">
            <div className="flex items-center space-x-2 flex-wrap gap-y-1">
              {isSelected && (
                <span className="bg-sky-700 text-white text-[11px] font-black px-2.5 py-0.5 rounded-full shadow-xs">
                  #{currentOrderIndex + 1}
                </span>
              )}
              <h3 className="font-bold text-slate-800 text-sm">{spot.name}</h3>
              {isCurrentHere && (
                <span className="bg-emerald-600 text-white text-[10px] font-black px-2 py-0.5 rounded-full shadow-xs flex items-center animate-pulse">
                  <Radio size={10} className="mr-1" /> ¡ESTAMOS AQUÍ!
                </span>
              )}
            </div>
            <p className="text-[11px] text-slate-500 font-medium">
              Propuesto por <span className="font-bold text-sky-600">{spot.suggested_by}</span> • <span className="font-extrabold text-slate-800">{spot.votes} votos</span>
            </p>
          </div>

          <div className="flex items-center space-x-1">
            {isSelected && (
              <div className="flex flex-col space-y-0.5">
                <button onClick={() => handleMoveSpotOrder(spot.id, 'up', selectedSpotsList)} disabled={currentOrderIndex === 0} className="p-1 bg-sky-50 hover:bg-sky-100 disabled:opacity-30 text-sky-700 rounded-lg border border-sky-200">
                  <ArrowUp size={12} />
                </button>
                <button onClick={() => handleMoveSpotOrder(spot.id, 'down', selectedSpotsList)} disabled={currentOrderIndex === selectedSpotsList.length - 1} className="p-1 bg-sky-50 hover:bg-sky-100 disabled:opacity-30 text-sky-700 rounded-lg border border-sky-200">
                  <ArrowDown size={12} />
                </button>
              </div>
            )}
            {canDeleteSpot && (
              <button onClick={() => handleDeleteSpot(spot.id)} className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition">
                <Trash2 size={16} />
              </button>
            )}
          </div>
        </div>

        {/* ENLACES QR / CARTAS ASOCIADAS */}
        <div className="space-y-1.5 pt-1">
          <div className="flex justify-between items-center">
            <span className="text-[11px] font-bold text-slate-700 flex items-center">
              <QrCode size={13} className="mr-1 text-sky-600" /> Cartas y Enlaces QR ({qrLinks.length})
            </span>
            <button 
              onClick={() => setActiveQrSpotId(isAddingQr ? null : spot.id)}
              className="text-[10px] font-bold text-sky-700 bg-sky-50 hover:bg-sky-100 px-2.5 py-1 rounded-xl border border-sky-200 transition"
            >
              {isAddingQr ? 'Cancelar' : '+ Añadir Carta / QR'}
            </button>
          </div>

          {isAddingQr && (
            <form onSubmit={(e) => handleAddQrLink(e, spot)} className="bg-sky-50 p-3 rounded-2xl border border-sky-200 space-y-2">
              <input 
                type="text" 
                placeholder="Nombre (ej. Carta de Vinos, Menú...)" 
                value={customQrLabel} 
                onChange={(e) => setCustomQrLabel(e.target.value)} 
                className="w-full bg-white border border-sky-200 rounded-xl px-3 py-1.5 text-xs text-slate-800 focus:outline-none"
                required
              />
              <input 
                type="url" 
                placeholder="Enlace URL (ej. https://...)" 
                value={customQrUrl} 
                onChange={(e) => setCustomQrUrl(e.target.value)} 
                className="w-full bg-white border border-sky-200 rounded-xl px-3 py-1.5 text-xs text-slate-800 focus:outline-none"
                required
              />
              <button type="submit" className="w-full bg-sky-600 hover:bg-sky-700 text-white font-bold py-1.5 rounded-xl text-xs shadow-xs">
                Guardar Enlace QR
              </button>
            </form>
          )}

          {qrLinks.length > 0 && (
            <div className="flex flex-wrap gap-1.5 pt-0.5">
              {qrLinks.map((item, idx) => {
                const [label, url] = item.split('|');
                return (
                  <div key={idx} className="flex items-center bg-sky-100/70 border border-sky-200 rounded-xl px-2.5 py-1 text-xs">
                    <a href={url} target="_blank" rel="noreferrer" className="font-bold text-sky-800 hover:underline flex items-center mr-1.5">
                      <ExternalLink size={11} className="mr-1" /> {label}
                    </a>
                    <button onClick={() => handleDeleteQrLink(spot, idx)} className="text-slate-400 hover:text-red-600">
                      <X size={12} />
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {spotPhotos.length > 0 && (
          <div className="flex gap-2 overflow-x-auto py-1">
            {spotPhotos.map(p => (
              <div key={p.id} onClick={() => setViewingPhotoUrl(p.url)} className="w-14 h-14 rounded-xl overflow-hidden border border-sky-200 shrink-0 cursor-pointer shadow-xs">
                <img src={p.url} alt="Foto sitio" className="w-full h-full object-cover" />
              </div>
            ))}
          </div>
        )}

        <div className="flex flex-wrap gap-2 pt-1 border-t border-sky-100">
          <button onClick={() => handleVoteSpot(spot.id, spot.votes)} className="bg-sky-50 hover:bg-sky-100 text-slate-700 text-xs font-bold px-3 py-2 rounded-xl flex items-center space-x-1.5 border border-sky-200">
            <ThumbsUp size={14} className="text-sky-600" />
            <span>Votar ({spot.votes})</span>
          </button>
          <button onClick={() => handleToggleSelectSpot(spot.id, isSelected)} className={`flex-1 font-bold text-xs py-2 rounded-xl transition shadow-sm ${isSelected ? 'bg-slate-200 text-slate-700' : 'bg-sky-600 text-white'}`}>
            {isSelected ? 'Quitar de la Ruta' : '✓ Añadir a la Ruta'}
          </button>
          {isSelected && (
            <button onClick={() => handleSetCurrentSpotAndGps(spot)} disabled={isGettingLocation} className={`px-3 py-2 rounded-xl font-bold text-xs shadow-sm flex items-center space-x-1 ${isCurrentHere ? 'bg-emerald-600 text-white' : 'bg-emerald-50 text-emerald-800 border border-emerald-300'}`}>
              <Radio size={14} />
              <span>{isCurrentHere ? 'Aquí ahora' : 'Marcar Aquí'}</span>
            </button>
          )}
          <a href={`https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(spot.name)}`} target="_blank" rel="noreferrer" className="bg-emerald-600 hover:bg-emerald-700 text-white px-3 py-2 rounded-xl flex items-center justify-center shadow-sm">
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
              className="flex-1 bg-sky-50/50 border border-sky-200 rounded-xl px-3 py-1.5 text-xs text-slate-800 focus:outline-none"
            />
            <button type="button" onClick={() => handleAddSpotComment(spot.id)} className="bg-sky-600 hover:bg-sky-700 text-white px-3 py-1.5 rounded-xl text-xs font-bold flex items-center justify-center">
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
              <div className="absolute inset-0 bg-gradient-to-tr from-sky-400 to-indigo-500 rounded-3xl rotate-6 shadow-lg shadow-sky-400/30"></div>
              <div className="absolute inset-0 bg-white rounded-3xl flex items-center justify-center border border-sky-200">
                <Compass className="w-10 h-10 text-sky-600" />
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
            <button role="tab" aria-selected={authMode === 'login'} onClick={() => { setAuthMode('login'); setPasswordError(''); }} className={`flex-1 py-3 text-xs font-bold rounded-xl transition-all ${authMode === 'login' ? 'bg-sky-600 text-white shadow-md' : 'text-slate-600'}`}>
              Iniciar Sesión
            </button>
            <button role="tab" aria-selected={authMode === 'register'} onClick={() => { setAuthMode('register'); setPasswordError(''); }} className={`flex-1 py-3 text-xs font-bold rounded-xl transition-all ${authMode === 'register' ? 'bg-sky-600 text-white shadow-md' : 'text-slate-600'}`}>
              Crear Cuenta
            </button>
          </div>

          <form onSubmit={handleAuth} className="space-y-4">
            {authMode === 'login' ? (
              <div className="space-y-1">
                <label className="block text-xs font-bold text-slate-700 ml-1">Usuario o Correo Electrónico</label>
                <div className="relative flex items-center">
                  <User className="absolute left-3.5 text-slate-400" size={18} />
                  <input type="text" placeholder="Tu usuario o correo..." value={usernameOrEmail} onChange={(e) => setUsernameOrEmail(e.target.value)} className="w-full bg-sky-50/50 border border-sky-200 rounded-2xl pl-10 pr-4 py-3 text-sm focus:outline-none text-slate-800" required />
                </div>
              </div>
            ) : (
              <>
                <div className="space-y-1">
                  <label className="block text-xs font-bold text-slate-700 ml-1">Nombre de Usuario (Texto libre)</label>
                  <div className="relative flex items-center">
                    <User className="absolute left-3.5 text-slate-400" size={18} />
                    <input type="text" placeholder="Ej. rafa, kike, nacho..." value={name} onChange={(e) => setName(e.target.value)} className="w-full bg-sky-50/50 border border-sky-200 rounded-2xl pl-10 pr-4 py-3 text-sm focus:outline-none text-slate-800" required />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="block text-xs font-bold text-slate-700 ml-1">Correo Electrónico</label>
                  <div className="relative flex items-center">
                    <Mail className="absolute left-3.5 text-slate-400" size={18} />
                    <input type="email" placeholder="correo@ejemplo.com" value={email} onChange={(e) => setEmail(e.target.value)} className="w-full bg-sky-50/50 border border-sky-200 rounded-2xl pl-10 pr-4 py-3 text-sm focus:outline-none text-slate-800" required />
                  </div>
                </div>
              </>
            )}

            <div className="space-y-1">
              <label className="block text-xs font-bold text-slate-700 ml-1">Contraseña</label>
              <div className="relative flex items-center">
                <Lock className="absolute left-3.5 text-slate-400" size={18} />
                <input type="password" placeholder="••••••••" value={password} onChange={(e) => setPassword(e.target.value)} className="w-full bg-sky-50/50 border border-sky-200 rounded-2xl pl-10 pr-4 py-3 text-sm focus:outline-none" required />
              </div>
              {passwordError && (
                <div className="flex items-center space-x-1 text-red-600 text-[11px] font-bold mt-1 ml-1 bg-red-50 p-2 rounded-xl border border-red-200">
                  <AlertCircle size={14} className="shrink-0" />
                  <span>{passwordError}</span>
                </div>
              )}
            </div>

            <button type="submit" className="w-full bg-gradient-to-r from-sky-600 to-indigo-600 hover:from-sky-700 hover:to-indigo-700 text-white font-bold py-3.5 rounded-2xl text-sm shadow-lg mt-2">
              {authMode === 'login' ? 'Entrar a mi cuenta' : 'Registrarme (Requiere aprobación)'}
            </button>

            {authMode === 'login' && (
              <div className="text-center pt-2">
                <button type="button" onClick={() => setShowResetModal(true)} className="text-xs font-bold text-sky-600 hover:underline">
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
                <input type="email" placeholder="Tu correo electrónico..." value={resetEmailInput} onChange={(e) => setResetEmailInput(e.target.value)} className="w-full bg-sky-50/50 border border-sky-200 rounded-2xl px-4 py-3 text-xs text-slate-800 focus:outline-none" required />
                <input type="password" placeholder="Nueva contraseña deseada..." value={resetNewPasswordInput} onChange={(e) => setResetNewPasswordInput(e.target.value)} className="w-full bg-sky-50/50 border border-sky-200 rounded-2xl px-4 py-3 text-xs text-slate-800 focus:outline-none" required />
                <div className="flex gap-2 pt-1">
                  <button type="button" onClick={() => setShowResetModal(false)} className="w-1/2 bg-sky-50 text-slate-700 font-bold py-2.5 rounded-2xl text-xs border border-sky-200">Cancelar</button>
                  <button type="submit" className="w-1/2 bg-sky-600 hover:bg-sky-700 text-white font-bold py-2.5 rounded-2xl text-xs shadow">Enviar</button>
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

    const totalSpent = validExpenses.reduce((acc, c) => acc + Number(c.amount), 0);
    const perPerson = validMembers.length > 0 ? (totalSpent / validMembers.length) : 0;
    
    const selectedSpots = validSpots.filter(s => s.active_now);
    const pendingSpots = validSpots.filter(s => !s.active_now);
    const currentSpotHere = validSpots.find(s => s.is_current_here);

    const calculatedDebts = calculateDebts(validMembers, validExpenses);
    const isCreator = activeEvent.creator_name === currentUser.name;
    const isClosed = activeEvent.status === 'closed';
    const maxVotes = Math.max(0, ...validSpots.map(s => s.votes || 0));

    return (
      <div className="min-h-screen bg-gradient-to-br from-sky-50 via-blue-50 to-indigo-100 text-slate-800 pb-28 relative overflow-hidden">
        <div className="fixed top-3 left-4 z-50">
          <button onClick={() => setActiveEvent(null)} className="flex items-center text-xs font-bold text-slate-800 bg-white/95 backdrop-blur-md px-3.5 py-2 rounded-full hover:bg-white shadow-lg border border-sky-200">
            <ArrowLeft size={16} className="mr-1 text-sky-600" /> Volver
          </button>
        </div>

        <div className="relative bg-gradient-to-r from-sky-100 via-blue-100 to-indigo-50 border-b border-sky-200 pt-12 pb-4 px-4 shadow-xs">
          <div className="max-w-md mx-auto space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-[10px] font-black uppercase tracking-wider text-sky-700 bg-white/80 px-2.5 py-0.5 rounded-full border border-sky-200">
                Organiza: {activeEvent.creator_name}
              </span>
              {isClosed ? (
                <span className="text-[9px] font-bold bg-amber-500 text-white px-2.5 py-0.5 rounded-full shadow">🔒 Salida Cerrada</span>
              ) : (
                <span className="text-[9px] font-bold bg-emerald-600 text-white px-2.5 py-0.5 rounded-full shadow">🟢 Plan Activo</span>
              )}
            </div>

            <div className="flex justify-between items-start">
              <div>
                <h1 className="text-xl font-black text-slate-900 tracking-tight">{activeEvent.title}</h1>
                <p className="text-xs text-slate-600 font-medium flex items-center mt-0.5">
                  <Calendar size={13} className="mr-1 text-sky-600" /> Fecha del plan: {activeEvent.date}
                </p>
              </div>

              {!isClosed && activeEvent.live_lat && (
                <button onClick={handleShareLiveLocation} className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold px-3 py-2 rounded-2xl shadow flex items-center space-x-1.5 transition shrink-0">
                  <Share2 size={14} />
                  <span>Compartir GPS</span>
                </button>
              )}
            </div>

            {currentSpotHere && !isClosed && (
              <div className="bg-emerald-500/15 border border-emerald-300 p-2.5 rounded-2xl flex justify-between items-center text-xs">
                <div className="flex items-center space-x-2">
                  <Radio size={16} className="text-emerald-600 animate-pulse shrink-0" />
                  <span className="font-bold text-slate-800">Ubicación Actual: <span className="text-emerald-700">{currentSpotHere.name}</span></span>
                </div>
              </div>
            )}
          </div>
        </div>

        <main className="max-w-md mx-auto p-4 space-y-4 relative z-10">
          {isCreator && !isClosed && (
            <button onClick={handleCloseEvent} className="w-full bg-gradient-to-r from-amber-600 to-orange-600 text-white font-bold py-3 px-4 rounded-2xl text-xs shadow-lg flex items-center justify-center space-x-2 border border-amber-500/30">
              <Flag size={16} /> <span>Cerrar Salida y Generar Línea Temporal</span>
            </button>
          )}

          {isClosed ? (
            <div className="space-y-6">
              <div className="bg-white/90 backdrop-blur-2xl p-5 rounded-[2.5rem] border border-sky-100 shadow-xl space-y-4">
                <div className="text-center space-y-1">
                  <span className="text-2xl">⏳</span>
                  <h2 className="text-base font-black text-slate-800">Línea Temporal e Historial: {activeEvent.title}</h2>
                  <p className="text-[11px] text-slate-500">Pulsa sobre cada parada para consultar sus asistentes, gastos y tickets</p>
                </div>

                <div className="bg-sky-50/80 p-3.5 rounded-2xl border border-sky-200 space-y-1.5">
                  <span className="text-[11px] font-bold text-slate-700 flex items-center">
                    <Users size={13} className="mr-1 text-sky-600" /> Asistentes Totales del Plan ({validMembers.length})
                  </span>
                  <p className="text-xs font-medium text-slate-800">{validMembers.join(', ')}</p>
                </div>

                <div className="relative pl-6 space-y-6 before:absolute before:left-2 before:top-2 before:bottom-2 before:w-0.5 before:bg-gradient-to-b before:from-sky-500 before:via-indigo-500 before:to-sky-300">
                  {(selectedSpots.length > 0 ? selectedSpots : validSpots).map((spot, idx) => {
                    const spotExpenses = validExpenses.filter(e => e.spot_id === spot.id);
                    const spotSpent = spotExpenses.reduce((sum, exp) => sum + Number(exp.amount), 0);
                    const spotPhotos = validPhotos.filter(p => p.spot_id === spot.id);
                    const qrLinks = Array.isArray(spot.qr_links) ? spot.qr_links : [];
                    const isExpanded = expandedTimelineSpotId === spot.id;

                    return (
                      <div key={spot.id} className="relative group">
                        <div className="absolute -left-6 top-3.5 w-4 h-4 bg-sky-600 rounded-full border-2 border-white flex items-center justify-center shadow-md"></div>
                        <div onClick={() => setExpandedTimelineSpotId(isExpanded ? null : spot.id)} className={`p-4 rounded-3xl border transition cursor-pointer backdrop-blur-xl ${isExpanded ? 'bg-sky-50/90 border-sky-300 shadow-lg' : 'bg-white/90 border-sky-100'}`}>
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
                              {qrLinks.length > 0 && (
                                <div className="space-y-1.5">
                                  <span className="text-xs font-bold text-slate-700">Enlaces y Cartas QR</span>
                                  <div className="flex flex-wrap gap-1.5">
                                    {qrLinks.map((item, i) => {
                                      const [label, url] = item.split('|');
                                      return (
                                        <a key={i} href={url} target="_blank" rel="noreferrer" onClick={(e) => e.stopPropagation()} className="bg-sky-100 text-sky-800 text-xs font-bold px-2.5 py-1 rounded-xl border border-sky-200 flex items-center">
                                          <ExternalLink size={11} className="mr-1" /> {label}
                                        </a>
                                      );
                                    })}
                                  </div>
                                </div>
                              )}

                              {spotPhotos.length > 0 && (
                                <div className="space-y-1.5">
                                  <span className="text-xs font-bold text-slate-700">Fotos de la parada</span>
                                  <div className="flex gap-2 overflow-x-auto py-1">
                                    {spotPhotos.map(p => (
                                      <div key={p.id} onClick={(e) => { e.stopPropagation(); setViewingPhotoUrl(p.url); }} className="w-16 h-16 rounded-xl overflow-hidden border border-sky-200 shrink-0 cursor-pointer">
                                        <img src={p.url} alt="Foto" className="w-full h-full object-cover" />
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              )}

                              <div className="space-y-2">
                                <span className="text-xs font-bold text-slate-700 flex items-center">
                                  <Receipt size={14} className="mr-1 text-emerald-600" /> Gastos de la parada ({spotSpent.toFixed(2)}€)
                                </span>
                                {spotExpenses.length === 0 ? (
                                  <p className="text-[11px] text-slate-400">Sin gastos registrados en este sitio.</p>
                                ) : (
                                  spotExpenses.map(exp => {
                                    const parts = Array.isArray(exp.participants) ? exp.participants : validMembers;
                                    return (
                                      <div key={exp.id} className="flex justify-between items-center text-xs bg-white p-3 rounded-2xl border border-sky-100">
                                        <div>
                                          <p className="font-bold text-slate-800">{exp.description}</p>
                                          <p className="text-[10px] text-slate-500">
                                            Pagado por <span className="font-bold text-sky-600">{exp.paid_by}</span> • Reparto: {parts.join(', ')}
                                          </p>
                                        </div>
                                        <div className="flex items-center space-x-2">
                                          <span className="font-bold text-emerald-700">{Number(exp.amount).toFixed(2)}€</span>
                                          {exp.receipt_url && (
                                            <button type="button" onClick={(e) => { e.stopPropagation(); setViewingReceiptUrl(exp.receipt_url); }} className="p-2 bg-sky-50 text-sky-700 rounded-xl border border-sky-200">
                                              <Receipt size={14} />
                                            </button>
                                          )}
                                        </div>
                                      </div>
                                    );
                                  })
                                )}
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
                          <button type="button" onClick={() => handleRemoveMember(member)} className="text-slate-400 hover:text-red-600">
                            <UserMinus size={13} />
                          </button>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="flex bg-white/90 backdrop-blur-xl p-1 rounded-2xl border border-sky-100 shadow-sm" role="tablist">
                <button onClick={() => setEventSubTab('spots')} role="tab" aria-selected={eventSubTab === 'spots'} className={`flex-1 py-2 text-xs font-bold rounded-xl transition ${eventSubTab === 'spots' ? 'bg-sky-600 text-white shadow-md' : 'text-slate-600'}`}>Ruta y Sitios</button>
                <button onClick={() => setEventSubTab('expenses')} role="tab" aria-selected={eventSubTab === 'expenses'} className={`flex-1 py-2 text-xs font-bold rounded-xl transition ${eventSubTab === 'expenses' ? 'bg-sky-600 text-white shadow-md' : 'text-slate-600'}`}>Gastos</button>
                <button onClick={() => setEventSubTab('gallery')} role="tab" aria-selected={eventSubTab === 'gallery'} className={`flex-1 py-2 text-xs font-bold rounded-xl transition ${eventSubTab === 'gallery' ? 'bg-sky-600 text-white shadow-md' : 'text-slate-600'}`}>Fotos ({validPhotos.length})</button>
              </div>

              {eventSubTab === 'spots' && (
                <div className="space-y-4">
                  <div className="bg-white/90 backdrop-blur-2xl p-4 rounded-3xl border border-sky-100 shadow-sm space-y-3">
                    <h3 className="text-xs font-black text-slate-800">Proponer nuevo sitio</h3>
                    <form onSubmit={handleAddSpot} className="space-y-2.5">
                      <input type="text" placeholder="Ej. Bar Shiko..." value={newSpotName} onChange={(e) => setNewSpotName(e.target.value)} className="w-full bg-sky-50/50 border border-sky-200 rounded-2xl px-4 py-2.5 text-xs text-slate-800 focus:outline-none" />
                      <button type="submit" className="w-full bg-sky-600 hover:bg-sky-700 text-white text-xs font-bold rounded-2xl py-2.5 shadow">
                        🔍 Añadir a la ruta
                      </button>
                    </form>
                  </div>

                  <div className="space-y-3">
                    <h4 className="text-xs font-black uppercase text-sky-800 flex items-center justify-between">
                      <span>Ruta Ordenada ({selectedSpots.length})</span>
                      <span className="text-[10px] text-slate-500 font-medium">Usa ⬆️/⬇️ para reordenar</span>
                    </h4>
                    {selectedSpots.map((spot) => renderSpotCard(spot, true, maxVotes, selectedSpots))}
                  </div>

                  <div className="space-y-3 pt-2">
                    <h4 className="text-xs font-black uppercase text-slate-700">Propuestas Pendientes ({pendingSpots.length})</h4>
                    {pendingSpots.map((spot) => renderSpotCard(spot, false, maxVotes, selectedSpots))}
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
                    <input type="text" placeholder="Concepto (ej. Cervezas, Comida...)" value={expenseDesc} onChange={(e) => setExpenseDesc(e.target.value)} className="w-full bg-sky-50/50 border border-sky-200 rounded-2xl px-3.5 py-2.5 text-xs text-slate-800 focus:outline-none" required />
                    <input type="number" step="0.01" placeholder="Importe (€)" value={expenseAmount} onChange={(e) => setExpenseAmount(e.target.value)} className="w-full bg-sky-50/50 border border-sky-200 rounded-2xl px-3.5 py-2.5 text-xs text-slate-800 focus:outline-none" required />

                    <div className="space-y-1">
                      <label className="block text-[11px] font-bold text-slate-700">Ubicación / Sitio del Gasto</label>
                      <select value={expenseSpotId} onChange={(e) => setExpenseSpotId(e.target.value)} className="w-full bg-sky-50/50 border border-sky-200 rounded-2xl px-3.5 py-2.5 text-xs text-slate-800 focus:outline-none">
                        <option value="">Selecciona un sitio del plan...</option>
                        {validSpots.map((spot) => (
                          <option key={spot.id} value={spot.id}>{spot.name}</option>
                        ))}
                      </select>
                    </div>

                    <div className="space-y-1.5 pt-1">
                      <label className="block text-[11px] font-bold text-slate-700">¿Quiénes participan en este gasto?</label>
                      <div className="flex flex-wrap gap-1.5 bg-sky-50/50 p-2.5 rounded-2xl border border-sky-200">
                        {validMembers.map((member) => {
                          const isParticipant = Array.isArray(expenseParticipants) && expenseParticipants.includes(member);
                          return (
                            <button key={member} type="button" onClick={() => toggleExpenseParticipant(member)} className={`text-xs px-2.5 py-1.5 rounded-xl font-bold border transition flex items-center space-x-1 ${isParticipant ? 'bg-sky-600 text-white border-sky-600' : 'bg-white text-slate-500 border-sky-200'}`}>
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
                          <img src={expenseReceiptUrl} alt="Ticket" className="w-full h-full object-cover" />
                        </div>
                      )}
                    </div>

                    <button type="submit" className="w-full bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-2xl py-2.5 shadow mt-1">
                      Añadir Gasto al Sitio
                    </button>
                  </form>
                </div>
              )}

              {eventSubTab === 'gallery' && (
                <div className="space-y-5">
                  <div className="bg-white/90 backdrop-blur-2xl p-4 rounded-3xl border border-sky-100 shadow-sm space-y-3">
                    <h3 className="text-xs font-bold text-slate-800">Subir nueva foto al plan</h3>
                    <select value={photoSpotId} onChange={(e) => setPhotoSpotId(e.target.value)} className="w-full bg-sky-50/50 border border-sky-200 rounded-2xl px-3.5 py-2.5 text-xs text-slate-800 focus:outline-none" required>
                      <option value="">Selecciona el sitio de la foto...</option>
                      {validSpots.map((spot) => (
                        <option key={spot.id} value={spot.id}>{spot.name}</option>
                      ))}
                    </select>

                    <label className="flex flex-col items-center justify-center border-2 border-dashed border-sky-300 bg-sky-50/60 rounded-3xl p-6 cursor-pointer hover:bg-sky-100 transition">
                      <Camera className="w-6 h-6 text-sky-600 mb-1" />
                      <span className="text-xs font-bold text-sky-900">
                        {isUploadingPhoto ? 'Guardando foto...' : 'Tomar / Subir foto para este sitio'}
                      </span>
                      <input type="file" accept="image/*" capture="environment" onChange={handlePhotoUpload} className="hidden" />
                    </label>
                  </div>
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
                <button onClick={() => setViewingReceiptUrl(null)} className="p-1 bg-sky-50 rounded-full text-slate-600"><X size={18} /></button>
              </div>
              <div className="w-full max-h-96 rounded-2xl overflow-hidden border border-sky-200 bg-sky-50 flex items-center justify-center">
                <img src={viewingReceiptUrl} alt="Ticket" className="w-full h-auto object-contain max-h-96" />
              </div>
              <button onClick={() => setViewingReceiptUrl(null)} className="w-full bg-sky-600 text-white font-bold py-2.5 rounded-xl text-xs">Cerrar</button>
            </div>
          </div>
        )}

        {viewingPhotoUrl && (
          <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white max-w-sm w-full p-4 rounded-[2rem] shadow-2xl space-y-4 border border-sky-100 text-center">
              <div className="flex justify-between items-center px-1">
                <h3 className="font-black text-slate-800 text-sm">Foto del Plan</h3>
                <button onClick={() => setViewingPhotoUrl(null)} className="p-1 bg-sky-50 rounded-full text-slate-600"><X size={18} /></button>
              </div>
              <div className="w-full max-h-96 rounded-2xl overflow-hidden border border-sky-200 bg-sky-50 flex items-center justify-center">
                <img src={viewingPhotoUrl} alt="Foto" className="w-full h-auto object-contain max-h-96" />
              </div>
              <button onClick={() => setViewingPhotoUrl(null)} className="w-full bg-sky-600 text-white font-bold py-2.5 rounded-xl text-xs">Cerrar</button>
            </div>
          </div>
        )}
      </div>
    );
  }

  const validEvents = Array.isArray(events) ? events : [];
  const myEventsAll = validEvents.filter(e => Array.isArray(e.members) && e.members.includes(currentUser.name) && (e.title.toLowerCase().includes(searchQuery.toLowerCase()) || e.creator_name.toLowerCase().includes(searchQuery.toLowerCase())));
  const activeMyEvents = myEventsAll.filter(e => e.status !== 'closed');
  const closedMyEvents = myEventsAll.filter(e => e.status === 'closed');
  const filteredSearchEvents = validEvents.filter(e => e.status !== 'closed' && (e.title.toLowerCase().includes(searchQuery.toLowerCase()) || e.creator_name.toLowerCase().includes(searchQuery.toLowerCase())));

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
              {activeMyEvents.map((event) => (
                <article key={event.id} onClick={() => setActiveEvent(event)} className="bg-white/90 rounded-2xl border border-sky-100 p-3.5 flex justify-between items-center cursor-pointer shadow-sm hover:shadow">
                  <div>
                    <span className="text-[10px] font-bold bg-sky-50 text-sky-700 px-2.5 py-0.5 rounded-full">📅 {event.date}</span>
                    <h3 className="font-black text-slate-800 text-sm mt-1">{event.title}</h3>
                  </div>
                  <span className="text-xs font-bold text-sky-700 bg-sky-50 px-3 py-2 rounded-xl border border-sky-200">Entrar →</span>
                </article>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'search' && (
          <div className="space-y-4">
            <input type="text" placeholder="Buscar por título o creador..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="w-full bg-white/90 border border-sky-200 rounded-2xl px-4 py-3 text-sm" />
            <div className="space-y-3">
              <h2 className="text-sm font-black text-slate-800 px-1">Salidas Disponibles</h2>
              {filteredSearchEvents.map((event) => (
                <article key={event.id} className="bg-white/90 rounded-2xl border border-sky-100 p-4 shadow-sm flex justify-between items-center">
                  <div>
                    <span className="text-[10px] font-bold text-sky-700 bg-sky-50 px-2 py-0.5 rounded-full">📅 {event.date} • {event.creator_name}</span>
                    <h3 className="font-bold text-sm text-slate-800 mt-1">{event.title}</h3>
                  </div>
                  <button onClick={() => setActiveEvent(event)} className="text-xs font-bold text-sky-700 bg-sky-50 px-3 py-2 rounded-xl border">Ver Plan</button>
                </article>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'profile' && (
          <div className="space-y-4">
            <div className="bg-white/90 backdrop-blur-2xl p-6 rounded-[2.5rem] border border-sky-100 shadow-sm space-y-4">
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 bg-sky-100 rounded-2xl flex items-center justify-center text-sky-700 font-black text-lg">
                  {currentUser.name.charAt(0).toUpperCase()}
                </div>
                <div>
                  <h2 className="font-black text-slate-800 text-base">{currentUser.name}</h2>
                  <p className="text-xs text-slate-500">{currentUser.email}</p>
                </div>
              </div>

              <form onSubmit={handleSaveProfile} className="pt-2 border-t border-sky-100 space-y-4">
                <h3 className="text-xs font-black uppercase text-slate-700 flex items-center">
                  <Edit3 size={14} className="mr-1 text-sky-600" /> Editar Datos del Perfil
                </h3>

                <div className="space-y-1">
                  <label className="block text-[11px] font-bold text-slate-700">Nombre de Usuario</label>
                  <input type="text" value={editNameInput} onChange={(e) => setEditNameInput(e.target.value)} className="w-full bg-sky-50/50 border border-sky-200 rounded-2xl px-4 py-2.5 text-xs text-slate-800 focus:outline-none" required />
                </div>

                <div className="space-y-1">
                  <label className="block text-[11px] font-bold text-slate-700">Correo Electrónico</label>
                  <input type="email" value={editEmailInput} onChange={(e) => setEditEmailInput(e.target.value)} className="w-full bg-sky-50/50 border border-sky-200 rounded-2xl px-4 py-2.5 text-xs text-slate-800 focus:outline-none" required />
                </div>

                <div className="pt-2 border-t border-sky-100 space-y-3">
                  <h3 className="text-xs font-black uppercase text-slate-700 flex items-center">
                    <Lock size={14} className="mr-1 text-sky-600" /> Cambio de Contraseña
                  </h3>
                  <input type="password" placeholder="Contraseña actual" value={oldPasswordInput} onChange={(e) => setOldPasswordInput(e.target.value)} className="w-full bg-sky-50/50 border border-sky-200 rounded-2xl px-4 py-2.5 text-xs text-slate-800 focus:outline-none" />
                  <input type="password" placeholder="Nueva contraseña" value={newPasswordInput} onChange={(e) => setNewPasswordInput(e.target.value)} className="w-full bg-sky-50/50 border border-sky-200 rounded-2xl px-4 py-2.5 text-xs text-slate-800 focus:outline-none" />
                  <input type="password" placeholder="Repetir nueva contraseña" value={confirmNewPasswordInput} onChange={(e) => setConfirmNewPasswordInput(e.target.value)} className="w-full bg-sky-50/50 border border-sky-200 rounded-2xl px-4 py-2.5 text-xs text-slate-800 focus:outline-none" />
                </div>

                {profileMessage && <div className={`p-3 rounded-2xl text-xs font-bold ${profileMessage.startsWith('✅') ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700'}`}>{profileMessage}</div>}

                <button type="submit" className="w-full bg-sky-600 hover:bg-sky-700 text-white font-bold py-3 rounded-2xl text-xs shadow">
                  Guardar Cambios
                </button>
              </form>
            </div>
          </div>
        )}

        {activeTab === 'notifications' && (
          <div className="space-y-4">
            {isAdmin && pendingRegistrations.length > 0 && (
              <div className="bg-white/90 p-5 rounded-[2.5rem] border border-emerald-100 shadow-sm space-y-3">
                <h2 className="text-sm font-black text-slate-800 flex items-center">
                  <ShieldCheck size={16} className="mr-1.5 text-emerald-600" /> Registros Pendientes ({pendingRegistrations.length})
                </h2>
                <div className="space-y-2">
                  {pendingRegistrations.map(reg => (
                    <div key={reg.id} className="p-3.5 rounded-2xl border border-emerald-200 bg-emerald-50/50 flex justify-between items-center text-xs">
                      <div>
                        <p className="font-bold text-slate-800">{reg.name}</p>
                        <p className="text-[10px] text-slate-500">{reg.email}</p>
                      </div>
                      <div className="flex gap-1.5">
                        <button onClick={() => handleApproveRegistration(reg.id, reg.name)} className="px-3 py-1.5 rounded-xl font-bold bg-emerald-600 text-white">Aprobar</button>
                        <button onClick={() => handleRejectRegistration(reg.id)} className="px-3 py-1.5 rounded-xl font-bold bg-red-100 text-red-700">Rechazar</button>
                      </div>
                    </div>
                  ))}
                </div>
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
        <button onClick={() => setActiveTab('profile')} className={`flex flex-col items-center ${activeTab === 'profile' ? 'text-sky-600 font-bold' : 'text-slate-500'}`}>
          <Settings size={20} />
          <span className="text-[10px] mt-0.5">Perfil</span>
        </button>
        <button onClick={() => setActiveTab('notifications')} className={`flex flex-col items-center relative ${activeTab === 'notifications' ? 'text-sky-600 font-bold' : 'text-slate-500'}`}>
          <Inbox size={20} />
          <span className="text-[10px] mt-0.5">Aprobaciones</span>
          {pendingRegistrations.length > 0 && <span className="absolute -top-1 -right-1 bg-red-600 text-white text-[9px] w-4 h-4 rounded-full flex items-center justify-center font-bold">{pendingRegistrations.length}</span>}
        </button>
      </nav>
    </div>
  );
}
