// Vice Cover Studio — cover renderer.
// Draws the whole poster on one canvas: a Vice City sunset backdrop, photo
// panels with white gutters, palm silhouettes, a striped sun, halftone dots
// and big condensed display lettering. Everything is drawn procedurally;
// the only outside pixels are the user's own photos (or the bundled samples).
// No Rockstar logo, artwork or font is used anywhere in this file.

export const LAYOUTS = {
  hero: { label: 'Hero + duo', panels: 3 },
  strip: { label: 'Tall + stack', panels: 3 },
  grid: { label: 'Four up', panels: 4 },
  solo: { label: 'One shot', panels: 1 },
};

export const GRADES = {
  sunset: { label: 'Sunset', filter: 'saturate(1.32) sepia(0.18) contrast(1.06) brightness(1.02)' },
  neon: { label: 'Neon', filter: 'saturate(1.7) hue-rotate(-12deg) contrast(1.12)' },
  noir: { label: 'Noir', filter: 'grayscale(1) contrast(1.25) brightness(1.05)' },
  vivid: { label: 'Vivid', filter: 'saturate(1.5) contrast(1.1)' },
  original: { label: 'Original', filter: 'none' },
};

export const LETTERINGS = {
  sunset: { label: 'Sunset Pop', fill: '#ffffff', outline: '#1c0b2e', shadow: '#ff2e88', bar: '#ff2e88' },
  neon: { label: 'Neon Nights', fill: '#eafcff', outline: '#12002b', shadow: '#00e5ff', bar: '#00e5ff' },
  gold: { label: 'Vice Gold', fill: '#ffe45c', outline: '#241300', shadow: '#ff7a00', bar: '#ffe45c' },
};

export const SIZES = {
  square: { label: 'Square · 1080 × 1080', w: 1080, h: 1080 },
  portrait: { label: 'Portrait · 1080 × 1350', w: 1080, h: 1350 },
  wide: { label: 'Wide · 1920 × 1080', w: 1920, h: 1080 },
};

const DISPLAY = '"ViceDisplay", "Arial Narrow", sans-serif';
const BOLD = '"ViceBold", "Arial Narrow", sans-serif';

/** Panel rects (pixels) and the title zone for a layout at W x H. */
export function layoutPanels(layout, W, H) {
  const g = Math.max(6, Math.min(14, Math.round(W * 0.009)));
  const inset = (x, y, w, h) => ({ x: x + g, y: y + g, w: w - g * 2, h: h - g * 2 });
  switch (layout) {
    case 'strip':
      return {
        panels: [
          inset(0, 0, W * 0.56, H),
          inset(W * 0.56, 0, W * 0.44, H * 0.5),
          inset(W * 0.56, H * 0.5, W * 0.44, H * 0.5),
        ],
        title: { x: 0, y: H * 0.8, w: W, h: H * 0.2 },
      };
    case 'grid':
      return {
        panels: [
          inset(0, 0, W * 0.5, H * 0.5),
          inset(W * 0.5, 0, W * 0.5, H * 0.5),
          inset(0, H * 0.5, W * 0.5, H * 0.5),
          inset(W * 0.5, H * 0.5, W * 0.5, H * 0.5),
        ],
        title: { x: 0, y: H * 0.8, w: W, h: H * 0.2 },
      };
    case 'solo':
      return {
        panels: [inset(0, 0, W, H)],
        title: { x: 0, y: H * 0.78, w: W, h: H * 0.22 },
      };
    case 'hero':
    default:
      return {
        panels: [
          inset(0, 0, W, H * 0.6),
          inset(0, H * 0.6, W * 0.5, H * 0.4),
          inset(W * 0.5, H * 0.6, W * 0.5, H * 0.4),
        ],
        title: { x: 0, y: H * 0.82, w: W, h: H * 0.18 },
      };
  }
}

function clampPan(panel, img, zoom) {
  const base = Math.max(panel.w / img.naturalWidth, panel.h / img.naturalHeight);
  const s = base * zoom;
  const dw = img.naturalWidth * s;
  const dh = img.naturalHeight * s;
  const maxX = Math.max(0, (dw - panel.w) / 2 / s);
  const maxY = Math.max(0, (dh - panel.h) / 2 / s);
  return { s, maxX, maxY };
}

