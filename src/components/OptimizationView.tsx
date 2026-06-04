import React, { useState } from 'react';
import { Sparkles, CheckCircle, Flame, ArrowRight, Zap, Target, Minimize, DollarSign } from 'lucide-react';
import { Recommendation } from '../types';

interface OptimizationViewProps {
  recommendations: Recommendation[];
  onApplyOptimization: (id: string) => void;
  savingsApplied: number;
  efficiencyScore: number;
}

export default function OptimizationView({ recommendations, onApplyOptimization, savingsApplied, efficiencyScore }: OptimizationViewProps) {
  const [applyingId, setApplyingId] = useState<string | null>(null);

  const handleApply = async (id: string) => {
    setApplyingId(id);
    await onApplyOptimization(id);
    setApplyingId(null);
  };

  const pendingRecs = recommendations.filter(r => r.status === 'pending');
  const appliedRecs = recommendations.filter(r => r.status === 'applied');

  // Category tags mappings
  const getCategoryTheme = (cat: string) => {
    switch (cat) {
      case 'rightsizing': return 'bg-blue-50 text-blue-600 border-blue-105';
      case 'cleanup': return 'bg-amber-50 text-amber-600 border-amber-105';
      case 'commitment': return 'bg-emerald-50 text-emerald-600 border-emerald-110';
      default: return 'bg-gray-50 text-gray-500 border-gray-105';
    }
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="p-5 rounded-2xl bg-white border border-gray-100 shadow-xs">
          <span className="text-xs text-gray-400 font-bold uppercase tracking-widest block mb-1">Interactive Yield</span>
          <h4 className="text-2xl font-black text-emerald-500 font-mono">${savingsApplied.toLocaleString()}/mo</h4>
          <span className="text-xs text-gray-500 block mt-2">Savings successfully locked in this billing cycle.</span>
        </div>

        <div className="p-5 rounded-2xl bg-white border border-gray-100 shadow-xs">
          <span className="text-xs text-gray-400 font-bold uppercase tracking-widest block mb-1">Efficiency Score</span>
          <h4 className="text-2xl font-black text-[#001D58] font-mono">{efficiencyScore}/100</h4>
          <div className="w-full h-1.5 bg-gray-100 rounded-full mt-2 overflow-hidden">
            <div className="h-full bg-emerald-500 transition-all duration-500" style={{ width: `${efficiencyScore}%` }} />
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-gradient-to-br from-[#001D58] to-[#002B7D] border border-blue-900 shadow-md text-white flex flex-col justify-between">
          <div>
            <span className="text-[9px] uppercase font-bold tracking-widest text-[#00F19C] font-mono">Cognitive Optimizer</span>
            <h5 className="text-sm font-bold mt-1 text-slate-100">Outstanding Savings Potential</h5>
          </div>
          <h4 className="text-2xl font-black font-mono text-[#00F19C] mt-2">
            ${pendingRecs.reduce((sum, r) => sum + r.monthlySaving, 0).toLocaleString()}/mo
          </h4>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-4">
          <div className="flex justify-between items-center px-1">
            <span className="text-xs font-extrabold text-gray-400 uppercase tracking-wider flex items-center gap-1">
              <Sparkles size={12} className="text-[#001D58]" />
              Actionable Recommendations ({pendingRecs.length})
            </span>
          </div>

          {pendingRecs.length === 0 ? (
            <div className="p-12 text-center bg-white rounded-2xl border border-gray-100 flex flex-col items-center justify-center">
              <div className="p-3 bg-emerald-50 text-emerald-500 rounded-full mb-3">
                <CheckCircle size={24} />
              </div>
              <h3 className="font-bold text-[#001D58] text-sm">Perfect Architectural Alignment</h3>
              <p className="text-xs text-gray-500 mt-1 max-w-sm">No secondary waste, unused volumes, or commitment gaps. Your cloud operations are functioning at maximum efficacy!</p>
            </div>
          ) : (
            pendingRecs.map(rec => (
              <div key={rec.id} className="p-4 sm:p-5 bg-white rounded-2xl border border-gray-100 shadow-xs hover:shadow-xs transition-shadow flex flex-col sm:flex-row justify-between gap-4">
                <div className="space-y-2 min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className={`text-[9px] uppercase font-extrabold tracking-widest px-2.5 py-0.5 rounded-full border ${getCategoryTheme(rec.category)}`}>
                      {rec.category}
                    </span>
                    <span className="text-[10px] font-bold text-gray-400 font-mono capitalize">
                      Source: {rec.providerId.toUpperCase()} Directory
                    </span>
                  </div>
                  <h4 className="font-bold text-[#001D58] text-sm leading-snug">{rec.title}</h4>
                  <p className="text-xs text-gray-500 leading-relaxed max-w-xl">{rec.description}</p>
                  
                  <div className="flex flex-wrap items-center gap-2 text-[10px] font-mono text-gray-450 pt-1">
                    <span className="font-semibold text-emerald-600 bg-emerald-50/70 px-2 py-0.5 rounded text-[11px] whitespace-nowrap">
                      Saves: ${rec.monthlySaving.toLocaleString()}/mo
                    </span>
                    <span className="text-gray-500">
                      Saves approx {rec.pctOfSpend}% of provider quota
                    </span>
                  </div>
                </div>

                <div className="flex sm:flex-col items-stretch sm:items-end justify-end gap-2 text-left sm:text-right shrink-0 mt-2 sm:mt-0">
                  <button
                    onClick={() => handleApply(rec.id)}
                    disabled={applyingId === rec.id}
                    className="w-full sm:w-auto bg-[#001D58] hover:bg-[#001D58]/95 disabled:opacity-50 text-white font-bold px-4 py-3 sm:py-2.5 rounded-xl text-xs transition-all flex items-center justify-center gap-1.5 group whitespace-nowrap active:scale-95 cursor-pointer"
                  >
                    {applyingId === rec.id ? (
                      'Executing...'
                    ) : (
                      <>
                        Apply Action
                        <ArrowRight size={12} className="group-hover:translate-x-1 transition-transform" />
                      </>
                    )}
                  </button>
                </div>
              </div>
            ))
          )}

          {/* Recently Successfully Executed */}
          {appliedRecs.length > 0 && (
            <div className="pt-4 space-y-3">
              <span className="text-xs font-bold text-gray-400 uppercase tracking-wider block px-1">Successfully Executed ({appliedRecs.length})</span>
              {appliedRecs.map(rec => (
                <div key={rec.id} className="p-4 bg-gray-50 bg-white/60 rounded-2xl border border-gray-100 opacity-60 flex gap-3 text-xs items-center justify-between">
                  <div className="flex gap-2.5 items-center">
                    <CheckCircle className="text-emerald-500 w-4 h-4 shrink-0" />
                    <div>
                      <h5 className="font-semibold text-gray-650 leading-none">{rec.title}</h5>
                      <span className="text-[10px] text-gray-400 font-mono mt-1 block">Monthly rate optimized by ${rec.monthlySaving}/mo</span>
                    </div>
                  </div>
                  <span className="text-[10px] bg-emerald-50 text-emerald-700 font-bold px-2 py-0.5 rounded-full font-mono">Applied</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Sidebar Info Card */}
        <div className="space-y-4">
          <div className="bg-gray-50 rounded-2xl p-5 border border-gray-100 text-xs">
            <h3 className="font-bold text-[#001D58] mb-2 text-sm flex items-center gap-1.5">
              <Zap size={14} className="text-[#00F19C] fill-[#00F19C]" />
              AI Automated Lifecycles
            </h3>
            <p className="text-gray-500 leading-relaxed mb-4">
              Our automated cognitive process scans historical storage metadata and CPU benchmarks, highlighting idle clusters where operations can safely be trimmed without downstream disruption.
            </p>
            <div className="p-3.5 bg-white rounded-xl border border-gray-100 text-[11px] text-gray-650 leading-relaxed">
              <span className="font-bold block text-[#001D58] mb-1">What happens when I apply?</span>
              Clicking <span className="font-bold text-slate-800">Apply Action</span> triggers live deployment scripts that simulate API-level actions, dynamically scaling underlying infrastructures and cutting current dashboard spend run rates!
            </div>
          </div>

          <div className="bg-emerald-500/10 p-5 rounded-2xl border border-emerald-100 text-xs text-emerald-800 space-y-2">
            <h4 className="font-bold text-[#001D58]">Commitment Term Analysis</h4>
            <p className="leading-relaxed">
              Purchasing Committed Use Discounts (CUD) or Reserved Instances (RIs) delivers maximum cost improvements for databases and compute nodes.
            </p>
            <span className="text-[10px] font-mono tracking-wider bg-emerald-500/10 text-emerald-700 px-2 py-0.5 rounded-full inline-block font-bold">1-Year Commit = ~37% Off</span>
          </div>
        </div>
      </div>
    </div>
  );
}
