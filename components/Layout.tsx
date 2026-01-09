import React from 'react';
import { NavLink } from 'react-router-dom';
import { LayoutDashboard, PlusCircle, CheckSquare, Settings, LogOut, FileUp } from 'lucide-react';

interface LayoutProps {
  children: React.ReactNode;
}

export const Layout: React.FC<LayoutProps> = ({ children }) => {
  const navItems = [
    { label: 'Dashboard', icon: LayoutDashboard, path: '/' },
    { label: 'Lançamento', icon: PlusCircle, path: '/entry' },
    { label: 'Baixas', icon: CheckSquare, path: '/settlement' },
    { label: 'Importar', icon: FileUp, path: '/import' },
  ];

  return (
    <div className="flex min-h-screen text-[#E2E8F0] font-sans bg-[#0B1120]">
      {/* Sidebar - Dark Corporate Style */}
      <aside className="w-64 flex flex-col fixed inset-y-0 left-0 z-20 bg-[#151E32] border-r border-[#2D3748]">
        <div className="h-full flex flex-col">
            <div className="h-20 flex items-center px-6 border-b border-[#2D3748]">
                <div className="w-10 h-10 bg-[#1A3375] rounded-md flex items-center justify-center mr-3 text-white shadow-md shadow-black/20">
                    <span className="font-roboto-slab font-bold text-xl">P</span>
                </div>
                <span className="font-roboto-slab font-bold text-xl tracking-tight text-[#61CE70]">Patrimonium</span>
            </div>

            <nav className="flex-1 px-4 py-8 space-y-2">
            {navItems.map((item) => (
                <NavLink
                key={item.path}
                to={item.path}
                className={({ isActive }) =>
                    `flex items-center px-4 py-3 rounded-md text-sm font-medium transition-all duration-200 ${
                    isActive
                        ? 'bg-[#1A3375] text-white shadow-lg shadow-[#1A3375]/20 transform translate-x-1'
                        : 'text-[#94A3B8] hover:bg-[#1E293B] hover:text-[#61CE70]'
                    }`
                }
                >
                <item.icon className={`w-5 h-5 mr-3 ${ ({ isActive }:any) => isActive ? 'text-white' : 'text-[#94A3B8]'}`} />
                {item.label}
                </NavLink>
            ))}
            </nav>

            <div className="p-4 border-t border-[#2D3748]">
            <button className="flex items-center w-full px-4 py-2 text-sm font-medium text-[#94A3B8] hover:text-[#61CE70] hover:bg-[#1E293B] transition-colors rounded-md">
                <Settings className="w-5 h-5 mr-3" />
                Configurações
            </button>
            <button className="flex items-center w-full px-4 py-2 mt-1 text-sm font-medium text-[#EF4444] hover:bg-[#2D1A1A] transition-colors rounded-md">
                <LogOut className="w-5 h-5 mr-3" />
                Sair
            </button>
            </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 ml-64 p-8 overflow-y-auto h-screen bg-[#0B1120]">
        <div className="max-w-[1200px] mx-auto pb-8">
            {children}
        </div>
      </main>
    </div>
  );
};