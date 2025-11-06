import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'motion/react';
import { Shield, Search, Loader2, Send, Bot, User } from 'lucide-react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Card } from './ui/card';



interface IPData {
  country?: string;
  countryCode?: string;
  region?: string;
  regionName?: string;
  city?: string;
  zip?: string;
  lat?: number;
  lon?: number;
  timezone?: string;
  isp?: string;
  org?: string;
  as?: string;
}

interface BackendResponse {
  ip: string;
  timestamp: string;
  raw_data: {
    AbuseIPDB?: any;
    VirusTotal?: any;
    Shodan?: any;
    ipapi?: IPData;
    SecurityTrails?: any;
  };
  threat_report: {
    ip: string;
    score: number;
    verdict: string;
    categories: string[];
    report_text: string;
  };
}

interface Message {
  id: string;
  type: 'user' | 'bot';
  content: string;
  timestamp: Date;
}

export function IPDetails() {
  const { ip } = useParams<{ ip: string }>();
  const navigate = useNavigate();
  const [newIp, setNewIp] = useState('');
  const [backendData, setBackendData] = useState<BackendResponse | null>(null);
  const [ipData, setIpData] = useState<IPData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [userInput, setUserInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    if (ip) {
      setMessages([]);
      fetchIPData(ip);
    }
  }, [ip]);

  const fetchIPData = async (ipAddress: string) => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`http://127.0.0.1:8000/api/lookup/${ipAddress}`);
      const data: BackendResponse = await response.json();

      if (!response.ok) throw new Error('API request failed');

      setBackendData(data);
      setIpData(data.raw_data?.ipapi || null);

      const reportText = data.threat_report?.report_text || 'No threat report generated.';
      const initialMessage: Message = {
        id: Date.now().toString(),
        type: 'bot',
        content: reportText,
        timestamp: new Date()
      };
      setMessages([initialMessage]);
    } catch (err) {
      console.error(err);
      setError('Failed to fetch API data');
      setMessages([{
        id: Date.now().toString(),
        type: 'bot',
        content: '⚠️ Failed to fetch threat intelligence data. Please ensure the backend is running.',
        timestamp: new Date()
      }]);
    } finally {
      setLoading(false);
    }
  };

  // --- BOT RESPONSE LOGIC ---
  const generateBotResponse = (userMessage: string, backend: BackendResponse | null): string => {
    if (!backend) return "No data available yet. Please search for an IP first.";

    const ipapi = backend.raw_data?.ipapi || {};
    const report = backend.threat_report || {};
    const lower = userMessage.toLowerCase();

    // Location visualization
    if (lower.includes('location') || lower.includes('map') || lower.includes('visualize')) {
      return `📊 **Location Visualization for ${backend.ip}**

The IP is located in **${ipapi.city || 'Unknown'}, ${ipapi.regionName || 'Unknown'}, ${ipapi.country || 'Unknown'}**.

🗺️ Geographic Details:
• Latitude: ${ipapi.lat?.toFixed(4) || 'Unknown'}
• Longitude: ${ipapi.lon?.toFixed(4) || 'Unknown'}
• Region: ${ipapi.regionName || 'Unknown'} (${ipapi.region || 'Unknown'})
• Country: ${ipapi.country || 'Unknown'} (${ipapi.countryCode || 'Unknown'})

This location is in the **${ipapi.timezone || 'Unknown'}** timezone.
The IP is registered to ${ipapi.org || ipapi.isp || 'Unknown ISP'}.`;
    }

    // Risk or threat summary
    if (lower.includes('risk') || lower.includes('threat') || lower.includes('score')) {
      return `🛡️ **Threat Intelligence Summary for ${backend.ip}**

Final Threat Score: **${report.score}%**
Verdict: **${report.verdict}**
Categories: ${report.categories?.length ? report.categories.join(', ') : 'None'}

${report.report_text}`;
    }

    // VirusTotal specific
    if (lower.includes('virus') || lower.includes('vt')) {
      const vt = backend.raw_data?.VirusTotal?.data?.attributes?.last_analysis_stats;
      if (!vt) return "No VirusTotal data available.";
      return `🧬 **VirusTotal Scan Summary**
Harmless: ${vt.harmless}
Malicious: ${vt.malicious}
Suspicious: ${vt.suspicious}
Undetected: ${vt.undetected}`;
    }

    // AbuseIPDB
    if (lower.includes('abuse') || lower.includes('ipdb')) {
      const abuse = backend.raw_data?.AbuseIPDB?.data;
      return abuse
        ? `🚨 **AbuseIPDB Reputation**
Abuse Confidence: ${abuse.abuseConfidenceScore || 0}%
Total Reports: ${abuse.totalReports || 0}
ISP: ${abuse.isp || 'Unknown'}`
        : "No AbuseIPDB data found.";
    }

    // Shodan
    if (lower.includes('shodan')) {
      const shodan = backend.raw_data?.Shodan || {};
      return `🧠 **Shodan Insights**
Open Ports: ${shodan.ports?.join(', ') || 'None'}
Organization: ${shodan.org || 'Unknown'}
OS: ${shodan.os || 'Unknown'}`;
    }

    // Default fallback
    return `I can help you explore intelligence about **${backend.ip}**.
Try asking:
• "Show location"
• "Show risk score"
• "Show VirusTotal data"
• "Show AbuseIPDB info"
• "Show Shodan insights"`;
  };

  // --- CHAT HANDLING ---
  const handleSendMessage = async (messageText?: string) => {
    const textToSend = messageText || userInput.trim();
    if (!textToSend) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      type: 'user',
      content: textToSend,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setUserInput('');
    setIsTyping(true);

    setTimeout(() => {
      const botResponse: Message = {
        id: (Date.now() + 1).toString(),
        type: 'bot',
        content: generateBotResponse(textToSend, backendData),
        timestamp: new Date()
      };
      setMessages(prev => [...prev, botResponse]);
      setIsTyping(false);
    }, 1000);
  };

  const handlePredefinedPrompt = (prompt: string) => handleSendMessage(prompt);

  const handleNewSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (newIp.trim()) {
      navigate(`/details/${newIp.trim()}`);
      setNewIp('');
    }
  };

  // --- UI ---
  return (
    <div className="min-h-screen bg-black text-white relative overflow-hidden">
      {/* Background grid */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#0f172a_1px,transparent_1px),linear-gradient(to_bottom,#0f172a_1px,transparent_1px)] bg-[size:4rem_4rem] opacity-20"></div>
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl"></div>
      <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl"></div>

      <div className="relative z-10">
        <header className="flex justify-end items-center p-8">
          <motion.button
            onClick={() => navigate('/')}
            className="flex items-center gap-3 cursor-pointer hover:opacity-80 transition-opacity"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6 }}
          >
            <Shield className="w-10 h-10 text-cyan-400" />
            <span className="text-xl text-cyan-400">CyberGuard</span>
          </motion.button>
        </header>

        <div className="px-8 pb-12">
          <div className="max-w-7xl mx-auto">
            <div className="grid lg:grid-cols-[1fr_400px] gap-8">
              {/* Chat Section */}
              <motion.div
                initial={{ opacity: 0, x: -30 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.6 }}
                className="flex flex-col h-[calc(100vh-180px)]"
              >
                <div className="mb-6">
                  <h1 className="text-4xl mb-2 bg-gradient-to-r from-cyan-400 to-emerald-400 bg-clip-text text-transparent">
                    IP Analysis
                  </h1>
                  <p className="text-gray-400">Ask me anything about {ip}</p>
                </div>

                <div className="flex-1 overflow-y-auto space-y-4 mb-4 pr-2 scrollbar-thin scrollbar-thumb-gray-800 scrollbar-track-transparent">
                  {loading ? (
                    <div className="flex items-center justify-center py-20">
                      <Loader2 className="w-12 h-12 text-cyan-400 animate-spin" />
                    </div>
                  ) : (
                    <>
                      {messages.map((message) => (
                        <motion.div
                          key={message.id}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ duration: 0.3 }}
                          className={`flex gap-3 ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
                        >
                          {message.type === 'bot' && (
                            <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gradient-to-r from-cyan-500 to-emerald-500 flex items-center justify-center">
                              <Bot className="w-5 h-5 text-white" />
                            </div>
                          )}
                          <div
                            className={`max-w-[80%] rounded-2xl px-4 py-3 ${
                              message.type === 'user'
                                ? 'bg-gradient-to-r from-cyan-500 to-emerald-500 text-white'
                                : 'bg-gray-900/50 border border-gray-800 text-gray-100'
                            }`}
                          >
                            <div className="whitespace-pre-line">{message.content}</div>
                          </div>
                          {message.type === 'user' && (
                            <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gray-700 flex items-center justify-center">
                              <User className="w-5 h-5 text-white" />
                            </div>
                          )}
                        </motion.div>
                      ))}
                      {isTyping && (
                        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="flex gap-3">
                          <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gradient-to-r from-cyan-500 to-emerald-500 flex items-center justify-center">
                            <Bot className="w-5 h-5 text-white" />
                          </div>
                          <div className="bg-gray-900/50 border border-gray-800 rounded-2xl px-4 py-3">
                            <div className="flex gap-1">
                              <span className="w-2 h-2 bg-gray-500 rounded-full animate-bounce"></span>
                              <span className="w-2 h-2 bg-gray-500 rounded-full animate-bounce delay-150"></span>
                              <span className="w-2 h-2 bg-gray-500 rounded-full animate-bounce delay-300"></span>
                            </div>
                          </div>
                        </motion.div>
                      )}
                      <div ref={messagesEndRef} />
                    </>
                  )}
                </div>

                {/* Input Box */}
                <div className="relative">
                  <form onSubmit={(e) => { e.preventDefault(); handleSendMessage(); }} className="relative group">
                    <div className="absolute -inset-0.5 bg-gradient-to-r from-cyan-500 to-emerald-500 rounded-lg blur opacity-20 group-focus-within:opacity-40 transition duration-300"></div>
                    <div className="relative flex gap-2">
                      <Input
                        type="text"
                        placeholder="Ask about this IP address..."
                        value={userInput}
                        onChange={(e) => setUserInput(e.target.value)}
                        className="bg-gray-900/90 border-gray-800 text-white placeholder:text-gray-500 h-12 px-4 flex-1 focus:border-cyan-500 focus:ring-cyan-500/20"
                        disabled={loading}
                      />
                      <Button
                        type="submit"
                        className="h-12 px-6 bg-gradient-to-r from-cyan-500 to-emerald-500 hover:from-cyan-600 hover:to-emerald-600 text-white border-0"
                        disabled={!userInput.trim() || loading}
                      >
                        <Send className="w-4 h-4" />
                      </Button>
                    </div>
                  </form>
                </div>
              </motion.div>

              {/* Sidebar */}
              <motion.div
                initial={{ opacity: 0, x: 30 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.6, delay: 0.2 }}
                className="lg:sticky lg:top-8 h-fit"
              >
                <Card className="bg-gray-900/50 border-gray-800 p-6">
                  <h2 className="text-xl mb-6 text-cyan-400">Lookup Another IP</h2>
                  <form onSubmit={handleNewSearch} className="space-y-4">
                    <div className="relative group">
                      <div className="absolute -inset-0.5 bg-gradient-to-r from-cyan-500 to-emerald-500 rounded-lg blur opacity-20 group-hover:opacity-40 transition duration-300"></div>
                      <div className="relative">
                        <Input
                          type="text"
                          placeholder="Enter IP Address"
                          value={newIp}
                          onChange={(e) => setNewIp(e.target.value)}
                          className="bg-gray-950/90 border-gray-700 text-white placeholder:text-gray-500 h-12 px-4 focus:border-cyan-500 focus:ring-cyan-500/20"
                        />
                      </div>
                    </div>
                    <Button
                      type="submit"
                      className="w-full h-10 bg-gradient-to-r from-cyan-500 to-emerald-500 hover:from-cyan-600 hover:to-emerald-600 text-white border-0"
                      disabled={!newIp.trim()}
                    >
                      <Search className="w-4 h-4 mr-2" /> Search
                    </Button>
                  </form>

                  <div className="mt-8 pt-6 border-t border-gray-800">
                    <p className="text-sm text-gray-500 mb-2">Current IP:</p>
                    <p className="text-cyan-400 font-mono mb-4">{ip}</p>

                    <div className="space-y-2">
                      <p className="text-sm text-gray-500 mb-3">Quick Actions:</p>
                      <Button
                        onClick={() => handlePredefinedPrompt('Visualize location')}
                        className="w-full bg-gray-800 text-white border border-gray-700 hover:border-cyan-500/50 transition-colors"
                        disabled={loading}
                      >
                        📊 Visualize
                      </Button>
                      <Button
                        onClick={() => handlePredefinedPrompt('Show risk score')}
                        className="w-full bg-gray-800 text-white border border-gray-700 hover:border-cyan-500/50 transition-colors"
                        disabled={loading}
                      >
                        🛡️ Risk Score
                      </Button>
                    </div>
                  </div>
                </Card>
              </motion.div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
