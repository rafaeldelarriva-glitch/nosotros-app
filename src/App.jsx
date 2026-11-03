import React, { useState, useEffect } from 'react';
import { 
  Users, MapPin, DollarSign, Plus, CheckCircle, 
  Clock, Camera, Navigation, ArrowRight, Trash2, Shield, Calendar, Sparkles, User, Lock, Mail, Bell, Search, Check, X, UserPlus, Inbox, ArrowLeft, Image as ImageIcon, Utensils, Beer, PartyPopper, Compass, Flag, ThumbsUp, Trophy, Receipt, AlertCircle, ChevronRight, MessageSquare, Send, Map, CheckSquare, ListPlus, UserMinus, ShieldAlert, KeyRound, Archive, Share2, ArrowUp, ArrowDown, Radio, Settings, ShieldCheck, Edit3, QrCode, ExternalLink, Ban, UserCheck, Crosshair, Key
} from 'lucide-react';
import { supabase } from './supabaseClient';

export default function App() {
  const [currentUser, setCurrentUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);
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

  // Perfiles, solicitudes y administración
  const [registeredUsers, setRegisteredUsers] = useState([]);
  const [passwordRequests, setPasswordRequests] = useState([]);
  const [pendingRegistrations, setPendingRegistrations] = useState([]);

  // Modal Admin Cambio Contraseña Usuario
  const [adminTargetUser, setAdminTargetUser] = useState(null);
  const [adminNewPasswordInput, setAdminNewPasswordInput] = useState('');
  const [adminPasswordMessage, setAdminPasswordMessage] = useState('');

  // Perfil
  const [editNameInput, setEditNameInput] = useState('');
  const [editEmailInput, setEditEmailInput] = useState('');
  const [oldPasswordInput, setOldPasswordInput] = useState('');
  const [newPasswordInput, setNewPasswordInput] = useState('');
  const [confirmNewPasswordInput, setConfirmNewPasswordInput] = useState('');
  const [profileMessage, setProfileMessage] = useState('');

  // Sitios, Autocompletado OpenStreetMap y GPS
  const [newSpotName, setNewSpotName] = useState('');
  const [osmSuggestions, setOsmSuggestions] = useState([]);
  const [isSearchingOsm, setIsSearchingOsm] = useState(false);
  const [isGettingLocation, setIsGettingLocation] = useState(false);
  const [searchLocation, setSearchLocation] = useState(null);
  const [isSettingSearchLocation, setIsSettingSearchLocation] = useState(false);
  const [activeQrSpotId, setActiveQrSpotId] = useState(null);
  const [customQrLabel, setCustomQrLabel] = useState('');
  const [customQrUrl, setCustomQrUrl] = useState('');

  // Gastos y Tickets Inteligentes (Garantizamos array limpio)
  const [expenseDesc, setExpenseDesc] = useState('');
  const [expenseAmount, setExpenseAmount] = useState('');
  const [expenseSpotId, setExpenseSpotId] = useState('');
  const [expenseReceiptUrl, setExpenseReceiptUrl] = useState('');
  const [isUploadingReceipt, setIsUploadingReceipt] = useState(false);
  const [expenseParticipants, setExpenseParticipants] = useState([]);
  const [viewingReceiptUrl, setViewingReceiptUrl] = useState(null);

  // Fotos y Comentarios
  const [photoSpotId, setPhotoSpotId] = useState('');
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);
  const [viewingPhotoUrl, setViewingPhotoUrl] = useState(null);
  const [spotCommentInputs, setSpotCommentInputs] = useState({});
  const [expandedTimelineSpotId, setExpandedTimelineSpotId] = useState(null);

  const [events, setEvents] = useState([]);

  // Cargar sesión activa al iniciar
  useEffect(() => {
    const checkSession = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user) {
          const { data: profile } = await supabase.from('profiles').select('*').eq('id', session.user.id).maybeSingle();
          const userDisplayName = profile?.name || session.user.email?.split('@')[0] || 'Usuario';
          const userRole = profile?.role || 'user';
          setCurrentUser({ id: session.user.id, name: userDisplayName, email: session.user.email, role: userRole });
        }
      } catch (err) {
        console.error('Error comprobando sesión:', err);
      } finally {
        setAuthLoading(false);
      }
    };
    checkSession();
  }, []);

  useEffect(() => {
    if (currentUser) {
      refreshAllData();
      setEditNameInput(currentUser.name || '');
      setEditEmailInput(currentUser.email || '');
    }
  }, [currentUser]);

  // Sincronizar participantes al entrar al evento
  useEffect(() => {
    if (activeEvent && Array.isArray(activeEvent.members)) {
      setExpenseParticipants([...activeEvent.members]);
    }
  }, [activeEvent?.id]);

  // Búsqueda de sitios con Photon (OpenStreetMap), priorizando la ubicación GPS del usuario cuando la autoriza.
  useEffect(() => {
    const query = newSpotName.trim();
    if (query.length < 3) {
      setOsmSuggestions([]);
      setIsSearchingOsm(false);
      return;
    }

    let cancelled = false;
    const controller = new AbortController();
    const timer = setTimeout(async () => {
      setIsSearchingOsm(true);
      try {
        const params = new URLSearchParams({
          q: query,
          zoom: searchLocation ? '14' : '12',
          limit: '8',
          lang: 'es',
          countrycode: 'es'
        });
        // Photon usa lat/lon como sesgo geográfico: acerca los primeros resultados a la ubicación del usuario.
        if (searchLocation?.lat && searchLocation?.lon) {
          params.set('lat', String(searchLocation.lat));
          params.set('lon', String(searchLocation.lon));
        }
        const res = await fetch(`https://photon.komoot.io/api/?${params.toString()}`, {
          signal: controller.signal,
          headers: { Accept: 'application/json' }
        });
        if (!res.ok) throw new Error(`Error de búsqueda (${res.status})`);
        const data = await res.json();
        const features = Array.isArray(data?.features) ? data.features : [];
        const suggestions = features.map((feature, index) => {
          const props = feature.properties || {};
          const mainName = props.name || props.street || props.city || 'Lugar sin nombre';
          const locality = [props.district, props.city, props.state, props.country]
            .filter((value, i, arr) => value && arr.indexOf(value) === i && value !== mainName)
            .join(', ');
          return {
            id: props.osm_id || `${mainName}-${index}`,
            name: mainName,
            display_name: locality ? `${mainName} · ${locality}` : mainName,
            lat: feature.geometry?.coordinates?.[1],
            lon: feature.geometry?.coordinates?.[0],
            properties: props
          };
        });
        if (!cancelled) setOsmSuggestions(suggestions);
      } catch (err) {
        if (err.name !== 'AbortError') {
          console.error('Error buscando sitios con Photon:', err);
          if (!cancelled) setOsmSuggestions([]);
        }
      } finally {
        if (!cancelled) setIsSearchingOsm(false);
      }
    }, 450);

    return () => {
      cancelled = true;
      clearTimeout(timer);
      controller.abort();
    };
  }, [newSpotName, searchLocation]);

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
          rawEventMembers: rawMembers,
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
        const { data: foundProfile, error: profileErr } = await supabase
          .from('profiles')
          .select('email')
          .ilike('name', loginEmail)
          .maybeSingle();

        if (profileErr || !foundProfile || !foundProfile.email) {
          alert('No se encontró ningún usuario registrado con ese nombre.');
          return;
        }
        loginEmail = foundProfile.email;
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

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setCurrentUser(null);
    setActiveEvent(null);
  };

  const handleApproveRegistration = async (userId, userName) => {
    try {
      await supabase.from('profiles').update({ is_approved: true }).eq('id', userId);
      alert(`✅ Usuario ${userName} aprobado.`);
      await refreshAllData();
    } catch (err) {
      alert('Error: ' + err.message);
    }
  };

  const handleRejectRegistration = async (userId) => {
    if (!confirm('¿Rechazar y eliminar esta solicitud?')) return;
    try {
      await supabase.from('profiles').delete().eq('id', userId);
      await refreshAllData();
    } catch (err) {
      alert('Error: ' + err.message);
    }
  };

  const handleToggleBlockUser = async (userId, currentBlockedState, userName) => {
    if (!confirm(`¿Estás seguro de ${currentBlockedState ? 'desbloquear' : 'bloquear/anular'} a ${userName}?`)) return;
    try {
      await supabase.from('profiles').update({ is_blocked: !currentBlockedState }).eq('id', userId);
      alert(`Usuario ${userName} ${currentBlockedState ? 'desbloqueado' : 'bloqueado'}.`);
      await refreshAllData();
    } catch (err) {
      alert('Error al cambiar estado del usuario: ' + err.message);
    }
  };

  const handleAdminChangePassword = async (e) => {
    e.preventDefault();
    if (!adminTargetUser || !adminNewPasswordInput) return;

    const errorMsg = validateStrongPassword(adminNewPasswordInput);
    if (errorMsg) {
      setAdminPasswordMessage('❌ Contraseña débil: ' + errorMsg);
      return;
    }

    try {
      const { error } = await supabase.rpc('admin_update_user_password', {
        target_user_id: adminTargetUser.id,
        new_password: adminNewPasswordInput
      });

      if (error) throw error;

      setAdminPasswordMessage('✅ ¡Contraseña actualizada con éxito para ' + adminTargetUser.name + '!');
      setTimeout(() => {
        setAdminTargetUser(null);
        setAdminNewPasswordInput('');
        setAdminPasswordMessage('');
      }, 1500);
    } catch (err) {
      setAdminPasswordMessage('❌ Error: ' + (err.message || 'Crea la función RPC en Supabase.'));
    }
  };

  const handleApproveEventJoin = async (eventId, userName) => {
    try {
      const { error } = await supabase
        .from('event_members')
        .update({ status: 'member' })
        .eq('event_id', eventId)
        .eq('user_name', userName);

      if (error) throw error;

      alert(`✅ ${userName} añadido al plan.`);
      
      await refreshAllData();

      if (activeEvent && activeEvent.id === eventId) {
        const { data: updatedEvents } = await supabase
          .from('events')
          .select(`*, spots(*), expenses(*), photos(*), comments(*), event_members(*)`)
          .eq('id', eventId)
          .single();

        if (updatedEvents) {
          const rawMembers = Array.isArray(updatedEvents.event_members) ? updatedEvents.event_members : [];
          const rawSpots = Array.isArray(updatedEvents.spots) ? updatedEvents.spots : [];
          rawSpots.sort((a, b) => (a.stop_order || 0) - (b.stop_order || 0));

          setActiveEvent({
            ...updatedEvents,
            status: updatedEvents.status || 'active',
            members: rawMembers.filter(m => m.status === 'member').map(m => m.user_name),
            pendingInvitations: rawMembers.filter(m => m.status === 'pending_invite').map(m => m.user_name),
            pendingRequests: rawMembers.filter(m => m.status === 'pending_request').map(m => m.user_name),
            rawEventMembers: rawMembers,
            spots: rawSpots,
            expenses: Array.isArray(updatedEvents.expenses) ? updatedEvents.expenses : [],
            photos: Array.isArray(updatedEvents.photos) ? updatedEvents.photos : [],
            comments: Array.isArray(updatedEvents.comments) ? updatedEvents.comments : []
          });
        }
      }
    } catch (err) {
      alert('Error al aprobar usuario en plan: ' + err.message);
    }
  };

  const handleRejectEventJoin = async (eventId, userName) => {
    if (!confirm(`¿Rechazar la solicitud de ${userName}?`)) return;
    try {
      await supabase.from('event_members').delete().eq('event_id', eventId).eq('user_name', userName);
      await refreshAllData();
    } catch (err) {
      alert('Error al rechazar usuario: ' + err.message);
    }
  };

  const handleDeleteEvent = async (eventId, eventTitle) => {
    if (!confirm(`⚠️ ¿Estás seguro de ELIMINAR por completo el plan "${eventTitle}"? Esta acción borrará sus sitios, gastos y fotos asociados.`)) return;
    try {
      await supabase.from('spots').delete().eq('event_id', eventId);
      await supabase.from('expenses').delete().eq('event_id', eventId);
      await supabase.from('photos').delete().eq('event_id', eventId);
      await supabase.from('comments').delete().eq('event_id', eventId);
      await supabase.from('event_members').delete().eq('event_id', eventId);
      
      const { error } = await supabase.from('events').delete().eq('id', eventId);
      if (error) throw error;

      alert(`✅ Plan "${eventTitle}" eliminado correctamente.`);
      setActiveEvent(null);
      await refreshAllData();
    } catch (err) {
      alert('Error al eliminar el plan: ' + err.message);
    }
  };

  const handleSetSearchLocation = () => {
    if (!navigator.geolocation) {
      alert('Tu navegador no soporta geolocalización.');
      return;
    }
    setIsSettingSearchLocation(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setSearchLocation({ lat: pos.coords.latitude, lon: pos.coords.longitude });
        setIsSettingSearchLocation(false);
      },
      (err) => {
        setIsSettingSearchLocation(false);
        alert(err.code === 1
          ? 'No has permitido el acceso a tu ubicación. Puedes habilitarlo en los permisos del navegador.'
          : 'No se ha podido obtener tu ubicación. Comprueba el GPS o los permisos del navegador.');
      },
      { enableHighAccuracy: false, timeout: 10000, maximumAge: 300000 }
    );
  };

  const handleProposeCurrentGpsLocation = () => {
    if (!navigator.geolocation) {
      alert('Tu navegador no soporta geolocalización GPS.');
      return;
    }
    setIsGettingLocation(true);
    navigator.geolocation.getCurrentPosition(async (pos) => {
      try {
        const { latitude, longitude } = pos.coords;
        setSearchLocation({ lat: latitude, lon: longitude });
        const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`);
        const data = await res.json();
        const detectedName = data.display_name ? data.display_name.split(',')[0] : `Sitio GPS (${latitude.toFixed(4)}, ${longitude.toFixed(4)})`;
        setNewSpotName(detectedName);
        setOsmSuggestions([]);
      } catch (err) {
        alert('No se pudo traducir la posición GPS a nombre de calle.');
      } finally {
        setIsGettingLocation(false);
      }
    }, () => {
      setIsGettingLocation(false);
      alert('No se pudo obtener la posición GPS actual.');
    }, { enableHighAccuracy: true });
  };

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
      let emailChanged = false;
      const newEmailVal = editEmailInput.trim().toLowerCase();

      const updates = { name: editNameInput.trim() };
      if (newEmailVal && newEmailVal !== currentUser?.email?.toLowerCase()) {
        updates.email = newEmailVal;
        emailChanged = true;
      }

      const { error: profileError } = await supabase
        .from('profiles')
        .update(updates)
        .eq('id', currentUser.id);

      if (profileError) throw profileError;

      if (emailChanged) {
        const { error: authError } = await supabase.auth.updateUser({ email: newEmailVal });
        if (authError) throw authError;
      }

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
        const { error: loginError } = await supabase.auth.signInWithPassword({ 
          email: currentUser.email, 
          password: oldPasswordInput 
        });
        if (loginError) {
          setProfileMessage('❌ Contraseña actual incorrecta.');
          return;
        }
        const { error: passError } = await supabase.auth.updateUser({ password: newPasswordInput });
        if (passError) throw passError;
      }

      setCurrentUser({ 
        ...currentUser, 
        name: editNameInput.trim(), 
        email: emailChanged ? newEmailVal : currentUser.email 
      });

      setProfileMessage('✅ ¡Perfil y contraseña actualizados con éxito!');
      setOldPasswordInput('');
      setNewPasswordInput('');
      setConfirmNewPasswordInput('');
      await refreshAllData();
    } catch (err) {
      setProfileMessage('❌ Error: ' + (err.message || 'No se pudo actualizar el perfil.'));
    }
  };

  const handleCreateEvent = async (e) => {
    e.preventDefault();
    if (!newTitle.trim() || !newDate || !currentUser) return;

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
    if (!confirm(`¿Estás seguro de quitar a ${memberName}?`)) return;
    await supabase.from('event_members').delete().eq('event_id', activeEvent.id).eq('user_name', memberName);
    if (memberName === currentUser.name) setActiveEvent(null);
    await refreshAllData();
  };

  const handleAddSpot = async (e) => {
    if (e) e.preventDefault();
    if (!newSpotName.trim() || !activeEvent || !currentUser) return;

    const currentSelectedCount = (activeEvent.spots || []).filter(s => s.active_now).length;

    await supabase.from('spots').insert([{
      event_id: activeEvent.id,
      name: newSpotName.trim(),
      category: 'bar',
      votes: 1,
      suggested_by: currentUser.name,
      active_now: false,
      stop_order: currentSelectedCount + 1
    }]);

    setNewSpotName('');
    setOsmSuggestions([]);
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

  // MANEJO BLINDADO DE SELECCIÓN DE PARTICIPANTES EN EL GASTO
  const handleToggleExpenseParticipant = (memberName) => {
    setExpenseParticipants(prev => {
      const list = Array.isArray(prev) ? [...prev] : [];
      if (list.includes(memberName)) {
        if (list.length === 1) return list; // Evitar dejar 0 participantes
        return list.filter(m => m !== memberName);
      } else {
        return [...list, memberName];
      }
    });
  };

  // Eliminar cualquier gasto del plan (por ejemplo, si alguien lo registra por error).
  const handleDeleteExpense = async (expense) => {
    if (!expense?.id || !activeEvent?.id) return;

    const confirmed = window.confirm(
      `¿Quieres eliminar el gasto \"${expense.description}\" de ${Number(expense.amount || 0).toFixed(2)}€?\n\nSe actualizarán automáticamente el total y la liquidación de deudas. Esta acción no se puede deshacer.`
    );
    if (!confirmed) return;

    try {
      const { error } = await supabase
        .from('expenses')
        .delete()
        .eq('id', expense.id)
        .eq('event_id', activeEvent.id);

      if (error) throw error;

      await refreshAllData();
    } catch (err) {
      console.error('Error eliminando gasto:', err);
      alert('No se ha podido eliminar el gasto: ' + (err.message || 'Error desconocido.'));
    }
  };

  // ENVIAR GASTO CON REPARTO INTELIGENTE REAL
  const handleAddExpense = async (e) => {
    e.preventDefault();
    if (!expenseDesc.trim() || !expenseAmount || !activeEvent) return;
    
    // Guardamos únicamente los miembros del plan que estén marcados.
    const eventMembers = Array.isArray(activeEvent.members) ? activeEvent.members : [];
    const selectedNames = new Set((Array.isArray(expenseParticipants) ? expenseParticipants : []).map(name => String(name).trim()));
    const finalParticipants = eventMembers.filter(member => selectedNames.has(String(member).trim()));
    const amount = Number(expenseAmount);
    if (!Number.isFinite(amount) || amount <= 0) {
      alert('Introduce un importe válido mayor que cero.');
      return;
    }
    if (finalParticipants.length === 0) {
      alert('Selecciona al menos una persona para repartir el gasto.');
      return;
    }

    console.log("💰 ENVIANDO GASTO A SUPABASE:", {
      description: expenseDesc.trim(),
      amount: parseFloat(expenseAmount),
      participants: finalParticipants
    });

    const { error } = await supabase.from('expenses').insert([{
      event_id: activeEvent.id,
      description: expenseDesc.trim(),
      amount,
      paid_by: currentUser.name,
      spot_id: expenseSpotId || null,
      receipt_url: expenseReceiptUrl || null,
      participants: finalParticipants // Array exacto seleccionado por el usuario
    }]);

    if (error) {
      alert('❌ Error al guardar el gasto: ' + error.message);
      return;
    }

    setExpenseDesc('');
    setExpenseAmount('');
    setExpenseSpotId('');
    setExpenseReceiptUrl('');
    // El siguiente gasto comienza de nuevo con todos los miembros seleccionados.
    setExpenseParticipants([...eventMembers]);
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

  const handleRequestJoin = async (eventId) => {
    await supabase.from('event_members').insert([{ event_id: eventId, user_name: currentUser.name, status: 'pending_request' }]);
    await refreshAllData();
  };

  const handleCancelRequestJoin = async (eventId) => {
    if (!confirm('¿Cancelar solicitud?')) return;
    await supabase.from('event_members').delete().eq('event_id', eventId).eq('user_name', currentUser.name).eq('status', 'pending_request');
    await refreshAllData();
  };

  // Convierte el campo participants a un array independientemente de cómo
  // lo devuelva Supabase (array nativo, JSON en texto o array PostgreSQL en texto).
  const getExpenseParticipants = (expense, members = []) => {
    const raw = expense?.participants;

    if (Array.isArray(raw)) {
      const selected = raw.map(v => String(v).trim()).filter(Boolean);
      return selected.length ? [...new Set(selected)] : [...members];
    }

    if (typeof raw === 'string' && raw.trim()) {
      const value = raw.trim();
      try {
        const parsed = JSON.parse(value);
        if (Array.isArray(parsed)) {
          const selected = parsed.map(v => String(v).trim()).filter(Boolean);
          return selected.length ? [...new Set(selected)] : [...members];
        }
      } catch (_) {
        // Puede ser un array PostgreSQL: {Rafa,Manolo} o texto separado por comas.
      }

      let items = [];
      if (value.startsWith('{') && value.endsWith('}')) {
        items = value.slice(1, -1).split(',');
      } else if (value.includes(',')) {
        items = value.split(',');
      } else {
        items = [value];
      }
      const selected = items
        .map(v => v.trim().replace(/^"|"$/g, ''))
        .filter(Boolean);
      return selected.length ? [...new Set(selected)] : [...members];
    }

    return [...members];
  };

  // ---------------------------------------------------------------------------
  // ALGORITMO DE LIQUIDACIÓN INTELIGENTE DE DEUDAS
  // ---------------------------------------------------------------------------
  const calculateDebts = (members = [], expenses = []) => {
    if (!Array.isArray(members) || members.length === 0) return [];
    
    const balancesMap = {};
    members.forEach(m => { balancesMap[m] = 0; });

    (expenses || []).forEach(exp => {
      const amount = Number(exp.amount) || 0;
      const paidBy = exp.paid_by;
      
      // Quien paga suma saldo positivo
      if (balancesMap[paidBy] !== undefined) {
        balancesMap[paidBy] += amount;
      }

      // Usar los participantes reales guardados, aunque Supabase los devuelva como texto.
      const parts = getExpenseParticipants(exp, members)
        .filter(person => balancesMap[person] !== undefined);

      if (parts.length === 0) return;
      const share = amount / parts.length;

      // Cada participante del gasto asume su parte proporcional restándola de su balance
      parts.forEach(p => {
        if (balancesMap[p] !== undefined) {
          balancesMap[p] -= share;
        }
      });
    });

    const balances = Object.keys(balancesMap).map(name => ({ name, balance: balancesMap[name] }));
    let debtors = balances.filter(b => b.balance < -0.01).map(d => ({ ...d, balance: Math.abs(d.balance) }));
    let creditors = balances.filter(b => b.balance > 0.01);
    
    const transactions = [];
    let dIndex = 0, cIndex = 0;

    while (dIndex < debtors.length && cIndex < creditors.length) {
      const amount = Math.min(debtors[dIndex].balance, creditors[cIndex].balance);
      if (amount > 0.01) {
        transactions.push({ from: debtors[dIndex].name, to: creditors[cIndex].name, amount });
      }
      debtors[dIndex].balance -= amount;
      creditors[cIndex].balance -= amount;
      if (debtors[dIndex].balance <= 0.01) dIndex++;
      if (creditors[cIndex].balance <= 0.01) cIndex++;
    }
    return transactions;
  };

  const isAdmin = currentUser?.role === 'admin' || currentUser?.email === 'rafa@ejemplo.com';

  const allPendingPlanRequests = events.flatMap(ev => {
    const rawMembers = Array.isArray(ev.rawEventMembers) ? ev.rawEventMembers : [];
    const isUserCreator = ev.creator_name === currentUser?.name;
    
    if (!isUserCreator && !isAdmin) return [];

    return rawMembers
      .filter(m => m.status === 'pending_request' && m.user_name !== ev.creator_name)
      .map(m => ({ eventId: ev.id, eventTitle: ev.title, userName: m.user_name, creatorName: ev.creator_name }));
  });

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

        {/* ENLACES QR / CARTAS */}
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

  if (authLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center text-slate-500 font-bold text-sm">
        Cargando datos...
      </div>
    );
  }

  if (!currentUser) {
    return (
      <main className="min-h-screen bg-gradient-to-br from-sky-50 via-blue-50 to-indigo-100 flex flex-col items-center justify-center p-4 text-slate-800 relative overflow-hidden">
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
            </div>

            <button type="submit" className="w-full bg-gradient-to-r from-sky-600 to-indigo-600 hover:from-sky-700 hover:to-indigo-700 text-white font-bold py-3.5 rounded-2xl text-sm shadow-lg mt-2">
              {authMode === 'login' ? 'Entrar a mi cuenta' : 'Registrarme (Requiere aprobación)'}
            </button>
          </form>
        </div>
      </main>
    );
  }

  if (activeEvent) {
    const validExpenses = Array.isArray(activeEvent.expenses) ? activeEvent.expenses : [];
    const validMembers = Array.isArray(activeEvent.members) ? activeEvent.members : [];
    const validSpots = Array.isArray(activeEvent.spots) ? activeEvent.spots : [];
    const validPhotos = Array.isArray(activeEvent.photos) ? activeEvent.photos : [];

    const totalSpent = validExpenses.reduce((acc, c) => acc + Number(c.amount), 0);
    
    const selectedSpots = validSpots.filter(s => s.active_now);
    const pendingSpots = validSpots.filter(s => !s.active_now);

    const calculatedDebts = calculateDebts(validMembers, validExpenses);
    const isCreator = activeEvent.creator_name === currentUser.name;
    const isClosed = activeEvent.status === 'closed';
    const maxVotes = Math.max(0, ...validSpots.map(s => s.votes || 0));

    const canDeleteEvent = isAdmin || isCreator;

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
          </div>
        </div>

        <main className="max-w-md mx-auto p-4 space-y-4 relative z-10">
          {canDeleteEvent && (
            <button onClick={() => handleDeleteEvent(activeEvent.id, activeEvent.title)} className="w-full bg-red-600 hover:bg-red-700 text-white font-bold py-3 px-4 rounded-2xl text-xs shadow-lg flex items-center justify-center space-x-2 transition">
              <Trash2 size={16} /> <span>Eliminar este Plan por completo</span>
            </button>
          )}

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
                                  <p className="text-[11px] text-slate-400">Sin gastos en este sitio.</p>
                                ) : (
                                  spotExpenses.map(exp => (
                                    <div key={exp.id} className="flex justify-between items-center text-xs bg-white p-3 rounded-2xl border border-sky-100">
                                      <div>
                                        <p className="font-bold text-slate-800">{exp.description}</p>
                                        <p className="text-[10px] text-slate-500">Pagado por {exp.paid_by}</p>
                                      </div>
                                      <div className="flex items-center space-x-2">
                                        <span className="font-bold text-emerald-700">{Number(exp.amount).toFixed(2)}€</span>
                                        {exp.receipt_url && (
                                          <button onClick={(e) => { e.stopPropagation(); setViewingReceiptUrl(exp.receipt_url); }} className="bg-sky-50 text-sky-700 p-1.5 rounded-lg border border-sky-200 text-[10px] font-bold flex items-center">
                                            <Receipt size={12} className="mr-1" /> Ticket
                                          </button>
                                        )}
                                      </div>
                                    </div>
                                  ))
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
                  <div className="bg-white/90 backdrop-blur-2xl p-4 rounded-3xl border border-sky-100 shadow-sm space-y-3 relative">
                    <div className="flex justify-between items-center">
                      <h3 className="text-xs font-black text-slate-800">Proponer nuevo sitio</h3>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={handleSetSearchLocation}
                          disabled={isSettingSearchLocation}
                          className="text-[10px] font-bold text-sky-800 bg-sky-50 hover:bg-sky-100 border border-sky-200 px-2.5 py-1 rounded-xl flex items-center transition"
                        >
                          <Crosshair size={12} className="mr-1 text-sky-600" />
                          {isSettingSearchLocation ? 'Localizando...' : searchLocation ? 'Cerca de mí ✓' : 'Buscar cerca de mí'}
                        </button>
                        <button
                          type="button"
                          onClick={handleProposeCurrentGpsLocation}
                          disabled={isGettingLocation}
                          className="text-[10px] font-bold text-emerald-800 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 px-2.5 py-1 rounded-xl flex items-center transition"
                        >
                          <Crosshair size={12} className="mr-1 text-emerald-600" />
                          {isGettingLocation ? 'Obteniendo GPS...' : 'Marcar con mi GPS'}
                        </button>
                      </div>
                    </div>

                    <form onSubmit={handleAddSpot} className="space-y-2.5 relative">
                      <div className="relative">
                        <input 
                          type="text" 
                          placeholder="Escribe un bar o sitio (ej. Bar Shiko)..." 
                          value={newSpotName} 
                          onChange={(e) => setNewSpotName(e.target.value)} 
                          className="w-full bg-sky-50/50 border border-sky-200 rounded-2xl px-4 py-2.5 text-xs text-slate-800 focus:outline-none" 
                        />
                        {isSearchingOsm && (
                          <span className="absolute right-3 top-2.5 text-[10px] text-sky-600 font-bold animate-pulse">Buscando sitios...</span>
                        )}
                      </div>

                      {osmSuggestions.length > 0 && (
                        <div className="absolute left-0 right-0 top-11 bg-white border border-sky-200 rounded-2xl shadow-xl z-50 max-h-48 overflow-y-auto divide-y divide-sky-100">
                          {osmSuggestions.map((item, idx) => (
                            <div 
                              key={idx} 
                              onClick={() => {
                                setNewSpotName(item.name || item.display_name);
                                setOsmSuggestions([]);
                              }}
                              className="p-2.5 text-xs text-slate-700 hover:bg-sky-50 cursor-pointer transition flex items-start space-x-2"
                            >
                              <MapPin size={14} className="text-sky-600 shrink-0 mt-0.5" />
                              <span className="line-clamp-2">{item.display_name}</span>
                            </div>
                          ))}
                        </div>
                      )}
                      {newSpotName.trim().length >= 3 && !isSearchingOsm && osmSuggestions.length === 0 && (
                        <p className="text-[10px] text-slate-500 px-1">
                          No hay coincidencias. Puedes añadir el nombre manualmente.
                        </p>
                      )}
                      <p className="text-[10px] text-slate-400 px-1">
                        Búsqueda con Photon · Datos de OpenStreetMap. {searchLocation ? 'Resultados priorizados cerca de tu ubicación.' : 'Pulsa «Buscar cerca de mí» para priorizar los resultados según tu ubicación.'}
                      </p>

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
                  <div className="bg-white/90 backdrop-blur-2xl p-4 rounded-3xl border border-sky-100 shadow-sm text-center">
                    <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">TOTAL GASTADO POR EL GRUPO</p>
                    <p className="text-2xl font-black text-emerald-600 mt-0.5">{totalSpent.toFixed(2)}€</p>
                  </div>

                  <div className="bg-gradient-to-br from-slate-900 to-sky-950 text-white p-5 rounded-3xl shadow-lg space-y-3 border border-sky-400/20">
                    <h3 className="text-xs font-black uppercase tracking-wider text-sky-300 flex items-center">
                      <DollarSign size={16} className="mr-1 text-emerald-400" /> Reparto y Liquidación Inteligente de Deudas
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

                  {validExpenses.length > 0 && (
                    <div className="space-y-2">
                      <h4 className="text-xs font-black uppercase text-slate-700">Gastos Registrados ({validExpenses.length})</h4>
                      {validExpenses.map(exp => (
                        <div key={exp.id} className="bg-white/90 p-3.5 rounded-2xl border border-sky-100 flex justify-between items-center text-xs">
                          <div>
                            <p className="font-bold text-slate-800">{exp.description}</p>
                            <p className="text-[10px] text-slate-500">Pagado por <span className="font-bold text-sky-600">{exp.paid_by}</span> • Reparto: <span className="text-slate-700 font-bold">{getExpenseParticipants(exp, validMembers).join(', ')}</span></p>
                          </div>
                          <div className="flex items-center space-x-2">
                            <span className="font-black text-emerald-600 text-sm">{Number(exp.amount).toFixed(2)}€</span>
                            {exp.receipt_url && (
                              <button onClick={() => setViewingReceiptUrl(exp.receipt_url)} className="bg-sky-50 text-sky-700 px-2 py-1 rounded-xl border border-sky-200 text-[10px] font-bold flex items-center">
                                <Receipt size={12} className="mr-1" /> Ver Ticket
                              </button>
                            )}
                            <button
                              type="button"
                              onClick={() => handleDeleteExpense(exp)}
                              title="Eliminar gasto"
                              aria-label={`Eliminar gasto ${exp.description}`}
                              className="bg-red-50 hover:bg-red-100 text-red-600 p-2 rounded-xl border border-red-200 transition"
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  <form onSubmit={handleAddExpense} className="bg-white/90 backdrop-blur-2xl p-4 rounded-3xl border border-sky-100 shadow-sm space-y-3">
                    <h4 className="text-xs font-bold text-slate-800">Añadir nuevo gasto con selección de participantes</h4>
                    <input type="text" placeholder="Concepto (ej. Cervezas)..." value={expenseDesc} onChange={(e) => setExpenseDesc(e.target.value)} className="w-full bg-sky-50/50 border border-sky-200 rounded-2xl px-3.5 py-2.5 text-xs text-slate-800 focus:outline-none" required />
                    <input type="number" step="0.01" placeholder="Importe (€)..." value={expenseAmount} onChange={(e) => setExpenseAmount(e.target.value)} className="w-full bg-sky-50/50 border border-sky-200 rounded-2xl px-3.5 py-2.5 text-xs text-slate-800 focus:outline-none" required />

                    <select value={expenseSpotId} onChange={(e) => setExpenseSpotId(e.target.value)} className="w-full bg-sky-50/50 border border-sky-200 rounded-2xl px-3.5 py-2.5 text-xs text-slate-800 focus:outline-none">
                      <option value="">Selecciona un sitio del plan (Opcional)...</option>
                      {validSpots.map((spot) => (
                        <option key={spot.id} value={spot.id}>{spot.name}</option>
                      ))}
                    </select>

                    <div className="space-y-2 pt-1">
                      <div className="flex items-center justify-between gap-2">
                        <label className="block text-[11px] font-bold text-slate-700">¿Quién participa en este gasto?</label>
                        <span className="text-[10px] font-semibold text-sky-700">{expenseParticipants.length} de {validMembers.length} seleccionados</span>
                      </div>
                      <p className="text-[10px] text-slate-500">Por defecto están todos incluidos. Desmarca a quien no haya participado.</p>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {validMembers.map(member => {
                          const isSelected = Array.isArray(expenseParticipants) && expenseParticipants.includes(member);
                          return (
                            <label key={member} className={`flex items-center gap-2.5 rounded-xl border px-3 py-2.5 text-xs font-semibold cursor-pointer transition ${isSelected ? 'bg-sky-50 border-sky-300 text-sky-900' : 'bg-white border-slate-200 text-slate-600'}`}>
                              <input
                                type="checkbox"
                                checked={isSelected}
                                onChange={() => handleToggleExpenseParticipant(member)}
                                className="h-4 w-4 accent-sky-600"
                              />
                              <span>{member}</span>
                              {isSelected && <span className="ml-auto text-[10px] font-bold text-sky-700">Participa</span>}
                            </label>
                          );
                        })}
                      </div>
                    </div>

                    <div className="space-y-1 pt-1">
                      <label className="block text-[11px] font-bold text-slate-700">Adjuntar Ticket / Recibo (Opcional)</label>
                      <input type="file" accept="image/*" onChange={handleReceiptUpload} className="w-full text-xs text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-sky-50 file:text-sky-700 hover:file:bg-sky-100" />
                      {expenseReceiptUrl && <p className="text-[10px] text-emerald-600 font-bold mt-1">✓ Ticket adjuntado correctamente</p>}
                    </div>

                    <button type="submit" className="w-full bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-2xl py-2.5 shadow mt-1">
                      {isUploadingReceipt ? 'Procesando ticket...' : 'Añadir Gasto Inteligente'}
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
                      <span className="text-xs font-bold text-sky-900">{isUploadingPhoto ? 'Guardando foto...' : 'Tomar / Subir foto'}</span>
                      <input type="file" accept="image/*" capture="environment" onChange={handlePhotoUpload} className="hidden" />
                    </label>
                  </div>

                  {validPhotos.length > 0 && (
                    <div className="space-y-2">
                      <h4 className="text-xs font-black uppercase text-slate-700">Fotos del Plan ({validPhotos.length})</h4>
                      <div className="grid grid-cols-2 gap-3">
                        {validPhotos.map(p => (
                          <div key={p.id} onClick={() => setViewingPhotoUrl(p.url)} className="bg-white/90 p-2 rounded-2xl border border-sky-100 shadow-sm cursor-pointer space-y-1">
                            <div className="w-full h-32 rounded-xl overflow-hidden bg-sky-50">
                              <img src={p.url} alt="Foto" className="w-full h-full object-cover" />
                            </div>
                            <p className="text-[10px] font-bold text-sky-600 text-center">Por {p.user_name}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </>
          )}
        </main>

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

        {viewingReceiptUrl && (
          <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white max-w-sm w-full p-4 rounded-[2rem] shadow-2xl space-y-4 border border-sky-100 text-center">
              <div className="flex justify-between items-center px-1">
                <h3 className="font-black text-slate-800 text-sm">Ticket / Recibo</h3>
                <button onClick={() => setViewingReceiptUrl(null)} className="p-1 bg-sky-50 rounded-full text-slate-600"><X size={18} /></button>
              </div>
              <div className="w-full max-h-96 rounded-2xl overflow-hidden border border-sky-200 bg-sky-50 flex items-center justify-center">
                <img src={viewingReceiptUrl} alt="Ticket" className="w-full h-auto object-contain max-h-96" />
              </div>
              <button onClick={() => setViewingReceiptUrl(null)} className="w-full bg-sky-600 text-white font-bold py-2.5 rounded-xl text-xs">Cerrar</button>
            </div>
          </div>
        )}
      </div>
    );
  }

  const validEvents = Array.isArray(events) ? events : [];
  const myEventsAll = validEvents.filter(e => Array.isArray(e.members) && e.members.includes(currentUser?.name));
  const activeMyEvents = myEventsAll.filter(e => e.status !== 'closed');
  const closedMyEvents = myEventsAll.filter(e => e.status === 'closed');
  const filteredSearchEvents = validEvents.filter(e => e.status !== 'closed' && (e.title?.toLowerCase().includes(searchQuery.toLowerCase()) || e.creator_name?.toLowerCase().includes(searchQuery.toLowerCase())));

  return (
    <div className="min-h-screen bg-gradient-to-br from-sky-50 via-blue-50 to-indigo-100 text-slate-800 pb-28 relative overflow-hidden">
      <header className="bg-white/90 backdrop-blur-2xl border-b border-sky-100 p-4 sticky top-0 z-40 flex justify-between items-center shadow-sm">
        <div className="flex items-center space-x-2">
          <div className="w-9 h-9 bg-gradient-to-tr from-sky-500 to-indigo-600 rounded-2xl flex items-center justify-center text-white font-black text-sm shadow-md">N</div>
          <span className="font-extrabold text-slate-800 text-base">Nosotros</span>
        </div>
        <div className="flex items-center space-x-3">
          <span className="text-xs font-bold text-slate-700">Hola, {currentUser?.name || 'Usuario'}</span>
          <button onClick={handleLogout} className="text-xs bg-sky-50 hover:bg-red-50 text-slate-600 px-3 py-1.5 rounded-full font-bold border border-sky-200">Salir</button>
        </div>
      </header>

      <main className="max-w-md mx-auto p-4 space-y-4">
        {activeTab === 'my-events' && (
          <div className="space-y-6">
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

            <div className="space-y-3 pt-2">
              <h2 className="text-sm font-black text-slate-700 px-1 flex items-center">
                <Archive size={16} className="mr-1.5 text-amber-600" /> Histórico de Salidas Cerradas ({closedMyEvents.length})
              </h2>
              {closedMyEvents.map((event) => (
                <article key={event.id} onClick={() => setActiveEvent(event)} className="bg-amber-50/60 rounded-2xl border border-amber-200 p-3.5 flex justify-between items-center cursor-pointer shadow-xs hover:shadow">
                  <div>
                    <span className="text-[10px] font-bold bg-amber-100 text-amber-800 px-2.5 py-0.5 rounded-full">🔒 Cerrada • {event.date}</span>
                    <h3 className="font-black text-slate-800 text-sm mt-1">{event.title}</h3>
                  </div>
                  <span className="text-xs font-bold text-amber-800 bg-amber-100 px-3 py-2 rounded-xl border border-amber-300">Ver Historial →</span>
                </article>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'search' && (
          <div className="space-y-4">
            <input 
              type="text" 
              placeholder="Buscar por título o creador..." 
              value={searchQuery} 
              onChange={(e) => setSearchQuery(e.target.value)} 
              className="w-full bg-white/90 border border-sky-200 rounded-2xl px-4 py-3 text-sm text-slate-800" 
            />
            <div className="space-y-3">
              <h2 className="text-sm font-black text-slate-800 px-1">Salidas Disponibles ({filteredSearchEvents.length})</h2>
              {filteredSearchEvents.map((event) => {
                const membersList = Array.isArray(event.members) ? event.members : [];
                const pendingReq = Array.isArray(event.pendingRequests) ? event.pendingRequests : [];
                const isMember = membersList.includes(currentUser?.name);
                const hasRequested = pendingReq.includes(currentUser?.name);

                return (
                  <article key={event.id} className="bg-white/90 rounded-2xl border border-sky-100 p-4 shadow-sm flex justify-between items-center">
                    <div>
                      <span className="text-[10px] font-bold text-sky-700 bg-sky-50 px-2 py-0.5 rounded-full">📅 {event.date} • Organiza: {event.creator_name}</span>
                      <h3 className="font-bold text-sm text-slate-800 mt-1">{event.title}</h3>
                    </div>
                    {isMember ? (
                      <button onClick={() => setActiveEvent(event)} className="text-xs font-bold text-sky-700 bg-sky-50 px-3 py-2 rounded-xl border border-sky-200">Ver Plan</button>
                    ) : hasRequested ? (
                      <div className="flex items-center space-x-1.5">
                        <span className="text-xs font-bold text-amber-700 bg-amber-50 px-2.5 py-1.5 rounded-xl border border-amber-200">Solicitado</span>
                        <button onClick={() => handleCancelRequestJoin(event.id)} className="p-1.5 bg-red-50 text-red-600 rounded-xl border border-red-200"><X size={14} /></button>
                      </div>
                    ) : (
                      <button onClick={() => handleRequestJoin(event.id)} className="bg-sky-600 hover:bg-sky-700 text-white text-xs font-bold px-3.5 py-2 rounded-xl shadow">Unirme</button>
                    )}
                  </article>
                );
              })}
            </div>
          </div>
        )}

        {/* PESTAÑA PERFIL Y CAMBIO DE CONTRASEÑA PROPIA */}
        {activeTab === 'profile' && (
          <div className="space-y-4">
            <div className="bg-white/90 backdrop-blur-2xl p-6 rounded-[2.5rem] border border-sky-100 shadow-sm space-y-4">
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 bg-sky-100 rounded-2xl flex items-center justify-center text-sky-700 font-black text-lg">
                  {currentUser?.name ? currentUser.name.charAt(0).toUpperCase() : 'U'}
                </div>
                <div>
                  <h2 className="font-black text-slate-800 text-base">{currentUser?.name || 'Usuario'}</h2>
                  <p className="text-xs text-slate-500">{currentUser?.email || ''}</p>
                </div>
              </div>

              <form onSubmit={handleSaveProfile} className="pt-2 border-t border-sky-100 space-y-4">
                <h3 className="text-xs font-black uppercase text-slate-700 flex items-center">
                  <Edit3 size={14} className="mr-1 text-sky-600" /> Editar Datos y Contraseña
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
                  <h4 className="text-xs font-black uppercase text-slate-700 flex items-center">
                    <Key size={13} className="mr-1 text-sky-600" /> Cambiar Contraseña (Opcional)
                  </h4>
                  <div className="space-y-1">
                    <label className="block text-[10px] font-bold text-slate-600">Contraseña Actual</label>
                    <input type="password" placeholder="••••••••" value={oldPasswordInput} onChange={(e) => setOldPasswordInput(e.target.value)} className="w-full bg-sky-50/50 border border-sky-200 rounded-2xl px-4 py-2 text-xs text-slate-800 focus:outline-none" />
                  </div>
                  <div className="space-y-1">
                    <label className="block text-[10px] font-bold text-slate-600">Nueva Contraseña (mín. 8 caracteres, mayúscula, número y símbolo)</label>
                    <input type="password" placeholder="••••••••" value={newPasswordInput} onChange={(e) => setNewPasswordInput(e.target.value)} className="w-full bg-sky-50/50 border border-sky-200 rounded-2xl px-4 py-2 text-xs text-slate-800 focus:outline-none" />
                  </div>
                  <div className="space-y-1">
                    <label className="block text-[10px] font-bold text-slate-600">Confirmar Nueva Contraseña</label>
                    <input type="password" placeholder="••••••••" value={confirmNewPasswordInput} onChange={(e) => setConfirmNewPasswordInput(e.target.value)} className="w-full bg-sky-50/50 border border-sky-200 rounded-2xl px-4 py-2 text-xs text-slate-800 focus:outline-none" />
                  </div>
                </div>

                {profileMessage && <div className={`p-3 rounded-2xl text-xs font-bold ${profileMessage.startsWith('✅') ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700'}`}>{profileMessage}</div>}

                <button type="submit" className="w-full bg-sky-600 hover:bg-sky-700 text-white font-bold py-3 rounded-2xl text-xs shadow">
                  Guardar Cambios
                </button>
              </form>
            </div>
          </div>
        )}

        {/* PESTAÑA APROBACIONES / PANEL DE ADMINISTRADOR Y SOLICITUDES DE PLANES */}
        {activeTab === 'notifications' && (
          <div className="space-y-4">
            <div className="bg-white/90 p-5 rounded-[2.5rem] border border-sky-100 shadow-sm space-y-3">
              <h2 className="text-sm font-black text-slate-800 flex items-center">
                <UserPlus size={16} className="mr-1.5 text-sky-600" /> Solicitudes para unirse a mis Planes ({allPendingPlanRequests.length})
              </h2>
              {allPendingPlanRequests.length === 0 ? (
                <p className="text-xs text-slate-400">No hay solicitudes pendientes de otros usuarios para tus planes.</p>
              ) : (
                <div className="space-y-2">
                  {allPendingPlanRequests.map((req, idx) => (
                    <div key={idx} className="p-3.5 rounded-2xl border border-sky-200 bg-sky-50/50 flex justify-between items-center text-xs">
                      <div>
                        <p className="font-bold text-slate-800">{req.userName}</p>
                        <p className="text-[10px] text-sky-700 font-bold">Plan: {req.eventTitle}</p>
                      </div>
                      <div className="flex gap-1.5">
                        <button onClick={() => handleApproveEventJoin(req.eventId, req.userName)} className="px-3 py-1.5 rounded-xl font-bold bg-sky-600 text-white">Aprobar</button>
                        <button onClick={() => handleRejectEventJoin(req.eventId, req.userName)} className="px-3 py-1.5 rounded-xl font-bold bg-red-100 text-red-700">Rechazar</button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {isAdmin ? (
              <div className="space-y-4">
                <div className="bg-white/90 p-5 rounded-[2.5rem] border border-emerald-100 shadow-sm space-y-3">
                  <h2 className="text-sm font-black text-slate-800 flex items-center">
                    <ShieldCheck size={16} className="mr-1.5 text-emerald-600" /> Cuentas de Usuario Pendientes ({pendingRegistrations.length})
                  </h2>
                  {pendingRegistrations.length === 0 ? (
                    <p className="text-xs text-slate-400">No hay cuentas nuevas pendientes de aprobación.</p>
                  ) : (
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
                  )}
                </div>

                <div className="bg-white/90 p-5 rounded-[2.5rem] border border-sky-100 shadow-sm space-y-3">
                  <h2 className="text-sm font-black text-slate-800 flex items-center">
                    <Users size={16} className="mr-1.5 text-sky-600" /> Todos los Usuarios Registrados ({registeredUsers.length})
                  </h2>
                  <div className="space-y-2">
                    {registeredUsers.map(usr => (
                      <div key={usr.id} className={`p-3.5 rounded-2xl border flex flex-col space-y-2 text-xs ${usr.is_blocked ? 'bg-red-50/80 border-red-200' : 'bg-white border-sky-100'}`}>
                        <div className="flex justify-between items-center">
                          <div>
                            <p className="font-bold text-slate-800 flex items-center">
                              {usr.name} {usr.role === 'admin' && <span className="ml-1.5 text-[9px] bg-sky-100 text-sky-800 font-bold px-1.5 py-0.5 rounded-full">ADMIN</span>}
                            </p>
                            <p className="text-[10px] text-slate-500">{usr.email}</p>
                          </div>
                          {usr.role !== 'admin' && (
                            <button 
                              onClick={() => handleToggleBlockUser(usr.id, usr.is_blocked, usr.name)} 
                              className={`px-3 py-1.5 rounded-xl font-bold text-xs flex items-center space-x-1 ${usr.is_blocked ? 'bg-emerald-600 text-white' : 'bg-red-100 text-red-700 hover:bg-red-200'}`}
                            >
                              {usr.is_blocked ? <UserCheck size={12} className="mr-1" /> : <Ban size={12} className="mr-1" />}
                              <span>{usr.is_blocked ? 'Desbloquear' : 'Bloquear'}</span>
                            </button>
                          )}
                        </div>

                        <div className="flex justify-end pt-1 border-t border-sky-100">
                          <button 
                            onClick={() => { setAdminTargetUser(usr); setAdminNewPasswordInput(''); setAdminPasswordMessage(''); }} 
                            className="bg-sky-50 hover:bg-sky-100 text-sky-700 font-bold px-3 py-1.5 rounded-xl border border-sky-200 flex items-center space-x-1"
                          >
                            <Key size={12} className="mr-1 text-sky-600" />
                            <span>Cambiar Contraseña</span>
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <div className="bg-white/90 p-6 rounded-[2.5rem] text-center space-y-2 border border-sky-100">
                <Shield size={24} className="mx-auto text-sky-600" />
                <h3 className="font-black text-slate-800 text-sm">Panel de Administrador</h3>
                <p className="text-xs text-slate-500">Solo el administrador puede gestionar las cuentas de usuario.</p>
              </div>
            )}
          </div>
        )}
      </main>

      {/* MODAL CAMBIO DE CONTRASEÑA POR ADMINISTRADOR */}
      {adminTargetUser && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white max-w-md w-full p-6 rounded-[2.5rem] shadow-2xl space-y-4 border border-sky-100">
            <div className="flex justify-between items-center">
              <h3 className="font-black text-slate-800 text-sm">Cambiar Clave: {adminTargetUser.name}</h3>
              <button onClick={() => setAdminTargetUser(null)} className="p-1 bg-sky-50 rounded-full text-slate-600"><X size={18} /></button>
            </div>
            
            <form onSubmit={handleAdminChangePassword} className="space-y-3">
              <div className="space-y-1">
                <label className="block text-xs font-bold text-slate-700">Nueva Contraseña (mín. 8 caracteres, mayúscula, número, símbolo)</label>
                <input 
                  type="password" 
                  placeholder="Nueva contraseña..." 
                  value={adminNewPasswordInput} 
                  onChange={(e) => setAdminNewPasswordInput(e.target.value)} 
                  className="w-full bg-sky-50/50 border border-sky-200 rounded-2xl px-4 py-2.5 text-xs text-slate-800 focus:outline-none"
                  required 
                />
              </div>

              {adminPasswordMessage && (
                <div className={`p-3 rounded-2xl text-xs font-bold ${adminPasswordMessage.startsWith('✅') ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700'}`}>
                  {adminPasswordMessage}
                </div>
              )}

              <div className="flex gap-2 pt-2">
                <button type="button" onClick={() => setAdminTargetUser(null)} className="w-1/2 bg-sky-50 text-slate-700 font-bold py-2.5 rounded-2xl text-xs border border-sky-200">Cancelar</button>
                <button type="submit" className="w-1/2 bg-sky-600 text-white font-bold py-2.5 rounded-2xl text-xs shadow">Actualizar Clave</button>
              </div>
            </form>
          </div>
        </div>
      )}

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

      {/* BARRA DE NAVEGACIÓN INFERIOR */}
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
          {(pendingRegistrations.length + allPendingPlanRequests.length) > 0 && (
            <span className="absolute -top-1 -right-1 bg-red-600 text-white text-[9px] w-4 h-4 rounded-full flex items-center justify-center font-bold">
              {pendingRegistrations.length + allPendingPlanRequests.length}
            </span>
          )}
        </button>
      </nav>
    </div>
  );
}
