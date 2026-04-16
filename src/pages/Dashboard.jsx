import { Package, ShoppingCart, FileText, TrendingUp, ArrowUpRight } from 'lucide-react';
import { useApp } from '../context/useApp';
import { useNavigate } from 'react-router-dom';

const statusColors = {
  Delivered: 'bg-green-900/30 text-green-400 border border-green-800',
  Processing: 'bg-blue-900/30 text-blue-400 border border-blue-800',
  Pending: 'bg-yellow-900/30 text-yellow-400 border border-yellow-800',
  Shipped: 'bg-purple-900/30 text-purple-400 border border-purple-800',
};

export default function Dashboard() {
  const { products, orders } = useApp();
  const navigate = useNavigate();

  const totalRevenue = orders.reduce((s, o) => s + o.total, 0);
  const deliveredOrders = orders.filter(o => o.status === 'Delivered').length;

  const stats = [
    { label: 'Total Products', value: products.length, Icon: Package, change: '+2 this week', to: '/products' },
    { label: 'Total Orders', value: orders.length, Icon: ShoppingCart, change: '+4 this week', to: '/orders' },
    { label: 'Revenue', value: `Rs. ${totalRevenue.toLocaleString()}`, Icon: TrendingUp, change: '+12% this month', to: '/invoices' },
    { label: 'Delivered', value: deliveredOrders, Icon: FileText, change: `of ${orders.length} orders`, to: '/orders' },
  ];

  return (
    <div className="space-y-6">
      {/* Welcome */}
      <div className="bg-[#111111] border border-[#2a2a2a] rounded-2xl px-6 py-5 flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-white">Welcome back, Admin</h2>
          <p className="text-sm text-gray-400 mt-1">Here's what's happening with The Customized today.</p>
        </div>
        <div className="hidden sm:flex w-14 h-14 rounded-full bg-black border-2 border-[#c9a84c] items-center justify-center">
          <span className="text-[#c9a84c] text-2xl font-bold" style={{ fontFamily: 'serif' }}>𝒞</span>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat) => (
          <button
            key={stat.label}
            onClick={() => navigate(stat.to)}
            className="bg-[#111111] border border-[#2a2a2a] rounded-2xl p-4 text-left hover:border-[#c9a84c] transition-all duration-200 group"
          >
            <div className="flex items-center justify-between mb-3">
              <div className="w-10 h-10 rounded-xl bg-[#c9a84c]/10 flex items-center justify-center">
                <stat.Icon size={18} className="text-[#c9a84c]" />
              </div>
              <ArrowUpRight size={14} className="text-gray-600 group-hover:text-[#c9a84c] transition-colors" />
            </div>
            <p className="text-2xl font-bold text-white">{stat.value}</p>
            <p className="text-xs text-gray-400 mt-1">{stat.label}</p>
            <p className="text-xs text-[#c9a84c] mt-1">{stat.change}</p>
          </button>
        ))}
      </div>

      {/* Recent Orders */}
      <div className="bg-[#111111] border border-[#2a2a2a] rounded-2xl overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-[#2a2a2a]">
          <h3 className="font-semibold text-white">Recent Orders</h3>
          <button
            onClick={() => navigate('/orders')}
            className="text-xs text-[#c9a84c] hover:text-[#e8c96a] transition-colors"
          >
            View all →
          </button>
        </div>
        <div className="divide-y divide-[#2a2a2a]">
          {orders.slice(0, 4).map(order => (
            <div
              key={order.id}
              onClick={() => navigate(`/orders/${order.id}`)}
              className="flex items-center justify-between px-5 py-3 hover:bg-[#1a1a1a] cursor-pointer transition-colors"
            >
              <div>
                <p className="text-sm font-medium text-white">{order.customer}</p>
                <p className="text-xs text-gray-500">{order.id} · {order.date}</p>
              </div>
              <div className="text-right">
                <p className="text-sm font-semibold text-[#c9a84c]">Rs. {order.total.toLocaleString()}</p>
                <span className={`text-xs px-2 py-0.5 rounded-full ${statusColors[order.status]}`}>
                  {order.status}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
