import React, { useState, useRef, useEffect } from 'react';
import { Send, X, MessageSquare, ShieldAlert, Sparkles, HelpCircle, ArrowRight } from 'lucide-react';
import { ProviderKey } from '../types';

interface AISideDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  selectedProvider: ProviderKey;
}

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

const SUGGESTED_CHIPS = [
  { text: "Highlight billing highlights", label: "Analyze Anomalies" },
  { text: "Where can we trim AWS database costs?", label: "Trim AWS Waste" },
  { text: "How does Azure SQL optimize right-sizing?", label: "Scale Azure DBs" },
  { text: "Summarize best commitment strategies", label: "CUD Guidelines" }
];

export default function AISideDrawer({ isOpen, onClose, selectedProvider }: AISideDrawerProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      role: 'assistant',
      content: `Hello! I am your AI FinOps Optimizer. I have synchronized with the billing context for **${
        selectedProvider === 'multicloud' ? 'all MultiCloud directories' : selectedProvider.toUpperCase()
      }**. Describe what you would like to analyze, or select a cognitive prompt below!`
    }
  ]);
  const [inputValue, setInputValue] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // Auto-scroll chat to latest message
  useEffect(() => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollTop = scrollContainerRef.current.scrollHeight;
    }
  }, [messages, loading]);

  const handleSendMessage = async (text: string) => {
    if (!text.trim() || loading) return;

    const userMsg: ChatMessage = { role: 'user', content: text };
    setMessages(prev => [...prev, userMsg]);
    setInputValue('');
    setLoading(true);

    try {
      const chatHistory = messages.map(m => ({
        role: m.role,
        content: m.content
      }));

      const response = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: text,
          activeProvider: selectedProvider,
          chatHistory: chatHistory
        })
      });

      if (response.ok) {
        const data = await response.json();
        setMessages(prev => [...prev, { role: 'assistant', content: data.response }]);
      } else {
        setMessages(prev => [...prev, {
          role: 'assistant',
          content: "I'm temporarily unable to establish connection with the Gemini model. Please confirm API configuration."
        }]);
      }
    } catch (err) {
      console.error(err);
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: "Operational connection to the server was interrupted. Check your container logs."
      }]);
    } finally {
      setLoading(false);
    }
  };

  const handleSendSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleSendMessage(inputValue);
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop overlay */}
      <div 
        className="fixed inset-0 bg-[#000511]/45 backdrop-blur-xs z-40 transition-opacity animate-in fade-in"
        onClick={onClose}
      />

      <div className="fixed right-0 top-0 bottom-0 w-full sm:max-w-md bg-white shadow-2xl z-50 flex flex-col border-l border-gray-100 animate-in slide-in-from-right duration-300">
        
        {/* Header bar */}
        <div className="p-5 bg-[#001D58] text-white flex justify-between items-center relative overflow-hidden">
          <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none select-none">
            <Sparkles size={110} />
          </div>
          <div className="flex items-center gap-2.5 relative z-10">
            <Sparkles className="text-[#00F19C] size-5" />
            <div>
              <h3 className="font-bold text-sm tracking-tight">FinOps AI Advisor</h3>
              <p className="text-[10px] text-slate-350 tracking-wide">Powered by Gemini 3.5 Flash Optimizer</p>
            </div>
          </div>
          
          <button 
            onClick={onClose}
            className="p-1.5 hover:bg-white/10 rounded-lg text-slate-300 hover:text-white transition-colors relative z-10 cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        {/* Messaging Pane */}
        <div 
          ref={scrollContainerRef}
          className="flex-1 overflow-y-auto p-5 space-y-4 bg-gray-50/50"
        >
          {messages.map((msg, index) => (
            <div 
              key={index} 
              className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} animate-in fade-in duration-200`}
            >
              <div 
                className={`max-w-[85%] rounded-2xl p-3.5 text-xs leading-relaxed ${
                  msg.role === 'user' 
                    ? 'bg-[#001D58] text-white rounded-tr-none shadow-xs font-medium'
                    : 'bg-white text-gray-800 border border-gray-100 rounded-tl-none shadow-xs'
                }`}
              >
                {msg.role === 'assistant' && (
                  <div className="flex items-center gap-1.5 mb-1.5 pb-1 border-b border-gray-50">
                    <Sparkles size={11} className="text-[#001D58]" />
                    <span className="font-black text-[9px] uppercase tracking-wider text-[#001D58]">Optimizer recommendation</span>
                  </div>
                )}
                
                {/* Simple formatting for nested asterisk points */}
                <div className="whitespace-pre-wrap font-sans">
                  {msg.content}
                </div>
              </div>
            </div>
          ))}

          {loading && (
            <div className="flex justify-start">
              <div className="bg-white border border-gray-100 rounded-2xl rounded-tl-none p-4 shadow-xs">
                <div className="flex gap-1.5 items-center">
                  <span className="w-1.5 h-1.5 bg-[#001D58]/60 rounded-full animate-bounce" />
                  <span className="w-1.5 h-1.5 bg-[#001D58]/60 rounded-full animate-bounce [animation-delay:0.2s]" />
                  <span className="w-1.5 h-1.5 bg-[#001D58]/60 rounded-full animate-bounce [animation-delay:0.4s]" />
                  <span className="text-[10px] text-gray-400 font-medium ml-1">Analyzing billing metadata...</span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Suggested Quick Prompt Chips area */}
        <div className="p-4 border-t border-gray-100 bg-white">
          <span className="text-[10px] font-bold text-gray-450 uppercase tracking-widest block mb-2 px-1">Cognitive Starter Guides</span>
          <div className="grid grid-cols-2 gap-2 max-h-[140px] overflow-y-auto no-scrollbar pb-1">
            {SUGGESTED_CHIPS.map((chip, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => handleSendMessage(chip.text)}
                className="p-2 border border-blue-50 bg-blue-50/20 text-left rounded-xl hover:bg-blue-50/50 hover:border-blue-100 transition-colors text-[10px] font-semibold text-[#001D58] cursor-pointer"
              >
                {chip.label}
              </button>
            ))}
          </div>
        </div>

        {/* Chat input form */}
        <form 
          onSubmit={handleSendSubmit}
          className="p-4 border-t border-gray-100 bg-gray-50 flex gap-2"
        >
          <input
            type="text"
            value={inputValue}
            onChange={e => setInputValue(e.target.value)}
            disabled={loading}
            placeholder={`Ask about active ${selectedProvider === 'multicloud' ? 'Cloud' : selectedProvider.toUpperCase()} operations...`}
            className="flex-1 px-4 py-3 bg-white rounded-xl border border-gray-100 focus:outline-none focus:ring-2 focus:ring-[#001D58]/20 text-xs font-sans text-gray-800 disabled:opacity-50"
          />
          <button
            type="submit"
            disabled={!inputValue.trim() || loading}
            className="p-3 bg-[#001D58] hover:bg-[#00287A] disabled:opacity-50 text-[#00F19C] rounded-xl transition-all cursor-pointer flex items-center justify-center active:scale-95 shrink-0"
          >
            <Send size={14} />
          </button>
        </form>

      </div>
    </>
  );
}
