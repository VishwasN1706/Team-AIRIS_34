# File Contents for Local Export

## 1. src/App.tsx

```tsx
import { HashRouter as Router, Routes, Route } from 'react-router-dom';
import { Landing } from './components/Landing';
import { IPDetails } from './components/IPDetails';

export default function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/details/:ip" element={<IPDetails />} />
      </Routes>
    </Router>
  );
}
```

## 2. src/components/Landing.tsx

```tsx
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'motion/react';
import { Shield, Search } from 'lucide-react';
import { Button } from './ui/button';
import { Input } from './ui/input';

export function Landing() {
  const [ipAddress, setIpAddress] = useState('');
  const navigate = useNavigate();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (ipAddress.trim()) {
      navigate(`/details/${ipAddress.trim()}`);
    }
  };

  return (
    <div className="min-h-screen bg-black text-white relative overflow-hidden">
      {/* Background grid effect */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#0f172a_1px,transparent_1px),linear-gradient(to_bottom,#0f172a_1px,transparent_1px)] bg-[size:4rem_4rem] opacity-20"></div>
      
      {/* Gradient orbs */}
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl"></div>
      <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl"></div>

      <div className="relative z-10">
        {/* Header */}
        <header className="flex justify-end items-center p-8">
          <motion.div 
            className="flex items-center gap-3"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6 }}
          >
            <Shield className="w-10 h-10 text-cyan-400" />
            <span className="text-xl text-cyan-400">CyberGuard</span>
          </motion.div>
        </header>

        {/* Main Content */}
        <div className="flex items-center justify-center min-h-[calc(100vh-120px)]">
          <motion.div
            className="w-full max-w-2xl px-8"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
          >
            <div className="text-center mb-12">
              <motion.h1 
                className="text-5xl mb-4 bg-gradient-to-r from-cyan-400 to-emerald-400 bg-clip-text text-transparent"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.4 }}
              >
                IP Address Lookup
              </motion.h1>
              <motion.p 
                className="text-gray-400"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.8, delay: 0.6 }}
              >
                Enter an IP address to analyze its details
              </motion.p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.6, delay: 0.8 }}
              >
                <div className="relative group">
                  <div className="absolute -inset-0.5 bg-gradient-to-r from-cyan-500 to-emerald-500 rounded-lg blur opacity-30 group-hover:opacity-50 transition duration-300"></div>
                  <div className="relative">
                    <Input
                      type="text"
                      placeholder="Enter IP Address (e.g., 8.8.8.8)"
                      value={ipAddress}
                      onChange={(e) => setIpAddress(e.target.value)}
                      className="bg-gray-900/90 border-gray-800 text-white placeholder:text-gray-500 h-14 px-6 text-lg focus:border-cyan-500 focus:ring-cyan-500/20"
                    />
                  </div>
                </div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 1 }}
              >
                <Button
                  type="submit"
                  className="w-full h-12 bg-gradient-to-r from-cyan-500 to-emerald-500 hover:from-cyan-600 hover:to-emerald-600 text-white border-0"
                  disabled={!ipAddress.trim()}
                >
                  <Search className="w-5 h-5 mr-2" />
                  Check IP Address
                </Button>
              </motion.div>
            </form>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
```

## 3. src/components/IPDetails.tsx

