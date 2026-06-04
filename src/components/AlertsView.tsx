import React, { useState } from 'react';
import { ShieldAlert, Check, Clock, Radio, Activity, Zap, Play } from 'lucide-react';
import { Alert } from '../types';

interface AlertsViewProps {
  alerts: Alert[];
  onRefresh: () => void;
}

export default function AlertsView({ alerts, onRefresh }: AlertsViewProps) {
  const [simulating, setSimulating] = useState<boolean>(false);
  const [acknowledgingId, setAcknowledgingId] = useState<string | null>(null);

  const handleAcknowledge = async (id: string) => {
    setAcknowledgingId(id);
    try {
      const res = await fetch(`/api/alerts/${id}/acknowledge`, { method: 'POST' });
      if (res.ok) {
        onRefresh();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setAcknowledgingId(null);
    }
  };

  const handleTriggerAnomaly = async () => {
    setSimulating(true);
    try {
      const res = await fetch('/api/alerts/simulate', { method: 'POST' });
      if (res.ok) {
        onRefresh();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSimulating(false);
    }
  };

  const activeAlerts = alerts.filter(a => a.status === 'active');
  const acknowledgedAlerts = alerts.filter(a => a.status === 'acknowledged');

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center p-4 sm:p-6 bg-[#001D58] rounded-2xl border border-blue-900 shadow-md gap-4">
        <div>
          <span className="text-xs text-[#00F19C] font-mono font-bold tracking-widest uppercase block mb-1">Interactive Sandbox Environment</span>
          <h2 className="text-lg font-bold text-white tracking-tight">Anomaly & Incident Response Chamber</h2>
          <p className="text-xs text-slate-350 mt-1">Simulate real-time cost spikes from MultiCloud to observe live anomaly capture.</p>
        </div>

        <button
          onClick={handleTriggerAnomaly}
          disabled={simulating}
          className="flex items-center gap-2 bg-[#00F19C] text-[#001D58] hover:bg-[#00F19C]/90 font-bold px-4 py-2.5 rounded-xl transition-all text-xs shadow-md shadow-emerald-900/10 active:scale-95 disabled:opacity-50"
        >
          <Activity size={14} className={simulating ? 'animate-pulse' : ''} />
          {simulating ? 'Synthesizing Spike...' : 'Simulate Spend Anomaly'}
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-4">
          <div className="flex justify-between items-center px-2">
            <span className="text-xs font-bold text-gray-400 uppercase tracking-wider flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-rose-500 animate-ping" />
              Active System Triggers ({activeAlerts.length})
            </span>
          </div>

          {activeAlerts.length === 0 ? (
            <div className="p-12 text-center bg-white rounded-2xl border border-gray-100 flex flex-col items-center justify-center">
              <div className="p-3 bg-emerald-50 text-emerald-500 rounded-full mb-3">
                <Check size={24} />
              </div>
              <h3 className="font-bold text-[#001D58] text-sm">System Margins Fully Healthy</h3>
              <p className="text-xs text-gray-500 mt-1 max-w-sm">No spend leakage or active anomalies reported. Run a manual anomaly simulation to test active response rules.</p>
            </div>
          ) : (
            activeAlerts.map(alert => (
              <div key={alert.id} className="p-5 bg-white rounded-2xl border-l-4 border-l-rose-500 border-y border-r border-gray-100 shadow-xs flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between transition-all hover:shadow-xs">
                <div className="flex gap-3.5 items-start">
                  <div className={`p-2.5 rounded-xl mt-0.5 ${alert.severity === 'CRITICAL' ? 'bg-rose-50 text-rose-500' : 'bg-amber-50 text-amber-500'}`}>
                    <ShieldAlert size={18} />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full font-mono ${alert.severity === 'CRITICAL' ? 'bg-rose-100 text-rose-700' : 'bg-amber-100 text-amber-700'}`}>
                        {alert.severity}
                      </span>
                      <span className="text-[10px] uppercase font-bold tracking-widest text-gray-400 font-mono">{alert.category} Trigger</span>
                    </div>
                    <h4 className="font-bold text-[#001D58] text-sm mt-1">{alert.title}</h4>
                    <p className="text-xs text-gray-500 mt-1 leading-relaxed">{alert.message}</p>
                    <div className="flex items-center gap-4 mt-3 text-[10px] text-gray-400 font-mono">
                      <span className="flex items-center gap-1"><Clock size={11} /> {new Date(alert.createdAt).toLocaleTimeString()}</span>
                      {alert.value && <span className="font-bold text-gray-650">Observed Value: ${alert.value.toLocaleString()}</span>}
                    </div>
                  </div>
                </div>

                <button
                  onClick={() => handleAcknowledge(alert.id)}
                  disabled={acknowledgingId === alert.id}
                  className="w-full sm:w-auto px-4 py-2 bg-gray-50 hover:bg-gray-100 text-gray-700 font-semibold text-xs rounded-xl flex items-center justify-center gap-1.5 transition-all cursor-pointer whitespace-nowrap active:scale-95 border border-gray-100"
                >
                  <Check size={13} />
                  Acknowledge
                </button>
              </div>
            ))
          )}

          {/* Historic Acknowledged Section */}
          {acknowledgedAlerts.length > 0 && (
            <div className="pt-4 space-y-3">
              <span className="text-xs font-bold text-gray-400 uppercase tracking-wider block px-2">Recently Resolved ({acknowledgedAlerts.length})</span>
              {acknowledgedAlerts.map(alert => (
                <div key={alert.id} className="p-4 bg-gray-55 bg-white/70 rounded-2xl border border-gray-100 opacity-60 flex gap-3 text-xs items-center justify-between">
                  <div className="flex gap-2.5 items-center">
                    <Check className="text-emerald-500 w-4 h-4 shrink-0" />
                    <div>
                      <h5 className="font-semibold text-gray-600 line-through">{alert.title}</h5>
                      <span className="text-[10px] text-gray-400 mt-0.5 font-mono">Acknowledged and archived</span>
                    </div>
                  </div>
                  <span className="text-[10px] text-gray-450 font-mono">{new Date(alert.createdAt).toLocaleDateString()}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Sidebar Rules Info Card */}
        <div className="bg-gray-50 rounded-2xl p-5 border border-gray-100 text-xs">
          <h3 className="font-bold text-[#001D58] mb-3 text-sm flex items-center gap-1.5">
            <Radio size={16} className="text-[#001D58]" /> Real-time Ingestion Rules
          </h3>
          <p className="text-gray-500 leading-relaxed mb-4">
            CloudOps constantly monitors cloud-level billing APIs structure (such as AWS Cost Export, S3 CUR formats, or Azure Enterprise Agreement portals) mapping real resources automatically.
          </p>
          
          <div className="space-y-3 bg-white p-4 rounded-xl border border-gray-100/80">
            <div className="flex justify-between items-center font-semibold">
              <span className="text-gray-500">Anomaly Baseline</span>
              <span className="text-gray-700">MTD rate +2.5σ</span>
            </div>
            <div className="h-px bg-gray-100" />
            <div className="flex justify-between items-center font-semibold">
              <span className="text-gray-500">Auto-Remediation</span>
              <span className="text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full text-[10px]">Active</span>
            </div>
            <div className="h-px bg-gray-100" />
            <div className="flex justify-between items-center font-semibold">
              <span className="text-gray-500">Slack SlackHook</span>
              <span className="text-gray-500">Enabled</span>
            </div>
          </div>

          <div className="mt-5 p-4 bg-emerald-50/50 rounded-xl border border-emerald-100 text-[11px] leading-relaxed text-emerald-800">
            <span className="font-bold">FinOps Tip:</span> Spot computations default back to higher standard rates when cluster loads run high. Toggle "Purchase Reserved Instances" in the Recommendations panel to insulate core clusters from market rate swings completely.
          </div>
        </div>
      </div>
    </div>
  );
}
