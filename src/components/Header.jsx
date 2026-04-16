import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Menu, MoreVertical, LayoutDashboard, Package, ShoppingCart, FileText } from 'lucide-react';

const menuItems = [
  { to: '/', Icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/products', Icon: Package, label: 'Products' },
  { to: '/orders', Icon: ShoppingCart, label: 'Orders' },
  { to: '/invoices', Icon: FileText, label: 'Invoices' },
];

export default function Header({ onMenuClick, title }) {
  const [dotsOpen, setDotsOpen] = useState(false);
  const dotsRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    function handleClickOutside(e) {
      if (dotsRef.current && !dotsRef.current.contains(e.target)) {
        setDotsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <header className="h-16 flex items-center justify-between px-4 lg:px-6 border-b border-[#2a2a2a] bg-[#111111] sticky top-0 z-10">
      {/* Left: hamburger (mobile) + title */}
      <div className="flex items-center gap-3">
        <button
          onClick={onMenuClick}
          className="lg:hidden text-gray-400 hover:text-[#c9a84c] transition-colors"
        >
          <Menu size={22} />
        </button>
        <div className="flex items-center gap-2 lg:hidden">
          <div className="w-7 h-7 rounded-full bg-black border border-[#c9a84c] flex items-center justify-center">
            <span className="text-[#c9a84c] font-bold text-sm leading-none" style={{ fontFamily: 'serif' }}>𝒞</span>
          </div>
          <span className="text-white font-semibold text-sm">The Customized</span>
        </div>
        <h1 className="hidden lg:block text-white font-semibold text-lg">{title}</h1>
      </div>

      {/* Right: 3-dots menu (mobile only) */}
      <div className="relative lg:hidden" ref={dotsRef}>
        <button
          onClick={() => setDotsOpen(v => !v)}
          className="text-gray-400 hover:text-[#c9a84c] transition-colors p-1"
        >
          <MoreVertical size={22} />
        </button>

        {dotsOpen && (
          <div className="absolute right-0 top-10 w-52 bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl shadow-2xl overflow-hidden z-50">
            <div className="px-4 py-3 border-b border-[#2a2a2a]">
              <p className="text-xs text-[#c9a84c] font-semibold uppercase tracking-widest">Navigation</p>
            </div>
            {menuItems.map((item) => (
              <button
                key={item.to}
                onClick={() => { navigate(item.to); setDotsOpen(false); }}
                className="w-full flex items-center gap-3 px-4 py-3 text-sm text-gray-300 hover:bg-[#2a2a2a] hover:text-[#c9a84c] transition-colors"
              >
                <item.Icon size={16} className="text-[#c9a84c]" />
                {item.label}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Desktop right side */}
      <div className="hidden lg:flex items-center gap-3">
        <div className="text-right">
          <p className="text-sm font-medium text-white">Admin</p>
          <p className="text-xs text-[#c9a84c]">The Customized</p>
        </div>
        <div className="w-9 h-9 rounded-full bg-black border-2 border-[#c9a84c] flex items-center justify-center">
          <span className="text-[#c9a84c] font-bold text-base leading-none" style={{ fontFamily: 'serif' }}>A</span>
        </div>
      </div>
    </header>
  );
}
