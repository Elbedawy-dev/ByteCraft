import React from 'react';
import { AboutHero } from '@/features/about/AboutHero';
import { SkillsMatrix } from '@/features/about/SkillsMatrix';
import { DevelopmentLifecycle } from '@/features/about/DevelopmentLifecycle';

export default function AboutPage() {
  return (
    <div className="flex flex-col w-full bg-background">
      <AboutHero />
      <SkillsMatrix />
      <DevelopmentLifecycle />
    </div>
  );
}
