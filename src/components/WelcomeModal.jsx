import { useState } from 'react';
import { setOnboardingState } from '../utils/onboarding';
import styles from './WelcomeModal.module.css';

const SLIDES = [
  {
    icon: '🎣',
    title: 'Welcome to CatchDaddy!',
    desc: 'Your AI-powered fishing community. Track catches, discover spots, and level up your fishing game.',
  },
  {
    icon: '📋',
    title: 'Log Your Catches',
    desc: 'Auto-capture weather, GPS coordinates, and water conditions every time you log a catch.',
  },
  {
    icon: '🤖',
    title: 'AI-Powered Tools',
    desc: 'Identify fish from photos, get lure recommendations, and explore local fishing guides — all powered by AI.',
  },
  {
    icon: '👥',
    title: 'Connect & Compete',
    desc: 'Add friends, join challenges, climb leaderboards, and chat with your fishing crew.',
  },
];

export default function WelcomeModal({ onDismiss }) {
  const [slide, setSlide] = useState(0);
  const isLast = slide === SLIDES.length - 1;

  function dismiss() {
    setOnboardingState({ welcomed: true });
    onDismiss();
  }

  function next() {
    if (isLast) {
      dismiss();
    } else {
      setSlide(slide + 1);
    }
  }

  return (
    <div className={styles.overlay}>
      <div className={styles.modal}>
        <div className={styles.slideContent}>
          <span className={styles.icon}>{SLIDES[slide].icon}</span>
          <h2 className={styles.title}>{SLIDES[slide].title}</h2>
          <p className={styles.desc}>{SLIDES[slide].desc}</p>
        </div>

        <div className={styles.dots}>
          {SLIDES.map((_, i) => (
            <button
              key={i}
              className={`${styles.dot} ${i === slide ? styles.dotActive : ''}`}
              onClick={() => setSlide(i)}
              aria-label={`Slide ${i + 1}`}
            />
          ))}
        </div>

        <div className={styles.actions}>
          {!isLast && (
            <button className={styles.skipBtn} onClick={dismiss}>
              Skip
            </button>
          )}
          <button className={styles.nextBtn} onClick={next}>
            {isLast ? 'Get Started' : 'Next'}
          </button>
        </div>
      </div>
    </div>
  );
}
