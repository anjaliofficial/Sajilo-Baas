import React from "react";

const ReviewsPage = () => {
    return (
        <div className="min-h-screen bg-gray-50 p-8">
            <div className="max-w-3xl mx-auto">
                <h1 className="text-3xl font-bold text-gray-900 mb-6">Your Reviews</h1>
                <p className="text-gray-600 mb-4">Here you can see reviews you have given and received.</p>
                {/* TODO: Fetch and display given and taken reviews */}
                <div className="bg-white rounded-lg shadow p-6">
                    <p className="text-gray-500">Reviews functionality coming soon...</p>
                </div>
            </div>
        </div>
    );
};

export default ReviewsPage;
