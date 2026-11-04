import React, { useState, useEffect, useRef } from 'react';
import { 
  Users, MapPin, DollarSign, Plus, CheckCircle, 
  Clock, Camera, Navigation, ArrowRight, Trash2, Shield, Calendar, Sparkles, User, Lock, Mail, Bell, Search, Check, X, UserPlus, Inbox, ArrowLeft, Image as ImageIcon, Utensils, Beer, PartyPopper, Compass, Flag, ThumbsUp, Trophy, Receipt, AlertCircle, ChevronRight, MessageSquare, Send, Map, CheckSquare, ListPlus, UserMinus, ShieldAlert, KeyRound, Archive, Share2, ArrowUp, ArrowDown, Radio, Settings, ShieldCheck, Edit3, QrCode, ExternalLink, Ban, UserCheck, Crosshair, Key
} from 'lucide-react';
import { supabase } from './supabaseClient';

// Fechas de calendario en España sin desplazamientos de huso horario.
const formatPlanDateES = (value) => {
  const raw = String(value ?? '').trim();
  const match = /^(\d{4})-(\d{2})-(\d{2})/.exec(raw);
  if (match) return `${match[3]}-${match[2]}-${match[1]}`;
  return raw || 'Sin fecha';
};
const formatDateTimeES = (value) => {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return String(value);
  return new Intl.DateTimeFormat('es-ES', {
    timeZone: 'Europe/Madrid', day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit', hourCycle: 'h23'
  }).format(date).replace(',', ' · ');
};
const formatDateES = (value) => {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return String(value);
  return new Intl.DateTimeFormat('es-ES', {
    timeZone: 'Europe/Madrid', day: '2-digit', month: '2-digit', year: 'numeric'
  }).format(date).replaceAll('/', '-');
};
const isPlanPendingClosure = (event) => {
  if (!event || event.status === 'closed' || event.isInvitationPreview) return false;
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(String(event.date ?? '').slice(0, 10));
  if (!match) return false;
  const todayParts = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Europe/Madrid', year: 'numeric', month: '2-digit', day: '2-digit'
  }).formatToParts(new Date());
  const part = type => todayParts.find(x => x.type === type)?.value;
  const todayUTC = Date.UTC(Number(part('year')), Number(part('month')) - 1, Number(part('day')));
  const planUTC = Date.UTC(Number(match[1]), Number(match[2]) - 1, Number(match[3]));
  return (todayUTC - planUTC) / 86400000 > 2;
};

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
  const [authSubmitting, setAuthSubmitting] = useState(false);
  const [authFeedback, setAuthFeedback] = useState('');

  // Avisos y confirmaciones propios de React: sin alert/confirm/prompt del navegador.
  const [appNotice, setAppNotice] = useState('');
  const [appDialog, setAppDialog] = useState(null);
  const dialogResolve = useRef(null);
  const noticeTimer = useRef(null);
  const alert = (message) => {
    setAppNotice(String(message ?? ''));
    if (noticeTimer.current) clearTimeout(noticeTimer.current);
    noticeTimer.current = setTimeout(() => setAppNotice(''), 7000);
  };
  const confirm = (message) => new Promise(resolve => {
    dialogResolve.current = resolve;
    setAppDialog({ kind: 'confirm', message: String(message) });
  });
  const prompt = (message) => new Promise(resolve => {
    dialogResolve.current = resolve;
    setAppDialog({ kind: 'prompt', message: String(message), value: '' });
  });
  const finishDialog = (result) => {
    const resolve = dialogResolve.current;
    dialogResolve.current = null;
    setAppDialog(null);
    if (resolve) resolve(result);
  };
  useEffect(() => () => {
    if (noticeTimer.current) clearTimeout(noticeTimer.current);
    if (dialogResolve.current) dialogResolve.current(null);
  }, []);
  const renderAppMessages = () => (
    <>
      {appNotice && (
        <div role="status" aria-live="polite" className="fixed bottom-24 left-4 right-4 mx-auto max-w-md z-[100] bg-slate-900 text-white rounded-2xl shadow-2xl px-4 py-3 flex items-start gap-3 text-sm">
          <span className="flex-1 whitespace-pre-line break-words">{appNotice}</span>
          <button type="button" onClick={() => setAppNotice('')} aria-label="Cerrar aviso" className="p-1 rounded-lg hover:bg-slate-700"><X size={18} /></button>
        </div>
      )}
      {appDialog && (
        <div className="fixed inset-0 z-[110] bg-slate-950/70 flex items-center justify-center p-4" role="presentation">
          <div role="dialog" aria-modal="true" aria-labelledby="app-dialog-title" className="w-full max-w-sm rounded-3xl bg-white p-6 shadow-2xl border border-slate-200 space-y-4">
            <h2 id="app-dialog-title" className="font-black text-lg text-slate-900">{appDialog.kind === 'prompt' ? 'Confirmación de seguridad' : 'Confirmar operación'}</h2>
            <p className="whitespace-pre-line break-words text-sm text-slate-700">{appDialog.message}</p>
            {appDialog.kind === 'prompt' && (
              <input autoFocus type="text" aria-label="Texto de confirmación" autoComplete="off" value={appDialog.value}
                onChange={e => setAppDialog(d => d ? { ...d, value: e.target.value } : d)}
                onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); finishDialog(appDialog.value); } }}
                className="w-full rounded-xl border border-slate-300 p-3 text-base focus:outline-sky-600" placeholder="Escribe ELIMINAR" />
            )}
            <div className="flex gap-3">
              <button type="button" onClick={() => finishDialog(appDialog.kind === 'prompt' ? null : false)} className="flex-1 rounded-xl border border-slate-300 p-3 text-sm font-bold">Cancelar</button>
              <button type="button" onClick={() => finishDialog(appDialog.kind === 'prompt' ? appDialog.value : true)} className="flex-1 rounded-xl bg-sky-700 text-white p-3 text-sm font-bold">Confirmar</button>
            </div>
          </div>
        </div>
      )}
    </>
  );

  // Navegación
  const [activeTab, setActiveTab] = useState('my-events');
  const [calendarMonth, setCalendarMonth] = useState(() => new Date().getMonth());
  const [calendarYear, setCalendarYear] = useState(() => new Date().getFullYear());
  const [selectedCalendarDate, setSelectedCalendarDate] = useState(null);
  const [calendarExpanded, setCalendarExpanded] = useState(false);
  const [myPlanQuery, setMyPlanQuery] = useState('');
  const [myPlanFrom, setMyPlanFrom] = useState('');
  const [myPlanTo, setMyPlanTo] = useState('');
  const [myPlanStatus, setMyPlanStatus] = useState('active');
  const [myPlanPage, setMyPlanPage] = useState(1);
  const [searchPlanFrom, setSearchPlanFrom] = useState('');
  const [searchPlanTo, setSearchPlanTo] = useState('');
  const [searchPlanPage, setSearchPlanPage] = useState(1);
  const [processingInvitationId, setProcessingInvitationId] = useState(null);
  const [activeEvent, setActiveEvent] = useState(null);
  const [eventSubTab, setEventSubTab] = useState('spots');

  // Modales y formularios
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newDescription, setNewDescription] = useState('');
  const [additionalInviteSearch, setAdditionalInviteSearch] = useState('');
  const [invitingToPlan, setInvitingToPlan] = useState(false);
  const [newDate, setNewDate] = useState('');
  const [newInvitees, setNewInvitees] = useState([]);
  const [inviteSearch, setInviteSearch] = useState('');
  const [isCreatingEvent, setIsCreatingEvent] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Perfiles, solicitudes y administración
  const [registeredUsers, setRegisteredUsers] = useState([]);
  const [passwordRequests, setPasswordRequests] = useState([]);
  const [pendingRegistrations, setPendingRegistrations] = useState([]);
  const [processingRegistrationId, setProcessingRegistrationId] = useState(null);

  // Módulo de notificaciones: cada destinatario tiene su propio estado de lectura.
  const [notifications, setNotifications] = useState([]);
  const [notificationTemplates, setNotificationTemplates] = useState([]);
  const [adminNotificationHistory, setAdminNotificationHistory] = useState([]);
  const [notificationTitle, setNotificationTitle] = useState('');
  const [notificationMessage, setNotificationMessage] = useState('');
  const [notificationCategory, setNotificationCategory] = useState('general');
  const [notificationTargetMode, setNotificationTargetMode] = useState('all');
  const [selectedNotificationUsers, setSelectedNotificationUsers] = useState([]);
  const [selectedNotificationTemplate, setSelectedNotificationTemplate] = useState('');
  const [isSendingNotification, setIsSendingNotification] = useState(false);
  const [isSavingNotificationTemplate, setIsSavingNotificationTemplate] = useState(false);
  const [isDeletingPhotoId, setIsDeletingPhotoId] = useState(null);

  // Modal Admin Cambio Contraseña Usuario
  const [adminTargetUser, setAdminTargetUser] = useState(null);
  const [adminNewPasswordInput, setAdminNewPasswordInput] = useState('');
  const [adminPasswordMessage, setAdminPasswordMessage] = useState('');

  // Perfil
  const [editNameInput, setEditNameInput] = useState('');
  const [editSurnameInput, setEditSurnameInput] = useState('');
  const [editAvatarUrl, setEditAvatarUrl] = useState('');
  const [isProcessingAvatar, setIsProcessingAvatar] = useState(false);
  const [editEmailInput, setEditEmailInput] = useState('');
  const [oldPasswordInput, setOldPasswordInput] = useState('');
  const [newPasswordInput, setNewPasswordInput] = useState('');
  const [confirmNewPasswordInput, setConfirmNewPasswordInput] = useState('');
  const [profileMessage, setProfileMessage] = useState('');

  // Sitios, Autocompletado OpenStreetMap y GPS
  const [newSpotName, setNewSpotName] = useState('');
  const [osmSuggestions, setOsmSuggestions] = useState([]);
  const [spotSearchError, setSpotSearchError] = useState('');
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
  const [expensePaidBy, setExpensePaidBy] = useState('');
  const [editingExpenseId, setEditingExpenseId] = useState(null);
  const [editingExpensePayer, setEditingExpensePayer] = useState('');
  const [editingExpenseAmount, setEditingExpenseAmount] = useState('');
  const [isUpdatingExpense, setIsUpdatingExpense] = useState(false);
  const [isSavingExpense, setIsSavingExpense] = useState(false);
  const [deletingExpenseId, setDeletingExpenseId] = useState(null);
  const [viewingReceiptUrl, setViewingReceiptUrl] = useState(null);

  // Fotos y Comentarios
  const [photoSpotId, setPhotoSpotId] = useState('');
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);
  const [viewingPhotoUrl, setViewingPhotoUrl] = useState(null);
  const [spotCommentInputs, setSpotCommentInputs] = useState({});
  const [expandedTimelineSpotId, setExpandedTimelineSpotId] = useState(null);

  const [events, setEvents] = useState([]);
  // Identidad de acceso: siempre UUID, nunca nombre visible.
  const isEventMember = (ev, status = 'member') => Boolean(currentUser?.id &&
    (ev?.rawEventMembers || ev?.event_members || []).some(m => m.user_id === currentUser.id && m.status === status));
  const isEventInvited = ev => isEventMember(ev, 'pending_invite');
  const canViewEvent = ev => Boolean(currentUser?.id &&
    (ev?.isInvitationPreview === true || ev?.creator_id === currentUser.id || isEventMember(ev)));


  // Cargar sesión activa al iniciar
  useEffect(() => {
    const checkSession = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user) {
          const { data: profile } = await supabase.from('profiles').select('*').eq('id', session.user.id).maybeSingle();
          if (!profile || profile.is_blocked || !profile.is_approved) {
            await supabase.auth.signOut();
            return;
          }
          const userDisplayName = profile?.name || session.user.email?.split('@')[0] || 'Usuario';
          const userRole = profile?.role || 'user';
          setCurrentUser({ id: session.user.id, name: userDisplayName, surname: profile?.surname || '', avatar_url: profile?.avatar_url || '', email: session.user.email, role: userRole });
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
      setEditSurnameInput(currentUser.surname || '');
      setEditAvatarUrl(currentUser.avatar_url || '');
      setEditEmailInput(currentUser.email || '');
    }
  }, [currentUser]);

  // Sincronizar participantes al entrar al evento
  useEffect(() => {
    if (activeEvent && Array.isArray(activeEvent.members)) {
      setExpenseParticipants([...activeEvent.members]);
      setExpensePaidBy(currentUser?.name && activeEvent.members.includes(currentUser.name) ? currentUser.name : activeEvent.members[0] || '');
    }
  }, [activeEvent?.id]);

  // Buscador de establecimientos con Photon. Una sola petición por consulta,
  // caché local y debounce para evitar saturar el servicio público.
  const spotSearchCache = useRef(new globalThis.Map());
  useEffect(() => {
    const query = newSpotName.trim();
    if (query.length < 2) {
      setOsmSuggestions([]);
      setIsSearchingOsm(false);
      setSpotSearchError('');
      return undefined;
    }

    let cancelled = false;
    const controller = new AbortController();
    const normalizedQuery = query.normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '').toLocaleLowerCase('es');
    const locationKey = searchLocation && Number.isFinite(searchLocation.lat) && Number.isFinite(searchLocation.lon)
      ? `${searchLocation.lat.toFixed(3)},${searchLocation.lon.toFixed(3)}` : 'global';
    const cacheKey = `${normalizedQuery}|${locationKey}`;

    const timer = setTimeout(async () => {
      setIsSearchingOsm(true);
      setSpotSearchError('');
      try {
        const cached = spotSearchCache.current.get(cacheKey);
        if (cached) {
          if (!cancelled) setOsmSuggestions(cached);
          return;
        }

        const params = new URLSearchParams({ q: query, limit: '12', lang: 'es' });
        if (searchLocation && Number.isFinite(searchLocation.lat) && Number.isFinite(searchLocation.lon)) {
          params.set('lat', String(searchLocation.lat));
          params.set('lon', String(searchLocation.lon));
          params.set('zoom', '14');
          params.set('location_bias_scale', '0.2');
        }

        const response = await fetch(`https://photon.komoot.io/api/?${params.toString()}`, {
          method: 'GET',
          signal: controller.signal,
          headers: { Accept: 'application/geo+json, application/json' }
        });
        if (!response.ok) {
          if (response.status === 429) throw new Error('El buscador está recibiendo demasiadas consultas. Espera unos segundos y vuelve a intentarlo.');
          throw new Error(`El servicio de mapas respondió con el código ${response.status}.`);
        }

        const payload = await response.json();
        const features = Array.isArray(payload?.features) ? payload.features : [];
        const normalize = value => String(value || '').normalize('NFD')
          .replace(/[\u0300-\u036f]/g, '').toLocaleLowerCase('es').trim();
        const queryWords = normalizedQuery.split(/\s+/).filter(Boolean);
        const unique = new globalThis.Map();

        features.forEach(feature => {
          const props = feature?.properties || {};
          const coords = feature?.geometry?.coordinates || [];
          const lon = Number(coords[0]);
          const lat = Number(coords[1]);
          const name = props.name || props.street || props.locality || props.city || '';
          if (!name || !Number.isFinite(lat) || !Number.isFinite(lon)) return;

          const locality = [props.street, props.housenumber, props.district, props.city, props.state, props.country]
            .filter((value, index, values) => value && value !== name && values.indexOf(value) === index)
            .join(', ');
          const displayName = locality ? `${name} · ${locality}` : name;
          const haystack = normalize(`${name} ${displayName} ${props.osm_value || ''}`);
          const matches = queryWords.filter(word => haystack.includes(word)).length;
          const id = `${props.osm_type || 'place'}-${props.osm_id || ''}-${lat.toFixed(6)}-${lon.toFixed(6)}`;
          const score = (normalize(name) === normalizedQuery ? 100 : 0)
            + (normalize(name).startsWith(normalizedQuery) ? 40 : 0)
            + matches * 10
            + (props.countrycode === 'ES' ? 5 : 0);
          if (!unique.has(id)) unique.set(id, {
            id, name, display_name: displayName, lat, lon, score,
            osm_type: props.osm_type || null, osm_id: props.osm_id || null
          });
        });

        const suggestions = [...unique.values()].sort((a, b) => b.score - a.score).slice(0, 12);
        spotSearchCache.current.set(cacheKey, suggestions);
        // Limitar la caché para que no crezca indefinidamente.
        if (spotSearchCache.current.size > 60) {
          const oldestKey = spotSearchCache.current.keys().next().value;
          spotSearchCache.current.delete(oldestKey);
        }
        if (!cancelled) {
          setOsmSuggestions(suggestions);
          setSpotSearchError(suggestions.length ? '' : 'No hay coincidencias en OpenStreetMap para esta búsqueda. Puedes añadir el sitio manualmente o buscarlo en Google Maps.');
        }
      } catch (error) {
        if (error.name !== 'AbortError' && !cancelled) {
          console.error('Error buscando establecimientos en Photon:', error);
          setOsmSuggestions([]);
          setSpotSearchError(error.message || 'No se ha podido consultar el buscador. Inténtalo de nuevo.');
        }
      } finally {
        if (!cancelled) setIsSearchingOsm(false);
      }
    }, 750);

    return () => {
      cancelled = true;
      clearTimeout(timer);
      controller.abort();
    };
  }, [newSpotName, searchLocation]);

  const fetchNotifications = async () => {
    if (!currentUser?.id) return;
    try {
      const { data, error } = await supabase
        .from('notification_recipients')
        .select(`
          id, notification_id, user_id, read_at, created_at,
          notifications (id, title, message, category, event_id, created_at, created_by)
        `)
        .eq('user_id', currentUser.id)
        .order('created_at', { ascending: false });
      if (error) throw error;
      setNotifications((Array.isArray(data) ? data : []).filter(row => row.notifications));
    } catch (err) {
      console.error('Error cargando notificaciones:', err.message);
      setNotifications([]);
    }

    if (currentUser.role === 'admin') {
      try {
        const [{ data: templates, error: templatesError }, { data: history, error: historyError }] = await Promise.all([
          supabase.from('notification_templates').select('*').order('updated_at', { ascending: false }),
          supabase.from('notifications').select('id, title, message, category, created_at, event_id').order('created_at', { ascending: false }).limit(50)
        ]);
        if (templatesError) throw templatesError;
        if (historyError) throw historyError;
        setNotificationTemplates(Array.isArray(templates) ? templates : []);
        setAdminNotificationHistory(Array.isArray(history) ? history : []);
      } catch (err) {
        console.error('Error cargando administración de notificaciones:', err.message);
        setNotificationTemplates([]);
        setAdminNotificationHistory([]);
      }
    } else {
      setNotificationTemplates([]);
      setAdminNotificationHistory([]);
    }
  };

  // Actualiza el punto rojo si llega un comunicado mientras la aplicación está abierta.
  useEffect(() => {
    if (!currentUser?.id) return undefined;
    const channel = supabase
      .channel(`notification-recipients-${currentUser.id}`)
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'notification_recipients',
        filter: `user_id=eq.${currentUser.id}`
      }, () => { fetchNotifications(); })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [currentUser?.id]);

  const refreshAllData = async () => {
    // El servidor crea como máximo un recordatorio por plan vencido y creador.
    // Requiere instalar la función SQL entregada con esta versión.
    if (currentUser?.id) {
      const { error: reminderError } = await supabase.rpc('generate_my_plan_closure_reminders');
      if (reminderError && reminderError.code !== 'PGRST202' && reminderError.code !== '42883') {
        console.warn('Avisos de cierre pendientes:', reminderError.message);
      }
    }
    await Promise.all([
      fetchAppData(),
      fetchRegisteredUsers(),
      fetchPasswordRequests(),
      fetchPendingRegistrations(),
      fetchNotifications()
    ]);
  };

  const unreadNotificationsCount = notifications.filter(item => !item.read_at).length;

  const handleOpenNotification = async (item) => {
    if (!item) return;
    if (!item.read_at) {
      const { error } = await supabase
        .from('notification_recipients')
        .update({ read_at: new Date().toISOString() })
        .eq('id', item.id)
        .eq('user_id', currentUser.id);
      if (error) {
        alert('No se pudo marcar la notificación como leída: ' + error.message);
        return;
      }
      setNotifications(prev => prev.map(row => row.id === item.id
        ? { ...row, read_at: new Date().toISOString() }
        : row));
    }
    const eventId = item.notifications?.event_id;
    if (eventId) {
      const linkedEvent = events.find(event => event.id === eventId);
      if (linkedEvent) setActiveEvent(linkedEvent);
      else alert('El plan relacionado ya no está disponible o no tienes acceso.');
    }
  };

  const handleSendNotification = async (e) => {
    e.preventDefault();
    if (!isAdmin || isSendingNotification || !notificationTitle.trim() || !notificationMessage.trim()) return;
    const eligibleUsers = registeredUsers.filter(user => user.is_approved && !user.is_blocked);
    const recipients = notificationTargetMode === 'all'
      ? eligibleUsers
      : eligibleUsers.filter(user => selectedNotificationUsers.includes(user.id));
    if (!recipients.length) {
      alert('Selecciona al menos un destinatario aprobado.');
      return;
    }
    try {
      setIsSendingNotification(true);
      const { data: created, error: createError } = await supabase
        .from('notifications')
        .insert([{
          title: notificationTitle.trim(),
          message: notificationMessage.trim(),
          category: notificationCategory,
          created_by: currentUser.id
        }])
        .select('id')
        .single();
      if (createError) throw createError;

      const { error: recipientsError } = await supabase
        .from('notification_recipients')
        .insert(recipients.map(user => ({
          notification_id: created.id,
          user_id: user.id
        })));
      if (recipientsError) {
        await supabase.from('notifications').delete().eq('id', created.id);
        throw recipientsError;
      }

      setNotificationTitle('');
      setNotificationMessage('');
      setNotificationCategory('general');
      setSelectedNotificationUsers([]);
      await refreshAllData();
      alert(`Comunicado enviado a ${recipients.length} usuario(s).`);
    } catch (err) {
      console.error('Error enviando comunicado:', err);
      alert('No se pudo enviar el comunicado: ' + (err.message || 'Error desconocido'));
    } finally {
      setIsSendingNotification(false);
    }
  };

  const handleSaveNotificationTemplate = async () => {
    if (!isAdmin || isSavingNotificationTemplate || !notificationTitle.trim() || !notificationMessage.trim()) {
      alert('Escribe un título y un mensaje antes de guardar la plantilla.');
      return;
    }
    try {
      setIsSavingNotificationTemplate(true);
      const { error } = await supabase.from('notification_templates').insert([{
        title: notificationTitle.trim(),
        message: notificationMessage.trim(),
        category: notificationCategory,
        created_by: currentUser.id
      }]);
      if (error) throw error;
      await fetchNotifications();
      alert('Plantilla guardada correctamente.');
    } catch (err) {
      alert('No se pudo guardar la plantilla: ' + (err.message || 'Error desconocido'));
    } finally {
      setIsSavingNotificationTemplate(false);
    }
  };

  const handleSelectNotificationTemplate = (templateId) => {
    setSelectedNotificationTemplate(templateId);
    const template = notificationTemplates.find(item => item.id === templateId);
    if (template) {
      setNotificationTitle(template.title);
      setNotificationMessage(template.message);
      setNotificationCategory(template.category || 'general');
    }
  };

  const fetchRegisteredUsers = async () => {
    try {
      const { data, error } = await supabase.from('profiles').select('id, name, surname, avatar_url, email, role, is_blocked, is_approved');
      if (error) throw error;
      setRegisteredUsers(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Error cargando perfiles:', err.message);
    }
  };

  const fetchPendingRegistrations = async () => {
    try {
      const { data, error } = await supabase.from('profiles').select('*').eq('is_approved', false).eq('is_blocked', false);
      if (error) throw error;
      setPendingRegistrations((Array.isArray(data) ? data : []).filter(p => p.role !== 'admin'));
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

      // No incluir planes pendientes de aceptar en la carga completa.
      const formattedEvents = (Array.isArray(eventsData) ? eventsData : []).filter(ev =>
        ev.creator_id === currentUser?.id ||
        (Array.isArray(ev.event_members) && ev.event_members.some(m => m.user_id === currentUser?.id && m.status === 'member'))
      ).map(ev => {
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

      // La RPC solo devuelve metadatos de invitaciones del usuario conectado.
      const { data: invitationsData, error: invitationsError } = await supabase.rpc('get_my_pending_invitations');
      if (invitationsError) throw invitationsError;
      const previews = (Array.isArray(invitationsData) ? invitationsData : []).map(inv => ({
        id: inv.event_id, title: inv.title, date: inv.event_date,
        creator_name: inv.creator_name, description: inv.description,
        status: 'active', isInvitationPreview: true,
        rawEventMembers: [{ user_id: currentUser.id, status: 'pending_invite' }],
        members: [], pendingInvitations: [], pendingRequests: [],
        spots: [], expenses: [], photos: [], comments: []
      }));
      // Un plan confirmado prevalece sobre una previsualización obsoleta.
      const confirmedIds = new Set(formattedEvents.map(ev => ev.id));
      const allVisibleEvents = [...formattedEvents, ...previews.filter(ev => !confirmedIds.has(ev.id))];
      allVisibleEvents.sort((a, b) => new Date(b.date) - new Date(a.date));
      setEvents(allVisibleEvents);

      if (activeEvent) {
        const updatedActive = formattedEvents.find(e => e.id === activeEvent.id);
        if (updatedActive) setActiveEvent(updatedActive);
        else setActiveEvent(null);
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
    if (authSubmitting) return;
    setAuthFeedback('');

    if (authMode === 'register') {
      if (!email.trim() || !password || !name.trim()) { setAuthFeedback('Completa el nombre, correo y contraseña.'); return; }
      const errorMsg = validateStrongPassword(password);
      if (errorMsg) {
        setPasswordError(errorMsg);
        setAuthFeedback('La contraseña no cumple los requisitos: ' + errorMsg);
        return;
      }
      setPasswordError('');

      setAuthSubmitting(true);
      try {
      const { data, error } = await supabase.auth.signUp({ email: email.trim().toLowerCase(), password });
      if (error) {
        setAuthFeedback('No se pudo crear la cuenta: ' + error.message);
        return;
      }
      if (!data?.user) {
        setAuthFeedback('Supabase no ha devuelto una cuenta nueva. Comprueba si el correo ya está registrado.');
        return;
      }
      if (data.user) {
        const { error: profileCreateError } = await supabase.from('profiles').insert([{ 
          id: data.user.id, 
          name: name.trim(), 
          email: email.toLowerCase().trim(), 
          role: 'user', 
          is_blocked: false,
          is_approved: false
        }]);
        if (profileCreateError) {
          // Algunas instalaciones crean el perfil automáticamente mediante trigger.
          const { data: existingProfile, error: lookupError } = await supabase.from('profiles')
            .select('id, is_approved').eq('id', data.user.id).maybeSingle();
          if (lookupError || !existingProfile) {
            setAuthFeedback('La cuenta de autenticación se creó, pero no se pudo guardar el perfil: ' + profileCreateError.message + '. Si Supabase exige confirmar el correo, confirma primero el enlace recibido y contacta con el administrador para completar el perfil.');
            await supabase.auth.signOut();
            return;
          }
        }

        setAuthFeedback('✅ Solicitud registrada. ' + (data.session ? 'El administrador debe aprobar tu usuario.' : 'Comprueba también tu correo por si Supabase exige confirmación. El administrador debe aprobar tu usuario.'));
        await supabase.auth.signOut();
        setAuthMode('login');
      }
      } catch (err) {
        console.error('Error registrando usuario:', err);
        setAuthFeedback('Error al crear la cuenta: ' + (err?.message || 'Error desconocido'));
      } finally {
        setAuthSubmitting(false);
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
        if (!profile) {
          alert('No existe un perfil válido para esta cuenta. Contacta con el administrador.');
          await supabase.auth.signOut();
          return;
        }
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

        setCurrentUser({ id: data.user.id, name: profile ? profile.name : loginEmail.split('@')[0], surname: profile?.surname || '', avatar_url: profile?.avatar_url || '', email: loginEmail, role: profile ? profile.role : 'user' });
      }
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setCurrentUser(null);
    setActiveEvent(null);
  };

  // Gestión no destructiva de cuentas: jamás borrar profiles ni auth.users desde esta interfaz.
  // Se preservan eventos, participantes, gastos, lugares, fotografías y comentarios.
  const handleApproveRegistration = async (userId, userName) => {
    if (!isAdmin || !userId || userId === currentUser?.id || processingRegistrationId) return;
    setProcessingRegistrationId(userId);
    try {
      const { data: target, error: readError } = await supabase.from('profiles')
        .select('id, name, role, is_approved, is_blocked').eq('id', userId).maybeSingle();
      if (readError) throw readError;
      if (!target) throw new Error('No se encuentra el perfil. Comprueba la creación del registro y las políticas RLS.');
      if (target.role === 'admin') throw new Error('No se puede gestionar otra cuenta administradora desde esta pantalla.');
      if (target.is_blocked) throw new Error('La cuenta está bloqueada. Desbloquéala antes de aprobarla.');
      if (target.is_approved) {
        await refreshAllData();
        alert('Esta cuenta ya estaba aprobada.');
        return;
      }
      const { data, error } = await supabase.from('profiles')
        .update({ is_approved: true })
        .eq('id', userId).eq('is_approved', false).eq('is_blocked', false)
        .select('id, is_approved');
      if (error) throw error;
      if (!data?.some(p => p.id === userId && p.is_approved === true)) {
        throw new Error('Supabase no ha confirmado la aprobación. Revisa los permisos UPDATE/SELECT (RLS) de profiles.');
      }
      await refreshAllData();
      alert(`✅ Usuario ${userName} aprobado. Ya puede iniciar sesión.`);
    } catch (err) {
      alert('Error al aprobar la cuenta: ' + (err.message || 'Error desconocido'));
    } finally {
      setProcessingRegistrationId(null);
    }
  };

  // Rechazar = desactivar el acceso, NO eliminar datos ni relaciones.
  const handleRejectRegistration = async (userId) => {
    if (!isAdmin || userId === currentUser?.id) return;
    const target = registeredUsers.find(u => u.id === userId);
    if (!target || target.role === 'admin' || target.is_approved || target.is_blocked) return;
    if (!(await confirm(`¿Rechazar la solicitud de ${target.name}?\n\nLa cuenta quedará bloqueada y no aprobada. NO se eliminará el perfil ni ningún plan, gasto, participación o dato histórico.`))) return;
    try {
      const { data, error } = await supabase.from('profiles')
        .update({ is_approved: false, is_blocked: true })
        .eq('id', userId).eq('is_approved', false).eq('is_blocked', false)
        .neq('role', 'admin').select('id');
      if (error) throw error;
      if (!data?.length) throw new Error('Supabase no confirmó el rechazo. Revisa los permisos UPDATE (RLS).');
      await refreshAllData();
      alert('Solicitud rechazada sin borrar ningún dato. La cuenta queda bloqueada.');
    } catch (err) {
      alert('No se pudo rechazar la solicitud: ' + (err.message || 'Error desconocido'));
    }
  };

  const handleToggleBlockUser = async (userId, currentBlockedState, userName) => {
    if (!isAdmin || userId === currentUser?.id) return;
    const target = registeredUsers.find(u => u.id === userId);
    if (!target || target.role === 'admin') return;
    if (!(await confirm(`¿${currentBlockedState ? 'Desbloquear' : 'Bloquear'} a ${userName}?\n\nEsta acción NO elimina el perfil ni modifica planes, gastos o participaciones.${currentBlockedState && !target.is_approved ? '\n\nLa cuenta seguirá pendiente de aprobación.' : ''}`))) return;
    try {
      const { data, error } = await supabase.from('profiles')
        .update({ is_blocked: !currentBlockedState })
        .eq('id', userId).eq('is_blocked', currentBlockedState)
        .neq('role', 'admin').select('id, is_blocked');
      if (error) throw error;
      if (!data?.length || data[0].is_blocked !== !currentBlockedState) {
        throw new Error('Supabase no confirmó el cambio. Comprueba los permisos UPDATE (RLS).');
      }
      await refreshAllData();
      alert(`Usuario ${userName} ${currentBlockedState ? 'desbloqueado' : 'bloqueado'} sin borrar sus datos.`);
    } catch (err) {
      alert('Error al cambiar el estado: ' + (err.message || 'Error desconocido'));
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
    const candidates = (events.find(e => e.id === eventId)?.rawEventMembers || []).filter(m => m.user_name === userName && m.status === 'pending_request');
    if (candidates.length !== 1) { alert('Solicitud ambigua: revisa los participantes antes de aprobar.'); return; }
    try {
      const { error } = await supabase
        .from('event_members')
        .update({ status: 'member' })
        .eq('event_id', eventId)
        .eq('user_id', candidates[0].user_id);

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

  // Gestionar una invitación dirigida al usuario conectado.
  const handleCalendarInvitation = async (eventId, accept) => {
    if (!currentUser?.id || processingInvitationId) return;
    try {
      setProcessingInvitationId(eventId);
      const query = supabase.from('event_members');
      const { error } = accept
        ? await query.update({ status: 'member' }).eq('event_id', eventId).eq('user_id', currentUser.id).eq('status', 'pending_invite')
        : await query.delete().eq('event_id', eventId).eq('user_id', currentUser.id).eq('status', 'pending_invite');
      if (error) throw error;
      await refreshAllData();
    } catch (err) {
      alert('No se pudo gestionar la invitación: ' + (err.message || 'Error desconocido'));
    } finally {
      setProcessingInvitationId(null);
    }
  };

  const handleRejectEventJoin = async (eventId, userName) => {
    const candidates = (events.find(e => e.id === eventId)?.rawEventMembers || []).filter(m => m.user_name === userName && m.status === 'pending_request');
    if (candidates.length !== 1) { alert('Solicitud ambigua: revisa los participantes antes de rechazar.'); return; }
    if (!(await confirm(`¿Rechazar la solicitud de ${userName}?`))) return;
    try {
      await supabase.from('event_members').delete().eq('event_id', eventId).eq('user_id', candidates[0].user_id);
      await refreshAllData();
    } catch (err) {
      alert('Error al rechazar usuario: ' + err.message);
    }
  };

  const handleDeleteEvent = async (eventId, eventTitle) => {
    if (!currentUser || !activeEvent || activeEvent.id !== eventId) return;
    const authorized = currentUser.role === 'admin' || activeEvent.creator_id === currentUser.id;
    if (!authorized) {
      alert('Solo el creador del plan o un administrador puede eliminarlo.');
      return;
    }
    if (!(await confirm(`⚠️ Vas a eliminar DEFINITIVAMENTE «${eventTitle}».\n\nSe perderán sus participantes, lugares, gastos, comentarios y fotografías. Esta acción no se puede deshacer.\n\n¿Quieres continuar?`))) return;
    const typed = await prompt('Para confirmar el borrado definitivo, escribe ELIMINAR (en mayúsculas):');
    if (typed !== 'ELIMINAR') {
      if (typed !== null) alert('Eliminación cancelada: debes escribir ELIMINAR exactamente.');
      return;
    }
    try {
      // La protección real de estas operaciones debe estar configurada también en las políticas RLS de Supabase.
      for (const table of ['spots', 'expenses', 'photos', 'comments', 'event_members']) {
        const { error } = await supabase.from(table).delete().eq('event_id', eventId);
        if (error) throw new Error(`${table}: ${error.message}`);
      }
      const { data, error } = await supabase.from('events').delete().eq('id', eventId).select('id');
      if (error) throw error;
      if (!data?.length) throw new Error('Supabase no confirmó el borrado. Revisa los permisos RLS.');
      alert(`Plan «${eventTitle}» eliminado definitivamente.`);
      setActiveEvent(null);
      await refreshAllData();
    } catch (err) {
      alert('No se pudo completar la eliminación. Puede haber datos asociados eliminados parcialmente. ' + (err.message || 'Error desconocido'));
      await refreshAllData();
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

  const handleProfilePhotoChange = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      setProfileMessage('❌ Selecciona un archivo de imagen válido.');
      return;
    }
    if (file.size > 12 * 1024 * 1024) {
      setProfileMessage('❌ La imagen no puede superar los 12 MB.');
      return;
    }
    setIsProcessingAvatar(true);
    try {
      const dataUrl = await new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onerror = () => reject(new Error('No se pudo leer la imagen.'));
        reader.onload = () => {
          const img = new Image();
          img.onerror = () => reject(new Error('El archivo de imagen no es válido.'));
          img.onload = () => {
            const maxSide = 512;
            const scale = Math.min(1, maxSide / Math.max(img.width, img.height));
            const canvas = document.createElement('canvas');
            canvas.width = Math.max(1, Math.round(img.width * scale));
            canvas.height = Math.max(1, Math.round(img.height * scale));
            const ctx = canvas.getContext('2d');
            if (!ctx) return reject(new Error('No se pudo procesar la imagen.'));
            ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
            resolve(canvas.toDataURL('image/jpeg', 0.82));
          };
          img.src = reader.result;
        };
        reader.readAsDataURL(file);
      });
      setEditAvatarUrl(dataUrl);
      setProfileMessage('Imagen preparada. Pulsa «Guardar cambios» para aplicarla.');
    } catch (err) {
      setProfileMessage('❌ ' + err.message);
    } finally {
      setIsProcessingAvatar(false);
    }
  };

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    setProfileMessage('');

    try {
      const cleanName = editNameInput.trim();
      const cleanSurname = editSurnameInput.trim();
      const newEmailVal = editEmailInput.trim().toLowerCase();
      if (!cleanName) {
        setProfileMessage('❌ El nombre no puede estar vacío.');
        return;
      }

      // La función SECURITY DEFINER actualiza únicamente el perfil del usuario autenticado.
      const { error: profileError } = await supabase.rpc('update_own_profile', {
        p_name: cleanName,
        p_surname: cleanSurname,
        p_avatar_url: editAvatarUrl || null,
        p_email: newEmailVal || currentUser.email
      });
      if (profileError) throw profileError;

      const emailChanged = !!newEmailVal && newEmailVal !== currentUser?.email?.toLowerCase();
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
        name: cleanName,
        surname: cleanSurname,
        avatar_url: editAvatarUrl || '',
        email: emailChanged ? newEmailVal : currentUser.email
      });
      setProfileMessage(emailChanged
        ? '✅ Perfil actualizado. Si Supabase lo requiere, confirma el cambio de correo desde el mensaje recibido.'
        : '✅ ¡Perfil y contraseña actualizados con éxito!');
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
    if (isCreatingEvent || !newTitle.trim() || !newDate || !currentUser) return;
    setIsCreatingEvent(true);
    let createdEventId = null;
    try {
      // Verificar la identidad real de Supabase antes de insertar.
      const { data: authData, error: authError } = await supabase.auth.getUser();
      if (authError || !authData?.user?.id) {
        throw new Error('Tu sesión ha caducado. Cierra sesión y vuelve a entrar.');
      }
      const authenticatedId = authData.user.id;
      if (authenticatedId !== currentUser.id) {
        throw new Error('La sesión y el perfil no coinciden. Cierra sesión y vuelve a entrar.');
      }
      const { data: profile, error: profileError } = await supabase
        .from('profiles').select('name, is_approved, is_blocked')
        .eq('id', authenticatedId).single();
      if (profileError || !profile?.is_approved || profile?.is_blocked) {
        throw new Error('Tu perfil no está autorizado para crear planes.');
      }

      // Evitar INSERT ... RETURNING: la política SELECT puede exigir una
      // participación que todavía no se ha insertado en event_members.
      const eventId = crypto.randomUUID();
      const { error: eventError } = await supabase
        .from('events')
        .insert([{ id: eventId, title: newTitle.trim(), description: newDescription.trim(),
          date: newDate, creator_id: authenticatedId, creator_name: profile.name || currentUser.name,
          status: 'active', is_private: true }]);
      if (eventError) {
        console.error('Error INSERT events:', eventError);
        throw new Error(`Creación del plan: ${eventError.message}${eventError.code ? ` (código ${eventError.code})` : ''}`);
      }
      createdEventId = eventId;

      const invitees = [...new Set(newInvitees)].filter(id => id !== authenticatedId);
      const rows = [
        { event_id: eventId, user_id: authenticatedId, user_name: profile.name || currentUser.name, status: 'member' },
        ...invitees.map(user_id => {
          const person = registeredUsers.find(u => u.id === user_id);
          if (!person) throw new Error('No se encuentra uno de los invitados seleccionados.');
          return { event_id: eventId, user_id, user_name: person.name, status: 'pending_invite' };
        })
      ];
      const { error: memberError } = await supabase.from('event_members').insert(rows);
      if (memberError) {
        console.error('Error INSERT event_members:', memberError);
        throw new Error(`Participantes/invitaciones: ${memberError.message}${memberError.code ? ` (código ${memberError.code})` : ''}`);
      }
      setNewTitle('');
      setNewDescription('');
      setNewDate('');
      setNewInvitees([]);
      setInviteSearch('');
      setShowCreateModal(false);
      await refreshAllData();
    } catch (err) {
      alert((createdEventId ? 'El plan se ha creado, pero no se pudieron registrar correctamente sus participantes/invitaciones. Revisa el plan antes de volver a intentarlo. ' : 'No se pudo crear el plan. ') + (err.message || 'Error desconocido'));
      await refreshAllData();
    } finally {
      setIsCreatingEvent(false);
    }
  };

  // Solo quien organiza puede invitar nuevos participantes, también después de crear el plan.
  const handleInviteToExistingPlan = async (person) => {
    if (!activeEvent || !currentUser || invitingToPlan || activeEvent.status === 'closed') return;
    if (activeEvent.creator_id !== currentUser.id) return;
    const already = (activeEvent.rawEventMembers || []).some(m => m.user_id === person.id);
    if (already) { alert('Esta persona ya figura en el plan o tiene una invitación pendiente.'); return; }
    setInvitingToPlan(true);
    try {
      const { error } = await supabase.from('event_members').insert([{ event_id: activeEvent.id, user_id: person.id, user_name: person.name, status: 'pending_invite' }]);
      if (error) throw error;
      setAdditionalInviteSearch('');
      await refreshAllData();
      alert(`Invitación enviada a ${person.name}.`);
    } catch (err) { alert('No se pudo enviar la invitación: ' + (err.message || 'Error desconocido')); }
    finally { setInvitingToPlan(false); }
  };

  const handleRemoveMember = async (memberName) => {
    if (!(await confirm(`¿Estás seguro de quitar a ${memberName}?`))) return;
    const matches = (activeEvent.rawEventMembers || []).filter(m => m.status === 'member' && m.user_name === memberName);
    if (matches.length !== 1) { alert('Hay nombres duplicados: no se puede retirar a esta persona de forma segura desde esta lista.'); return; }
    const { error } = await supabase.from('event_members').delete().eq('event_id', activeEvent.id).eq('user_id', matches[0].user_id);
    if (error) { alert('No se pudo quitar al participante: ' + error.message); return; }
    if (matches[0].user_id === currentUser.id) setActiveEvent(null);
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
      suggested_by_id: currentUser.id,
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
    if (!(await confirm('¿Eliminar sitio?'))) return;
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
    if (!expense?.id || !activeEvent?.id || deletingExpenseId) return;

    const confirmed = await confirm(
      `¿Quieres eliminar el gasto \"${expense.description}\" de ${Number(expense.amount || 0).toFixed(2)}€?\n\nSe actualizarán automáticamente el total y la liquidación de deudas. Esta acción no se puede deshacer.`
    );
    if (!confirmed) return;

    try {
      setDeletingExpenseId(expense.id);
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
    } finally {
      setDeletingExpenseId(null);
    }
  };

  // Resolver el pagador por su pertenencia al plan, sin confundir homónimos.
  const resolveExpensePayerId = (payerName) => {
    const matches = (activeEvent?.rawEventMembers || []).filter(m =>
      m.status === 'member' && m.user_name === payerName && m.user_id);
    return matches.length === 1 ? matches[0].user_id : null;
  };

  // Permite corregir quién pagó un gasto ya registrado sin eliminarlo.
  const handleUpdateExpensePayer = async (expense) => {
    if (isUpdatingExpense || !activeEvent?.id) return;
    if (!activeEvent.members.includes(editingExpensePayer)) {
      alert('Selecciona un pagador que pertenezca al plan.');
      return;
    }
    const payerId = resolveExpensePayerId(editingExpensePayer);
    if (!payerId) { alert('El pagador tiene un nombre ambiguo o no está identificado. No se ha cambiado el gasto.'); return; }
    const amount = Number(String(editingExpenseAmount).replace(',', '.'));
    if (!Number.isFinite(amount) || amount <= 0) {
      alert('Introduce un importe válido mayor que cero.');
      return;
    }
    try {
      setIsUpdatingExpense(true);
      const { data, error } = await supabase.from('expenses')
        .update({ paid_by: editingExpensePayer, paid_by_id: payerId, amount })
        .eq('id', expense.id).eq('event_id', activeEvent.id)
        .select('id, paid_by, amount');
      if (error) throw error;
      if (!data?.length || data[0].paid_by !== editingExpensePayer || Number(data[0].amount) !== amount) {
        throw new Error('Supabase no confirmó la actualización. Comprueba los permisos UPDATE (RLS).');
      }
      await refreshAllData();
      setEditingExpenseId(null);
      setEditingExpenseAmount('');
    } catch (err) {
      alert('No se pudo corregir el pagador: ' + (err.message || 'Error desconocido'));
    } finally {
      setIsUpdatingExpense(false);
    }
  };

  // ENVIAR GASTO CON REPARTO INTELIGENTE REAL
  const handleAddExpense = async (e) => {
    e.preventDefault();
    if (isSavingExpense || !expenseDesc.trim() || !expenseAmount || !activeEvent) return;
    
    // Guardamos únicamente los miembros del plan que estén marcados.
    const eventMembers = Array.isArray(activeEvent.members) ? activeEvent.members : [];
    const selectedNames = new Set((Array.isArray(expenseParticipants) ? expenseParticipants : []).map(name => String(name).trim()));
    const finalParticipants = eventMembers.filter(member => selectedNames.has(String(member).trim()));
    const amount = Number(expenseAmount);
    if (!Number.isFinite(amount) || amount <= 0) {
      alert('Introduce un importe válido mayor que cero.');
      return;
    }
    if (!eventMembers.includes(expensePaidBy)) {
      alert('Selecciona quién ha pagado realmente el gasto.');
      return;
    }
    if (finalParticipants.length === 0) {
      alert('Selecciona al menos una persona para repartir el gasto.');
      return;
    }

    const payerId = resolveExpensePayerId(expensePaidBy);
    if (!payerId) { alert('No se puede identificar al pagador de forma única. Revisa los participantes del plan.'); return; }

    console.log("💰 ENVIANDO GASTO A SUPABASE:", {
      description: expenseDesc.trim(),
      amount: parseFloat(expenseAmount),
      participants: finalParticipants
    });

    setIsSavingExpense(true);
    const { error } = await supabase.from('expenses').insert([{
      event_id: activeEvent.id,
      description: expenseDesc.trim(),
      amount,
      paid_by: expensePaidBy,
      paid_by_id: payerId,
      created_by_id: currentUser.id,
      spot_id: expenseSpotId || null,
      receipt_url: expenseReceiptUrl || null,
      participants: finalParticipants // Array exacto seleccionado por el usuario
    }]);

    if (error) {
      alert('❌ Error al guardar el gasto: ' + error.message);
      setIsSavingExpense(false);
      return;
    }

    setExpenseDesc('');
    setExpenseAmount('');
    setExpenseSpotId('');
    setExpenseReceiptUrl('');
    // El siguiente gasto comienza de nuevo con todos los miembros seleccionados.
    setExpenseParticipants([...eventMembers]);
    setExpensePaidBy(eventMembers.includes(currentUser?.name) ? currentUser.name : eventMembers[0] || '');
    await refreshAllData();
    setIsSavingExpense(false);
  };

  const handlePhotoUpload = (e) => {
    const file = e.target.files[0];
    if (!file || !activeEvent || !photoSpotId) return;
    setIsUploadingPhoto(true);
    const reader = new FileReader();
    reader.onloadend = async () => {
      try {
        const { error } = await supabase.from('photos').insert([{
          event_id: activeEvent.id, url: reader.result,
          user_name: currentUser.name, user_id: currentUser.id, spot_id: photoSpotId
        }]);
        if (error) throw error;
        setPhotoSpotId('');
        await refreshAllData();
      } catch (err) {
        alert('No se pudo guardar la fotografía: ' + (err.message || 'Error desconocido'));
      } finally {
        setIsUploadingPhoto(false);
        e.target.value = '';
      }
    };
    reader.readAsDataURL(file);
  };

  const handleDeletePhoto = async (photo) => {
    if (!photo?.id || !activeEvent?.id || isDeletingPhotoId) return;
    if (!(await confirm('¿Eliminar esta fotografía del plan? Esta acción no se puede deshacer.'))) return;
    try {
      setIsDeletingPhotoId(photo.id);
      const { error, data } = await supabase.from('photos')
        .delete()
        .eq('id', photo.id)
        .eq('event_id', activeEvent.id)
        .select('id');
      if (error) throw error;
      if (!data?.length) throw new Error('Supabase no confirmó la eliminación. Comprueba la política DELETE de photos.');
      if (viewingPhotoUrl === photo.url) setViewingPhotoUrl(null);
      await refreshAllData();
    } catch (err) {
      alert('No se pudo eliminar la fotografía: ' + (err.message || 'Error desconocido'));
    } finally {
      setIsDeletingPhotoId(null);
    }
  };

  const handleAddSpotComment = async (spotId) => {
    const text = spotCommentInputs[spotId];
    if (!text || !text.trim() || !activeEvent) return;
    await supabase.from('comments').insert([{ event_id: activeEvent.id, spot_id: spotId, user_name: currentUser.name, user_id: currentUser.id, content: text.trim() }]);
    setSpotCommentInputs({ ...spotCommentInputs, [spotId]: '' });
    await refreshAllData();
  };

  const handleCloseEvent = async () => {
    if (!(await confirm('¿Cerrar salida?'))) return;
    await supabase.from('events').update({ status: 'closed' }).eq('id', activeEvent.id);
    await refreshAllData();
  };

  const handleRequestJoin = async (eventId) => {
    await supabase.from('event_members').insert([{ event_id: eventId, user_id: currentUser.id, user_name: currentUser.name, status: 'pending_request' }]);
    await refreshAllData();
  };

  const handleCancelRequestJoin = async (eventId) => {
    if (!(await confirm('¿Cancelar solicitud?'))) return;
    await supabase.from('event_members').delete().eq('event_id', eventId).eq('user_id', currentUser.id).eq('status', 'pending_request');
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
    // Céntimos enteros: evita errores de coma flotante y garantiza que cada
    // gasto se reparte exactamente, incluido el céntimo sobrante.
    const balances = Object.fromEntries(members.map(name => [name, 0]));
    for (const exp of (expenses || [])) {
      const amount = Number(exp.amount);
      const cents = Math.round(amount * 100);
      const payer = exp.paid_by;
      const participants = getExpenseParticipants(exp, members).filter(name =>
        Object.prototype.hasOwnProperty.call(balances, name));
      // No inventar repartos ante registros inconsistentes.
      if (!Number.isFinite(amount) || cents <= 0 ||
          !Object.prototype.hasOwnProperty.call(balances, payer) || !participants.length) continue;
      balances[payer] += cents;
      const base = Math.floor(cents / participants.length);
      const remainder = cents % participants.length;
      participants.forEach((name, i) => { balances[name] -= base + (i < remainder ? 1 : 0); });
    }
    const debtors = Object.entries(balances).filter(([, value]) => value < 0)
      .map(([name, value]) => ({ name, cents: -value }));
    const creditors = Object.entries(balances).filter(([, value]) => value > 0)
      .map(([name, value]) => ({ name, cents: value }));
    const transactions = [];
    let di = 0, ci = 0;
    while (di < debtors.length && ci < creditors.length) {
      const cents = Math.min(debtors[di].cents, creditors[ci].cents);
      if (cents > 0) transactions.push({ from: debtors[di].name, to: creditors[ci].name, amount: cents / 100 });
      debtors[di].cents -= cents;
      creditors[ci].cents -= cents;
      if (debtors[di].cents === 0) di++;
      if (creditors[ci].cents === 0) ci++;
    }
    return transactions;
  };

  const isAdmin = currentUser?.role === 'admin'; // La autorización efectiva debe comprobarse mediante RLS.

  const myPendingInvitations = events
    .filter(ev => ev.status !== 'closed' && isEventInvited(ev))
    .map(ev => ({ eventId: ev.id, eventTitle: ev.title, date: ev.date, creatorName: ev.creator_name }));

  const allPendingPlanRequests = events.flatMap(ev => {
    const rawMembers = Array.isArray(ev.rawEventMembers) ? ev.rawEventMembers : [];
    const isUserCreator = ev.creator_id === currentUser?.id;
    
    if (!isUserCreator && !isAdmin) return [];

    return rawMembers
      .filter(m => m.status === 'pending_request' && m.user_id !== ev.creator_id)
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
            <button role="tab" aria-selected={authMode === 'login'} onClick={() => { setAuthMode('login'); setPasswordError(''); setAuthFeedback(''); }} className={`flex-1 py-3 text-xs font-bold rounded-xl transition-all ${authMode === 'login' ? 'bg-sky-600 text-white shadow-md' : 'text-slate-600'}`}>
              Iniciar Sesión
            </button>
            <button role="tab" aria-selected={authMode === 'register'} onClick={() => { setAuthMode('register'); setPasswordError(''); setAuthFeedback(''); }} className={`flex-1 py-3 text-xs font-bold rounded-xl transition-all ${authMode === 'register' ? 'bg-sky-600 text-white shadow-md' : 'text-slate-600'}`}>
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

            {authMode === 'register' && (
              <p className="text-xs text-slate-600 leading-relaxed">La contraseña necesita 8 caracteres como mínimo, una mayúscula, un número y un símbolo (por ejemplo, ! o @).</p>
            )}
            {(passwordError || authFeedback) && (
              <div role="alert" className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-sm font-semibold text-rose-800">{authFeedback || passwordError}</div>
            )}
            <button type="submit" disabled={authSubmitting} className="disabled:opacity-60 disabled:cursor-wait w-full bg-gradient-to-r from-sky-600 to-indigo-600 hover:from-sky-700 hover:to-indigo-700 text-white font-bold py-3.5 rounded-2xl text-sm shadow-lg mt-2">
              {authSubmitting ? 'Creando cuenta...' : authMode === 'login' ? 'Entrar a mi cuenta' : 'Registrarme (Requiere aprobación)'}
            </button>
          </form>
        </div>
        {renderAppMessages()}
      </main>
    );
  }

  if (activeEvent) {
    const validExpenses = Array.isArray(activeEvent.expenses) ? activeEvent.expenses : [];
    const validMembers = Array.isArray(activeEvent.members) ? activeEvent.members : [];
    const validSpots = Array.isArray(activeEvent.spots) ? activeEvent.spots : [];
    const totalExpenses = validExpenses.reduce((sum, expense) => sum + (Number(expense.amount) || 0), 0);
    const averagePerMember = validMembers.length ? totalExpenses / validMembers.length : 0;
    const validPhotos = Array.isArray(activeEvent.photos) ? activeEvent.photos : [];

    const totalSpent = validExpenses.reduce((acc, c) => acc + Number(c.amount), 0);
    
    const selectedSpots = validSpots.filter(s => s.active_now);
    const pendingSpots = validSpots.filter(s => !s.active_now);

    const calculatedDebts = calculateDebts(validMembers, validExpenses);
    const isCreator = activeEvent.creator_id === currentUser.id || (!activeEvent.creator_id && activeEvent.creator_name === currentUser.name);
    const isClosed = activeEvent.status === 'closed';
    const maxVotes = Math.max(0, ...validSpots.map(s => s.votes || 0));

    const canDeleteEvent = isAdmin || isCreator;

    return (
      <div className="min-h-screen bg-gradient-to-br from-sky-50 via-blue-50 to-indigo-100 text-slate-800 pb-24 md:pb-8 md:ml-64 relative overflow-hidden">
        <aside className="hidden md:flex fixed inset-y-0 left-0 z-40 w-64 flex-col bg-white/95 backdrop-blur-xl border-r border-sky-100 shadow-lg p-5">
          <div className="flex items-center gap-3 pb-7 border-b border-sky-100"><div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-sky-500 to-indigo-600 text-white grid place-items-center font-black">N</div><div><p className="font-black text-slate-800">Nosotros</p><p className="text-xs text-slate-500">Organiza tus planes</p></div></div>
          <nav className="mt-6 space-y-2" aria-label="Navegación principal">
            <button onClick={() => { setActiveEvent(null); setActiveTab('my-events'); }} className="w-full flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-bold bg-sky-50 text-sky-700"><Calendar size={18}/> Mis Salidas</button>
            <button onClick={() => { setActiveEvent(null); setActiveTab('search'); }} className="w-full flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-semibold text-slate-600 hover:bg-slate-50"><Search size={18}/> Buscar planes</button>
            <button onClick={() => { setActiveEvent(null); setActiveTab('profile'); }} className="w-full flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-semibold text-slate-600 hover:bg-slate-50"><Settings size={18}/> Perfil</button>
            <button onClick={() => { setActiveEvent(null); setActiveTab('notifications'); }} className="w-full flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-semibold text-slate-600 hover:bg-slate-50"><Inbox size={18}/> Aprobaciones</button>
          </nav>
          <div className="mt-auto text-xs text-slate-400">Sesión de {currentUser?.name || 'usuario'}</div>
        </aside>
        <div className="fixed top-3 left-4 md:left-[17rem] z-50">
          <button onClick={() => setActiveEvent(null)} className="flex items-center text-xs font-bold text-slate-800 bg-white/95 backdrop-blur-md px-3.5 py-2 rounded-full hover:bg-white shadow-lg border border-sky-200">
            <ArrowLeft size={16} className="mr-1 text-sky-600" /> Volver
          </button>
        </div>

        <div className="relative bg-gradient-to-r from-sky-100 via-blue-100 to-indigo-50 border-b border-sky-200 pt-12 pb-4 px-4 shadow-xs">
          <div className="max-w-md md:max-w-6xl mx-auto space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-[10px] font-black uppercase tracking-wider text-sky-700 bg-white/80 px-2.5 py-0.5 rounded-full border border-sky-200">
                Organiza: {activeEvent.creator_name}
              </span>
              {isClosed ? (
                <span className="text-[9px] font-bold bg-amber-500 text-white px-2.5 py-0.5 rounded-full shadow">🔒 Salida Cerrada</span>
              ) : (
                <span className={`text-[9px] font-bold text-white px-2.5 py-0.5 rounded-full shadow ${isPlanPendingClosure(activeEvent) ? 'bg-amber-600' : 'bg-emerald-600'}`}>{isPlanPendingClosure(activeEvent) ? '🟠 Pendiente de cierre' : '🟢 Plan Activo'}</span>
              )}
            </div>

            <div className="flex justify-between items-start">
              <div>
                <h1 className="text-xl font-black text-slate-900 tracking-tight">{activeEvent.title}</h1>
                {activeEvent.description && <p className="text-xs text-slate-700 mt-2 whitespace-pre-wrap break-words">{activeEvent.description}</p>}
                <p className="text-xs text-slate-600 font-medium flex items-center mt-0.5">
                  <Calendar size={13} className="mr-1 text-sky-600" /> Fecha del plan: {formatPlanDateES(activeEvent.date)}
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

        <main className="max-w-md md:max-w-6xl mx-auto p-4 md:p-6 space-y-4 relative z-10">
          <section aria-label="Resumen de la salida" className="grid grid-cols-2 gap-2">
            <div className="rounded-2xl border border-sky-100 bg-white/95 p-3 shadow-sm">
              <p className="text-[10px] font-bold uppercase tracking-wide text-slate-500">Participantes</p>
              <p className="mt-1 text-xl font-black text-slate-900">{validMembers.length}</p>
              <p className="text-[10px] text-slate-500">Personas en el plan</p>
            </div>
            <div className="rounded-2xl border border-emerald-100 bg-white/95 p-3 shadow-sm">
              <p className="text-[10px] font-bold uppercase tracking-wide text-slate-500">Gasto acumulado</p>
              <p className="mt-1 text-xl font-black text-emerald-700">{totalExpenses.toFixed(2)} €</p>
              <p className="text-[10px] text-slate-500">{validExpenses.length} gastos registrados</p>
            </div>
            <div className="rounded-2xl border border-indigo-100 bg-white/95 p-3 shadow-sm">
              <p className="text-[10px] font-bold uppercase tracking-wide text-slate-500">Media por persona</p>
              <p className="mt-1 text-xl font-black text-indigo-700">{averagePerMember.toFixed(2)} €</p>
              <p className="text-[10px] text-slate-500">Orientativa sobre todos los miembros</p>
            </div>
            <div className="rounded-2xl border border-amber-100 bg-white/95 p-3 shadow-sm">
              <p className="text-[10px] font-bold uppercase tracking-wide text-slate-500">Sitios propuestos</p>
              <p className="mt-1 text-xl font-black text-amber-700">{validSpots.length}</p>
              <p className="text-[10px] text-slate-500">En la ruta del plan</p>
            </div>
          </section>
          {isCreator && !isClosed && (
            <button onClick={handleCloseEvent} className="w-full bg-gradient-to-r from-amber-600 to-orange-600 text-white font-bold py-3 px-4 rounded-2xl text-xs shadow-lg flex items-center justify-center space-x-2 border border-amber-500/30">
              <Flag size={16} /> <span>{isPlanPendingClosure(activeEvent) ? 'Cerrar plan pendiente y generar historial' : 'Cerrar Salida y Generar Línea Temporal'}</span>
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

              {isCreator && (
                <section className="bg-white/90 p-4 rounded-3xl border border-sky-100 space-y-3" aria-label="Invitar más personas">
                  <h3 className="text-xs font-black text-slate-800">Invitar más personas al plan</h3>
                  <p className="text-[11px] text-slate-500">Puedes invitar a usuarios registrados en cualquier momento mientras el plan esté abierto.</p>
                  <input type="search" aria-label="Buscar usuarios para invitar" value={additionalInviteSearch} onChange={e => setAdditionalInviteSearch(e.target.value)} placeholder="Buscar por nombre o correo..." className="w-full rounded-xl border border-sky-200 p-3 text-sm" />
                  {additionalInviteSearch.trim() && (
                    <div className="space-y-1 max-h-44 overflow-y-auto">
                      {registeredUsers.filter(u => u.name && u.id !== currentUser.id && u.is_approved !== false && !u.is_blocked && !(activeEvent.rawEventMembers || []).some(m => m.user_id === u.id) && (u.name.toLocaleLowerCase('es').includes(additionalInviteSearch.trim().toLocaleLowerCase('es')) || (u.surname || '').toLocaleLowerCase('es').includes(additionalInviteSearch.trim().toLocaleLowerCase('es')) || (u.email || '').toLocaleLowerCase('es').includes(additionalInviteSearch.trim().toLocaleLowerCase('es')))).slice(0, 15).map(u => (
                        <button type="button" disabled={invitingToPlan} key={u.id} onClick={() => handleInviteToExistingPlan(u)} className="w-full flex justify-between items-center text-left rounded-xl bg-sky-50 p-2 text-xs font-bold text-sky-800 disabled:opacity-50"><span>{[u.name, u.surname].filter(Boolean).join(' ')}</span><span>+ Invitar</span></button>
                      ))}
                    </div>
                  )}
                  {(activeEvent.pendingInvitations || []).length > 0 && <p className="text-xs text-amber-700">Invitaciones pendientes: {activeEvent.pendingInvitations.join(', ')}</p>}
                </section>
              )}

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
                                setSpotSearchError('');
                              }}
                              className="p-2.5 text-xs text-slate-700 hover:bg-sky-50 cursor-pointer transition flex items-start space-x-2"
                            >
                              <MapPin size={14} className="text-sky-600 shrink-0 mt-0.5" />
                              <span className="line-clamp-2">{item.display_name}</span>
                            </div>
                          ))}
                        </div>
                      )}
                      {newSpotName.trim().length >= 2 && !isSearchingOsm && osmSuggestions.length === 0 && (
                        <div className="px-1 space-y-1">
                          <p className="text-[10px] text-slate-500">{spotSearchError || 'No hay coincidencias. Puedes añadir el nombre manualmente.'}</p>
                          <a
                            href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(newSpotName.trim())}`}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex text-[10px] font-bold text-sky-700 hover:underline"
                          >Buscar este sitio en Google Maps ↗</a>
                        </div>
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
                <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 xl:gap-5 items-start">
                  <div className="bg-white/90 backdrop-blur-2xl p-4 rounded-3xl border border-sky-100 shadow-sm text-center xl:self-stretch xl:flex xl:flex-col xl:justify-center">
                    <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">TOTAL GASTADO POR EL GRUPO</p>
                    <p className="text-2xl font-black text-emerald-600 mt-0.5">{totalSpent.toFixed(2)}€</p>
                  </div>

                  <div className="bg-gradient-to-br from-slate-900 to-sky-950 text-white p-5 rounded-3xl shadow-lg space-y-3 border border-sky-400/20 xl:self-stretch">
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
                    <div className="space-y-2 min-w-0">
                      <h4 className="text-xs font-black uppercase text-slate-700">Gastos Registrados ({validExpenses.length})</h4>
                      {validExpenses.map(exp => (
                        <div key={exp.id} className="bg-white/90 p-3.5 rounded-2xl border border-sky-100 flex flex-wrap justify-between items-center gap-2 text-xs">
                          <div>
                            <p className="font-bold text-slate-800">{exp.description}</p>
                            <p className="text-[10px] text-sky-700 font-semibold flex items-center gap-1 mt-1">
                              <MapPin size={11} className="shrink-0" />
                              <span>Lugar: {validSpots.find(spot => String(spot.id) === String(exp.spot_id))?.name || 'Sin lugar asignado'}</span>
                            </p>
                            <p className="text-[10px] text-slate-500">Pagado por <span className="font-bold text-sky-600">{exp.paid_by}</span> • Reparto: <span className="text-slate-700 font-bold">{getExpenseParticipants(exp, validMembers).join(', ')}</span></p>
                          </div>
                          <div className="flex items-center space-x-2">
                            <span className="font-black text-emerald-600 text-sm">{Number(exp.amount).toFixed(2)}€</span>
                            {exp.receipt_url && (
                              <button onClick={() => setViewingReceiptUrl(exp.receipt_url)} className="bg-sky-50 text-sky-700 px-2 py-1 rounded-xl border border-sky-200 text-[10px] font-bold flex items-center">
                                <Receipt size={12} className="mr-1" /> Ver Ticket
                              </button>
                            )}
                            <button type="button" title="Corregir quién pagó" aria-label={`Corregir pagador de ${exp.description}`}
                              onClick={() => { setEditingExpenseId(editingExpenseId === exp.id ? null : exp.id); setEditingExpensePayer(exp.paid_by); setEditingExpenseAmount(String(exp.amount ?? '')); }}
                              className="bg-sky-50 text-sky-700 p-2 rounded-xl border border-sky-200"><Edit3 size={14} /></button>
                            <button
                              type="button"
                              onClick={() => handleDeleteExpense(exp)}
                              disabled={deletingExpenseId === exp.id}
                              title="Eliminar gasto"
                              aria-label={`Eliminar gasto ${exp.description}`}
                              className="bg-red-50 hover:bg-red-100 disabled:opacity-50 text-red-600 p-2 rounded-xl border border-red-200 transition"
                            >
                              {deletingExpenseId === exp.id ? <Clock size={14} className="animate-spin" /> : <Trash2 size={14} />}
                            </button>
                          </div>
                          {editingExpenseId === exp.id && (
                            <div className="w-full mt-2 pt-2 border-t border-sky-100 grid grid-cols-1 sm:grid-cols-2 gap-2">
                              <label className="text-xs font-bold text-slate-700" htmlFor={`amount-${exp.id}`}>Importe (€)
                                <input id={`amount-${exp.id}`} type="number" min="0.01" step="0.01" inputMode="decimal"
                                  value={editingExpenseAmount} onChange={e => setEditingExpenseAmount(e.target.value)}
                                  className="mt-1 w-full rounded-xl border border-sky-200 bg-white p-2 text-xs" />
                              </label>
                              <label className="text-xs font-bold text-slate-700" htmlFor={`payer-${exp.id}`}>Pagador real:</label>
                              <select id={`payer-${exp.id}`} value={editingExpensePayer} onChange={e => setEditingExpensePayer(e.target.value)}
                                className="w-full rounded-xl border border-sky-200 bg-white p-2 text-xs">
                                {!validMembers.includes(editingExpensePayer) && <option value={editingExpensePayer}>{editingExpensePayer || 'Selecciona'}</option>}
                                {validMembers.map(member => <option key={member} value={member}>{member}</option>)}
                              </select>
                              <div className="flex gap-2 sm:col-span-2">
                                <button type="button" disabled={isUpdatingExpense || !validMembers.includes(editingExpensePayer)}
                                  onClick={() => handleUpdateExpensePayer(exp)} className="flex-1 rounded-xl bg-emerald-600 px-3 py-2 text-white text-xs font-bold disabled:opacity-50">{isUpdatingExpense ? 'Guardando...' : 'Guardar cambios'}</button>
                                <button type="button" onClick={() => { setEditingExpenseId(null); setEditingExpenseAmount(''); }} className="text-xs text-slate-600 px-2">Cancelar</button>
                              </div>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}

                  <form onSubmit={handleAddExpense} className="bg-white/90 backdrop-blur-2xl p-4 xl:p-5 rounded-3xl border border-sky-100 shadow-sm space-y-3 min-w-0">
                    <h4 className="text-xs font-bold text-slate-800">Añadir nuevo gasto con selección de participantes</h4>
                    <label className="sr-only" htmlFor="expense-description">Concepto del gasto</label>
                    <input id="expense-description" type="text" placeholder="Concepto (ej. Cervezas)..." value={expenseDesc} onChange={(e) => setExpenseDesc(e.target.value)} className="w-full bg-sky-50/50 border border-sky-200 rounded-2xl px-3.5 py-2.5 text-xs text-slate-800 focus:outline-none" required />
                    <label className="sr-only" htmlFor="expense-amount">Importe en euros</label>
                    <input id="expense-amount" type="number" min="0.01" step="0.01" inputMode="decimal" placeholder="Importe (€)..." value={expenseAmount} onChange={(e) => setExpenseAmount(e.target.value)} className="w-full bg-sky-50/50 border border-sky-200 rounded-2xl px-3.5 py-2.5 text-xs text-slate-800 focus:outline-none" required />

                    <label className="block text-[11px] font-bold text-slate-700" htmlFor="expense-paid-by">¿Quién ha pagado realmente?</label>
                    <select id="expense-paid-by" value={expensePaidBy} onChange={e => setExpensePaidBy(e.target.value)} required
                      className="w-full bg-sky-50/50 border border-sky-200 rounded-2xl px-3.5 py-2.5 text-xs text-slate-800 focus:outline-none">
                      <option value="">Selecciona pagador...</option>
                      {validMembers.map(member => <option key={member} value={member}>{member}</option>)}
                    </select>

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

                    <button type="submit" disabled={isSavingExpense || isUploadingReceipt || !expenseDesc.trim() || !expenseAmount || expenseParticipants.length === 0 || !validMembers.includes(expensePaidBy)} className="w-full min-h-11 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed text-white text-xs font-bold rounded-2xl py-3 shadow mt-1 transition" aria-live="polite">
                      {isUploadingReceipt ? 'Procesando ticket...' : isSavingExpense ? 'Guardando gasto...' : 'Añadir gasto'}
                    </button>
                  </form>
                </div>
              )}

              {eventSubTab === 'gallery' && (
                <div className="space-y-5">
                  <div className="bg-white/90 backdrop-blur-2xl p-4 rounded-3xl border border-sky-100 shadow-sm space-y-3 lg:max-w-2xl">
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
                      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 2xl:grid-cols-5 gap-3 xl:gap-4">
                        {validPhotos.map(p => (
                          <div key={p.id} className="bg-white/90 p-2 rounded-2xl border border-sky-100 shadow-sm space-y-1">
                            <div className="relative w-full h-32 sm:h-40 xl:h-44 rounded-xl overflow-hidden bg-sky-50">
                              <button type="button" onClick={() => setViewingPhotoUrl(p.url)} className="w-full h-full" aria-label="Ampliar fotografía">
                                <img src={p.url} alt="Foto" className="w-full h-full object-cover" />
                              </button>
                              <button type="button" onClick={() => handleDeletePhoto(p)} disabled={isDeletingPhotoId === p.id}
                                title="Eliminar fotografía" aria-label="Eliminar fotografía"
                                className="absolute top-2 right-2 rounded-full bg-red-600 text-white p-2 shadow disabled:opacity-50">
                                {isDeletingPhotoId === p.id ? <Clock size={13} className="animate-spin" /> : <Trash2 size={13} />}
                              </button>
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
          {canDeleteEvent && (
            <section aria-label="Zona de peligro" className="mt-10 pt-6 border-t-2 border-red-200 space-y-3">
              <p className="text-[11px] font-black uppercase tracking-wider text-red-700">Zona de peligro · Última opción</p>
              <p className="text-xs text-slate-600">Eliminar el plan borra definitivamente sus participantes, lugares, gastos, comentarios y fotos. Si solo ha terminado la salida, utiliza «Cerrar salida» para conservar el historial.</p>
              <button type="button" onClick={() => handleDeleteEvent(activeEvent.id, activeEvent.title)}
                className="w-full flex items-center justify-center gap-2 rounded-2xl border border-red-300 bg-red-50 px-4 py-3 text-xs font-bold text-red-700 hover:bg-red-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-red-600 transition">
                <Trash2 size={16} /> Eliminar plan definitivamente
              </button>
              <p className="text-[10px] text-red-700 text-center">Solo el creador o un administrador · Requiere doble confirmación</p>
            </section>
          )}
        </main>

        {viewingPhotoUrl && (
          <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white max-w-sm w-full p-4 rounded-[2rem] shadow-2xl space-y-4 border border-sky-100 text-center">
              <div className="flex justify-between items-center px-1">
                <h3 className="font-black text-slate-800 text-sm">{viewingPhotoUrl === currentUser?.avatar_url ? 'Foto de perfil' : 'Foto del Plan'}</h3>
                <button onClick={() => setViewingPhotoUrl(null)} className="p-1 bg-sky-50 rounded-full text-slate-600"><X size={18} /></button>
              </div>
              <div className="w-full max-h-96 rounded-2xl overflow-hidden border border-sky-200 bg-sky-50 flex items-center justify-center">
                <img src={viewingPhotoUrl} alt="Foto" className="w-full h-auto object-contain max-h-96" />
              </div>
              <button onClick={() => setViewingPhotoUrl(null)} className="w-full bg-sky-600 text-white font-bold py-2.5 rounded-xl text-xs">Cerrar</button>
            </div>
          </div>
        )}

        {renderAppMessages()}
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

  const validEvents = Array.isArray(events) ? events.filter(canViewEvent) : [];
  const myEventsAll = validEvents.filter(e => e.creator_id === currentUser?.id || isEventMember(e));
  const activeMyEvents = myEventsAll.filter(e => e.status !== 'closed');
  const closedMyEvents = myEventsAll.filter(e => e.status === 'closed');
  const matchesPlanFilters = (e, query, from, to) => {
    const q = query.trim().toLocaleLowerCase('es');
    const date = String(e.date || '').slice(0, 10);
    return (!q || String(e.title || '').toLocaleLowerCase('es').includes(q) || String(e.creator_name || '').toLocaleLowerCase('es').includes(q) || String(e.description || '').toLocaleLowerCase('es').includes(q))
      && (!from || (date && date >= from)) && (!to || (date && date <= to));
  };
  // Privacidad de la búsqueda: mostrar solo planes a los que pertenece el usuario o a los que ha sido invitado.
  const filteredSearchEvents = validEvents.filter(e =>
    e.status !== 'closed' &&
    canViewEvent(e) &&
    matchesPlanFilters(e, searchQuery, searchPlanFrom, searchPlanTo)
  );
  const filteredMyEvents = myEventsAll.filter(e => (myPlanStatus === 'all' || (myPlanStatus === 'closed' ? e.status === 'closed' : e.status !== 'closed')) && matchesPlanFilters(e, myPlanQuery, myPlanFrom, myPlanTo));
  const PLAN_PAGE_SIZE = 6;
  const paginatePlans = (items, page) => items.slice((page - 1) * PLAN_PAGE_SIZE, page * PLAN_PAGE_SIZE);
  const myPlanPages = Math.max(1, Math.ceil(filteredMyEvents.length / PLAN_PAGE_SIZE));
  const searchPlanPages = Math.max(1, Math.ceil(filteredSearchEvents.length / PLAN_PAGE_SIZE));
  const currentMyPage = Math.min(myPlanPage, myPlanPages);
  const currentSearchPage = Math.min(searchPlanPage, searchPlanPages);
  const visibleMyEvents = paginatePlans(filteredMyEvents, currentMyPage);
  const visibleSearchEvents = paginatePlans(filteredSearchEvents, currentSearchPage);
  const renderPlanPagination = (page, pages, onPageChange) => pages <= 1 ? null : (
    <nav aria-label="Paginación de planes" className="flex items-center justify-between gap-2 pt-2">
      <button type="button" disabled={page <= 1} onClick={() => onPageChange(page - 1)} className="rounded-xl border border-sky-200 px-3 py-2 text-xs font-bold text-sky-700 disabled:opacity-40">← Anterior</button>
      <span className="text-xs font-bold text-slate-600">Página {page} de {pages}</span>
      <button type="button" disabled={page >= pages} onClick={() => onPageChange(page + 1)} className="rounded-xl border border-sky-200 px-3 py-2 text-xs font-bold text-sky-700 disabled:opacity-40">Siguiente →</button>
    </nav>
  );

  // Calendario personal: únicamente planes activos confirmados o invitaciones recibidas.
  const calendarEvents = validEvents.filter(e => e.status !== 'closed' &&
    canViewEvent(e) &&
    /^\d{4}-\d{2}-\d{2}$/.test(String(e.date || '').slice(0, 10)));
  const eventDateKey = e => String(e.date).slice(0, 10);
  const dateKey = (y, m, d) => `${y}-${String(m + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
  const todayKey = (() => { const d = new Date(); return dateKey(d.getFullYear(), d.getMonth(), d.getDate()); })();
  const monthStartOffset = (new Date(calendarYear, calendarMonth, 1).getDay() + 6) % 7;
  const daysInMonth = new Date(calendarYear, calendarMonth + 1, 0).getDate();
  const calendarCells = Array.from({ length: Math.ceil((monthStartOffset + daysInMonth) / 7) * 7 }, (_, i) => {
    const day = i - monthStartOffset + 1;
    return day > 0 && day <= daysInMonth ? day : null;
  });
  const selectedDayEvents = selectedCalendarDate ? calendarEvents.filter(e => eventDateKey(e) === selectedCalendarDate) : [];
  const upcomingEvent = calendarEvents.filter(e => e.members?.includes(currentUser?.name) && eventDateKey(e) >= todayKey)
    .sort((a, b) => eventDateKey(a).localeCompare(eventDateKey(b)))[0];
  const changeCalendarMonth = offset => {
    const d = new Date(calendarYear, calendarMonth + offset, 1);
    setCalendarYear(d.getFullYear());
    setCalendarMonth(d.getMonth());
    setSelectedCalendarDate(null);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-sky-50 via-blue-50 to-indigo-100 text-slate-800 pb-24 md:pb-8 md:pl-64 relative overflow-hidden">
      <aside className="hidden md:flex fixed inset-y-0 left-0 z-50 w-64 flex-col bg-white/95 backdrop-blur-xl border-r border-sky-100 shadow-lg p-5">
        <div className="flex items-center gap-3 pb-7 border-b border-sky-100"><div className="w-10 h-10 bg-gradient-to-tr from-sky-500 to-indigo-600 rounded-2xl flex items-center justify-center text-white font-black shadow-md">N</div><div><p className="font-extrabold text-slate-800">Nosotros</p><p className="text-xs text-slate-500">Planes y experiencias</p></div></div>
        <nav className="mt-6 space-y-2" aria-label="Navegación principal">
          <button onClick={() => setActiveTab('my-events')} className={`w-full flex items-center gap-3 rounded-xl px-3 py-3 text-sm ${activeTab === 'my-events' ? 'bg-sky-50 text-sky-700 font-black' : 'text-slate-600 hover:bg-slate-50 font-semibold'}`}><Calendar size={18}/> Mis Salidas</button>
          <button onClick={() => setActiveTab('search')} className={`w-full flex items-center gap-3 rounded-xl px-3 py-3 text-sm ${activeTab === 'search' ? 'bg-sky-50 text-sky-700 font-black' : 'text-slate-600 hover:bg-slate-50 font-semibold'}`}><Search size={18}/> Buscar planes</button>
          <button onClick={() => setActiveTab('profile')} className={`w-full flex items-center gap-3 rounded-xl px-3 py-3 text-sm ${activeTab === 'profile' ? 'bg-sky-50 text-sky-700 font-black' : 'text-slate-600 hover:bg-slate-50 font-semibold'}`}><Settings size={18}/> Perfil</button>
          <button onClick={() => setActiveTab('notifications')} className={`w-full flex items-center gap-3 rounded-xl px-3 py-3 text-sm relative ${activeTab === 'notifications' ? 'bg-sky-50 text-sky-700 font-black' : 'text-slate-600 hover:bg-slate-50 font-semibold'}`}><Inbox size={18}/> Aprobaciones{(myPendingInvitations.length + allPendingPlanRequests.length + (isAdmin ? pendingRegistrations.length : 0)) > 0 && <span className="ml-auto rounded-full bg-red-600 text-white text-[10px] px-2 py-0.5">{myPendingInvitations.length + allPendingPlanRequests.length + (isAdmin ? pendingRegistrations.length : 0)}</span>}</button>
        </nav>
        <div className="mt-auto border-t border-sky-100 pt-4 flex items-center gap-3"><div className="w-9 h-9 rounded-full overflow-hidden bg-sky-100 border border-sky-200 flex items-center justify-center text-sky-700 font-bold">{currentUser?.avatar_url ? <img src={currentUser.avatar_url} alt="" className="w-full h-full object-cover"/> : (currentUser?.name?.[0] || 'U')}</div><div className="min-w-0"><p className="text-sm font-bold truncate">{currentUser?.name || 'Usuario'}</p><p className="text-xs text-slate-500">{isAdmin ? 'Administrador' : 'Usuario'}</p></div></div>
      </aside>
      <header className="bg-white/90 backdrop-blur-2xl border-b border-sky-100 p-4 md:px-7 md:py-4 sticky top-0 z-40 flex justify-between items-center shadow-sm">
        <div className="flex items-center space-x-2">
          <div className="w-9 h-9 bg-gradient-to-tr from-sky-500 to-indigo-600 rounded-2xl flex items-center justify-center text-white font-black text-sm shadow-md">N</div>
          <span className="font-extrabold text-slate-800 text-base md:text-lg">Nosotros <span className="hidden md:inline text-xs font-medium text-slate-400 ml-2">Tu espacio para organizar planes</span></span>
        </div>
        <div className="flex items-center space-x-3">
          <button type="button" onClick={() => setActiveTab('notifications')} aria-label={`Abrir notificaciones${unreadNotificationsCount ? `, ${unreadNotificationsCount} sin leer` : ''}`}
            className="relative p-2 rounded-full bg-sky-50 text-sky-700 border border-sky-200 hover:bg-sky-100">
            <Bell size={18} />
            {unreadNotificationsCount > 0 && <span className="absolute top-0 right-0 w-2.5 h-2.5 rounded-full bg-red-600 ring-2 ring-white" />}
          </button>
          <span className="text-xs font-bold text-slate-700 hidden sm:inline">Hola, {currentUser?.name || 'Usuario'}</span>
          <button type="button" onClick={() => currentUser?.avatar_url && setViewingPhotoUrl(currentUser.avatar_url)}
            aria-label="Ver foto de perfil" className="w-9 h-9 rounded-full overflow-hidden border-2 border-sky-200 bg-sky-100 flex items-center justify-center text-sky-700 font-black text-sm shrink-0">
            {currentUser?.avatar_url ? <img src={currentUser.avatar_url} alt="Foto de perfil" className="w-full h-full object-cover" /> : (currentUser?.name?.charAt(0)?.toUpperCase() || 'U')}
          </button>
          <button onClick={handleLogout} className="text-xs bg-sky-50 hover:bg-red-50 text-slate-600 px-3 py-1.5 rounded-full font-bold border border-sky-200">Salir</button>
        </div>
      </header>

      <main className="w-full max-w-md md:max-w-7xl mx-auto p-4 md:p-7 space-y-6">
        {activeTab === 'my-events' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 xl:grid-cols-[minmax(260px,320px)_minmax(0,680px)] gap-4 items-start">
            <button onClick={() => setShowCreateModal(true)} className="w-full bg-gradient-to-r from-sky-600 to-indigo-600 text-white font-bold py-3 px-4 rounded-2xl text-sm shadow-lg flex items-center justify-center space-x-2">
              <Plus size={18} /> <span>Crear Nueva Salida / Plan</span>
            </button>

            <section className="bg-white/95 rounded-3xl border border-sky-100 p-4 shadow-sm space-y-3" aria-label="Mi calendario de planes">
              <div className="flex items-center justify-between gap-2">
                <h2 className="text-sm font-black text-slate-800 flex items-center gap-2"><Calendar size={17} className="text-sky-600" /> Mi calendario</h2>
                <button type="button" aria-expanded={calendarExpanded} aria-controls="personal-calendar-content" onClick={() => setCalendarExpanded(v => !v)} className="text-xs font-bold text-sky-700 px-3 py-2 rounded-xl bg-sky-50 border border-sky-200">{calendarExpanded ? 'Ocultar ▲' : 'Mostrar calendario ▼'}</button>
              </div>
              {calendarExpanded && <div id="personal-calendar-content" className="space-y-3">
              <div className="flex justify-end"><button type="button" onClick={() => { const d = new Date(); setCalendarYear(d.getFullYear()); setCalendarMonth(d.getMonth()); setSelectedCalendarDate(todayKey); }} className="text-xs font-bold text-sky-700 px-2 py-1 rounded-lg bg-sky-50">Hoy</button></div>
              {upcomingEvent && <button type="button" onClick={() => setActiveEvent(upcomingEvent)} className="w-full text-left rounded-xl bg-emerald-50 border border-emerald-200 px-3 py-2 text-xs text-emerald-900">
                <span className="font-black">Próximo encuentro:</span> {upcomingEvent.title} · {formatPlanDateES(eventDateKey(upcomingEvent))} →
              </button>}
              <div className="flex justify-between items-center">
                <button type="button" onClick={() => changeCalendarMonth(-1)} aria-label="Mes anterior" className="p-2 rounded-xl bg-sky-50 text-sky-700"><ArrowLeft size={18} /></button>
                <span className="text-sm font-extrabold capitalize" aria-live="polite">{new Intl.DateTimeFormat('es-ES', { month: 'long', year: 'numeric' }).format(new Date(calendarYear, calendarMonth, 1))}</span>
                <button type="button" onClick={() => changeCalendarMonth(1)} aria-label="Mes siguiente" className="p-2 rounded-xl bg-sky-50 text-sky-700"><ArrowRight size={18} /></button>
              </div>
              <div className="grid grid-cols-7 gap-1 text-center text-[10px] font-bold text-slate-500">
                {['L', 'M', 'X', 'J', 'V', 'S', 'D'].map((label, i) => <span key={i}>{label}</span>)}
              </div>
              <div className="grid grid-cols-7 gap-1">
                {calendarCells.map((day, i) => {
                  if (!day) return <span key={`empty-${i}`} className="h-11" />;
                  const key = dateKey(calendarYear, calendarMonth, day);
                  const dayEvents = calendarEvents.filter(e => eventDateKey(e) === key);
                  const confirmed = dayEvents.some(e => e.members?.includes(currentUser?.name));
                  const invited = dayEvents.some(e => isEventInvited(e));
                  const pendingClosure = dayEvents.some(e => isPlanPendingClosure(e));
                  return <button key={key} type="button" onClick={() => setSelectedCalendarDate(key)} aria-label={`${day} de ${calendarMonth + 1}: ${dayEvents.length} planes`} aria-pressed={selectedCalendarDate === key}
                    className={`h-11 rounded-xl flex flex-col items-center justify-center gap-1 text-xs font-bold border ${selectedCalendarDate === key ? 'ring-2 ring-sky-500 border-sky-400 bg-sky-50' : key === todayKey ? 'border-sky-300 bg-sky-50' : pendingClosure ? 'border-orange-300 bg-orange-50 hover:bg-orange-100' : 'border-transparent hover:bg-slate-50'} text-slate-800`}>
                    <span>{day}</span><span className="flex gap-0.5 min-h-[5px]">{pendingClosure && <span className="w-1.5 h-1.5 rounded-full bg-orange-600" />}{confirmed && !pendingClosure && <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />}{invited && <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />}</span>
                  </button>;
                })}
              </div>
              <div className="flex flex-wrap gap-3 text-[11px] text-slate-600 font-semibold">
                <span className="flex items-center gap-1"><span className="w-2 h-2 bg-emerald-500 rounded-full" /> Confirmado</span>
                <span className="flex items-center gap-1"><span className="w-2 h-2 bg-amber-500 rounded-full" /> Invitación pendiente</span>
                <span className="flex items-center gap-1"><span className="w-2 h-2 bg-orange-600 rounded-full" /> Pendiente de cierre</span>
              </div>
              {selectedCalendarDate && <div className="border-t border-sky-100 pt-3 space-y-2">
                <h3 className="text-xs font-black text-slate-700">{formatPlanDateES(selectedCalendarDate)}</h3>
                {selectedDayEvents.length === 0 ? <div className="space-y-2"><p className="text-xs text-slate-500">No tienes planes para este día.</p>
                  <button type="button" onClick={() => { setNewDate(selectedCalendarDate); setShowCreateModal(true); }} className="text-xs font-bold bg-sky-600 text-white px-3 py-2 rounded-xl">+ Crear plan este día</button></div> :
                  selectedDayEvents.map(event => {
                    const isConfirmed = event.members?.includes(currentUser?.name);
                    return <div key={event.id} className="rounded-xl border border-slate-200 p-3 flex flex-wrap items-center justify-between gap-2">
                      <div className="min-w-0"><p className="font-bold text-sm text-slate-800 break-words">{event.title}</p><p className={`text-[11px] font-bold ${isPlanPendingClosure(event) ? 'text-orange-700' : isConfirmed ? 'text-emerald-700' : 'text-amber-700'}`}>{isPlanPendingClosure(event) ? '● Pendiente de cierre' : isConfirmed ? '● Confirmado' : '● Invitación pendiente'}</p></div>
                      {isConfirmed ? <button type="button" onClick={() => setActiveEvent(event)} className="text-xs font-bold bg-sky-600 text-white px-3 py-2 rounded-xl">Entrar</button> :
                        <div className="flex gap-1"><button type="button" disabled={!!processingInvitationId} onClick={() => handleCalendarInvitation(event.id, true)} className="text-xs font-bold bg-emerald-600 text-white px-2 py-2 rounded-lg disabled:opacity-50">Aceptar</button>
                          <button type="button" disabled={!!processingInvitationId} onClick={() => handleCalendarInvitation(event.id, false)} className="text-xs font-bold bg-red-50 text-red-700 px-2 py-2 rounded-lg disabled:opacity-50">Rechazar</button></div>}
                    </div>;
                  })}
              </div>}
              </div>}
            </section>
            </div>

            <section className="space-y-3">
              <h2 className="text-sm font-black text-slate-800 px-1">Mis planes ({filteredMyEvents.length})</h2>
              <div className="bg-white rounded-2xl border border-sky-100 p-3 md:p-4 space-y-3">
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-[minmax(210px,2fr)_minmax(130px,1fr)_minmax(145px,1fr)_minmax(145px,1fr)] gap-3 items-end">
                <label className="block min-w-0 text-xs font-bold text-slate-700">Buscar por nombre u organizador
                  <input type="search" value={myPlanQuery} onChange={e => { setMyPlanQuery(e.target.value); setMyPlanPage(1); }} placeholder="Buscar mis planes..." className="mt-1 w-full rounded-xl border border-sky-200 p-2.5 text-sm" />
                </label>
                <label className="block min-w-0 text-xs font-bold text-slate-700">Estado
                  <select value={myPlanStatus} onChange={e => { setMyPlanStatus(e.target.value); setMyPlanPage(1); }} className="mt-1 w-full rounded-xl border border-sky-200 p-2.5 text-sm">
                    <option value="active">Activos</option><option value="closed">Cerrados</option><option value="all">Todos</option>
                  </select>
                </label>
                <div className="grid grid-cols-2 gap-3 md:col-span-2 xl:col-span-2">
                  <label className="text-xs font-bold text-slate-700">Desde<input lang="es-ES" type="date" value={myPlanFrom} onChange={e => { setMyPlanFrom(e.target.value); setMyPlanPage(1); }} className="mt-1 w-full min-w-0 rounded-xl border border-sky-200 p-2 text-xs" /></label>
                  <label className="text-xs font-bold text-slate-700">Hasta<input lang="es-ES" type="date" value={myPlanTo} onChange={e => { setMyPlanTo(e.target.value); setMyPlanPage(1); }} className="mt-1 w-full min-w-0 rounded-xl border border-sky-200 p-2 text-xs" /></label>
                </div>
                </div>
                <button type="button" onClick={() => { setMyPlanQuery(''); setMyPlanStatus('active'); setMyPlanFrom(''); setMyPlanTo(''); setMyPlanPage(1); }} className="text-xs font-bold text-sky-700">Limpiar filtros</button>
              </div>
              {visibleMyEvents.length === 0 && <p className="rounded-xl bg-slate-50 p-4 text-xs text-slate-600">No hay planes que coincidan con los filtros.</p>}
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3">
              {visibleMyEvents.map(event => (
                <button key={event.id} type="button" onClick={() => setActiveEvent(event)} className={`w-full text-left rounded-2xl border p-3.5 flex justify-between items-center gap-2 shadow-sm ${event.status === 'closed' ? 'bg-amber-50/60 border-amber-200' : 'bg-white/90 border-sky-100'}`}>
                  <span className="min-w-0"><span className="block text-[10px] font-bold text-sky-700">{event.status === 'closed' ? '🔒 Cerrado' : isPlanPendingClosure(event) ? '🟠 Pendiente de cierre' : '📅 Activo'} · {formatPlanDateES(event.date)}</span><span className="block font-black text-slate-800 text-sm mt-1 break-words">{event.title}</span></span>
                  <span className="shrink-0 text-xs font-bold text-sky-700">{event.status === 'closed' ? 'Historial →' : 'Entrar →'}</span>
                </button>
              ))}
              </div>
              {renderPlanPagination(currentMyPage, myPlanPages, setMyPlanPage)}
            </section>
          </div>
        )}

        {activeTab === 'search' && (
          <div className="space-y-4">
            <input 
              type="text" 
              placeholder="Buscar por título, descripción o creador..." 
              value={searchQuery} 
              onChange={(e) => { setSearchQuery(e.target.value); setSearchPlanPage(1); }} 
              className="w-full bg-white/90 border border-sky-200 rounded-2xl px-4 py-3 text-sm text-slate-800" 
            />
            <div className="grid grid-cols-2 gap-2">
              <label className="text-xs font-bold text-slate-700">Desde<input lang="es-ES" type="date" value={searchPlanFrom} onChange={e => { setSearchPlanFrom(e.target.value); setSearchPlanPage(1); }} className="mt-1 w-full min-w-0 rounded-xl border border-sky-200 p-2 text-xs" /></label>
              <label className="text-xs font-bold text-slate-700">Hasta<input lang="es-ES" type="date" value={searchPlanTo} onChange={e => { setSearchPlanTo(e.target.value); setSearchPlanPage(1); }} className="mt-1 w-full min-w-0 rounded-xl border border-sky-200 p-2 text-xs" /></label>
            </div>
            <button type="button" onClick={() => { setSearchQuery(''); setSearchPlanFrom(''); setSearchPlanTo(''); setSearchPlanPage(1); }} className="text-xs font-bold text-sky-700">Limpiar filtros</button>
            <div className="space-y-3">
              <h2 className="text-sm font-black text-slate-800 px-1">Planes en los que participas o estás invitado ({filteredSearchEvents.length})</h2>
              {filteredSearchEvents.length === 0 && <p className="text-xs text-slate-600">No tienes planes ni invitaciones que coincidan con los filtros.</p>}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
              {visibleSearchEvents.map((event) => {
                const membersList = Array.isArray(event.members) ? event.members : [];
                const isMember = isEventMember(event) || event.creator_id === currentUser?.id;
                const isInvited = isEventInvited(event);

                return (
                  <article key={event.id} className="bg-white/90 rounded-2xl border border-sky-100 p-4 shadow-sm flex justify-between items-center">
                    <div>
                      <span className="text-[10px] font-bold text-sky-700 bg-sky-50 px-2 py-0.5 rounded-full">📅 {formatPlanDateES(event.date)} • Organiza: {event.creator_name}</span>
                      <h3 className="font-bold text-sm text-slate-800 mt-1">{event.title}</h3>
                      {event.description && <p className="text-xs text-slate-600 mt-1 whitespace-pre-wrap break-words">{event.description}</p>}
                    </div>
                    {isMember ? (
                      <button onClick={() => setActiveEvent(event)} className="text-xs font-bold text-sky-700 bg-sky-50 px-3 py-2 rounded-xl border border-sky-200">Ver Plan</button>
                    ) : isInvited ? (
                      <div className="flex flex-col gap-1.5">
                        <button type="button" disabled={processingInvitationId === event.id} onClick={() => handleCalendarInvitation(event.id, true)} className="bg-emerald-600 text-white text-xs font-bold px-3 py-2 rounded-xl">Aceptar invitación</button>
                        <button type="button" disabled={processingInvitationId === event.id} onClick={() => handleCalendarInvitation(event.id, false)} className="text-xs font-bold text-red-700 border border-red-200 px-3 py-2 rounded-xl">Rechazar</button>
                      </div>
                    ) : null}
                  </article>
                );
              })}
              </div>
              {renderPlanPagination(currentSearchPage, searchPlanPages, setSearchPlanPage)}
            </div>
          </div>
        )}

        {/* PESTAÑA PERFIL Y CAMBIO DE CONTRASEÑA PROPIA */}
        {activeTab === 'profile' && (
          <div className="space-y-4">
            <div className="bg-white/90 backdrop-blur-2xl p-6 rounded-[2.5rem] border border-sky-100 shadow-sm space-y-4">
              <div className="flex items-center gap-3">
                <button type="button" onClick={() => editAvatarUrl && setViewingPhotoUrl(editAvatarUrl)} aria-label="Ampliar foto de perfil"
                  className="w-16 h-16 rounded-full overflow-hidden border-2 border-sky-200 bg-sky-100 flex items-center justify-center text-sky-700 font-black text-xl shrink-0">
                  {editAvatarUrl ? <img src={editAvatarUrl} alt="Foto de perfil" className="w-full h-full object-cover" /> : (currentUser?.name?.charAt(0)?.toUpperCase() || 'U')}
                </button>
                <div className="min-w-0">
                  <h2 className="font-black text-slate-800 text-base">{currentUser?.name || 'Usuario'} {currentUser?.surname || ''}</h2>
                  <p className="text-xs text-slate-500 break-all">{currentUser?.email || ''}</p>
                  <label className="inline-flex mt-2 items-center gap-1.5 text-[11px] font-bold text-sky-700 cursor-pointer">
                    <Camera size={13} /> {isProcessingAvatar ? 'Procesando imagen…' : 'Cambiar fotografía'}
                    <input type="file" accept="image/*" onChange={handleProfilePhotoChange} disabled={isProcessingAvatar} className="hidden" />
                  </label>
                  {editAvatarUrl && <button type="button" onClick={() => setEditAvatarUrl('')} className="ml-3 text-[11px] font-bold text-red-600">Quitar foto</button>}
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
                  <label className="block text-[11px] font-bold text-slate-700">Apellidos</label>
                  <input type="text" value={editSurnameInput} onChange={(e) => setEditSurnameInput(e.target.value)} placeholder="Tus apellidos" className="w-full bg-sky-50/50 border border-sky-200 rounded-2xl px-4 py-2.5 text-xs text-slate-800 focus:outline-none" />
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
            <section className="bg-white/95 p-5 rounded-[2.5rem] border border-sky-200 shadow-sm space-y-3">
              <div className="flex items-center justify-between gap-2">
                <h2 className="text-sm font-black text-slate-800 flex items-center gap-2"><Bell size={17} className="text-sky-600" /> Comunicados y avisos</h2>
                {unreadNotificationsCount > 0 && <span className="text-[10px] font-black bg-red-100 text-red-700 px-2.5 py-1 rounded-full">{unreadNotificationsCount} sin leer</span>}
              </div>
              {notifications.length === 0 ? <p className="text-xs text-slate-500">No tienes comunicados nuevos.</p> : (
                <div className="space-y-2">
                  {notifications.map(item => {
                    const notice = item.notifications;
                    return (
                      <button key={item.id} type="button" onClick={() => handleOpenNotification(item)}
                        className={`w-full text-left p-3 rounded-2xl border transition ${item.read_at ? 'bg-white border-slate-200' : 'bg-sky-50 border-sky-300'}`}>
                        <div className="flex items-start justify-between gap-2">
                          <span className="font-bold text-xs text-slate-800">{notice.title}</span>
                          {!item.read_at && <span className="mt-1 w-2 h-2 rounded-full bg-red-600 shrink-0" aria-label="Sin leer" />}
                        </div>
                        <p className="text-xs text-slate-600 mt-1 whitespace-pre-wrap">{notice.message}</p>
                        <div className="flex justify-between gap-2 mt-2 text-[10px] text-slate-500">
                          <span className="capitalize">{notice.category || 'general'}</span>
                          <span>{formatDateTimeES(notice.created_at || item.created_at)}</span>
                        </div>
                        {notice.event_id && <span className="inline-flex items-center gap-1 mt-2 text-[10px] font-bold text-sky-700"><ArrowRight size={12} /> Abrir plan relacionado</span>}
                      </button>
                    );
                  })}
                </div>
              )}
            </section>

            {isAdmin && (
              <section className="bg-white/95 p-5 rounded-[2.5rem] border border-emerald-200 shadow-sm space-y-3">
                <h2 className="text-sm font-black text-slate-800 flex items-center gap-2"><Send size={16} className="text-emerald-600" /> Enviar comunicado</h2>
                <form onSubmit={handleSendNotification} className="space-y-3">
                  <label className="block text-[11px] font-bold text-slate-700">Usar plantilla guardada
                    <select value={selectedNotificationTemplate} onChange={e => handleSelectNotificationTemplate(e.target.value)} className="mt-1 w-full rounded-xl border border-sky-200 bg-white p-2.5 text-xs">
                      <option value="">Redactar desde cero...</option>
                      {notificationTemplates.map(template => <option key={template.id} value={template.id}>{template.title}</option>)}
                    </select>
                  </label>
                  <label className="block text-[11px] font-bold text-slate-700">Título
                    <input value={notificationTitle} onChange={e => setNotificationTitle(e.target.value)} maxLength={120} required placeholder="Ej. Nueva versión disponible" className="mt-1 w-full rounded-xl border border-sky-200 p-2.5 text-xs" />
                  </label>
                  <label className="block text-[11px] font-bold text-slate-700">Mensaje
                    <textarea value={notificationMessage} onChange={e => setNotificationMessage(e.target.value)} rows={4} maxLength={3000} required placeholder="Escribe el comunicado..." className="mt-1 w-full rounded-xl border border-sky-200 p-2.5 text-xs" />
                  </label>
                  <label className="block text-[11px] font-bold text-slate-700">Categoría
                    <select value={notificationCategory} onChange={e => setNotificationCategory(e.target.value)} className="mt-1 w-full rounded-xl border border-sky-200 p-2.5 text-xs">
                      <option value="general">Aviso general</option><option value="version">Nueva versión</option><option value="incidencia">Fallo en el sistema</option><option value="funcionalidad">Nueva funcionalidad</option><option value="mantenimiento">Mantenimiento</option>
                    </select>
                  </label>
                  <fieldset className="space-y-2">
                    <legend className="text-[11px] font-bold text-slate-700">Destinatarios</legend>
                    <div className="flex gap-3 text-xs">
                      <label className="flex items-center gap-1"><input type="radio" name="notification-target" checked={notificationTargetMode === 'all'} onChange={() => setNotificationTargetMode('all')} /> Todos los usuarios</label>
                      <label className="flex items-center gap-1"><input type="radio" name="notification-target" checked={notificationTargetMode === 'selected'} onChange={() => setNotificationTargetMode('selected')} /> Seleccionar</label>
                    </div>
                    {notificationTargetMode === 'selected' && (
                      <div className="max-h-40 overflow-y-auto rounded-xl border border-sky-100 p-2 space-y-1">
                        {registeredUsers.filter(user => user.is_approved && !user.is_blocked).map(user => (
                          <label key={user.id} className="flex items-center gap-2 text-xs text-slate-700 py-1">
                            <input type="checkbox" checked={selectedNotificationUsers.includes(user.id)}
                              onChange={e => setSelectedNotificationUsers(prev => e.target.checked ? [...new Set([...prev, user.id])] : prev.filter(id => id !== user.id))} />
                            <span>{user.name} <span className="text-slate-400">({user.email})</span></span>
                          </label>
                        ))}
                      </div>
                    )}
                  </fieldset>
                  <div className="flex flex-wrap gap-2">
                    <button type="button" onClick={handleSaveNotificationTemplate} disabled={isSavingNotificationTemplate || !notificationTitle.trim() || !notificationMessage.trim()}
                      className="flex-1 rounded-xl border border-sky-200 bg-sky-50 px-3 py-2.5 text-xs font-bold text-sky-700 disabled:opacity-50">
                      {isSavingNotificationTemplate ? 'Guardando...' : 'Guardar como plantilla'}
                    </button>
                    <button type="submit" disabled={isSendingNotification || !notificationTitle.trim() || !notificationMessage.trim() || (notificationTargetMode === 'selected' && selectedNotificationUsers.length === 0)}
                      className="flex-1 rounded-xl bg-emerald-600 px-3 py-2.5 text-xs font-bold text-white disabled:opacity-50">
                      {isSendingNotification ? 'Enviando...' : 'Enviar comunicado'}
                    </button>
                  </div>
                </form>
                <div className="pt-3 border-t border-emerald-100 space-y-2">
                  <h3 className="text-xs font-black text-slate-800">Últimos comunicados enviados</h3>
                  {adminNotificationHistory.length === 0 ? <p className="text-[11px] text-slate-500">Todavía no hay comunicados enviados.</p> : (
                    <div className="space-y-2 max-h-64 overflow-y-auto">
                      {adminNotificationHistory.map(item => (
                        <article key={item.id} className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                          <div className="flex justify-between gap-2">
                            <p className="text-xs font-bold text-slate-800">{item.title}</p>
                            <span className="text-[9px] text-slate-500 shrink-0">{formatDateES(item.created_at)}</span>
                          </div>
                          <p className="text-[11px] text-slate-600 mt-1 whitespace-pre-wrap">{item.message}</p>
                          <p className="text-[10px] text-sky-700 mt-1 capitalize">{item.category || 'general'}</p>
                        </article>
                      ))}
                    </div>
                  )}
                </div>
              </section>
            )}

            <div className="bg-white/90 p-5 rounded-[2.5rem] border border-amber-200 shadow-sm space-y-3">
              <h2 className="text-sm font-black text-slate-800 flex items-center"><Mail size={16} className="mr-1.5 text-amber-600" /> Invitaciones que he recibido ({myPendingInvitations.length})</h2>
              {myPendingInvitations.length === 0 ? <p className="text-xs text-slate-500">No tienes invitaciones pendientes.</p> : (
                <div className="space-y-2">{myPendingInvitations.map(inv => (
                  <div key={inv.eventId} className="p-3 rounded-2xl bg-amber-50 border border-amber-200 space-y-2">
                    <p className="text-xs font-bold text-slate-800">{inv.eventTitle}</p>
                    <p className="text-[11px] text-slate-600">{inv.date} · Te invita {inv.creatorName}</p>
                    <div className="flex gap-2">
                      <button type="button" disabled={processingInvitationId === inv.eventId} onClick={() => handleCalendarInvitation(inv.eventId, true)} className="rounded-xl px-3 py-2 bg-emerald-600 text-white text-xs font-bold disabled:opacity-50">Aceptar</button>
                      <button type="button" disabled={processingInvitationId === inv.eventId} onClick={() => handleCalendarInvitation(inv.eventId, false)} className="rounded-xl px-3 py-2 bg-white border border-red-200 text-red-700 text-xs font-bold disabled:opacity-50">Rechazar</button>
                    </div>
                  </div>
                ))}</div>
              )}
            </div>
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
              <div className="grid grid-cols-1 xl:grid-cols-[minmax(300px,0.85fr)_minmax(0,1.6fr)] gap-4 items-start">
                <div className="bg-white/90 p-4 xl:p-5 rounded-[2rem] border border-emerald-100 shadow-sm space-y-3 min-w-0">
                  <h2 className="text-sm font-black text-slate-800 flex items-center">
                    <ShieldCheck size={16} className="mr-1.5 text-emerald-600" /> Cuentas de Usuario Pendientes ({pendingRegistrations.length})
                  </h2>
                  {pendingRegistrations.length === 0 ? (
                    <p className="text-xs text-slate-400">No hay cuentas nuevas pendientes de aprobación.</p>
                  ) : (
                    <div className="space-y-2">
                      {pendingRegistrations.map(reg => (
                        <div key={reg.id} className="p-3.5 rounded-2xl border border-emerald-200 bg-emerald-50/50 flex flex-wrap justify-between items-center gap-2 text-xs">
                          <div>
                            <p className="font-bold text-slate-800">{[reg.name, reg.surname].filter(Boolean).join(' ')}</p>
                            <p className="text-[10px] text-slate-500">{reg.email}</p>
                          </div>
                          <div className="flex gap-1.5">
                            <button disabled={!!processingRegistrationId} onClick={() => handleApproveRegistration(reg.id, reg.name)} className="px-3 py-1.5 rounded-xl font-bold bg-emerald-600 text-white">Aprobar</button>
                            <button disabled={!!processingRegistrationId} onClick={() => handleRejectRegistration(reg.id)} className="px-3 py-1.5 rounded-xl font-bold bg-red-100 text-red-700">Rechazar</button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="bg-white/90 p-4 xl:p-5 rounded-[2rem] border border-sky-100 shadow-sm space-y-3 min-w-0">
                  <p className="text-xs text-amber-800 bg-amber-50 border border-amber-200 p-3 rounded-xl">Protección del histórico: bloquear o rechazar una cuenta no elimina usuarios ni modifica planes, gastos o participaciones. La eliminación definitiva de cuentas está deshabilitada.</p>
                  <h2 className="text-sm font-black text-slate-800 flex items-center">
                    <Users size={16} className="mr-1.5 text-sky-600" /> Todos los Usuarios Registrados ({registeredUsers.length})
                  </h2>
                  <div className="grid grid-cols-1 2xl:grid-cols-2 gap-3 xl:max-h-[720px] xl:overflow-y-auto xl:pr-1">
                    {registeredUsers.map(usr => (
                      <div key={usr.id} className={`p-3.5 rounded-2xl border flex flex-col space-y-2 text-xs ${usr.is_blocked ? 'bg-red-50/80 border-red-200' : 'bg-white border-sky-100'}`}>
                        <div className="flex flex-wrap justify-between items-center gap-2">
                          <div className="min-w-0">
                            <p className="font-bold text-slate-800 flex flex-wrap items-center">
                              {[usr.name, usr.surname].filter(Boolean).join(' ')} {usr.role === 'admin' && <span className="ml-1.5 text-[9px] bg-sky-100 text-sky-800 font-bold px-1.5 py-0.5 rounded-full">ADMIN</span>}
                            </p>
                            <p className="text-[10px] text-slate-500 break-all">{usr.email}</p>
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
          <div className="bg-white max-w-md md:max-w-xl w-full p-6 rounded-[2.5rem] shadow-2xl space-y-4 border border-sky-100">
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
          <div className="bg-white max-w-md md:max-w-xl w-full p-6 rounded-[2.5rem] shadow-2xl space-y-4 border border-sky-100">
            <h2 className="font-black text-slate-800 text-lg">Organizar Nueva Salida</h2>
            <form onSubmit={handleCreateEvent} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Título del Plan</label>
                <input type="text" placeholder="Ej. Cervecitas" value={newTitle} onChange={(e) => setNewTitle(e.target.value)} className="w-full bg-sky-50/50 border border-sky-200 rounded-2xl px-4 py-2.5 text-sm" required />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Descripción del plan</label>
                <textarea value={newDescription} onChange={e => setNewDescription(e.target.value)} rows={3} maxLength={1200} placeholder="¿En qué consiste? ¿Qué tenéis pensado hacer?" className="w-full bg-sky-50/50 border border-sky-200 rounded-2xl px-4 py-2.5 text-sm" />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Fecha</label>
                <input lang="es-ES" type="date" value={newDate} onChange={(e) => setNewDate(e.target.value)} className="w-full bg-sky-50/50 border border-sky-200 rounded-2xl px-4 py-2.5 text-sm" required />
              </div>
              <fieldset className="space-y-2">
                <legend className="text-xs font-bold text-slate-700">Invitar personas (opcional)</legend>
                <p className="text-[11px] text-slate-500">Busca por nombre o correo y pulsa «Añadir». Recibirán la invitación en Aprobaciones.</p>
                <label htmlFor="invite-person-search" className="sr-only">Buscar persona para invitar</label>
                <div className="relative">
                  <Search size={16} className="absolute left-3 top-3 text-sky-500" aria-hidden="true" />
                  <input id="invite-person-search" type="search" autoComplete="off" value={inviteSearch}
                    onChange={e => setInviteSearch(e.target.value)}
                    placeholder="Escribe un nombre o correo..."
                    className="w-full bg-sky-50/50 border border-sky-200 rounded-2xl pl-10 pr-4 py-2.5 text-sm" />
                </div>
                {inviteSearch.trim() && (
                  <div className="max-h-40 overflow-y-auto rounded-2xl border border-sky-200 bg-sky-50/50 p-2 space-y-1">
                    {(() => {
                      const query = inviteSearch.trim().toLocaleLowerCase('es');
                      const matches = registeredUsers.filter(u => u.name && u.id !== currentUser?.id && u.is_approved !== false && !u.is_blocked && !newInvitees.includes(u.id) && (u.name.toLocaleLowerCase('es').includes(query) || (u.surname || '').toLocaleLowerCase('es').includes(query) || (u.email || '').toLocaleLowerCase('es').includes(query)));
                      return matches.length ? matches.slice(0, 15).map(u => (
                        <button key={u.id} type="button" onClick={() => { setNewInvitees(prev => [...new Set([...prev, u.id])]); setInviteSearch(''); }}
                          className="w-full flex items-center justify-between gap-2 p-2 rounded-xl hover:bg-white focus:bg-white text-left text-xs text-slate-800">
                          <span className="min-w-0"><span className="font-semibold block truncate">{[u.name, u.surname].filter(Boolean).join(' ')}</span>{u.email && <span className="block text-slate-500 truncate">{u.email}</span>}</span>
                          <span className="shrink-0 text-sky-700 font-bold flex items-center gap-1"><Plus size={14} /> Añadir</span>
                        </button>
                      )) : <p className="text-xs text-slate-500 p-2">No hay usuarios disponibles que coincidan con la búsqueda.</p>;
                    })()}
                  </div>
                )}
                {newInvitees.length > 0 && (
                  <div className="flex flex-wrap gap-2" aria-label="Personas seleccionadas para invitar">
                    {newInvitees.map(person => (
                      <span key={person} className="inline-flex items-center gap-1 rounded-full bg-sky-100 border border-sky-200 text-sky-900 text-xs font-semibold pl-3 pr-1 py-1">
                        {[registeredUsers.find(u => u.id === person)?.name, registeredUsers.find(u => u.id === person)?.surname].filter(Boolean).join(' ') || 'Usuario'}
                        <button type="button" aria-label="Quitar persona de las invitaciones" onClick={() => setNewInvitees(prev => prev.filter(n => n !== person))}
                          className="p-1 rounded-full hover:bg-sky-200"><X size={14} /></button>
                      </span>
                    ))}
                  </div>
                )}
                <p className="text-[11px] text-sky-700 font-semibold">{newInvitees.length} persona(s) seleccionada(s)</p>
              </fieldset>
              <div className="flex gap-2 pt-2">
                <button type="button" disabled={isCreatingEvent} onClick={() => { setShowCreateModal(false); setNewInvitees([]); setInviteSearch(''); }} className="w-1/2 bg-sky-50 text-slate-700 font-bold py-2.5 rounded-2xl text-xs border border-sky-200">Cancelar</button>
                <button type="submit" disabled={isCreatingEvent} className="w-1/2 bg-sky-600 text-white font-bold py-2.5 rounded-2xl text-xs shadow disabled:opacity-50">{isCreatingEvent ? 'Creando...' : 'Crear Plan'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {renderAppMessages()}
      {/* BARRA DE NAVEGACIÓN INFERIOR */}
      <nav aria-label="Navegación principal" className="fixed bottom-3 left-4 right-4 md:hidden bg-white/95 backdrop-blur-xl border border-sky-200 py-3 px-6 flex justify-around items-center z-40 rounded-[2rem] shadow-lg max-w-md mx-auto">
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
          {(myPendingInvitations.length + allPendingPlanRequests.length + (isAdmin ? pendingRegistrations.length : 0)) > 0 && (
            <span aria-label={`${myPendingInvitations.length + allPendingPlanRequests.length + (isAdmin ? pendingRegistrations.length : 0)} aprobaciones pendientes`} className="absolute -top-2 -right-2 bg-red-600 text-white text-[9px] min-w-5 h-5 px-1 rounded-full flex items-center justify-center font-bold ring-2 ring-white">
              {myPendingInvitations.length + allPendingPlanRequests.length + (isAdmin ? pendingRegistrations.length : 0)}
            </span>
          )}
        </button>
      </nav>
    </div>
  );
}
