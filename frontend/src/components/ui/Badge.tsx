import React from 'react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function Badge({ children, status, className }: { children: React.ReactNode; status?: string; className?: string }) {
  let colorClass = 'bg-gray-100 text-gray-800 border-gray-200';
  
  if (status) {
    const s = status.toLowerCase();
    if (s === 'available' || s === 'completed') colorClass = 'bg-emerald-100 text-emerald-800 border-emerald-200';
    else if (s === 'on trip' || s === 'dispatched') colorClass = 'bg-blue-100 text-blue-800 border-blue-200';
    else if (s === 'in shop' || s === 'draft') colorClass = 'bg-amber-100 text-amber-800 border-amber-200';
    else if (s === 'suspended' || s === 'retired') colorClass = 'bg-red-100 text-red-800 border-red-200';
  }

  return (
    <span className={cn('inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border', colorClass, className)}>
      {children}
    </span>
  );
}
