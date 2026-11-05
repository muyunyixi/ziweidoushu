import assert from 'node:assert/strict';
import { generateChart } from '../../lib/ziwei/algorithm';
import { generateLocalHemingReport } from '../../lib/ziwei/heming-knowledge';
import { formToBirthInfo } from '../../lib/ziwei/share';

const formA = {
  name: '甲', year: '1990', month: '5', day: '15',
  clockHour: '8', clockMinute: '0', unknownTime: false,
  province: '', city: '', longitude: 120, gender: 'male' as const,
};
const formB = {
  name: '乙', year: '1992', month: '8', day: '20',
  clockHour: '14', clockMinute: '0', unknownTime: false,
  province: '', city: '', longitude: 120, gender: 'female' as const,
};

const chartA1 = generateChart(formToBirthInfo(formA));
const chartB1 = generateChart(formToBirthInfo(formB));
const report1 = generateLocalHemingReport(chartA1, chartB1);
assert.ok(report1.includes('甲') && report1.includes('乙'), 'report should include both names');

const formA2 = { ...formA, year: '1991', month: '6', day: '18' };
const chartA2 = generateChart(formToBirthInfo(formA2));
const report2 = generateLocalHemingReport(chartA2, chartB1);
assert.notEqual(report1, report2, 'changing formA birth date must refresh the compatibility report');

console.log('✓ heming-refresh regression passed');
