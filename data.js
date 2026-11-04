(function (root) {
  'use strict';
  const data = {
    story: [
      'A市博物馆丢失了一颗珍贵的红宝石。监控拍到一名离开现场的神秘人物，但看不清面貌。',
      '调查人员发现一个遗落的文件袋，里面有一张残缺的身份证复印件和一封尚未寄出的信。调查人员已经核实：这两份资料与同一名需要进一步调查的人有关；信封“寄件人”栏填的是此人使用的通讯地址。',
      '目前有六个人进入调查名单。你是一名小侦探，请进入调查室，查看数字编码的含义，对比线索和人物资料，找出最符合全部已知信息的重点调查对象。',
      '注意：数字编码只能帮助核对信息，不能单独证明某个人实施盗窃。'
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
        lines: ['公民身份号码由18位组成。', '第1—6位：地址码；第7—14位：出生日期码；第15—17位：顺序码；第18位：校验码。', '第7—10位是出生年份。', '第17位是顺序码的一部分，奇数对应男性，偶数对应女性。']
      },
      postal: {
        title: '邮政编码告诉我们什么',
        lines: ['邮政编码通常由6位数字组成，用于标识邮政投递区域。', '前2位表示省级邮区，前3位表示邮区，前4位表示县（市），最后2位表示投递局（所）。', '邮编提供的是投递区域信息，不能单独证明个人身份、当前所在地或犯罪事实。']
      }
    },
    quizzes: [
      { id: 'gender', question: '第17位是5，能判断什么？', options: ['登记性别为男', '出生于5月', '可以证明此人实施盗窃'], correct: 0 },
      { id: 'year', question: '199□ 能确定什么？', options: ['准确出生于1994年', '出生于1990年代，不能确定具体年份', '出生月份为9月'], correct: 1 }
    ],
    reasons: [
      { id: 'A', text: '第17位是奇数，身份证登记性别为男性。' },
      { id: 'B', text: '出生年份显示 199□，说明属于1990年代。' },
      { id: 'C', text: '该信封的寄件人邮编对应成都，与登记通讯城市吻合。' },
      { id: 'D', text: '只凭邮政编码就能证明一个人的身份。' }
    ]
  };
  root.CaseData = data;
  if (typeof module !== 'undefined') module.exports = data;
})(typeof window !== 'undefined' ? window : globalThis);
