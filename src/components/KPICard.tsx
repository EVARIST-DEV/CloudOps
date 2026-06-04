import React from 'react';
import { TrendingUp, TrendingDown, DollarSign } from 'lucide-react';

interface KPICardProps {
  title: string;
  value: string;
  subtext?: string;
  delta?: string | number;
  trend?: 'up' | 'down' | 'neutral';
  accent?: boolean;
}

export default function KPICard({ title, value, subtext, delta, trend, accent }: KPICardProps) {
  return (
    <div className={`p-4 sm:p-5 rounded-2xl bg-white border border-gray-100 shadow-xs relative overflow-hidden transition-all duration-300 hover:shadow-md hover:border-gray-200/80 ${accent ? 'after:content-[""] after:absolute after:left-0 after:top-0 after:bottom-0 after:w-[4px] after:bg-emerald-500' : ''}`}>
      <span className="text-[10px] md:text-xs font-semibold text-gray-400 uppercase tracking-wider block mb-2 truncate" title={title}>{title}</span>
      <div className="flex flex-col xs:flex-row xs:items-baseline justify-between gap-1.5">
        <h3 className="text-xl sm:text-2xl lg:text-3xl font-black text-[#001D58] tracking-tight truncate" title={value}>{value}</h3>
        {delta && (
          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1 self-start xs:self-auto shrink-0 ${
            trend === 'down' 
              ? 'bg-emerald-50 text-emerald-600' 
              : 'bg-rose-50 text-rose-500'
          }`}>
            {trend === 'down' ? <TrendingDown size={10} /> : <TrendingUp size={10} />}
            {delta}
          </span>
        )}
      </div>
      {subtext && <p className="text-[10px] sm:text-xs text-gray-400 mt-2 font-mono truncate" title={subtext}>{subtext}</p>}
    </div>
  );
}
