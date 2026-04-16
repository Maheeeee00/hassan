import { useState } from 'react';
import { Search, Eye, ChevronRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../context/useApp';

const statusColors = {
  Delivered: 'bg-green-900/30 text-green-400 border border-green-800',
  Processing: 'bg-blue-900/30 text-blue-400 border border-blue-800',
  Pending: 'bg-yellow-900/30 text-yellow-400 border border-yellow-800',
  Shipped: 'bg-purple-900/30 text-purple-400 border border-purple-800',
};

const statusOptions = ['All', 'Pending', 'Processing', 'Shipped', 'Delivered'];

export default function Orders() {
  const { orders } = useApp();
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');

  const filtered = orders.filter(o => {
    const matchSearch = o.customer.toLowerCase().includes(search.toLowerCase()) || o.id.toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === 'All' || o.status === statusFilter;
    return matchSearch && matchStatus;
  });

  return (
    <div className="space-y-5">
      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search orders..."
            className="w-full bg-[#111111] border border-[#2a2a2a] text-white rounded-xl pl-9 pr-4 py-2.5 text-sm focus:outline-none focus:border-[#c9a84c] placeholder-gray-600 transition-colors"
          />
        </div>
        <div className="flex gap-2 overflow-x-auto pb-1">
          {statusOptions.map(s => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={`whitespace-nowrap px-3 py-2 rounded-xl text-xs font-medium transition-colors ${
                statusFilter === s
                  ? 'bg-[#c9a84c] text-black'
                  : 'bg-[#111111] border border-[#2a2a2a] text-gray-400 hover:border-[#c9a84c]/40'
              }`}
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      <p className="text-xs text-gray-500">{filtered.length} order{filtered.length !== 1 ? 's' : ''}</p>

      {/* Orders List */}
      <div className="bg-[#111111] border border-[#2a2a2a] rounded-2xl overflow-hidden">
        {filtered.length === 0 ? (
          <div className="py-16 text-center text-gray-500">No orders found</div>
        ) : (
          <>
            {/* Desktop Table Header */}
            <div className="hidden md:grid md:grid-cols-5 px-5 py-3 border-b border-[#2a2a2a] text-xs text-gray-500 font-medium uppercase tracking-wider">
              <span>Order ID</span>
              <span>Customer</span>
              <span>Date</span>
              <span>Total</span>
              <span>Status</span>
            </div>

            <div className="divide-y divide-[#2a2a2a]">
              {filtered.map(order => (
                <div
                  key={order.id}
                  onClick={() => navigate(`/orders/${order.id}`)}
                  className="flex items-center justify-between md:grid md:grid-cols-5 px-5 py-3.5 hover:bg-[#1a1a1a] cursor-pointer transition-colors group"
                >
                  {/* Mobile layout */}
                  <div className="flex-1 md:hidden">
                    <div className="flex items-center justify-between mb-1">
                      <p className="text-sm font-semibold text-white">{order.customer}</p>
                      <span className={`text-xs px-2 py-0.5 rounded-full ${statusColors[order.status]}`}>
                        {order.status}
                      </span>
                    </div>
                    <p className="text-xs text-gray-500">{order.id} · {order.date}</p>
                    <p className="text-sm font-bold text-[#c9a84c] mt-1">Rs. {order.total.toLocaleString()}</p>
                  </div>
                  <ChevronRight size={14} className="text-gray-600 group-hover:text-[#c9a84c] transition-colors md:hidden" />

                  {/* Desktop layout */}
                  <span className="hidden md:block text-sm text-[#c9a84c] font-medium">{order.id}</span>
                  <span className="hidden md:block text-sm text-white">{order.customer}</span>
                  <span className="hidden md:block text-sm text-gray-400">{order.date}</span>
                  <span className="hidden md:block text-sm font-semibold text-[#c9a84c]">Rs. {order.total.toLocaleString()}</span>
                  <span className={`hidden md:inline-flex text-xs px-2.5 py-1 rounded-full w-fit ${statusColors[order.status]}`}>
                    {order.status}
                  </span>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