/** Draws one photo into a panel rect, honouring zoom / pan / flip. */
function drawPhotoPanel(ctx, panel, slot, grade) {
  const { img } = slot;
  ctx.save();
  ctx.beginPath();
  ctx.rect(panel.x, panel.y, panel.w, panel.h);
  ctx.clip();
  const { s } = clampPan(panel, img, slot.zoom || 1);
  const dw = img.naturalWidth * s;
  const dh = img.naturalHeight * s;
  const cx = panel.x + panel.w / 2 + (slot.ox || 0) * panel.w;
  const cy = panel.y + panel.h / 2 + (slot.oy || 0) * panel.h;
  ctx.filter = GRADES[grade]?.filter || 'none';
  if (slot.flip) {
    ctx.translate(cx, cy);
    ctx.scale(-1, 1);
    ctx.drawImage(img, -dw / 2, -dh / 2, dw, dh);
  } else {
    ctx.drawImage(img, cx - dw / 2, cy - dh / 2, dw, dh);
  }
  ctx.filter = 'none';
  // Warm wash so every photo sits in the same sunset world.
  const wash = ctx.createLinearGradient(panel.x, panel.y, panel.x, panel.y + panel.h);
  wash.addColorStop(0, 'rgba(255, 110, 80, 0.05)');
  wash.addColorStop(1, 'rgba(120, 20, 110, 0.16)');
  ctx.fillStyle = wash;
  ctx.fillRect(panel.x, panel.y, panel.w, panel.h);
  ctx.restore();
}

/** Empty panel: sunset placeholder with a palm and an "add photo" label. */
function drawEmptyPanel(ctx, panel, index, W) {
  const g = ctx.createLinearGradient(panel.x, panel.y, panel.x, panel.y + panel.h);
  g.addColorStop(0, '#3b1a5e');
  g.addColorStop(0.55, '#c2337f');
  g.addColorStop(1, '#ff8a3d');
  ctx.fillStyle = g;
  ctx.fillRect(panel.x, panel.y, panel.w, panel.h);
  drawPalm(ctx, panel.x + panel.w * 0.78, panel.y + panel.h, Math.min(panel.w, panel.h) * 0.42, 'rgba(24, 6, 38, 0.85)', -0.25);
  ctx.fillStyle = 'rgba(255,255,255,0.92)';
  ctx.font = `900 ${Math.max(14, W * 0.02)}px ${BOLD}`;
  ctx.textAlign = 'center';
  ctx.fillText(`PANEL ${index + 1}`, panel.x + panel.w / 2, panel.y + panel.h / 2 - 6);
  ctx.font = `${Math.max(11, W * 0.013)}px ${BOLD}`;
  ctx.fillStyle = 'rgba(255,255,255,0.75)';
  ctx.fillText('ADD A PHOTO', panel.x + panel.w / 2, panel.y + panel.h / 2 + W * 0.022);
}

/** One palm silhouette: curved trunk, seven drooping fronds. */
function drawPalm(ctx, x, y, size, color, lean = 0) {
  const topX = x + lean * size;
  const topY = y - size;
  ctx.save();
  ctx.strokeStyle = color;
  ctx.fillStyle = color;
  ctx.lineCap = 'round';
  ctx.lineWidth = Math.max(2, size * 0.055);
  ctx.beginPath();
  ctx.moveTo(x, y);
  ctx.quadraticCurveTo(x + lean * size * 0.4, y - size * 0.55, topX, topY);
  ctx.stroke();
  const fronds = 7;
  for (let i = 0; i < fronds; i++) {
    const a = (-0.15 - i * 0.28) * Math.PI; // spread from up-left to up-right
    const tipX = topX + Math.cos(a) * size * 0.62;
    const tipY = topY + Math.sin(a) * size * 0.5 + size * 0.3;
    const ctrlX = topX + Math.cos(a) * size * 0.42;
    const ctrlY = topY + Math.sin(a) * size * 0.34 - size * 0.12;
    ctx.beginPath();
    ctx.moveTo(topX, topY);
    ctx.quadraticCurveTo(ctrlX, ctrlY, tipX, tipY);
    ctx.quadraticCurveTo(ctrlX * 0.6 + topX * 0.4, ctrlY * 0.6 + topY * 0.4 + size * 0.06, topX, topY);
    ctx.fill();
  }
  ctx.restore();
}

