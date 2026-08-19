import { useState, useRef, useEffect } from 'react';
import Sidebar from '../components/Sidebar';

const Copilot = () => {
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState([
    {
      id: 1,
      sender: 'ai',
      html: `<div class="font-bold mb-2 flex items-center gap-1.5">✨ URBANPULSE COMMAND COPILOT ONLINE</div>Welcome Commissioner <strong>Rachel Chen</strong>. I am connected directly to the Delhi NCR real-time sensory grid. I can help compute priorities, predict hazard growth patterns, suggest 1-2-3 remediation plans, and analyze overall safety scores.<br><br>Select a standard intelligence directive below or input a custom telemetry inquiry.`,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
    }
  ]);
  
  const chatRef = useRef(null);

  useEffect(() => {
    if (chatRef.current) {
      chatRef.current.scrollTop = chatRef.current.scrollHeight;
    }
  }, [messages]);

  const sendPrompt = (text) => {
    setInput(text);
    handleSend(text);
  };

  const handleSend = (textToSend = input) => {
    if (!textToSend.trim()) return;

    const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    setMessages(prev => [...prev, { id: Date.now(), sender: 'user', text: textToSend, time: timeStr }]);
    setInput('');

    setTimeout(() => {
      let html = '';
      if (textToSend.includes('improve')) {
        html = `<div class="font-bold mb-2 uppercase">Executive Summary: City Safety Operations</div>To maximize the overall city safety score, resources must be immediately diverted to mitigate critical and moderate risks in declining sectors, followed by preventive telemetry adjustments in high-performing areas.<br><br>---<br><br><div class="font-bold mb-1">PRIORITY 1: CRITICAL INTERVENTION ZONE — CONNAUGHT PLACE</div><ul class="ml-5 mb-2 list-disc"><li>Current Safety Score: <strong>44</strong> <span class="text-red">(Status: Critical | Trend: Declining)</span></li><li>Recommended Action: Dispatch 2 heavy clearance units and 1 electrical crew to clear the major pothole craters and fix the broken streetlights immediately.</li></ul>`;
      } else if (textToSend.includes('safest')) {
        html = `<div class="font-bold mb-2 uppercase">HIGH-SAFETY ZONES (REFERENCE)</div><strong>DLF Cyber City</strong> is the safest area today, boasting a peak Safety Score of <strong>94</strong> and 0 active hazards detected.<br><br><div class="font-bold mb-1 mt-2.5">SAFEST ZONES OVERVIEW</div><ul class="ml-5 list-disc"><li><strong>DLF Cyber City (Rank 1)</strong></li><li>Safety Score: 94 (Trend: Improving)</li><li>Risk Level: <span class="text-green">Safe</span></li></ul>`;
      } else {
        html = `I am currently analyzing live telemetry for your request: "${textToSend}".<br><br>Based on current logs, Connaught Place requires immediate attention due to multiple infrastructure hazards. Dispatching a team there will yield the highest improvement in overall city safety metrics.`;
      }

      setMessages(prev => [...prev, {
        id: Date.now() + 1,
        sender: 'ai',
        html,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
      }]);
    }, 1000);
  };

  return (
    <div className="grid md:grid-cols-[240px_1fr] min-h-[calc(100vh-var(--nav-h))] mt-[var(--nav-h)]">
      <Sidebar />
      <div className="p-7 overflow-y-auto h-[calc(100vh-var(--nav-h))]">
        <div className="mb-5">
          <h1 className="text-[1.6rem] flex items-center gap-2.5 font-display font-extrabold tracking-tight">
            <span className="text-red text-base">●</span> Delhi NCR Municipal Command Terminal
          </h1>
          <p className="text-text2">Predictive Infrastructure Dispatch Deck</p>
        </div>

        <div className="grid lg:grid-cols-[380px_1fr] gap-6 h-[calc(100%-80px)]">
          {/* Left Column */}
          <div className="flex flex-col gap-5">
            <div className="card p-6 pb-5">
              <div className="font-display text-[1.1rem] font-extrabold mb-3 uppercase tracking-wider">
                Standard Command Directives
              </div>
              <p className="text-[0.85rem] text-text2 mb-5">Select one of the structured prompts mapped for your current officer security clearance:</p>

              {[
                { title: "Which area should be prioritized today?", sub: "Identifies top density risk hotspots" },
                { title: "What is the highest risk area?", sub: "Calculates the lowest safety index grids" },
                { title: "Which issue category is growing fastest?", sub: "Tracks weekly growth of road vs waste logs" },
                { title: "How can I improve the city's safety score?", sub: "Gives actionable remediation dispatches" }
              ].map((dir, i) => (
                <div key={i} onClick={() => sendPrompt(dir.title)} className="bg-[rgba(255,255,255,0.02)] border border-border rounded-xl p-4 mb-3 cursor-pointer transition-all duration-200 flex items-center justify-between hover:bg-[rgba(0,212,255,0.04)] hover:border-[rgba(0,212,255,0.25)] hover:translate-x-0.5 group">
                  <div>
                    <div className="font-bold text-[0.9rem] text-text mb-1">{dir.title}</div>
                    <div className="text-[0.75rem] text-text2">{dir.sub}</div>
                  </div>
                  <div className="text-text3 group-hover:text-cyan transition-colors">›</div>
                </div>
              ))}
              
              <div className="text-[0.75rem] text-text3 mt-4 flex items-center gap-2">
                <span>🔒 Full compliance protocols active.</span>
              </div>
            </div>

            <div className="card p-5">
              <div className="text-[0.8rem] font-bold text-text2 mb-4 flex items-center gap-2 uppercase tracking-wider">
                ⓘ System Context Parameters
              </div>
              <div className="flex justify-between mb-3 text-[0.85rem]">
                <span className="text-text2">System core</span>
                <span className="font-bold">Gemini 3.5 Flash</span>
              </div>
              <div className="flex justify-between mb-3 text-[0.85rem]">
                <span className="text-text2">Database Engine</span>
                <span className="font-bold">In-Memory (NCR Sync)</span>
              </div>
              <div className="flex justify-between text-[0.85rem]">
                <span className="text-text2">Backlog Indexing</span>
                <span className="font-bold text-cyan">Active (Auto-Rebuild)</span>
              </div>
            </div>
          </div>

          {/* Right Column */}
          <div className="flex flex-col h-full border border-border rounded-[var(--r)] bg-bg-card overflow-hidden">
            <div className="px-5 py-4 border-b border-border bg-[rgba(0,212,255,0.03)] flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2.5 font-bold font-display text-[1.05rem]">
                  COPILOT INTERACTIVE CONSOLE
                </div>
                <div className="text-[0.75rem] text-text2 mt-0.5">Authority Channel: officer@urbanpulse.gov</div>
              </div>
              <div className="text-[0.7rem] font-bold text-[#4285F4] bg-[rgba(66,133,244,0.1)] px-2.5 py-1 rounded-[20px] flex items-center gap-1.5 border border-[rgba(66,133,244,0.2)]">
                ✨ Gemini Powered
              </div>
            </div>

            <div className="flex-1 p-5 overflow-y-auto flex flex-col gap-5 bg-bg" ref={chatRef}>
              {messages.map(m => (
                <div key={m.id} className={`flex flex-col max-w-[85%] ${m.sender === 'user' ? 'self-end' : 'self-start'}`}>
                  <div className={`px-4 py-3.5 rounded-2xl text-[0.9rem] leading-relaxed ${m.sender === 'user' ? 'bg-[#1a42f5] text-white rounded-br-sm' : 'bg-bg-card border border-border rounded-bl-sm text-text'}`}
                       dangerouslySetInnerHTML={m.html ? { __html: m.html } : undefined}>
                    {m.text}
                  </div>
                  <div className={`text-[0.65rem] text-text3 mt-1.5 ${m.sender === 'user' ? 'text-right' : 'text-left'}`}>
                    {m.time}
                  </div>
                </div>
              ))}
            </div>

            <div className="p-4 bg-bg-card border-t border-border">
              <div className="flex items-center gap-3 bg-bg border border-border rounded-full p-1.5 pl-5 focus-within:border-cyan focus-within:shadow-[0_0_0_3px_rgba(0,212,255,0.08)] transition-all">
                <input 
                  type="text" 
                  className="flex-1 bg-transparent border-none text-text font-sans text-[0.95rem] outline-none"
                  placeholder="Ask Copilot: 'Why is my area unsafe?', 'What actions should be prioritized?'..."
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSend()}
                />
                <button 
                  className="w-9 h-9 rounded-full bg-bg-card2 border border-border text-text2 flex items-center justify-center cursor-pointer transition-all hover:bg-cyan hover:text-black hover:border-cyan"
                  onClick={() => handleSend()}
                >
                  ➤
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Copilot;
