const COLORS = ['#2d6a4f', '#4caf50', '#ff9800', '#e91e63', '#9c27b0', '#00bcd4', '#ff5722', '#607d8b', '#795548', '#3f51b5'];

export { COLORS };

export function drawBar(ctx, data, width, height) {
  if (!data.length) return;
  const padding = { top: 20, right: 10, bottom: 30, left: 40 };
  const chartW = width - padding.left - padding.right;
  const chartH = height - padding.top - padding.bottom;
  const max = Math.max(...data.map((d) => d.value), 1);
  const barW = Math.min(chartW / data.length - 4, 40);

  ctx.clearRect(0, 0, width, height);
  ctx.font = '11px sans-serif';
  ctx.textAlign = 'center';

  data.forEach((d, i) => {
    const x = padding.left + (chartW / data.length) * i + (chartW / data.length - barW) / 2;
    const barH = (d.value / max) * chartH;
    const y = padding.top + chartH - barH;

    const grad = ctx.createLinearGradient(x, y, x, y + barH);
    grad.addColorStop(0, d.color || '#2d6a4f');
    grad.addColorStop(1, d.color2 || '#4caf50');
    ctx.fillStyle = grad;
    ctx.beginPath();
    if (ctx.roundRect) {
      ctx.roundRect(x, y, barW, barH, [3, 3, 0, 0]);
    } else {
      ctx.rect(x, y, barW, barH);
    }
    ctx.fill();

    ctx.fillStyle = '#888';
    ctx.fillText(d.label, x + barW / 2, height - 8);

    ctx.fillStyle = '#2d6a4f';
    ctx.fillText(d.value, x + barW / 2, y - 4);
  });
}

export function drawLine(ctx, datasets, width, height) {
  if (!datasets.length || !datasets[0].points.length) return;
  const padding = { top: 20, right: 10, bottom: 30, left: 40 };
  const chartW = width - padding.left - padding.right;
  const chartH = height - padding.top - padding.bottom;

  const allVals = datasets.flatMap((ds) => ds.points.map((p) => p.value));
  const max = Math.max(...allVals, 1);
  const labels = datasets[0].points.map((p) => p.label);

  ctx.clearRect(0, 0, width, height);
  ctx.font = '11px sans-serif';
  ctx.textAlign = 'center';

  labels.forEach((label, i) => {
    const x = padding.left + (chartW / (labels.length - 1 || 1)) * i;
    ctx.fillStyle = '#888';
    ctx.fillText(label, x, height - 8);
  });

  datasets.forEach((ds, di) => {
    ctx.strokeStyle = COLORS[di % COLORS.length];
    ctx.lineWidth = 2;
    ctx.beginPath();
    ds.points.forEach((p, i) => {
      const x = padding.left + (chartW / (labels.length - 1 || 1)) * i;
      const y = padding.top + chartH - (p.value / max) * chartH;
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    });
    ctx.stroke();

    ds.points.forEach((p, i) => {
      const x = padding.left + (chartW / (labels.length - 1 || 1)) * i;
      const y = padding.top + chartH - (p.value / max) * chartH;
      ctx.fillStyle = COLORS[di % COLORS.length];
      ctx.beginPath();
      ctx.arc(x, y, 3, 0, Math.PI * 2);
      ctx.fill();
    });
  });
}

export function drawDonut(ctx, data, width, height) {
  if (!data.length) return;
  const cx = width / 2;
  const cy = height / 2;
  const radius = Math.min(cx, cy) - 20;
  const inner = radius * 0.55;
  const total = data.reduce((s, d) => s + d.value, 0);

  ctx.clearRect(0, 0, width, height);

  let startAngle = -Math.PI / 2;
  data.forEach((d, i) => {
    const sliceAngle = (d.value / total) * Math.PI * 2;
    ctx.fillStyle = COLORS[i % COLORS.length];
    ctx.beginPath();
    ctx.arc(cx, cy, radius, startAngle, startAngle + sliceAngle);
    ctx.arc(cx, cy, inner, startAngle + sliceAngle, startAngle, true);
    ctx.closePath();
    ctx.fill();

    const midAngle = startAngle + sliceAngle / 2;
    const labelR = radius + 14;
    const lx = cx + Math.cos(midAngle) * labelR;
    const ly = cy + Math.sin(midAngle) * labelR;

    if (sliceAngle > 0.2) {
      ctx.fillStyle = '#333';
      ctx.font = '11px sans-serif';
      ctx.textAlign = lx > cx ? 'left' : 'right';
      ctx.fillText(d.label, lx, ly + 4);
    }

    startAngle += sliceAngle;
  });

  ctx.fillStyle = '#333';
  ctx.font = 'bold 18px sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(total, cx, cy);
  ctx.font = '11px sans-serif';
  ctx.fillStyle = '#888';
  ctx.fillText('total', cx, cy + 16);
}

export function drawHeatmap(ctx, rows, months, width, height) {
  if (!rows.length) return;
  const padding = { top: 30, right: 10, bottom: 10, left: 100 };
  const chartW = width - padding.left - padding.right;
  const chartH = height - padding.top - padding.bottom;
  const cellW = chartW / 12;
  const cellH = Math.min(chartH / rows.length, 28);

  const allVals = rows.flatMap((r) => r.data);
  const maxVal = Math.max(...allVals, 1);

  ctx.clearRect(0, 0, width, height);

  // Month headers
  ctx.font = '10px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillStyle = '#888';
  months.forEach((m, i) => {
    ctx.fillText(m, padding.left + cellW * i + cellW / 2, padding.top - 8);
  });

  rows.forEach((row, ri) => {
    const y = padding.top + ri * cellH;

    // Row label
    ctx.font = '11px sans-serif';
    ctx.textAlign = 'right';
    ctx.fillStyle = '#333';
    const label = row.label.length > 14 ? row.label.slice(0, 12) + '..' : row.label;
    ctx.fillText(label, padding.left - 6, y + cellH / 2 + 4);

    // Cells
    row.data.forEach((val, ci) => {
      const x = padding.left + ci * cellW;
      const intensity = val / maxVal;
      const r = Math.round(232 - intensity * (232 - 45));
      const g = Math.round(245 - intensity * (245 - 106));
      const b = Math.round(233 - intensity * (233 - 79));
      ctx.fillStyle = val === 0 ? '#f5f5f5' : `rgb(${r},${g},${b})`;
      ctx.fillRect(x + 1, y + 1, cellW - 2, cellH - 2);

      if (val > 0) {
        ctx.fillStyle = intensity > 0.5 ? '#fff' : '#333';
        ctx.font = '10px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(val, x + cellW / 2, y + cellH / 2 + 3);
      }
    });
  });
}
