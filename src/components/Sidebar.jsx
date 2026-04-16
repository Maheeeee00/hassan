import { NavLink } from 'react-router-dom';
import { LayoutDashboard, Package, FileText, ShoppingCart, X } from 'lucide-react';

const navItems = [
  { to: '/', Icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/products', Icon: Package, label: 'Products' },
  { to: '/orders', Icon: ShoppingCart, label: 'Orders' },
  { to: '/invoices', Icon: FileText, label: 'Invoices' },
];

export default function Sidebar({ open, onClose }) {
  return (
    <>
      {/* Overlay for mobile */}
      {open && (
        <div
          className="fixed inset-0 bg-black/60 z-20 lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`
          fixed top-0 left-0 h-full w-64 z-30 flex flex-col
          bg-[#111111] border-r border-[#2a2a2a]
          transition-transform duration-300
          ${open ? 'translate-x-0' : '-translate-x-full'}
          lg:translate-x-0 lg:static lg:z-auto
        `}
      >
        {/* Logo */}
        <div className="flex items-center justify-between px-5 py-5 border-b border-[#2a2a2a]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-black border-2 border-[#c9a84c] flex items-center justify-center">
              <span className="text-[#c9a84c] font-bold text-lg leading-none" style={{ fontFamily: 'serif' }}>𝒞</span>
            </div>
            <div>
              <p className="text-[#c9a84c] font-bold text-sm tracking-widest uppercase">The</p>
              <p className="text-white font-bold text-base tracking-wide leading-tight">Customized</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="lg:hidden text-gray-400 hover:text-[#c9a84c] transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === '/'}
              onClick={onClose}
              className={({ isActive }) =>
                `flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all duration-200 group ${
                  isActive
                    ? 'bg-[#c9a84c] text-black'
                    : 'text-gray-400 hover:bg-[#1a1a1a] hover:text-[#c9a84c]'
                }`
              }
            >
              <item.Icon size={18} />
              <span>{item.label}</span>
            </NavLink>
          ))}
        </nav>

        {/* Footer */}
        <div className="px-5 py-4 border-t border-[#2a2a2a]">
          <p className="text-xs text-gray-600 text-center">The Customized &copy; 2026</p>
        </div>
      </aside>
    </>
  );
}
