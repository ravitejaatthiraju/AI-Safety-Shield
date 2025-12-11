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
  HelpCircle,
  Eye
} from 'lucide-react';

const App = () => {
  // --- STATE MANAGEMENT ---
  const [systemArmed, setSystemArmed] = useState(true);
  const [threatScore, setThreatScore] = useState(0);
  const [metrics, setMetrics] = useState({
    weapon: { score: 0, label: "None" },
    audio: { score: 0, label: "Listening..." },
    pose: { score: 0, label: "Normal" },
    proximity: { score: 0, label: "Safe" }
  });
  const [status, setStatus] = useState("SAFE");
  const [darkMode, setDarkMode] = useState(true); // Theme state
  
  // Feature 1: Emergency Contact State
  const [emergencyEmail, setEmergencyEmail] = useState("");
  const [tempEmail, setTempEmail] = useState("");
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState("");

  // Feature 2: Info Section State
  const [showInfo, setShowInfo] = useState(false);

  // --- HELPER: TOAST NOTIFICATION ---
  const triggerToast = (msg) => {
    setToastMessage(msg);
    setShowToast(true);
    setTimeout(() => setShowToast(false), 3000);
  };

  // --- HANDLER: SAVE EMAIL ---
  const handleSaveEmail = () => {
    if (tempEmail.trim() === "") {
      triggerToast("Please enter a valid email.");
      return;
    }
    setEmergencyEmail(tempEmail);
    triggerToast(`Emergency contact updated to: ${tempEmail}`);
  };

  // --- SIMULATION LOGIC ---
  useEffect(() => {
    let interval;
    if (systemArmed) {
      interval = setInterval(() => {
        // Simulate fluctuating scores for demo purposes
        // Randomly pick a "scenario" to simulate occasionally
        const rand = Math.random();
        let newWeapon = 0, newAudio = 0, newPose = 0, newProx = 0;

        if (rand > 0.9) { 
          // Scenario: Weapon + Scream (Danger)
          newWeapon = 45; newAudio = 35; newPose = 0; newProx = 0;
        } else if (rand > 0.8) {
          // Scenario: Just Proximity (Safe/Low)
          newWeapon = 0; newAudio = 0; newPose = 0; newProx = 15;
        } else if (rand > 0.7) {
           // Scenario: Medical (Fall + Help)
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

        // Update Status
        let currentStatus = "SAFE";
        if (total >= 60) currentStatus = "DANGER";
        else if (total >= 35) currentStatus = "WARNING";
        setStatus(currentStatus);

      }, 3000); // Slower update for readability
    } else {
      // Reset when disarmed
      setThreatScore(0);
      setStatus("SAFE");
      setMetrics({
        weapon: { score: 0, label: "None" },
        audio: { score: 0, label: "Listening..." },
        pose: { score: 0, label: "Normal" },
        proximity: { score: 0, label: "Safe" }
      });
    }
    return () => clearInterval(interval);
  }, [systemArmed]);

  // --- HELPER FUNCTIONS ---
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
      <header className={`flex flex-col md:flex-row justify-between items-center mb-8 ${bgCard} p-4 rounded-xl shadow-lg border ${borderCard} transition-colors duration-300`}>
        <div className="flex items-center gap-3 mb-4 md:mb-0">
          <Shield className="w-10 h-10 text-blue-500" />
          <div>
            <h1 className="text-2xl font-bold tracking-tight">AI Safety Shield</h1>
            <p className={`text-xs ${textSub}`}>Multimodal Surveillance Dashboard</p>
          </div>
        </div>

        <div className="flex items-center gap-4 flex-wrap justify-center">
          {/* Feature 2 Toggle */}
          <button 
            onClick={() => setShowInfo(!showInfo)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all duration-300 ${showInfo ? 'bg-blue-600 text-white' : (darkMode ? 'bg-gray-700 hover:bg-gray-600 text-blue-400' : 'bg-gray-200 hover:bg-gray-300 text-blue-600')}`}
          >
            <Info className="w-5 h-5" />
            <span className="text-sm font-medium">System Logic</span>
          </button>

          {/* Theme Toggle */}
          <button 
            onClick={() => setDarkMode(!darkMode)}
            className={`p-2 rounded-full transition-all duration-300 ${darkMode ? 'bg-gray-700 hover:bg-gray-600 text-yellow-300' : 'bg-gray-200 hover:bg-gray-300 text-gray-600'}`}
            title={darkMode ? "Switch to Light Mode" : "Switch to Dark Mode"}
          >
            {darkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
          </button>

          <div className={`px-3 py-1 rounded-full text-xs font-semibold ${systemArmed ? 'bg-green-900/80 text-green-100 border border-green-700' : 'bg-red-900/80 text-red-100 border border-red-700'}`}>
            {systemArmed ? "SYSTEM ARMED" : "DISARMED"}
          </div>
          <button 
            onClick={() => setSystemArmed(!systemArmed)}
            className={`p-3 rounded-full transition-all duration-300 shadow-md ${systemArmed ? 'bg-red-600 hover:bg-red-700' : 'bg-green-600 hover:bg-green-700'}`}
            title={systemArmed ? "Disarm System" : "Arm System"}
          >
            <Power className="w-6 h-6 text-white" />
          </button>
        </div>
      </header>

      {/* Feature 2: Info Section (Collapsible) */}
      {showInfo && (
        <div className={`w-full p-6 rounded-xl mb-8 border-l-4 border-blue-500 shadow-2xl transition-all duration-300 ${bgCard} relative`}>
          <button 
            onClick={() => setShowInfo(false)}
            className="absolute top-4 right-4 p-1 hover:bg-gray-700 rounded-full transition-colors"
          >
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
              <div className="space-y-4 h-[500px] overflow-y-auto pr-2 custom-scrollbar">
                
                {/* Scenario 1 */}
                <div className={`p-4 rounded-lg border-l-4 border-yellow-500 ${darkMode ? 'bg-yellow-500/10' : 'bg-yellow-50'}`}>
                  <h5 className="font-bold text-yellow-500 text-base mb-1">1. The "Silent Threat"</h5>
                  <p className={`text-xs ${textSub} mb-2`}>Weapon Detected Only • Total Score: 45</p>
                  <div className="text-xs space-y-1 font-mono opacity-80">
                    <div className="flex justify-between"><span>Weapon:</span> <span>+45 (Knife)</span></div>
                    <div className="flex justify-between text-gray-500"><span>Audio:</span> <span>0 (Silence)</span></div>
                    <div className="flex justify-between text-gray-500"><span>Pose:</span> <span>0 (Normal)</span></div>
                  </div>
                  <div className="mt-2 pt-2 border-t border-yellow-500/30 text-xs italic">
                    Result: WARNING. Potential threat flagged, but lack of aggression keeps it at yellow alert.
                  </div>
                </div>

                {/* Scenario 2 */}
                <div className={`p-4 rounded-lg border-l-4 border-yellow-500 ${darkMode ? 'bg-yellow-500/10' : 'bg-yellow-50'}`}>
                  <h5 className="font-bold text-yellow-500 text-base mb-1">2. The "Distress Call"</h5>
                  <p className={`text-xs ${textSub} mb-2`}>Audio Only • Total Score: 35</p>
                  <div className="text-xs space-y-1 font-mono opacity-80">
                    <div className="flex justify-between text-gray-500"><span>Weapon:</span> <span>0</span></div>
                    <div className="flex justify-between"><span>Audio:</span> <span>+35 ("Help me!")</span></div>
                  </div>
                  <div className="mt-2 pt-2 border-t border-yellow-500/30 text-xs italic">
                    Result: WARNING. A single strong indicator triggers a warning for personnel to check audio.
                  </div>
                </div>

                {/* Scenario 3 */}
                <div className={`p-4 rounded-lg border-l-4 border-red-600 ${darkMode ? 'bg-red-600/10' : 'bg-red-50'}`}>
                  <h5 className="font-bold text-red-500 text-base mb-1">3. The "Armed Robbery"</h5>
                  <p className={`text-xs ${textSub} mb-2`}>Weapon + Surrender Pose • Total Score: 75</p>
                  <div className="text-xs space-y-1 font-mono opacity-80">
                    <div className="flex justify-between"><span>Weapon:</span> <span>+45 (Knife)</span></div>
                    <div className="flex justify-between"><span>Pose:</span> <span>+30 (Hands Up)</span></div>
                  </div>
                  <div className="mt-2 pt-2 border-t border-red-600/30 text-xs italic">
                    Result: DANGER. Lethal weapon + victim distress posture crosses the 60 threshold.
                  </div>
                </div>

                {/* Scenario 4 */}
                <div className={`p-4 rounded-lg border-l-4 border-red-600 ${darkMode ? 'bg-red-600/10' : 'bg-red-50'}`}>
                  <h5 className="font-bold text-red-500 text-base mb-1">4. The "Active Assault"</h5>
                  <p className={`text-xs ${textSub} mb-2`}>Weapon + Scream + Proximity • Total Score: 95</p>
                  <div className="text-xs space-y-1 font-mono opacity-80">
                    <div className="flex justify-between"><span>Weapon:</span> <span>+45 (Bat)</span></div>
                    <div className="flex justify-between"><span>Audio:</span> <span>+35 ("Danger!")</span></div>
                    <div className="flex justify-between"><span>Proximity:</span> <span>+15 (Crowding)</span></div>
                  </div>
                  <div className="mt-2 pt-2 border-t border-red-600/30 text-xs italic">
                    Result: CRITICAL DANGER. Highest threat level; minimizes false positives.
                  </div>
                </div>

                 {/* Scenario 5 */}
                 <div className={`p-4 rounded-lg border-l-4 border-yellow-500 ${darkMode ? 'bg-yellow-500/10' : 'bg-yellow-50'}`}>
                  <h5 className="font-bold text-yellow-500 text-base mb-1">5. The "Medical Emergency"</h5>
                  <p className={`text-xs ${textSub} mb-2`}>Fall + Help • Total Score: 55</p>
                  <div className="text-xs space-y-1 font-mono opacity-80">
                    <div className="flex justify-between text-gray-500"><span>Weapon:</span> <span>0</span></div>
                    <div className="flex justify-between"><span>Audio:</span> <span>+35 ("Help!")</span></div>
                    <div className="flex justify-between"><span>Pose:</span> <span>+20 (Fall)</span></div>
                  </div>
                  <div className="mt-2 pt-2 border-t border-yellow-500/30 text-xs italic">
                    Result: HIGH WARNING. Near-danger level. Alerts operators to a high-priority event.
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
                {/* Simulated Video Placeholder */}
                <div className={`absolute inset-0 flex items-center justify-center ${darkMode ? 'bg-gray-800' : 'bg-gray-200'}`}>
                  <p className={`${textSub} animate-pulse flex items-center gap-2`}>
                    <Activity className="w-4 h-4" /> 
                    Live Video Feed Active
                  </p>
                  {/* In a real app, <img src="http://localhost:5000/video_feed" /> goes here */}
                </div>
                
                {/* Overlay UI */}
                <div className="absolute top-4 left-4 bg-black/60 backdrop-blur-sm px-3 py-1 rounded text-xs text-red-400 font-mono border border-red-900/50 flex items-center gap-2">
                  <div className="w-2 h-2 bg-red-500 rounded-full animate-ping" />
                  LIVE
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
          
          {/* Feature 1: Emergency Contact Block */}
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
              <div className={`text-xs ${getMetricColor(metrics.weapon.score)} font-medium`}>{metrics.weapon.label}</div>
            </div>

            {/* Audio Card */}
            <div className={`${bgCard} p-4 rounded-xl border ${borderCard} shadow-sm transition-all duration-300`}>
              <div className="flex justify-between items-start mb-2">
                <span className={`${textSub} text-xs font-bold uppercase`}>Audio</span>
                <Mic className={`w-5 h-5 ${getMetricColor(metrics.audio.score)}`} />
              </div>
              <div className="text-2xl font-bold">{metrics.audio.score}</div>
              <div className={`text-xs ${getMetricColor(metrics.audio.score)} font-medium`}>{metrics.audio.label}</div>
            </div>

            {/* Pose Card */}
            <div className={`${bgCard} p-4 rounded-xl border ${borderCard} shadow-sm transition-all duration-300`}>
              <div className="flex justify-between items-start mb-2">
                <span className={`${textSub} text-xs font-bold uppercase`}>Pose</span>
                <User className={`w-5 h-5 ${getMetricColor(metrics.pose.score)}`} />
              </div>
              <div className="text-2xl font-bold">{metrics.pose.score}</div>
              <div className={`text-xs ${getMetricColor(metrics.pose.score)} font-medium`}>{metrics.pose.label}</div>
            </div>

            {/* Proximity Card */}
            <div className={`${bgCard} p-4 rounded-xl border ${borderCard} shadow-sm transition-all duration-300`}>
              <div className="flex justify-between items-start mb-2">
                <span className={`${textSub} text-xs font-bold uppercase`}>Proximity</span>
                <Users className={`w-5 h-5 ${getMetricColor(metrics.proximity.score)}`} />
              </div>
              <div className="text-2xl font-bold">{metrics.proximity.score}</div>
              <div className={`text-xs ${getMetricColor(metrics.proximity.score)} font-medium`}>{metrics.proximity.label}</div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};

export default App;