"use client";

import { AlertCircle, Lock } from "lucide-react";

export default function SecurityDisclaimer() {
    return (
        <div className="bg-blue-50 border-l-4 border-blue-500 p-4 mb-8">
            <div className="flex gap-3">
                <Lock className="text-blue-600 flex-shrink-0 mt-0.5" size={20} />
                <div>
                    <h3 className="font-semibold text-blue-900 mb-1">🔒 Privacy First</h3>
                    <p className="text-blue-800 text-sm">
                        <strong>Message Privacy Protected:</strong> Admins can only view message metadata
                        (timestamp, type, delivery status). <strong>Content is accessible ONLY when users report messages.</strong>
                        Every admin access is logged for audit and security.
                    </p>
                </div>
            </div>
        </div>
    );
}
