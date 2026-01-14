"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import Link from "next/link";

interface Invoice {
    id: number;
    created_at: string;
    total_amount: number;
    total_tax: number;
}

export default function HistoryPage() {
    const [invoices, setInvoices] = useState<Invoice[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchInvoices = async () => {
            setLoading(true);
            const { data, error } = await supabase
                .from("invoices")
                .select("*")
                .order("created_at", { ascending: false });

            if (error) {
                setError(error.message);
            } else {
                setInvoices(data as Invoice[]);
            }
            setLoading(false);
        };
        fetchInvoices();
    }, []);

    if (loading) return <p>Loading history...</p>;
    if (error) return <p className="text-red-500">{error}</p>;

    return (
        <div>
            <h1 className="text-2xl font-bold mb-4">Invoice History</h1>
            <div className="bg-gray-800 rounded-lg p-4">
                <table className="w-full">
                    <thead>
                        <tr className="text-left text-gray-400">
                            <th className="p-2">Invoice ID</th>
                            <th className="p-2">Date</th>
                            <th className="p-2">Total Amount</th>
                            <th className="p-2">Details</th>
                        </tr>
                    </thead>
                    <tbody>
                        {invoices.map((invoice) => (
                            <tr key={invoice.id} className="border-b border-gray-700 hover:bg-gray-700">
                                <td className="p-2">#{invoice.id}</td>
                                <td className="p-2">{new Date(invoice.created_at).toLocaleDateString()}</td>
                                <td className="p-2">${invoice.total_amount.toFixed(2)}</td>
                                <td className="p-2">
                                    <Link href={`/history/${invoice.id}`} className="text-blue-400 hover:underline">
                                        View Details
                                    </Link>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                {invoices.length === 0 && <p className="text-center p-4">No invoices found.</p>}
            </div>
        </div>
    );
}
