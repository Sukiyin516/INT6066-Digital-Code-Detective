(function () {
  'use strict';
  const D = window.CaseData, R = window.CaseRules;
  const key = 'digital-mystery-v1';
  const stage2Dev = location.protocol === 'file:' && new URLSearchParams(location.search).get('dev') === 'stage2';
  const challengeTwo = {
    title: '挑战二：寻找失踪的红宝石',
    code: '02 - 05 - 03 - 402',
    quote: '“东西放在老地方。”'
  };
  const stage2References = [
    { panel: 'neighborhoodRegister', title: '小区编号登记表', label: '资料一：小区编号登记表', description: '查看不同小区对应的数字编号。' },
    { panel: 'housingCode', title: 'TIP 03 · 认识房屋编码', label: '资料二：TIP 03 · 房屋编码规则', description: '学习怎样利用数字表示楼栋、单元和房间的位置。' }
  ];
  const searchLocations = [
    ['A', '幸福小区 · 5号楼3单元402室'],
    ['B', '阳光小区 · 3号楼5单元402室'],
    ['C', '阳光小区 · 5号楼3单元402室'],
    ['D', '星河小区 · 5号楼3单元402室']
  ];
  function freshState() {
    const initial = { started: false, seen: [], tips: [], excluded: [], selected: null, reasons: [], notes: '', quiz: {}, solved: false, clueStatus: null, stage2Seen: [], stage2Solved: false };
    if (stage2Dev) {
      Object.assign(initial, {
        started: true,
        seen: ['identity', 'envelope', 'lookup'],
        tips: ['identity', 'postal'],
        selected: 1,
        reasons: ['A', 'B', 'C'],
        solved: true,
        clueStatus: 'collected'
      });
    }
    return initial;
  }
  let state = freshState();
  try {
    const saved = stage2Dev ? null : JSON.parse(localStorage.getItem(key));
    if (saved && typeof saved === 'object') {
      state.started = saved.started === true;
      state.seen = Array.isArray(saved.seen) ? saved.seen.filter(v => ['identity','envelope','lookup'].includes(v)) : [];
      state.tips = Array.isArray(saved.tips) ? saved.tips.filter(v => ['identity','postal'].includes(v)) : [];
      state.excluded = Array.isArray(saved.excluded) ? saved.excluded.filter(v => D.suspects.some(s => s.id === v)) : [];
      state.selected = D.suspects.some(s => s.id === saved.selected) ? saved.selected : null;
      state.reasons = Array.isArray(saved.reasons) ? saved.reasons.filter(v => D.reasons.some(r => r.id === v)) : [];
      state.notes = typeof saved.notes === 'string' ? saved.notes.slice(0,5000) : '';
      state.quiz = saved.quiz && typeof saved.quiz === 'object' ? saved.quiz : {};
      state.solved = saved.solved === true && R.evaluateReport(state.selected,state.reasons).passed;
      if (['pending', 'discovered', 'collected'].includes(saved.clueStatus)) {
        state.clueStatus = saved.clueStatus;
      } else if (state.solved) {
        state.clueStatus = 'discovered';
      }
      if (state.clueStatus === 'collected' && Array.isArray(saved.stage2Seen)) {
        state.stage2Seen = stage2References.filter(ref => saved.stage2Seen.includes(ref.panel)).map(ref => ref.panel);
      }
      state.stage2Solved = saved.stage2Solved === true && canSubmitSearch();
    }
  } catch (_) { /* 浏览器不允许存储时仍可完成本次调查。 */ }
  document.querySelector('#stage2-dev-badge').hidden = !stage2Dev;
  const dialog = document.querySelector('#panel-dialog');
  const body = document.querySelector('#panel-body');
  const transitionDialog = document.querySelector('#challenge-transition');
  const transitionMessage = transitionDialog.querySelector('.transition-message');
  const transitionClose = transitionDialog.querySelector('.transition-close');
  const continueButton = document.querySelector('#continue-investigation');
  const deskClue = document.querySelector('#desk-clue');
  const paper = transitionDialog.querySelector('.clue-paper');
  deskClue.querySelector('.clue-code').textContent = challengeTwo.code.replaceAll(' ', '');
  deskClue.querySelector('.desk-clue-quote').textContent = challengeTwo.quote;
  document.querySelector('#clue-code').textContent = challengeTwo.code;
  document.querySelector('#clue-quote').textContent = challengeTwo.quote;
  document.querySelector('#challenge-title').textContent = challengeTwo.title;
  const escapeHTML = value => String(value).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  let currentPanel = '', returnFocus = null;
  let clueReturnFocus = null;
  let storageOK = true;
  function save() {
    if (stage2Dev) return;
    try { localStorage.setItem(key,JSON.stringify(state)); storageOK = true; } catch (_) { storageOK = false; }
  }
  function noteStorageStatus(edited = false) {
    if (stage2Dev) return '测试笔记仅保留在当前页面，刷新后清空。';
    if (!storageOK) return '本浏览器无法持久保存；本次调查中笔记仍会保留。';
    return edited ? '笔记已自动保存。' : '笔记随输入自动保存在当前浏览器。';
  }
  function addUnique(list,value) { if (!list.includes(value)) list.push(value); }
  function canSubmitSearch() {
    return state.clueStatus === 'collected' && state.stage2Seen.length === stage2References.length;
  }

  function progress() {
    const stage2Unlocked = state.clueStatus === 'collected';
    deskClue.hidden = !stage2Unlocked;
    // The envelope animation already revealed the first clue before stage two began.
    const count = stage2Unlocked ? 1 + state.stage2Seen.length : state.seen.length;
    const task = stage2Unlocked
      ? [challengeTwo.title, '调查神秘数字的含义，破解红宝石的藏匿地点。']
      : state.clueStatus === 'pending'
      ? ['挑战一完成', '点击「继续调查」，寻找红宝石的下落。']
      : state.clueStatus === 'discovered'
      ? ['查看信封里的新线索', '打开侦探笔记，查看信封中发现的纸条。']
      : count === 3
        ? ['整理证据并提交调查', '核对六人资料，选择对象，并用证据说明判断。']
        : count === 0
          ? ['找到遗落的线索', '点击放大镜，查看身份证、信封和书架资料。']
          : ['继续核对数字编码', '查阅其余资料，用知识 Tip 理解数字的含义。'];
    document.querySelector('#task-title').textContent = task[0];
    document.querySelector('#task-description').textContent = task[1];
    const progressLabel = state.stage2Solved ? '调查进度 · 解码成功'
      : stage2Unlocked && count === 3 ? '调查进度 · 资料收集完成' : '调查进度 · 已查看资料';
    document.querySelector('#progress').innerHTML = `<div class="hud-progress-row"><span>${progressLabel}</span><span class="hud-count">${count} / 3</span></div><div class="hud-progress-track" aria-hidden="true">${[0,1,2].map(i=>`<span class="${i<count?'done':''}"></span>`).join('')}</div>`;
    document.querySelectorAll('.hotspot').forEach(hotspot => {
      hotspot.hidden = stage2Unlocked !== hotspot.hasAttribute('data-stage-2');
      hotspot.classList.toggle('viewed', state.seen.includes(hotspot.dataset.panel));
    });
    const reportLabel = stage2Unlocked ? (canSubmitSearch() ? '提交搜查地点' : '搜查地点')
      : state.clueStatus === 'pending' ? '继续调查' : state.solved ? '回看结案总结' : '提交调查';
    document.querySelector('#report-button').innerHTML = `${reportLabel} <span aria-hidden="true">→</span>`;
  }
  async function showClue(animate = false) {
    clueReturnFocus = document.activeElement === deskClue ? deskClue : document.querySelector('.notebook-control');
    if (dialog.open) dialog.close();
    transitionMessage.hidden = animate;
    transitionClose.hidden = animate;
    continueButton.textContent = state.clueStatus === 'collected' ? '返回调查室' : '继续调查';
    transitionDialog.classList.toggle('is-playing', animate);
    transitionDialog.showModal();

    if (animate) {
      await Promise.allSettled(paper.getAnimations().map(animation => animation.finished));
      transitionDialog.classList.remove('is-playing');
      transitionMessage.hidden = false;
      transitionClose.hidden = false;
    }
    continueButton.focus();
  }

  transitionDialog.addEventListener('cancel', event => {
    if (transitionMessage.hidden) event.preventDefault();
  });
  transitionDialog.addEventListener('close', () => {
    clueReturnFocus.focus();
  });
  transitionClose.addEventListener('click', () => transitionDialog.close());
  continueButton.addEventListener('click', async () => {
    if (transitionMessage.hidden) return;
    if (state.clueStatus === 'collected') {
      transitionDialog.close();
      return;
    }
    transitionMessage.hidden = true;
    transitionClose.hidden = true;
    state.clueStatus = 'collected';
    save();
    transitionDialog.classList.add('is-landing');
    await Promise.allSettled(paper.getAnimations().map(animation => animation.finished));
    progress();
    clueReturnFocus = deskClue;
    transitionDialog.close();
    transitionDialog.classList.remove('is-landing');
  });

  function clueNote() {
    if (!state.clueStatus) return '';
    if (state.clueStatus === 'pending') {
      return '<div class="note-item"><b>挑战一完成</b><p><button data-action="view-clue">继续调查</button></p></div>';
    }
    if (state.clueStatus === 'discovered') {
      return '<div class="note-item"><b>信封里发现的新线索</b><p><button data-action="view-clue">查看新线索</button></p></div>';
    }
    return `<div class="note-item"><b>第二关 · 未寄出信封里的纸条</b><p class="clue-code">${challengeTwo.code}</p><p>${challengeTwo.quote}</p><button data-action="view-clue">查看纸条</button></div>`;
  }
  function codeLibrary() {
    return `<p>这里保存着不同数字编码的资料。仔细观察，也许能找到破解神秘纸条的方法。</p>
      <div class="reference-entries">${stage2References.map(ref => `<button type="button" class="reference-entry" data-panel="${ref.panel}"><strong>${ref.label}</strong><span>${ref.description}</span></button>`).join('')}</div>`;
  }

  const returnToLibrary = '<div class="actions"><button type="button" data-panel="codeLibrary">返回编码资料库</button></div>';

  function neighborhoodRegister() {
    return `<p>为了方便管理，不同小区按照约定使用不同的数字编号。</p>
      <table aria-labelledby="panel-title">
        <thead><tr><th scope="col">编码</th><th scope="col">小区名称</th></tr></thead>
        <tbody><tr><td>01</td><td>幸福小区</td></tr><tr><td>02</td><td>阳光小区</td></tr><tr><td>03</td><td>星河小区</td></tr></tbody>
      </table>
      <p class="notice">观察这些编号，你发现了什么规律？</p>${returnToLibrary}`;
  }

  function housingCode() {
    return `<p>在生活中，我们可以按照一定的规则，用数字表示房屋的位置。</p>
      <p>例如，小牛家住在星河小区2号楼、1单元、3层05号房。</p>
      <div class="tip">
        <p class="lead">03 - 02 - 01 - 305</p>
        <dl class="housing-code-diagram" aria-label="房屋编码分段示例">
          <div><dt>03</dt><dd>星河小区</dd></div>
          <div><dt>02</dt><dd>2号楼</dd></div>
          <div><dt>01</dt><dd>1单元</dd></div>
          <div><dt>305</dt><dd>3层05号房</dd></div>
        </dl>
      </div>
      <p>在这个编号系统中，前三段分别表示小区、楼栋和单元；最后三位中，第一位表示楼层，后两位表示房号。</p>
      <p class="notice">不同位置的数字具有不同含义。现在，你能利用这套规则破解神秘纸条吗？</p>${returnToLibrary}`;
  }

  function referenceNotes() {
    if (state.clueStatus !== 'collected' || !state.stage2Seen.length) return '';
    const entries = stage2References.filter(ref => state.stage2Seen.includes(ref.panel));
    return `<h3>第二关 · 编码资料</h3><div class="reference-entries">${entries.map(ref => `<button type="button" class="reference-entry" data-panel="${ref.panel}"><strong>${ref.label}</strong><span>重新查看资料</span></button>`).join('')}</div>`;
  }

  function searchLocation() {
    return `<p>根据神秘纸条上的数字：</p>
      <p class="lead clue-code">${challengeTwo.code}</p>
      <form id="search-location-form">
        <fieldset class="report-field">
          <legend>你认为红宝石可能藏在哪里？</legend>
          ${searchLocations.map(([id, address]) => `<label class="option"><input type="radio" name="search-location" value="${id}" required><span>${id}. ${address}</span></label>`).join('')}
        </fieldset>
        <div class="actions"><button type="submit" class="primary">确认搜查地点</button></div>
      </form>`;
  }

  function searchNotReady() {
    return `<p>查看小区编号登记表和房屋编码知识卡后，再提交搜查地点。</p>
      <div class="actions"><button type="button" class="primary" data-panel="codeLibrary">查看编码资料库</button></div>`;
  }

  function searchIncorrect() {
    return `<p>请仔细检查每组数字的含义和排列顺序。你可以重新查看小区编号登记表和房屋编码知识卡，再试一次！</p>
      <div class="actions"><button type="button" class="primary" data-action="close">重新调查</button></div>`;
  }

  function searchSuccess() {
    return `<p>你成功破解了神秘数字编码！</p>
      <p class="notice"><strong>正确地点是：阳光小区 · 5号楼 · 3单元 · 4层02室。</strong></p>
      <p>调查人员已经确定了搜查地点！</p>
      <div class="actions"><button type="button" class="primary" disabled>查看结案报告</button></div>
      <p class="modal-muted">结案报告将在后续开放。</p>`;
  }
  function challengeComplete() {
    return `<p class="lead">恭喜你，小侦探！</p>
      <p>你成功运用身份证号码和邮政编码的知识，仔细分析线索，从六名嫌疑人中找出了最符合证据的目标人物！</p>
      <p>你的观察能力和逻辑推理能力非常出色！</p>
      <p>不过，失踪的红宝石究竟在哪里呢？</p>
      <p>看来，调查还没有结束……</p>
      <div class="actions"><button type="button" class="primary" data-action="start-next-challenge">继续调查</button></div>`;
  }
  function tip(type) {
    const t = D.tips[type];
    const structure = type === 'identity' ? `<p class="modal-muted">独立结构示例 · 全部用虚构符号表示，不是真实号码。每格表示一位。</p><div class="structure" aria-label="18位结构示例">${'ABCDEFYYYYMMDDSSSC'.split('').map((c,i)=>`<div class="${i>=6&&i<14?'birth':i>=14&&i<17?'seq':i===17?'last':''} ${i===16?'special':''}"><small>${i+1}</small><b>${c}</b></div>`).join('')}</div><p class="structure-legend">1—6 地址码 ｜ 7—14 出生日期码 ｜ 15—17 顺序码 ｜ 18 校验码<br>YYYY 表示出生年份；第17位位于顺序码中。</p>` : `<p class="modal-muted">完整六位教学示例（与信封证物分开）：</p><div class="postal-example" aria-label="示例邮编213161">${'213161'.split('').map(n=>`<span>${n}</span>`).join('')}</div><p class="structure-legend">21：省级邮区 ｜ 213：邮区 ｜ 2131：县（市） ｜ 61：投递局（所）<br>前面的数字段逐步缩小邮区范围，最后两位标识投递局（所）。</p>`;
    return `<details class="tip" data-tip="${type}"><summary>知识 Tip · ${t.title}</summary>${structure}<ul>${t.lines.map(l=>`<li>${l}</li>`).join('')}</ul></details>`;
  }
  function story() {
    return `<div class="story-gem" aria-hidden="true"><span>◇</span></div>${D.story.map((p,i)=>`<p class="${i===3?'notice':''}">${p}</p>`).join('')}<div class="actions"><button class="primary" data-action="start">${state.started?'返回调查室':'进入调查室 →'}</button></div>`;
  }
  function identity() {
    const e = D.identity;
    return `<p>文件袋中的证物 A。照片和部分数字已经破损，请仔细观察仍能辨认的位置。</p><div class="evidence"><h3>残缺身份证复印件</h3><div class="id-preview"><div class="damaged-photo">照片<br>已遮挡</div><div class="code-groups">${[[e.address,'第1—6位'],[e.birth,'第7—14位'],[e.sequence,'第15—17位'],[e.check,'第18位']].map(([code,label])=>`<div><span class="digits">${code}</span><small>${label}</small></div>`).join('')}</div></div><p class="modal-muted">□ 表示无法辨认的一位。仅为虚构残缺编码，不是真实身份证号码。</p></div>${tip('identity')}<h3>试着解读</h3>${D.quizzes.map(q=>`<fieldset class="quiz"><legend>${q.question}</legend>${q.options.map((o,i)=>`<label class="option"><input type="radio" name="quiz-${q.id}" data-quiz="${q.id}" value="${i}" ${state.quiz[q.id]===i?'checked':''}>${o}</label>`).join('')}<div id="feedback-${q.id}" class="feedback" role="status"></div></fieldset>`).join('')}<div class="actions"><button data-panel="notes">记下我的发现</button><button data-panel="suspects">对照六人资料 →</button></div>`;
  }
  function envelope() {
    return `<p>文件袋中的证物 B。这是一封尚未寄出的信。</p><div class="evidence"><h3>寄件人信息</h3><p><b>寄件人邮政编码</b></p><div class="postal-digits" aria-label="寄件人邮政编码610000">${D.postalCode.split('').map(n=>`<b>${n}</b>`).join('')}</div><p>寄件人通讯地址：其余文字无法辨认。<br>收件人信息：不作为本案线索。</p></div><p class="notice">调查人员已核实：身份证复印件与信封属于同一调查对象，寄件人栏填写的是此人使用的通讯地址。本案只比对城市级登记通讯地址。</p>${tip('postal')}<div class="actions"><button class="primary" data-panel="lookup">前往邮编查询簿 →</button><button data-panel="notes">记下我的发现</button></div>`;
  }
  function lookup() {
    return `<p>通过邮编查找投递区域，再与人物资料中的登记通讯城市比对。</p><form id="lookup-form"><div class="form-row"><label>输入六位邮编<input name="postcode" type="text" inputmode="numeric" pattern="[0-9]{6}" maxlength="6" placeholder="例如 610000" required autocomplete="off"></label><button class="primary" type="submit">查询区域</button></div><div id="lookup-result" class="feedback" role="status"></div></form><details class="tip"><summary id="postal-reference-title">课堂邮编对照表与说明</summary><table aria-labelledby="postal-reference-title"><thead><tr><th scope="col">邮政编码</th><th scope="col">邮寄区域</th></tr></thead><tbody>${D.postalRecords.map(r=>`<tr><td>${r.code}</td><td>${r.city}</td></tr>`).join('')}</tbody></table><p class="notice">邮编说明邮件投递区域，不能证明个人身份、当前所在地或犯罪事实。本案能比对寄件地址，是因为两件资料已核实属于同一调查对象。</p></details><div class="actions"><button data-panel="suspects">核对六人资料 →</button><button data-panel="envelope">回看信封与 Tip</button></div>`;
  }
  function suspects() {
    return `<p>根据你理解的证据自行排除人物。所有标记都可以恢复，选择人物不会直接结案。</p><div class="suspect-grid">${D.suspects.map(s=>`<article class="suspect-card ${state.excluded.includes(s.id)?'excluded':''} ${state.selected===s.id?'selected':''}"><div class="avatar" style="--avatar:${s.color}" aria-hidden="true"></div><h3>${s.name}</h3><p>性别：${s.gender}　出生：${s.year}年<br>登记通讯城市：${s.city}</p><span class="excluded-label">${state.excluded.includes(s.id)?'已暂时排除':state.selected===s.id?'已选为报告对象':'待核对'}</span><button data-exclude="${s.id}" aria-pressed="${state.excluded.includes(s.id)}">${state.excluded.includes(s.id)?'恢复调查':'暂时排除'}</button><button data-select="${s.id}" aria-pressed="${state.selected===s.id}" ${state.selected===s.id?'disabled':''}>${state.selected===s.id?'已选择':'选择此人'}</button></article>`).join('')}</div><div class="actions"><button class="primary" data-panel="report">填写最终调查报告 →</button><button data-panel="notes">回看调查笔记</button></div>`;
  }
  function notes() {
    return `<h3>已发现的证物与资料</h3>${clueNote()}${referenceNotes()}${state.seen.length===0?'<p>还没有查看证物。回到房间点击放大镜开始调查。</p>':''}${state.seen.includes('identity')?'<div class="note-item"><b>证物 A · 残缺身份证</b><p>第7—14位：199□□□□□；第15—17位：□□5。其余信息及照片无法辨认。</p><button data-panel="identity">重新查看证物</button></div>':''}${state.seen.includes('envelope')?'<div class="note-item"><b>证物 B · 未寄出的信封</b><p>寄件人邮政编码：610000。两份资料已核实属于同一调查对象。</p><button data-panel="envelope">重新查看证物</button></div>':''}${state.seen.includes('lookup')?'<div class="note-item"><b>邮编查询簿</b><p>已打开课堂邮编对照资料。</p><button data-panel="lookup">重新查阅</button></div>':''}<h3>已查看的知识 Tip</h3>${state.tips.length?state.tips.map(tip).join(''):'<p class="modal-muted">查看证物时展开知识 Tip，即可收入这里。</p>'}<h3><label for="my-notes">我自己的推理记录</label></h3><textarea id="my-notes" maxlength="5000" placeholder="我注意到……；它表示……；所以我暂时排除……。请勿填写真实身份信息。">${escapeHTML(state.notes)}</textarea><p id="note-save-status" class="saved" role="status">${noteStorageStatus()}</p><p class="modal-muted">已暂时排除：${state.excluded.length?state.excluded.map(n=>n+'号').join('、'):'无'}。<br>当前选择：${state.selected?state.selected+'号嫌疑人':'尚未选择'}。</p><div class="actions"><button data-panel="suspects">调整排除标记</button><button data-panel="report">填写调查报告 →</button></div>`;
  }
  function report() {
    return `<p>找出最符合全部已知信息的重点调查对象，并说明依据。仅猜中人物不能完成调查。</p><form id="report-form"><fieldset class="report-field"><legend>第一题 · 你选择哪位调查对象？</legend><div class="report-grid">${D.suspects.map(s=>`<label class="option"><input type="radio" name="person" value="${s.id}" ${state.selected===s.id?'checked':''} required>${s.id}号嫌疑人${state.excluded.includes(s.id)?'（已暂排）':''}</label>`).join('')}</div></fieldset><fieldset class="report-field"><legend>第二题 · 选择所有成立的判断依据</legend>${D.reasons.map(r=>`<label class="option"><input type="checkbox" name="reason" value="${r.id}" ${state.reasons.includes(r.id)?'checked':''}><span>${r.id}. ${r.text}</span></label>`).join('')}</fieldset><p class="modal-muted">故事前提：两份资料属于同一调查对象；信封的寄件人栏是其使用的通讯地址。若重新选择被暂排的人物，该人物会恢复调查。</p><div class="feedback" id="report-feedback" role="status" tabindex="-1"></div><div class="actions"><button type="submit" class="primary">确认提交调查报告</button><button type="button" data-action="close">返回房间继续调查</button></div></form>`;
  }
  function summary() {
    return `<span class="stamp">调查报告核对完成</span><h3 class="success-title">你找到了最符合信息的重点调查对象：1号。</h3><p>不仅选对人物，也正确解释了三条信息。</p><ol class="review-list"><li><b>性别：</b>第17位是5，为奇数，身份证登记性别为男性。</li><li><b>出生年份：</b>199□ 只能说明出生于1990—1999年，不能确定具体年份。</li><li><b>通讯城市：</b>寄件人邮编610000对应成都。由于两份资料已核实属于同一对象，才能将其与登记通讯城市比对。</li></ol><p class="notice"><b>重点调查对象不等于已经证明有罪。</b>数字编码帮助核对信息，不能单独证明此人实施盗窃。邮编也不能单独证明个人身份或当前所在地。</p><h3>保护个人信息</h3><p>不要公开、上传或向陌生人提供真实身份证号码和证件照片。游戏中的人物和残缺编码都是虚构的。</p><div class="actions"><button data-action="close" class="primary">返回调查室</button><button data-panel="notes">回看学习笔记</button></div>`;
  }
  const names = { searchLocation:['第二关 · 搜查地点','挑战二 · 确定搜查地点'], searchNotReady:['第二关 · 搜查地点','请先收集完整的编码线索'], searchIncorrect:['第二关 · 再核对一次','还没有找到正确地点！'], searchSuccess:['第二关 · 搜查地点','解码成功！'], codeLibrary:['第二关 · 书架资料','编码资料库'], ...Object.fromEntries(stage2References.map(ref => [ref.panel, ['第二关 · 编码资料库', ref.title]])), challengeComplete:['结案进展','🎉 挑战一完成：成功锁定嫌疑人！'], story:['案件档案','红宝石失踪案'], identity:['证物 A','残缺身份证复印件'], envelope:['证物 B','尚未寄出的信封'], lookup:['资料柜','邮编查询簿'], suspects:['人物核对','六人调查板'], notes:['调查记录','侦探笔记'], report:['最后一步','最终调查报告'], summary:['学习回顾','结案总结'], reset:['重新开始','重新调查这个案件？'] };
  function openPanel(name) {
    if (!names[name]) return;
    const reference = stage2References.find(ref => ref.panel === name);
    if ((reference || name === 'codeLibrary') && state.clueStatus !== 'collected') return;
    if (reference) addUnique(state.stage2Seen, reference.panel);
    if (!dialog.open) returnFocus = document.activeElement;
    currentPanel = name;
    if (['identity','envelope','lookup'].includes(name)) addUnique(state.seen,name);
    save(); progress();
    const [kicker,title] = names[name];
    document.querySelector('#panel-kicker').textContent = kicker;
    document.querySelector('#panel-title').textContent = title;
    const renderers = { searchLocation, searchNotReady, searchIncorrect, searchSuccess, codeLibrary, neighborhoodRegister, housingCode, challengeComplete, story, identity, envelope, lookup, suspects, notes, report, summary, reset:()=>`<p>${stage2Dev ? '这会清除当前页面的测试进度，重新进入第二关测试。' : '这会清除当前浏览器中本案的证物记录、排除标记、答案和个人笔记。'}</p><div class="actions"><button class="primary" data-action="confirm-reset">确认重新开始</button><button data-action="close">保留进度</button></div>` };
    body.innerHTML = renderers[name]();
    body.querySelectorAll('details[data-tip]').forEach(el=>el.addEventListener('toggle',()=>{ if(el.open){addUnique(state.tips,el.dataset.tip);save();} }));
    if (name==='identity') D.quizzes.forEach(q=>{if (Number.isInteger(state.quiz[q.id])) quizFeedback(q,state.quiz[q.id]);});
    if (!dialog.open) dialog.showModal();
    dialog.scrollTop = 0;
    document.querySelector('#close-panel').focus();
  }
  function closePanel() { dialog.close(); }
  dialog.addEventListener('close',()=>{ if(returnFocus && document.contains(returnFocus)) returnFocus.focus(); });
  document.querySelector('#close-panel').addEventListener('click',closePanel);
  document.querySelector('#story-button').addEventListener('click',()=>openPanel('story'));
  document.querySelector('#report-button').addEventListener('click', () => {
    if (state.clueStatus === 'collected') {
      openPanel(state.stage2Solved ? 'searchSuccess' : canSubmitSearch() ? 'searchLocation' : 'searchNotReady');
      return;
    }
    openPanel(state.clueStatus === 'pending' ? 'challengeComplete' : state.solved ? 'summary' : 'report');
  });
  document.querySelector('#reset-button').addEventListener('click',()=>openPanel('reset'));
  document.addEventListener('click',event=>{
    const panel = event.target.closest('[data-panel]');
    if (panel) { openPanel(panel.dataset.panel); return; }
    const action = event.target.closest('[data-action]')?.dataset.action;
    if (action === 'view-clue') {
      if (state.clueStatus === 'pending') openPanel('challengeComplete');
      else if (state.clueStatus) showClue();
    }
    if (action === 'start-next-challenge' && state.clueStatus === 'pending') {
      state.clueStatus = 'discovered';
      save();
      progress();
      showClue(true);
    }
    if (action==='start') {state.started=true;save();closePanel();}
    if (action==='close') closePanel();
    if (action === 'confirm-reset') {
      state = freshState();
      save();
      progress();
      if (stage2Dev) closePanel();
      else openPanel('story');
    }
    const exclude = event.target.closest('[data-exclude]');
    if (exclude) {
      const id = Number(exclude.dataset.exclude);
      state.excluded = R.toggleExcluded(state.excluded,id);
      if(state.excluded.includes(id) && state.selected===id) state.selected=null;
      state.solved=false; save();progress();openPanel('suspects');
      body.querySelector(`[data-exclude="${id}"]`).focus();
    }
    const select = event.target.closest('[data-select]');
    if (select) { state.selected=Number(select.dataset.select);state.excluded=state.excluded.filter(id=>id!==state.selected);state.solved=false;save();progress();openPanel('suspects'); }
  });
  function quizFeedback(q,answer) {
    const el = document.querySelector('#feedback-'+q.id);
    const correct = answer===q.correct;
    el.className = 'feedback'+(correct?' success':'');
    el.textContent = correct?'解读正确！再把这个规则与人物资料核对。':'再想一想：请展开上方结构 Tip，检查数字的位置和规则。';
  }
  body.addEventListener('change',event=>{
    const el=event.target;
    if(el.dataset.quiz){ const q=D.quizzes.find(q=>q.id===el.dataset.quiz);state.quiz[q.id]=Number(el.value);save();quizFeedback(q,state.quiz[q.id]); }
    if(el.closest('#report-form')) {
      state.selected=Number(body.querySelector('input[name=person]:checked')?.value)||null;
      state.reasons=[...body.querySelectorAll('input[name=reason]:checked')].map(el=>el.value);
      state.excluded=state.excluded.filter(id=>id!==state.selected);
      state.solved=false;save();progress();
      document.querySelector('#report-feedback').textContent='';
    }
  });
  body.addEventListener('input',event=>{
    if (event.target.id === 'my-notes') {
      state.notes = event.target.value;
      save();
      document.querySelector('#note-save-status').textContent = noteStorageStatus(true);
    }
  });
  body.addEventListener('submit',event=>{
    event.preventDefault();
    if (event.target.id === 'search-location-form' && canSubmitSearch() && !state.stage2Solved) {
      const choice = new FormData(event.target).get('search-location');
      if (!searchLocations.some(([id]) => id === choice)) return;
      state.stage2Solved = choice === 'C';
      openPanel(state.stage2Solved ? 'searchSuccess' : 'searchIncorrect');
      return;
    }
    if(event.target.id==='lookup-form'){
      const code = new FormData(event.target).get('postcode').trim();
      const record = D.postalRecords.find(r=>r.code===code);
      const el=document.querySelector('#lookup-result');
      el.textContent=record?`${record.code} 对应邮寄区域：${record.city}。请自行与登记通讯城市核对。`:'课堂查询簿暂未收录该邮编。请核对信封中的六位数字，或查看对照表。';
    }
    if(event.target.id==='report-form'){
      const f = new FormData(event.target);
      state.selected=Number(f.get('person'))||null;state.reasons=f.getAll('reason');
      const result = R.evaluateReport(state.selected, state.reasons);
      const firstClear = result.passed && !state.clueStatus;
      state.solved = result.passed;
      if (firstClear) state.clueStatus = 'pending';
      save();
      progress();
      if (result.passed && state.clueStatus === 'pending') openPanel('challengeComplete');
      else if (result.passed) openPanel('summary');
      else {const el=document.querySelector('#report-feedback');el.innerHTML='<b>还需要核对证据，调查记录已保留。</b><ul>'+result.hints.map(h=>`<li>${h}</li>`).join('')+'</ul>';el.focus();}
    }
  });
  progress();
  if(!state.started) openPanel('story');
})();
