import React from 'react';
import { Navbar } from './Navbar';
import { Footer } from './Footer';
import { AnimatedOutlet } from '../ui/Motion';

export function PublicLayout() {
  return (
    <div className="min-h-screen flex flex-col bg-background text-on-surface">
      <Navbar />
      <main className="flex-1 flex flex-col">
        <AnimatedOutlet className="flex-1 flex flex-col" />
      </main>
      <Footer />
    </div>
  );
}
