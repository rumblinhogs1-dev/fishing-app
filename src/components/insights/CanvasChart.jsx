import { useEffect, useRef } from 'react';
import styles from '../Insights.module.css';

export function CanvasChart({ drawFn, data, w = 600, h = 220 }) {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const dpr = window.devicePixelRatio || 1;
    canvas.width = w * dpr;
    canvas.height = h * dpr;
    const ctx = canvas.getContext('2d');
    ctx.scale(dpr, dpr);
    drawFn(ctx, data, w, h);
  }, [drawFn, data, w, h]);

  return (
    <div className={styles.canvasWrap}>
      <canvas ref={canvasRef} className={styles.canvas} style={{ width: w, height: h, maxWidth: '100%' }} />
    </div>
  );
}
