'use client';
import { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import type { ZiweiChart, Palace } from '@/lib/ziwei/types';
import type { TimeView } from './TimeNav';
import {
  type TopicKey,
  TOPIC_LABEL,
  analyzeTopicByRules,
  analyzePalaceByRules,
  analyzeSiHuaByRules,
} from '@/lib/ziwei/db-analysis';
import { BRANCHES, STEMS } from '@/lib/ziwei/constants';

export interface SelectedSiHua {
  starName: string;
  siHua: string;
  view: TimeView;
}

interface InsightPanelProps {
  chart: ZiweiChart;
  selectedPalace?: Palace | null;
  selectedSiHua?: SelectedSiHua | null;
  view?: TimeView;
  liunianYear?: number;
  onPalaceChange?: (palace: Palace | null) => void;
}

const TOPICS: { key: TopicKey; label: string }[] = [
  { key: 'overview',    label: '命格' },
  { key: 'personality', label: '性格' },
  { key: 'love',        label: '感情' },
  { key: 'career',      label: '事业' },
  { key: 'wealth',      label: '财运' },
  { key: 'health',      label: '健康' },
  { key: 'spirit',      label: '福德' },
  { key: 'home',        label: '田宅' },
  { key: 'move',        label: '迁移' },
  { key: 'friends',     label: '人际' },
  { key: 'family',      label: '兄弟' },
  { key: 'children',    label: '子女' },
  { key: 'parents',     label: '父母' },
];

/** Render structured rule markdown: **【Title】** → gold header, **bold** → strong */
export function RuleContent({ text }: { text: string }) {
  const lines = text.split('\n');
  return (
    <div className="space-y-1">
      {lines.map((line, i) => {
        const sectionMatch = line.match(/^\*\*【(.+?)】\*\*$/);
        if (sectionMatch) {
          return (
            <div key={i} className="pt-3.5 pb-1 first:pt-0 flex items-center gap-1.5">
              <span className="w-1 h-3.5 rounded-full inline-block" style={{ background: 'var(--t-gold)' }} />
              <span className="text-xs font-semibold tracking-wider" style={{ color: 'var(--t-gold)' }}>
                {sectionMatch[1]}
              </span>
            </div>
          );
        }
        if (line.trim() === '') return <div key={i} className="h-1" />;
        const parts = line.split(/\*\*(.+?)\*\*/);
        return (
          <div key={i} className="text-xs leading-relaxed" style={{ color: 'var(--t-text2)' }}>
            {parts.map((part, j) =>
              j % 2 === 0
                ? part
                : <strong key={j} className="font-semibold" style={{ color: 'var(--t-text)' }}>{part}</strong>
            )}
          </div>
        );
      })}
    </div>
  );
}

export default function InsightPanel({
  chart,
  selectedPalace,
  selectedSiHua,
  view = 'mingpan',
  liunianYear = new Date().getFullYear(),
  onPalaceChange,
}: InsightPanelProps) {
  const [mode, setMode] = useState<'topic' | 'palace' | 'sihua'>('topic');
  const [activeTopic, setActiveTopic] = useState<TopicKey>('overview');

  useEffect(() => {
    if (selectedPalace) {
      setMode('palace');
    }
  }, [selectedPalace]);

  useEffect(() => {
    if (selectedSiHua) {
      setMode('sihua');
    }
  }, [selectedSiHua]);

  const content = useMemo(() => {
    if (mode === 'sihua' && selectedSiHua) {
      return analyzeSiHuaByRules(chart, selectedSiHua.starName, selectedSiHua.siHua, selectedSiHua.view, liunianYear);
    }
    if (mode === 'palace' && selectedPalace) {
      return analyzePalaceByRules(chart, selectedPalace, view, liunianYear);
    }
    return analyzeTopicByRules(chart, activeTopic, view, liunianYear);
  }, [chart, mode, activeTopic, selectedPalace, selectedSiHua, view, liunianYear]);

  const currentSubtitle = useMemo(() => {
    if (mode === 'sihua' && selectedSiHua) {
      return `四化详批 · ${selectedSiHua.starName}化${selectedSiHua.siHua}`;
    }
    if (mode === 'palace' && selectedPalace) {
      return `宫位详批 · ${selectedPalace.name}宫（${STEMS[selectedPalace.stem]}${BRANCHES[selectedPalace.branch]}）`;
    }
    return `十三维详批 · ${TOPIC_LABEL[activeTopic]}`;
  }, [mode, activeTopic, selectedPalace, selectedSiHua]);

  return (
    <div className="flex flex-col rounded-xl overflow-hidden card-glass">
      {/* 面板顶栏 */}
      <div className="px-4 py-3 flex items-center justify-between gap-2" style={{ borderBottom: '1px solid var(--t-border)' }}>
        <div>
          <div className="flex items-center gap-1.5">
            <span style={{ color: 'var(--t-gold)', fontSize: '12px' }}>✦</span>
            <h3 className="text-xs font-semibold tracking-widest" style={{ color: 'var(--t-gold)' }}>
              {currentSubtitle}
            </h3>
          </div>
          <p className="text-[10px] mt-0.5" style={{ color: 'var(--t-faint)' }}>
            倪海厦《天纪》法则 · 《紫微斗数全书》定式推演
          </p>
        </div>
        {mode !== 'topic' && (
          <button
            type="button"
            onClick={() => {
              setMode('topic');
              onPalaceChange?.(null);
            }}
            className="text-[10px] px-2.5 py-1 rounded-full transition-colors flex-shrink-0"
            style={{
              color: 'var(--t-gold)',
              border: '1px solid rgba(212,168,67,0.35)',
              background: 'rgba(212,168,67,0.08)',
              cursor: 'pointer',
            }}
          >
            返回十三维
          </button>
        )}
      </div>

      {/* 13 维主题标签栏（移动端可横向顺滑滚动，桌面端自动折行） */}
      <div className="px-3 pt-2.5 pb-2" style={{ borderBottom: '1px solid var(--t-border)' }}>
        <div className="text-[9px] tracking-widest mb-1.5" style={{ color: 'var(--t-faint)' }}>
          十三维主题速查
        </div>
        <div className="flex flex-wrap gap-1.5">
          {TOPICS.map(t => {
            const isActive = mode === 'topic' && activeTopic === t.key;
            return (
              <button
                key={t.key}
                type="button"
                onClick={() => {
                  setActiveTopic(t.key);
                  setMode('topic');
                }}
                className="text-[11px] px-2.5 py-1 rounded-lg transition-all cursor-pointer"
                style={{
                  background: isActive ? 'rgba(212,168,67,0.16)' : 'var(--t-surface)',
                  border: `1px solid ${isActive ? 'var(--t-gold)' : 'var(--t-border)'}`,
                  color: isActive ? 'var(--t-gold)' : 'var(--t-text2)',
                  fontWeight: isActive ? 600 : 400,
                }}
              >
                {t.label}
              </button>
            );
          })}
        </div>

        {/* 十二宫快捷切换 */}
        <div className="text-[9px] tracking-widest mt-2.5 mb-1.5" style={{ color: 'var(--t-faint)' }}>
          十二宫位详批（亦可直接点击左侧命盘格子）
        </div>
        <div className="flex flex-wrap gap-1">
          {chart.palaces.map(p => {
            const isPalaceActive = mode === 'palace' && selectedPalace?.branch === p.branch;
            return (
              <button
                key={p.branch}
                type="button"
                onClick={() => {
                  onPalaceChange?.(p);
                  setMode('palace');
                }}
                className="text-[10px] px-2 py-0.5 rounded-md transition-all cursor-pointer"
                style={{
                  background: isPalaceActive ? 'rgba(37,99,235,0.16)' : 'transparent',
                  border: `1px solid ${isPalaceActive ? 'rgba(59,130,246,0.6)' : 'var(--t-border)'}`,
                  color: isPalaceActive ? '#60a5fa' : 'var(--t-faint)',
                  fontWeight: isPalaceActive ? 600 : 400,
                }}
              >
                {p.name.replace('宫', '')}
              </button>
            );
          })}
        </div>
      </div>

      {/* 规则推演正文区 */}
      <motion.div
        key={`${mode}-${activeTopic}-${selectedPalace?.branch ?? 'none'}-${selectedSiHua?.starName ?? ''}-${view}-${liunianYear}`}
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.2 }}
        className="p-4 sm:p-5 overflow-y-auto"
      >
        <RuleContent text={content} />
      </motion.div>
    </div>
  );
}
