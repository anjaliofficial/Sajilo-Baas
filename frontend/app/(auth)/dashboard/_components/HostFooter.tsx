"use client";

export default function HostFooter() {
    return (
        <footer className="bg-gray-900 text-gray-300 mt-8">
            <div className="bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600">
                <div className="w-full px-4 sm:px-6 lg:px-8 py-6">
                    <div className="flex flex-col md:flex-row justify-between items-center gap-4">
                        <div>
                            <h3 className="text-white font-bold text-lg mb-1">Subscribe to hosting tips</h3>
                            <p className="text-white/80 text-sm">Get expert advice and updates to maximize your earnings</p>
                        </div>
                        <div className="flex gap-2 w-full md:w-auto">
                            <input type="email" placeholder="Enter your email" className="flex-1 md:flex-none px-4 py-2 rounded-lg text-gray-900 focus:outline-none text-sm" />
                            <button className="px-5 py-2 bg-white text-blue-600 rounded-lg font-semibold hover:bg-gray-100 transition-all text-sm">Subscribe</button>
                        </div>
                    </div>
                </div>
            </div>

            <div className="w-full px-4 sm:px-6 lg:px-8 py-8">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-6 mb-6">
                    <div className="lg:col-span-2">
                        <div className="flex items-center gap-2 mb-3">
                            <svg className="w-7 h-7 text-emerald-400" fill="currentColor" viewBox="0 0 24 24">
                                <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
                            </svg>
                            <span className="text-white font-bold text-lg">Sajilo Baas</span>
                        </div>
                        <p className="text-sm text-gray-400 mb-3">Empowering hosts to create memorable experiences and grow their hospitality business in Nepal.</p>
                        <div className="flex gap-4">
                            <a href="#" className="text-gray-400 hover:text-white transition-all">📘</a>
                            <a href="#" className="text-gray-400 hover:text-white transition-all">🐦</a>
                            <a href="#" className="text-gray-400 hover:text-white transition-all">📷</a>
                            <a href="#" className="text-gray-400 hover:text-white transition-all">▶️</a>
                        </div>
                    </div>

                    <div>
                        <h3 className="text-white font-bold mb-3 text-sm">Host Support</h3>
                        <ul className="space-y-2 text-sm">
                            <li><a href="#" className="hover:text-white transition-all">Help Center</a></li>
                            <li><a href="#" className="hover:text-white transition-all">Safety Tips</a></li>
                            <li><a href="#" className="hover:text-white transition-all">Hosting Guide</a></li>
                            <li><a href="#" className="hover:text-white transition-all">Report Issue</a></li>
                            <li><a href="#" className="hover:text-white transition-all">Contact Support</a></li>
                        </ul>
                    </div>

                    <div>
                        <h3 className="text-white font-bold mb-3 text-sm">Resources</h3>
                        <ul className="space-y-2 text-sm">
                            <li><a href="#" className="hover:text-white transition-all">Host Community</a></li>
                            <li><a href="#" className="hover:text-white transition-all">Success Stories</a></li>
                            <li><a href="#" className="hover:text-white transition-all">Blog & Tips</a></li>
                            <li><a href="#" className="hover:text-white transition-all">Pricing Tools</a></li>
                            <li><a href="#" className="hover:text-white transition-all">Host Academy</a></li>
                        </ul>
                    </div>

                    <div>
                        <h3 className="text-white font-bold mb-3 text-sm">Grow Your Business</h3>
                        <ul className="space-y-2 text-sm">
                            <li><a href="#" className="hover:text-white transition-all">Marketing Tips</a></li>
                            <li><a href="#" className="hover:text-white transition-all">Performance Stats</a></li>
                            <li><a href="#" className="hover:text-white transition-all">Payment Info</a></li>
                            <li><a href="#" className="hover:text-white transition-all">Tax Resources</a></li>
                            <li><a href="#" className="hover:text-white transition-all">Promotions</a></li>
                        </ul>
                    </div>

                    <div>
                        <h3 className="text-white font-bold mb-3 text-sm">Nepal Regions</h3>
                        <ul className="space-y-2 text-sm">
                            <li><a href="#" className="hover:text-white transition-all">Kathmandu</a></li>
                            <li><a href="#" className="hover:text-white transition-all">Pokhara</a></li>
                            <li><a href="#" className="hover:text-white transition-all">Chitwan</a></li>
                            <li><a href="#" className="hover:text-white transition-all">Ilam</a></li>
                            <li><a href="#" className="hover:text-white transition-all">More...</a></li>
                        </ul>
                    </div>
                </div>

                <div className="border-t border-gray-700 py-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                        <div>
                            <h3 className="text-white font-bold mb-3 text-sm">Legal</h3>
                            <ul className="space-y-2 text-sm">
                                <li><a href="#" className="hover:text-white transition-all">Host Terms</a></li>
                                <li><a href="#" className="hover:text-white transition-all">Privacy Policy</a></li>
                                <li><a href="#" className="hover:text-white transition-all">Cookie Policy</a></li>
                                <li><a href="#" className="hover:text-white transition-all">Community Standards</a></li>
                            </ul>
                        </div>

                        <div>
                            <h3 className="text-white font-bold mb-3 text-sm">Contact Info</h3>
                            <ul className="space-y-2 text-sm">
                                <li>📧 Email: <a href="mailto:host@sajilobaas.com" className="hover:text-white transition-all">host@sajilobaas.com</a></li>
                                <li>📱 Phone: <a href="tel:+977-1-5000000" className="hover:text-white transition-all">+977-1-5000000</a></li>
                                <li>📍 Address: Kathmandu, Nepal</li>
                                <li>⏰ Host Support: 24/7</li>
                            </ul>
                        </div>
                    </div>
                </div>

                <div className="border-t border-gray-700 pt-6">
                    <div className="flex flex-col md:flex-row justify-between items-center">
                        <p className="text-sm text-gray-400 mb-4 md:mb-0">© 2026 Sajilo Baas Host Portal. All rights reserved. | Empowering hospitality in Nepal 🇳🇵</p>
                        <div className="flex gap-6">
                            <select className="bg-gray-800 text-white px-3 py-2 rounded text-sm border border-gray-700 focus:outline-none">
                                <option>English</option>
                                <option>Nepali</option>
                                <option>Español</option>
                            </select>
                        </div>
                    </div>
                </div>
            </div>
        </footer>
    );
}