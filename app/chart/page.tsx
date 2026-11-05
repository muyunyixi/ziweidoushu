'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import BirthForm, { type BirthFormState } from '@/components/BirthForm';
import ChartBoard from '@/components/ChartBoard';
import ChartSummary from '@/components/ChartSummary';
import InsightPanel, { type SelectedSiHua } from '@/components/InsightPanel';
import StarDetailPanel from '@/components/StarDetailPanel';
import FamousPersonCard from '@/components/FamousPersonCard';
import ShareModal from '@/components/ShareModal';
import BrandLogo from '@/components/BrandLogo';
import type { TimeView } from '@/components/TimeNav';
import { generateChart } from '@/lib/ziwei/algorithm';
import { FAMOUS_PERSONS, type FamousPerson } from '@/lib/ziwei/famous';
import { useHistory } from '@/lib/ziwei/history';
import { formToBirthInfo, formToSearchParams, searchParamsToForm } from '@/lib/ziwei/share';
import { useTheme } from '@/components/ThemeProvider';
import type { BirthInfo, ZiweiChart, Palace, Star } from '@/lib/ziwei/types';

export default function ChartPage() {
  const { theme, toggle } = useTheme();
  const isDark = theme === 'dark';
  const { history, save: saveHistory, remove: removeHistory } = useHistory();

  const [chart, setChart] = useState<ZiweiChart | null>(null);
  const [currentForm, setCurrentForm] = useState<BirthFormState | null>(null);
  const [initialForm, setInitialForm] = useState<Partial<BirthFormState> | undefined>(undefined);
  const [famousPerson, setFamousPerson] = useState<FamousPerson | null>(null);

  const [selectedPalace, setSelectedPalace] = useState<Palace | null>(null);
  const [selectedStar, setSelectedStar] = useState<{ star: Star; palaceName: string } | null>(null);
  const [selectedSiHua, setSelectedSiHua] = useState<SelectedSiHua | null>(null);
  const [view, setView] = useState<TimeView>('mingpan');
  const [liunianYear, setLiunianYear] = useState(() => new Date().getFullYear());

  // 移动端底部详批 Tab：'insight'（十三维与宫位详批） | 'summary'（格局与四化总览）
  const [mobileTab, setMobileTab] = useState<'insight' | 'summary'>('insight');
  const [shareOpen, setShareOpen] = useState(false);

  // 支持从分享链接参数直接起盘
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const sp = new URLSearchParams(window.location.search);
    const parsed = searchParamsToForm(sp);
    if (parsed && parsed.year && parsed.month && parsed.day) {
      setInitialForm(parsed);
      const fullForm: BirthFormState = {
        name: parsed.name ?? '',
        year: parsed.year,
        month: parsed.month,
        day: parsed.day,
        clockHour: parsed.clockHour ?? '8',
        clockMinute: parsed.clockMinute ?? '0',
        unknownTime: parsed.unknownTime ?? false,
        province: parsed.province ?? '',
        city: parsed.city ?? '',
        longitude: parsed.longitude ?? 120,
        gender: parsed.gender ?? 'male',
      };
      try {
        const c = generateChart(formToBirthInfo(fullForm));
        setCurrentForm(fullForm);
        setChart(c);
      } catch { /* ignore invalid URL params */ }
    }
  }, []);

  const handleBirthSubmit = (info: BirthInfo) => {
    const c = generateChart(info);
    setFamousPerson(null);
    setSelectedPalace(null);
    setSelectedStar(null);
    setSelectedSiHua(null);
    setChart(c);
    if (currentForm) saveHistory(currentForm);
  };

  const handleLoadHistory = (form: BirthFormState) => {
    try {
      const c = generateChart(formToBirthInfo(form));
      setCurrentForm(form);
      setInitialForm(form);
      setFamousPerson(null);
      setSelectedPalace(null);
      setSelectedStar(null);
      setSelectedSiHua(null);
      setChart(c);
    } catch { /* ignore */ }
  };

  const handleLoadFamous = (fp: FamousPerson) => {
    const c = generateChart({
      name: fp.name,
      year: fp.year,
      month: fp.month,
      day: fp.day,
      hour: fp.hour,
      gender: fp.gender,
      longitude: 120,
    });
    setFamousPerson(fp);
    setCurrentForm({
      name: fp.name,
      year: String(fp.year),
      month: String(fp.month),
      day: String(fp.day),
      clockHour: String(fp.hour * 2),
      clockMinute: '0',
      unknownTime: false,
      province: '',
      city: '',
      longitude: 120,
      gender: fp.gender,
    });
    setSelectedPalace(null);
    setSelectedStar(null);
    setSelectedSiHua(null);
    setChart(c);
  };

  const shareUrl = typeof window !== 'undefined'
    ? (currentForm
        ? `${window.location.origin}${process.env.NEXT_PUBLIC_BASE_PATH || ''}/chart/?${formToSearchParams(currentForm).toString()}`
        : window.location.href)
    : '';

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-0)' }}>
      {/* 顶部导航栏（移动端优先） */}
      <header
        style={{
          position: 'sticky', top: 0, zIndex: 50,
          background: isDark ? 'rgba(2,8,16,0.92)' : 'rgba(250,245,235,0.94)',
          backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)',
          borderBottom: '1px solid var(--bdr)',
        }}
        className="px-3 sm:px-6 py-2.5 flex items-center justify-between gap-2"
      >
        <div className="flex items-center gap-2.5 min-w-0">
          {chart && (
            <button
              type="button"
              onClick={() => { setChart(null); setSelectedPalace(null); setSelectedStar(null); setFamousPerson(null); }}
              className="text-xs px-2.5 py-1.5 rounded-full cursor-pointer flex-shrink-0"
              style={{
                border: '1px solid var(--ac-bdr)',
                background: 'var(--ac-bg)',
                color: 'var(--ac)',
                fontWeight: 500,
              }}
            >
              ← 重新起盘
            </button>
          )}
          <BrandLogo size="sm" />
        </div>

        <div className="flex items-center gap-1.5 sm:gap-2 flex-shrink-0">
          {chart && (
            <button
              type="button"
              onClick={() => setShareOpen(true)}
              className="text-xs px-3 py-1.5 rounded-full cursor-pointer font-medium"
              style={{
                background: 'linear-gradient(135deg, #b8892a, #d4a843)',
                color: '#0d0d0b',
                border: 'none',
              }}
            >
              ✦ 分享命盘
            </button>
          )}
          <Link
            href="/heming"
            className="text-xs px-2.5 py-1.5 rounded-full"
            style={{ border: '1px solid var(--bdr-med)', color: 'var(--tx-2)', textDecoration: 'none' }}
          >
            合盘
          </Link>
          <Link
            href="/library"
            className="text-xs px-2.5 py-1.5 rounded-full hidden sm:inline-block"
            style={{ border: '1px solid var(--bdr-med)', color: 'var(--tx-2)', textDecoration: 'none' }}
          >
            古籍
          </Link>
          <Link
            href="/knowledge"
            className="text-xs px-2.5 py-1.5 rounded-full hidden sm:inline-block"
            style={{ border: '1px solid var(--bdr-med)', color: 'var(--tx-2)', textDecoration: 'none' }}
          >
            百科
          </Link>
          <button
            type="button"
            onClick={toggle}
            className="text-xs px-2.5 py-1.5 rounded-full cursor-pointer"
            style={{ border: '1px solid var(--bdr-med)', background: 'transparent', color: 'var(--tx-2)' }}
          >
            {isDark ? '☀' : '☾'}
          </button>
        </div>
      </header>

      {/* ── 未起盘：展示生辰表单 + 历史记录 + 名人命盘示例 ── */}
      {!chart ? (
        <main className="max-w-xl mx-auto px-4 py-8 sm:py-12">
          <div className="text-center mb-6">
            <h1 className="text-2xl sm:text-3xl font-bold tracking-[0.2em] mb-1.5" style={{ color: 'var(--tx-0)' }}>
              紫微斗数排盘
            </h1>
            <p className="font-huiwen text-sm tracking-[0.28em]" style={{ color: 'var(--ac)' }}>
              一生寥落动幽情
            </p>
            <p className="text-xs mt-2" style={{ color: 'var(--tx-3)' }}>
              输入出生年月日时，依倪海厦《天纪》三合派法则推演十二宫与十三维详批
            </p>
          </div>

          <BirthForm
            initialData={initialForm}
            onFormSave={setCurrentForm}
            onSubmit={handleBirthSubmit}
          />

          {/* 最近排盘历史 */}
          {history.length > 0 && (
            <div className="mt-6 rounded-2xl p-4 card-glass">
              <div className="text-[11px] tracking-widest mb-2.5 flex items-center justify-between" style={{ color: 'var(--t-faint)' }}>
                <span>⏱ 最近排盘记录</span>
                <span className="text-[10px]">点击直接载入</span>
              </div>
              <div className="flex flex-wrap gap-2">
                {history.map(item => (
                  <div
                    key={item.id}
                    className="inline-flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full"
                    style={{ background: 'var(--t-surface)', border: '1px solid var(--t-border)', color: 'var(--t-text2)' }}
                  >
                    <button
                      type="button"
                      onClick={() => handleLoadHistory(item.form)}
                      className="cursor-pointer hover:underline text-left"
                      style={{ background: 'none', border: 'none', color: 'inherit', padding: 0 }}
                    >
                      {item.label}
                    </button>
                    <button
                      type="button"
                      onClick={() => removeHistory(item.id)}
                      className="text-xs opacity-60 hover:opacity-100 cursor-pointer ml-1"
                      style={{ background: 'none', border: 'none', color: 'var(--t-faint)', padding: 0 }}
                      aria-label="删除记录"
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 名人命盘示例 */}
          <div className="mt-6 rounded-2xl p-4 card-glass">
            <div className="text-[11px] tracking-widest mb-2.5 flex items-center justify-between" style={{ color: 'var(--t-faint)' }}>
              <span>★ 经典名人命盘研习</span>
              <span className="text-[10px]">点击一键排盘</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {FAMOUS_PERSONS.map(fp => (
                <button
                  key={fp.id}
                  type="button"
                  onClick={() => handleLoadFamous(fp)}
                  className="text-xs px-3 py-1.5 rounded-full cursor-pointer transition-all"
                  style={{
                    background: 'var(--t-surface)',
                    border: '1px solid var(--t-border)',
                    color: 'var(--t-gold)',
                  }}
                >
                  {fp.name}
                  <span className="text-[10px] ml-1 opacity-70" style={{ color: 'var(--t-faint)' }}>
                    · {fp.category}
                  </span>
                </button>
              ))}
            </div>
          </div>
        </main>
      ) : (
        /* ── 已起盘：移动端优先工作台 ── */
        <main className="max-w-7xl mx-auto px-2.5 sm:px-5 py-4 pb-16">
          {famousPerson && <FamousPersonCard person={famousPerson} />}

          <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1.08fr)_minmax(0,0.92fr)] gap-4 lg:gap-6 items-start">
            {/* 左栏：十二宫命盘 + （桌面端）命格四化格局总览 */}
            <div className="space-y-4">
              <ChartBoard
                chart={chart}
                view={view}
                liunianYear={liunianYear}
                onViewChange={setView}
                onYearChange={setLiunianYear}
                onPalaceSelect={(palace) => {
                  setSelectedPalace(palace);
                  if (palace) setMobileTab('insight');
                }}
                onStarSelect={(star, palace) => {
                  setSelectedStar({ star, palaceName: palace.name });
                }}
                onSiHuaClick={(starName, siHua, v) => {
                  setSelectedSiHua({ starName, siHua, view: v });
                  setMobileTab('insight');
                }}
              />

              {/* 移动端操作提示与分段切换器 */}
              <div className="lg:hidden">
                <div className="grid grid-cols-2 gap-2 p-1 rounded-xl" style={{ background: 'var(--t-surface)', border: '1px solid var(--t-border)' }}>
                  <button
                    type="button"
                    onClick={() => setMobileTab('insight')}
                    className="py-2 text-xs font-semibold rounded-lg transition-all cursor-pointer"
                    style={{
                      background: mobileTab === 'insight' ? 'rgba(212,168,67,0.16)' : 'transparent',
                      color: mobileTab === 'insight' ? 'var(--t-gold)' : 'var(--t-faint)',
                      border: mobileTab === 'insight' ? '1px solid rgba(212,168,67,0.35)' : '1px solid transparent',
                    }}
                  >
                    ✦ 十三维与宫位详批
                  </button>
                  <button
                    type="button"
                    onClick={() => setMobileTab('summary')}
                    className="py-2 text-xs font-semibold rounded-lg transition-all cursor-pointer"
                    style={{
                      background: mobileTab === 'summary' ? 'rgba(212,168,67,0.16)' : 'transparent',
                      color: mobileTab === 'summary' ? 'var(--t-gold)' : 'var(--t-faint)',
                      border: mobileTab === 'summary' ? '1px solid rgba(212,168,67,0.35)' : '1px solid transparent',
                    }}
                  >
                    ◉ 格局识别与大限表
                  </button>
                </div>
              </div>

              {/* 命格总览、本命四化、古籍格局识别、大限运程（桌面端常驻，移动端切到 summary 时显示） */}
              <div className={mobileTab === 'summary' ? 'block' : 'hidden lg:block'}>
                <ChartSummary chart={chart} />
              </div>
            </div>

            {/* 右栏：十三维与十二宫规则详批面板（桌面端常驻，移动端切到 insight 时显示） */}
            <div className={mobileTab === 'insight' ? 'block lg:sticky lg:top-16' : 'hidden lg:block lg:sticky lg:top-16'}>
              <InsightPanel
                chart={chart}
                selectedPalace={selectedPalace}
                selectedSiHua={selectedSiHua}
                view={view}
                liunianYear={liunianYear}
                onPalaceChange={setSelectedPalace}
              />
            </div>
          </div>

          {/* 点击任意星曜弹出的星曜详解抽屉/弹窗（移动端与桌面端通用） */}
          {selectedStar && (
            <div
              className="fixed inset-0 z-[90] flex items-end sm:items-center justify-center p-0 sm:p-4"
              style={{ background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)' }}
              onClick={() => setSelectedStar(null)}
            >
              <div
                className="w-full sm:max-w-lg max-h-[85vh] overflow-y-auto rounded-t-2xl sm:rounded-2xl"
                style={{ background: 'var(--bg-0)' }}
                onClick={e => e.stopPropagation()}
              >
                <StarDetailPanel
                  star={selectedStar.star}
                  palaceName={selectedStar.palaceName}
                  onClose={() => setSelectedStar(null)}
                />
              </div>
            </div>
          )}

          {/* 分享命盘卡片弹窗 */}
          <ShareModal
            open={shareOpen}
            onClose={() => setShareOpen(false)}
            shareUrl={shareUrl}
            chart={chart}
            birth={{
              year: String(chart.birthInfo.year),
              month: String(chart.birthInfo.month),
              day: String(chart.birthInfo.day),
              hour: currentForm?.clockHour || String(chart.birthInfo.hour * 2),
              minute: currentForm?.clockMinute || '00',
              gender: chart.birthInfo.gender,
              city: chart.birthInfo.city,
            }}
          />
        </main>
      )}
    </div>
  );
}
