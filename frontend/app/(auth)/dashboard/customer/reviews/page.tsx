"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/app/admin/context/AuthContext";
import { getDashboardPath } from "@/lib/auth/roles";

const RAW_API_BASE =
    process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:5050";
const API_BASE = RAW_API_BASE.endsWith("/api")
    ? RAW_API_BASE.slice(0, -4)
    : RAW_API_BASE;

interface Reply {
    _id: string;
    author: {
        _id: string;
        fullName: string;
        profilePicture?: string;
    };
    text: string;
    createdAt: string;
}

interface Review {
    _id: string;
    rating: number;
    comment: string;
    replies?: Reply[];
    reviewer?: {
        _id: string;
        fullName: string;
        email: string;
        profilePicture?: string;
    };
    reviewee?: {
        _id: string;
        fullName: string;
        email: string;
        profilePicture?: string;
    };
    listingId: {
        title: string;
        location: string;
    };
    createdAt: string;
}

const toImageUrl = (path?: string) => {
    if (!path) return "";
    const normalized = path.replace(/\\/g, "/");
    if (normalized.startsWith("http")) return normalized;
    const cleaned = normalized.startsWith("/") ? normalized : `/${normalized}`;
    return `${API_BASE}${cleaned}`;
};

export default function CustomerReviewsPage() {
    const { user, loading } = useAuth();
    const router = useRouter();

    const [activeTab, setActiveTab] = useState<"given" | "received">("given");
    const [givenReviews, setGivenReviews] = useState<Review[]>([]);
    const [receivedReviews, setReceivedReviews] = useState<Review[]>([]);
    const [reviewsLoading, setReviewsLoading] = useState(true);
    const [reviewsError, setReviewsError] = useState<string | null>(null);

    // Edit state
    const [editingReviewId, setEditingReviewId] = useState<string | null>(null);
    const [editRating, setEditRating] = useState(0);
    const [editComment, setEditComment] = useState("");
    const [editSubmitting, setEditSubmitting] = useState(false);

    // Reply state
    const [replyingReviewId, setReplyingReviewId] = useState<string | null>(null);
    const [replyText, setReplyText] = useState("");
    const [replySubmitting, setReplySubmitting] = useState(false);

    // Edit reply state
    const [editingReplyId, setEditingReplyId] = useState<string | null>(null);
    const [editingReplyReviewId, setEditingReplyReviewId] = useState<string | null>(null);
    const [editReplyText, setEditReplyText] = useState("");
    const [editReplySubmitting, setEditReplySubmitting] = useState(false);

    useEffect(() => {
        if (loading) return;

        if (!user) {
            router.replace("/login");
            return;
        }

        if (user.role !== "customer") {
            router.replace(getDashboardPath(user.role));
            return;
        }

        fetchReviews();
    }, [loading, user, router]);

    const fetchReviews = async () => {
        try {
            setReviewsLoading(true);
            setReviewsError(null);

            // Fetch reviews given by customer
            const givenResponse = await fetch("/api/reviews/given", {
                headers: { "Content-Type": "application/json" },
                credentials: "include",
            });

            if (!givenResponse.ok) {
                const errorData = await givenResponse.json().catch(() => ({}));
                throw new Error(
                    errorData?.message || `Failed to load given reviews (${givenResponse.status})`
                );
            }

            const givenData = await givenResponse.json();
            setGivenReviews(givenData.reviews || []);

            // Fetch reviews received by customer
            const userId = (user as any)?.id || (user as any)?._id;
            if (userId) {
                const receivedResponse = await fetch(`/api/reviews/received/${userId}`, {
                    headers: { "Content-Type": "application/json" },
                    credentials: "include",
                });

                if (receivedResponse.ok) {
                    const receivedData = await receivedResponse.json();
                    setReceivedReviews(receivedData.reviews || []);
                }
            }
        } catch (error) {
            setReviewsError(
                error instanceof Error ? error.message : "Failed to load reviews"
            );
        } finally {
            setReviewsLoading(false);
        }
    };

    const handleEditReview = (review: Review) => {
        setEditingReviewId(review._id);
        setEditRating(review.rating);
        setEditComment(review.comment);
    };

    const handleUpdateReview = async () => {
        if (!editingReviewId) return;

        try {
            setEditSubmitting(true);
            const res = await fetch(`/api/reviews/${editingReviewId}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                credentials: "include",
                body: JSON.stringify({
                    rating: editRating,
                    comment: editComment,
                }),
            });

            if (!res.ok) {
                const error = await res.json().catch(() => ({}));
                throw new Error(error.message || "Failed to update review");
            }

            // Update local state - extract data from response
            const responseData = await res.json();
            const updatedReview = responseData.data || responseData;

            setGivenReviews(givenReviews.map(r =>
                r._id === editingReviewId ? updatedReview : r
            ));

            setEditingReviewId(null);
            setEditRating(0);
            setEditComment("");
        } catch (error) {
            alert(error instanceof Error ? error.message : "Failed to update review");
        } finally {
            setEditSubmitting(false);
        }
    };

    const handleAddReply = async (reviewId: string) => {
        if (!replyText.trim()) {
            alert("Please enter a reply");
            return;
        }

        try {
            setReplySubmitting(true);
            const res = await fetch(`/api/reviews/${reviewId}/replies`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                credentials: "include",
                body: JSON.stringify({ text: replyText }),
            });

            if (!res.ok) {
                const error = await res.json().catch(() => ({}));
                throw new Error(error.message || "Failed to add reply");
            }

            const responseData = await res.json();
            const updatedReview = responseData.data || responseData;

            // Update local state based on active tab
            if (activeTab === "given") {
                setGivenReviews(givenReviews.map(r =>
                    r._id === reviewId ? updatedReview : r
                ));
            } else {
                setReceivedReviews(receivedReviews.map(r =>
                    r._id === reviewId ? updatedReview : r
                ));
            }

            setReplyingReviewId(null);
            setReplyText("");
        } catch (error) {
            alert(error instanceof Error ? error.message : "Failed to add reply");
        } finally {
            setReplySubmitting(false);
        }
    };

    const handleDeleteReply = async (reviewId: string, replyId: string) => {
        if (!confirm("Delete this reply?")) return;

        try {
            const res = await fetch(`/api/reviews/${reviewId}/replies/${replyId}`, {
                method: "DELETE",
                headers: { "Content-Type": "application/json" },
                credentials: "include",
            });

            if (!res.ok) {
                const error = await res.json().catch(() => ({}));
                throw new Error(error.message || "Failed to delete reply");
            }

            // Update local state - extract data from response
            const responseData = await res.json();
            const updatedReview = responseData.data || responseData;

            // Update based on active tab
            if (activeTab === "given") {
                setGivenReviews(givenReviews.map(r =>
                    r._id === reviewId ? updatedReview : r
                ));
            } else {
                setReceivedReviews(receivedReviews.map(r =>
                    r._id === reviewId ? updatedReview : r
                ));
            }
        } catch (error) {
            alert(error instanceof Error ? error.message : "Failed to delete reply");
        }
    };

    const handleUpdateReply = async (reviewId: string, replyId: string) => {
        if (!editReplyText.trim()) {
            alert("Please enter reply text");
            return;
        }

        try {
            setEditReplySubmitting(true);
            const res = await fetch(`/api/reviews/${reviewId}/replies/${replyId}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                credentials: "include",
                body: JSON.stringify({ text: editReplyText }),
            });

            if (!res.ok) {
                const error = await res.json().catch(() => ({}));
                throw new Error(error.message || "Failed to update reply");
            }

            // Update local state - extract data from response
            const responseData = await res.json();
            const updatedReview = responseData.data || responseData;

            // Update based on active tab
            if (activeTab === "given") {
                setGivenReviews(givenReviews.map(r =>
                    r._id === reviewId ? updatedReview : r
                ));
            } else {
                setReceivedReviews(receivedReviews.map(r =>
                    r._id === reviewId ? updatedReview : r
                ));
            }

            setEditingReplyId(null);
            setEditingReplyReviewId(null);
            setEditReplyText("");
        } catch (error) {
            alert(error instanceof Error ? error.message : "Failed to update reply");
        } finally {
            setEditReplySubmitting(false);
        }
    };

    const averageRatingGiven =
        givenReviews.length > 0
            ? parseFloat((givenReviews.reduce((sum, r) => sum + (r.rating || 0), 0) / givenReviews.length).toFixed(1))
            : 0;

    const averageRatingReceived =
        receivedReviews.length > 0
            ? parseFloat((receivedReviews.reduce((sum, r) => sum + (r.rating || 0), 0) / receivedReviews.length).toFixed(1))
            : 0;

    if (loading || reviewsLoading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
            </div>
        );
    }

    const displayReviews = activeTab === "given" ? givenReviews : receivedReviews;
    const displayAverage = activeTab === "given" ? averageRatingGiven : averageRatingReceived;

    return (
        <div className="max-w-6xl mx-auto p-6">
            <div className="mb-8">
                <h1 className="text-4xl font-bold text-gray-900 mb-2">Reviews & Ratings</h1>
                <p className="text-gray-600 text-lg">Manage reviews you've given and feedback you've received from hosts</p>
            </div>

            {/* Rating Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <div className="bg-white rounded-2xl shadow-lg p-6 border-l-4 border-yellow-500">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-gray-600 text-sm font-medium mb-1">
                                {activeTab === "given" ? "Avg Rating Given" : "Avg Rating Received"}
                            </p>
                            <p className="text-4xl font-bold text-gray-900">{displayAverage}</p>
                        </div>
                        <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center">
                            <svg className="w-8 h-8 text-yellow-600" fill="currentColor" viewBox="0 0 20 20">
                                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                            </svg>
                        </div>
                    </div>
                </div>

                <div className="bg-white rounded-2xl shadow-lg p-6 border-l-4 border-green-500">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-gray-600 text-sm font-medium mb-1">
                                {activeTab === "given" ? "Total Given" : "Total Received"}
                            </p>
                            <p className="text-4xl font-bold text-gray-900">{displayReviews.length}</p>
                        </div>
                        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
                            <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
                            </svg>
                        </div>
                    </div>
                </div>

                <div className="bg-white rounded-2xl shadow-lg p-6 border-l-4 border-blue-500">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-gray-600 text-sm font-medium mb-1">Your Rating</p>
                            <p className="text-4xl font-bold text-gray-900">
                                {receivedReviews.length > 0 ? averageRatingReceived : "N/A"}
                            </p>
                        </div>
                        <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center">
                            <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 10h-2m0 0H8m4 0v4m0-4v-4m8 12H4a2 2 0 01-2-2V6a2 2 0 012-2h16a2 2 0 012 2v12a2 2 0 01-2 2z" />
                            </svg>
                        </div>
                    </div>
                </div>
            </div>

            {/* Reviews Section with Tabs */}
            <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
                {/* Tab Navigation */}
                <div className="flex border-b border-gray-200">
                    <button
                        onClick={() => setActiveTab("given")}
                        className={`flex-1 px-6 py-4 font-medium text-center transition-colors ${activeTab === "given"
                            ? "border-b-2 border-blue-600 text-blue-600 bg-blue-50"
                            : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
                            }`}
                    >
                        <svg className="w-5 h-5 inline-block mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                        </svg>
                        Reviews I've Given ({givenReviews.length})
                    </button>
                    <button
                        onClick={() => setActiveTab("received")}
                        className={`flex-1 px-6 py-4 font-medium text-center transition-colors ${activeTab === "received"
                            ? "border-b-2 border-green-600 text-green-600 bg-green-50"
                            : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
                            }`}
                    >
                        <svg className="w-5 h-5 inline-block mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 10h-2m0 0H8m4 0v4m0-4v-4m8 12H4a2 2 0 01-2-2V6a2 2 0 012-2h16a2 2 0 012 2v12a2 2 0 01-2 2z" />
                        </svg>
                        Feedback Received ({receivedReviews.length})
                    </button>
                </div>

                {/* Content */}
                <div className="p-8">
                    {reviewsError && (
                        <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700 mb-6">
                            {reviewsError}
                        </div>
                    )}

                    {displayReviews.length === 0 ? (
                        <div className="text-center py-16">
                            <svg
                                className="w-20 h-20 mx-auto text-gray-400 mb-4"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                            >
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={1.5}
                                    d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.286 3.965a1 1 0 00.95.69h4.17c.969 0 1.371 1.24.588 1.81l-3.374 2.452a1 1 0 00-.364 1.118l1.287 3.965c.3.921-.755 1.688-1.54 1.118l-3.374-2.452a1 1 0 00-1.175 0l-3.374 2.452c-.784.57-1.838-.197-1.539-1.118l1.286-3.965a1 1 0 00-.363-1.118L2.05 9.392c-.783-.57-.38-1.81.588-1.81h4.17a1 1 0 00.95-.69l1.287-3.965z"
                                />
                            </svg>
                            <p className="text-gray-600 text-lg">
                                {activeTab === "given"
                                    ? "You haven't left any reviews yet."
                                    : "No feedback received yet."}
                            </p>
                        </div>
                    ) : (
                        <div className="space-y-6">
                            {displayReviews.map((review, idx) => {
                                const person = activeTab === "given" ? review.reviewee : review.reviewer;
                                const isEditingThisReview = editingReviewId === review._id;
                                return (
                                    <div
                                        key={review._id || `review-${idx}`}
                                        className={`border rounded-lg p-6 hover:shadow-lg transition-shadow ${activeTab === "given"
                                            ? "border-blue-200 bg-blue-50"
                                            : "border-green-200 bg-green-50"
                                            }`}
                                    >
                                        <div className="flex items-start justify-between mb-4">
                                            <div className="flex items-center gap-4">
                                                <button
                                                    onClick={() => router.push(`/dashboard/customer/profile/${person?._id}`)}
                                                    className="w-14 h-14 rounded-full bg-gray-300 overflow-hidden flex items-center justify-center flex-shrink-0 hover:ring-2 hover:ring-blue-500 transition"
                                                >
                                                    {person?.profilePicture ? (
                                                        <img
                                                            src={toImageUrl(person.profilePicture)}
                                                            alt={person.fullName}
                                                            className="w-full h-full object-cover cursor-pointer"
                                                        />
                                                    ) : (
                                                        <span className="text-xl font-bold text-white cursor-pointer">
                                                            {person?.fullName.charAt(0).toUpperCase()}
                                                        </span>
                                                    )}
                                                </button>
                                                <div className="flex-1">
                                                    <button
                                                        onClick={() => router.push(`/dashboard/customer/profile/${person?._id}`)}
                                                        className="font-semibold text-gray-900 text-lg hover:text-blue-600 hover:underline transition text-left"
                                                    >
                                                        {person?.fullName}
                                                    </button>
                                                    <p className="text-sm text-gray-600">
                                                        Property: {review.listingId && typeof review.listingId === 'object' ? (review.listingId as any).title || "N/A" : "N/A"}
                                                    </p>
                                                    <p className="text-xs text-gray-500">
                                                        {review.createdAt && !isNaN(new Date(review.createdAt).getTime())
                                                            ? new Date(review.createdAt).toLocaleDateString()
                                                            : "Unknown date"}
                                                    </p>
                                                </div>
                                            </div>
                                            {activeTab === "given" && !isEditingThisReview && (
                                                <button
                                                    onClick={() => handleEditReview(review)}
                                                    className="px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 transition"
                                                >
                                                    Edit
                                                </button>
                                            )}
                                        </div>

                                        {isEditingThisReview ? (
                                            <div className="mt-4 p-4 bg-white rounded-lg border-2 border-blue-400 space-y-4">
                                                <div>
                                                    <label className="block text-sm font-medium text-gray-700 mb-2">Rating</label>
                                                    <div className="flex gap-2">
                                                        {[1, 2, 3, 4, 5].map((star) => (
                                                            <button
                                                                key={star}
                                                                onClick={() => setEditRating(star)}
                                                                className="focus:outline-none"
                                                            >
                                                                <svg
                                                                    className={`w-8 h-8 cursor-pointer transition ${editRating >= star
                                                                        ? "text-yellow-500"
                                                                        : "text-gray-300 hover:text-yellow-400"
                                                                        }`}
                                                                    viewBox="0 0 20 20"
                                                                    fill="currentColor"
                                                                >
                                                                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.286 3.965a1 1 0 00.95.69h4.17c.969 0 1.371 1.24.588 1.81l-3.374 2.452a1 1 0 00-.364 1.118l1.287 3.965c.3.921-.755 1.688-1.54 1.118l-3.374-2.452a1 1 0 00-1.175 0l-3.374 2.452c-.784.57-1.838-.197-1.539-1.118l1.286-3.965a1 1 0 00-.363-1.118L2.05 9.392c-.783-.57-.38-1.81.588-1.81h4.17a1 1 0 00.95-.69l1.287-3.965z" />
                                                                </svg>
                                                            </button>
                                                        ))}
                                                    </div>
                                                </div>
                                                <div>
                                                    <label className="block text-sm font-medium text-gray-700 mb-2">Comment</label>
                                                    <textarea
                                                        value={editComment}
                                                        onChange={(e) => setEditComment(e.target.value)}
                                                        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                                        rows={4}
                                                        placeholder="Update your review..."
                                                    />
                                                </div>
                                                <div className="flex gap-2">
                                                    <button
                                                        onClick={handleUpdateReview}
                                                        disabled={editSubmitting}
                                                        className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50 transition"
                                                    >
                                                        {editSubmitting ? "Saving..." : "Save Changes"}
                                                    </button>
                                                    <button
                                                        onClick={() => setEditingReviewId(null)}
                                                        className="px-4 py-2 bg-gray-300 text-gray-700 rounded hover:bg-gray-400 transition"
                                                    >
                                                        Cancel
                                                    </button>
                                                </div>
                                            </div>
                                        ) : (
                                            <>
                                                <div className="flex items-center gap-1 mb-4">
                                                    {[1, 2, 3, 4, 5].map((star) => (
                                                        <svg
                                                            key={star}
                                                            className={`w-5 h-5 ${review.rating >= star
                                                                ? "text-yellow-500"
                                                                : "text-gray-300"
                                                                }`}
                                                            viewBox="0 0 20 20"
                                                            fill="currentColor"
                                                        >
                                                            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.286 3.965a1 1 0 00.95.69h4.17c.969 0 1.371 1.24.588 1.81l-3.374 2.452a1 1 0 00-.364 1.118l1.287 3.965c.3.921-.755 1.688-1.54 1.118l-3.374-2.452a1 1 0 00-1.175 0l-3.374 2.452c-.784.57-1.838-.197-1.539-1.118l1.286-3.965a1 1 0 00-.363-1.118L2.05 9.392c-.783-.57-.38-1.81.588-1.81h4.17a1 1 0 00.95-.69l1.287-3.965z" />
                                                        </svg>
                                                    ))}
                                                </div>

                                                {review.comment && (
                                                    <div className="mt-4 p-4 bg-white rounded-lg border-l-4"
                                                        style={{ borderLeftColor: activeTab === "given" ? "#3b82f6" : "#10b981" }}>
                                                        <p className="text-gray-700 leading-relaxed">{review.comment}</p>
                                                    </div>
                                                )}
                                            </>
                                        )}

                                        {/* Replies Section - Show in both tabs */}
                                        <div className={`mt-6 pt-6 border-t ${activeTab === "given" ? "border-blue-300" : "border-green-300"}`}>
                                            <h4 className="font-semibold text-gray-900 mb-4">Replies</h4>

                                            {review.replies && review.replies.length > 0 ? (
                                                <div className="space-y-3 mb-4">
                                                    {review.replies.map((reply) => (
                                                        <div key={reply._id} className="bg-white p-3 rounded-lg border border-gray-200">
                                                            <div className="flex items-start justify-between mb-2">
                                                                <div>
                                                                    <p className="font-medium text-gray-900 text-sm">
                                                                        {reply.author?.fullName}
                                                                    </p>
                                                                    <p className="text-xs text-gray-500">
                                                                        {new Date(reply.createdAt).toLocaleDateString()}
                                                                    </p>
                                                                </div>
                                                                {(user?.id === reply.author?._id || (user as any)?._id === reply.author?._id) ? (
                                                                    <div className="flex gap-2">
                                                                        <button
                                                                            onClick={() => {
                                                                                setEditingReplyId(reply._id);
                                                                                setEditingReplyReviewId(review._id);
                                                                                setEditReplyText(reply.text);
                                                                            }}
                                                                            className="text-xs px-2 py-1 bg-green-500 text-white rounded hover:bg-green-600"
                                                                        >
                                                                            Edit
                                                                        </button>
                                                                        <button
                                                                            onClick={() => handleDeleteReply(review._id, reply._id)}
                                                                            className="text-xs px-2 py-1 bg-red-500 text-white rounded hover:bg-red-600"
                                                                        >
                                                                            Delete
                                                                        </button>
                                                                    </div>
                                                                ) : null}
                                                            </div>
                                                            {editingReplyId === reply._id ? (
                                                                <div className="space-y-2">
                                                                    <textarea
                                                                        value={editReplyText}
                                                                        onChange={(e) => setEditReplyText(e.target.value)}
                                                                        className="w-full p-2 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-green-500"
                                                                        rows={2}
                                                                    />
                                                                    <div className="flex gap-2">
                                                                        <button
                                                                            onClick={() => handleUpdateReply(review._id, reply._id)}
                                                                            disabled={editReplySubmitting}
                                                                            className="text-xs px-3 py-1 bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50"
                                                                        >
                                                                            {editReplySubmitting ? "Saving..." : "Save"}
                                                                        </button>
                                                                        <button
                                                                            onClick={() => setEditingReplyId(null)}
                                                                            className="text-xs px-3 py-1 bg-gray-300 text-gray-700 rounded hover:bg-gray-400"
                                                                        >
                                                                            Cancel
                                                                        </button>
                                                                    </div>
                                                                </div>
                                                            ) : (
                                                                <p className="text-gray-700 text-sm">{reply.text}</p>
                                                            )}
                                                        </div>
                                                    ))}
                                                </div>
                                            ) : null}

                                            {/* Add Reply Form */}
                                            {replyingReviewId === review._id ? (
                                                <div className={`bg-white p-4 rounded-lg border-2 space-y-2 ${activeTab === "given" ? "border-blue-400" : "border-green-400"}`}>
                                                    <textarea
                                                        value={replyText}
                                                        onChange={(e) => setReplyText(e.target.value)}
                                                        placeholder="Write a reply..."
                                                        className={`w-full p-2 border border-gray-300 rounded focus:ring-2 focus:border-transparent ${activeTab === "given" ? "focus:ring-blue-500" : "focus:ring-green-500"}`}
                                                        rows={3}
                                                    />
                                                    <div className="flex gap-2">
                                                        <button
                                                            onClick={() => handleAddReply(review._id)}
                                                            disabled={replySubmitting}
                                                            className={`px-4 py-2 text-white rounded disabled:opacity-50 transition ${activeTab === "given" ? "bg-blue-600 hover:bg-blue-700" : "bg-green-600 hover:bg-green-700"}`}
                                                        >
                                                            {replySubmitting ? "Sending..." : "Send Reply"}
                                                        </button>
                                                        <button
                                                            onClick={() => {
                                                                setReplyingReviewId(null);
                                                                setReplyText("");
                                                            }}
                                                            className="px-4 py-2 bg-gray-300 text-gray-700 rounded hover:bg-gray-400 transition"
                                                        >
                                                            Cancel
                                                        </button>
                                                    </div>
                                                </div>
                                            ) : (
                                                <button
                                                    onClick={() => setReplyingReviewId(review._id)}
                                                    className={`px-4 py-2 text-sm text-white rounded transition ${activeTab === "given" ? "bg-blue-600 hover:bg-blue-700" : "bg-green-600 hover:bg-green-700"}`}
                                                >
                                                    Add Reply
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
