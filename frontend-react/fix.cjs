const fs = require('fs');

const filePath = 's:/UrbanPulseV3/UrbanPulseV2/frontend-react/src/pages/SafeRoute.jsx';
let content = fs.readFileSync(filePath, 'utf8');

content = content.replace("bindPopup('ðŸ“  Start')", "bindPopup('<div style=\"display:flex;align-items:center;gap:4px\"><svg width=\"14\" height=\"14\" viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\"><path d=\"M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z\"/><circle cx=\"12\" cy=\"10\" r=\"3\"/></svg> Start</div>')");
content = content.replace("bindPopup('ðŸŽ¯ Destination')", "bindPopup('<div style=\"display:flex;align-items:center;gap:4px\"><svg width=\"14\" height=\"14\" viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\"><path d=\"M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z\"/><line x1=\"4\" y1=\"22\" x2=\"4\" y2=\"15\"/></svg> Destination</div>')");
content = content.replace("bindPopup(`âš ï¸  ${(h.issue_type || 'hazard').replace('_', ' ')}`)", "bindPopup(`<div style=\"display:flex;align-items:center;gap:4px\"><svg width=\"14\" height=\"14\" viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\"><path d=\"m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z\"/><path d=\"M12 9v4\"/><path d=\"M12 17h.01\"/></svg> ${(h.issue_type || 'hazard').replace('_', ' ')}</div>`)");

content = content.replace("tips = { woman: ['ðŸ“± Share live location with trusted contact', 'ðŸ’¡ Stay on well-lit roads', 'ðŸš¶ Walk confidently', 'ðŸ“ž Emergency: 1091'], student: ['ðŸ‘¥ Travel in groups', 'ðŸšŒ Use public transport', 'ðŸ“± Inform someone of route', 'â ° Avoid late night travel alone'], elderly: ['ðŸšŒ Prefer main roads', 'ðŸ‘¥ Travel during peak hours', 'ðŸ ¥ Note hospitals en-route', 'ðŸ“± Keep family informed'] };", 
"tips = { woman: ['Share live location with trusted contact', 'Stay on well-lit roads', 'Walk confidently', 'Emergency: 1091'], student: ['Travel in groups', 'Use public transport', 'Inform someone of route', 'Avoid late night travel alone'], elderly: ['Prefer main roads', 'Travel during peak hours', 'Note hospitals en-route', 'Keep family informed'] };");

content = content.replace("<div>\n          <div className=\"font-display text-[1.2rem] font-extrabold mb-1\">ðŸ›¡ï¸  Safe Route AI</div>", "<div>\n          <div className=\"font-display text-[1.2rem] font-extrabold mb-1 flex items-center gap-2\"><Shield className=\"text-cyan w-5 h-5\"/> Safe Route AI</div>");

content = content.replace("{[{ id: 'woman', icon: 'ðŸ‘©', label: 'Woman' }, { id: 'student', icon: 'ðŸŽ’', label: 'Student' }, { id: 'elderly', icon: 'ðŸ‘´', label: 'Elderly' }].map((p) => (", 
"{[{ id: 'woman', icon: <User className=\"mx-auto mb-1 w-6 h-6\"/>, label: 'Woman' }, { id: 'student', icon: <GraduationCap className=\"mx-auto mb-1 w-6 h-6\"/>, label: 'Student' }, { id: 'elderly', icon: <Users className=\"mx-auto mb-1 w-6 h-6\"/>, label: 'Elderly' }].map((p) => (");

content = content.replace("<span className=\"text-[1.5rem] block mb-1\">{p.icon}</span>{p.label}", "{p.icon}{p.label}");

content = content.replace("className={`p-2 rounded-[10px] border text-[0.8rem] font-semibold cursor-pointer text-center transition-all ${profile === p.id ? 'bg-[rgba(0,212,255,0.1)] border-cyan text-cyan' : 'bg-[rgba(255,255,255,0.02)] border-border text-text2 hover:border-cyan hover:text-text'}`}", 
"className={`p-2 rounded-[10px] border text-[0.8rem] font-semibold cursor-pointer text-center transition-all flex flex-col items-center justify-center ${profile === p.id ? 'bg-[rgba(0,212,255,0.1)] border-cyan text-cyan' : 'bg-[rgba(255,255,255,0.02)] border-border text-text2 hover:border-cyan hover:text-text'}`}");


content = content.replace("{[{ id: 'day', label: 'â˜€ï¸  Day' }, { id: 'evening', label: 'ðŸŒ† Evening' }, { id: 'night', label: 'ðŸŒ™ Night' }].map((t) => (",
"{[{ id: 'day', label: 'Day', icon: <Sun className=\"w-4 h-4 mr-1.5\"/> }, { id: 'evening', label: 'Evening', icon: <Sunset className=\"w-4 h-4 mr-1.5\"/> }, { id: 'night', label: 'Night', icon: <Moon className=\"w-4 h-4 mr-1.5\"/> }].map((t) => (");

content = content.replace("className={`flex-1 p-2 rounded-lg border text-[0.78rem] font-semibold cursor-pointer transition-all ${timeOfDay === t.id ? 'bg-[rgba(139,92,246,0.1)] border-purple text-purple' : 'bg-transparent border-border text-text2'}`}",
"className={`flex-1 p-2 rounded-lg border text-[0.78rem] font-semibold cursor-pointer transition-all flex items-center justify-center ${timeOfDay === t.id ? 'bg-[rgba(139,92,246,0.1)] border-purple text-purple' : 'bg-transparent border-border text-text2'}`}");

