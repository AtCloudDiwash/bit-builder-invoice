"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import Dialog from "../components/Dialog"; // Import the Dialog component

// Define types
interface Category {
  id: number;
  name: string;
  tax_rate: number;
}

interface CartItem {
  name: string;
  quantity: number;
  price: number;
  category: Category;
  total: number;
  tax: number;
}

export default function CashierPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  
  // Form state
  const [itemName, setItemName] = useState("");
  const [quantity, setQuantity] = useState("1");
  const [price, setPrice] = useState("");
  const [categoryId, setCategoryId] = useState("");

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  // Fetch categories
  useEffect(() => {
    const fetchCategories = async () => {
      setLoading(true);
      const { data, error } = await supabase.from("categories").select("*").order('name');
      if (error) {
        setError(error.message);
      } else {
        setCategories(data as Category[]);
        if (data && data.length > 0) {
            setCategoryId(data[0].id.toString());
        }
      }
      setLoading(false);
    };
    fetchCategories();
  }, []);

  const resetForm = () => {
    setItemName("");
    setQuantity("1");
    setPrice("");
    if (categories.length > 0) {
      setCategoryId(categories[0].id.toString());
    }
  };

  const resetAllFields = () => {
    resetForm();
    setCart([]);
  };

  const handleAddItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!itemName || !quantity || !price || !categoryId) return;

    const selectedCategory = categories.find(c => c.id === parseInt(categoryId))!;
    const itemPrice = parseFloat(price);
    const itemQuantity = parseInt(quantity);
    const taxRate = selectedCategory.tax_rate;
    const itemTax = itemPrice * itemQuantity * taxRate;

    const newItem: CartItem = {
        name: itemName,
        quantity: itemQuantity,
        price: itemPrice,
        category: selectedCategory,
        total: itemPrice * itemQuantity + itemTax,
        tax: itemTax,
    };

    setCart([...cart, newItem]);
    resetForm();
  };

  const handleDeleteItem = (indexToRemove: number) => {
    setCart(cart.filter((_, index) => index !== indexToRemove));
  };
  
  const subtotal = cart.reduce((acc, item) => acc + item.price * item.quantity, 0);
  const totalTax = cart.reduce((acc, item) => acc + item.tax, 0);
  const grandTotal = subtotal + totalTax;

  const handleCheckout = async () => {
    if (cart.length === 0) return;

    const { data: invoiceData, error: invoiceError } = await supabase
      .from("invoices")
      .insert({ total_amount: grandTotal, total_tax: totalTax })
      .select()
      .single();
    
    if (invoiceError || !invoiceData) {
        setError(invoiceError?.message || "Failed to create invoice.");
        return;
    }

    const invoiceItems = cart.map(item => ({
        invoice_id: invoiceData.id,
        item_name: item.name,
        quantity: item.quantity,
        price_per_item: item.price,
        category_id: item.category.id,
        tax: item.tax,
    }));

    const { error: itemsError } = await supabase.from("invoice_items").insert(invoiceItems);
    if (itemsError) {
        setError(itemsError.message);
        return;
    }
    
    generatePdf(invoiceData.id);
    setIsDialogOpen(true);
  };

  const generatePdf = (invoiceId: number) => {
    const doc = new jsPDF();
    doc.text("Invoice", 20, 20);
    doc.text(`Invoice ID: ${invoiceId}`, 20, 30);
    doc.text(`Date: ${new Date().toLocaleDateString()}`, 20, 40);
    autoTable(doc, {
        startY: 50,
        head: [['Item', 'Category', 'Qty', 'Price', 'Tax', 'Total']],
        body: cart.map(item => [
            item.name,
            item.category.name,
            item.quantity,
            `$${item.price.toFixed(2)}`,
            `$${item.tax.toFixed(2)}`,
            `$${item.total.toFixed(2)}`,
        ]),
    });
    const finalY = (doc as any).lastAutoTable.finalY || 100;
    doc.text(`Subtotal: $${subtotal.toFixed(2)}`, 140, finalY + 10);
    doc.text(`Total Tax: $${totalTax.toFixed(2)}`, 140, finalY + 20);
    doc.text(`Grand Total: $${grandTotal.toFixed(2)}`, 140, finalY + 30);
    doc.save(`invoice-${invoiceId}.pdf`);
  };

  const handleCloseDialog = () => {
    setIsDialogOpen(false);
    resetAllFields();
  };

  return (
    <div>
      <Dialog isOpen={isDialogOpen} onClose={handleCloseDialog}>
        <h3 className="text-lg font-bold">Success!</h3>
        <p className="py-4">Checkout successfully and PDF generated.</p>
      </Dialog>

      <h1 className="text-2xl font-bold mb-4">Cashier Station</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div>
                <form onSubmit={handleAddItem} className="mb-6 p-4 bg-gray-800 rounded-lg">
                    <h2 className="text-xl font-bold mb-4">Add Item</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <input type="text" placeholder="Item Name" value={itemName} onChange={e => setItemName(e.target.value)} className="bg-gray-700 p-2 rounded" required />
                        <input type="number" placeholder="Quantity" value={quantity} onChange={e => setQuantity(e.target.value)} className="bg-gray-700 p-2 rounded" min="1" required />
                        <input type="number" placeholder="Price per item" value={price} onChange={e => setPrice(e.target.value)} className="bg-gray-700 p-2 rounded" step="0.01" min="0" required />
                        {loading ? <p>Loading categories...</p> : 
                            <select value={categoryId} onChange={e => setCategoryId(e.target.value)} className="bg-gray-700 p-2 rounded" required>
                                {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                            </select>
                        }
                    </div>
                    <button type="submit" className="mt-4 w-full bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded">Add to Cart</button>
                </form>

                <div className="p-4 bg-gray-800 rounded-lg">
                    <h2 className="text-xl font-bold mb-4">Current Invoice</h2>
                    <div className="space-y-2">
                        {cart.map((item, index) => (
                            <div key={index} className="flex justify-between items-center p-2 bg-gray-700 rounded">
                                <div><span className="font-bold">{item.name}</span><span className="text-sm text-gray-400"> x {item.quantity}</span></div>
                                <div className="flex items-center">
                                    <span>${item.total.toFixed(2)}</span>
                                    <button onClick={() => handleDeleteItem(index)} className="ml-4 text-red-400 hover:text-red-600 font-bold">&times;</button>
                                </div>
                            </div>
                        ))}
                    </div>
                    {cart.length === 0 && <p className="text-center text-gray-400">Cart is empty</p>}
                </div>
            </div>

            <div className="p-4 bg-gray-800 rounded-lg h-fit">
                <h2 className="text-xl font-bold mb-4">Invoice Summary</h2>
                <div className="space-y-2 mb-4">
                    <div className="flex justify-between"><span>Subtotal</span><span>${subtotal.toFixed(2)}</span></div>
                    <div className="flex justify-between"><span>Total Tax</span><span>${totalTax.toFixed(2)}</span></div>
                    <hr className="border-gray-600"/>
                    <div className="flex justify-between font-bold text-lg"><span>Grand Total</span><span>${grandTotal.toFixed(2)}</span></div>
                </div>
                <button onClick={handleCheckout} disabled={cart.length === 0} className="w-full bg-green-500 hover:bg-green-700 disabled:bg-gray-500 text-white font-bold py-2 px-4 rounded">
                    Checkout & Generate PDF
                </button>
                {error && <p className="text-red-500 mt-4">{error}</p>}
            </div>
        </div>
    </div>
  );
}
