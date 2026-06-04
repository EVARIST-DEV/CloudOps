import React, { useState, useEffect } from 'react';
import { 
  BarChart, 
  Layers, 
  ShieldAlert, 
  Sparkles, 
  SlidersHorizontal, 
  LayoutDashboard, 
  Target, 
  MessageSquare, 
  RefreshCw, 
  Bell, 
  Activity, 
  FolderSync,
  X,
  Plus
} from 'lucide-react';

import { ProviderKey, DashboardStats, Alert, Recommendation } from './types';
import KPICard from './components/KPICard';
import DashboardView from './components/DashboardView';
import AlertsView from './components/AlertsView';
import OptimizationView from './components/OptimizationView';
import BudgetView from './components/BudgetView';
import AISideDrawer from './components/AISideDrawer';

// Navigation tabs
type TabKey = 'dashboard' | 'alerts' | 'optimize' | 'policies';

export default function App() {
  const [selectedProvider, setSelectedProvider] = useState<ProviderKey>('multicloud');
  const [activeTab, setActiveTab] = useState<TabKey>('dashboard');
  
  // App wide polling / reactive states
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  
  const [loading, setLoading] = useState<boolean>(true);
  const [aiChatOpen, setAiChatOpen] = useState<boolean>(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Stats / state loader
  const loadStatsAndData = async () => {
    try {
      // 1. Load active stats
      const statsRes = await fetch(`/api/dashboard/stats?provider=${selectedProvider}`);
      if (statsRes.ok) {
        const statsData = await statsRes.json();
        setStats(statsData);
      }

      // 2. Load alerts
      const alertsRes = await fetch('/api/alerts');
      if (alertsRes.ok) {
        const alertsData = await alertsRes.json();
        setAlerts(alertsData);
      }

      // 3. Load recommendations
      const recsRes = await fetch('/api/recommendations');
      if (recsRes.ok) {
        const recsData = await recsRes.json();
        setRecommendations(recsData);
      }
    } catch (err) {
      console.error("Data loading failure:", err);
    } finally {
      setLoading(false);
    }
  };

  // Trigger load on selected provider or tab change
  useEffect(() => {
    loadStatsAndData();
  }, [selectedProvider, activeTab]);

  // Real-time polling loop (runs every 6 seconds to fetch fresh simulated alerts instantly!)
  useEffect(() => {
    const interval = setInterval(() => {
      // Fetch latest alerts silently
      fetch('/api/alerts')
        .then(res => res.json())
        .then(data => {
          // Check for brand new alerts to trigger a temporary UI Toast notice
          if (data.length > alerts.length && alerts.length > 0) {
            const newest = data[0];
            if (newest.severity === 'CRITICAL') {
              showToast(`CRITICAL: ${newest.title}`);
            } else {
              showToast(`New operational trigger logged on your feed.`);
            }
            // Trigger statistical refresh
            loadStatsAndData();
          }
          setAlerts(data);
        })
        .catch(err => console.error(err));
    }, 6000);

    return () => clearInterval(interval);
  }, [alerts]);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 5000);
  };

  const handleApplyOptimization = async (id: string) => {
    try {
      const res = await fetch(`/api/recommendations/${id}/apply`, { method: 'POST' });
      if (res.ok) {
        showToast("Saving criteria updated. Custom reduction deployed.");
        await loadStatsAndData();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const activeAlertsCount = alerts.filter(a => a.status === 'active').length;

  return (
    <div className="min-h-screen bg-gray-50/50 flex flex-col font-sans antialiased text-gray-800">
      
      {/* Dynamic Floating Toast Alerts Notice */}
      {toastMessage && (
        <div className="fixed bottom-6 left-6 z-50 bg-[#001D58] border border-blue-900 text-[#00F19C] text-xs font-semibold px-4 py-3.5 rounded-2xl shadow-xl flex items-center gap-3 animate-bounce">
          <span className="h-2 w-2 rounded-full bg-rose-500 animate-ping shrink-0" />
          <span>{toastMessage}</span>
          <button onClick={() => setToastMessage(null)} className="hover:text-white ml-2">
            <X size={14} />
          </button>
        </div>
      )}

      {/* Main Layout Header Bar */}
      <header className="sticky top-0 bg-white/90 backdrop-blur-md border-b border-gray-150/60 p-4 shrink-0 z-30">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row justify-between sm:items-center gap-4">
          
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#001D58] flex items-center justify-center text-[#00F19C] shadow-md shadow-blue-950/10">
              <Layers size={20} className="" />
            </div>
            <div>
              <h1 className="text-base font-extrabold text-[#001D58] tracking-tight">CloudOps FinOps Platform</h1>
              <p className="text-[10px] text-gray-400 font-medium uppercase tracking-wider">Operational Cost Controls Suite</p>
            </div>
          </div>

          <div className="flex items-center gap-3 flex-wrap">
            
            {/* Live syncing status badge */}
            <div className="hidden md:flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 text-emerald-700 border border-emerald-100 rounded-full text-[10px] font-bold">
              <span className="h-1.5 w-1.5 bg-emerald-500 rounded-full animate-ping" />
              Ingestion Pipelines Active
            </div>

            {/* Provider Directory Filter Select */}
            <div className="flex bg-gray-100 p-1 rounded-xl border border-gray-200/80 overflow-x-auto no-scrollbar max-w-full">
              {(['multicloud', 'aws', 'azure', 'gcp', 'm365'] as ProviderKey[]).map(key => (
                <button
                  key={key}
                  onClick={() => setSelectedProvider(key)}
                  className={`px-3 py-1.5 rounded-lg text-[10px] font-bold capitalize transition-all shrink-0 cursor-pointer ${
                    selectedProvider === key
                      ? 'bg-[#001D58] text-white shadow-xs'
                      : 'text-gray-500 hover:text-gray-800'
                  }`}
                >
                  {key === 'multicloud' ? 'Unified Hub' : key}
                </button>
              ))}
            </div>

            {/* Live Refresh Trigger button */}
            <button
              onClick={() => {
                setLoading(true);
                loadStatsAndData();
              }}
              className="p-2 border border-gray-100 bg-white hover:bg-gray-50 text-gray-400 hover:text-[#001D58] rounded-xl transition-all cursor-pointer active:scale-95"
              title="Sync telemetry"
            >
              <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
            </button>

          </div>
        </div>
      </header>

      {/* Primary Dashboard Grid Wrapper */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8 space-y-6">
        
        {/* Navigation Tabs bar */}
        <div className="flex flex-col lg:flex-row justify-between items-stretch lg:items-center bg-white p-2 rounded-2xl border border-gray-100/80 shadow-xs gap-3">
          <div className="flex gap-1.5 overflow-x-auto no-scrollbar scroll-smooth whitespace-nowrap pb-1 lg:pb-0 scroll-snap">
            <button
              onClick={() => setActiveTab('dashboard')}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all shrink-0 cursor-pointer ${
                activeTab === 'dashboard'
                  ? 'bg-blue-100/60 text-[#001D58]'
                  : 'text-gray-500 hover:bg-gray-50'
              }`}
            >
              <LayoutDashboard size={14} className="shrink-0" />
              Financial Trending
            </button>

            <button
              onClick={() => setActiveTab('alerts')}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all relative shrink-0 cursor-pointer ${
                activeTab === 'alerts'
                  ? 'bg-rose-100/60 text-rose-700'
                  : 'text-gray-500 hover:bg-gray-50'
              }`}
            >
              <ShieldAlert size={14} className="shrink-0" />
              Alerts & Anomalies
              {activeAlertsCount > 0 && (
                <span className="absolute -top-1 -right-1 h-4 w-4 bg-rose-500 text-white text-[9px] font-extrabold flex items-center justify-center rounded-full ring-2 ring-white animate-pulse">
                  {activeAlertsCount}
                </span>
              )}
            </button>

            <button
              onClick={() => setActiveTab('optimize')}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all shrink-0 cursor-pointer ${
                activeTab === 'optimize'
                  ? 'bg-amber-100/60 text-amber-800'
                  : 'text-gray-500 hover:bg-gray-50'
              }`}
            >
              <Sparkles size={14} className="shrink-0" />
              Optimization Engine
            </button>

            <button
              onClick={() => setActiveTab('policies')}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all shrink-0 cursor-pointer ${
                activeTab === 'policies'
                  ? 'bg-indigo-100/60 text-indigo-800'
                  : 'text-gray-500 hover:bg-gray-50'
              }`}
            >
              <SlidersHorizontal size={14} className="shrink-0" />
              Billing Policies
            </button>
          </div>

          <div className="flex">
            <button
              onClick={() => setAiChatOpen(true)}
              className="flex items-center justify-center gap-2 bg-[#001D58] hover:bg-[#00226E] text-white px-4 py-2.5 rounded-xl text-xs font-bold transition-all shadow-xs active:scale-95 cursor-pointer border border-[#001D58] w-full lg:w-auto"
            >
              <MessageSquare size={13} className="text-[#00F19C] fill-[#00F19C] shrink-0" />
              AI Assistant
            </button>
          </div>
        </div>

        {/* Global KPI stats tier section */}
        {stats && (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <KPICard 
              title="Spend Actuals (MTD)"
              value={`$${stats.totalSpend.toLocaleString()}`}
              delta={`${selectedProvider === 'multicloud' ? '+4.3%' : '+2.8%'}`}
              trend="up"
              subtext="Accumulated 30-day bill run"
            />
            <KPICard 
              title="Forecast vs Budget"
              value={`${stats.forecastPct}%`}
              delta={`${stats.forecastPct > 80 ? 'Warning' : 'Healthy'}`}
              trend={stats.forecastPct > 80 ? 'up' : 'down'}
              subtext={`Cap: $${stats.totalBudget.toLocaleString()}`}
              accent={stats.forecastPct > 80}
            />
            <KPICard 
              title="Sustained Burn Rate"
              value={`$${Math.round(stats.runRate).toLocaleString()}/day`}
              subtext="Avg direct daily overhead"
            />
            <KPICard 
              title="Savings Identified"
              value={`$${stats.savingsFound.toLocaleString()}/mo`}
              subtext={`unlocked: $${stats.savingsApplied.toLocaleString()}/mo`}
              accent={stats.savingsFound > 0}
            />
          </div>
        )}

        {/* Primary Switch router based on active navigations tab */}
        {loading ? (
          <div className="p-20 text-center flex flex-col items-center justify-center bg-white rounded-2xl border border-gray-100">
            <RefreshCw className="animate-spin text-[#001D58] w-8 h-8 mb-4" />
            <h3 className="font-extrabold text-sm text-[#001D58]">Compiling Cloud Billing Telemetry</h3>
            <p className="text-xs text-gray-500 mt-1">Interfacing directories across active directory scopes...</p>
          </div>
        ) : (
          <div className="transition-all duration-300">
            {activeTab === 'dashboard' && stats && (
              <DashboardView stats={stats} selectedProvider={selectedProvider} />
            )}
            
            {activeTab === 'alerts' && (
              <AlertsView alerts={alerts} onRefresh={loadStatsAndData} />
            )}

            {activeTab === 'optimize' && (
              <OptimizationView 
                recommendations={recommendations} 
                onApplyOptimization={handleApplyOptimization}
                savingsApplied={stats?.savingsApplied || 0}
                efficiencyScore={stats?.efficiencyScore || 82}
              />
            )}

            {activeTab === 'policies' && (
              <BudgetView selectedProvider={selectedProvider} onBudgetUpdated={loadStatsAndData} />
            )}
          </div>
        )}

      </main>

      {/* Floating Spark Assistant Panel Button for responsive layouts */}
      <button
        onClick={() => setAiChatOpen(true)}
        className="fixed bottom-6 right-6 z-40 bg-[#001D58] hover:bg-[#00226E] text-[#00F19C] hover:text-white p-4 h-14 w-14 rounded-2xl shadow-xl flex items-center justify-center transition-all cursor-pointer border border-[#001D58] hover:scale-105 active:scale-95 group"
        title="Open advisor drawer"
      >
        <Sparkles size={22} className="group-hover:rotate-12 transition-transform" />
      </button>

      {/* Side drawer chatbot analyzer panel (Gemini proxies inside) */}
      <AISideDrawer 
        isOpen={aiChatOpen} 
        onClose={() => setAiChatOpen(false)} 
        selectedProvider={selectedProvider}
      />

    </div>
  );
}
