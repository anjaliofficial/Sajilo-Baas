"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/app/admin/context/AuthContext";
import Link from "next/link";

interface Transaction {
    _id: string;
    bookingId: { checkInDate: string; checkOutDate: string };
    customerId: { fullName: string; email: string };
    hostId: { fullName: string; email: string };
    amount: number;
    method: string;
    status: string;
    transactionDetails: {
        transactionId?: string;
        reference?: string;
        notes?: string;
    };
    createdAt: string;
}

export default function TransactionsManagement() {
    const router = useRouter();
    const { user, loading: authLoading } = useAuth();
    const [transactions, setTransactions] = useState<Transaction[]>([]);
    const [loading, setLoading] = useState(true);
    const [filters, setFilters] = useState({
        status: "",
        method: "",
    });
    const [page, setPage] = useState(1);
    const [limit] = useState(20);
    const [total, setTotal] = useState(0);
    const [totalAmount, setTotalAmount] = useState(0);

    useEffect(() => {
        if (authLoading) return;
        if (!user || user.role !== "admin") {
            router.push("/login");
            return;
        }
        fetchTransactions();
    }, [user, authLoading, router, filters, page]);

    const fetchTransactions = async () => {
        try {
            setLoading(true);
            const params = new URLSearchParams();
            if (filters.status) params.append("status", filters.status);
            if (filters.method) params.append("method", filters.method);
            params.append("page", String(page));
            params.append("limit", String(limit));

            const response = await fetch(`/api/admin/transactions?${params}`);
            const data = await response.json();
            if (data.success) {
                setTransactions(data.transactions);
                setTotal(data.total);
                setTotalAmount(data.totalAmount || 0);
            }
        } catch (error) {
            console.error("Failed to fetch transactions:", error);
        } finally {
            setLoading(false);
        }
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case "completed":
                return "bg-green-100 text-green-800";
            case "pending":
                return "bg-yellow-100 text-yellow-800";
            case "failed":
                return "bg-red-100 text-red-800";
            case "refunded":
                return "bg-blue-100 text-blue-800";
            default:
                return "bg-gray-100 text-gray-800";
        }
    };

    const getMethodIcon = (method: string) => {
        switch (method) {
            case "credit_card":
                return "💳";
            case "debit_card":
                return "🏦";
            case "paypal":
                return "🅿️";
            case "bank_transfer":
                return "🏦";
            case "cash":
                return "💵";
            default:
                return "💰";
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 p-8">
            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <div className="flex justify-between items-center mb-8">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900">Transaction Management</h1>
                        <p className="text-gray-600 mt-2">Monitor all payments and transactions</p>
                    </div>
                    <Link href="/admin" className="text-blue-600 hover:text-blue-800">
                        ← Back to Dashboard
                    </Link>
                </div>

                {/* Summary Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                    <div className="bg-white rounded-lg shadow p-6">
                        <p className="text-gray-600 text-sm">Total Transactions</p>
                        <p className="text-3xl font-bold text-gray-900 mt-2">{total}</p>
                    </div>
                    <div className="bg-white rounded-lg shadow p-6">
                        <p className="text-gray-600 text-sm">Total Amount</p>
                        <p className="text-3xl font-bold text-green-600 mt-2">
                            Rs. {totalAmount.toLocaleString()}
                        </p>
                    </div>
                    <div className="bg-white rounded-lg shadow p-6">
                        <p className="text-gray-600 text-sm">Average Transaction</p>
                        <p className="text-3xl font-bold text-blue-600 mt-2">
                            Rs. {total > 0 ? Math.round(totalAmount / total).toLocaleString() : 0}
                        </p>
                    </div>
                </div>

                {/* Filters */}
                <div className="bg-white rounded-lg shadow p-6 mb-8">
                    <h2 className="text-lg font-semibold text-gray-900 mb-4">Filters</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        <select
                            value={filters.status}
                            onChange={(e) => {
                                setFilters({ ...filters, status: e.target.value });
                                setPage(1);
                            }}
                            className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                            <option value="">All Status</option>
                            <option value="completed">Completed</option>
                            <option value="pending">Pending</option>
                            <option value="failed">Failed</option>
                            <option value="refunded">Refunded</option>
                        </select>
                        <select
                            value={filters.method}
                            onChange={(e) => {
                                setFilters({ ...filters, method: e.target.value });
                                setPage(1);
                            }}
                            className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                            <option value="">All Methods</option>
                            <option value="credit_card">Credit Card</option>
                            <option value="debit_card">Debit Card</option>
                            <option value="paypal">PayPal</option>
                            <option value="bank_transfer">Bank Transfer</option>
                            <option value="cash">Cash</option>
                        </select>
                    </div>
                </div>

                {/* Transactions Table */}
                <div className="bg-white rounded-lg shadow overflow-hidden">
                    {loading ? (
                        <div className="p-8 text-center">Loading transactions...</div>
                    ) : transactions.length === 0 ? (
                        <div className="p-8 text-center text-gray-600">No transactions found</div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead className="bg-gray-100 border-b">
                                    <tr>
                                        <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Date</th>
                                        <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Customer</th>
                                        <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Host</th>
                                        <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Amount</th>
                                        <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Method</th>
                                        <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Status</th>
                                        <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Details</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {transactions.map((transaction) => (
                                        <tr key={transaction._id} className="border-b hover:bg-gray-50">
                                            <td className="px-6 py-4 text-sm text-gray-600">
                                                {new Date(transaction.createdAt).toLocaleDateString()}
                                            </td>
                                            <td className="px-6 py-4">
                                                <div>
                                                    <p className="font-semibold text-gray-900">
                                                        {transaction.customerId.fullName}
                                                    </p>
                                                    <p className="text-sm text-gray-500">{transaction.customerId.email}</p>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div>
                                                    <p className="font-semibold text-gray-900">{transaction.hostId.fullName}</p>
                                                    <p className="text-sm text-gray-500">{transaction.hostId.email}</p>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 font-bold text-gray-900">
                                                Rs. {transaction.amount.toLocaleString()}
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className="text-xl">{getMethodIcon(transaction.method)}</span>
                                                <p className="text-sm text-gray-600 capitalize">
                                                    {transaction.method.replace("_", " ")}
                                                </p>
                                            </td>
                                            <td className="px-6 py-4">
                                                <span
                                                    className={`px-3 py-1 rounded-full text-sm font-semibold ${getStatusColor(transaction.status)}`}
                                                >
                                                    {transaction.status.charAt(0).toUpperCase() + transaction.status.slice(1)}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-sm">
                                                {transaction.transactionDetails.transactionId && (
                                                    <p>TXN: {transaction.transactionDetails.transactionId}</p>
                                                )}
                                                {transaction.transactionDetails.reference && (
                                                    <p>Ref: {transaction.transactionDetails.reference}</p>
                                                )}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}

                    {/* Pagination */}
                    {!loading && transactions.length > 0 && (
                        <div className="px-6 py-4 border-t flex justify-between items-center">
                            <span className="text-sm text-gray-600">
                                Showing page {page} of {Math.ceil(total / limit)} ({total} total transactions)
                            </span>
                            <div className="flex gap-2">
                                <button
                                    onClick={() => setPage(Math.max(1, page - 1))}
                                    disabled={page === 1}
                                    className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg disabled:opacity-50 cursor-pointer hover:bg-gray-200"
                                >
                                    Previous
                                </button>
                                <button
                                    onClick={() => setPage(Math.min(Math.ceil(total / limit), page + 1))}
                                    disabled={page >= Math.ceil(total / limit)}
                                    className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg disabled:opacity-50 cursor-pointer hover:bg-gray-200"
                                >
                                    Next
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
