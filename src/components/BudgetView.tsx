import React, { useState, useEffect } from 'react';
import { ShieldAlert, DollarSign, Target, Calendar, Save, CheckCircle } from 'lucide-react';
import { ProviderKey, Budget } from '../types';

interface BudgetViewProps {
  selectedProvider: ProviderKey;
  onBudgetUpdated: () => void;
}

export default function BudgetView({ selectedProvider, onBudgetUpdated }: BudgetViewProps) {
  const [amount, setAmount] = useState<string>('120000');
  const [thresholdPct, setThresholdPct] = useState<number>(80);
  const [name, setName] = useState<string>('Core Production Ops Budget');
  const [period, setPeriod] = useState<'monthly' | 'quarterly' | 'yearly'>('monthly');
  
  const [saveSuccess, setSaveSuccess] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(false);
  const [currentBudgets, setCurrentBudgets] = useState<Budget[]>([]);

  const fetchBudgets = async () => {
    try {
      const res = await fetch('/api/budgets');
      if (res.ok) {
        const data = await res.json();
        setCurrentBudgets(data);
        
        // Load active provider budget if available
        const activeB = data.find((b: Budget) => b.providerId === selectedProvider);
        if (activeB) {
          setAmount(activeB.amount.toString());
          setThresholdPct(activeB.thresholdPct);
          setName(activeB.name);
          setPeriod(activeB.period);
        } else {
          setName(`${selectedProvider === 'multicloud' ? 'Global Operations' : selectedProvider.toUpperCase()} Target Budget`);
          setAmount(selectedProvider === 'aws' ? '65000' : selectedProvider === 'azure' ? '48000' : selectedProvider === 'gcp' ? '30000' : '150000');
          setThresholdPct(80);
        }
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchBudgets();
  }, [selectedProvider]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setSaveSuccess(false);

    try {
      const res = await fetch('/api/budgets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          providerId: selectedProvider,
          amount: parseFloat(amount),
          thresholdPct,
          name,
          period
        })
      });

      if (res.ok) {
        setSaveSuccess(true);
        onBudgetUpdated();
        await fetchBudgets();
        setTimeout(() => setSaveSuccess(false), 3000);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div className="lg:col-span-2 bg-white rounded-2xl p-4 sm:p-6 border border-gray-100 shadow-xs">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
            <Target size={20} />
          </div>
          <div>
            <h2 className="text-xl font-bold text-[#001D58]">Configure Dynamic Cost Policies</h2>
            <p className="text-xs text-gray-500">Set alarms structures and spending caps for active operations.</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-bold text-gray-400 uppercase tracking-wider block mb-2">Policy Name</label>
              <input
                type="text"
                value={name}
                onChange={e => setName(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-gray-100 focus:outline-none focus:ring-2 focus:ring-[#001D58]/20 focus:border-[#001D58] font-sans font-medium text-gray-800"
                required
              />
            </div>

            <div>
              <label className="text-xs font-bold text-gray-400 uppercase tracking-wider block mb-2">Billing Period</label>
              <select
                value={period}
                onChange={e => setPeriod(e.target.value as any)}
                className="w-full px-4 py-3 rounded-xl border border-gray-100 bg-white focus:outline-none focus:ring-2 focus:ring-[#001D58]/20 text-gray-800 font-sans font-medium"
              >
                <option value="monthly">Monthly Cycle</option>
                <option value="quarterly">Quarterly Cycle</option>
                <option value="yearly">Yearly Flat Limit</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-bold text-gray-400 uppercase tracking-wider block mb-2">Sustained Budget Amount (USD)</label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 font-bold text-gray-400">$</span>
                <input
                  type="number"
                  value={amount}
                  onChange={e => setAmount(e.target.value)}
                  className="w-full pl-8 pr-4 py-3 rounded-xl border border-gray-100 focus:outline-none focus:ring-2 focus:ring-[#001D58]/20 focus:border-[#001D58] font-mono text-gray-800 font-medium"
                  placeholder="e.g. 50000"
                  required
                />
              </div>
            </div>

            <div>
              <div className="flex justify-between items-center mb-2">
                <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">Alert Threshold Percentage</label>
                <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">{thresholdPct}% limit reached</span>
              </div>
              <div className="flex items-center gap-3 pt-2">
                <input
                  type="range"
                  min="50"
                  max="98"
                  step="5"
                  value={thresholdPct}
                  onChange={e => setThresholdPct(parseInt(e.target.value))}
                  className="w-full accent-[#001D58]"
                />
              </div>
            </div>
          </div>

          <div className="p-4 bg-amber-50/50 rounded-xl border border-amber-100/50 flex gap-3 text-amber-800 text-xs leading-relaxed">
            <ShieldAlert size={18} className="text-amber-500 shrink-0 mt-0.5" />
            <div>
              <span className="font-bold">Automated FinOps Action Triggered:</span> Our cognitive optimization loop will generate an urgent high-priority anomaly flag and notify engineering teams via the Alerts feed immediately when actual MTD spending crosses <span className="font-bold font-mono">${(parseFloat(amount || '0') * thresholdPct / 100).toLocaleString()}</span> (which represents {thresholdPct}% of limit).
            </div>
          </div>

          <div className="flex items-center justify-between border-t border-gray-50 pt-4">
            {saveSuccess ? (
              <div className="flex items-center gap-2 text-emerald-600 text-xs font-bold animate-pulse">
                <CheckCircle size={14} /> Saving policy rule parameters...
              </div>
            ) : <span />}

            <button
              type="submit"
              disabled={loading}
              className="flex items-center gap-2 bg-[#001D58] hover:bg-[#001D58]/95 font-semibold text-white px-5 py-2.5 rounded-xl transition-all font-sans text-xs shadow-xs"
            >
              <Save size={14} />
              {loading ? 'Saving Standard...' : 'Deploy Policy'}
            </button>
          </div>
        </form>
      </div>

      <div className="bg-[#001D58] text-white rounded-2xl p-6 relative overflow-hidden flex flex-col justify-between">
        <div className="absolute top-0 right-0 opacity-10 rotate-12 scale-150 transform translate-x-1/4 translate-y-[-10%] selection:bg-transparent pointer-events-none">
          <Calendar size={180} />
        </div>
        
        <div>
          <span className="text-xs text-[#00F19C] font-mono font-bold tracking-widest uppercase mb-1 block">Active Directory Policies</span>
          <h3 className="text-lg font-bold tracking-tight mb-4">Active Deployments</h3>
          
          <div className="space-y-4 relative z-10">
            {currentBudgets.map(b => (
              <div key={b.id} className="p-3 bg-white/10 rounded-xl border border-white/5 flex justify-between items-center text-xs">
                <div>
                  <p className="font-bold text-slate-100">{b.name}</p>
                  <p className="font-mono text-slate-400 capitalize">{b.period} billing cap</p>
                </div>
                <div className="text-right">
                  <p className="font-bold text-[#00F19C] font-mono">${b.amount.toLocaleString()}</p>
                  <p className="text-slate-400 font-mono">Warn @ {b.thresholdPct}%</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="text-[10px] text-slate-400 leading-normal mt-6">
          System continuously maps and matches real AWS, Azure, and GCP usage metrics against active policies every 5 minutes to safeguard cloud margins.
        </div>
      </div>
    </div>
  );
}
