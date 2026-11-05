'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import BrandLogo from '@/components/BrandLogo';
import { searchClassics, getParagraphById, type SearchHit } from '@/lib/classics';

export default function SearchPage() {
  const [q, setQ] = useState('');
  const [inputVal, setInputVal] = useState('');
  const [hits, setHits] = useState<SearchHit[]>([]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const sp = new URLSearchParams(window.location.search);
    const initialQ = sp.get('q')?.trim() || '';
    setQ(initialQ);
    setInputVal(initialQ);
    setHits(initialQ ? searchClassics(initialQ, 50) : []);
  }, []);

  const handleSearch = (keyword: string) => {
    const trimmed = keyword.trim();
    setQ(trimmed);
    setInputVal(trimmed);
    setHits(trimmed ? searchClassics(trimmed, 50) : []);
    if (typeof window !== 'undefined') {
      const url = new URL(window.location.href);
      if (trimmed) url.searchParams.set('q', trimmed);
      else url.searchParams.delete('q');
      window.history.replaceState({}, '', url.toString());
    }
  };

  return (
    <div style={{ background: 'var(--bg-page)', minHeight: '100vh' }}>
      <div className="px-4 sm:px-6 py-3 flex items-center justify-between"
        style={{ borderBottom: '1px solid rgba(184,146,42,0.15)', background: 'var(--bg-page)' }}>
        <BrandLogo size="sm" />
        <div className="flex items-center gap-3">
          <Link href="/library" style={{ fontSize: '12px', color: 'var(--ac)', letterSpacing: '0.2em', textDecoration: 'none' }}>
            ← 返回古籍库
          </Link>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-10">
        {/* 页内实时搜索框 */}
        <div style={{
          display: 'flex', gap: '8px', padding: '6px', marginBottom: '28px',
          background: 'var(--bg-card)', border: '1px solid rgba(184,146,42,0.3)',
          borderRadius: '12px', boxShadow: '0 4px 16px rgba(184,146,42,0.08)',
        }}>
          <input
            value={inputVal}
            onChange={e => setInputVal(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleSearch(inputVal)}
            placeholder="输入关键词检索古籍原文，如：七杀朝斗 / 双禄朝垣 / 化忌"
            style={{
              flex: 1, padding: '10px 14px', border: 'none', outline: 'none',
              fontSize: '14px', color: 'var(--tx-0)', background: 'transparent',
            }}
          />
          <button
            type="button"
            onClick={() => handleSearch(inputVal)}
            style={{
              padding: '10px 22px', borderRadius: '8px', border: 'none',
              background: 'linear-gradient(135deg, #d4a948 0%, #b8922a 100%)',
              color: 'white', fontSize: '13px', fontWeight: 600, letterSpacing: '0.15em',
              cursor: 'pointer',
            }}
          >
            搜索
          </button>
        </div>

        <div className="text-center mb-8">
          <div style={{ fontSize: '12px', color: 'var(--tx-3)', letterSpacing: '0.15em', marginBottom: '4px' }}>
            检索关键词
          </div>
          <h1 style={{ fontSize: 'clamp(20px, 3.5vw, 30px)', fontWeight: 700, color: 'var(--tx-0)', letterSpacing: '0.1em' }}>
            「{q || '全部推荐'}」
          </h1>
          <div style={{ fontSize: '12px', color: 'var(--tx-3)', marginTop: '6px' }}>
            共找到 <strong style={{ color: 'var(--ac)' }}>{hits.length}</strong> 条古籍原文匹配
          </div>
        </div>

        {hits.length === 0 ? (
          <div style={{
            background: 'var(--bg-card)', padding: '36px 20px', borderRadius: '12px',
            textAlign: 'center', color: 'var(--tx-2)', border: '1px solid rgba(184,146,42,0.15)',
          }}>
            <div style={{ fontSize: '36px', marginBottom: '10px', opacity: 0.4 }}>📜</div>
            <div style={{ fontSize: '14px', marginBottom: '10px' }}>
              {q ? '暂未在已收录古籍中找到该关键词' : '点击下方热门词条或输入关键词直接检索'}
            </div>
            <div className="flex flex-wrap justify-center gap-2 mt-3">
              {['紫微', '七杀', '化禄', '化忌', '命宫', '夫妻', '财帛', '太阳', '太阴'].map(kw => (
                <button
                  key={kw}
                  type="button"
                  onClick={() => handleSearch(kw)}
                  className="text-xs px-3 py-1 rounded-full cursor-pointer"
                  style={{ border: '1px solid rgba(184,146,42,0.35)', background: 'rgba(184,146,42,0.08)', color: 'var(--ac)' }}
                >
                  {kw}
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {hits.map((hit, i) => {
              const ctx = getParagraphById(hit.paragraphId);
              const chapterIdx = ctx?.chapterIdx ?? 0;
              return (
                <Link
                  key={i}
                  href={`/library/${hit.bookSlug}/${chapterIdx}#${hit.paragraphId}`}
                  style={{
                    display: 'block', background: 'var(--bg-card)', padding: '16px 20px',
                    borderRadius: '10px', border: '1px solid rgba(184,146,42,0.18)',
                    textDecoration: 'none', color: 'inherit',
                  }}
                >
                  <div style={{
                    display: 'flex', alignItems: 'center', gap: '8px', fontSize: '11px',
                    color: 'var(--tx-3)', marginBottom: '8px', letterSpacing: '0.1em',
                  }}>
                    <span style={{ color: 'var(--ac)', fontWeight: 600 }}>《{hit.bookTitle}》</span>
                    <span style={{ opacity: 0.5 }}>·</span>
                    <span>{hit.chapterTitle}</span>
                  </div>
                  <div
                    style={{ fontSize: '14px', color: 'var(--tx-0)', lineHeight: 1.9, letterSpacing: '0.02em' }}
                    dangerouslySetInnerHTML={{ __html: hit.snippet }}
                  />
                </Link>
              );
            })}
          </div>
        )}
      </div>

      <style>{`
        mark { background: rgba(184,146,42,0.3); color: #8b6a14; padding: 0 2px; border-radius: 2px; font-weight: 600; }
      `}</style>
    </div>
  );
}
