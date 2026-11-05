import Link from 'next/link';
import React from 'react';

export default function BrandLogo() {
  return (
    <Link href="/" className="inline-flex items-center gap-2 font-semibold tracking-wide text-foreground hover:opacity-80 transition-opacity">
      <span>紫微斗数</span>
    </Link>
  );
}