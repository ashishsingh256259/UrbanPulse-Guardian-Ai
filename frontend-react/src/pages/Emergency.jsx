import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import { useAuth } from '../contexts/AuthContext';

const Emergency = () => {
  const { user, isMunicipal } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!user) {
      navigate('/login');
    }
  }, [user, navigate]);
  const [location, setLocation] = useState('');
  const [category, setCategory] = useState('Road Accident');
  const [hub, setHub] = useState('Max Super Speciality');
  const [identity, setIdentity] = useState('');
  
  const [dispatchStatus, setDispatchStatus] = useState('idle'); // idle, dispatching, success

  const handleLaunch = () => {
    if (!location) {
      alert('Please enter a target patient location');
      return;
    }
    
    setDispatchStatus('dispatching');
    
    setTimeout(() => {
      setDispatchStatus('success');
      // Show toast ideally here
      
      setTimeout(() => {
        setDispatchStatus('idle');
        setLocation('');
        setIdentity('');
      }, 4000);
    }, 1500);
  };

  return (
    <div className={`grid ${isMunicipal ? 'md:grid-cols-[240px_1fr]' : 'grid-cols-1'} min-h-[calc(100vh-var(--nav-h))] mt-[var(--nav-h)]`}>
      <Sidebar />
      <div className="p-7 overflow-y-auto">
        <div className="mb-5">
          <h1 className="text-[1.6rem] flex items-center gap-2.5 font-display font-extrabold tracking-tight">
            <span className="text-red text-base">●</span> Delhi NCR Municipal Command Terminal
          </h1>
          <p className="text-text2">Predictive Infrastructure Dispatch Deck</p>
        </div>

        <div className="bg-gradient-to-r from-[rgba(255,61,90,0.1)] to-transparent border border-[rgba(255,61,90,0.2)] border-l-4 border-l-red p-6 rounded-[var(--r)] mb-6 flex justify-between items-center">
          <div>
            <div className="text-[0.75rem] font-bold text-red tracking-widest mb-1.5 uppercase">›› Dispatch Matrix: Active</div>
            <div className="font-display text-[1.4rem] font-extrabold mb-1.5">Emergency Response & SOS Paramedics Control</div>
            <div className="text-text2 text-[0.9rem] max-w-[600px]">Automated ambulance routing, real-time hospital bed triage coordinates, and citizen panic dispatch triggers. Enter location coordinates to track live paramedic ambulance units with traffic signal pre-alignments instantly.</div>
          </div>
          <div className="flex gap-10 text-right">
            <div>
              <div className="text-[0.7rem] font-bold text-text3 tracking-wider mb-1.5">TRAUMA RESPONSE RATE</div>
              <div className="font-display text-[2rem] font-extrabold text-red leading-none">4.2 <span className="text-base text-text2">Mins</span></div>
            </div>
            <div>
              <div className="text-[0.7rem] font-bold text-text3 tracking-wider mb-1.5">ACTIVE PARAMEDIC NODES</div>
              <div className="font-display text-[2rem] font-extrabold text-cyan leading-none">14 <span className="text-base text-text2">Units</span></div>
            </div>
          </div>
        </div>

        <div className="grid lg:grid-cols-2 gap-6">
          {/* Left: SOS Dispatch Form */}
          <div className="bg-bg-card border border-border rounded-[var(--r)] p-8 relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-1 bg-red"></div>
            
            <div className="flex justify-between items-center mb-6">
              <div className="font-display text-[1.1rem] font-extrabold flex items-center gap-2.5">
                <span className="text-red">●</span> SOS Paramedic Panic Dispatch
              </div>
              <div className="text-[0.75rem] font-bold text-text3 tracking-wider">STEP 0 OF 4</div>
            </div>
            
            <p className="text-[0.85rem] text-text2 mb-6">
              Initiate immediate crisis rescue. This triggers pre-emptive signal overrides and designates the nearest trauma center automatically.
            </p>

            <div className="form-group">
              <label className="form-label">Target Patient Location</label>
              <input 
                type="text" 
                className="form-input" 
                placeholder="e.g. Connaught Place Building 4, or Noida Expressway Toll"
                value={location}
                onChange={e => setLocation(e.target.value)}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="form-group">
                <label className="form-label">Trauma Emergency Category</label>
                <select className="form-select" value={category} onChange={e => setCategory(e.target.value)}>
                  <option value="Road Accident">Road Accident</option>
                  <option value="Cardiac Arrest">Cardiac Arrest</option>
                  <option value="Severe Burns">Severe Burns</option>
                  <option value="Other">Other Trauma</option>
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Priority Trauma Hub</label>
                <select className="form-select" value={hub} onChange={e => setHub(e.target.value)}>
                  <option value="Max Super Speciality">Max Super Speciality</option>
                  <option value="AIIMS Delhi">AIIMS Delhi</option>
                  <option value="Apollo Hospitals">Apollo Hospitals</option>
                  <option value="Fortis Escorts">Fortis Escorts</option>
                </select>
              </div>
            </div>

            <div className="form-group mb-8">
              <label className="form-label">Patient Identity (Optional)</label>
              <input 
                type="text" 
                className="form-input" 
                placeholder="e.g. Ashish Kumar, or Unidentified Female (~40)"
                value={identity}
                onChange={e => setIdentity(e.target.value)}
              />
            </div>

            <button 
              className={`w-full py-4 rounded-xl font-display text-[1.1rem] font-extrabold uppercase tracking-wider flex items-center justify-center gap-3 transition-all duration-200 text-white border-none cursor-pointer
                ${dispatchStatus === 'idle' ? 'bg-gradient-to-br from-[#ff1a38] to-[#c70019] shadow-[0_4px_20px_rgba(255,61,90,0.3)] hover:-translate-y-0.5 hover:shadow-[0_8px_30px_rgba(255,61,90,0.5)]' 
                : dispatchStatus === 'dispatching' ? 'bg-gradient-to-br from-[#ff1a38] to-[#c70019] opacity-80 cursor-wait'
                : 'bg-green shadow-[0_4px_20px_rgba(16,212,142,0.3)]'}`}
              onClick={handleLaunch}
              disabled={dispatchStatus !== 'idle'}
            >
              {dispatchStatus === 'idle' && <>⚠️ LAUNCH EMERGENCY MEDIC DETOUR</>}
              {dispatchStatus === 'dispatching' && <>
                <div className="w-6 h-6 border-2 border-[rgba(255,255,255,0.3)] border-t-white rounded-full animate-spin"></div>
                DISPATCHING UNITS...
              </>}
              {dispatchStatus === 'success' && <>✅ MEDIC DETOUR LAUNCHED</>}
            </button>
          </div>

          {/* Right: Telemetry & Blockages */}
          <div className="flex flex-col gap-6">
            <div className="card p-6">
              <div className="text-[0.75rem] font-bold text-text3 tracking-wider mb-4 uppercase">
                Active Blockages & Cleansing Dispatcher Desk
              </div>
              
              <div className="bg-bg border border-border rounded-xl p-4 mb-3 flex justify-between items-center hover:border-[rgba(255,61,90,0.3)] transition-colors">
                <div>
                  <div className="font-bold text-[0.9rem] flex items-center gap-2 mb-1">
                    📍 Outer Circle Connaught Place Entry <span className="badge badge-critical text-[0.6rem]">SEVERE RISK</span>
                  </div>
                  <div className="text-[0.75rem] text-text2">Major Pothole crater on Center lane, dispatcher reviewing</div>
                </div>
                <button className="bg-bg-card border border-red text-red px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap hover:bg-[rgba(255,61,90,0.1)] transition-colors">Dispatch Cleansing Crew</button>
              </div>
              
              <div className="bg-bg border border-border rounded-xl p-4 flex justify-between items-center hover:border-[rgba(255,61,90,0.3)] transition-colors">
                <div>
                  <div className="font-bold text-[0.9rem] flex items-center gap-2 mb-1">
                    📍 Noida Sector 62 Underpass Side Way <span className="badge badge-high text-[0.6rem]">MODERATE RISK</span>
                  </div>
                  <div className="text-[0.75rem] text-text2">Complete Blackout. Cable harness burnout under inspection</div>
                </div>
                <button className="bg-bg-card border border-red text-red px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap hover:bg-[rgba(255,61,90,0.1)] transition-colors">Dispatch Cleansing Crew</button>
              </div>
            </div>

            <div className="card p-6">
              <div className="text-[0.75rem] font-bold text-text3 tracking-wider mb-4 uppercase">
                Delhi Trauma & Hospital Live Capacity Telemetry
              </div>
              
              <div className="flex items-center justify-between py-4 border-b border-border">
                <div>
                  <div className="font-bold text-[0.95rem] mb-1 flex items-center gap-2">
                    <span className="text-red">❤</span> Max Super Speciality Hospital, Saket 
                    <span className="text-[0.65rem] text-green font-bold ml-auto tracking-wider">ACCEPTING TRIAGE</span>
                  </div>
                  <div className="text-[0.75rem] text-text2 flex gap-4">
                    <span>GPS SPATIAL: 4.1 km away</span>
                    <span>DISPATCH ROADTIME: ~ 6 mins</span>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-[0.65rem] font-bold text-text3 tracking-wider">BED CAPACITIES:</div>
                  <div className="font-display text-[1.2rem] font-extrabold text-green">
                    027 <span className="text-[0.8rem] text-text2 font-sans font-normal">Beds Vacant</span>
                  </div>
                </div>
              </div>
              
              <div className="flex items-center justify-between py-4">
                <div>
                  <div className="font-bold text-[0.95rem] mb-1 flex items-center gap-2">
                    <span className="text-red">❤</span> AIIMS Trauma Centre 
                    <span className="text-[0.65rem] text-yellow font-bold ml-auto tracking-wider">HEAVY LOAD</span>
                  </div>
                  <div className="text-[0.75rem] text-text2 flex gap-4">
                    <span>GPS SPATIAL: 7.3 km away</span>
                    <span>DISPATCH ROADTIME: ~ 14 mins</span>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-[0.65rem] font-bold text-text3 tracking-wider">BED CAPACITIES:</div>
                  <div className="font-display text-[1.2rem] font-extrabold text-yellow">
                    004 <span className="text-[0.8rem] text-text2 font-sans font-normal">Beds Vacant</span>
                  </div>
                </div>
              </div>

            </div>
          </div>

        </div>
      </div>
    </div>
  );
};

export default Emergency;