/** Outrun sun: glowing disc with dark slats across its lower half. */
function drawSun(ctx, cx, cy, r) {
  const glow = ctx.createRadialGradient(cx, cy, r * 0.2, cx, cy, r * 1.9);
  glow.addColorStop(0, 'rgba(255, 190, 90, 0.55)');
  glow.addColorStop(1, 'rgba(255, 110, 90, 0)');
  ctx.fillStyle = glow;
  ctx.fillRect(cx - r * 2, cy - r * 2, r * 4, r * 4);
  const disc = ctx.createLinearGradient(cx, cy - r, cx, cy + r);
  disc.addColorStop(0, '#ffe9a8');
  disc.addColorStop(0.55, '#ffb347');
  disc.addColorStop(1, '#ff5e7a');
  ctx.fillStyle = disc;
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.fill();
  ctx.save();
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.clip();
  ctx.fillStyle = 'rgba(20, 4, 32, 0.85)';
  let y = cy + r * 0.08;
  let h = r * 0.05;
  while (y < cy + r) {
    ctx.fillRect(cx - r, y, r * 2, h);
    y += h + r * 0.13;
    h *= 1.5;
  }
  ctx.restore();
}

function drawHalftone(ctx, x, y, w, h, step, color, alpha) {
  ctx.save();
  ctx.fillStyle = color;
  ctx.globalAlpha = alpha;
  for (let yy = y + step / 2; yy < y + h; yy += step) {
    for (let xx = x + step / 2; xx < x + w; xx += step) {
      const fade = 1 - (yy - y) / h;
      ctx.beginPath();
      ctx.arc(xx, yy, Math.max(0.6, step * 0.14 * fade + 0.4), 0, Math.PI * 2);
      ctx.fill();
    }
  }
  ctx.restore();
}

function fitLines(ctx, text, maxWidth, startSize, minSize) {
  const words = text.split(/\s+/).filter(Boolean);
  if (!words.length) return { lines: [], size: startSize };
  let size = startSize;
  const setFont = (s) => { ctx.font = `900 ${s}px ${DISPLAY}`; };
  setFont(size);
  while (size > minSize && ctx.measureText(text).width > maxWidth) {
    size -= 2;
    setFont(size);
  }
  if (ctx.measureText(text).width <= maxWidth) return { lines: [text], size };
  // Two lines: pick the split whose longest line is shortest.
  let best = null;
  for (let i = 1; i < words.length; i++) {
    const a = words.slice(0, i).join(' ');
    const b = words.slice(i).join(' ');
    const m = Math.max(ctx.measureText(a).width, ctx.measureText(b).width);
    if (!best || m < best.m) best = { lines: [a, b], m };
  }
  size = startSize;
  setFont(size);
  while (size > minSize && best.m > maxWidth) {
    size -= 2;
    setFont(size);
    best.m = Math.max(ctx.measureText(best.lines[0]).width, ctx.measureText(best.lines[1]).width);
  }
  return { lines: best.lines, size };
}

