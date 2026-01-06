import React from 'react';
import { UserRole } from '../types';
import { Utensils, LogOut, ChevronRight } from 'lucide-react';

interface LayoutProps {
  children: React.ReactNode;
  role: UserRole;
  onLogout: () => void;
}

export const Layout: React.FC<LayoutProps> = ({ children, role, onLogout }) => {
  return (
    <div className="min-h-screen bg-gray-50 selection:bg-primary-100 selection:text-primary-900 relative">
      {/* Abstract Background Decoration */}
      <div className="fixed top-0 left-0 right-0 h-[500px] bg-gradient-to-b from-primary-50/80 via-white to-transparent -z-10 pointer-events-none" />
      <div className="fixed top-0 right-0 w-[500px] h-[500px] bg-indigo-200/20 blur-[100px] rounded-full -z-10 pointer-events-none" />
      <div className="fixed bottom-0 left-0 w-[500px] h-[500px] bg-blue-200/10 blur-[100px] rounded-full -z-10 pointer-events-none" />

      <nav className="bg-white/70 backdrop-blur-xl border-b border-white/50 sticky top-0 z-50 shadow-[0_4px_30px_rgba(0,0,0,0.03)]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center gap-3">
              <div className="bg-gradient-to-br from-primary-600 to-indigo-700 p-2.5 rounded-xl shadow-lg shadow-primary-500/20">
                <Utensils className="h-5 w-5 text-white" />
              </div>
              <div>
                <span className="text-xl font-extrabold text-gray-900 tracking-tight leading-none block">SmartQueue</span>
                <span className="text-[10px] font-bold text-primary-600 tracking-wider uppercase leading-none block">Canteen OS</span>
              </div>
            </div>
            
            <div className="flex items-center gap-4">
                {role !== UserRole.NONE && (
                     <div className="flex items-center gap-2 px-3 py-1.5 bg-gray-100/50 border border-gray-200 rounded-full">
                        <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
                        <span className="text-xs font-semibold text-gray-600 uppercase tracking-wide">
                            {role} Portal
                        </span>
                    </div>
                )}
                {role !== UserRole.NONE && (
                    <button 
                        onClick={onLogout}
                        className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        title="Sign Out"
                    >
                        <LogOut size={18} />
                    </button>
                )}
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-fade-in">
        {children}
      </main>
    </div>
  );
};