import React, { useState, useEffect, useRef } from 'react';
import { 
  Shield, 
  AlertTriangle, 
  CheckCircle, 
  Siren, 
  Mic, 
  Crosshair, 
  User, 
  Users, 
  Activity, 
  Power, 
  Sun, 
  Moon, 
  Mail, 
  Save, 
  Info, 
  BookOpen, 
  X, 
  Zap, 
  Eye,
  Server,
  Wifi,
  LogOut,
  Lock,
  UserPlus
} from 'lucide-react';

const App = () => {
  // --- 1. AUTHENTICATION STATE ---
  const [isAuthenticated, setIsAuthenticated] = useState(!!localStorage.getItem('token'));
  const [authMode, setAuthMode] = useState('login'); // 'login' or 'signup'
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");

  // --- 2. DASHBOARD STATE MANAGEMENT ---
  const [systemArmed, setSystemArmed] = useState(true);
  const [useBackend, setUseBackend] = useState(false); // Toggle between Sim and Real Backend
  const [threatScore, setThreatScore] = useState(0);
  const [metrics, setMetrics] = useState({
    weapon: { score: 0, label: "None" },
    audio: { score: 0, label: "Listening..." },
    pose: { score: 0, label: "Normal" },
    proximity: { score: 0, label: "Safe" }
  });
  const [status, setStatus] = useState("SAFE");
  const [darkMode, setDarkMode] = useState(true);
  
  const [emergencyEmail, setEmergencyEmail] = useState("");
  const [tempEmail, setTempEmail] = useState("");
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState("");
  
  const [showInfo, setShowInfo] = useState(false);
  const [backendError, setBackendError] = useState(false);

  // --- HELPER: TOAST NOTIFICATION ---
  const triggerToast = (msg) => {
    setToastMessage(msg);
    setShowToast(true);
    setTimeout(() => setShowToast(false), 3000);
  };

  // --- 3. AUTHENTICATION HANDLERS ---
  const handleAuth = async (e) => {
    e.preventDefault();
    const endpoint = authMode === 'login' ? 'login' : 'signup';
    
    try {
      const response = await fetch(`http://localhost:5000/${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });
      const data = await response.json();

      if (response.ok) {
        if (authMode === 'login') {
          localStorage.setItem('token', data.access_token);
          setIsAuthenticated(true);
          setUseBackend(true); // Auto-connect to backend on successful login
          triggerToast("Secure session initialized.");
        } else {
          setAuthMode('login');
          triggerToast("Account created. Please login.");
        }
      } else {
        triggerToast(data.msg || "Authentication failed.");
      }
    } catch (error) {
      console.error("Auth Error:", error);
      triggerToast("Authentication server unreachable.");
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    setIsAuthenticated(false);
    setUseBackend(false);
    triggerToast("Session terminated successfully.");
  };

  // --- 4. HANDLER: SAVE EMAIL ---
  const handleSaveEmail = async () => {
    if (tempEmail.trim() === "") {
      triggerToast("Please enter a valid email.");
      return;
    }

    if (useBackend && isAuthenticated) {
      const token = localStorage.getItem('token');
      try {
        const response = await fetch('http://localhost:5000/update-email', {
          method: 'POST',
          headers: { 
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}` 
          },
          body: JSON.stringify({ email: tempEmail }),
        });
        if (response.ok) {
          setEmergencyEmail(tempEmail);
          triggerToast(`Emergency contact updated via Server: ${tempEmail}`);
        } else if (response.status === 401) {
          handleLogout();
        } else {
          triggerToast("Failed to update email on server.");
        }
      } catch (error) {
        console.error("Error updating email:", error);
        triggerToast("Server offline. Could not save.");
      }
    } else {
      setEmergencyEmail(tempEmail);
      triggerToast(`(Sim) Emergency contact updated to: ${tempEmail}`);
    }
  };

  // --- 5. DATA POLLING LOGIC ---
  useEffect(() => {
    let interval;
    const token = localStorage.getItem('token');
    
    const fetchBackendData = async () => {
      try {
        const response = await fetch('http://localhost:5000/status', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        
        if (response.ok) {
          const data = await response.json();
          setBackendError(false);
          setThreatScore(data.total_score);
          setStatus(data.status);
          setMetrics({
            weapon: { score: data.weapon_score, label: data.weapon_score > 0 ? data.weapon_label : "None" },
            audio: { score: data.audio_score, label: data.audio_score > 0 ? "Distress" : "Listening..." },
            pose: { score: data.pose_score, label: data.pose_score > 0 ? (data.pose_score >= 30 ? "Surrender" : "Fall Detected") : "Normal" },
            proximity: { score: data.proximity_score, label: data.proximity_score > 0 ? "Crowding" : "Safe" }
          });
        } else if (response.status === 401) {
          handleLogout(); 
        } else {
          setBackendError(true);
        }
      } catch (error) {
        setBackendError(true);
      }
    };

    const runSimulation = () => {
      const rand = Math.random();
      let w = 0, a = 0, p = 0, pr = 0;
      if (rand > 0.9) { w = 45; a = 35; } 
      else if (rand > 0.8) { pr = 15; }
      else if (rand > 0.7) { a = 35; p = 20; }
      const total = w + a + p + pr;
      setThreatScore(total);
      setMetrics({
        weapon: { score: w, label: w > 0 ? "Weapon Detected" : "None" },
        audio: { score: a, label: a > 0 ? "Distress" : "Listening..." },
        pose: { score: p, label: p > 0 ? (p === 30 ? "Surrender" : "Fall Detected") : "Normal" },
        proximity: { score: pr, label: pr > 0 ? "Crowding" : "Safe" }
      });
      setStatus(total >= 60 ? "DANGER" : total >= 35 ? "WARNING" : "SAFE");
    };

    if (systemArmed) {
      interval = setInterval(() => {
        (useBackend && isAuthenticated) ? fetchBackendData() : runSimulation();
      }, useBackend ? 500 : 3000); 
    } else {
      setThreatScore(0);
      setStatus("SAFE");
      setBackendError(false);
      setMetrics({
        weapon: { score: 0, label: "None" }, audio: { score: 0, label: "Listening..." },
        pose: { score: 0, label: "Normal" }, proximity: { score: 0, label: "Safe" }
      });
    }

    return () => clearInterval(interval);
  }, [systemArmed, useBackend, isAuthenticated]);

  // --- STYLING HELPERS ---
  const getStatusColor = (s) => s === "DANGER" ? "bg-red-600 border-red-800 animate-pulse text-white" : s === "WARNING" ? "bg-yellow-500 border-yellow-700 text-black" : "bg-emerald-600 border-emerald-800 text-white";
  const getMetricColor = (sc) => sc >= 40 ? "text-red-600 dark:text-red-500" : sc >= 20 ? "text-yellow-600 dark:text-yellow-500" : "text-emerald-600 dark:text-emerald-500";
  
  const bgMain = darkMode ? "bg-gray-900" : "bg-gray-100";
  const bgCard = darkMode ? "bg-gray-800" : "bg-white";
  const textMain = darkMode ? "text-gray-100" : "text-gray-900";
  const borderCard = darkMode ? "border-gray-700" : "border-gray-200";
  const inputBg = darkMode ? "bg-gray-700" : "bg-gray-100";
  const textSub = darkMode ? "text-gray-400" : "text-gray-500";

  // --- 6. AUTHENTICATION OVERLAY ---
  if (!isAuthenticated) {
    return (
      <div className={`min-h-screen flex items-center justify-center ${bgMain} p-6 transition-colors duration-500`}>
        <div className={`${bgCard} w-full max-w-md p-8 rounded-3xl shadow-2xl border ${borderCard} text-center`}>
          <div className="mb-6">
            <Shield className="w-16 h-16 text-blue-500 mx-auto mb-2" />
            <h2 className={`text-3xl font-bold ${textMain}`}>{authMode === 'login' ? 'Secure Login' : 'System Signup'}</h2>
            <p className="text-gray-400 text-sm mt-1">AI Safety Shield Terminal</p>
          </div>
          
          <form onSubmit={handleAuth} className="space-y-4">
            <div className="text-left">
              <label className="text-xs font-bold text-gray-500 uppercase ml-1 mb-1 block">Username</label>
              <div className="relative">
                <User className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
                <input 
                  type="text" 
                  placeholder="Enter username" 
                  className={`w-full pl-10 pr-4 py-3 rounded-xl border ${borderCard} ${inputBg} ${textMain} outline-none focus:ring-2 focus:ring-blue-500 transition-all`}
                  onChange={(e) => setUsername(e.target.value)}
                  required 
                />
              </div>
            </div>
            
            <div className="text-left">
              <label className="text-xs font-bold text-gray-500 uppercase ml-1 mb-1 block">Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
                <input 
                  type="password" 
                  placeholder="••••••••" 
                  className={`w-full pl-10 pr-4 py-3 rounded-xl border ${borderCard} ${inputBg} ${textMain} outline-none focus:ring-2 focus:ring-blue-500 transition-all`}
                  onChange={(e) => setPassword(e.target.value)}
                  required 
                />
              </div>
            </div>

            <button className="w-full bg-blue-600 hover:bg-blue-700 text-white py-4 rounded-xl font-bold text-lg shadow-lg transform active:scale-95 transition-all flex items-center justify-center gap-2">
              {authMode === 'login' ? <Lock className="w-5 h-5"/> : <UserPlus className="w-5 h-5" />}
              {authMode === 'login' ? 'Unlock Dashboard' : 'Create Account'}
            </button>
          </form>

          <div className="mt-8 pt-6 border-t border-gray-700">
            <p className="text-gray-500 text-sm">
              {authMode === 'login' ? "Don't have access?" : "Already registered?"}
              <button 
                onClick={() => setAuthMode(authMode === 'login' ? 'signup' : 'login')}
                className="ml-2 text-blue-400 font-bold hover:underline"
              >
                {authMode === 'login' ? 'Sign up here' : 'Sign in here'}
              </button>
            </p>
          </div>
        </div>
      </div>
    );
  }

  // --- 7. MAIN DASHBOARD RENDER ---
  return (
    <div className={`min-h-screen ${bgMain} ${textMain} font-sans p-4 md:p-8 transition-colors duration-300 relative`}>
      
      {showToast && (
        <div className="fixed top-4 right-4 z-50 bg-blue-600 text-white px-6 py-3 rounded-lg shadow-xl animate-bounce flex items-center gap-2">
          <CheckCircle className="w-5 h-5" />
          {toastMessage}
        </div>
      )}

      {/* HEADER */}
      <header className={`flex flex-col xl:flex-row justify-between items-center mb-8 ${bgCard} p-4 rounded-xl shadow-lg border ${borderCard} gap-4`}>
        <div className="flex items-center gap-3 w-full md:w-auto">
          <Shield className="w-10 h-10 text-blue-500 flex-shrink-0" />
          <div>
            <h1 className="text-2xl font-bold tracking-tight">AI Safety Shield</h1>
            <p className="text-xs text-gray-400">Multimodal Surveillance Dashboard</p>
          </div>
        </div>

        <div className="flex items-center gap-3 flex-wrap justify-center w-full xl:w-auto">
          <button onClick={() => setUseBackend(!useBackend)} className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium border transition-all ${useBackend ? 'bg-blue-900/30 border-blue-500 text-blue-200' : 'bg-gray-700 border-gray-600 text-gray-400'}`}>
            {useBackend ? <Server className="w-4 h-4" /> : <Wifi className="w-4 h-4" />}
            {useBackend ? (backendError ? "Backend Error" : "Live Backend") : "Simulation Mode"}
          </button>

          <button onClick={() => setShowInfo(!showInfo)} className={`p-2 rounded-full transition-all ${showInfo ? 'bg-blue-600 text-white shadow-[0_0_15px_rgba(37,99,235,0.4)]' : 'bg-gray-700 text-blue-400 hover:bg-gray-600'}`}>
            <Info className="w-5 h-5" />
          </button>
          
          <button onClick={() => setDarkMode(!darkMode)} className="p-2 rounded-full bg-gray-700 text-yellow-300 hover:bg-gray-600 transition-all">
            {darkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
          </button>

          <button onClick={handleLogout} className="flex items-center gap-2 px-4 py-2 rounded-lg bg-red-600/10 border border-red-500 text-red-400 hover:bg-red-600 hover:text-white font-bold text-sm shadow-sm transition-all">
            <LogOut className="w-4 h-4" /> 
            <span className="hidden md:inline">Logout</span>
          </button>
          
          <button onClick={() => setSystemArmed(!systemArmed)} className={`p-3 rounded-full transition-all shadow-md ${systemArmed ? 'bg-red-600 hover:bg-red-700 shadow-red-500/30' : 'bg-green-600 hover:bg-green-700 shadow-green-500/30'}`}>
            <Power className="w-6 h-6 text-white" />
          </button>
        </div>
      </header>

      {/* DETAILED INFO SECTION (Restored Features) */}
      {showInfo && (
        <div className={`w-full p-6 rounded-xl mb-8 border-l-4 border-blue-500 shadow-2xl transition-all duration-300 ${bgCard} relative`}>
          <button onClick={() => setShowInfo(false)} className="absolute top-4 right-4 p-1 hover:bg-gray-700 rounded-full transition-colors">
            <X className="w-6 h-6 text-gray-400" />
          </button>
          
          <div className="flex items-center gap-3 mb-6">
            <BookOpen className="w-8 h-8 text-blue-500" />
            <h3 className="text-2xl font-bold">System Logic & Analysis</h3>
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-2 gap-8 text-sm">
            {/* Factors Logic */}
            <div>
              <h4 className="flex items-center gap-2 font-bold mb-4 text-blue-400 text-lg border-b border-gray-700 pb-2">
                <Zap className="w-5 h-5" /> Factor Weights
              </h4>
              <div className="space-y-4">
                <div className={`p-3 rounded-lg ${darkMode ? 'bg-gray-700/50' : 'bg-gray-100'}`}>
                  <div className="flex items-center gap-2 font-semibold text-red-400 mb-1"><Crosshair className="w-4 h-4"/> Weapon (+45 pts)</div>
                  <p className={textSub}>Detection of knives, baseball bats, or scissors via YOLOv8n object models.</p>
                </div>
                <div className={`p-3 rounded-lg ${darkMode ? 'bg-gray-700/50' : 'bg-gray-100'}`}>
                  <div className="flex items-center gap-2 font-semibold text-yellow-400 mb-1"><Mic className="w-4 h-4"/> Audio (+35 pts)</div>
                  <p className={textSub}>Speech analysis monitoring for distress keywords like "Help", "Police", or screams.</p>
                </div>
                <div className={`p-3 rounded-lg ${darkMode ? 'bg-gray-700/50' : 'bg-gray-100'}`}>
                  <div className="flex items-center gap-2 font-semibold text-blue-400 mb-1"><User className="w-4 h-4"/> Behavior (+20-30 pts)</div>
                  <p className={textSub}>Pose tracking for surrender (Hands Up, +30) or horizontal falls (+20).</p>
                </div>
                <div className={`p-3 rounded-lg ${darkMode ? 'bg-gray-700/50' : 'bg-gray-100'}`}>
                  <div className="flex items-center gap-2 font-semibold text-emerald-400 mb-1"><Users className="w-4 h-4"/> Proximity (+15 pts)</div>
                  <p className={textSub}>Distance monitoring between subjects. Triggers if subjects are in close aggressive proximity.</p>
                </div>
              </div>
              <div className="mt-4 p-3 rounded-lg bg-blue-900/10 border border-blue-800/30">
                <p className="text-xs italic text-gray-400">Threat confirmed at 60 points. System ignores depth differences via height filtering.</p>
              </div>
            </div>

            {/* Scenarios Logic */}
            <div>
              <h4 className="flex items-center gap-2 font-bold mb-4 text-blue-400 text-lg border-b border-gray-700 pb-2">
                <Eye className="w-5 h-5" /> Threat Scenarios
              </h4>
              <div className="space-y-4 h-[350px] overflow-y-auto pr-2 custom-scrollbar">
                <div className={`p-4 rounded-lg border-l-4 border-yellow-500 ${darkMode ? 'bg-yellow-500/10' : 'bg-yellow-50'}`}>
                  <h5 className="font-bold text-yellow-500 text-base mb-1">Silent Brandishing</h5>
                  <p className={`text-xs ${textSub} mb-2`}>Weapon Detected Only • Score: 45 (Warning)</p>
                  <div className="text-[10px] space-y-1 font-mono opacity-80">
                    <div className="flex justify-between"><span>Weapon:</span> <span>+45</span></div>
                    <div className="flex justify-between text-gray-500"><span>Audio:</span> <span>0</span></div>
                  </div>
                </div>

                <div className={`p-4 rounded-lg border-l-4 border-red-600 ${darkMode ? 'bg-red-600/10' : 'bg-red-50'}`}>
                  <h5 className="font-bold text-red-500 text-base mb-1">Armed Confrontation</h5>
                  <p className={`text-xs ${textSub} mb-2`}>Weapon + Surrender • Score: 75 (Danger)</p>
                  <div className="text-[10px] space-y-1 font-mono opacity-80">
                    <div className="flex justify-between"><span>Weapon:</span> <span>+45</span></div>
                    <div className="flex justify-between"><span>Behavior:</span> <span>+30</span></div>
                  </div>
                </div>

                <div className={`p-4 rounded-lg border-l-4 border-red-600 ${darkMode ? 'bg-red-600/10' : 'bg-red-50'}`}>
                  <h5 className="font-bold text-red-500 text-base mb-1">Domestic/Medical Alert</h5>
                  <p className={`text-xs ${textSub} mb-2`}>Distress + Fall • Score: 55 (Critical Warning)</p>
                  <div className="text-[10px] space-y-1 font-mono opacity-80">
                    <div className="flex justify-between"><span>Audio:</span> <span>+35</span></div>
                    <div className="flex justify-between"><span>Behavior:</span> <span>+20</span></div>
                  </div>
                </div>

                <div className={`p-4 rounded-lg border-l-4 border-red-600 animate-pulse ${darkMode ? 'bg-red-600/20' : 'bg-red-100'}`}>
                  <h5 className="font-bold text-red-600 text-base mb-1">Critical Assault</h5>
                  <p className={`text-xs ${textSub} mb-2`}>Weapon + Audio + Crowd • Score: 95 (Immediate Alert)</p>
                  <div className="text-[10px] space-y-1 font-mono opacity-80">
                    <div className="flex justify-between"><span>Weapon:</span> <span>+45</span></div>
                    <div className="flex justify-between"><span>Audio:</span> <span>+35</span></div>
                    <div className="flex justify-between"><span>Proximity:</span> <span>+15</span></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* STATUS BANNER */}
      <div className={`w-full p-6 rounded-xl mb-8 border-b-4 shadow-xl flex items-center justify-center gap-4 transition-all duration-500 ${getStatusColor(status)}`}>
        {status === "DANGER" ? <Siren className="w-8 h-8 animate-bounce" /> : status === "WARNING" ? <AlertTriangle className="w-8 h-8" /> : <CheckCircle className="w-8 h-8" />}
        <div className="text-center">
          <h2 className="text-3xl font-black tracking-widest uppercase">{status} DETECTED</h2>
          <p className="text-sm opacity-90 font-mono mt-1">THREAT SCORE: {threatScore} / 100</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* VIDEO FEED SECTION */}
        <div className="lg:col-span-2 space-y-6">
          <div className={`relative ${darkMode ? 'bg-black' : 'bg-gray-900'} rounded-xl overflow-hidden shadow-xl border ${borderCard} aspect-video group`}>
            {systemArmed ? (
              <>
                {useBackend && !backendError ? (
                  <img 
                    src={`http://localhost:5000/video_feed?token=${localStorage.getItem('token')}`} 
                    alt="Live Surveillance Feed"
                    className="w-full h-full object-contain"
                    onError={() => setBackendError(true)}
                  />
                ) : (
                  <div className={`absolute inset-0 flex flex-col items-center justify-center ${darkMode ? 'bg-gray-800' : 'bg-gray-200'} text-gray-500`}>
                    <Activity className="animate-pulse w-10 h-10 mb-2 text-blue-500" />
                    <p className="text-sm font-mono tracking-widest">{useBackend ? "REACHING TERMINAL..." : "SIMULATION MODE ACTIVE"}</p>
                    {useBackend && (
                      <p className="text-xs text-red-500 font-mono mt-2 opacity-70">
                        Error: Endpoint 5000 unreachable
                      </p>
                    )}
                  </div>
                )}
                <div className="absolute top-4 left-4 bg-black/70 backdrop-blur-md px-3 py-1 rounded-full text-xs text-red-400 border border-red-500/50 flex items-center gap-2">
                  <div className="w-1.5 h-1.5 bg-red-500 rounded-full animate-ping" />
                  {useBackend ? "SECURE FEED" : "DEV SIM"}
                </div>
              </>
            ) : (
              <div className={`absolute inset-0 flex flex-col items-center justify-center ${darkMode ? 'bg-gray-900' : 'bg-gray-100'} ${textSub}`}>
                <Power className="w-16 h-16 mb-4 opacity-30" />
                <p className="font-bold tracking-widest uppercase text-sm">Terminal Disarmed</p>
              </div>
            )}
          </div>
        </div>

        {/* METRICS & DISPATCH SECTION */}
        <div className="space-y-6">
          
          {/* Dispatch Control */}
          <div className={`${bgCard} p-4 rounded-xl border ${borderCard} shadow-sm transition-all duration-300`}>
            <div className="flex items-center gap-2 mb-3">
              <Mail className={`w-4 h-4 ${textSub}`} />
              <h3 className={`text-xs font-bold ${textMain} uppercase tracking-wider`}>Emergency Dispatch</h3>
            </div>
            <div className="space-y-2">
              <div className="flex gap-2">
                <input 
                  type="email" 
                  placeholder="Dispatch address..." 
                  value={tempEmail}
                  onChange={(e) => setTempEmail(e.target.value)}
                  className={`flex-1 px-3 py-2 rounded-lg text-sm border ${borderCard} ${inputBg} ${textMain} outline-none focus:ring-2 focus:ring-blue-500 transition-all`}
                />
                <button 
                  onClick={handleSaveEmail}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2"
                >
                  <Save className="w-4 h-4" />
                </button>
              </div>
              {emergencyEmail && (
                <p className="text-[10px] text-emerald-500 flex items-center gap-1 mt-1 font-bold">
                  <CheckCircle className="w-3 h-3" /> ACTIVE NODE: {emergencyEmail}
                </p>
              )}
            </div>
          </div>

          {/* Telemetry Grid */}
          <div className="grid grid-cols-2 gap-4">
            {Object.entries(metrics).map(([key, data]) => (
              <div key={key} className={`${bgCard} p-4 rounded-xl border ${borderCard} shadow-sm transition-all hover:border-blue-500/40 group`}>
                <div className="flex justify-between items-start mb-2">
                  <span className={`${textSub} text-[10px] font-bold uppercase tracking-widest group-hover:text-blue-400 transition-colors`}>{key}</span>
                  {key === 'weapon' && <Crosshair className={`w-5 h-5 ${getMetricColor(data.score)}`} />}
                  {key === 'audio' && <Mic className={`w-5 h-5 ${getMetricColor(data.score)}`} />}
                  {key === 'pose' && <User className={`w-5 h-5 ${getMetricColor(data.score)}`} />}
                  {key === 'proximity' && <Users className={`w-5 h-5 ${getMetricColor(data.score)}`} />}
                </div>
                <div className="text-3xl font-black mb-1 tracking-tight">{data.score}</div>
                <div className={`text-[10px] ${getMetricColor(data.score)} font-bold truncate uppercase tracking-tighter`}>{data.label}</div>
              </div>
            ))}
          </div>

        </div>
      </div>
    </div>
  );
};

export default App;