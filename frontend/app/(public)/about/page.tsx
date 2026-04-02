import Header from "../components/Header";
import { Target, Users, ShieldCheck, Map, Award } from "lucide-react";

export default function AboutPage() {
    const stats = [
        { label: "Active Listings", value: "500+" },
        { label: "Happy Guests", value: "10k+" },
        { label: "Cities Covered", value: "25+" },
        { label: "Verified Hosts", value: "300+" },
    ];

    const values = [
        {
            icon: <Target className="text-blue-600" size={32} />,
            title: "Our Mission",
            desc: "To make finding and booking unique stays in Nepal as simple and reliable as possible.",
        },
        {
            icon: <ShieldCheck className="text-blue-600" size={32} />,
            title: "Trust & Safety",
            desc: "We verify every property and host to ensure our community stays safe and comfortable.",
        },
        {
            icon: <Users className="text-blue-600" size={32} />,
            title: "Community First",
            desc: "Supporting local hosts and helping travelers experience the authentic culture of Nepal.",
        },
    ];

    return (
        <main className="min-h-screen bg-white">
            <Header />

            {/* Hero Section */}
            <section className="relative py-20 bg-[#1a3a4a] text-white overflow-hidden">
                <div className="absolute top-0 right-0 w-1/3 h-full bg-blue-600/10 skew-x-12 translate-x-20"></div>
                <div className="max-w-7xl mx-auto px-10 relative z-10">
                    <div className="max-w-2xl">
                        <h1 className="text-5xl font-bold mb-6 italic">Making Nepal feel like home, one stay at a time.</h1>
                        <p className="text-xl text-gray-300 leading-relaxed">
                            Sajilo Baas is Nepal's leading vacation rental platform, dedicated to connecting travelers with unique,
                            local accommodations that go beyond a typical hotel room.
                        </p>
                    </div>
                </div>
            </section>

            {/* Stats Section */}
            <section className="py-12 border-b">
                <div className="max-w-7xl mx-auto px-10">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
                        {stats.map((stat, i) => (
                            <div key={i} className="text-center">
                                <p className="text-4xl font-bold text-[#1a3a4a]">{stat.value}</p>
                                <p className="text-gray-500 font-medium mt-1">{stat.label}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Story Section */}
            <section className="py-20 max-w-7xl mx-auto px-10">
                <div className="flex flex-col md:flex-row gap-16 items-center">
                    <div className="w-full md:w-1/2">
                        <div className="relative">
                            <img
                                src="https://images.unsplash.com/photo-1544735716-392fe2489ffa"
                                alt="Nepal Mountains"
                                className="rounded-2xl shadow-2xl z-10 relative"
                            />
                            <div className="absolute -bottom-6 -left-6 w-32 h-32 bg-blue-600 rounded-2xl -z-0"></div>
                        </div>
                    </div>
                    <div className="w-full md:w-1/2 space-y-6">
                        <h2 className="text-3xl font-bold text-gray-800">Our Story</h2>
                        <p className="text-gray-600 leading-relaxed">
                            Founded in Kathmandu, <strong>Sajilo Baas</strong> (meaning "Easy Stay") started with a simple idea:
                            why should finding a home-away-from-home in Nepal be difficult?
                        </p>
                        <p className="text-gray-600 leading-relaxed">
                            We realized that while Nepal has incredible hospitality, there was no central platform that empowered
                            local homeowners to share their spaces with the world. Today, we bridge that gap, offering
                            everything from modern city apartments to traditional mountain lodges.
                        </p>
                        <div className="flex items-center gap-4 pt-4">
                            <div className="flex items-center gap-2 text-blue-600 font-bold">
                                <Award size={20} />
                                <span>Awarded Best Travel Tech Startup 2024</span>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Core Values */}
            <section className="py-20 bg-gray-50">
                <div className="max-w-7xl mx-auto px-10">
                    <div className="text-center max-w-2xl mx-auto mb-16">
                        <h2 className="text-3xl font-bold text-gray-800">The Values That Drive Us</h2>
                        <p className="text-gray-500 mt-4">We are committed to excellence and authenticity in every booking.</p>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
                        {values.map((val, i) => (
                            <div key={i} className="bg-white p-10 rounded-3xl shadow-sm border border-gray-100 hover:shadow-md transition">
                                <div className="mb-6">{val.icon}</div>
                                <h3 className="text-xl font-bold text-gray-800 mb-3">{val.title}</h3>
                                <p className="text-gray-500 leading-relaxed">{val.desc}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Join Section */}
            <section className="py-20 text-center max-w-4xl mx-auto px-10">
                <h2 className="text-4xl font-bold text-gray-800 mb-6">Ready to start your journey?</h2>
                <p className="text-gray-500 text-lg mb-10">Join thousands of travelers exploring the beauty of Nepal with Sajilo Baas.</p>
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                    <button className="bg-blue-600 text-white px-10 py-4 rounded-xl font-bold shadow-lg shadow-blue-200 hover:bg-blue-700 transition">
                        Browse Properties
                    </button>
                    <button className="bg-[#1a3a4a] text-white px-10 py-4 rounded-xl font-bold shadow-lg shadow-gray-200 hover:bg-black transition">
                        Become a Host
                    </button>
                </div>
            </section>

            {/* Simple Footer */}
            <footer className="py-10 border-t text-center text-gray-400 text-sm">
                © 2025 Sajilo Baas (Nepal Stays). All rights reserved.
            </footer>
        </main>
    );
}