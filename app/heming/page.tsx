'use client';
import { useState, useCallback, useRef } from 'react';
import Link from 'next/link';
import BirthForm, { type BirthFormState } from '@/components/BirthForm';
import ChartBoard from '@/components/ChartBoard';
import BrandLogo from '@/components/BrandLogo';
import { formToBirthInfo } from '@/lib/ziwei/share';
import { generateChart as buildChart } from '@/lib/ziwei/algorithm';
import { generateLocalHemingReport } from '@/lib/ziwei/heming-knowledge';
import type { BirthInfo, ZiweiChart } from '@/lib/ziwei/types';
import { useTheme } from '@/components/ThemeProvider';

function AiContent({ text }: { text: string }) {
  const lines = text.split('\n');
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
      {lines.map((line, i) => {
        const sectionMatch = line.match(/^\*\*【(.+?)】\*\*$/);
        if (sectionMatch) {
          return (
            <div key={i} style={{ paddingTop: i === 0 ? 0 : '14px', paddingBottom: '4px' }}>
              <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--ac)', letterSpacing: '0.06em' }}>
                【{sectionMatch[1]}】
              </span>
            </div>
          );
        }
        if (line.trim() === '') return <div key={i} style={{ height: '4px' }} />;
        const parts = line.split(/\*\*(.+?)\*\*/);
        return (
          <div key={i} style={{ fontSize: '13px', lineHeight: 1.8, color: 'var(--tx-2)' }}>
            {parts.map((part, j) =>
              j % 2 === 0
                ? part
                : <strong key={j} style={{ fontWeight: 600, color: 'var(--tx-0)' }}>{part}</strong>
            )}
          </div>
        );
      })}
    </div>
  );
}

