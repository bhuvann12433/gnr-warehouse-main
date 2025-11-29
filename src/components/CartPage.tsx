import React from "react";
import { ArrowLeft, Trash2 } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface CartItem {
  id: string;
  name: string;
  qty: number;
  unitPrice: number;
}

interface CartPageProps {
  cart: Record<string, CartItem>;
  updateCart: (id: string, qty: number) => void;
  removeFromCart: (id: string) => void;
}

const CartPage: React.FC<CartPageProps> = ({ cart, updateCart, removeFromCart }) => {
  const navigate = useNavigate();
  const items = Object.values(cart);

  const subtotal = items.reduce(
    (sum, item) => sum + item.qty * item.unitPrice,
    0
  );

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate(-1)} className="p-2 hover:bg-gray-100 rounded">
            <ArrowLeft />
          </button>
          <h1 className="text-2xl font-bold">Cart</h1>
        </div>

        <button
          onClick={() => navigate("/invoice")}
          className="bg-blue-600 text-white px-4 py-2 rounded"
        >
          Proceed to Invoice
        </button>
      </div>

      {/* Empty cart */}
      {items.length === 0 ? (
        <div className="text-center py-10 text-gray-500">Your cart is empty.</div>
      ) : (
        <div className="bg-white border rounded-lg shadow p-4">
          {items.map((item) => (
            <div
              key={item.id}
              className="flex items-center justify-between py-3 border-b last:border-b-0"
            >
              <div>
                <div className="font-medium">{item.name}</div>
                <div className="text-sm text-gray-600">₹{item.unitPrice}</div>
              </div>

              <div className="flex items-center gap-3">
                {/* - Button */}
                <button
                  onClick={() => updateCart(item.id, item.qty - 1)}
                  className="px-3 py-1 bg-red-500 text-white rounded text-xl"
                >
                  –
                </button>

                {/* Qty */}
                <span className="text-lg font-semibold">{item.qty}</span>

                {/* + Button */}
                <button
                  onClick={() => updateCart(item.id, item.qty + 1)}
                  className="px-3 py-1 bg-green-600 text-white rounded text-xl"
                >
                  +
                </button>

                {/* Delete */}
                <button
                  onClick={() => removeFromCart(item.id)}
                  className="text-red-600 hover:text-red-800 p-2"
                >
                  <Trash2 />
                </button>
              </div>
            </div>
          ))}

          {/*Subtotal*/}
          <div className="text-right text-xl font-semibold mt-4">
            Subtotal: ₹{subtotal}
          </div>
        </div>
      )}
    </div>
  );
};

export default CartPage;
