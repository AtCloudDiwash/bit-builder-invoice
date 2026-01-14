"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

// Define the type for a category
interface Category {
  id: number;
  name: string;
  tax_rate: number;
}

interface Invoice {
  id: number;
  total_amount: number;
  total_tax: number;
}

interface SalesByCategory {
    [key: string]: {
        revenue: number;
        itemsSold: number;
    }
}

export default function AdminPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [newCategoryName, setNewCategoryName] = useState("");
  const [newCategoryTax, setNewCategoryTax] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Edit state
  const [editingCategoryId, setEditingCategoryId] = useState<number | null>(null);
  const [editedCategoryName, setEditedCategoryName] = useState("");
  const [editedCategoryTax, setEditedCategoryTax] = useState("");

  // Sales dashboard state
  const [totalRevenue, setTotalRevenue] = useState(0);
  const [totalInvoices, setTotalInvoices] = useState(0);
  const [salesByCategory, setSalesByCategory] = useState<SalesByCategory>({});

  // Fetch all data
  const fetchData = async () => {
    setLoading(true);
    const { data: categoriesData, error: categoriesError } = await supabase.from("categories").select("*").order('name');
    if (categoriesError) {
      setError(categoriesError.message);
    } else {
      setCategories(categoriesData as Category[]);
    }

    const { data: invoicesData, error: invoicesError } = await supabase.from("invoices").select("*");
    if (invoicesError) {
        setError(invoicesError.message)
    } else {
        const invoices = invoicesData as Invoice[];
        setTotalInvoices(invoices.length);
        const totalRev = invoices.reduce((acc, inv) => acc + inv.total_amount, 0);
        setTotalRevenue(totalRev);
    }
    
    const { data: itemsData, error: itemsError } = await supabase.from("invoice_items").select("*, categories(name)");
    if(itemsError) {
        setError(itemsError.message)
    } else {
        const sales: SalesByCategory = {};
        itemsData?.forEach((item: any) => {
            const categoryName = item.categories?.name || "Uncategorized";
            if(!sales[categoryName]) {
                sales[categoryName] = { revenue: 0, itemsSold: 0};
            }
            sales[categoryName].revenue += item.price_per_item * item.quantity;
            sales[categoryName].itemsSold += item.quantity;
        });
        setSalesByCategory(sales);
    }


    setLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, []);

  // CRUD handlers
  const handleAddCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCategoryName || !newCategoryTax) return;
    const { error } = await supabase.from("categories").insert([{ name: newCategoryName, tax_rate: parseFloat(newCategoryTax) }]);
    if (error) {
      setError(error.message);
    } else {
      setNewCategoryName("");
      setNewCategoryTax("");
      fetchData();
    }
  };

  const handleDeleteCategory = async (id: number) => {
    if (confirm("Are you sure you want to delete this category?")) {
      const { error } = await supabase.from("categories").delete().match({ id });
      if (error) setError(error.message);
      else fetchData();
    }
  };

  const handleEditClick = (category: Category) => {
    setEditingCategoryId(category.id);
    setEditedCategoryName(category.name);
    setEditedCategoryTax(String(category.tax_rate));
  };

  const handleCancelClick = () => {
    setEditingCategoryId(null);
  };

  const handleSaveClick = async (id: number) => {
    const { error } = await supabase
      .from("categories")
      .update({ name: editedCategoryName, tax_rate: parseFloat(editedCategoryTax) })
      .eq("id", id);
    
    if (error) {
      setError(error.message);
    } else {
      setEditingCategoryId(null);
      fetchData();
    }
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
      {/* Category Management */}
      <div>
        <h1 className="text-2xl font-bold mb-4">Manage Categories</h1>
        <form onSubmit={handleAddCategory} className="mb-6 p-4 bg-gray-800 rounded-lg">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <input type="text" placeholder="Category Name" value={newCategoryName} onChange={(e) => setNewCategoryName(e.target.value)} className="bg-gray-700 p-2 rounded" required />
            <input type="number" placeholder="Tax Rate (e.g., 0.05)" value={newCategoryTax} onChange={(e) => setNewCategoryTax(e.target.value)} className="bg-gray-700 p-2 rounded" step="0.01" min="0" max="1" required />
            <button type="submit" className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded">Add Category</button>
          </div>
        </form>

        {loading && <p>Loading categories...</p>}
        {error && <p className="text-red-500">{error}</p>}
        
        <div className="space-y-2">
          {categories.map((category) => (
            <div key={category.id} className="flex justify-between items-center p-3 bg-gray-800 rounded-lg">
              {editingCategoryId === category.id ? (
                <>
                  <input type="text" value={editedCategoryName} onChange={(e) => setEditedCategoryName(e.target.value)} className="bg-gray-600 p-1 rounded w-1/3" />
                  <input type="number" value={editedCategoryTax} onChange={(e) => setEditedCategoryTax(e.target.value)} className="bg-gray-600 p-1 rounded w-1/4" step="0.01" min="0" max="1" />
                  <div className="flex gap-2">
                    <button onClick={() => handleSaveClick(category.id)} className="bg-green-500 hover:bg-green-700 text-white font-bold py-1 px-2 rounded">Save</button>
                    <button onClick={handleCancelClick} className="bg-gray-500 hover:bg-gray-700 text-white font-bold py-1 px-2 rounded">Cancel</button>
                  </div>
                </>
              ) : (
                <>
                  <span>{category.name} ({category.tax_rate * 100}%)</span>
                  <div className="flex gap-2">
                    <button onClick={() => handleEditClick(category)} className="bg-yellow-500 hover:bg-yellow-700 text-white font-bold py-1 px-2 rounded">Edit</button>
                    <button onClick={() => handleDeleteCategory(category.id)} className="bg-red-500 hover:bg-red-700 text-white font-bold py-1 px-2 rounded">Delete</button>
                  </div>
                </>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Sales Dashboard (Custom Feature) */}
      <div>
        <h1 className="text-2xl font-bold mb-4">Sales Dashboard</h1>
        <div className="p-4 bg-gray-800 rounded-lg">
            {loading ? (
                <p className="text-center">Loading sales data...</p>
            ) : (
                <div className="grid grid-cols-2 gap-4 text-center">
                    <div className="p-4 bg-gray-700 rounded-lg"><p className="text-lg font-bold">Total Revenue</p><p className="text-2xl">${totalRevenue.toFixed(2)}</p></div>
                    <div className="p-4 bg-gray-700 rounded-lg"><p className="text-lg font-bold">Total Invoices</p><p className="text-2xl">{totalInvoices}</p></div>
                    <div className="col-span-2 p-4 bg-gray-700 rounded-lg mt-4">
                        <h2 className="text-lg font-bold mb-2">Sales by Category</h2>
                        {Object.keys(salesByCategory).length > 0 ? (
                             <ul className="space-y-2">
                             {Object.entries(salesByCategory).map(([name, data]) => (
                               <li key={name} className="flex justify-between"><span>{name}:</span><span>${data.revenue.toFixed(2)} ({data.itemsSold} items)</span></li>
                             ))}
                           </ul>
                        ): (<p>No sales data yet.</p>)}
                    </div>
                </div>
            )}
        </div>
      </div>
    </div>
  );
}
