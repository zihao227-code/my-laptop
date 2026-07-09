// ===== 考试页面 =====
Pages.Exam = {
  _examId: null,
  _courseId: null,
  _state: 'intro', // 'intro' | 'taking' | 'done'
  _answers: {},
  _startTime: null,

  render(params) {
    window.renderShell();
    this._examId = params.examId;
    this._courseId = params.courseId;
    this._state = 'intro';
    this._answers = {};
    this._startTime = null;

    const user = Auth.currentUser;
    if (!user) return;

    // 检查是否已有成绩：通过则阻止重考，未通过则允许重考
    if (this._examId && this._examId !== 'undefined') {
      const existingScore = Store.scores().find(s => s.exam_id === this._examId && s.user_id === user.user_id);
      if (existingScore && existingScore.passed) {
        this._state = 'done';
        this._showResult(existingScore);
        return;
      }
      // 未通过的成绩：不阻止，允许重新考试
    }

    this._showIntro();
  },

  _showIntro() {
    const el = document.getElementById('mainContent');
    const exam = this._examId ? Store.find('exams', 'exam_id', this._examId) : null;
    const course = this._courseId ? Store.find('courses', 'course_id', this._courseId) : null;

    // 如果没有 exam_id，从课程找考试
    let displayExam = exam;
    if (!displayExam && course) {
      displayExam = Store.exams().find(e => e.course_id === this._courseId);
    }

    if (!displayExam) {
      el.innerHTML = `<div class="empty-state"><div class="icon">📝</div><h3>暂无考试</h3><p>该课程尚未配置考试</p><button class="btn btn-outline" onclick="Router.go('myCourses')">← 返回</button></div>`;
      return;
    }

    this._examId = displayExam.exam_id;

    el.innerHTML = `
      <div class="card" style="max-width:600px;margin:40px auto;text-align:center">
        <div style="font-size:48px;margin-bottom:16px">📝</div>
        <h2>${Utils.escape(displayExam.title)}</h2>
        <p style="color:var(--muted);margin:12px 0">课程：${course ? Utils.escape(course.title) : ''}</p>
        <div style="display:flex;justify-content:center;gap:24px;margin:16px 0;font-size:14px">
          <div><strong>${displayExam.questions.length}</strong> 题</div>
          <div><strong>${displayExam.duration_minutes}</strong> 分钟</div>
          <div>及格线 <strong>${displayExam.pass_score}</strong> 分</div>
        </div>
        <p style="font-size:13px;color:var(--muted);margin-bottom:16px">题型：单选题 · 多选题 · 判断题</p>
        <button class="btn btn-primary btn-lg" onclick="Pages.Exam._start()">🚀 开始考试</button>
        <br><button class="btn btn-outline btn-sm" style="margin-top:12px" onclick="Router.go('myCourses')">← 返回</button>
      </div>`;
  },

  _start() {
    this._state = 'taking';
    this._answers = {};
    this._startTime = Date.now();

    const exam = Store.find('exams', 'exam_id', this._examId);
    if (!exam) return;

    const el = document.getElementById('mainContent');
    const totalScore = exam.questions.reduce((s, q) => s + q.score, 0);

    el.innerHTML = `
      <div class="card" style="margin-bottom:16px;display:flex;justify-content:space-between;align-items:center">
        <div><strong>${Utils.escape(exam.title)}</strong> · ${exam.questions.length} 题 · 总分 ${totalScore}分 · 及格 ${exam.pass_score}分</div>
        <div id="examTimer" style="font-size:18px;font-weight:700;color:var(--primary)">⏱ ${exam.duration_minutes}:00</div>
      </div>
      ${exam.questions.map((q, i) => this._renderQuestion(q, i)).join('')}
      <div style="text-align:center;margin:20px 0 40px">
        <button class="btn btn-primary btn-lg" onclick="Pages.Exam._submit()">📩 交卷</button>
      </div>
    `;

    // 倒计时
    const deadline = Date.now() + exam.duration_minutes * 60000;
    const timerEl = document.getElementById('examTimer');
    const tick = setInterval(() => {
      const left = Math.max(0, Math.ceil((deadline - Date.now()) / 1000));
      const min = Math.floor(left / 60);
      const sec = String(left % 60).padStart(2, '0');
      timerEl.textContent = `⏱ ${min}:${sec}`;
      if (left <= 0) { clearInterval(tick); this._submit(); }
    }, 1000);
    this._timer = tick;
  },

  _renderQuestion(q, idx) {
    const typeLabel = { single: '单选题', multiple: '多选题', boolean: '判断题' };
    const isMulti = q.type === 'multiple';

    return `
    <div class="exam-question" id="q-${idx}">
      <div class="q-title">${idx + 1}. [${typeLabel[q.type] || q.type}] ${Utils.escape(q.title)} <span style="font-size:11px;color:var(--muted)">(${q.score}分)</span></div>
      <div class="q-options">
        ${q.options.map((opt, oi) => `
          <div class="q-option" id="opt-${idx}-${oi}" onclick="Pages.Exam._select(${idx},${oi},${isMulti})">
            ${isMulti ? '☐' : '○'} ${Utils.escape(opt)}
          </div>`).join('')}
      </div>
    </div>`;
  },

  _select(qIdx, oIdx, isMulti) {
    if (this._state !== 'taking') return;
    if (!this._answers[qIdx]) this._answers[qIdx] = isMulti ? [] : -1;

    if (isMulti) {
      const arr = this._answers[qIdx];
      const pos = arr.indexOf(oIdx);
      if (pos >= 0) arr.splice(pos, 1); else arr.push(oIdx);
    } else {
      this._answers[qIdx] = oIdx;
    }

    // 更新 UI
    const questionEl = document.getElementById('q-' + qIdx);
    if (!questionEl) return;
    const options = questionEl.querySelectorAll('.q-option');
    options.forEach((opt, i) => {
      opt.classList.remove('selected');
      if (isMulti) {
        if ((this._answers[qIdx] || []).includes(i)) opt.classList.add('selected');
        opt.querySelector('span') || (opt.innerHTML = (this._answers[qIdx]||[]).includes(i) ? '☑' : '☐') + opt.innerHTML.slice(1);
      } else {
        if (this._answers[qIdx] === i) opt.classList.add('selected');
      }
    });
    if (isMulti) {
      const exam = Store.find('exams', 'exam_id', this._examId);
      const question = exam?.questions[qIdx];
      if (question) {
        options.forEach((opt, i) => {
          opt.innerHTML = ((this._answers[qIdx]||[]).includes(i) ? '☑ ' : '☐ ') + Utils.escape(question.options[i]);
        });
      }
    }
  },

  _submit() {
    if (this._state !== 'taking') return;
    if (this._timer) clearInterval(this._timer);
    this._state = 'done';

    const exam = Store.find('exams', 'exam_id', this._examId);
    if (!exam) return;

    // 判分
    let totalScore = 0;
    let correctCount = 0;
    const maxScore = exam.questions.reduce((s, q) => s + q.score, 0);
    const details = [];

    exam.questions.forEach((q, i) => {
      const userAnswer = this._answers[i];
      const isMulti = q.type === 'multiple';
      let isCorrect = false;

      if (isMulti) {
        const correct = q.answer.sort().join(',');
        const user = (userAnswer || []).sort().join(',');
        isCorrect = correct === user;
      } else if (q.type === 'boolean') {
        isCorrect = userAnswer === q.answer;
      } else {
        isCorrect = userAnswer === q.answer;
      }

      if (isCorrect) { totalScore += q.score; correctCount++; }
      details.push({ questionIdx: i, userAnswer, correctAnswer: q.answer, isCorrect, score: isCorrect ? q.score : 0 });
    });

    const passed = totalScore >= exam.pass_score;

    // 保存成绩
    const c = Store.nextId('scores');
    const score = {
      score_id: Utils.genId('SC', c), user_id: Auth.currentUser.user_id,
      exam_id: this._examId, course_id: this._courseId || exam.course_id,
      total_score: totalScore, max_score: maxScore, passed,
      correct_count: correctCount, total_questions: exam.questions.length,
      details, submitted_at: Utils.nowISO()
    };
    Store.insert('scores', score);

    EventBus.emit(EVENTS.EXAM_SUBMITTED, score);
    this._showResult(score);
  },

  _showResult(score) {
    const exam = Store.find('exams', 'exam_id', score.exam_id);
    const el = document.getElementById('mainContent');

    el.innerHTML = `
      <div class="card" style="max-width:600px;margin:40px auto;text-align:center">
        <div style="font-size:64px">${score.passed ? '🎉' : '😞'}</div>
        <h2>${score.passed ? '恭喜通过！' : '未通过'}</h2>
        <div style="font-size:48px;font-weight:700;color:${score.passed ? 'var(--success)' : 'var(--danger)'};margin:16px 0">${score.total_score}<span style="font-size:20px;color:var(--muted)"> / ${score.max_score}</span></div>
        <div style="display:flex;justify-content:center;gap:24px;font-size:14px;margin-bottom:20px">
          <div>✅ ${score.correct_count}/${score.total_questions} 题正确</div>
          <div>📊 ${exam?.pass_score || 60}分及格</div>
        </div>
        ${score.details ? `
        <div style="text-align:left;margin-top:16px">
          ${score.details.map((d,i) => {
            const q = exam?.questions[d.questionIdx];
            return `<div style="padding:8px 0;border-bottom:1px solid #f1f2f6;font-size:13px">
              ${d.isCorrect ? '✅' : '❌'} ${i+1}. ${q ? Utils.escape(q.title) : ''} — ${d.score}分
            </div>`;
          }).join('')}
        </div>` : ''}
        <div style="margin-top:20px">
          <button class="btn btn-primary" onclick="Router.go('myCourses')">📖 返回我的课程</button>
        </div>
      </div>`;
  }
};
