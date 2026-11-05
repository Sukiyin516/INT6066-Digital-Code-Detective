(function (root) {
  'use strict';
  function evaluateReport(personId, reasons) {
    const chosen = new Set(reasons);
    const personCorrect = Number(personId) === 1;
    const reasonsCorrect = chosen.size === 3 && ['A', 'B', 'C'].every(id => chosen.has(id));
    const hints = [];
    if (!personCorrect) hints.push('比一比性别、出生年份和联系城市。');
    if (!chosen.has('A') || !chosen.has('B')) hints.push('看看第17位和出生年份。');
    if (!chosen.has('C')) hints.push('回看寄件人邮编，再查邮编簿。');
    if (chosen.has('D') || [...chosen].some(id => !['A', 'B', 'C', 'D'].includes(id))) hints.push('邮编能告诉你这个人是谁吗？');
    return { passed: personCorrect && reasonsCorrect, hints };
  }
  function toggleExcluded(excluded, id) {
    return excluded.includes(id) ? excluded.filter(item => item !== id) : [...excluded, id];
  }
  const rules = { evaluateReport, toggleExcluded };
  root.CaseRules = rules;
  if (typeof module !== 'undefined') module.exports = rules;
})(typeof window !== 'undefined' ? window : globalThis);
