import styles from './TermsPage.module.css';

export default function TermsPage() {
  return (
    <div className={styles.container}>
      <h1 className={styles.heading}>Terms of Service</h1>
      <p className={styles.updated}>Last updated: February 26, 2026</p>

      <section className={styles.section}>
        <h2>1. Acceptance of Terms</h2>
        <p>
          By accessing or using CatchDaddy ("the Service"), you agree to be bound by these Terms of Service.
          If you do not agree, do not use the Service.
        </p>
      </section>

      <section className={styles.section}>
        <h2>2. Description of Service</h2>
        <p>
          CatchDaddy is a fishing community platform that allows users to log catches, share photos,
          identify fish and lures using AI, view maps, access local fishing guides, and interact with other anglers.
        </p>
      </section>

      <section className={styles.section}>
        <h2>3. User Accounts</h2>
        <p>
          You may create an account using email/password or Google sign-in via Firebase Authentication.
          You are responsible for maintaining the security of your account credentials and for all
          activity under your account.
        </p>
      </section>

      <section className={styles.section}>
        <h2>4. User-Generated Content</h2>
        <p>
          You retain ownership of content you submit (catch photos, comments, chat messages). By posting
          content publicly, you grant CatchDaddy a non-exclusive, royalty-free license to display it
          within the Service. You may delete your content at any time.
        </p>
        <p>
          You agree not to post content that is illegal, harmful, threatening, abusive, defamatory, or
          otherwise objectionable. We reserve the right to remove content that violates these terms.
        </p>
      </section>

      <section className={styles.section}>
        <h2>5. AI Features</h2>
        <p>
          CatchDaddy uses Google Gemini AI for fish identification, lure identification, and local
          fishing guide recommendations. AI results are informational only and may be inaccurate.
          Do not rely on AI identifications for safety decisions (e.g., determining if a fish is safe to consume).
        </p>
      </section>

      <section className={styles.section}>
        <h2>6. Fishing Disclaimer</h2>
        <p>
          CatchDaddy provides fishing information for educational and recreational purposes only.
          You are solely responsible for complying with all local, state, and federal fishing regulations,
          including licensing requirements, catch limits, and seasonal restrictions. Regulation information
          displayed in the app may not be current — always verify with your local wildlife agency.
        </p>
      </section>

      <section className={styles.section}>
        <h2>7. Subscriptions &amp; Payments</h2>
        <p>
          CatchDaddy may offer paid subscription tiers with additional features. Pricing, billing
          terms, and cancellation policies will be clearly disclosed at the time of purchase. Free
          tier users may access core features at no cost.
        </p>
      </section>

      <section className={styles.section}>
        <h2>8. Prohibited Conduct</h2>
        <ul>
          <li>Attempting to access other users' accounts or private data</li>
          <li>Automated scraping or bulk data collection</li>
          <li>Abusing AI features (excessive requests, prompt injection)</li>
          <li>Harassment of other users</li>
          <li>Uploading malicious content or code</li>
        </ul>
      </section>

      <section className={styles.section}>
        <h2>9. Termination</h2>
        <p>
          We may suspend or terminate your account for violations of these terms. You may delete your
          account at any time by contacting us.
        </p>
      </section>

      <section className={styles.section}>
        <h2>10. Limitation of Liability</h2>
        <p>
          CatchDaddy is provided "as is" without warranties of any kind. We are not liable for any
          damages arising from your use of the Service, including but not limited to data loss,
          inaccurate AI identifications, or reliance on fishing information provided through the platform.
        </p>
      </section>

      <section className={styles.section}>
        <h2>11. Changes to Terms</h2>
        <p>
          We may update these terms at any time. Continued use of the Service after changes constitutes
          acceptance. Material changes will be communicated via the app or email.
        </p>
      </section>

      <section className={styles.section}>
        <h2>12. Contact</h2>
        <p>
          For questions about these terms, contact us at support@catchdaddy.net.
        </p>
      </section>
    </div>
  );
}
