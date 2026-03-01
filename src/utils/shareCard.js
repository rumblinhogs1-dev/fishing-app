const TEMPLATES = {
  clean: {
    name: 'Clean White',
    bg: '#ffffff',
    textColor: '#222222',
    accentColor: '#2d6a4f',
    overlayColor: 'rgba(255,255,255,0.85)',
  },
  dark: {
    name: 'Dark Outdoors',
    bg: '#1a1a2e',
    textColor: '#f0f0f0',
    accentColor: '#4fc3f7',
    overlayColor: 'rgba(20,20,40,0.88)',
  },
  vintage: {
    name: 'Vintage',
    bg: '#fdf6e3',
    textColor: '#5c4a32',
    accentColor: '#d4a017',
    overlayColor: 'rgba(253,246,227,0.88)',
  },
};

async function loadImage(src) {
  // Fetch as blob to bypass CORS restrictions on canvas tainting
  try {
    const res = await fetch(src);
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => {
        URL.revokeObjectURL(url);
        resolve(img);
      };
      img.onerror = () => {
        URL.revokeObjectURL(url);
        reject(new Error('Image load failed'));
      };
      img.src = url;
    });
  } catch {
    // Fallback to direct load if fetch fails
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => resolve(img);
      img.onerror = reject;
      img.src = src;
    });
  }
}

function drawCoverImage(ctx, img, x, y, w, h) {
  const imgRatio = img.width / img.height;
  const boxRatio = w / h;
  let sx, sy, sw, sh;
  if (imgRatio > boxRatio) {
    sh = img.height;
    sw = sh * boxRatio;
    sx = (img.width - sw) / 2;
    sy = 0;
  } else {
    sw = img.width;
    sh = sw / boxRatio;
    sx = 0;
    sy = (img.height - sh) / 2;
  }
  ctx.drawImage(img, sx, sy, sw, sh, x, y, w, h);
}

function wrapText(ctx, text, maxWidth) {
  const words = text.split(' ');
  const lines = [];
  let current = '';
  for (const word of words) {
    const test = current ? `${current} ${word}` : word;
    if (ctx.measureText(test).width > maxWidth && current) {
      lines.push(current);
      current = word;
    } else {
      current = test;
    }
  }
  if (current) lines.push(current);
  return lines;
}

export { TEMPLATES };

export async function generateShareCard(catchData, templateKey = 'clean') {
  const t = TEMPLATES[templateKey] || TEMPLATES.clean;
  const W = 1080;
  const H = 1350;
  const photoH = Math.round(H * 0.6);
  const panelH = H - photoH;

  const canvas = document.createElement('canvas');
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext('2d');

  // Fill background
  ctx.fillStyle = t.bg;
  ctx.fillRect(0, 0, W, H);

  // Try to draw photo
  const imgSrc = catchData.imageUrl || catchData.image;
  let hasPhoto = false;
  if (imgSrc) {
    try {
      const img = await loadImage(imgSrc);
      drawCoverImage(ctx, img, 0, 0, W, photoH);
      hasPhoto = true;
    } catch {
      // CORS blocked or load failed — continue with no-photo layout
    }
  }

  if (hasPhoto) {
    // Gradient overlay at bottom of photo
    const grad = ctx.createLinearGradient(0, photoH - 160, 0, photoH);
    grad.addColorStop(0, 'rgba(0,0,0,0)');
    grad.addColorStop(1, 'rgba(0,0,0,0.55)');
    ctx.fillStyle = grad;
    ctx.fillRect(0, photoH - 160, W, 160);
  }

  // Info panel background
  ctx.fillStyle = t.overlayColor;
  ctx.fillRect(0, photoH, W, panelH);

  // Panel content
  const px = 60;
  let py = photoH + 60;

  // Species name
  ctx.fillStyle = t.accentColor;
  ctx.font = 'bold 52px -apple-system, BlinkMacSystemFont, Segoe UI, sans-serif';
  ctx.fillText(catchData.species || 'Unknown Species', px, py);
  py += 30;

  // Divider
  py += 20;
  ctx.fillStyle = t.accentColor;
  ctx.globalAlpha = 0.3;
  ctx.fillRect(px, py, W - px * 2, 2);
  ctx.globalAlpha = 1;
  py += 30;

  // Detail rows
  ctx.font = '500 34px -apple-system, BlinkMacSystemFont, Segoe UI, sans-serif';
  ctx.fillStyle = t.textColor;
  const details = [];
  if (catchData.weight) details.push(`${catchData.weight} lbs`);
  if (catchData.length) details.push(`${catchData.length} in`);
  if (details.length) {
    ctx.fillText(details.join('  •  '), px, py);
    py += 50;
  }

  // Date
  if (catchData.date) {
    ctx.font = '400 30px -apple-system, BlinkMacSystemFont, Segoe UI, sans-serif';
    ctx.fillStyle = t.textColor;
    ctx.globalAlpha = 0.7;
    const d = new Date(catchData.date);
    const dateStr = d.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
    ctx.fillText(dateStr, px, py);
    ctx.globalAlpha = 1;
    py += 50;
  }

  // Location
  if (catchData.location) {
    ctx.font = '400 30px -apple-system, BlinkMacSystemFont, Segoe UI, sans-serif';
    ctx.fillStyle = t.textColor;
    ctx.globalAlpha = 0.7;
    const lines = wrapText(ctx, catchData.location, W - px * 2);
    for (const line of lines.slice(0, 2)) {
      ctx.fillText(line, px, py);
      py += 40;
    }
    ctx.globalAlpha = 1;
    py += 10;
  }

  // Weather
  if (catchData.weather) {
    ctx.font = '400 28px -apple-system, BlinkMacSystemFont, Segoe UI, sans-serif';
    ctx.fillStyle = t.textColor;
    ctx.globalAlpha = 0.5;
    ctx.fillText(catchData.weather, px, py);
    ctx.globalAlpha = 1;
  }

  // Watermark
  ctx.font = '600 24px -apple-system, BlinkMacSystemFont, Segoe UI, sans-serif';
  ctx.fillStyle = t.textColor;
  ctx.globalAlpha = 0.25;
  ctx.textAlign = 'right';
  ctx.fillText('CatchDaddy', W - 40, H - 30);
  ctx.textAlign = 'left';
  ctx.globalAlpha = 1;

  return canvas.toDataURL('image/png');
}
