import React, { useState, useEffect } from 'react';
import { 
  Users, MapPin, DollarSign, Plus, CheckCircle, 
  Clock, Camera, Navigation, ArrowRight, Trash2, Shield, Calendar, Sparkles, User, Lock, Mail, Bell, Search, Check, X, UserPlus, Inbox, ArrowLeft, Image as ImageIcon, Utensils, Beer, PartyPopper
} from 'lucide-react';
import { supabase } from './supabaseClient';

// Imágenes temáticas sugeridas según el título o categoría del plan
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

  const [newSpotName, setNewSpotName] = useState('');
  const [newSpotCategory, setNewSpotCategory] = useState('cervecitas');
  const [expenseDesc, setExpenseDesc] = useState('');
  const [expenseAmount, setExpenseAmount] = useState('');

  const availableFriends = ['Kike', 'Nacho', 'Rulo', 'Pelu', 'Joaquín', 'Paco', 'Pablo', 'Fer', 'Javi'];
  const [events, setEvents] = useState([]);

  useEffect(() => {
    if (currentUser) {
      fetchAppData();
    }
  }, [currentUser]);

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

      await supabase.from('event_members').insert([{ event_id: newEv.id, user_name: currentUser.name, status: 'member' }]);

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
  const
