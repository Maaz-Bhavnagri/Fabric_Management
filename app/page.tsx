'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';

export default function Home() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        setIsAuthenticated(true);
        router.push('/dashboard');
      }
    };
    checkAuth();
  }, [router, supabase]);

  if (isAuthenticated) {
    return null;
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      {/* Navigation */}
      <nav className="border-b border-slate-700 bg-slate-900/50 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <div className="text-2xl font-bold text-white">KapadMitra</div>
          <Link href="/login">
            <Button className="bg-blue-600 hover:bg-blue-700 text-white">
              Sign In
            </Button>
          </Link>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 text-center">
        <h1 className="text-5xl md:text-6xl font-bold text-white mb-6 text-balance">
          Fabric Store Management Made Easy
        </h1>
        <p className="text-xl text-slate-300 mb-12 max-w-2xl mx-auto text-pretty">
          KapadMitra is a comprehensive management system for textile businesses. Track inventory, manage sales, and grow your business with ease.
        </p>

        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link href="/login">
            <Button size="lg" className="bg-blue-600 hover:bg-blue-700 text-white text-lg px-8 py-6">
              Get Started
            </Button>
          </Link>
          <Button
            size="lg"
            variant="outline"
            className="border-slate-600 text-slate-300 hover:bg-slate-800 text-lg px-8 py-6"
          >
            Learn More
          </Button>
        </div>
      </section>

      {/* Features Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <h2 className="text-3xl font-bold text-white text-center mb-16">
          Everything You Need
        </h2>

        <div className="grid md:grid-cols-3 gap-8">
          <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-8">
            <div className="text-3xl mb-4">📦</div>
            <h3 className="text-xl font-semibold text-white mb-3">
              Inventory Management
            </h3>
            <p className="text-slate-400">
              Track fabric stock, manage suppliers, and monitor inventory levels in real-time.
            </p>
          </div>

          <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-8">
            <div className="text-3xl mb-4">🛒</div>
            <h3 className="text-xl font-semibold text-white mb-3">
              Sales Management
            </h3>
            <p className="text-slate-400">
              Create orders, track shipments, and manage customer purchases effortlessly.
            </p>
          </div>

          <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-8">
            <div className="text-3xl mb-4">📊</div>
            <h3 className="text-xl font-semibold text-white mb-3">
              Analytics & Reports
            </h3>
            <p className="text-slate-400">
              Get insights into sales trends, revenue, and business performance.
            </p>
          </div>

          <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-8">
            <div className="text-3xl mb-4">👥</div>
            <h3 className="text-xl font-semibold text-white mb-3">
              Customer Management
            </h3>
            <p className="text-slate-400">
              Organize customer information and purchase history in one place.
            </p>
          </div>

          <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-8">
            <div className="text-3xl mb-4">🌐</div>
            <h3 className="text-xl font-semibold text-white mb-3">
              Multilingual Support
            </h3>
            <p className="text-slate-400">
              Use KapadMitra in English, Gujarati, or Hindi for better accessibility.
            </p>
          </div>

          <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-8">
            <div className="text-3xl mb-4">🔒</div>
            <h3 className="text-xl font-semibold text-white mb-3">
              Secure & Reliable
            </h3>
            <p className="text-slate-400">
              Your business data is secure and accessible anytime, anywhere.
            </p>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 text-center">
        <div className="bg-gradient-to-r from-blue-600 to-blue-800 rounded-lg p-12">
          <h2 className="text-3xl font-bold text-white mb-4">
            Ready to transform your business?
          </h2>
          <p className="text-blue-100 mb-8 text-lg">
            Start managing your fabric store with KapadMitra today.
          </p>
          <Link href="/login">
            <Button size="lg" className="bg-white hover:bg-slate-100 text-blue-600 text-lg px-8 py-6">
              Get Started Now
            </Button>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-700 bg-slate-900/50 mt-20 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center text-slate-400">
          <p>&copy; 2024 KapadMitra. All rights reserved.</p>
        </div>
      </footer>
    </main>
  );
}
