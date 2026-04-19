import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';

export default function LandingPage() {
    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
            <nav className="bg-white/80 backdrop-blur-sm shadow-sm sticky top-0 z-50">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
                    <motion.h1
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.5 }}
                        className="text-2xl font-bold bg-gradient-to-r from-red-700 to-red-500 bg-clip-text text-transparent"
                    >
                        LexumLink
                    </motion.h1>
                    <div className="space-x-4">
                        <Link to="/signin" className="text-gray-600 hover:text-red-700 transition-colors duration-200">Sign In</Link>
                    </div>
                </div>
            </nav>

            <main className="flex-1 flex items-center justify-center px-4 py-20">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: 0.2 }}
                    className="text-center max-w-3xl"
                >
                    <h2 className="text-5xl md:text-6xl font-extrabold text-gray-900 mb-6 leading-tight">
                        Case & Claims <span className="text-red-700">Management</span>
                    </h2>
                    <p className="text-xl text-gray-600 mb-10 max-w-2xl mx-auto">
                        Streamlined workflows for law firms and legal professionals. Manage RAF claims, accident reports, and medical records in one secure platform.
                    </p>
                    <Link to="/signup" className="inline-block bg-red-700 text-white px-8 py-3 rounded-full text-lg font-semibold hover:bg-red-800 transform hover:scale-105 transition-all duration-200 shadow-lg">
                        Get Started →
                    </Link>
                </motion.div>
            </main>
        </div>
    );
}