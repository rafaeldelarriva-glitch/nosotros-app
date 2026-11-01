import React, { useState } from 'react';
import { 
  Users, MapPin, DollarSign, Plus, CheckCircle, 
  Clock, Camera, Navigation, ArrowRight, Trash2, Shield, Calendar, Sparkles
} from 'lucide-react';

export default function App() {
  const [currentUser, setCurrentUser] = useState(null);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [usersList, setUsersList] = useState([
    { id: 1, name: 'Alex', avatar: '👨‍💻', color: 'from-blue-500 to-indigo-600' },
    { id: 2, name: 'María', avatar: '👩‍🎨', color: 'from-pink-500 to-rose-600' },
    { id: 3, name: 'Juan', avatar: '🧑‍🚀', color: 'from-purple-500 to-indigo-700' }
  ]);

  const [spots, setSpots] = useState([
    { id: 1, name: 'La Tasquita del Mar', category: 'comida', votes: 2, suggestedBy: 'Alex', activeNow: true },
    { id: 2, name: 'Bar El Refugio', category: 'cervecitas', votes: 1, suggestedBy: 'María', activeNow: false },
    { id: 3, name: 'Disco Copas Club', category: 'copas', votes: 0, suggestedBy: 'Juan', activeNow: false }
  ]);

  const [expenses, setExpenses] = useState([
    { id: 1, description: 'Ronda de cervezas', amount: 15.50, paidBy: 'Alex' }
  ]);

  const [photos, setPhotos] = useState([]);
  const [newSpotName, setNewSpotName] = useState('');
  const [newSpotCategory, setNewSpotCategory] = useState('cervecitas');
  const [expenseDesc, setExpenseDesc] = useState('');
  const [expenseAmount, setExpenseAmount] = useState('');

  if (!currentUser) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-6 text-white relative overflow-hidden">
        <div className="absolute -top-32 -left-32 w-72 h-72 bg-indigo-500/20 rounded-full blur-3xl pointer-events-none"></div>
        <div className="absolute -bottom-32 -right-32 w-72 h-72 bg-pink-500/20 rounded-full blur-3xl pointer-events-none"></div>

        <div className="max-w-md w-full bg-slate-900/80 backdrop-blur-xl p-8 rounded-3xl shadow-2xl border border-slate-800 text-center relative z-10">
          <div className="w-20 h-20 bg-gradient-to-tr from-indigo-500 via-purple-500 to-pink-500 rounded-2xl mx-auto flex items-center justify-center text-4xl mb-6 shadow-lg shadow-indigo-500/30">
            🍻
          </div>
          <h1 className="text-3xl font-black tracking-tight mb-2 bg-gradient-to-r from-white via-slate-200 to-slate-400 bg-clip-text text-transparent">Nosotros APP</h1>
          <p className="text-slate-400 mb-8 text-sm">El centro de operaciones de vuestros planes. ¿Quién eres?</p>
          
          <div className="space-y-3.5">
            {usersList.map((user) => (
              <button
                key={user.id}
                onClick={() => setCurrentUser(user)}
                className="w-full flex items-center p-4 bg-slate-800/60 hover:bg-slate-800 rounded-2xl transition-all duration-300 border border-slate-700/50 hover:border-indigo-500/50 group shadow-md hover:shadow-indigo-500/10"
              >
                <span className="text-2xl mr-4 p-2 bg-slate-900/80 rounded-xl border border-slate-700">{user.avatar}</span>
                <span className="font-semibold text-lg text-slate-200 group-hover:text-white">{user.name}</span>
                <ArrowRight className="ml-auto text-slate-500 group-hover:text-indigo-400 transition-transform group-hover:translate-x-1" size={20} />
              </button>
            ))}
          </div>
        </div>
      </div>
    );
  }

  const handleAddSpot = (e) => {
    e.preventDefault();
    if (!newSpotName.trim()) return;
    const newSpot = {
      id: Date.now(),
      name: newSpotName,
      category: newSpotCategory,
      votes: 1,
      suggestedBy: currentUser.name,
      activeNow: false
    };
    setSpots([...spots, newSpot]);
    setNewSpotName('');
  };

  const handleVote = (id) => {
    setSpots(spots.map(spot => spot.id === id ? { ...spot, votes: spot.votes + 1 } : spot));
  };

  const handleActivateSpot = (id) => {
    setSpots(spots.map(spot => ({ ...spot, activeNow: spot.id === id })));
  };

  const handleAddExpense = (e) => {
    e.preventDefault();
    if (!expenseDesc.trim() || !expenseAmount) return;
    const newExp = {
      id: Date.now(),
      description: expenseDesc,
      amount: parseFloat(expenseAmount),
      paidBy: currentUser.name
    };
    setExpenses([...expenses, newExp]);
    setExpenseDesc('');
    setExpenseAmount('');
  };

  const handlePhotoUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPhotos([...photos, { id: Date.now(), url: reader.result, user: currentUser.name }]);
      };
      reader.readAsDataURL(file);
    }
  };

  const totalSpent = expenses.reduce((acc, curr) => acc + curr.amount, 0);
  const perPerson = totalSpent / usersList.length;
  const activeSpot = spots.find(s => s.activeNow);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 pb-28 selection:bg-indigo-500 selection:text-white">
      {/* Header moderno */}
      <header className="bg-slate-900/80 backdrop-blur-md border-b border-slate-800/80 p-4 sticky top-0 z-50 flex justify-between items-center shadow-sm">
        <div className="flex items-center space-x-2.5">
          <div className="w-9 h-9 bg-gradient-to-tr from-indigo-500 to-pink-500 rounded-xl flex items-center justify-center shadow-md shadow-indigo-500/20 text-lg">
            🚀
          </div>
          <h1 className="font-extrabold tracking-tight text-lg bg-gradient-to-r from-indigo-400 via-purple-300 to-pink-400 bg-clip-text text-transparent">Nosotros APP</h1>
        </div>
        <div className="flex items-center space-x-2 bg-slate-800/80 pl-3 pr-2 py-1.5 rounded-full border border-slate-700/60 shadow-inner">
          <span className="text-sm">{currentUser.avatar}</span>
          <span className="text-xs font-semibold text-slate-200">{currentUser.name}</span>
          <button onClick={() => setCurrentUser(null)} className="text-[11px] bg-slate-700/50 hover:bg-red-500/20 hover:text-red-400 text-slate-400 px-2 py-0.5 rounded-full transition">Salir</button>
        </div>
      </header>

      {/* Contenido principal */}
      <main className="max-w-md mx-auto p-4 space-y-6">
        {activeTab === 'dashboard' && (
          <div className="space-y-6 animate-fadeIn">
            {/* Live Status Card con diseño vibrante */}
            <div className="relative overflow-hidden bg-gradient-to-br from-indigo-900/60 via-slate-900 to-purple-950/60 border border-indigo-500/30 rounded-3xl p-6 shadow-xl shadow-indigo-950/50">
              <div className="absolute top-0 right-0 -mt-4 -mr-4 w-32 h-32 bg-indigo-500/10 rounded-full blur-2xl"></div>
              
              <div className="flex justify-between items-center mb-4">
                <span className="inline-flex items-center gap-1.5 text-xs uppercase tracking-wider bg-indigo-500/20 text-indigo-300 px-3 py-1 rounded-full font-bold border border-indigo-500/30 shadow-inner">
                  <Sparkles size={12} /> Ubicación Activa
                </span>
                <span className="flex h-3 w-3 relative">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500 shadow-sm shadow-emerald-500"></span>
                </span>
              </div>
              
              <h2 className="text-2xl font-black mb-1.5 text-white tracking-tight">📍 {activeSpot ? activeSpot.name : 'Ningún sitio activo'}</h2>
              <p className="text-sm text-slate-300/90 mb-5 leading-relaxed">El grupo está reunido o dirigido hacia aquí en este instante.</p>
              
              {activeSpot && (
                <a 
                  href={`https://maps.google.com/?q=${encodeURIComponent(activeSpot.name)}`} 
                  target="_blank" 
                  rel="noreferrer"
                  className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white py-3 px-4 rounded-2xl text-center font-bold text-sm transition-all duration-300 flex items-center justify-center space-x-2 shadow-lg shadow-indigo-600/30 active:scale-[0.98]"
                >
                  <Navigation size={18} />
                  <span>Abrir en Google Maps</span>
                </a>
              )}
            </div>

            {/* Quick Stats Grid */}
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-slate-900/80 backdrop-blur-md border border-slate-800/80 p-5 rounded-3xl shadow-lg relative overflow-hidden">
                <div className="text-emerald-400/10 absolute -right-2 -bottom-2 text-6xl font-black">€</div>
                <p className="text-slate-400 text-xs font-medium mb-1">Gasto Total Grupo</p>
                <p className="text-2xl font-black text-emerald-400">{totalSpent.toFixed(2)}€</p>
              </div>
              <div className="bg-slate-900/80 backdrop-blur-md border border-slate-800/80 p-5 rounded-3xl shadow-lg relative overflow-hidden">
                <div className="text-indigo-400/10 absolute -right-2 -bottom-2 text-6xl font-black">👥</div>
                <p className="text-slate-400 text-xs font-medium mb-1">Por persona</p>
                <p className="text-2xl font-black text-indigo-400">{perPerson.toFixed(2)}€</p>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'spots' && (
          <div className="space-y-6 animate-fadeIn">
            <h2 className="text-2xl font-black tracking-tight">Sitios y Propuestas</h2>
            
            <form onSubmit={handleAddSpot} className="bg-slate-900/80 backdrop-blur-md border border-slate-800/80 p-5 rounded-3xl shadow-lg space-y-4">
              <h3 className="text-sm font-bold text-slate-200">Proponer nuevo sitio</h3>
              <input 
                type="text" 
                placeholder="Nombre del sitio (ej. Bar Pepe)" 
                value={newSpotName} 
                onChange={(e) => setNewSpotName(e.target.value)}
                className="w-full bg-slate-950/60 border border-slate-800 rounded-2xl px-4 py-3 text-sm focus:outline-none focus:border-indigo-500 transition text-white placeholder-slate-500"
              />
              <div className="flex gap-2">
                <select 
                  value={newSpotCategory} 
                  onChange={(e) => setNewSpotCategory(e.target.value)}
                  className="bg-slate-950/60 border border-slate-800 rounded-2xl px-4 py-3 text-sm text-slate-300 focus:outline-none focus:border-indigo-500 transition"
                >
                  <option value="cervecitas">🍺 Cervecitas</option>
                  <option value="comida">🍔 Comida</option>
                  <option value="copas">🍸 Copas</option>
                  <option value="cafe">☕ Café</option>
                </select>
                <button type="submit" className="flex-1 bg-indigo-600 hover:bg-indigo-500 text-sm font-bold rounded-2xl py-3 transition shadow-md shadow-indigo-600/20 active:scale-[0.98]">
                  Añadir propuesta
                </button>
              </div>
            </form>

            <div className="space-y-3">
              {spots.map((spot) => (
                <div key={spot.id} className={`p-4 rounded-3xl border transition-all duration-300 flex items-center justify-between shadow-md ${spot.activeNow ? 'bg-indigo-950/30 border-indigo-500/50 shadow-indigo-950' : 'bg-slate-900/60 border-slate-800/80'}`}>
                  <div>
                    <div className="flex items-center space-x-2.5 mb-1">
                      <h4 className="font-bold text-base">{spot.name}</h4>
                      {spot.activeNow && <span className="bg-emerald-500/20 text-emerald-400 text-[10px] uppercase font-black px-2.5 py-0.5 rounded-full border border-emerald-500/30">Aquí ahora</span>}
                    </div>
                    <p className="text-xs text-slate-400">Sugerido por <span className="text-slate-300 font-medium">{spot.suggestedBy}</span> • <span className="text-indigo-400 font-bold">{spot.votes} votos</span></p>
                  </div>
                  <div className="flex items-center space-x-2">
                    <button onClick={() => handleVote(spot.id)} className="bg-slate-800 hover:bg-slate-700 p-2.5 rounded-2xl text-xs font-bold border border-slate-700 transition active:scale-95 shadow-sm">
                      👍 Votar
                    </button>
                    {!spot.activeNow && (
                      <button onClick={() => handleActivateSpot(spot.id)} className="bg-indigo-600/20 hover:bg-indigo-600/40 text-indigo-300 p-2.5 rounded-2xl text-xs font-bold border border-indigo-500/30 transition active:scale-95">
                        Ir aquí
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'expenses' && (
          <div className="space-y-6 animate-fadeIn">
            <h2 className="text-2xl font-black tracking-tight">Gastos Compartidos</h2>

            <form onSubmit={handleAddExpense} className="bg-slate-900/80 backdrop-blur-md border border-slate-800/80 p-5 rounded-3xl shadow-lg space-y-4">
              <h3 className="text-sm font-bold text-slate-200">Registrar un pago</h3>
              <input 
                type="text" 
                placeholder="¿Qué habéis pagado? (ej. Cervezas)" 
                value={expenseDesc} 
                onChange={(e) => setExpenseDesc(e.target.value)}
                className="w-full bg-slate-950/60 border border-slate-800 rounded-2xl px-4 py-3 text-sm focus:outline-none focus:border-indigo-500 transition text-white placeholder-slate-500"
              />
              <div className="flex gap-2">
                <input 
                  type="number" 
                  step="0.01" 
                  placeholder="Cantidad (€)" 
                  value={expenseAmount} 
                  onChange={(e) => setExpenseAmount(e.target.value)}
                  className="w-1/2 bg-slate-950/60 border border-slate-800 rounded-2xl px-4 py-3 text-sm focus:outline-none focus:border-indigo-500 transition text-white placeholder-slate-500"
                />
                <button type="submit" className="w-1/2 bg-emerald-600 hover:bg-emerald-500 text-sm font-bold rounded-2xl py-3 transition shadow-md shadow-emerald-600/20 active:scale-[0.98]">
                  Añadir gasto
                </button>
              </div>
            </form>

            <div className="space-y-2.5">
              {expenses.map((exp) => (
                <div key={exp.id} className="bg-slate-900/60 border border-slate-800/80 p-4 rounded-2xl flex justify-between items-center text-sm shadow-sm">
                  <div>
                    <p className="font-bold text-slate-200">{exp.description}</p>
                    <p className="text-xs text-slate-400 mt-0.5">Pagado por <span className="text-slate-300 font-medium">{exp.paidBy}</span></p>
                  </div>
                  <span className="font-black text-emerald-400 text-base">{exp.amount.toFixed(2)}€</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'gallery' && (
          <div className="space-y-6 animate-fadeIn">
            <h2 className="text-2xl font-black tracking-tight">Galería de Momentos</h2>
            
            <label className="flex flex-col items-center justify-center border-2 border-dashed border-slate-700 hover:border-indigo-500 bg-slate-900/40 rounded-3xl p-8 cursor-pointer transition group shadow-inner">
              <div className="w-14 h-14 bg-slate-800 rounded-2xl flex items-center justify-center mb-3 group-hover:scale-110 transition duration-300 border border-slate-700">
                <Camera className="w-7 h-7 text-indigo-400" />
              </div>
              <span className="text-sm font-bold text-slate-200">Sube una foto del plan</span>
              <span className="text-xs text-slate-500 mt-1">Guarda el recuerdo para siempre</span>
              <input type="file" accept="image/*" onChange={handlePhotoUpload} className="hidden" />
            </label>

            <div className="grid grid-cols-2 gap-3.5">
              {photos.map((photo) => (
                <div key={photo.id} className="bg-slate-900 border border-slate-800/80 rounded-2xl overflow-hidden shadow-lg group">
                  <div className="overflow-hidden aspect-square">
                    <img src={photo.url} alt="Recuerdo" className="w-full h-full object-cover group-hover:scale-105 transition duration-500" />
                  </div>
                  <p className="p-3 text-xs text-slate-400 text-center font-medium bg-slate-950/40">Subida por {photo.user}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>

      {/* Bottom Navigation estilo moderno */}
      <nav className="fixed bottom-3 left-4 right-4 bg-slate-900/90 backdrop-blur-xl border border-slate-800 py-3 px-6 flex justify-around items-center z-50 rounded-3xl shadow-2xl shadow-slate-950">
        <button onClick={() => setActiveTab('dashboard')} className={`flex flex-col items-center transition duration-300 ${activeTab === 'dashboard' ? 'text-indigo-400 scale-110' : 'text-slate-400 hover:text-slate-200'}`}>
          <MapPin size={22} />
          <span className="text-[10px] font-bold mt-1">Inicio</span>
        </button>
        <button onClick={() => setActiveTab('spots')} className={`flex flex-col items-center transition duration-300 ${activeTab === 'spots' ? 'text-indigo-400 scale-110' : 'text-slate-400 hover:text-slate-200'}`}>
          <Users size={22} />
          <span className="text-[10px] font-bold mt-1">Sitios</span>
        </button>
        <button onClick={() => setActiveTab('expenses')} className={`flex flex-col items-center transition duration-300 ${activeTab === 'expenses' ? 'text-indigo-400 scale-110' : 'text-slate-400 hover:text-slate-200'}`}>
          <DollarSign size={22} />
          <span className="text-[10px] font-bold mt-1">Gastos</span>
        </button>
        <button onClick={() => setActiveTab('gallery')} className={`flex flex-col items-center transition duration-300 ${activeTab === 'gallery' ? 'text-indigo-400 scale-110' : 'text-slate-400 hover:text-slate-200'}`}>
          <Camera size={22} />
          <span className="text-[10px] font-bold mt-1">Fotos</span>
        </button>
      </nav>
    </div>
  );
}