/** The title band: scrim, sun, palms, halftone and the display lettering. */
function drawTitleBand(ctx, zone, W, H, state) {
  const style = LETTERINGS[state.lettering] || LETTERINGS.sunset;
  const scrim = ctx.createLinearGradient(0, zone.y - H * 0.06, 0, zone.y + zone.h);
  scrim.addColorStop(0, 'rgba(18, 4, 30, 0)');
  scrim.addColorStop(0.45, 'rgba(18, 4, 30, 0.62)');
  scrim.addColorStop(1, 'rgba(18, 4, 30, 0.92)');
  ctx.fillStyle = scrim;
  ctx.fillRect(0, zone.y - H * 0.06, W, zone.h + H * 0.06);

  drawSun(ctx, W * 0.5, zone.y + zone.h * 0.62, zone.h * 0.46);
  drawPalm(ctx, W * 0.045, zone.y + zone.h * 0.98, zone.h * 0.85, 'rgba(16, 3, 28, 0.9)', 0.22);
  drawPalm(ctx, W * 0.955, zone.y + zone.h * 0.98, zone.h * 0.72, 'rgba(16, 3, 28, 0.9)', -0.22);
  drawHalftone(ctx, W * 0.02, zone.y + zone.h * 0.04, W * 0.2, zone.h * 0.3, Math.max(10, W * 0.012), '#ffffff', 0.16);
  drawHalftone(ctx, W * 0.78, zone.y + zone.h * 0.04, W * 0.2, zone.h * 0.3, Math.max(10, W * 0.012), '#ffffff', 0.16);

  const title = (state.title || '').trim().toUpperCase();
  const sub = (state.subtitle || '').trim().toUpperCase();
  const maxW = W * 0.86;
  const startSize = Math.round(zone.h * 0.52);
  const { lines, size } = fitLines(ctx, title, maxW, startSize, Math.round(W * 0.03));
  const lineH = size * 0.94;
  // The whole title block (lines + subtitle bar) is centred in the zone
  // with room to spare, so nothing is ever clipped by the canvas edge.
  const subSize = Math.max(12, Math.round(size * 0.24));
  const gap = size * 0.3;
  const subBarH = subSize * 1.3;
  const blockH = lines.length * lineH + (sub ? gap + subBarH : 0);
  const blockTop = zone.y + Math.max(0, (zone.h - blockH) / 2);

  ctx.textAlign = 'center';
  ctx.textBaseline = 'alphabetic';
  lines.forEach((line, i) => {
    const ly = blockTop + size * 0.8 + i * lineH;
    ctx.font = `900 ${size}px ${DISPLAY}`;
    ctx.lineJoin = 'round';
    ctx.miterLimit = 2;
    ctx.strokeStyle = style.outline;
    ctx.lineWidth = Math.max(2, size * 0.09);
    ctx.strokeText(line, W / 2, ly);
    ctx.shadowColor = style.shadow;
    ctx.shadowBlur = size * 0.28;
    ctx.shadowOffsetY = size * 0.04;
    ctx.fillStyle = style.fill;
    ctx.fillText(line, W / 2, ly);
    ctx.shadowBlur = 0;
    ctx.shadowOffsetY = 0;
  });

  if (sub) {
    ctx.font = `700 ${subSize}px ${BOLD}`;
    let sw = ctx.measureText(sub).width;
    let tracking = subSize * 0.42;
    while (sw + tracking * (sub.length - 1) > maxW && tracking > 0) tracking -= 1;
    const total = sw + tracking * Math.max(0, sub.length - 1);
    const barTop = blockTop + lines.length * lineH + gap;
    const pad = subSize * 0.5;
    ctx.fillStyle = style.bar;
    ctx.fillRect(W / 2 - total / 2 - pad, barTop, total + pad * 2, subBarH);
    ctx.fillStyle = '#14041f';
    let sx = W / 2 - total / 2;
    const sy = barTop + subBarH / 2 + subSize * 0.36;
    for (const ch of sub) {
      ctx.fillText(ch, sx + ctx.measureText(ch).width / 2, sy);
      sx += ctx.measureText(ch).width + tracking;
    }
  }
}

/**
 * Draws the full cover onto `canvas` (sized by the caller) from `state`:
 * { layout, panels, title, subtitle, grade, lettering }.
 * A panel slot is { img, zoom, ox, oy, flip } or null.
 */
export function drawCover(canvas, state) {
  const ctx = canvas.getContext('2d');
  const W = canvas.width;
  const H = canvas.height;
  const sky = ctx.createLinearGradient(0, 0, 0, H);
  sky.addColorStop(0, '#160a33');
  sky.addColorStop(0.45, '#5c1a63');
  sky.addColorStop(0.75, '#c2337f');
  sky.addColorStop(1, '#ff8a3d');
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, W, H);

  const { panels, title } = layoutPanels(state.layout || 'hero', W, H);
  panels.forEach((rect, i) => {
    const slot = (state.panels || [])[i];
    if (slot && slot.img) drawPhotoPanel(ctx, rect, slot, state.grade || 'sunset');
    else drawEmptyPanel(ctx, rect, i, W);
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = Math.max(3, W * 0.006);
    ctx.strokeRect(rect.x, rect.y, rect.w, rect.h);
    ctx.strokeStyle = 'rgba(20, 4, 32, 0.55)';
    ctx.lineWidth = Math.max(1, W * 0.0015);
    ctx.strokeRect(rect.x + W * 0.004, rect.y + W * 0.004, rect.w - W * 0.008, rect.h - W * 0.008);
  });

  drawTitleBand(ctx, title, W, H, state);

  const vg = ctx.createRadialGradient(W / 2, H / 2, Math.min(W, H) * 0.42, W / 2, H / 2, Math.max(W, H) * 0.75);
  vg.addColorStop(0, 'rgba(10, 2, 20, 0)');
  vg.addColorStop(1, 'rgba(10, 2, 20, 0.28)');
  ctx.fillStyle = vg;
  ctx.fillRect(0, 0, W, H);
  ctx.strokeStyle = 'rgba(255,255,255,0.9)';
  ctx.lineWidth = Math.max(2, W * 0.004);
  ctx.strokeRect(W * 0.008, H * 0.008, W * 0.984, H * 0.984);
}
