/*
  The London Academy - English Level Test configuration
  GitHub Pages ready. No build required.

  EMAILJS SETUP:
  1. Create / use your EmailJS service.
  2. Create a template for the school notification.
  3. Optional: create a second template for the user auto-reply report.
  4. Paste Service ID, Template ID(s), and Public Key below.

  IMPORTANT:
  Public Key is safe to use in browser code. Do not put private keys here.
*/
window.TLA_TEST_CONFIG = {
  BRAND_NAME: "The London Academy",
  SCHOOL_LOCATION: "Fidenza, Parma",

  // EmailJS configuration
  EMAILJS_PUBLIC_KEY: "", // Example: "abc123_public_key"
  EMAILJS_SERVICE_ID: "", // Example: "service_xxxxxxx"
  EMAILJS_LEAD_TEMPLATE_ID: "", // Email to The London Academy / admin
  EMAILJS_USER_TEMPLATE_ID: "", // Optional auto-reply email to the user with the report
  ADMIN_EMAIL: "info@thelondonacademy.it",

  // During testing, keep true so you can see the result even before configuring EmailJS.
  // For production lead capture, set to false.
  DEBUG_ALLOW_RESULT_WITHOUT_EMAILJS: true,

  PRIVACY_URL: "https://www.thelondonacademy.it/privacy-policy/",
  COURSE_URL: "https://www.thelondonacademy.it/corso-inglese-base-online-principianti/",
  ONLINE_LESSONS_URL: "https://www.thelondonacademy.it/lezioni-online/",
  CERTIFICATIONS_URL: "https://www.thelondonacademy.it/certificazioni/",
  CONTACT_URL: "https://www.thelondonacademy.it/contacts/",
  LEAD_SOURCE: "tla_english_level_test_emailjs",
  TEST_VERSION: "2026-04-lead-capture-v3-emailjs"
};