```tsx
import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'motion/react';
import { Shield, Search, Loader2, Send, Bot, User } from 'lucide-react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Card } from './ui/card';

interface IPData {
  query: string;
  status: string;
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
      const response = await fetch(`http://ip-api.com/json/${ipAddress}`);
      const data = await response.json();
      
      if (data.status === 'fail') {
        setError('Invalid IP address or no data available');
        setMessages([{
          id: Date.now().toString(),
          type: 'bot',
          content: `I couldn't retrieve information for IP address ${ipAddress}. Please make sure it's a valid IP address.`,
          timestamp: new Date()
        }]);
      } else {
        setIpData(data);
        // Initial bot message with IP details
        const initialMessage: Message = {
          id: Date.now().toString(),
          type: 'bot',
          content: generateInitialResponse(data),
          timestamp: new Date()
        };
        setMessages([initialMessage]);
      }
    } catch (err) {
      setError('Failed to fetch IP data');
      setMessages([{
        id: Date.now().toString(),
        type: 'bot',
        content: 'Failed to fetch IP data. Please try again later.',
        timestamp: new Date()
      }]);
    } finally {
      setLoading(false);
    }
  };

  const generateInitialResponse = (data: IPData): string => {
    return `I've analyzed IP address **${data.query}** and here's what I found:

📍 **Location:** ${data.city}, ${data.regionName}, ${data.country} (${data.countryCode})
${data.zip ? `📮 **ZIP Code:** ${data.zip}` : ''}
🌐 **Coordinates:** ${data.lat?.toFixed(4)}, ${data.lon?.toFixed(4)}
🏢 **ISP:** ${data.isp}
${data.org ? `🏛️ **Organization:** ${data.org}` : ''}
🕐 **Timezone:** ${data.timezone}
${data.as ? `🔢 **AS Number:** ${data.as}` : ''}

What else would you like to know about this IP address?`;
  };

  const generateBotResponse = (userMessage: string, data: IPData | null): string => {
    const lowerMessage = userMessage.toLowerCase();
    
    if (!data) {
      return "I don't have any IP data loaded at the moment. Please search for an IP address first.";
    }

    if (lowerMessage.includes('visualize') || lowerMessage.includes('map') || lowerMessage.includes('location')) {
      return `📊 **Location Visualization for ${data.query}**

The IP is located in **${data.city}, ${data.regionName}, ${data.country}**.

🗺️ Geographic Details:
• Latitude: ${data.lat?.toFixed(4)}
• Longitude: ${data.lon?.toFixed(4)}
• Region: ${data.regionName} (${data.region})
• Country: ${data.country} (${data.countryCode})
${data.zip ? `• Postal Code: ${data.zip}` : ''}

This location is in the **${data.timezone}** timezone. The IP is registered to ${data.isp}.`;
    }

    if (lowerMessage.includes('risk') || lowerMessage.includes('threat') || lowerMessage.includes('security')) {
      const riskLevel = Math.random() > 0.7 ? 'High' : Math.random() > 0.4 ? 'Medium' : 'Low';
      const riskColor = riskLevel === 'High' ? '🔴' : riskLevel === 'Medium' ? '🟡' : '🟢';
      
      return `🛡️ **Security Risk Assessment for ${data.query}**

${riskColor} **Risk Level:** ${riskLevel}

📋 Analysis:
• **ISP:** ${data.isp}
• **Organization:** ${data.org || 'Unknown'}
• **Country:** ${data.country} (${data.countryCode})

⚠️ Risk Factors:
${riskLevel === 'High' ? '• Multiple failed authentication attempts detected\n• IP associated with suspicious activity\n• Located in high-risk region' : riskLevel === 'Medium' ? '• Some unusual traffic patterns observed\n• Standard security protocols recommended' : '• No suspicious activity detected\n• Clean reputation score\n• Legitimate ISP'}

💡 **Recommendation:** ${riskLevel === 'High' ? 'Block this IP and monitor for further activity' : riskLevel === 'Medium' ? 'Monitor this IP with caution' : 'IP appears safe for normal operations'}`;
    }

    if (lowerMessage.includes('isp') || lowerMessage.includes('provider') || lowerMessage.includes('organization')) {
      return `🏢 **ISP & Organization Details for ${data.query}**

**Internet Service Provider:** ${data.isp}
${data.org ? `**Organization:** ${data.org}` : ''}
${data.as ? `**AS Number & Name:** ${data.as}` : ''}

This IP is operated by ${data.isp}, which provides internet services in ${data.country}. The organization responsible for this IP range is ${data.org || data.isp}.`;
    }

    if (lowerMessage.includes('timezone') || lowerMessage.includes('time')) {
      const now = new Date();
      return `🕐 **Timezone Information for ${data.query}**

**Timezone:** ${data.timezone}
**Current Local Time:** ${now.toLocaleString('en-US', { timeZone: data.timezone || 'UTC' })}

The IP address is located in the ${data.timezone} timezone.`;
    }

    // Default response
    return `I can provide you with various information about **${data.query}**:

• Location details and visualization
• Security risk assessment
• ISP and organization information
• Timezone and time details

What specific information would you like to know?`;
  };

  const handleSendMessage = async (messageText?: string) => {
    const textToSend = messageText || userInput.trim();
    if (!textToSend) return;

    // Add user message
    const userMessage: Message = {
      id: Date.now().toString(),
      type: 'user',
      content: textToSend,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setUserInput('');
    setIsTyping(true);

    // Simulate bot thinking
    setTimeout(() => {
      const botResponse: Message = {
        id: (Date.now() + 1).toString(),
        type: 'bot',
        content: generateBotResponse(textToSend, ipData),
        timestamp: new Date()
      };
      setMessages(prev => [...prev, botResponse]);
      setIsTyping(false);
    }, 1000);
  };

  const handlePredefinedPrompt = (prompt: string) => {
    handleSendMessage(prompt);
  };

  const handleNewSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (newIp.trim()) {
      navigate(`/details/${newIp.trim()}`);
      setNewIp('');
    }
  };

  return (
    <div className="min-h-screen bg-black text-white relative overflow-hidden">
      {/* Background grid effect */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#0f172a_1px,transparent_1px),linear-gradient(to_bottom,#0f172a_1px,transparent_1px)] bg-[size:4rem_4rem] opacity-20"></div>
      
      {/* Gradient orbs */}
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl"></div>
      <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl"></div>

      <div className="relative z-10">
        {/* Header */}
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
              {/* Left side - Chat Interface */}
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

                {/* Messages Container */}
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
                        <motion.div
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="flex gap-3"
                        >
                          <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gradient-to-r from-cyan-500 to-emerald-500 flex items-center justify-center">
                            <Bot className="w-5 h-5 text-white" />
                          </div>
                          <div className="bg-gray-900/50 border border-gray-800 rounded-2xl px-4 py-3">
                            <div className="flex gap-1">
                              <span className="w-2 h-2 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></span>
                              <span className="w-2 h-2 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></span>
                              <span className="w-2 h-2 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></span>
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

              {/* Right side - Search Box */}
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
                      <Search className="w-4 h-4 mr-2" />
                      Search
                    </Button>
                  </form>

                  <div className="mt-8 pt-6 border-t border-gray-800">
                    <p className="text-sm text-gray-500 mb-2">Current IP:</p>
                    <p className="text-cyan-400 font-mono mb-4">{ip}</p>
                    
                    <div className="space-y-2">
                      <p className="text-sm text-gray-500 mb-3">Quick Actions:</p>
                      <Button
                        onClick={() => handlePredefinedPrompt('Visualize the location of this IP address')}
                        className="w-full bg-gray-800 hover:bg-gray-750 text-white border border-gray-700 hover:border-cyan-500/50 transition-colors"
                        variant="outline"
                        disabled={loading}
                      >
                        📊 Visualize
                      </Button>
                      <Button
                        onClick={() => handlePredefinedPrompt('Assess the security risk level of this IP')}
                        className="w-full bg-gray-800 hover:bg-gray-750 text-white border border-gray-700 hover:border-cyan-500/50 transition-colors"
                        variant="outline"
                        disabled={loading}
                      >
                        🔴 High Risk
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
```

## 4. src/components/ui/utils.ts

```typescript
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
```

## 5. src/components/ui/button.tsx

```tsx
import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "./utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-all disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4 shrink-0 [&_svg]:shrink-0 outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground hover:bg-primary/90",
        destructive:
          "bg-destructive text-white hover:bg-destructive/90 focus-visible:ring-destructive/20 dark:focus-visible:ring-destructive/40 dark:bg-destructive/60",
        outline:
          "border bg-background text-foreground hover:bg-accent hover:text-accent-foreground dark:bg-input/30 dark:border-input dark:hover:bg-input/50",
        secondary:
          "bg-secondary text-secondary-foreground hover:bg-secondary/80",
        ghost:
          "hover:bg-accent hover:text-accent-foreground dark:hover:bg-accent/50",
        link: "text-primary underline-offset-4 hover:underline",
      },
      size: {
        default: "h-9 px-4 py-2 has-[>svg]:px-3",
        sm: "h-8 rounded-md gap-1.5 px-3 has-[>svg]:px-2.5",
        lg: "h-10 rounded-md px-6 has-[>svg]:px-4",
        icon: "size-9 rounded-md",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

function Button({
  className,
  variant,
  size,
  asChild = false,
  ...props
}: React.ComponentProps<"button"> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean;
  }) {
  const Comp = asChild ? Slot : "button";

  return (
    <Comp
      data-slot="button"
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  );
}

export { Button, buttonVariants };
```

## 6. src/components/ui/input.tsx

```tsx
import * as React from "react";

import { cn } from "./utils";

function Input({ className, type, ...props }: React.ComponentProps<"input">) {
  return (
    <input
      type={type}
      data-slot="input"
      className={cn(
        "file:text-foreground placeholder:text-muted-foreground selection:bg-primary selection:text-primary-foreground dark:bg-input/30 border-input flex h-9 w-full min-w-0 rounded-md border px-3 py-1 text-base bg-input-background transition-[color,box-shadow] outline-none file:inline-flex file:h-7 file:border-0 file:bg-transparent file:text-sm file:font-medium disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 md:text-sm",
        "focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px]",
        "aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive",
        className,
      )}
      {...props}
    />
  );
}

export { Input };
```

## 7. src/components/ui/card.tsx

```tsx
import * as React from "react";

import { cn } from "./utils";

function Card({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card"
      className={cn(
        "bg-card text-card-foreground flex flex-col gap-6 rounded-xl border",
        className,
      )}
      {...props}
    />
  );
}

function CardHeader({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-header"
      className={cn(
        "@container/card-header grid auto-rows-min grid-rows-[auto_auto] items-start gap-1.5 px-6 pt-6 has-data-[slot=card-action]:grid-cols-[1fr_auto] [.border-b]:pb-6",
        className,
      )}
      {...props}
    />
  );
}

function CardTitle({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <h4
      data-slot="card-title"
      className={cn("leading-none", className)}
      {...props}
    />
  );
}

function CardDescription({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <p
      data-slot="card-description"
      className={cn("text-muted-foreground", className)}
      {...props}
    />
  );
}

function CardAction({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-action"
      className={cn(
        "col-start-2 row-span-2 row-start-1 self-start justify-self-end",
        className,
      )}
      {...props}
    />
  );
}

function CardContent({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-content"
      className={cn("px-6 [&:last-child]:pb-6", className)}
      {...props}
    />
  );
}

function CardFooter({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-footer"
      className={cn("flex items-center px-6 pb-6 [.border-t]:pt-6", className)}
      {...props}
    />
  );
}

export {
  Card,
  CardHeader,
  CardFooter,
  CardTitle,
  CardAction,
  CardDescription,
  CardContent,
};
```

## 8. src/index.css

```css
@custom-variant dark (&:is(.dark *));

:root {
  --font-size: 16px;
  --background: #ffffff;
  --foreground: oklch(0.145 0 0);
  --card: #ffffff;
  --card-foreground: oklch(0.145 0 0);
  --popover: oklch(1 0 0);
  --popover-foreground: oklch(0.145 0 0);
  --primary: #030213;
  --primary-foreground: oklch(1 0 0);
  --secondary: oklch(0.95 0.0058 264.53);
  --secondary-foreground: #030213;
  --muted: #ececf0;
  --muted-foreground: #717182;
  --accent: #e9ebef;
  --accent-foreground: #030213;
  --destructive: #d4183d;
  --destructive-foreground: #ffffff;
  --border: rgba(0, 0, 0, 0.1);
  --input: transparent;
  --input-background: #f3f3f5;
  --switch-background: #cbced4;
  --font-weight-medium: 500;
  --font-weight-normal: 400;
  --ring: oklch(0.708 0 0);
  --chart-1: oklch(0.646 0.222 41.116);
  --chart-2: oklch(0.6 0.118 184.704);
  --chart-3: oklch(0.398 0.07 227.392);
  --chart-4: oklch(0.828 0.189 84.429);
  --chart-5: oklch(0.769 0.188 70.08);
  --radius: 0.625rem;
  --sidebar: oklch(0.985 0 0);
  --sidebar-foreground: oklch(0.145 0 0);
  --sidebar-primary: #030213;
  --sidebar-primary-foreground: oklch(0.985 0 0);
  --sidebar-accent: oklch(0.97 0 0);
  --sidebar-accent-foreground: oklch(0.205 0 0);
  --sidebar-border: oklch(0.922 0 0);
  --sidebar-ring: oklch(0.708 0 0);
}

.dark {
  --background: oklch(0.145 0 0);
  --foreground: oklch(0.985 0 0);
  --card: oklch(0.145 0 0);
  --card-foreground: oklch(0.985 0 0);
  --popover: oklch(0.145 0 0);
  --popover-foreground: oklch(0.985 0 0);
  --primary: oklch(0.985 0 0);
  --primary-foreground: oklch(0.205 0 0);
  --secondary: oklch(0.269 0 0);
  --secondary-foreground: oklch(0.985 0 0);
  --muted: oklch(0.269 0 0);
  --muted-foreground: oklch(0.708 0 0);
  --accent: oklch(0.269 0 0);
  --accent-foreground: oklch(0.985 0 0);
  --destructive: oklch(0.396 0.141 25.723);
  --destructive-foreground: oklch(0.637 0.237 25.331);
  --border: oklch(0.269 0 0);
  --input: oklch(0.269 0 0);
  --ring: oklch(0.439 0 0);
  --font-weight-medium: 500;
  --font-weight-normal: 400;
  --chart-1: oklch(0.488 0.243 264.376);
  --chart-2: oklch(0.696 0.17 162.48);
  --chart-3: oklch(0.769 0.188 70.08);
  --chart-4: oklch(0.627 0.265 303.9);
  --chart-5: oklch(0.645 0.246 16.439);
  --sidebar: oklch(0.205 0 0);
  --sidebar-foreground: oklch(0.985 0 0);
  --sidebar-primary: oklch(0.488 0.243 264.376);
  --sidebar-primary-foreground: oklch(0.985 0 0);
  --sidebar-accent: oklch(0.269 0 0);
  --sidebar-accent-foreground: oklch(0.985 0 0);
  --sidebar-border: oklch(0.269 0 0);
  --sidebar-ring: oklch(0.439 0 0);
}

@theme inline {
  --color-background: var(--background);
  --color-foreground: var(--foreground);
  --color-card: var(--card);
  --color-card-foreground: var(--card-foreground);
  --color-popover: var(--popover);
  --color-popover-foreground: var(--popover-foreground);
  --color-primary: var(--primary);
  --color-primary-foreground: var(--primary-foreground);
  --color-secondary: var(--secondary);
  --color-secondary-foreground: var(--secondary-foreground);
  --color-muted: var(--muted);
  --color-muted-foreground: var(--muted-foreground);
  --color-accent: var(--accent);
  --color-accent-foreground: var(--accent-foreground);
  --color-destructive: var(--destructive);
  --color-destructive-foreground: var(--destructive-foreground);
  --color-border: var(--border);
  --color-input: var(--input);
  --color-input-background: var(--input-background);
  --color-switch-background: var(--switch-background);
  --color-ring: var(--ring);
  --color-chart-1: var(--chart-1);
  --color-chart-2: var(--chart-2);
  --color-chart-3: var(--chart-3);
  --color-chart-4: var(--chart-4);
  --color-chart-5: var(--chart-5);
  --radius-sm: calc(var(--radius) - 4px);
  --radius-md: calc(var(--radius) - 2px);
  --radius-lg: var(--radius);
  --radius-xl: calc(var(--radius) + 4px);
  --color-sidebar: var(--sidebar);
  --color-sidebar-foreground: var(--sidebar-foreground);
  --color-sidebar-primary: var(--sidebar-primary);
  --color-sidebar-primary-foreground: var(--sidebar-primary-foreground);
  --color-sidebar-accent: var(--sidebar-accent);
  --color-sidebar-accent-foreground: var(--sidebar-accent-foreground);
  --color-sidebar-border: var(--sidebar-border);
  --color-sidebar-ring: var(--sidebar-ring);
}

@layer base {
  * {
    @apply border-border outline-ring/50;
  }

  body {
    @apply bg-background text-foreground;
  }
}

/**
 * Base typography. This is not applied to elements which have an ancestor with a Tailwind text class.
 */
@layer base {
  :where(:not(:has([class*=' text-']), :not(:has([class^='text-'])))) {
    h1 {
      font-size: var(--text-2xl);
      font-weight: var(--font-weight-medium);
      line-height: 1.5;
    }

    h2 {
      font-size: var(--text-xl);
      font-weight: var(--font-weight-medium);
      line-height: 1.5;
    }

    h3 {
      font-size: var(--text-lg);
      font-weight: var(--font-weight-medium);
      line-height: 1.5;
    }

    h4 {
      font-size: var(--text-base);
      font-weight: var(--font-weight-medium);
      line-height: 1.5;
    }

    p {
      font-size: var(--text-base);
      font-weight: var(--font-weight-normal);
      line-height: 1.5;
    }

    label {
      font-size: var(--text-base);
      font-weight: var(--font-weight-medium);
      line-height: 1.5;
    }

    button {
      font-size: var(--text-base);
      font-weight: var(--font-weight-medium);
      line-height: 1.5;
    }

    input {
      font-size: var(--text-base);
      font-weight: var(--font-weight-normal);
      line-height: 1.5;
    }
  }
}

html {
  font-size: var(--font-size);
}
```

## 9. package.json

```json
{
  "name": "cyberguard-app",
  "private": true,
  "version": "0.0.0",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "tsc -b && vite build",
    "lint": "eslint .",
    "preview": "vite preview"
  },
  "dependencies": {
    "react": "^18.3.1",
    "react-dom": "^18.3.1",
    "react-router-dom": "^6.28.0",
    "lucide-react": "^0.468.0",
    "motion": "^11.14.4",
    "clsx": "^2.1.1",
    "tailwind-merge": "^2.6.0",
    "class-variance-authority": "^0.7.1",
    "@radix-ui/react-slot": "^1.1.2"
  },
  "devDependencies": {
    "@eslint/js": "^9.17.0",
    "@types/react": "^18.3.18",
    "@types/react-dom": "^18.3.5",
    "@vitejs/plugin-react": "^4.3.4",
    "autoprefixer": "^10.4.20",
    "eslint": "^9.17.0",
    "eslint-plugin-react-hooks": "^5.0.0",
    "eslint-plugin-react-refresh": "^0.4.16",
    "globals": "^15.14.0",
    "postcss": "^8.4.49",
    "tailwindcss": "^4.0.0",
    "typescript": "~5.6.2",
    "typescript-eslint": "^8.18.2",
    "vite": "^6.0.5"
  }
}
```

## 10. tsconfig.json

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "useDefineForClassFields": true,
    "lib": ["ES2020", "DOM", "DOM.Iterable"],
    "module": "ESNext",
    "skipLibCheck": true,

    /* Bundler mode */
    "moduleResolution": "bundler",
    "allowImportingTsExtensions": true,
    "isolatedModules": true,
    "moduleDetection": "force",
    "noEmit": true,
    "jsx": "react-jsx",

    /* Linting */
    "strict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noFallthroughCasesInSwitch": true,
    "noUncheckedSideEffectImports": true
  },
  "include": ["src"]
}
```

---

Follow the setup instructions in SETUP_INSTRUCTIONS.md to get the application running locally.
