import React from 'react';
import { LucideIcon } from 'lucide-react';

interface StatCardProps {
  title: string;
  value: string;
  icon: LucideIcon;
  colorClass: string; 
  trend?: string;
}

export const StatCard: React.FC<StatCardProps> = ({ title, value, icon: Icon, colorClass, trend }) => {
  // Mapping colors to Dark Palette
  
  let iconColor = 'text-[#94A3B8] bg-[#1E293B]'; // Default dark slate
  
  if (colorClass.includes('indigo')) iconColor = 'text-[#6366F1] bg-[#1E1B4B]'; // Indigo Light on Very Dark Blue
  if (colorClass.includes('emerald')) iconColor = 'text-[#61CE70] bg-[#064E3B]'; // Green on Dark Green
  if (colorClass.includes('amber')) iconColor = 'text-[#FBBF24] bg-[#451A03]'; // Amber on Dark Brown
  if (colorClass.includes('slate')) iconColor = 'text-[#CBD5E1] bg-[#1E293B]'; // Slate on Dark Slate

  return (
    <div className="neu-flat p-6 flex items-start justify-between hover:shadow-lg transition-shadow duration-300 bg-[#151E32]">
      <div>
        <p className="text-xs font-bold text-[#94A3B8] mb-2 uppercase tracking-wide font-roboto">{title}</p>
        <h3 className="text-2xl font-bold text-[#E2E8F0] font-roboto-slab">{value}</h3>
        {trend && <p className="text-xs text-[#94A3B8] mt-2 font-medium bg-[#1E293B] inline-block px-2 py-0.5 rounded border border-[#2D3748]">{trend}</p>}
      </div>
      <div className={`w-12 h-12 rounded-md flex items-center justify-center border border-white/5 ${iconColor}`}>
        <Icon className="w-6 h-6" />
      </div>
    </div>
  );
};