content = content.replace("onClick={() => setTimeOfDay(t.id)}>\n                {t.label}\n              </button>", 
"onClick={() => setTimeOfDay(t.id)}>\n                {t.icon}{t.label}\n              </button>");

content = content.replace("<label className=\"form-label\">ðŸ“  Current Location</label>", "<label className=\"form-label flex items-center gap-1.5\"><MapPin className=\"w-4 h-4\"/> Current Location</label>");
content = content.replace("<label className=\"form-label\">ðŸŽ¯ Destination</label>", "<label className=\"form-label flex items-center gap-1.5\"><Flag className=\"w-4 h-4\"/> Destination</label>");

content = content.replace("onClick={analyzeRoutes} disabled={status === 'analyzing'}>\n          ðŸ”  Find Safe Route\n        </button>", "onClick={analyzeRoutes} disabled={status === 'analyzing'} className=\"btn btn-primary w-full flex items-center justify-center gap-2\">\n          <Navigation className=\"w-4 h-4\"/> Find Safe Route\n        </button>");

content = content.replace("<div className=\"bg-[rgba(255,61,90,0.08)] border border-[rgba(255,61,90,0.2)] rounded-xl p-4 text-[0.85rem] text-red\">\n            âš ï¸  {error}\n          </div>", "<div className=\"bg-[rgba(255,61,90,0.08)] border border-[rgba(255,61,90,0.2)] rounded-xl p-4 text-[0.85rem] text-red flex items-start gap-2\">\n            <AlertTriangle className=\"w-4 h-4 shrink-0 mt-0.5\"/> {error}\n          </div>");

content = content.replace("<div className=\"bg-[rgba(255,255,255,0.04)] border border-border rounded-xl p-3 text-[0.8rem] text-text2\">\n                â„¹ï¸  Only one route was returned by the routing service.\n              </div>", "<div className=\"bg-[rgba(255,255,255,0.04)] border border-border rounded-xl p-3 text-[0.8rem] text-text2 flex items-start gap-2\">\n                <Info className=\"w-4 h-4 shrink-0 mt-0.5\"/> Only one route was returned by the routing service.\n              </div>");

content = content.replace("<div className=\"mt-2.5 p-2 rounded-lg text-[0.75rem]\" style={{ backgroundColor: `${c}14`, color: c }}>\n                      âš ï¸  {route.hazardCount} reported hazard{route.hazardCount > 1 ? 's' : ''} within 150 m â€” lower reported risk than other options\n                    </div>", 
"<div className=\"mt-2.5 p-2 rounded-lg text-[0.75rem] flex items-start gap-1.5\" style={{ backgroundColor: `${c}14`, color: c }}>\n                      <AlertTriangle className=\"w-3.5 h-3.5 shrink-0 mt-0.5\"/> {route.hazardCount} reported hazard{route.hazardCount > 1 ? 's' : ''} within 150 m — lower reported risk than other options\n                    </div>");

content = content.replace("<div className=\"mt-2.5 p-2 bg-[rgba(16,212,142,0.08)] rounded-lg text-[0.75rem] text-green\">\n                      âœ… No UrbanPulse hazard reports near this route\n                    </div>", "<div className=\"mt-2.5 p-2 bg-[rgba(16,212,142,0.08)] rounded-lg text-[0.75rem] text-green flex items-start gap-1.5\">\n                      <CheckCircle className=\"w-3.5 h-3.5 shrink-0 mt-0.5\"/> No UrbanPulse hazard reports near this route\n                    </div>");


content = content.replace("<div className=\"text-[0.72rem] text-text3 border border-border rounded-xl p-3\">\n              â“˜ Risk scores are based on UrbanPulse reported incidents within 150 m of each route.\n              Absence of reports does not guarantee safety. Exercise personal judgement.\n              {nightPenalty > 0 && ` Night/evening penalty of +${nightPenalty} applied.`}\n            </div>", "<div className=\"text-[0.72rem] text-text3 border border-border rounded-xl p-3 flex items-start gap-2\">\n              <Info className=\"w-4 h-4 shrink-0 mt-0.5\"/>\n              <div>\n                Risk scores are based on UrbanPulse reported incidents within 150 m of each route.\n                Absence of reports does not guarantee safety. Exercise personal judgement.\n                {nightPenalty > 0 && ` Night/evening penalty of +${nightPenalty} applied.`}\n              </div>\n            </div>");

content = content.replace("<div className=\"font-bold mb-3\">ðŸ›¡ï¸  Safety Tips for You</div>", "<div className=\"font-bold mb-3 flex items-center gap-1.5\"><Shield className=\"w-4 h-4 text-cyan\"/> Safety Tips for You</div>");

content = content.replace("<div key={i} className=\"text-[0.82rem] py-1.5 border-b border-border last:border-none\">{t}</div>", "<div key={i} className=\"text-[0.82rem] py-1.5 border-b border-border last:border-none flex items-start gap-2\"><Check className=\"w-3.5 h-3.5 shrink-0 mt-0.5 text-cyan\"/> {t}</div>");

fs.writeFileSync(filePath, content, 'utf8');
console.log('Done');
