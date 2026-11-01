import React, { useState, useEffect } from 'react';
import { 
  Users, MapPin, DollarSign, Plus, CheckCircle, 
  Clock, Camera, Navigation, ArrowRight, Trash2, Shield, Calendar
} from 'lucide-react';

export default function App() {
  const [currentUser, setCurrentUser] = useState(null);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [usersList, setUsersList] = useState([
    { id: 1, name: 'Alex', avatar: '👨‍💻', color: 'bg-blue-500' },
    { id: 2, name: 'María', avatar: '👩‍🎨', color: 'bg-pink-500' },
    { id: 3, name: 'Juan', avatar: '🧑‍🚀', color: 'bg-purple-500' }
  ]);

  const [outings, setOutings] = useState([
    { 
      id: 1, 
      title: 'Cena de Viernes', 
      date: '2026-06-12', 
      status: 'active', 
      currentSpot: 'La Tasquita del Mar',
      goingNow: true 
    }
  ]);

  const [spots, setSpots] = useState([
    { id: 1, name: 'La Tasquita del Mar', category: 'comida', votes: 2, suggestedBy: 'Alex', activeNow: true },
    { id: 2, name: 'Bar El Refugio', category: 'cervecitas', votes: 1, suggestedBy: 'María', activeNow: false },
    { id: 3, name: 'Disco Copas Club', category: 'copas', votes: 0, suggestedBy: 'Juan', activeNow: false }
  ]);

  const [expenses, setExpenses] = useState([
    { id: 1, description: 'Ronda de cervezas', amount: 15.50, paidBy: 'Alex', splitBetween: ['Alex', 'María', 'Juan'] }
  ]);

  const [photos, setPhotos] = useState([]);
  const [newSpotName, setNewSpotName] = useState('');
  const [newSpotCategory, setNewSpotCategory] = useState('cervecitas');
  const [expenseDesc, setExpenseDesc] = useState('');
  const [expenseAmount, setExpenseAmount] = useState('');

  if (!currentUser) {
    return (
      <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center p-4 text-white">
        <div className="max-w-md w-full bg-slate-800 p-8 rounded-2xl shadow-2xl border border-slate-700 text-center">
          <div className="w-16 h-16 bg-gradient-to-tr from-indigo-500 to-pink-500 rounded-2xl mx-auto flex items-center justify-center text-3xl mb-4 shadow-lg">
            🍻
          </div>
          <h1 className="text-2xl font-bold mb-2">Nosotros APP</h1>
          <p className="text-slate-400 mb-6 text-sm">Selecciona quién eres para entrar al grupo:</p>
          <div className="space-y-3">
            {usersList.map((user) => (
              <button
                key={user.id}
                onClick={() => setCurrentUser(user)}
                className="w-full flex items-center p-4 bg-slate-700/50 hover:bg-slate-700 rounded-xl transition border border-slate-600/50 hover:border-indigo-500 group"
              >
                <span className="text-2xl mr-4">{user.avatar}</span>
                <span className="font-semibold text-lg group-hover:text-indigo-300">{user.name}</span>
                <ArrowRight className="ml-auto text-slate-400 group-hover:text-indigo-300" size={20} />
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
      paidBy: currentUser.name,
      splitBetween: usersList.map(u => u.name)
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

  // Calcular deudas simplificadas
  const totalSpent = expenses.reduce((acc, curr) => acc + curr.amount, 0);
  const perPerson = totalSpent / usersList.length;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 pb-20">
      {/* Header */}
      <header className="bg-slate-900 border-b border-slate-800 p-4 sticky top-0 z-50 flex justify-between items-center">
        <div className="flex items-center space-x-2">
          <span className="text-xl">🚀</span>
          <h1 className="font-bold text-lg bg-gradient-to-r from-indigo-400 to-pink-400 bg-clip-text text-transparent">Nosotros APP</h1>
        </div>
        <div className="flex items-center space-x-2 bg-slate-800 px-3 py-1.5 rounded-full border border-slate-700">
          <span>{currentUser.avatar}</span>
          <span className="text-sm font-medium">{currentUser.name}</span>
          <button onClick={() => setCurrentUser(null)} className="text-xs text-slate-400 hover:text-red-400 ml-2">Salir</button>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-md mx-auto p-4 space-y-6">
        {activeTab === 'dashboard' && (
          <div className="space-y-6">
            {/* Live Status Card */}
            <div className="bg-gradient-to-br from-indigo-900/40 to-purple-900/40 border border-indigo-500/30 rounded-2xl p-5 shadow-xl">
              <div className="flex justify-between items-start mb-3">
                <span className="text-xs uppercase tracking-wider bg-indigo-500/20 text-indigo-300 px-2.5 py-1 rounded-full font-semibold border border-indigo-500/30">En Curso Ahora</span>
                <span className="flex h-3 w-3 relative">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
                </span>
              </div>
              <h2 className="text-xl font-bold mb-1">📍 {spots.find(s => s.activeNow)?.name || 'Ningún sitio activo'}</h2>
              <p className="text-sm text-slate-300 mb-4">El grupo está reunido aquí mismo en este instante.</p>
              <div className="flex space-x-2">
                <a 
                  href={`https://maps.google.com/?q=${encodeURIComponent(spots.find(s => s.activeNow)?.name || '')}`} 
                  target="_blank" 
                  rel="noreferrer"
                  className="flex-1 bg-indigo-600 hover:bg-indigo-500 text-white py-2.5 px-4 rounded-xl text-center font-medium text-sm transition flex items-center justify-center space-x-2 shadow-lg shadow-indigo-600/20"
                >
                  <Navigation size={16} />
                  <span>Cómo llegar</span>
                </a>
              </div>
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-slate-900/80 border border-slate-800 p-4 rounded-2xl">
                <p className="text-slate-400 text-xs mb-1">Gasto Total Grupo</p>
                <p className="text-2xl font-bold text-emerald-400">{totalSpent.toFixed(2)}€</p>
              </div>
              <div className="bg-slate-900/80 border border-slate-800 p-4 rounded-2xl">
                <p className="text-slate-400 text-xs mb-1">Por persona</p>
                <p className="text-2xl font-bold text-indigo-400">{perPerson.toFixed(2)}€</p>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'spots' && (
          <div className="space-y-6">
            <h2 className="text-xl font-bold">Sitios y Propuestas</h2>
            
            {/* Add Spot Form */}
            <form onSubmit={handleAddSpot} className="bg-slate-900 border border-slate-800 p-4 rounded-2xl space-y-3">
              <h3 className="text-sm font-semibold text-slate-300">Proponer nuevo sitio</h3>
              <input 
                type="text" 
                placeholder="Nombre del sitio (ej. Bar Pepe)" 
                value={newSpotName} 
                onChange={(e) => setNewSpotName(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-indigo-500"
              />
              <div className="flex space-x-2">
                <select 
                  value={newSpotCategory} 
                  onChange={(e) => setNewSpotCategory(e.target.value)}
                  className="bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-sm text-slate-300 focus:outline-none"
                >
                  <option value="cervecitas">🍺 Cervecitas</option>
                  <option value="comida">🍔 Comida</option>
                  <option value="copas">🍸 Copas</option>
                  <option value="cafe">☕ Café</option>
                </select>
                <button type="submit" className="flex-1 bg-indigo-600 hover:bg-indigo-500 text-sm font-semibold rounded-xl py-2 transition">
                  Añadir propuesta
                </button>
              </div>
            </form>

            {/* Spots List */}
            <div className="space-y-3">
              {spots.map((spot) => (
                <div key={spot.id} className={`p-4 rounded-2xl border flex items-center justify-between ${spot.activeNow ? 'bg-indigo-950/30 border-indigo-500/50' : 'bg-slate-900/60 border-slate-800'}`}>
                  <div>
                    <div className="flex items-center space-x-2">
                      <h4 className="font-bold">{spot.name}</h4>
                      {spot.activeNow && <span className="bg-emerald-500/20 text-emerald-400 text-xs px-2 py-0.5 rounded-full font-semibold">Aquí ahora</span>}
                    </div>
                    <p className="text-xs text-slate-400">Sugerido por {spot.suggestedBy} • {spot.votes} votos</p>
                  </div>
                  <div className="flex items-center space-x-2">
                    <button onClick={() => handleVote(spot.id)} className="bg-slate-800 hover:bg-slate-700 p-2 rounded-xl text-xs font-semibold border border-slate-700">
                      👍 Votar
                    </button>
                    {!spot.activeNow && (
                      <button onClick={() => handleActivateSpot(spot.id)} className="bg-indigo-600/20 hover:bg-indigo-600/40 text-indigo-300 p-2 rounded-xl text-xs font-semibold border border-indigo-500/30">
                        Ir ahora
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'expenses' && (
          <div className="space-y-6">
            <h2 className="text-xl font-bold">Gastos Compartidos</h2>

            {/* Add Expense Form */}
            <form onSubmit={handleAddExpense} className="bg-slate-900 border border-slate-800 p-4 rounded-2xl space-y-3">
              <h3 className="text-sm font-semibold text-slate-300">Registrar un pago</h3>
              <input 
                type="text" 
                placeholder="¿Qué habéis pagado? (ej. Cervezas)" 
                value={expenseDesc} 
                onChange={(e) => setExpenseDesc(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-indigo-500"
              />
              <div className="flex space-x-2">
                <input 
                  type="number" 
                  step="0.01" 
                  placeholder="Cantidad (€)" 
                  value={expenseAmount} 
                  onChange={(e) => setExpenseAmount(e.target.value)}
                  className="w-1/2 bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-indigo-500"
                />
                <button type="submit" className="w-1/2 bg-emerald-600 hover:bg-emerald-500 text-sm font-semibold rounded-xl py-2 transition">
                  Añadir gasto
                </button>
              </div>
            </form>

            {/* Expenses History */}
            <div className="space-y-2">
              {expenses.map((exp) => (
                <div key={exp.id} className="bg-slate-900/60 border border-slate-800 p-3 rounded-xl flex justify-between items-center text-sm">
                  <div>
                    <p className="font-semibold">{exp.description}</p>
                    <p className="text-xs text-slate-400">Pagado por {exp.paidBy}</p>
                  </div>
                  <span className="font-bold text-emerald-400">{exp.amount.toFixed(2)}€</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'gallery' && (
          <div className="space-y-6">
            <h2 className="text-xl font-bold">Galería de Momentos</h2>
            
            <label className="flex flex-col items-center justify-center border-2 border-dashed border-slate-700 hover:border-indigo-500 bg-slate-900/40 rounded-2xl p-6 cursor-pointer transition">
              <Camera className="w-10 h-10 text-slate-400 mb-2" />
              <span className="text-sm font-semibold text-slate-300">Sube una foto del plan</span>
              <input type="file" accept="image/*" onChange={handlePhotoUpload} className="hidden" />
            </label>

            <div className="grid grid-cols-2 gap-3">
              {photos.map((photo) => (
                <div key={photo.id} className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-md">
                  <img src={photo.url} alt="Recuerdo" className="w-full h-32 object-cover" />
                  <p className="p-2 text-xs text-slate-400 text-center">Subida por {photo.user}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>

      {/* Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 bg-slate-900/90 backdrop-blur-md border-t border-slate-800 py-2 px-6 flex justify-around items-center z-50">
        <button onClick={() => setActiveTab('dashboard')} className={`flex flex-col items-center ${activeTab === 'dashboard' ? 'text-indigo-400' : 'text-slate-400'}`}>
          <MapPin size={22} />
          <span className="text-[10px] mt-1">Inicio</span>
        </button>
        <button onClick={() => setActiveTab('spots')} className={`flex flex-col items-center ${activeTab === 'spots' ? 'text-indigo-400' : 'text-slate-400'}`}>
          <Users size={22} />
          <span className="text-[10px] mt-1">Sitios</span>
        </button>
        <button onClick={() => setActiveTab('expenses')} className={`flex flex-col items-center ${activeTab === 'expenses' ? 'text-indigo-400' : 'text-slate-400'}`}>
          <DollarSign size={22} />
          <span className="text-[10px] mt-1">Gastos</span>
        </button>
        <button onClick={() => setActiveTab('gallery')} className={`flex flex-col items-center ${activeTab === 'gallery' ? 'text-indigo-400' : 'text-slate-400'}`}>
          <Camera size={22} />
          <span className="text-[10px] mt-1">Fotos</span>
        </button>
      </nav>
    </div>
  );
}
