(() => {
  const CONFIG = window.TLA_TEST_CONFIG || {};
  const QUESTIONS = window.QUESTIONS || [];

  const LEVELS = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2'];
  const LEVEL_DESCRIPTIONS = {
    A1: 'Hai una base iniziale. Riesci a riconoscere frasi semplici, ma hai bisogno di costruire sicurezza con grammatica, vocabolario e ascolto guidato.',
    A2: 'Hai già alcune basi pratiche. Puoi comunicare in situazioni semplici, ma devi consolidare tempi verbali, domande, ascolto e frasi utili.',
    B1: 'Hai un livello intermedio. Riesci a gestire molte situazioni quotidiane, ma per parlare con sicurezza serve più pratica strutturata e correzione degli errori.',
    B2: 'Hai un buon livello intermedio-alto. Puoi affrontare conversazioni più complesse: ora il focus è precisione, fluency, lessico avanzato e obiettivi specifici.',
    C1: 'Hai un livello avanzato. Puoi lavorare su sfumature, registro professionale, certificazioni e performance in contesti reali o aziendali.',
    C2: 'Hai un livello molto avanzato. Il lavoro più utile è su naturalezza, precisione, certificazioni avanzate, public speaking o inglese professionale specialistico.'
  };

  const $ = (id) => document.getElementById(id);

  class LevelTestApp {
    constructor() {
      this.totalQuestions = 18;
      this.resetState();
      this.bindEvents();
      this.applyConfig();
    }

    resetState() {
      this.currentQuestion = null;
      this.selectedIndex = null;
      this.answered = [];
      this.usedQuestionIds = new Set();
      this.ability = 1.15; // Starts between A2 and B1, then adjusts quickly.
      this.levelIndex = 1;
      this.correctStreak = 0;
      this.wrongStreak = 0;
      this.startedAt = null;
      this.finishedAt = null;
      this.finalReport = null;
      this.leadData = null;
    }

    bindEvents() {
      $('start-test-btn').addEventListener('click', () => this.startTest());
      $('next-btn').addEventListener('click', () => this.confirmAnswer());
      $('lead-form').addEventListener('submit', (event) => this.submitLead(event));
      $('retake-btn').addEventListener('click', () => this.restart());
    }

    applyConfig() {
      const privacyLink = $('privacy-link');
      if (CONFIG.PRIVACY_URL) privacyLink.href = CONFIG.PRIVACY_URL;
      if (window.emailjs && CONFIG.EMAILJS_PUBLIC_KEY) {
        emailjs.init({ publicKey: CONFIG.EMAILJS_PUBLIC_KEY });
      }
    }

    showScreen(screenId) {
      document.querySelectorAll('.screen').forEach((screen) => screen.classList.remove('active'));
      $(screenId).classList.add('active');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }

    startTest() {
      this.resetState();
      this.startedAt = new Date();
      this.showScreen('test-screen');
      this.loadQuestion();
    }

    restart() {
      this.resetState();
      this.showScreen('welcome-screen');
    }

    getCurrentLevel() {
      this.levelIndex = Math.max(0, Math.min(LEVELS.length - 1, Math.round(this.ability)));
      return LEVELS[this.levelIndex];
    }

    loadQuestion() {
      this.selectedIndex = null;
      $('next-btn').disabled = true;
      $('next-btn').textContent = 'Conferma risposta';

      if (this.answered.length >= this.totalQuestions) {
        this.finishTest();
        return;
      }

      const desiredLevel = this.getCurrentLevel();
      const question = this.pickQuestion(desiredLevel);
      if (!question) {
        this.finishTest();
        return;
      }

      this.currentQuestion = question;
      this.usedQuestionIds.add(question.id);
      this.renderQuestion(question);
      this.updateProgressUI();
    }

    pickQuestion(level) {
      const orderedLevels = this.nearbyLevels(level);
      for (const candidateLevel of orderedLevels) {
        const pool = QUESTIONS.filter((q) => q.level === candidateLevel && !this.usedQuestionIds.has(q.id));
        if (pool.length) return pool[Math.floor(Math.random() * pool.length)];
      }
      return null;
    }

    nearbyLevels(level) {
      const index = LEVELS.indexOf(level);
      const order = [index];
      for (let offset = 1; offset < LEVELS.length; offset++) {
        if (index - offset >= 0) order.push(index - offset);
        if (index + offset < LEVELS.length) order.push(index + offset);
      }
      return order.map((i) => LEVELS[i]);
    }

    renderQuestion(question) {
      $('question-counter').textContent = `Domanda ${this.answered.length + 1} di ${this.totalQuestions}`;
      $('question-level').textContent = `Area: ${question.topic} · livello domanda ${question.level}`;
      $('question-text').textContent = question.question;
      $('current-level-pill').textContent = `Livello stimato: ${this.getCurrentLevel()}`;

      const container = $('options-container');
      container.innerHTML = '';
      question.options.forEach((option, index) => {
        const button = document.createElement('button');
        button.className = 'option-button';
        button.type = 'button';
        button.innerHTML = `<span class="option-letter">${String.fromCharCode(65 + index)}</span><span>${option}</span>`;
        button.addEventListener('click', () => this.selectAnswer(index));
        container.appendChild(button);
      });
    }

    selectAnswer(index) {
      this.selectedIndex = index;
      document.querySelectorAll('.option-button').forEach((btn, i) => {
        btn.classList.toggle('selected', i === index);
      });
      $('next-btn').disabled = false;
    }

    confirmAnswer() {
      if (this.selectedIndex === null || !this.currentQuestion) return;
      const question = this.currentQuestion;
      const isCorrect = this.selectedIndex === question.correct;
      const levelIdx = LEVELS.indexOf(question.level);

      this.updateAbility(isCorrect, levelIdx);
      this.updateStreaks(isCorrect);

      this.answered.push({
        questionId: question.id,
        level: question.level,
        topic: question.topic,
        question: question.question,
        selected: question.options[this.selectedIndex],
        correctAnswer: question.options[question.correct],
        isCorrect,
        explanation: question.explanation
      });

      this.showAnswerFeedback(isCorrect);
      setTimeout(() => this.loadQuestion(), 520);
    }

    updateAbility(isCorrect, difficulty) {
      const expected = 1 / (1 + Math.exp((difficulty - this.ability) * 1.25));
      const result = isCorrect ? 1 : 0;
      this.ability += (result - expected) * 0.9;
      this.ability = Math.max(0, Math.min(5, this.ability));
    }

    updateStreaks(isCorrect) {
      if (isCorrect) {
        this.correctStreak += 1;
        this.wrongStreak = 0;
        if (this.correctStreak >= 3) {
          this.ability = Math.min(5, this.ability + 0.25);
          this.correctStreak = 0;
        }
      } else {
        this.wrongStreak += 1;
        this.correctStreak = 0;
        if (this.wrongStreak >= 2) {
          this.ability = Math.max(0, this.ability - 0.25);
          this.wrongStreak = 0;
        }
      }
    }

    showAnswerFeedback(isCorrect) {
      document.querySelectorAll('.option-button').forEach((btn, i) => {
        btn.disabled = true;
        if (i === this.currentQuestion.correct) btn.classList.add('correct');
        if (i === this.selectedIndex && !isCorrect) btn.classList.add('wrong');
      });
      $('next-btn').disabled = true;
      $('next-btn').textContent = isCorrect ? 'Corretto' : 'Risposta registrata';
    }

    updateProgressUI() {
      const progress = Math.round((this.answered.length / this.totalQuestions) * 100);
      $('progress-fill').style.width = `${progress}%`;
      $('progress-percentage').textContent = `${progress}%`;
    }

    finishTest() {
      this.finishedAt = new Date();
      this.finalReport = this.buildReport();
      this.showScreen('lead-screen');
    }

    buildReport() {
      const correct = this.answered.filter((a) => a.isCorrect).length;
      const total = this.answered.length || 1;
      const accuracy = Math.round((correct / total) * 100);
      const finalIndex = Math.max(0, Math.min(5, Math.round(this.ability)));
      const finalLevel = LEVELS[finalIndex];
      const weakTopics = this.getWeakTopics();
      const durationSeconds = this.finishedAt && this.startedAt ? Math.round((this.finishedAt - this.startedAt) / 1000) : null;
      const recommendationType = finalIndex <= 2 ? 'video_course' : 'individual_lessons_certification';
      return {
        finalLevel,
        finalLevelIndex: finalIndex,
        abilityScore: Number(this.ability.toFixed(2)),
        accuracy,
        correct,
        total,
        weakTopics,
        recommendationType,
        durationSeconds,
        answers: this.answered,
        summary: this.buildTextSummary(finalLevel, accuracy, weakTopics, recommendationType)
      };
    }

    getWeakTopics() {
      const mistakes = new Map();
      this.answered.filter((a) => !a.isCorrect).forEach((a) => {
        mistakes.set(a.topic, (mistakes.get(a.topic) || 0) + 1);
      });
      return [...mistakes.entries()]
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
        .map(([topic, count]) => ({ topic, count }));
    }

    buildTextSummary(level, accuracy, weakTopics, recommendationType) {
      const topics = weakTopics.length ? weakTopics.map((t) => t.topic).join(', ') : 'nessun punto critico evidente nel test breve';
      const recommendation = recommendationType === 'video_course'
        ? 'Percorso consigliato: videocorso online Beginner to Intermediate, con possibilità di aggiungere lezioni individuali.'
        : 'Percorso consigliato: lezioni individuali online con insegnante dedicato e preparazione a certificazioni Cambridge, Trinity o LanguageCert.';
      return `Livello stimato: ${level}. Accuratezza: ${accuracy}%. Aree da migliorare: ${topics}. ${recommendation}`;
    }

    validateLeadForm(formData) {
      const name = String(formData.get('name') || '').trim();
      const email = String(formData.get('email') || '').trim();
      const privacy = $('privacy').checked;
      const honeypot = String(formData.get('website') || '').trim();

      if (honeypot) return 'Errore di validazione. Riprova più tardi.';
      if (name.length < 2) return 'Inserisci nome e cognome.';
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return 'Inserisci un indirizzo email valido.';
      if (!privacy) return 'Per vedere il risultato devi accettare la Privacy Policy.';
      return '';
    }

    async submitLead(event) {
      event.preventDefault();
      const form = event.currentTarget;
      const formData = new FormData(form);
      const error = this.validateLeadForm(formData);
      $('form-error').textContent = error;
      if (error) return;

      this.leadData = {
        name: String(formData.get('name')).trim(),
        email: String(formData.get('email')).trim(),
        phone: String(formData.get('phone') || '').trim(),
        goal: String(formData.get('goal') || '').trim(),
        privacyAccepted: $('privacy').checked,
        marketingConsent: $('marketing-consent').checked
      };

      const payload = this.buildLeadPayload();
      this.setLoading(true);
      const sendResult = await this.sendLead(payload);
      this.setLoading(false);

      if (!sendResult.ok) {
        $("form-error").textContent = sendResult.error || "Non siamo riusciti a inviare il report. Controlla l’email e riprova.";
        return;
      }

      this.renderReport();
      this.showScreen('result-screen');
    }

    buildLeadPayload() {
      return {
        source: CONFIG.LEAD_SOURCE || 'tla_english_level_test',
        testVersion: CONFIG.TEST_VERSION || 'unknown',
        createdAt: new Date().toISOString(),
        pageUrl: window.location.href,
        referrer: document.referrer || '',
        utm: this.getUtmParams(),
        lead: this.leadData,
        result: this.finalReport,
        recommendedOffer: this.getOffer(this.finalReport.finalLevelIndex),
        reportEmail: this.buildEmailReport(),
      };
    }

    buildEmailReport() {
      const report = this.finalReport;
      const offer = this.getOffer(report.finalLevelIndex);
      const weakTopics = report.weakTopics.length
        ? report.weakTopics.map((item) => item.topic).join(', ')
        : 'nessuna area critica forte nel test breve';

      return {
        subject: `Il tuo livello di inglese è ${report.finalLevel} - The London Academy`,
        text: [
          `Ciao ${this.leadData?.name || ''},`,
          '',
          'grazie per aver completato il test di livello di The London Academy.',
          `Il tuo livello stimato è: ${report.finalLevel}.`,
          `Risposte corrette: ${report.correct}/${report.total} (${report.accuracy}%).`,
          `Aree da migliorare: ${weakTopics}.`,
          '',
          `Percorso consigliato: ${offer.title}.`,
          offer.subtitle,
          '',
          `CTA principale: ${offer.primaryUrl}`,
          `CTA alternativa: ${offer.secondaryUrl}`,
          '',
          'A presto,',
          'The London Academy'
        ].join('\n')
      };
    }

    getUtmParams() {
      const params = new URLSearchParams(window.location.search);
      const keys = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'utm_term', 'gclid', 'fbclid'];
      return keys.reduce((acc, key) => {
        if (params.get(key)) acc[key] = params.get(key);
        return acc;
      }, {});
    }

    async sendLead(payload) {
      try {
        localStorage.setItem("tla_last_english_test_lead", JSON.stringify(payload));
      } catch (err) {
        console.warn("Local storage not available", err);
      }

      const hasEmailJsConfig = Boolean(
        CONFIG.EMAILJS_PUBLIC_KEY &&
        CONFIG.EMAILJS_SERVICE_ID &&
        CONFIG.EMAILJS_LEAD_TEMPLATE_ID
      );

      if (!hasEmailJsConfig) {
        console.info("EmailJS not configured. Lead payload:", payload);
        if (CONFIG.DEBUG_ALLOW_RESULT_WITHOUT_EMAILJS) return { ok: true, skipped: true };
        return { ok: false, error: "EmailJS non è configurato. Inserisci Public Key, Service ID e Template ID in config.js." };
      }

      if (!window.emailjs) {
        return { ok: false, error: "La libreria EmailJS non è stata caricata. Controlla la connessione o il file index.html." };
      }

      try {
        const params = this.buildEmailJsParams(payload);

        await emailjs.send(
          CONFIG.EMAILJS_SERVICE_ID,
          CONFIG.EMAILJS_LEAD_TEMPLATE_ID,
          params,
          { publicKey: CONFIG.EMAILJS_PUBLIC_KEY }
        );

        if (CONFIG.EMAILJS_USER_TEMPLATE_ID) {
          await new Promise((resolve) => setTimeout(resolve, 1100));
          await emailjs.send(
            CONFIG.EMAILJS_SERVICE_ID,
            CONFIG.EMAILJS_USER_TEMPLATE_ID,
            params,
            { publicKey: CONFIG.EMAILJS_PUBLIC_KEY }
          );
        }

        return { ok: true };
      } catch (err) {
        console.error("EmailJS send failed", err);
        return { ok: false, error: "Invio email non riuscito. Riprova tra poco o contatta The London Academy." };
      }
    }

    buildEmailJsParams(payload) {
      const offer = payload.recommendedOffer || {};
      const result = payload.result || {};
      const lead = payload.lead || {};
      const weakTopics = Array.isArray(result.weakTopics) && result.weakTopics.length
        ? result.weakTopics.map((item) => item.topic).join(", ")
        : "nessuna area critica forte nel test breve";

      return {
        to_email: CONFIG.ADMIN_EMAIL || "info@thelondonacademy.it",
        admin_email: CONFIG.ADMIN_EMAIL || "info@thelondonacademy.it",
        reply_to: lead.email || "",
        user_name: lead.name || "",
        user_email: lead.email || "",
        user_phone: lead.phone || "",
        user_goal: lead.goal || "",
        privacy_accepted: lead.privacyAccepted ? "Sì" : "No",
        marketing_consent: lead.marketingConsent ? "Sì" : "No",
        final_level: result.finalLevel || "",
        accuracy: result.accuracy || "",
        correct_answers: result.correct || "",
        total_questions: result.total || "",
        weak_topics: weakTopics,
        recommendation_type: result.recommendationType || "",
        recommendation_title: offer.title || "",
        recommendation_subtitle: offer.subtitle || "",
        primary_cta_text: offer.primaryText || "",
        primary_cta_url: this.appendTrackingToUrl(offer.primaryUrl || "#", "email_primary_cta"),
        secondary_cta_text: offer.secondaryText || "",
        secondary_cta_url: this.appendTrackingToUrl(offer.secondaryUrl || "#", "email_secondary_cta"),
        report_subject: payload.reportEmail?.subject || "",
        report_text: payload.reportEmail?.text || "",
        page_url: payload.pageUrl || "",
        referrer: payload.referrer || "",
        utm_source: payload.utm?.utm_source || "",
        utm_medium: payload.utm?.utm_medium || "",
        utm_campaign: payload.utm?.utm_campaign || "",
        created_at: payload.createdAt || new Date().toISOString(),
        test_version: payload.testVersion || "",
        lead_source: payload.source || "",
        answers_json: JSON.stringify(result.answers || [])
      };
    }

    setLoading(isLoading) {
      $('loading-overlay').hidden = !isLoading;
    }

    getOffer(levelIndex) {
      if (levelIndex <= 2) {
        return {
          segment: 'A1-B1',
          title: 'Videocorso online Beginner to Intermediate',
          subtitle: 'Ideale per consolidare basi, grammatica, ascolto e frasi pratiche. Puoi aggiungere lezioni individuali per essere seguito da un insegnante.',
          primaryText: 'Scopri il videocorso',
          primaryUrl: CONFIG.COURSE_URL || '#',
          secondaryText: 'Richiedi lezioni individuali',
          secondaryUrl: CONFIG.ONLINE_LESSONS_URL || CONFIG.CONTACT_URL || '#'
        };
      }
      return {
        segment: 'B2-C2',
        title: 'Lezioni individuali online con insegnante dedicato',
        subtitle: 'Ideale per perfezionare speaking, precisione, Business English o preparare una certificazione Cambridge, Trinity o LanguageCert riconosciuta a livello internazionale.',
        primaryText: 'Prenota lezioni online',
        primaryUrl: CONFIG.ONLINE_LESSONS_URL || '#',
        secondaryText: 'Preparazione certificazioni',
        secondaryUrl: CONFIG.CERTIFICATIONS_URL || CONFIG.CONTACT_URL || '#'
      };
    }

    appendTrackingToUrl(url, contentLabel) {
      if (!url || url === '#') return '#';
      try {
        const parsed = new URL(url, window.location.href);
        const incoming = this.getUtmParams();
        parsed.searchParams.set('utm_source', incoming.utm_source || 'english_level_test');
        parsed.searchParams.set('utm_medium', incoming.utm_medium || 'lead_capture');
        parsed.searchParams.set('utm_campaign', incoming.utm_campaign || 'test_inglese_adulti');
        parsed.searchParams.set('utm_content', contentLabel);
        return parsed.toString();
      } catch (err) {
        return url;
      }
    }

    renderReport() {
      const report = this.finalReport;
      const offer = this.getOffer(report.finalLevelIndex);

      $('final-level').textContent = report.finalLevel;
      $('level-description').textContent = LEVEL_DESCRIPTIONS[report.finalLevel];
      $('score-summary').innerHTML = `
        <div class="metric"><strong>${report.correct}/${report.total}</strong><span>risposte corrette</span></div>
        <div class="metric"><strong>${report.accuracy}%</strong><span>accuratezza</span></div>
        <div class="metric"><strong>${this.formatDuration(report.durationSeconds)}</strong><span>tempo impiegato</span></div>
        <div class="metric"><strong>${offer.segment}</strong><span>fascia percorso</span></div>
      `;

      $('weak-topics').innerHTML = report.weakTopics.length
        ? report.weakTopics.map((item) => `<span class="topic-chip">${this.escapeHtml(item.topic)}</span>`).join('')
        : '<p>Nel test breve non emergono aree critiche forti. Il prossimo step è lavorare su conversazione, naturalezza e obiettivi specifici.</p>';

      $('recommendation-card').innerHTML = `
        <p class="eyebrow">Percorso consigliato</p>
        <h3>${offer.title}</h3>
        <p>${offer.subtitle}</p>
        <div class="mini-plan">
          ${this.getMiniPlan(report.finalLevelIndex).map((step) => `<div><strong>${step.title}</strong><span>${step.text}</span></div>`).join('')}
        </div>
      `;

      const primary = $('primary-cta');
      const secondary = $('secondary-cta');
      primary.href = this.appendTrackingToUrl(offer.primaryUrl, "primary_cta");
      primary.textContent = offer.primaryText;
      secondary.href = this.appendTrackingToUrl(offer.secondaryUrl, "secondary_cta");
      secondary.textContent = offer.secondaryText;
    }

    getMiniPlan(levelIndex) {
      if (levelIndex <= 2) {
        return [
          { title: '1. Consolida le basi', text: 'Present, past, domande, frasi pratiche e ascolto guidato.' },
          { title: '2. Studia con metodo', text: 'Video brevi, esercizi e ripasso costante per creare abitudine.' },
          { title: '3. Aggiungi pratica orale', text: 'Lezioni individuali se vuoi correzione e speaking personalizzato.' }
        ];
      }
      return [
        { title: '1. Definisci un obiettivo', text: 'Conversazione, lavoro, certificazione o inglese accademico.' },
        { title: '2. Lavora con un insegnante', text: 'Feedback personalizzato su speaking, writing e precisione.' },
        { title: '3. Prepara una certificazione', text: 'Cambridge, Trinity o LanguageCert in base al tuo profilo.' }
      ];
    }

    formatDuration(seconds) {
      if (!seconds) return '—';
      const minutes = Math.floor(seconds / 60);
      const remaining = seconds % 60;
      return `${minutes}:${String(remaining).padStart(2, '0')}`;
    }

    escapeHtml(value) {
      return String(value)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
    }
  }

  function assignQuestionIds() {
    QUESTIONS.forEach((q, index) => {
      q.id = `${q.level}-${index}-${q.topic.replace(/\W+/g, '-').toLowerCase()}`;
    });
  }

  document.addEventListener('DOMContentLoaded', () => {
    assignQuestionIds();
    window.tlaEnglishTest = new LevelTestApp();
  });
})();
