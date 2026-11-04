(function (root) {
  'use strict';
  function evaluateReport(personId, reasons) {
    const chosen = new Set(reasons);
    const personCorrect = Number(personId) === 1;
    const reasonsCorrect = chosen.size === 3 && ['A', 'B', 'C'].every(id => chosen.has(id));
    const hints = [];
    if (!personCorrect) hints.push('请重新对照人物的性别、出生年份和登记通讯城市，确认是否同时符合全部线索。');
    if (!chosen.has('A') || !chosen.has('B')) hints.push('回看身份证复印件及结构 Tip，检查第17位和出生年份能说明什么。');
    if (!chosen.has('C')) hints.push('回看信封与邮编查询簿，并留意两份资料属于同一调查对象的故事前提。');
    if (chosen.has('D') || [...chosen].some(id => !['A', 'B', 'C', 'D'].includes(id))) hints.push('回看邮政编码 Tip：投递区域信息能单独证明一个人的身份吗？');
    return { passed: personCorrect && reasonsCorrect, hints };
  }
  function toggleExcluded(excluded, id) {
    return excluded.includes(id) ? excluded.filter(item => item !== id) : [...excluded, id];
  }
  const rules = { evaluateReport, toggleExcluded };
  root.CaseRules = rules;
  if (typeof module !== 'undefined') module.exports = rules;
})(typeof window !== 'undefined' ? window : globalThis);
