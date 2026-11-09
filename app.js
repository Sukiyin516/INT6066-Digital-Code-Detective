(function () {
  'use strict';
  const D = window.CaseData, R = window.CaseRules;
  const key = 'digital-mystery-v1';
  const stage2Dev = location.protocol === 'file:' && new URLSearchParams(location.search).get('dev') === 'stage2';
  const challengeTwo = {
    title: '挑战二：找回红宝石',
    code: '02 - 05 - 03 - 402',
    quote: '“东西放在老地方。”'
  };
  const stage2References = [
    { panel: 'neighborhoodRegister', title: '小区编号登记表', label: '小区编号登记表', description: '看看每个小区的编号。' },
    { panel: 'housingCode', title: 'TIP 03 · 认识房屋编码', label: 'TIP 03 · 房屋编码规则', description: '看看数字怎样表示楼栋、单元、楼层和房间。' }
  ];
  const searchLocations = [
    ['A', '幸福小区 · 5号楼3单元402室'],
    ['B', '阳光小区 · 3号楼5单元402室'],
    ['C', '阳光小区 · 5号楼3单元402室'],
    ['D', '星河小区 · 5号楼3单元402室']
  ];
  function freshState() {
    const initial = { started: false, seen: [], tips: [], excluded: [], selected: null, reasons: [], notes: '', quiz: {}, identityClues: [], postalClue: false, reportMistakes: 0, solved: false, clueStatus: null, stage2Seen: [], stage2Solved: false, caseClosed: false };
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
      const savedIdentityClues = Array.isArray(saved.identityClues) ? saved.identityClues : [];
      state.identityClues = D.quizzes
        .filter(q => savedIdentityClues.includes(q.id) || state.quiz[q.id] === q.correct)
        .map(q => q.id);
      state.postalClue = saved.postalClue === true;
      state.reportMistakes = Number.isSafeInteger(saved.reportMistakes) && saved.reportMistakes > 0 ? saved.reportMistakes : 0;
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
      state.caseClosed = saved.caseClosed === true && state.stage2Solved;
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
    if (stage2Dev) return '测试笔记刷新后会清空。';
    if (!storageOK) return '这次的笔记还能看，关掉页面就会消失。';
    return edited ? '笔记已保存。' : '笔记会自动保存。';
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
    const task = state.caseClosed
      ? ['案件已完成', '想再看看？打开结案报告或侦探笔记。']
      : stage2Unlocked
      ? [challengeTwo.title, '查查纸条上的数字，找出宝石可能藏在哪儿。']
      : state.clueStatus === 'pending'
      ? ['挑战一完成', '点「继续调查」，找找红宝石。']
      : state.clueStatus === 'discovered'
      ? ['查看神秘纸条', '打开侦探笔记，看看信封里的新发现。']
      : ['锁定真正的嫌疑人', count === 3
        ? '线索已经集齐！快去调查六位嫌疑人！'
        : count === 0
          ? '点击房间里的物品，寻找隐藏的数字线索！'
          : '继续调查，收集更多线索！'];
    document.querySelector('#task-kicker').textContent = state.clueStatus ? '当前任务 · 红宝石失踪案' : '当前任务 · 数字迷案';
    document.querySelector('#task-title').textContent = task[0];
    document.querySelector('#task-description').textContent = task[1];
    const progressLabel = state.stage2Solved ? '解码成功'
      : stage2Unlocked && count === 3 ? '线索找齐了' : state.clueStatus ? '线索进度' : '线索收集进度';
    document.querySelector('#progress').innerHTML = `<div class="hud-progress-row"><span>${progressLabel}</span><span class="hud-count">${count} / 3</span></div><div class="hud-progress-track" aria-hidden="true">${[0,1,2].map(i=>`<span class="${i<count?'done':''}"></span>`).join('')}</div>`;
    document.querySelectorAll('.hotspot').forEach(hotspot => {
      hotspot.hidden = stage2Unlocked !== hotspot.hasAttribute('data-stage-2');
      hotspot.classList.toggle('viewed', state.seen.includes(hotspot.dataset.panel));
    });
    const reportLabel = state.caseClosed ? '查看结案报告' : stage2Unlocked ? (canSubmitSearch() ? '提交搜查地点' : '搜查地点')
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
    return `<p>纸条上的数字是什么意思？查查这两份资料。</p>
      <div class="reference-entries">${stage2References.map(ref => `<button type="button" class="reference-entry" data-panel="${ref.panel}"><strong>${ref.label}</strong><span>${ref.description}</span></button>`).join('')}</div>`;
  }

  const returnToLibrary = '<div class="actions"><button type="button" data-panel="codeLibrary">返回资料库</button></div>';

  function neighborhoodRegister() {
    return `<p>每个小区都有自己的编号。</p>
      <table aria-labelledby="panel-title">
        <thead><tr><th scope="col">编码</th><th scope="col">小区名称</th></tr></thead>
        <tbody><tr><td>01</td><td>幸福小区</td></tr><tr><td>02</td><td>阳光小区</td></tr><tr><td>03</td><td>星河小区</td></tr></tbody>
      </table>
      <p class="notice">看看这些编号，你发现了什么？</p>${returnToLibrary}`;
  }

  function housingCode() {
    return `<p>数字也能告诉我们房间在哪儿。</p>
      <p>看看小牛家的编码：星河小区、2号楼、1单元、3层05号房。</p>
      <div class="tip">
        <p class="lead">03 - 02 - 01 - 305</p>
        <dl class="housing-code-diagram" aria-label="房屋编码分段示例">
          <div><dt>03</dt><dd>星河小区</dd></div>
          <div><dt>02</dt><dd>2号楼</dd></div>
          <div><dt>01</dt><dd>1单元</dd></div>
          <div><dt>305</dt><dd>3层05号房</dd></div>
        </dl>
      </div>
      <p>前三段按顺序看：小区、楼栋、单元。最后一段有三位，第一位是楼层，后两位是房号。</p>
      <p class="notice">用这个办法，试着读一读神秘纸条！</p>${returnToLibrary}`;
  }

  function referenceNotes() {
    if (state.clueStatus !== 'collected' || !state.stage2Seen.length) return '';
    const entries = stage2References.filter(ref => state.stage2Seen.includes(ref.panel));
    return `<h3>第二关 · 编码资料</h3><div class="reference-entries">${entries.map(ref => `<button type="button" class="reference-entry" data-panel="${ref.panel}"><strong>${ref.label}</strong><span>再看一次</span></button>`).join('')}</div>`;
  }

  function searchLocation() {
    return `<p>纸条上的数字</p>
      <p class="lead clue-code">${challengeTwo.code}</p>
      <form id="search-location-form">
        <fieldset class="report-field">
          <legend>选一个搜查地点。</legend>
          ${searchLocations.map(([id, address]) => `<label class="option"><input type="radio" name="search-location" value="${id}" required><span>${id}. ${address}</span></label>`).join('')}
        </fieldset>
        <div class="actions"><button type="submit" class="primary">确认地点</button></div>
      </form>`;
  }

  function searchNotReady() {
    return `<p>看完小区编号表和房屋编码 Tip，再来选地点。</p>
      <div class="actions"><button type="button" class="primary" data-panel="codeLibrary">打开资料库</button></div>`;
  }

  function searchIncorrect() {
    return `<p>看看每一段数字表示什么，顺序有没有弄反。</p>
      <div class="actions"><button type="button" class="primary" data-action="close">回去找线索</button></div>`;
  }

  function searchSuccess() {
    return `<p>你找到了搜查地点！</p>
      <p class="notice"><strong>阳光小区 · 5号楼 · 3单元 · 4层02室。</strong></p>
      <div class="actions"><button type="button" class="primary" data-action="view-case-resolution">查看结案报告</button></div>`;
  }

  function rubyRecovery() {
    return `<div class="recovered-ruby" aria-hidden="true"></div>
      <p class="recovery-message">红宝石找回来啦！</p>`;
  }

  function victory() {
    return `<p class="victory-subtitle">红宝石回到博物馆啦！</p>
      <p>恭喜你，数字编码小侦探！</p>
      <p>你一步步读懂数字、找对地点。</p>
      <p><strong>这次你学会了：</strong></p>
      <ol class="review-list">
        <li>看懂身份证上不同位置的数字。</li>
        <li>知道邮编能帮我们找投递区域。</li>
        <li>用房屋编码找到小区、楼栋、单元和房间。</li>
        <li>把几条数字线索放在一起，解决问题。</li>
      </ol>
      <p class="victory-finale"><strong>恭喜通关《数字迷案》！</strong></p>
      <div class="actions">
        <button type="button" class="primary" data-action="close">返回调查室</button>
        <button type="button" data-panel="victoryReset">重新开始</button>
      </div>`;
  }

  function victoryReset() {
    return `<p>确定从头开始吗？这次的进度和笔记会清空。</p>
      <div class="actions">
        <button type="button" class="primary" data-action="confirm-victory-reset">确认重新开始</button>
        <button type="button" data-panel="victory">取消</button>
      </div>`;
  }

  async function viewCaseResolution() {
    if (!state.stage2Solved) return;
    if (state.caseClosed || matchMedia('(prefers-reduced-motion: reduce)').matches) {
      state.caseClosed = true;
      openPanel('victory');
      return;
    }
    state.caseClosed = true;
    openPanel('rubyRecovery');
    const ruby = body.querySelector('.recovered-ruby');
    await Promise.allSettled(ruby.getAnimations().map(animation => animation.finished));
    if (dialog.open && body.contains(ruby)) openPanel('victory');
  }

  function restartAfterVictory() {
    state = freshState();
    if (stage2Dev) {
      progress();
      closePanel();
      return;
    }
    try { localStorage.removeItem(key); storageOK = true; } catch (_) { storageOK = false; }
    openPanel('story', { persist: false });
  }
  function challengeComplete() {
    return `<p class="lead">恭喜你，小侦探！</p>
      <p>你找到了最符合线索的人！</p>
      <p>可是，红宝石在哪里呢？</p>
      <div class="actions"><button type="button" class="primary" data-action="start-next-challenge">继续调查</button></div>`;
  }
  function tip(type, withPractice = false, withPostalTask = false) {
    const t = D.tips[type];
    const card = type === 'identity'
      ? `<img class="identity-tip-card" src="assets/tipcard1.png" width="1536" height="1024" alt="身份证编码知识卡。第1至6位是地址码，第7至14位是出生日期码，其中第7至10位是出生年份。第15至17位是顺序码，第17位奇数为男、偶数为女。第18位是校验码。">`
      : `<img class="postal-tip-card" src="assets/tipcard2.png" width="1536" height="1024" alt="邮政编码小知识。邮编由六位数字组成，可以帮助我们核对地区线索。">`;
    const postalTask = withPostalTask ? `
      <section class="postal-investigation-task" aria-labelledby="postal-task-title">
        <h3 id="postal-task-title">新的调查任务！</h3>
        <p>信封上的邮政编码是 610000。快去查一查，它对应哪个地区吧！</p>
        <button type="button" data-panel="lookup">去查邮编</button>
      </section>` : '';
    const useDetectiveCard = withPractice || withPostalTask;
    const heading = useDetectiveCard ? `<summary class="detective-tip-summary">
      <span class="detective-tip-icon" aria-hidden="true">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round">
          <path d="M9 18h6m-5 3h4m-5-6c0-1.4-1-2-1.8-3a6 6 0 1 1 9.6 0c-.8 1-1.8 1.6-1.8 3v1H9z"/>
        </svg>
      </span>
      <span class="detective-tip-copy">
        <strong>知识 Tip · ${t.title}</strong>
        <span>${withPostalTask ? '点击查看知识，读懂信封上的邮编！' : '点击查看知识，找出隐藏的数字线索！'}</span>
      </span>
      <span class="detective-tip-cta" aria-hidden="true">
        <span class="detective-tip-open">点击查看 →</span>
        <span class="detective-tip-close">收起提示</span>
      </span>
    </summary>` : `<summary>知识 Tip · ${t.title}</summary>`;
    const practiceIntro = withPractice ? `
      <div class="tip-practice-actions">
        <p class="tip-practice-prompt">
          <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">
            <circle cx="10" cy="10" r="6"/><path d="m15 15 5 5"/>
          </svg>
          <strong>准备好破解身份证上的数字秘密了吗？</strong>
        </p>
        <p>运用刚学到的编码知识，找出证物 A 中隐藏的线索！</p>
        <button type="button" data-action="open-identity-practice" aria-controls="identity-practice" aria-expanded="false">开始解密 <span aria-hidden="true">→</span></button>
      </div>` : '';
    return `<details class="tip${useDetectiveCard ? ' detective-tip' : ''}" data-tip="${type}">${heading}${card}${postalTask}${practiceIntro}</details>`;
  }
  function story() {
    return `<div class="story-gem" aria-hidden="true"><span>◇</span></div>${D.story.map((p,i)=>`<p class="${i===3?'notice':''}">${p}</p>`).join('')}<div class="actions"><button class="primary" data-action="start">${state.started?'返回调查室':'进入调查室 →'}</button></div>`;
  }
  function identity() {
    return `<p>这是证物 A。照片看不清了。看看哪些数字还认得出来！</p><div class="identity-learning">
      <div class="identity-tip-column">
        <div class="identity-evidence-frame"><img class="evidence-image identity-evidence" src="id.svg" width="960" height="600" alt="残缺身份证复印件，第7至9位为199，第17位为5，其余位无法辨认。"></div>
        ${tip('identity', true)}
      </div>
      <section class="identity-practice" id="identity-practice" role="region" aria-labelledby="identity-practice-title" hidden>
        <div class="practice-heading"><h3 id="identity-practice-title" tabindex="-1">线索解密</h3><button type="button" data-action="close-identity-practice">收起解密</button></div>
        ${D.quizzes.map(q=>`<fieldset class="quiz"><legend>${q.question}</legend>${q.options.map((o,i)=>`<label class="option"><input type="radio" name="quiz-${q.id}" data-quiz="${q.id}" value="${i}" ${state.quiz[q.id]===i?'checked':''}>${o}</label>`).join('')}<div id="feedback-${q.id}" class="feedback" role="status"></div></fieldset>`).join('')}
      </section>
    </div>
    <div class="investigate-suspects" hidden>
      <button type="button" data-panel="suspects">调查嫌疑人 <span aria-hidden="true">→</span></button>
    </div>`;
  }
  function envelope() {
    return `<p>这是证物 B，一封没寄出的信。</p><img class="evidence-image envelope-evidence" src="mail.svg" width="1020" height="600" alt="破损信封，寄件人邮政编码610000。">
      ${tip('postal', false, true)}`;
  }
  function lookup() {
    const magnifier = `<svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="10" cy="10" r="6"/><path d="m15 15 5 5"/></svg>`;
    return `
      <section class="lookup-task" aria-labelledby="lookup-task-title">
        <h3 id="lookup-task-title" class="tip-practice-prompt">${magnifier} 调查任务 · 寻找邮编对应的城市</h3>
        <p>信封上的邮编是 610000。输入邮编，看看它指向哪里！</p>
      </section>
      <form id="lookup-form">
        <div class="form-row">
          <label>输入6位邮编<input name="postcode" type="text" inputmode="numeric" pattern="[0-9]{6}" maxlength="6" placeholder="例如 610000" required autocomplete="off"></label>
          <button class="lookup-action" type="submit">${magnifier} 查询邮编</button>
        </div>
        <div id="lookup-error" class="feedback" role="status"></div>
      </form>
      <section id="lookup-result" class="lookup-result-card" aria-labelledby="lookup-result-title" hidden>
        <h3 id="lookup-result-title" tabindex="-1">找到新线索！</h3>
        <p id="lookup-match"></p>
        <p>快去查看六位嫌疑人的资料，找出登记了相关城市的人！</p>
        <button class="lookup-action" type="button" data-panel="suspects">调查嫌疑人 <span aria-hidden="true">→</span></button>
      </section>
      <details class="tip"><summary id="postal-reference-title">邮编对照表</summary><table aria-labelledby="postal-reference-title"><thead><tr><th scope="col">邮政编码</th><th scope="col">邮寄区域</th></tr></thead><tbody>${D.postalRecords.map(r=>`<tr><td>${r.code}</td><td>${r.city}</td></tr>`).join('')}</tbody></table><p class="notice">这两件证物都和同一个人有关，所以这次可以用寄件人邮编来核对联系城市。</p></details>
      <div class="actions"><button type="button" class="quiet" data-panel="envelope">回看信封</button></div>`;
  }
  function suspects() {
    return `<p>对照线索，划掉不符合的人。划错了可以加回来。选出最符合线索的人，再交调查报告。</p><div class="suspect-grid">${D.suspects.map(s=>`<article class="suspect-card ${state.excluded.includes(s.id)?'excluded':''} ${state.selected===s.id?'selected':''}"><div class="avatar" style="--avatar:${s.color}" aria-hidden="true"></div><h3>${s.name}</h3><p>性别：${s.gender}　出生：${s.year}年<br>联系城市（登记）：${s.city}</p><span class="excluded-label">${state.excluded.includes(s.id)?'已划掉':state.selected===s.id?'已选中':'待查看'}</span><button data-exclude="${s.id}" aria-pressed="${state.excluded.includes(s.id)}">${state.excluded.includes(s.id)?'加回来':'先划掉'}</button><button data-select="${s.id}" aria-pressed="${state.selected===s.id}" ${state.selected===s.id?'disabled':''}>${state.selected===s.id?'已选中':'选这个人'}</button></article>`).join('')}</div><div class="actions"><button class="primary" data-panel="report">写第一关报告</button><button data-panel="notes">看笔记</button></div>`;
  }
  function identityClueNotes() {
    const clues = D.quizzes.filter(q => state.identityClues.includes(q.id));
    if (!clues.length) return '';
    return `<div class="note-item"><b>证物 A · 解密线索</b><ul>${clues.map(q => `<li>${escapeHTML(q.options[q.correct])}</li>`).join('')}</ul></div>`;
  }
  function notes() {
    const postalRecord = state.postalClue && D.postalRecords.find(record => record.code === D.postalCode);
    const postalClue = postalRecord
      ? `<div class="note-item"><b>证物 B · 解密线索</b><ul><li>邮政编码 ${escapeHTML(postalRecord.code)} 对应的城市是${escapeHTML(postalRecord.city)}。</li></ul></div>`
      : '';
    const clues = identityClueNotes() + postalClue + clueNote() + referenceNotes();
    const laterNotes = state.clueStatus ? `<h3><label for="my-notes">我的推理</label></h3><textarea id="my-notes" maxlength="5000" placeholder="我发现了……我猜……因为……。别写自己的身份证号。">${escapeHTML(state.notes)}</textarea><p id="note-save-status" class="saved" role="status">${noteStorageStatus()}</p><p class="modal-muted">已划掉：${state.excluded.length?state.excluded.map(n=>n+'号').join('、'):'无'}。<br>当前选择：${state.selected?state.selected+'号嫌疑人':'尚未选择'}。</p><div class="actions"><button data-panel="suspects">改选人物</button><button data-panel="report">写第一关报告</button></div>` : '';
    return `<div class="detective-notes">
      <section class="detective-notes-section" aria-labelledby="notes-clues-title">
        <h3 id="notes-clues-title"><span aria-hidden="true">✦</span> 解密线索</h3>
        ${clues || '<p class="modal-muted">答对解密题后，线索会自动记在这里。</p>'}
      </section>
      <section class="detective-notes-section" aria-labelledby="notes-tips-title">
        <h3 id="notes-tips-title"><span aria-hidden="true">▤</span> 看过的知识 Tip</h3>
        ${state.tips.length ? state.tips.map(type => tip(type)).join('') : '<p class="modal-muted">打开证物里的知识 Tip 后，就能在这里回看。</p>'}
      </section>
    </div>${laterNotes}`;
  }
  function report() {
    return `<p>先选出最符合线索的嫌疑人，再勾选支持你判断的线索。</p><form id="report-form"><fieldset class="report-field"><legend>1. 谁最符合线索？</legend><div class="report-grid">${D.suspects.map(s=>`<label class="option"><input type="radio" name="person" value="${s.id}" ${state.selected===s.id?'checked':''} required>${s.id}号嫌疑人${state.excluded.includes(s.id)?'（已划掉）':''}</label>`).join('')}</div></fieldset><fieldset class="report-field"><legend>2. 哪些线索支持你的判断？可以多选。</legend>${D.reasons.map(r=>`<label class="option"><input type="checkbox" name="reason" value="${r.id}" ${state.reasons.includes(r.id)?'checked':''}><span>${r.id}. ${r.text}</span></label>`).join('')}</fieldset><p class="modal-muted">两件证物都和同一个人有关。选中划掉的人，就会把他加回来。</p><div class="actions"><button type="submit" class="primary">提交报告</button><button type="button" data-action="close">回去找线索</button></div></form>`;
  }
  function reportRetry() {
    const canViewHint = state.reportMistakes >= 2;
    return `<p>${canViewHint ? '要不要回顾一下调查方法？' : '这次的调查结论还不太准确。别急着下结论！重新看看收集到的数字线索，再对照六位嫌疑人的资料吧。'}</p>
      <div class="report-retry-actions">
        ${canViewHint ? `<details class="report-retry-hint"><summary>查看提示</summary><p>试着依次比较三条线索：登记性别、出生年代、联系城市。看看哪位嫌疑人同时符合这些条件。</p></details>` : ''}
        <button type="button" class="report-retry-primary" data-panel="suspects">重新调查</button>
      </div>`;
  }
  function summary() {
    return `<span class="stamp">调查报告核对完成</span><h3 class="success-title">1号最符合三条线索。</h3><p>看看三条线索怎样对上。</p><ol class="review-list"><li><b>性别：</b>5是奇数，登记性别为男。</li><li><b>出生年份：</b>199□ 只能看出是1990年代，具体哪一年还不知道。</li><li><b>通讯城市：</b>寄件人邮编610000对应成都。两件证物都和同一个人有关，所以可以核对联系城市。</li></ol><p class="notice"><b>符合线索的人还要继续调查。</b>数字不能证明他偷了宝石。</p><h3>保护个人信息</h3><p>别把自己的身份证号和证件照片发给别人。</p><div class="actions"><button data-action="close" class="primary">返回调查室</button><button data-panel="notes">看笔记</button></div>`;
  }
  const names = { rubyRecovery:['结案报告','红宝石找回来啦！'], victory:['结案报告','🏆 破案成功！'], victoryReset:['重新开始','重新开始'], searchLocation:['第二关 · 搜查地点','红宝石可能在哪儿？'], searchNotReady:['第二关 · 搜查地点','先找齐线索'], searchIncorrect:['第二关 · 再核对一次','再试一次！'], searchSuccess:['第二关 · 搜查地点','解码成功！'], codeLibrary:['第二关 · 书架资料','编码资料库'], ...Object.fromEntries(stage2References.map(ref => [ref.panel, ['第二关 · 编码资料库', ref.title]])), challengeComplete:['第一关','🎉 挑战一完成！'], story:['案件档案','红宝石失踪案'], identity:['证物 A','残缺身份证复印件'], envelope:['证物 B','未寄出的信'], lookup:['资料柜','邮编查询簿'], suspects:['调查嫌疑人','六人资料'], notes:['调查记录','侦探笔记'], report:['第一关','第一关调查报告'], reportRetry:['第一关','侦探，再仔细想想！'], summary:['学习回顾','结案总结'], reset:['重新开始','要从头开始吗？'] };
  function openPanel(name, { persist = true } = {}) {
    if (!names[name]) return;
    if (['rubyRecovery', 'victory', 'victoryReset'].includes(name) && !state.caseClosed) return;
    const reference = stage2References.find(ref => ref.panel === name);
    if ((reference || name === 'codeLibrary') && state.clueStatus !== 'collected') return;
    if (reference) addUnique(state.stage2Seen, reference.panel);
    if (!dialog.open) returnFocus = document.activeElement;
    currentPanel = name;
    dialog.classList.remove('with-identity-practice');
    dialog.dataset.panelName = name;
    if (['identity','envelope','lookup'].includes(name)) addUnique(state.seen,name);
    if (persist) save();
    progress();
    const [kicker,title] = names[name];
    document.querySelector('#panel-kicker').textContent = kicker;
    document.querySelector('#panel-title').textContent = name === 'reportRetry' && state.reportMistakes >= 2 ? '侦探，还差一点点！' : title;
    const renderers = { rubyRecovery, victory, victoryReset, searchLocation, searchNotReady, searchIncorrect, searchSuccess, codeLibrary, neighborhoodRegister, housingCode, challengeComplete, story, identity, envelope, lookup, suspects, notes, report, reportRetry, summary, reset:()=>`<p>${stage2Dev ? '清空这次测试记录，再从第二关开始。' : '从头开始后，这次的线索、选择和笔记都会清空。'}</p><div class="actions"><button class="primary" data-action="confirm-reset">确认重新开始</button><button data-action="close">保留进度</button></div>` };
    body.innerHTML = renderers[name]();
    body.querySelectorAll('details[data-tip]').forEach(el=>el.addEventListener('toggle',()=>{
      if(el.open){addUnique(state.tips,el.dataset.tip);save();}
      else if (el.dataset.tip === 'identity') setIdentityPractice(false);
    }));
    if (name==='identity') D.quizzes.forEach(q=>{if (Number.isInteger(state.quiz[q.id])) quizFeedback(q,state.quiz[q.id]);});
    if (!dialog.open) dialog.showModal();
    dialog.scrollTop = 0;
    document.querySelector('#close-panel').focus();
  }
  function closePanel() { dialog.close(); }
  function setIdentityPractice(open) {
    const practice = body.querySelector('#identity-practice');
    if (!practice) return;
    const learning = body.querySelector('.identity-learning');
    const button = learning.querySelector('[data-action="open-identity-practice"]');
    practice.hidden = !open;
    learning.classList.toggle('is-practicing', open);
    dialog.classList.toggle('with-identity-practice', open);
    button.setAttribute('aria-expanded', String(open));
    if (open) {
      body.querySelector('.investigate-suspects').hidden = false;
      learning.querySelector('details').open = true;
      practice.querySelector('h3').focus({ preventScroll: true });
      dialog.scrollTop = 0;
    } else if (practice.contains(document.activeElement)) {
      button.focus({ preventScroll: true });
    }
  }
  dialog.addEventListener('close',()=>{ if(returnFocus && document.contains(returnFocus)) returnFocus.focus(); });
  document.querySelector('#close-panel').addEventListener('click',closePanel);
  document.querySelector('#story-button').addEventListener('click',()=>openPanel('story'));
  document.querySelector('#report-button').addEventListener('click', () => {
    if (state.caseClosed) {
      openPanel('victory');
      return;
    }
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
    if (action === 'open-identity-practice') setIdentityPractice(true);
    if (action === 'close-identity-practice') setIdentityPractice(false);
    if (action === 'view-case-resolution') viewCaseResolution();
    if (action === 'confirm-victory-reset' && state.caseClosed) restartAfterVictory();
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
    el.textContent = correct?'答对啦！去对照人物资料吧。':'再试一次。打开上面的 Tip，看看数字在第几位。';
  }
  body.addEventListener('change',event=>{
    const el=event.target;
    if (el.dataset.quiz) {
      const q = D.quizzes.find(q => q.id === el.dataset.quiz);
      const answer = Number(el.value);
      state.quiz[q.id] = answer;
      if (answer === q.correct) addUnique(state.identityClues, q.id);
      save();
      quizFeedback(q, answer);
    }
    if(el.closest('#report-form')) {
      state.selected=Number(body.querySelector('input[name=person]:checked')?.value)||null;
      state.reasons=[...body.querySelectorAll('input[name=reason]:checked')].map(el=>el.value);
      state.excluded=state.excluded.filter(id=>id!==state.selected);
      state.solved=false;save();progress();
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
      if (record && record.code === D.postalCode && !state.postalClue) {
        state.postalClue = true;
        save();
      }
      const result = body.querySelector('#lookup-result');
      const match = body.querySelector('#lookup-match');
      body.querySelector('#lookup-error').textContent = record ? '' : '查不到这个邮编。看看信封上的数字有没有输对。';
      match.textContent = record ? `邮编 ${record.code} 对应的城市是${record.city}。` : '';
      result.hidden = !record;
      if (record) result.querySelector('h3').focus();
    }
    if(event.target.id==='report-form'){
      const f = new FormData(event.target);
      state.selected=Number(f.get('person'))||null;state.reasons=f.getAll('reason');
      const result = R.evaluateReport(state.selected, state.reasons);
      const firstClear = result.passed && !state.clueStatus;
      state.solved = result.passed;
      if (firstClear) state.clueStatus = 'pending';
      if (!result.passed && !state.clueStatus) state.reportMistakes += 1;
      save();
      progress();
      if (result.passed && state.clueStatus === 'pending') openPanel('challengeComplete');
      else if (result.passed) openPanel('summary');
      else openPanel('reportRetry', { persist: false });
    }
  });
  progress();
  if(!state.started) openPanel('story');
})();
