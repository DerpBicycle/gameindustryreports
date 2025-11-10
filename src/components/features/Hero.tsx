'use client';

import { motion } from 'framer-motion';
import { FileText, Search, TrendingUp } from 'lucide-react';

export function Hero() {
  return (
    <section className="relative overflow-hidden bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-800 py-20">
      <div className="absolute inset-0 bg-grid-white/10" />
      <div className="container relative mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="mx-auto max-w-4xl text-center"
        >
          <h1 className="mb-6 text-5xl font-bold text-white md:text-6xl">
            Game Industry Reports
          </h1>
          <p className="mb-8 text-xl text-blue-100 md:text-2xl">
            Your comprehensive database of gaming industry research, market analysis, and strategic insights
          </p>
          <div className="flex flex-wrap justify-center gap-8 text-blue-100">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
              className="flex items-center gap-2"
            >
              <FileText className="h-6 w-6" />
              <span>Comprehensive Reports</span>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 }}
              className="flex items-center gap-2"
            >
              <Search className="h-6 w-6" />
              <span>AI-Powered Analysis</span>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.4 }}
              className="flex items-center gap-2"
            >
              <TrendingUp className="h-6 w-6" />
              <span>Market Insights</span>
            </motion.div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
