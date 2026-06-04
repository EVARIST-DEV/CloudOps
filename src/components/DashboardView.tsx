import React, { useState, useEffect } from 'react';
import { AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, PieChart, Pie, Legend } from 'recharts';
import { Sparkles, Brain, Radio, ArrowUpRight, ArrowDownRight, RefreshCw, Zap } from 'lucide-react';
import { ProviderKey, DashboardStats } from '../types';

interface DashboardViewProps {
  stats: DashboardStats;
  selectedProvider: ProviderKey;
}

export default function DashboardView({ stats, selectedProvider }: DashboardViewProps) {
  const [aiSummary, setAiSummary] = useState<string>('');
  const [loadingSummary, setLoadingSummary] = useState<boolean>(false);

  const fetchAISummary = async () => {
    setLoadingSummary(true);
    setAiSummary('');
    try {
      const res = await fetch('/api/ai/summary', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ provider: selectedProvider })
      });
      if (res.ok) {
        const data = await res.json();
        setAiSummary(data.summary);
      }
    } catch (err) {
      console.error(err);
      setAiSummary('Failed to compile cognitive analysis from Gemini server. Verify API activation.');
    } finally {
      setLoadingSummary(false);
    }
  };

  useEffect(() => {
    fetchAISummary();
  }, [selectedProvider]);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
      
      {/* Financial Trending Graph Chart */}
      <div className="lg:col-span-2 bg-white p-4 sm:p-6 rounded-2xl border border-gray-100 shadow-xs flex flex-col justify-between">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
          <div>
            <h3 className="text-base font-bold text-[#001D58]">Financial Trending & Rates</h3>
            <p className="text-xs text-gray-500">Live actual spend tracking vs allocated budget caps across recent cycle</p>
          </div>
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
            <span className="flex items-center gap-1 text-[11px] font-semibold text-[#001D58]">
              <span className="h-2 w-2 rounded-full bg-[#001D58]" />
              Actuals
            </span>
            <span className="flex items-center gap-1 text-[11px] font-semibold text-[#00F19C]">
              <span className="h-2 w-2 rounded-full bg-[#00F19C]" />
              Budget Limit
            </span>
            <span className="flex items-center gap-1 text-[11px] font-semibold text-sky-400">
              <span className="h-2 w-2 rounded-full bg-sky-400" />
              Forecast
            </span>
          </div>
        </div>

        <div className="h-[280px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={stats.recentChartData}>
              <defs>
                <linearGradient id="colorSpend" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#001D58" stopOpacity={0.12}/>
                  <stop offset="95%" stopColor="#001D58" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
              <XAxis 
                dataKey="name" 
                axisLine={false} 
                tickLine={false} 
                tick={{ fill: '#64748B', fontSize: 10, fontFamily: 'Inter' }} 
              />
              <YAxis 
                axisLine={false} 
                tickLine={false} 
                tick={{ fill: '#64748B', fontSize: 10, fontFamily: 'monospace' }}
                tickFormatter={(val) => `$${val}`}
              />
              <Tooltip 
                contentStyle={{ 
                  borderRadius: '12px', 
                  border: 'none', 
                  backgroundColor: '#FFFFFF',
                  boxShadow: '0 4px 12px rgba(0, 29, 88, 0.08)' 
                }}
                labelStyle={{ fontWeight: 'bold', color: '#001D58', fontSize: 11 }}
                itemStyle={{ fontSize: 11 }}
              />
              <Area 
                type="monotone" 
                dataKey="actual" 
                stroke="#001D58" 
                strokeWidth={2.5}
                fillOpacity={1} 
                fill="url(#colorSpend)" 
                name="Actual Cost ($)"
              />
              <Area 
                type="monotone" 
                dataKey="budget" 
                stroke="#00F19C" 
                strokeWidth={1.5}
                strokeDasharray="4 4"
                fill="transparent"
                name="Budget Limit ($)"
              />
              <Area 
                type="monotone" 
                dataKey="forecast" 
                stroke="#38BDF8" 
                strokeWidth={1.5}
                fill="transparent"
                name="Forecast Limit ($)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* AI SMART RECOMMENDATIONS CARD */}
      <div className="bg-[#001D58] text-white rounded-2xl p-6 relative overflow-hidden flex flex-col justify-between shadow-md">
        <div className="absolute top-0 right-0 p-6 opacity-[0.03] select-none pointer-events-none scale-150 transform translate-x-12 translate-y-[-10%]">
          <Brain size={200} />
        </div>
        
        <div>
          <div className="flex justify-between items-center mb-4">
            <span className="text-[10px] uppercase font-bold tracking-widest text-[#00F19C] font-mono flex items-center gap-1.5">
              <Zap size={11} className="fill-[#00F19C]" />
              Cognitive Insights
            </span>
            <button
              onClick={fetchAISummary}
              disabled={loadingSummary}
              className="p-1 hover:bg-white/10 rounded-lg text-slate-350 hover:text-white transition-colors cursor-pointer"
              title="Regenerate context"
            >
              <RefreshCw size={12} className={loadingSummary ? 'animate-spin' : ''} />
            </button>
          </div>

          <h3 className="text-base font-bold text-slate-100 tracking-tight flex items-center gap-2">
            AI FinOps Summary
            <span className="h-2 w-2 rounded-full bg-[#00F19C] animate-pulse" />
          </h3>
          
          <div className="mt-4 space-y-3 prose prose-invert overflow-y-auto max-h-[190px] pr-1">
            {loadingSummary ? (
              <div className="space-y-3.5 pt-4">
                <div className="h-3 bg-white/15 rounded-md animate-pulse w-3/4" />
                <div className="h-3 bg-white/15 rounded-md animate-pulse w-full" />
                <div className="h-3 bg-white/15 rounded-md animate-pulse w-5/6" />
              </div>
            ) : (
              <div className="text-xs text-slate-300 leading-relaxed font-sans space-y-3">
                {aiSummary.split('\n').map((line, idx) => {
                  if (line.trim().startsWith('*') || line.trim().startsWith('-')) {
                    return (
                      <div key={idx} className="flex gap-2.5 items-start">
                        <span className="text-[#00F19C] shrink-0 font-bold">&#8211;</span>
                        <span>{line.replace(/^[\*\-]\s*/, '')}</span>
                      </div>
                    );
                  }
                  return <p key={idx}>{line}</p>;
                })}
              </div>
            )}
          </div>
        </div>

        <div className="text-[9px] text-slate-400 font-mono pt-4 border-t border-white/5 flex justify-between items-center">
          <span>Optimized Directory Target: {selectedProvider.toUpperCase()}</span>
          <span>SaaS Model: gemini-3.5-flash</span>
        </div>
      </div>

      {/* Service Allocation Breakdown */}
      <div className="bg-white p-4 sm:p-6 rounded-2xl border border-gray-100 shadow-xs">
        <h3 className="text-sm font-bold text-[#001D58] mb-1">Service Spend Mix</h3>
        <p className="text-[11px] text-gray-500 mb-6">Aggregate operational allocation over active cycle</p>
        
        <div className="h-[180px] flex items-center justify-center relative">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={stats.serviceDistribution}
                cx="50%"
                cy="50%"
                innerRadius={50}
                outerRadius={75}
                paddingAngle={3}
                dataKey="value"
              >
                {stats.serviceDistribution.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip 
                formatter={(val) => `$${parseFloat(val as any).toLocaleString()}`}
                contentStyle={{ fontSize: 11, borderRadius: '8px' }}
              />
            </PieChart>
          </ResponsiveContainer>
          
          {/* Centered overall label */}
          <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 flex flex-col items-center">
            <span className="text-[9px] uppercase font-bold text-gray-400 tracking-wider">Total</span>
            <span className="text-base font-extrabold text-[#001D58] font-mono">
              ${stats.totalSpend >= 1000 ? `${(stats.totalSpend / 1000).toFixed(1)}k` : stats.totalSpend}
            </span>
          </div>
        </div>

        <div className="mt-4 grid grid-cols-2 gap-2 max-h-[100px] overflow-y-auto no-scrollbar pt-2 border-t border-gray-50">
          {stats.serviceDistribution.slice(0, 5).map((entry, idx) => (
            <div key={idx} className="flex items-center gap-1.5 text-[10px]">
              <span className="h-1.5 w-1.5 rounded-full shrink-0" style={{ backgroundColor: entry.color }} />
              <span className="font-semibold text-gray-500 truncate inline-block max-w-[80px]">{entry.name}</span>
              <span className="font-mono text-gray-700 font-bold ml-auto">${entry.value >= 1000 ? `${(entry.value / 1000).toFixed(1)}k` : entry.value}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Provider Split Allocation */}
      <div className="bg-white p-4 sm:p-6 rounded-2xl border border-gray-100 shadow-xs lg:col-span-2">
        <h3 className="text-sm font-bold text-[#001D58] mb-1">Provider Expense Analysis</h3>
        <p className="text-[11px] text-gray-500 mb-6 font-sans">Compare total billing ratios across integrated clouds directories</p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-center">
          <div className="h-[150px] md:col-span-1">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={stats.providerDistribution}
                  cx="50%"
                  cy="50%"
                  innerRadius={0}
                  outerRadius={65}
                  dataKey="value"
                >
                  {stats.providerDistribution.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip formatter={(val) => `$${val}`} />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div className="md:col-span-2 space-y-3.5">
            {stats.providerDistribution.map((entry, idx) => {
              const percentage = parseFloat(((entry.value / stats.totalSpend) * 100).toFixed(1));
              return (
                <div key={idx} className="space-y-1">
                  <div className="flex justify-between items-center text-xs font-semibold">
                    <div className="flex items-center gap-2">
                      <span className="h-2 w-2 rounded-full" style={{ backgroundColor: entry.color }} />
                      <span className="text-[#001D58] text-[11px]">{entry.name}</span>
                    </div>
                    <div className="font-mono text-[11px] text-gray-700">
                      <span>${entry.value.toLocaleString()}</span>
                      <span className="text-gray-400 font-normal ml-1.5">({percentage}%)</span>
                    </div>
                  </div>
                  <div className="w-full h-1.5 bg-gray-50 rounded-full overflow-hidden">
                    <div 
                      className="h-full rounded-full transition-all duration-500" 
                      style={{ backgroundColor: entry.color, width: `${percentage}%` }} 
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

    </div>
  );
}
