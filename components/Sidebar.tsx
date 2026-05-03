import React, { useState, useRef, useEffect } from 'react';
import { LayoutGrid, Settings, CreditCard, LogOut, ChevronLeft, ChevronRight, User as UserIcon } from 'lucide-react';
import { User, signOut } from 'firebase/auth';
import { auth } from '../firebase';

interface SidebarProps {
  currentView: string;
  setView: (view: 'projects' | 'settings' | 'pricing' | 'workspace' | string) => void;
  user: User;
}

const Sidebar: React.FC<SidebarProps> = ({ currentView, setView, user }) => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  
  const handleSignOut = () => {
    signOut(auth);
  };

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const navItems = [
    { id: 'projects', label: 'Projects', icon: LayoutGrid }
  ];

  return (
    <div className={`relative ${isCollapsed ? 'w-20' : 'w-64'} bg-[#0f102e] border-r border-white/5 flex flex-col h-full flex-shrink-0 transition-all duration-300 z-50`}>
      <button
        onClick={() => setIsCollapsed(!isCollapsed)}
        title={isCollapsed ? "Expand Sidebar" : "Collapse Sidebar"}
        className="absolute top-[26px] -right-3.5 w-7 h-7 bg-[#0f102e] border border-white/10 rounded-full flex items-center justify-center text-gray-400 hover:text-white hover:bg-white/5 transition-colors z-50"
      >
        {isCollapsed ? <ChevronRight className="w-4 h-4 ml-0.5" /> : <ChevronLeft className="w-4 h-4 mr-0.5" />}
      </button>

      <div className={`p-6 flex items-center ${isCollapsed ? 'justify-center' : 'justify-start'}`}>
        <div className="flex items-center gap-3">
          <img src="/logo.png" alt="Songweaver Logo" className="w-8 h-8 object-contain shrink-0" onError={(e) => e.currentTarget.style.display = 'none'} />
          {!isCollapsed && <span className="text-xl font-bold tracking-tight text-white truncate">Songweaver</span>}
        </div>
      </div>

      <nav className="flex-1 px-4 flex flex-col gap-2 mt-2">
        {navItems.map((item) => {
          const isActive = currentView === item.id || (item.id === 'projects' && currentView === 'workspace');
          const Icon = item.icon;
          return (
            <button
              key={item.id}
              onClick={() => setView(item.id)}
              title={isCollapsed ? item.label : undefined}
              className={`flex items-center gap-3 py-3 rounded-xl text-sm font-medium transition-all ${
                isActive
                  ? 'bg-white/10 text-white shadow-sm'
                  : 'text-gray-400 hover:text-white hover:bg-white/5'
              } ${isCollapsed ? 'px-0 justify-center w-12 mx-auto' : 'px-4 w-full'}`}
            >
              <Icon className="w-5 h-5 shrink-0" />
              {!isCollapsed && <span>{item.label}</span>}
            </button>
          );
        })}
      </nav>

      <div className={`p-4 mt-auto border-t border-white/5 flex flex-col gap-3 ${isCollapsed ? 'items-center' : ''}`} ref={menuRef}>
        <div className="relative w-full">
          {isMenuOpen && (
            <div className={`absolute bottom-full mb-2 bg-[#1a1b3b] border border-white/10 rounded-xl shadow-lg shadow-black/50 overflow-hidden flex flex-col w-56 ${isCollapsed ? 'left-10' : 'left-0'}`}>
              <button
                onClick={() => {
                  setView('settings');
                  setIsMenuOpen(false);
                }}
                className="flex items-center gap-3 px-4 py-3 text-sm font-medium text-gray-300 hover:text-white hover:bg-white/5 transition-colors text-left"
              >
                <Settings className="w-4 h-4 shrink-0" />
                <span>Settings</span>
              </button>
              <button
                onClick={() => {
                  setView('pricing');
                  setIsMenuOpen(false);
                }}
                className="flex items-center gap-3 px-4 py-3 text-sm font-medium text-gray-300 hover:text-white hover:bg-white/5 transition-colors text-left"
              >
                <CreditCard className="w-4 h-4 shrink-0" />
                <span>Subscription</span>
              </button>
              <div className="h-px bg-white/5 my-1" />
              <button
                onClick={() => {
                  handleSignOut();
                  setIsMenuOpen(false);
                }}
                className="flex items-center gap-3 px-4 py-3 text-sm font-medium text-red-400 hover:text-red-300 hover:bg-red-500/10 transition-colors text-left"
              >
                <LogOut className="w-4 h-4 shrink-0" />
                <span>Sign Out</span>
              </button>
            </div>
          )}
          
          <button 
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className={`flex items-center hover:bg-white/5 rounded-xl transition-colors py-2 ${isCollapsed ? 'justify-center w-12 mx-auto' : 'gap-3 px-2 w-full'}`} 
            title={isCollapsed ? (user?.isAnonymous ? 'Guest Artist' : user?.email || '') : undefined}
          >
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-pink-600 to-pink-500 flex items-center justify-center overflow-hidden shrink-0">
               {user?.photoURL ? (
                  <img src={user.photoURL} alt="Avatar" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                ) : (
                  <UserIcon className="w-5 h-5 text-white" />
                )}
            </div>
            {!isCollapsed && (
              <div className="flex flex-col overflow-hidden text-left flex-1">
                 <span className="text-xs font-bold text-gray-400 uppercase tracking-wider truncate">
                    {user?.isAnonymous ? 'Guest Mode' : 'Account'}
                 </span>
                 <span className="text-sm font-semibold truncate text-white">
                    {user?.isAnonymous ? 'Guest Artist' : user?.email}
                 </span>
              </div>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default Sidebar;
