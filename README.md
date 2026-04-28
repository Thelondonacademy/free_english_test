# The London Academy - English Level Test Lead Capture - EmailJS

Web app statica pronta per GitHub Pages. Non richiede build, npm o backend.
Questa versione usa **EmailJS**, non Make, per inviare il lead e il report via email.

## File inclusi

- `index.html` - struttura della pagina
- `styles.css` - stile responsive
- `script.js` - logica test adattivo + lead capture + invio EmailJS
- `questions.js` - banca domande A1-C2
- `config.js` - configurazione link e credenziali pubbliche EmailJS

## Come pubblicarlo su GitHub Pages

1. Crea un repository GitHub, ad esempio `tla-english-level-test`.
2. Carica tutti i file nella root del repository.
3. Vai su `Settings > Pages`.
4. In `Build and deployment`, scegli:
   - Source: `Deploy from a branch`
   - Branch: `main`
   - Folder: `/root`
5. Salva.
6. Dopo qualche minuto il test sarà disponibile al link GitHub Pages.

## Come collegarlo a EmailJS

In EmailJS ti servono 3 dati:

1. **Public Key**
2. **Service ID**
3. **Template ID**

Apri `config.js` e compila:

```js
EMAILJS_PUBLIC_KEY: "INSERISCI_PUBLIC_KEY",
EMAILJS_SERVICE_ID: "INSERISCI_SERVICE_ID",
EMAILJS_LEAD_TEMPLATE_ID: "INSERISCI_TEMPLATE_ID_ADMIN",
EMAILJS_USER_TEMPLATE_ID: "INSERISCI_TEMPLATE_ID_AUTOREPLY_OPZIONALE",
ADMIN_EMAIL: "info@thelondonacademy.it",
```

Durante il test puoi lasciare:

```js
DEBUG_ALLOW_RESULT_WITHOUT_EMAILJS: true,
```

Quando pubblichi davvero il test per fare lead capture, imposta:

```js
DEBUG_ALLOW_RESULT_WITHOUT_EMAILJS: false,
```

Così il risultato viene mostrato solo se l'invio EmailJS va a buon fine.

## Template EmailJS - email a The London Academy

Crea un template che arrivi alla scuola/admin. Puoi usare queste variabili:

```text
{{user_name}}
{{user_email}}
{{user_phone}}
{{user_goal}}
{{final_level}}
{{accuracy}}
{{correct_answers}}
{{total_questions}}
{{weak_topics}}
{{recommendation_title}}
{{recommendation_subtitle}}
{{primary_cta_url}}
{{secondary_cta_url}}
{{privacy_accepted}}
{{marketing_consent}}
{{page_url}}
{{referrer}}
{{utm_source}}
{{utm_medium}}
{{utm_campaign}}
{{created_at}}
{{test_version}}
{{lead_source}}
{{report_text}}
{{answers_json}}
```

Esempio subject:

```text
Nuovo lead test inglese - {{final_level}} - {{user_name}}
```

Esempio corpo email:

```text
Nuovo lead dal test di livello inglese.

Nome: {{user_name}}
Email: {{user_email}}
Telefono: {{user_phone}}
Obiettivo: {{user_goal}}

Livello stimato: {{final_level}}
Punteggio: {{correct_answers}}/{{total_questions}} - {{accuracy}}%
Aree da migliorare: {{weak_topics}}

Percorso consigliato:
{{recommendation_title}}
{{recommendation_subtitle}}

CTA primaria: {{primary_cta_url}}
CTA secondaria: {{secondary_cta_url}}

Privacy accettata: {{privacy_accepted}}
Consenso marketing: {{marketing_consent}}

Pagina: {{page_url}}
Campagna: {{utm_source}} / {{utm_medium}} / {{utm_campaign}}

Report:
{{report_text}}
```

## Template EmailJS - auto-risposta all'utente opzionale

Se vuoi inviare anche il report all'utente, crea un secondo template e inserisci il suo ID in:

```js
EMAILJS_USER_TEMPLATE_ID: "INSERISCI_TEMPLATE_ID_AUTOREPLY"
```

Nel template imposta il destinatario usando la variabile:

```text
{{user_email}}
```

Esempio subject:

```text
Il tuo livello di inglese è {{final_level}} - The London Academy
```

Esempio corpo:

```text
Ciao {{user_name}},

grazie per aver completato il test di livello di The London Academy.

Il tuo livello stimato è: {{final_level}}
Risposte corrette: {{correct_answers}}/{{total_questions}} - {{accuracy}}%
Aree da migliorare: {{weak_topics}}

Percorso consigliato:
{{recommendation_title}}
{{recommendation_subtitle}}

Prossimo passo consigliato:
{{primary_cta_url}}

Alternativa:
{{secondary_cta_url}}

A presto,
The London Academy
```

## Logica commerciale

- Livelli **A1, A2, B1**: proposta videocorso online Beginner to Intermediate, con possibilità di lezioni individuali.
- Livelli **B2, C1, C2**: proposta lezioni individuali online con insegnante dedicato + preparazione certificazioni Cambridge, Trinity o LanguageCert.

## Test locale

Puoi aprire direttamente `index.html`, oppure usare un server locale:

```bash
python3 -m http.server 8000
```

Poi apri `http://localhost:8000`.

## Nota privacy

La checkbox Privacy è obbligatoria. La checkbox marketing è facoltativa e serve per distinguere i contatti che accettano comunicazioni promozionali.

## Link CTA configurati

I link principali sono in `config.js`:

- Videocorso online: `https://www.thelondonacademy.it/corso-inglese-base-online-principianti/`
- Lezioni online: `https://www.thelondonacademy.it/lezioni-online/`
- Certificazioni: `https://www.thelondonacademy.it/certificazioni/`
- Contatti: `https://www.thelondonacademy.it/contacts/`
- Privacy: `https://www.thelondonacademy.it/privacy-policy/`

Le CTA aggiungono automaticamente parametri UTM per tracciare i click dal test.
