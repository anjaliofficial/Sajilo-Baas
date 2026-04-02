"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/app/admin/context/AuthContext";
import { getDashboardPath } from "@/lib/auth/roles";

const RAW_API_BASE =
    process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:5050";
const API_BASE = RAW_API_BASE.endsWith("/api")
    ? RAW_API_BASE.slice(0, -4)
    : RAW_API_BASE;

const toImageUrl = (path?: string) => {
    if (!path) return "";
    const normalized = path.replace(/\\/g, "/");
    if (normalized.startsWith("http")) return normalized;
    const cleaned = normalized.startsWith("/") ? normalized : `/${normalized}`;
    return `${API_BASE}${cleaned}`;
};

interface PublicProfile {
    _id: string;
    fullName: string;
    email: string;
    phoneNumber?: string;
    address?: string;
    profilePicture?: string;
    role?: string;
    createdAt?: string;
}

export default function HostUserProfilePage() {
    const { user, loading } = useAuth();
    const router = useRouter();
    const params = useParams<{ id: string }>();
    const searchParams = useSearchParams();

    const [profile, setProfile] = useState<PublicProfile | null>(null);
    const [profileLoading, setProfileLoading] = useState(true);
    const [profileError, setProfileError] = useState<string | null>(null);

    const [reviewRating, setReviewRating] = useState(0);
    const [reviewComment, setReviewComment] = useState("");
    const [reviewSubmitting, setReviewSubmitting] = useState(false);
    const [reviewError, setReviewError] = useState<string | null>(null);
    const [reviewSuccess, setReviewSuccess] = useState<string | null>(null);

    const bookingId = searchParams.get("bookingId") || "";
    const listingTitle = searchParams.get("listingTitle") || "";

    useEffect(() => {
        if (loading) return;

        if (!user) {
            router.replace("/login");
            return;
        }

        if (user.role !== "host") {
            router.replace(getDashboardPath(user.role));
            return;
        }

        const profileId = params?.id || "";
        if (!profileId) {
            setProfileError("No user ID provided");
            setProfileLoading(false);
            return;
        }

        const fetchProfile = async () => {
            try {
                setProfileLoading(true);
                setProfileError(null);
                const response = await fetch(`/api/users/public/${profileId}`, {
                    headers: { "Content-Type": "application/json" },
                    credentials: "include",
                });

                if (!response.ok) {
                    const errorData = await response.json().catch(() => ({}));
                    throw new Error(errorData?.message || `Failed to load profile (${response.status})`);
                }

                const data = await response.json();
                console.log("Profile response data:", data);
                // Handle both { user: {...} } and direct user object
                const userProfile = data.user || data;
                setProfile(userProfile || null);
            } catch (error) {
                console.error("Profile fetch error:", error);
                setProfileError(
                    error instanceof Error ? error.message : "Failed to load profile",
                );
            } finally {
                setProfileLoading(false);
            }
        };

        fetchProfile();
    }, [loading, user, router, params]);

    const submitReview = async () => {
        if (!bookingId) {
            setReviewError("Booking information is missing.");
            return;
        }

        if (reviewRating < 1) {
            setReviewError("Please select a rating.");
            return;
        }

        setReviewSubmitting(true);
        setReviewError(null);
        setReviewSuccess(null);

        try {
            const response = await fetch("/api/reviews", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                credentials: "include",
                body: JSON.stringify({
                    bookingId,
                    rating: reviewRating,
                    comment: reviewComment,
                }),
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData?.message || `Failed to submit review (${response.status})`);
            }

            const data = await response.json();
            setReviewSuccess("Review submitted successfully.");
            setReviewRating(0);
            setReviewComment("");

            // Redirect to reviews given page after 1.5 seconds
            setTimeout(() => {
                router.push("/dashboard/host/reviews");
            }, 1500);
        } catch (error) {
            setReviewError(
                error instanceof Error ? error.message : "Failed to submit review",
            );
        } finally {
            setReviewSubmitting(false);
        }
    };

    if (loading || profileLoading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="w-8 h-8 border-4 border-emerald-600 border-t-transparent rounded-full animate-spin"></div>
            </div>
        );
    }

    if (profileError) {
        return (
            <div className="max-w-3xl mx-auto p-6">
                <p className="text-red-600">{profileError}</p>
            </div>
        );
    }

    if (!profile) return null;

    return (
        <div className="max-w-4xl mx-auto">
            <Link
                href="/dashboard/host/bookings"
                className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-6"
            >
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
                Back to Bookings
            </Link>

            <div className="bg-white rounded-2xl shadow-lg p-6 mb-8">
                <div className="flex items-center gap-5">
                    <div className="w-20 h-20 rounded-full bg-gray-100 overflow-hidden flex items-center justify-center text-2xl font-bold text-emerald-600">
                        {profile.profilePicture ? (
                            <img
                                src={toImageUrl(profile.profilePicture)}
                                alt={profile.fullName}
                                className="w-full h-full object-cover"
                            />
                        ) : (
                            profile.fullName?.charAt(0)?.toUpperCase() || "U"
                        )}
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">{profile.fullName}</h1>
                        <p className="text-sm text-gray-600">{profile.role || "Guest"}</p>
                        <div className="mt-2 text-sm text-gray-600 space-y-1">
                            <p>{profile.email}</p>
                            {profile.phoneNumber && <p>{profile.phoneNumber}</p>}
                            {profile.address && <p>{profile.address}</p>}
                        </div>
                    </div>
                </div>
            </div>

            <div className="bg-white rounded-2xl shadow-lg p-6">
                <h2 className="text-xl font-bold text-gray-900 mb-2">Leave Feedback</h2>
                {listingTitle && (
                    <p className="text-sm text-gray-500 mb-4">Listing: {listingTitle}</p>
                )}

                {!bookingId ? (
                    <p className="text-sm text-gray-500">
                        Select a completed booking to leave a review.
                    </p>
                ) : (
                    <>
                        <div className="flex items-center gap-2 mb-4">
                            {[1, 2, 3, 4, 5].map((value) => (
                                <button
                                    key={value}
                                    onClick={() => setReviewRating(value)}
                                    className="p-1"
                                    aria-label={`Rate ${value} star${value > 1 ? "s" : ""}`}
                                >
                                    <svg
                                        className={`w-7 h-7 ${reviewRating >= value ? "text-amber-500" : "text-gray-300"}`}
                                        viewBox="0 0 20 20"
                                        fill="currentColor"
                                    >
                                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.286 3.965a1 1 0 00.95.69h4.17c.969 0 1.371 1.24.588 1.81l-3.374 2.452a1 1 0 00-.364 1.118l1.287 3.965c.3.921-.755 1.688-1.54 1.118l-3.374-2.452a1 1 0 00-1.175 0l-3.374 2.452c-.784.57-1.838-.197-1.539-1.118l1.286-3.965a1 1 0 00-.363-1.118L2.05 9.392c-.783-.57-.38-1.81.588-1.81h4.17a1 1 0 00.95-.69l1.287-3.965z" />
                                    </svg>
                                </button>
                            ))}
                        </div>
                        <textarea
                            value={reviewComment}
                            onChange={(event) => setReviewComment(event.target.value)}
                            rows={4}
                            className="w-full rounded-lg border border-gray-200 p-3 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-200"
                            placeholder="Share your feedback..."
                        />
                        {reviewError && <p className="mt-3 text-sm text-red-600">{reviewError}</p>}
                        {reviewSuccess && (
                            <p className="mt-3 text-sm text-green-600">{reviewSuccess}</p>
                        )}
                        <div className="mt-5 flex items-center justify-end">
                            <button
                                onClick={submitReview}
                                disabled={reviewSubmitting}
                                className="px-4 py-2 text-sm font-semibold text-white bg-emerald-600 rounded-lg hover:bg-emerald-700 disabled:opacity-60"
                            >
                                {reviewSubmitting ? "Submitting..." : "Submit Review"}
                            </button>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
}
