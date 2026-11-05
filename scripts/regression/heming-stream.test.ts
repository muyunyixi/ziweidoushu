import assert from 'node:assert/strict';
import { generateChart } from '../../lib/ziwei/algorithm';
import { generateLocalHemingReport } from '../../lib/ziwei/heming-knowledge';

const chartA = generateChart({ year: 1990, month: 1, day: 1, hour: 4, gender: 'male', name: '甲方' });
const chartB = generateChart({ year: 1993, month: 6, day: 12, hour: 6, gender: 'female', name: '乙方' });

for (const topic of ['感情匹配度如何？', '适合合伙创业吗？', '两人结婚是否合适？', '哪方面最容易产生矛盾？', '财运是否互补？']) {
  const out = generateLocalHemingReport(chartA, chartB, topic);
  assert.ok(out.includes(topic), `report should address topic: ${topic}`);
  assert.ok(out.includes('【一、倪师双宫联参总评'), 'report should contain 5-step methodology sections');
}

console.log('✓ heming local report regression passed');
