import styles from './PrivacyPolicy.module.css';

export default function PrivacyPolicy() {
  return (
    <div className={styles.container}>
      <h1 className={styles.heading}>Privacy Policy</h1>
      <p className={styles.updated}>Last updated: February 26, 2026</p>

      <section className={styles.section}>
        <h2>1. Introduction</h2>
        <p>
          CatchDaddy ("we", "our", "us") respects your privacy. This policy explains what data we
          collect, how we use it, and your rights regarding your information.
        </p>
      </section>

      <section className={styles.section}>
        <h2>2. Data We Collect</h2>

        <h3>Account Information</h3>
        <p>
          When you create an account, we collect your email address, display name, and optionally a
          profile photo. If you sign in with Google, we receive your Google profile name and email.
          Authentication is handled by Firebase Authentication.
        </p>

        <h3>Catch Data</h3>
        <p>
          When you log a catch, we store the species, weight, length, location, date, weather
          conditions, photos, and any notes you provide. Photos are stored in Firebase Storage.
          Catch data is stored in Google Cloud Firestore.
        </p>

        <h3>Location Data</h3>
        <p>
          With your permission, we collect GPS coordinates when you log catches or fishing spots.
          Location data is used to display catches on maps, provide local fishing recommendations,
          fetch weather conditions (via Open-Meteo), retrieve water data (via USGS), and detect
          your state for fishing regulations. Coordinates may also be sent to OpenStreetMap
          (Nominatim/Photon) for address lookup. You can deny location access at any time through
          your browser or device settings.
        </p>

        <h3>Community Heatmap</h3>
        <p>
          You may choose to contribute your catch data to a community heatmap. This is fully
          opt-in with four sharing levels: Private (no sharing), Water Body Only (lake/river name),
          General Area (approximate location within ~1 mile), or Exact Location (precise GPS).
          Your sharing level defaults to Private and can be changed at any time in your profile
          settings. Contributed data is visible to other users according to your chosen level.
        </p>

        <h3>AI Feature Data</h3>
        <p>
          When you use fish identification, lure identification, or local guide features, the photos
          and text you submit are sent to the Google Gemini API for processing. Google may process
          this data according to their own privacy policy. We do not store AI conversation history
          beyond what is displayed in the app session.
        </p>

        <h3>Usage &amp; Analytics</h3>
        <p>
          We use Firebase Analytics to collect anonymous usage data (page views, feature engagement).
          We use Sentry for error tracking, which may capture technical data about errors you encounter.
        </p>
      </section>

      <section className={styles.section}>
        <h2>3. How We Use Your Data</h2>
        <ul>
          <li>To provide and improve the CatchDaddy service</li>
          <li>To display your catches and profile to other users (based on your visibility settings)</li>
          <li>To power AI-based fish and lure identification</li>
          <li>To generate fishing insights and statistics</li>
          <li>To send notifications you have opted into (friend requests, challenge updates)</li>
          <li>To detect and prevent abuse</li>
        </ul>
      </section>

      <section className={styles.section}>
        <h2>4. Data Sharing</h2>
        <p>We do not sell your personal data. We share data only with:</p>
        <ul>
          <li><strong>Google Firebase</strong> — Authentication, database, file storage, analytics</li>
          <li><strong>Google Gemini API</strong> — AI feature processing (fish/lure identification, local guide)</li>
          <li><strong>Google Places API</strong> — Local business recommendations (bait shops, lodging, guides)</li>
          <li><strong>Open-Meteo</strong> — Weather forecast data</li>
          <li><strong>USGS Water Services</strong> — Stream and water condition data</li>
          <li><strong>OpenStreetMap (Nominatim/Photon)</strong> — Address and location lookup</li>
          <li><strong>Sentry</strong> — Error tracking and diagnostics</li>
        </ul>
        <p>
          Each third-party service processes data under their respective privacy policies.
        </p>
      </section>

      <section className={styles.section}>
        <h2>5. Visibility Controls</h2>
        <p>
          You control who sees your catches by setting visibility to public, friends-only, or private.
          Public catches appear in the activity feed and on maps. Private catches are visible only to you.
        </p>
      </section>

      <section className={styles.section}>
        <h2>6. Data Retention</h2>
        <p>
          Your data is retained as long as your account is active. You may delete individual catches
          at any time. To delete your entire account and associated data, contact us at
          support@catchdaddy.net.
        </p>
      </section>

      <section className={styles.section}>
        <h2>7. Data Security</h2>
        <p>
          We use Firebase security rules to restrict data access, HTTPS encryption for all
          communications, and industry-standard security headers. However, no system is 100% secure.
        </p>
      </section>

      <section className={styles.section}>
        <h2>8. Children's Privacy</h2>
        <p>
          CatchDaddy is not directed at children under 13. We do not knowingly collect data from
          children under 13. If you believe a child has provided us with personal data, please
          contact us so we can delete it.
        </p>
      </section>

      <section className={styles.section}>
        <h2>9. Your Rights</h2>
        <p>Depending on your jurisdiction, you may have the right to:</p>
        <ul>
          <li>Access the personal data we hold about you</li>
          <li>Request correction of inaccurate data</li>
          <li>Request deletion of your data</li>
          <li>Export your data in a portable format</li>
          <li>Withdraw consent for data processing</li>
        </ul>
        <p>
          To exercise any of these rights, contact us at support@catchdaddy.net.
        </p>
      </section>

      <section className={styles.section}>
        <h2>10. Changes to This Policy</h2>
        <p>
          We may update this privacy policy from time to time. We will notify you of material changes
          via the app or email. Continued use of the Service after changes constitutes acceptance.
        </p>
      </section>

      <section className={styles.section}>
        <h2>11. Contact</h2>
        <p>
          For privacy-related questions or requests, contact us at support@catchdaddy.net.
        </p>
      </section>
    </div>
  );
}
