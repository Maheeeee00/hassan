import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, User, Phone, Calendar, Package, Printer } from 'lucide-react';
import { useApp } from '../context/useApp';

const statusOptions = ['Pending', 'Processing', 'Shipped', 'Delivered'];

const statusColors = {
  Delivered: 'bg-green-900/30 text-green-400 border border-green-800',
  Processing: 'bg-blue-900/30 text-blue-400 border border-blue-800',
  Pending: 'bg-yellow-900/30 text-yellow-400 border border-yellow-800',
  Shipped: 'bg-purple-900/30 text-purple-400 border border-purple-800',
};

export default function OrderDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { orders, updateOrderStatus } = useApp();

  const order = orders.find(o => o.id === id);

  if (!order) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <p className="text-gray-400 font-medium">Order not found</p>
        <button onClick={() => navigate('/orders')} className="mt-4 text-[#c9a84c] text-sm hover:underline">
          ← Back to Orders
        </button>
      </div>
    );
  }

  const subtotal = order.items.reduce((s, i) => s + i.price * i.qty, 0);

  return (
    <div className="space-y-5 max-w-2xl">
      {/* Back */}
      <button
        onClick={() => navigate('/orders')}
        className="flex items-center gap-2 text-gray-400 hover:text-[#c9a84c] transition-colors text-sm"
      >
        <ArrowLeft size={16} />
        Back to Orders
      </button>

      {/* Header card */}
      <div className="bg-[#111111] border border-[#2a2a2a] rounded-2xl p-5">
        <div className="flex items-start justify-between flex-wrap gap-3 mb-4">
          <div>
            <h2 className="text-xl font-bold text-white">{order.id}</h2>
            <p className="text-sm text-gray-400 mt-0.5">Order Details</p>
          </div>
          <span className={`text-sm px-3 py-1 rounded-full font-medium ${statusColors[order.status]}`}>
            {order.status}
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="flex items-center gap-3 bg-[#1a1a1a] rounded-xl p-3">
            <User size={16} className="text-[#c9a84c]" />
            <div>
              <p className="text-xs text-gray-500">Customer</p>
              <p className="text-sm font-medium text-white">{order.customer}</p>
            </div>
          </div>
          <div className="flex items-center gap-3 bg-[#1a1a1a] rounded-xl p-3">
            <Phone size={16} className="text-[#c9a84c]" />
            <div>
              <p className="text-xs text-gray-500">Phone</p>
              <p className="text-sm font-medium text-white">{order.phone}</p>
            </div>
          </div>
          <div className="flex items-center gap-3 bg-[#1a1a1a] rounded-xl p-3">
            <Calendar size={16} className="text-[#c9a84c]" />
            <div>
              <p className="text-xs text-gray-500">Order Date</p>
              <p className="text-sm font-medium text-white">{order.date}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Update Status */}
      <div className="bg-[#111111] border border-[#2a2a2a] rounded-2xl p-5">
        <h3 className="font-semibold text-white mb-3">Update Status</h3>
        <div className="flex flex-wrap gap-2">
          {statusOptions.map(s => (
            <button
              key={s}
              onClick={() => updateOrderStatus(order.id, s)}
              className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors ${
                order.status === s
                  ? 'bg-[#c9a84c] text-black'
                  : 'bg-[#1a1a1a] border border-[#2a2a2a] text-gray-400 hover:border-[#c9a84c]/40'
              }`}
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      {/* Order Items */}
      <div className="bg-[#111111] border border-[#2a2a2a] rounded-2xl overflow-hidden">
        <div className="px-5 py-4 border-b border-[#2a2a2a]">
          <h3 className="font-semibold text-white">Order Items</h3>
        </div>
        <div className="divide-y divide-[#2a2a2a]">
          {order.items.map((item, idx) => (
            <div key={idx} className="flex items-center justify-between px-5 py-3.5">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-[#1a1a1a] flex items-center justify-center">
                  <Package size={16} className="text-[#c9a84c]" />
                </div>
                <div>
                  <p className="text-sm font-medium text-white">{item.name}</p>
                  <p className="text-xs text-gray-500">Qty: {item.qty}</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-sm font-semibold text-[#c9a84c]">Rs. {(item.price * item.qty).toLocaleString()}</p>
                <p className="text-xs text-gray-500">Rs. {item.price.toLocaleString()} each</p>
              </div>
            </div>
          ))}
        </div>

        {/* Summary */}
        <div className="px-5 py-4 bg-[#1a1a1a] border-t border-[#2a2a2a] space-y-2">
          <div className="flex justify-between text-sm text-gray-400">
            <span>Subtotal</span>
            <span>Rs. {subtotal.toLocaleString()}</span>
          </div>
          <div className="flex justify-between font-bold text-white border-t border-[#2a2a2a] pt-2 mt-2">
            <span>Total</span>
            <span className="text-[#c9a84c] text-lg">Rs. {order.total.toLocaleString()}</span>
          </div>
        </div>
      </div>

      {/* Print Button */}
      <button
        onClick={() => window.print()}
        className="w-full flex items-center justify-center gap-2 border border-[#c9a84c]/30 text-[#c9a84c] py-3 rounded-2xl text-sm font-medium hover:bg-[#c9a84c]/10 transition-colors"
      >
        <Printer size={16} />
        Print Order Details
      </button>
    </div>
  );
}