export default function HemingPage() {
  const { theme, toggle } = useTheme();
  const isDark = theme === 'dark';

  const [chartA, setChartA] = useState<ZiweiChart | null>(null);
  const [chartB, setChartB] = useState<ZiweiChart | null>(null);
  const [formA, setFormA] = useState<BirthFormState | null>(null);
  const [formB, setFormB] = useState<BirthFormState | null>(null);
  const [activeChartTab, setActiveChartTab] = useState<'A' | 'B'>('A');

  const [analysis, setAnalysis] = useState('');
  const [activeTopic, setActiveTopic] = useState<string>('');
  const [formError, setFormError] = useState<string | null>(null);
  const analysisRef = useRef<HTMLDivElement>(null);

  const generateChart = useCallback(async (info: BirthInfo): Promise<ZiweiChart | null> => {
    try {
      return buildChart(info);
    } catch {
      return null;
    }
  }, []);

  // 表单是否填齐
  const isFormReady = (f: BirthFormState | null): boolean =>
    !!(f && f.year && f.month && f.day && f.gender && (f.unknownTime || (f.clockHour !== '' && f.clockMinute !== '')));

  // 统一入口：起盘 + 本地规则合盘分析
  const runAnalysis = useCallback(async (q?: string) => {
    setFormError(null);
    if (!isFormReady(formA) || !isFormReady(formB)) {
      setFormError('请先填写双方完整出生信息（年份、月份、日期）');
      return;
    }
    const [cA, cB] = await Promise.all([
      generateChart(formToBirthInfo(formA!)),
      generateChart(formToBirthInfo(formB!)),
    ]);
    if (!cA || !cB) {
      setFormError('出生日期有误，请检查后重试');
      return;
    }
    setChartA(cA);
    setChartB(cB);
    setActiveTopic(q || '');
    const report = generateLocalHemingReport(cA, cB, q);
    setAnalysis(report);
    setTimeout(() => analysisRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 80);
  }, [formA, formB, generateChart]);

  const cardStyle = {
    background: isDark ? 'rgba(255,255,255,0.04)' : 'rgba(255,255,255,0.92)',
    border: `1px solid ${isDark ? 'rgba(255,255,255,0.1)' : 'rgba(200,160,60,0.22)'}`,
    borderRadius: '18px',
    padding: '20px',
  };

  const labelStyle = {
    fontSize: '11px', letterSpacing: '0.35em', color: 'var(--ac)', fontWeight: 600,
    marginBottom: '12px', display: 'block',
  };

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-0)' }}>
      {/* 顶栏（移动端优先） */}
      <header style={{
        position: 'sticky', top: 0, zIndex: 50,
        background: isDark ? 'rgba(2,8,16,0.92)' : 'rgba(250,245,235,0.94)',
        backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)',
        borderBottom: '1px solid var(--bdr)',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '8px 16px', gap: '10px',
      }}>
        <BrandLogo size="sm" />
        <div className="flex items-center gap-2 flex-wrap">
          <Link href="/chart" className="text-xs px-2.5 py-1 rounded-full" style={{ border: '1px solid var(--ac-bdr)', color: 'var(--ac)', textDecoration: 'none' }}>
            单人排盘
          </Link>
          <Link href="/library" className="text-xs px-2.5 py-1 rounded-full hidden sm:inline-block" style={{ border: '1px solid var(--bdr-med)', color: 'var(--tx-2)', textDecoration: 'none' }}>
            古籍
          </Link>
          <Link href="/knowledge" className="text-xs px-2.5 py-1 rounded-full hidden sm:inline-block" style={{ border: '1px solid var(--bdr-med)', color: 'var(--tx-2)', textDecoration: 'none' }}>
            百科
          </Link>
          <button
            type="button"
            onClick={toggle}
            className="text-xs px-2.5 py-1 rounded-full cursor-pointer"
            style={{ border: '1px solid var(--bdr-med)', background: 'transparent', color: 'var(--tx-2)' }}
          >
            {isDark ? '☀ 亮色' : '☾ 暗色'}
          </button>
        </div>
      </header>

      {/* 主体 */}
      <div style={{ maxWidth: '1140px', margin: '0 auto', padding: '24px 14px 72px' }}>
        {/* 标题 */}
        <div style={{ textAlign: 'center', marginBottom: '28px' }}>
          <div style={{ fontSize: '26px', color: 'var(--ac)', opacity: 0.25, marginBottom: '6px' }}>☯</div>
          <h1 style={{ fontSize: 'clamp(20px, 4vw, 26px)', fontWeight: 700, letterSpacing: '0.18em', color: 'var(--tx-0)', marginBottom: '6px' }}>
            紫微双人合盘
          </h1>
          <p style={{ fontSize: '12px', color: 'var(--tx-3)', lineHeight: 1.7, maxWidth: '540px', margin: '0 auto' }}>
            依倪海厦《天纪》「命宫 · 夫妻宫 · 福德宫」双宫联参法则与四化互飞定式，推演双方缘分契合度、事业合伙与相处之道
          </p>
        </div>

        {/* 双栏表单（移动端单列堆叠，桌面端并排） */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <div style={cardStyle}>
            <span style={labelStyle}>甲方命造 — A</span>
            <BirthForm hideSubmit onSubmit={() => {}} onFormSave={setFormA} />
          </div>
          <div style={cardStyle}>
            <span style={labelStyle}>乙方命造 — B</span>
            <BirthForm hideSubmit onSubmit={() => {}} onFormSave={setFormB} />
          </div>
        </div>

        {/* 立即合盘按钮 */}
        <div className="text-center mb-6">
          <button
            type="button"
            onClick={() => runAnalysis()}
            style={{
              padding: '14px 44px', borderRadius: 'var(--r-pill)', border: 'none',
              background: 'linear-gradient(135deg, #9a6210, #c88020)',
              color: '#fff8e8', fontSize: '14px', fontWeight: 600,
              letterSpacing: '0.18em', cursor: 'pointer',
              boxShadow: '0 4px 16px rgba(140,100,20,0.28)',
            }}
          >
            立即排盘合参
          </button>
          {formError && (
            <div style={{ marginTop: '12px', fontSize: '12px', color: '#ef4444' }}>
              ✕ {formError}
            </div>
          )}
        </div>

        {/* 双方命盘可视化对照（排盘后展示，手机端可一键切换甲/乙方命盘，桌面端并排展示） */}
        {chartA && chartB && (
          <div style={{ ...cardStyle, marginBottom: '20px' }}>
            <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
              <div className="flex items-center gap-2">
                <span style={{ color: 'var(--ac)' }}>✦</span>
                <span className="text-xs font-semibold tracking-widest" style={{ color: 'var(--ac)' }}>
                  双方十二宫命盘对照
                </span>
              </div>
              {/* 移动端切换按钮 */}
              <div className="flex lg:hidden gap-1.5">
                <button
                  type="button"
                  onClick={() => setActiveChartTab('A')}
                  className="text-xs px-3 py-1 rounded-full cursor-pointer"
                  style={{
                    background: activeChartTab === 'A' ? 'var(--ac)' : 'transparent',
                    color: activeChartTab === 'A' ? '#fff' : 'var(--tx-2)',
                    border: '1px solid var(--ac-bdr)',
                  }}
                >
                  甲方：{chartA.birthInfo.name || 'A'}
                </button>
                <button
                  type="button"
                  onClick={() => setActiveChartTab('B')}
                  className="text-xs px-3 py-1 rounded-full cursor-pointer"
                  style={{
                    background: activeChartTab === 'B' ? 'var(--ac)' : 'transparent',
                    color: activeChartTab === 'B' ? '#fff' : 'var(--tx-2)',
                    border: '1px solid var(--ac-bdr)',
                  }}
                >
                  乙方：{chartB.birthInfo.name || 'B'}
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className={activeChartTab === 'A' ? 'block' : 'hidden lg:block'}>
                <ChartBoard chart={chartA} />
              </div>
              <div className={activeChartTab === 'B' ? 'block' : 'hidden lg:block'}>
                <ChartBoard chart={chartB} />
              </div>
            </div>
          </div>
        )}

        {/* 合盘详批报告框 */}
        <div ref={analysisRef} style={{ ...cardStyle, padding: '24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px', marginBottom: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ color: 'var(--ac)' }}>◉</span>
              <span style={{ fontSize: '12px', fontWeight: 600, letterSpacing: '0.25em', color: 'var(--ac)' }}>
                天纪双宫联参合盘报告
              </span>
            </div>
            {analysis && (
              <span style={{ fontSize: '11px', color: 'var(--tx-3)' }}>
                纯古籍与天纪定式推演
              </span>
            )}
          </div>

          {/* 专题切换按钮（排盘后可点选专项切入） */}
          {analysis && (
            <div className="flex flex-wrap gap-2 mb-5 pb-4" style={{ borderBottom: '1px solid var(--bdr)' }}>
              {[
                { label: '综合合盘总览', q: '' },
                { label: '感情匹配度详解', q: '感情匹配度如何？' },
                { label: '合伙创业评估', q: '适合合伙创业吗？' },
                { label: '婚期与年龄配比', q: '两人结婚是否合适？' },
                { label: '核心磨合点排查', q: '哪方面最容易产生矛盾？' },
                { label: '双方财运互补', q: '财运是否互补？' },
              ].map(item => {
                const isAct = activeTopic === item.q;
                return (
                  <button
                    key={item.label}
                    type="button"
                    onClick={() => runAnalysis(item.q || undefined)}
                    style={{
                      fontSize: '12px', padding: '6px 14px',
                      borderRadius: 'var(--r-pill)',
                      border: `1px solid ${isAct ? 'var(--ac)' : 'var(--bdr-med)'}`,
                      background: isAct ? 'var(--ac-bg)' : 'transparent',
                      color: isAct ? 'var(--ac)' : 'var(--tx-2)',
                      fontWeight: isAct ? 600 : 400,
                      cursor: 'pointer',
                    }}
                  >
                    {item.label}
                  </button>
                );
              })}
            </div>
          )}

          {!analysis ? (
            <div style={{ textAlign: 'center', padding: '32px 0', fontSize: '13px', color: 'var(--tx-3)', lineHeight: 1.8 }}>
              填写上方甲、乙双方生辰信息后，点击「立即排盘合参」<br />
              即可生成完整的双人十二宫命盘与五步合盘推演报告
            </div>
          ) : (
            <AiContent text={analysis} />
          )}
        </div>
      </div>
    </div>
  );
}
