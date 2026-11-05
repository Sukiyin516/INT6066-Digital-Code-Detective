(function (root) {
  'use strict';
  const data = {
    story: [
      'A市博物馆的红宝石不见了，监控拍到有人离开，却看不清脸。',
      '调查员找到一个文件袋，里面的身份证复印件和没寄出的信都和同一个人有关。',
      '小侦探，去看看线索，找出六人中最符合线索的那一位！',
      '数字能帮你找线索，但光靠数字，不能证明谁偷了宝石。'
    ],
    suspects: [
      { id: 1, name: '1号嫌疑人', gender: '男', year: 1994, city: '成都', color: '#355d78' },
      { id: 2, name: '2号嫌疑人', gender: '女', year: 1992, city: '成都', color: '#a46168' },
      { id: 3, name: '3号嫌疑人', gender: '男', year: 1987, city: '成都', color: '#5d7055' },
      { id: 4, name: '4号嫌疑人', gender: '男', year: 1996, city: '武汉', color: '#85654f' },
      { id: 5, name: '5号嫌疑人', gender: '女', year: 1998, city: '武汉', color: '#81739a' },
      { id: 6, name: '6号嫌疑人', gender: '男', year: 2001, city: '成都', color: '#577d7a' }
    ],
    identity: { address: '□□□□□□', birth: '199□□□□□', sequence: '□□5', check: '□' },
    postalCode: '610000',
    postalRecords: [{ code: '610000', city: '成都' }, { code: '430000', city: '武汉' }],
    tips: {
      identity: {
        title: '身份证里的位置秘密',
        lines: ['公民身份号码有18位。', '对照示意图看四段：第1—6位是地址码，第7—14位是出生日期码，第15—17位是顺序码，第18位是校验码。', '第7—10位是出生年份。', '第17位在顺序码里。这一位是奇数，登记性别为男。这一位是偶数，登记性别为女。']
      },
      postal: {
        title: '邮编怎么读？',
        lines: ['邮政编码通常有6位，告诉我们信送到哪个区域。', '前2位看省级邮区，前3位看邮区，前4位看县（市），最后2位看投递局（所）。', '邮编能告诉我们信往哪儿送。只看邮编，不能知道这个人是谁、现在在哪儿，也不能证明他偷了宝石。']
      }
    },
    quizzes: [
      { id: 'gender', question: '第17位是5，能看出什么？', options: ['登记性别为男', '5月出生', '能证明这个人偷了宝石'], correct: 0 },
      { id: 'year', question: '出生年份是199□，能看出什么？', options: ['1994年出生', '出生在1990年代，具体哪一年还不知道', '9月出生'], correct: 1 }
    ],
    reasons: [
      { id: 'A', text: '第17位是奇数，登记性别为男。' },
      { id: 'B', text: '199□ 表示出生在1990年代。' },
      { id: 'C', text: '寄件人邮编对应成都，和登记的联系城市相同。' },
      { id: 'D', text: '只看邮编，就知道这个人是谁。' }
    ]
  };
  root.CaseData = data;
  if (typeof module !== 'undefined') module.exports = data;
})(typeof window !== 'undefined' ? window : globalThis);
