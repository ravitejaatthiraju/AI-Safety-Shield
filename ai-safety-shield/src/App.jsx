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
  Wifi
} from 'lucide-react';

const App = () => {
  // --- STATE MANAGEMENT ---
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
  
  // Emergency Contact State
  const [emergencyEmail, setEmergencyEmail] = useState("");
  const [tempEmail, setTempEmail] = useState("");
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState("");
  
  // Info Section State
  const [showInfo, setShowInfo] = useState(false);
  const [backendError, setBackendError] = useState(false);

  // --- HELPER: TOAST NOTIFICATION ---
  const triggerToast = (msg) => {
    setToastMessage(msg);
    setShowToast(true);
    setTimeout(() => setShowToast(false), 3000);
  };

  // --- HANDLER: SAVE EMAIL (Hybrid) ---
  const handleSaveEmail = async () => {
    if (tempEmail.trim() === "") {
      triggerToast("Please enter a valid email.");
      return;
    }

    if (useBackend) {
      // Real Backend Call
      try {
        const response = await fetch('http://localhost:5000/update-email', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: tempEmail }),
        });
        if (response.ok) {
          setEmergencyEmail(tempEmail);
          triggerToast(`Emergency contact updated via Server: ${tempEmail}`);
        } else {
          triggerToast("Failed to update email on server.");
        }
      } catch (error) {
        console.error("Error updating email:", error);
        triggerToast("Server offline. Could not save.");
      }
    } else {
      // Simulation Mode
      setEmergencyEmail(tempEmail);
      triggerToast(`(Sim) Emergency contact updated to: ${tempEmail}`);
    }
  };

  // --- DATA POLLING LOGIC ---
  useEffect(() => {
    let interval;
    
    // Function to handle Real Backend Data
    const fetchBackendData = async () => {
      try {
        const response = await fetch('http://localhost:5000/status');
        if (response.ok) {
          const data = await response.json();
          setBackendError(false);
          
          setThreatScore(data.total_score);
          setStatus(data.status);
          
          setMetrics({
            weapon: { 
              score: data.weapon_score, 
              label: data.weapon_score > 0 ? data.weapon_label : "None" 
            },
            audio: { 
              score: data.audio_score, 
              label: data.audio_score > 0 ? "Distress Keyword" : "Listening..." 
            },
            pose: { 
              score: data.pose_score, 
              label: data.pose_score > 0 ? (data.pose_score >= 30 ? "Surrender" : "Fall Detected") : "Normal" 
            },
            proximity: { 
              score: data.proximity_score, 
              label: data.proximity_score > 0 ? "Crowding" : "Safe" 
            }
          });
        } else {
          setBackendError(true);
        }
      } catch (error) {
        setBackendError(true);
        console.warn("Backend poll failed:", error);
      }
    };

    // Function to handle Simulation Data
    const runSimulation = () => {
      const rand = Math.random();
      let newWeapon = 0, newAudio = 0, newPose = 0, newProx = 0;

      // Random scenarios
      if (rand > 0.9) { 
        // Weapon + Scream
        newWeapon = 45; newAudio = 35; newPose = 0; newProx = 0;
      } else if (rand > 0.8) {
        // Just Proximity
        newWeapon = 0; newAudio = 0; newPose = 0; newProx = 15;
      } else if (rand > 0.7) {
         // Medical (Fall + Help)
         newWeapon = 0; newAudio = 35; newPose = 20; newProx = 0;
      } else {
        // Mostly safe
        newWeapon = 0; newAudio = 0; newPose = 0; newProx = 0;
      }

      const total = newWeapon + newAudio + newPose + newProx;
      setThreatScore(total);

      // Update individual metrics
      setMetrics({
        weapon: { score: newWeapon, label: newWeapon > 0 ? "Weapon Detected" : "None" },
        audio: { score: newAudio, label: newAudio > 0 ? "Distress Keyword" : "Listening..." },
        pose: { score: newPose, label: newPose > 0 ? (newPose === 30 ? "Surrender" : "Fall Detected") : "Normal" },
        proximity: { score: newProx, label: newProx > 0 ? "Crowding" : "Safe" }
      });

      // Update Status Logic
      let currentStatus = "SAFE";
      if (total >= 60) currentStatus = "DANGER";
      else if (total >= 35) currentStatus = "WARNING";
      setStatus(currentStatus);
    };

    if (systemArmed) {
      interval = setInterval(() => {
        if (useBackend) {
          fetchBackendData();
        } else {
          runSimulation();
        }
      }, useBackend ? 500 : 3000); // Poll faster for backend, slower for sim readability
    } else {
      // Reset when disarmed
      setThreatScore(0);
      setStatus("SAFE");
      setBackendError(false);
      setMetrics({
        weapon: { score: 0, label: "None" },
        audio: { score: 0, label: "Listening..." },
        pose: { score: 0, label: "Normal" },
        proximity: { score: 0, label: "Safe" }
      });
    }

    return () => clearInterval(interval);
  }, [systemArmed, useBackend]);

  // --- STYLING HELPERS ---
  const getStatusColor = (status) => {
    switch(status) {
      case "DANGER": return "bg-red-600 border-red-800 animate-pulse text-white";
      case "WARNING": return "bg-yellow-500 border-yellow-700 text-black";
      default: return "bg-emerald-600 border-emerald-800 text-white";
    }
  };

  const getMetricColor = (score) => {
    if (score >= 40) return "text-red-600 dark:text-red-500";
    if (score >= 20) return "text-yellow-600 dark:text-yellow-500";
    return "text-emerald-600 dark:text-emerald-500";
  };

  // Theme classes
  const bgMain = darkMode ? "bg-gray-900" : "bg-gray-100";
  const textMain = darkMode ? "text-gray-100" : "text-gray-900";
  const bgCard = darkMode ? "bg-gray-800" : "bg-white";
  const borderCard = darkMode ? "border-gray-700" : "border-gray-200";
  const textSub = darkMode ? "text-gray-400" : "text-gray-500";
  const inputBg = darkMode ? "bg-gray-700" : "bg-gray-100";
  const inputText = darkMode ? "text-white" : "text-gray-900";

  return (
    <div className={`min-h-screen ${bgMain} ${textMain} font-sans p-4 md:p-8 transition-colors duration-300 relative`}>
      
      {/* TOAST NOTIFICATION */}
      {showToast && (
        <div className="fixed top-4 right-4 z-50 bg-blue-600 text-white px-6 py-3 rounded-lg shadow-xl animate-bounce flex items-center gap-2">
          <CheckCircle className="w-5 h-5" />
          {toastMessage}
        </div>
      )}

      {/* HEADER */}
      <header className={`flex flex-col xl:flex-row justify-between items-center mb-8 ${bgCard} p-4 rounded-xl shadow-lg border ${borderCard} transition-colors duration-300 gap-4`}>
        <div className="flex items-center gap-3 w-full md:w-auto">
          <Shield className="w-10 h-10 text-blue-500 flex-shrink-0" />
          <div>
            <h1 className="text-2xl font-bold tracking-tight">AI Safety Shield</h1>
            <p className={`text-xs ${textSub}`}>Multimodal Surveillance Dashboard</p>
          </div>
        </div>

        <div className="flex items-center gap-3 flex-wrap justify-center w-full xl:w-auto">
          
          {/* Backend Toggle Switch */}
          <button 
            onClick={() => setUseBackend(!useBackend)}
            className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-300 border ${
              useBackend 
                ? (backendError ? 'bg-red-900/30 border-red-500 text-red-200' : 'bg-blue-900/30 border-blue-500 text-blue-200') 
                : 'bg-gray-700 border-gray-600 text-gray-400'
            }`}
          >
            {useBackend ? <Server className="w-4 h-4" /> : <Wifi className="w-4 h-4" />}
            {useBackend ? (backendError ? "Backend Error" : "Live Backend") : "Simulation Mode"}
          </button>

          {/* Info Toggle */}
          <button 
            onClick={() => setShowInfo(!showInfo)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all duration-300 ${showInfo ? 'bg-blue-600 text-white' : (darkMode ? 'bg-gray-700 hover:bg-gray-600 text-blue-400' : 'bg-gray-200 hover:bg-gray-300 text-blue-600')}`}
          >
            <Info className="w-5 h-5" />
            <span className="text-sm font-medium hidden md:inline">System Logic</span>
          </button>

          {/* Theme Toggle */}
          <button 
            onClick={() => setDarkMode(!darkMode)}
            className={`p-2 rounded-full transition-all duration-300 ${darkMode ? 'bg-gray-700 hover:bg-gray-600 text-yellow-300' : 'bg-gray-200 hover:bg-gray-300 text-gray-600'}`}
          >
            {darkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
          </button>

          {/* System Arm Status */}
          <div className={`px-3 py-1 rounded-full text-xs font-semibold ${systemArmed ? 'bg-green-900/80 text-green-100 border border-green-700' : 'bg-red-900/80 text-red-100 border border-red-700'}`}>
            {systemArmed ? "SYSTEM ARMED" : "DISARMED"}
          </div>
          
          {/* Arm Toggle Button */}
          <button 
            onClick={() => setSystemArmed(!systemArmed)}
            className={`p-3 rounded-full transition-all duration-300 shadow-md ${systemArmed ? 'bg-red-600 hover:bg-red-700' : 'bg-green-600 hover:bg-green-700'}`}
          >
            <Power className="w-6 h-6 text-white" />
          </button>
        </div>
      </header>

      {/* INFO SECTION (Collapsible) */}
      {showInfo && (
        <div className={`w-full p-6 rounded-xl mb-8 border-l-4 border-blue-500 shadow-2xl transition-all duration-300 ${bgCard} relative`}>
          <button onClick={() => setShowInfo(false)} className="absolute top-4 right-4 p-1 hover:bg-gray-700 rounded-full transition-colors">
            <X className="w-6 h-6 text-gray-400" />
          </button>
          
          <div className="flex items-center gap-3 mb-6">
            <BookOpen className="w-8 h-8 text-blue-500" />
            <h3 className="text-2xl font-bold">System Logic & Scenarios</h3>
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-2 gap-8 text-sm">
            
            {/* Logic Explanation */}
            <div>
              <h4 className="flex items-center gap-2 font-bold mb-4 text-blue-400 text-lg border-b border-gray-700 pb-2">
                <Zap className="w-5 h-5" /> How Each Factor Works
              </h4>
              <div className="space-y-4">
                <div className={`p-3 rounded-lg ${darkMode ? 'bg-gray-700/50' : 'bg-gray-100'}`}>
                  <div className="flex items-center gap-2 font-semibold text-red-400 mb-1"><Crosshair className="w-4 h-4"/> Weapon (+45 pts)</div>
                  <p className={textSub}>Detects objects like knives, baseball bats, or firearms using YOLOv8 object detection models.</p>
                </div>
                <div className={`p-3 rounded-lg ${darkMode ? 'bg-gray-700/50' : 'bg-gray-100'}`}>
                  <div className="flex items-center gap-2 font-semibold text-yellow-400 mb-1"><Mic className="w-4 h-4"/> Audio (+35 pts)</div>
                  <p className={textSub}>Listens for distress keywords (e.g., "Help!", "Police", "Scream") using Speech Recognition analysis.</p>
                </div>
                <div className={`p-3 rounded-lg ${darkMode ? 'bg-gray-700/50' : 'bg-gray-100'}`}>
                  <div className="flex items-center gap-2 font-semibold text-blue-400 mb-1"><User className="w-4 h-4"/> Pose (+20-30 pts)</div>
                  <p className={textSub}>Analyzes body language via MediaPipe. Detects "Hands Up" (Surrender, +30) or "Fall Detected" (+20).</p>
                </div>
                <div className={`p-3 rounded-lg ${darkMode ? 'bg-gray-700/50' : 'bg-gray-100'}`}>
                  <div className="flex items-center gap-2 font-semibold text-emerald-400 mb-1"><Users className="w-4 h-4"/> Proximity (+15 pts)</div>
                  <p className={textSub}>Measures distance between individuals. Triggers if aggressive crowding is detected (&lt; 100px).</p>
                </div>
              </div>
              
              <div className="mt-6 p-4 rounded-lg bg-blue-900/20 border border-blue-800/50">
                <h5 className="font-bold text-blue-300 mb-2">Consensus Logic</h5>
                <p className={`${textSub} text-xs leading-relaxed`}>
                  Single indicators create awareness (Warning), while overlapping indicators confirm a threat (Danger). 
                  <br/><br/>
                  <strong>Thresholds:</strong> <span className="text-yellow-400">Warning &ge; 35</span> | <span className="text-red-500 font-bold">Danger &ge; 60</span>
                </p>
              </div>
            </div>

            {/* Scenarios */}
            <div>
              <h4 className="flex items-center gap-2 font-bold mb-4 text-blue-400 text-lg border-b border-gray-700 pb-2">
                <Eye className="w-5 h-5" /> Real-World Scenarios
              </h4>
              <div className="space-y-4 h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                {/* Scenario 1 */}
                <div className={`p-4 rounded-lg border-l-4 border-yellow-500 ${darkMode ? 'bg-yellow-500/10' : 'bg-yellow-50'}`}>
                  <h5 className="font-bold text-yellow-500 text-base mb-1">1. The "Silent Threat"</h5>
                  <p className={`text-xs ${textSub} mb-2`}>Weapon Detected Only • Total Score: 45</p>
                  <div className="text-xs space-y-1 font-mono opacity-80">
                    <div className="flex justify-between"><span>Weapon:</span> <span>+45 (Knife)</span></div>
                    <div className="flex justify-between text-gray-500"><span>Audio:</span> <span>0 (Silence)</span></div>
                    <div className="flex justify-between text-gray-500"><span>Pose:</span> <span>0 (Normal)</span></div>
                  </div>
                </div>

                {/* Scenario 2 */}
                <div className={`p-4 rounded-lg border-l-4 border-red-600 ${darkMode ? 'bg-red-600/10' : 'bg-red-50'}`}>
                  <h5 className="font-bold text-red-500 text-base mb-1">2. The "Armed Robbery"</h5>
                  <p className={`text-xs ${textSub} mb-2`}>Weapon + Surrender Pose • Total Score: 75</p>
                  <div className="text-xs space-y-1 font-mono opacity-80">
                    <div className="flex justify-between"><span>Weapon:</span> <span>+45 (Knife)</span></div>
                    <div className="flex justify-between"><span>Pose:</span> <span>+30 (Hands Up)</span></div>
                  </div>
                </div>

                {/* Scenario 3 */}
                <div className={`p-4 rounded-lg border-l-4 border-red-600 ${darkMode ? 'bg-red-600/10' : 'bg-red-50'}`}>
                  <h5 className="font-bold text-red-500 text-base mb-1">3. The "Active Assault"</h5>
                  <p className={`text-xs ${textSub} mb-2`}>Weapon + Scream + Proximity • Total Score: 95</p>
                  <div className="text-xs space-y-1 font-mono opacity-80">
                    <div className="flex justify-between"><span>Weapon:</span> <span>+45 (Bat)</span></div>
                    <div className="flex justify-between"><span>Audio:</span> <span>+35 ("Danger!")</span></div>
                    <div className="flex justify-between"><span>Proximity:</span> <span>+15 (Crowding)</span></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* STATUS BANNER */}
      <div className={`w-full p-6 rounded-xl mb-8 border-b-4 shadow-xl transition-all duration-500 flex items-center justify-center gap-4 ${getStatusColor(status)}`}>
        {status === "DANGER" && <Siren className="w-8 h-8 animate-bounce" />}
        {status === "WARNING" && <AlertTriangle className="w-8 h-8" />}
        {status === "SAFE" && <CheckCircle className="w-8 h-8" />}
        
        <div className="text-center">
          <h2 className="text-3xl font-black tracking-widest">{status} DETECTED</h2>
          <p className="text-sm opacity-90 font-mono mt-1">THREAT SCORE: {threatScore} / 100</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* VIDEO FEED SECTION */}
        <div className="lg:col-span-2 space-y-6">
          <div className={`relative ${darkMode ? 'bg-black' : 'bg-gray-900'} rounded-xl overflow-hidden shadow-xl border ${borderCard} aspect-video group`}>
            {systemArmed ? (
              <>
                {/* HYBRID VIDEO FEED RENDERER */}
                {useBackend && !backendError ? (
                  /* Real Backend Feed */
                  <img 
                    src="http://localhost:5000/video_feed" 
                    alt="Live Surveillance Feed"
                    className="w-full h-full object-contain"
                    onError={() => setBackendError(true)}
                  />
                ) : (
                  /* Simulation/Fallback Placeholder */
                  <div className={`absolute inset-0 flex flex-col items-center justify-center ${darkMode ? 'bg-gray-800' : 'bg-gray-200'}`}>
                    <p className={`${textSub} animate-pulse flex items-center gap-2 mb-2`}>
                      <Activity className="w-5 h-5" /> 
                      {useBackend ? "Connecting to Camera..." : "Simulated Video Feed"}
                    </p>
                    {useBackend && (
                      <p className="text-xs text-red-500 font-mono">
                        Error: Localhost:5000 not reachable
                      </p>
                    )}
                    {/* Simulated visual elements to make it look active */}
                    <div className="w-32 h-1 bg-gray-600 rounded mt-4 overflow-hidden">
                      <div className="h-full bg-blue-500 animate-loading-bar w-1/2"></div>
                    </div>
                  </div>
                )}
                
                {/* Overlay UI */}
                <div className="absolute top-4 left-4 bg-black/60 backdrop-blur-sm px-3 py-1 rounded text-xs text-red-400 font-mono border border-red-900/50 flex items-center gap-2">
                  <div className="w-2 h-2 bg-red-500 rounded-full animate-ping" />
                  {useBackend ? "LIVE FEED" : "SIMULATION"}
                </div>
                <div className="absolute bottom-4 left-4 text-xs text-gray-300 font-mono bg-black/40 px-2 py-1 rounded">
                  CAM-01 • 1080p • 30FPS
                </div>
              </>
            ) : (
              <div className={`absolute inset-0 flex flex-col items-center justify-center ${darkMode ? 'bg-gray-900' : 'bg-gray-100'} ${textSub}`}>
                <Power className="w-16 h-16 mb-4 opacity-50" />
                <p>System Offline</p>
              </div>
            )}
          </div>
        </div>

        {/* METRICS & LOGS SECTION */}
        <div className="space-y-6">
          
          {/* Emergency Contact Block */}
          <div className={`${bgCard} p-4 rounded-xl border ${borderCard} shadow-sm transition-all duration-300`}>
            <div className="flex items-center gap-2 mb-3">
              <Mail className={`w-5 h-5 ${textSub}`} />
              <h3 className={`text-sm font-bold ${textMain} uppercase`}>Emergency Contact</h3>
            </div>
            <div className="space-y-2">
              <div className="flex gap-2">
                <input 
                  type="email" 
                  placeholder="Enter friend's email..." 
                  value={tempEmail}
                  onChange={(e) => setTempEmail(e.target.value)}
                  className={`flex-1 px-3 py-2 rounded-lg text-sm border ${borderCard} ${inputBg} ${inputText} focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all`}
                />
                <button 
                  onClick={handleSaveEmail}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2"
                >
                  <Save className="w-4 h-4" /> Save
                </button>
              </div>
              {emergencyEmail && (
                <p className="text-xs text-emerald-500 flex items-center gap-1 mt-1">
                  <CheckCircle className="w-3 h-3" /> Active: {emergencyEmail}
                </p>
              )}
            </div>
          </div>

          {/* Telemetry Grid */}
          <div className="grid grid-cols-2 gap-4">
            {/* Weapon Card */}
            <div className={`${bgCard} p-4 rounded-xl border ${borderCard} shadow-sm transition-all duration-300`}>
              <div className="flex justify-between items-start mb-2">
                <span className={`${textSub} text-xs font-bold uppercase`}>Weapon</span>
                <Crosshair className={`w-5 h-5 ${getMetricColor(metrics.weapon.score)}`} />
              </div>
              <div className="text-2xl font-bold">{metrics.weapon.score}</div>
              <div className={`text-xs ${getMetricColor(metrics.weapon.score)} font-medium truncate`}>{metrics.weapon.label}</div>
            </div>

            {/* Audio Card */}
            <div className={`${bgCard} p-4 rounded-xl border ${borderCard} shadow-sm transition-all duration-300`}>
              <div className="flex justify-between items-start mb-2">
                <span className={`${textSub} text-xs font-bold uppercase`}>Audio</span>
                <Mic className={`w-5 h-5 ${getMetricColor(metrics.audio.score)}`} />
              </div>
              <div className="text-2xl font-bold">{metrics.audio.score}</div>
              <div className={`text-xs ${getMetricColor(metrics.audio.score)} font-medium truncate`}>{metrics.audio.label}</div>
            </div>

            {/* Pose Card */}
            <div className={`${bgCard} p-4 rounded-xl border ${borderCard} shadow-sm transition-all duration-300`}>
              <div className="flex justify-between items-start mb-2">
                <span className={`${textSub} text-xs font-bold uppercase`}>Pose</span>
                <User className={`w-5 h-5 ${getMetricColor(metrics.pose.score)}`} />
              </div>
              <div className="text-2xl font-bold">{metrics.pose.score}</div>
              <div className={`text-xs ${getMetricColor(metrics.pose.score)} font-medium truncate`}>{metrics.pose.label}</div>
            </div>

            {/* Proximity Card */}
            <div className={`${bgCard} p-4 rounded-xl border ${borderCard} shadow-sm transition-all duration-300`}>
              <div className="flex justify-between items-start mb-2">
                <span className={`${textSub} text-xs font-bold uppercase`}>Proximity</span>
                <Users className={`w-5 h-5 ${getMetricColor(metrics.proximity.score)}`} />
              </div>
              <div className="text-2xl font-bold">{metrics.proximity.score}</div>
              <div className={`text-xs ${getMetricColor(metrics.proximity.score)} font-medium truncate`}>{metrics.proximity.label}</div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};

export default App;