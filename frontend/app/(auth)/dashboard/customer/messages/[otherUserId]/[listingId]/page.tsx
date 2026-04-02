import MessageApp from "../../page";
import { useRouter } from "next/navigation";

export default function MessageDynamicPage({ params }: { params: { otherUserId: string; listingId: string } }) {
    const router = useRouter();
    // Redirect to the main messages page with query params
    if (typeof window !== "undefined") {
        router.replace(`/dashboard/customer/messages?hostId=${params.otherUserId}&listingId=${params.listingId}`);
    }
    // Optionally, show a loading state
    return <div>Loading conversation...</div>;
}
