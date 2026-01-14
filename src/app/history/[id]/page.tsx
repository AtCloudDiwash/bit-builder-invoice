"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { supabase } from "@/lib/supabase";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

// Define types
interface Invoice {
    id: number;
    created_at: string;
    total_amount: number;
    total_tax: number;
}

interface InvoiceItem {
    id: number;
    item_name: string;
    quantity: number;
    price_per_item: number;
    tax: number;
    categories: { name: string } | null;
}

export default function InvoiceDetailPage() {
    const { id } = useParams();
    const [invoice, setInvoice] = useState<Invoice | null>(null);
    const [items, setItems] = useState<InvoiceItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (id) {
            const fetchInvoiceDetails = async () => {
                setLoading(true);
                
                // Fetch invoice
                const { data: invoiceData, error: invoiceError } = await supabase
                    .from("invoices")
                    .select("*")
                    .eq("id", id)
                    .single();

                if (invoiceError) {
                    setError("Invoice not found.");
                    setLoading(false);
                    return;
                }
                setInvoice(invoiceData as Invoice);

                // Fetch items
                const { data: itemsData, error: itemsError } = await supabase
                    .from("invoice_items")
                    .select("*, categories(name)")
                    .eq("invoice_id", id);
                
                if (itemsError) {
                    setError(itemsError.message);
                } else {
                    setItems(itemsData as any[]);
                }

                setLoading(false);
            };
            fetchInvoiceDetails();
        }
    }, [id]);

    const generatePdf = () => {
        if (!invoice || items.length === 0) return;

        const doc = new jsPDF();
        
        doc.text("Invoice", 20, 20);
        doc.text(`Invoice ID: ${invoice.id}`, 20, 30);
        doc.text(`Date: ${new Date(invoice.created_at).toLocaleDateString()}`, 20, 40);

        autoTable(doc, {
            startY: 50,
            head: [['Item', 'Category', 'Qty', 'Price', 'Tax', 'Total']],
            body: items.map(item => [
                item.item_name,
                item.categories?.name || 'N/A',
                item.quantity,
                `$${item.price_per_item.toFixed(2)}`,
                `$${item.tax.toFixed(2)}`,
                `$${(item.price_per_item * item.quantity + item.tax).toFixed(2)}`,
            ]),
        });

        const finalY = (doc as any).lastAutoTable.finalY || 100;
        const subtotal = items.reduce((acc, i) => acc + i.price_per_item * i.quantity, 0);
        doc.text(`Subtotal: $${subtotal.toFixed(2)}`, 140, finalY + 10);
        doc.text(`Total Tax: $${invoice.total_tax.toFixed(2)}`, 140, finalY + 20);
        doc.text(`Grand Total: $${invoice.total_amount.toFixed(2)}`, 140, finalY + 30);

        doc.save(`invoice-${invoice.id}.pdf`);
    };

    if (loading) return <p>Loading invoice details...</p>;
    if (error) return <p className="text-red-500">{error}</p>;
    if (!invoice) return <p>No invoice found.</p>;

    return (
        <div>
            <h1 className="text-2xl font-bold mb-4">Invoice Details #{invoice.id}</h1>
            <div className="bg-gray-800 rounded-lg p-4 mb-4">
                <p><strong>Date:</strong> {new Date(invoice.created_at).toLocaleString()}</p>
                <p><strong>Total:</strong> ${invoice.total_amount.toFixed(2)}</p>
                <p><strong>Tax:</strong> ${invoice.total_tax.toFixed(2)}</p>
                <button onClick={generatePdf} className="mt-4 bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded">
                    Download PDF
                </button>
            </div>
            
            <h2 className="text-xl font-bold mb-2">Items</h2>
            <div className="bg-gray-800 rounded-lg p-4">
                <table className="w-full">
                    <thead>
                        <tr className="text-left text-gray-400">
                            <th className="p-2">Item</th>
                            <th className="p-2">Category</th>
                            <th className="p-2">Quantity</th>
                            <th className="p-2">Price</th>
                            <th className="p-2">Tax</th>
                            <th className="p-2">Total</th>
                        </tr>
                    </thead>
                    <tbody>
                        {items.map((item) => (
                            <tr key={item.id} className="border-b border-gray-700">
                                <td className="p-2">{item.item_name}</td>
                                <td className="p-2">{item.categories?.name || "N/A"}</td>
                                <td className="p-2">{item.quantity}</td>
                                <td className="p-2">${item.price_per_item.toFixed(2)}</td>
                                <td className="p-2">${item.tax.toFixed(2)}</td>
                                <td className="p-2">${(item.price_per_item * item.quantity + item.tax).toFixed(2)}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
