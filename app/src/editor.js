// Vice Cover Studio — editor wiring.
// Owns the page state, the panel slots, drag-to-pan / wheel-to-zoom on the
// live preview, the sample photos and the PNG export. All drawing lives in
// cover.js; this file only moves state around and calls drawCover.
import { drawCover, layoutPanels, LAYOUTS, GRADES, LETTERINGS, SIZES } from './cover.js';

const $ = (id) => document.getElementById(id);
const preview = $('preview');
const statusEl = $('status');
const selftestEl = $('selftest');

const SAMPLES = [
  { file: 'vice-dude.jpg', name: 'Ocean Drive dude' },
  { file: 'vice-gal.jpg', name: 'Boardwalk gal' },
  { file: 'vice-ride.jpg', name: 'Coastal ride' },
];

const state = {
  layout: 'hero',
  grade: 'sunset',
  lettering: 'sunset',
  size: 'square',
  title: 'NEON NIGHTS',
  subtitle: 'OCEAN DRIVE AFTER DARK',
  panels: [null, null, null, null],
  selected: 0,
};

function panelCount() {
  return LAYOUTS[state.layout].panels;
}

function previewDims() {
  const size = SIZES[state.size];
  const long = 860;
  const scale = Math.min(1, long / Math.max(size.w, size.h));
  return { w: Math.round(size.w * scale), h: Math.round(size.h * scale), scale };
}

function selectedSlot() {
  return state.panels[state.selected];
}

export function loadImage(url) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error(`could not load ${url}`));
    img.src = url;
  });
}

async function loadSample(file) {
  return loadImage(`samples/${file}`);
}

function redraw() {
  const dims = previewDims();
  preview.width = dims.w;
  preview.height = dims.h;
  drawCover(preview, {
    layout: state.layout,
    panels: state.panels.slice(0, panelCount()),
    title: state.title,
    subtitle: state.subtitle,
    grade: state.grade,
    lettering: state.lettering,
  });
  renderSlots();
}

function renderSlots() {
  const box = $('slots');
  box.innerHTML = '';
  for (let i = 0; i < panelCount(); i++) {
    const slot = state.panels[i];
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = `slot${i === state.selected ? ' selected' : ''}`;
    btn.textContent = slot ? `Panel ${i + 1} · ${slot.name}` : `Panel ${i + 1} · empty`;
    btn.addEventListener('click', () => {
      state.selected = i;
      syncPanelControls();
      redraw();
    });
    box.appendChild(btn);
  }
  const hint = $('slotHint');
  const slot = selectedSlot();
  hint.textContent = slot
    ? `Panel ${state.selected + 1}: drag on the preview to move the photo, scroll to zoom.`
    : `Panel ${state.selected + 1} is empty — upload a photo or pick a sample below.`;
}

function syncPanelControls() {
  const slot = selectedSlot();
  $('zoomRange').disabled = !slot;
  $('flipBtn').disabled = !slot;
  $('clearBtn').disabled = !slot;
  $('fillAllBtn').disabled = !slot;
  if (slot) $('zoomRange').value = String(slot.zoom || 1);
}

function markActive(group, value) {
  document.querySelectorAll(`[data-${group}]`).forEach((el) => {
    el.classList.toggle('active', el.dataset[group] === value);
  });
}

function setStatus(text) {
  statusEl.textContent = text;
}

async function assignPhoto(slotIndex, img, name) {
  state.panels[slotIndex] = makeSlot(img, name, slotIndex, false);
  state.selected = slotIndex;
  syncPanelControls();
  redraw();
}

/**
 * A fresh slot: zoom 1, no flip, and a smart default pan — a portrait photo
 * dropped into a wide panel starts framed on its top (where faces are)
 * instead of centred on a neck.
 */
function makeSlot(img, name, slotIndex, flip) {
  const size = SIZES[state.size];
  const { panels } = layoutPanels(state.layout, size.w, size.h);
  const panel = panels[slotIndex];
  let oy = 0;
  if (panel) {
    const imgAspect = img.naturalWidth / img.naturalHeight;
    const panelAspect = panel.w / panel.h;
    if (panelAspect > 1.3 && imgAspect < panelAspect * 0.85) oy = 0.22;
  }
  return { img, name, zoom: 1, ox: 0, oy, flip };
}

async function assignFile(file, slotIndex) {
  const img = await loadImage(URL.createObjectURL(file));
  await assignPhoto(slotIndex, img, file.name);
  setStatus(`Loaded ${file.name} into panel ${slotIndex + 1}.`);
}

async function loadDemo() {
  const loaded = [];
  for (const s of SAMPLES) loaded.push(await loadSample(s.file));
  const order = [0, 1, 2, 0];
  for (let i = 0; i < panelCount(); i++) {
    state.panels[i] = makeSlot(loaded[order[i]], SAMPLES[order[i]].file, i, i === 3);
  }
  state.selected = 0;
  syncPanelControls();
  redraw();
  setStatus('Demo photos loaded — pick a layout, grade and size, then export.');
}

async function exportCover() {
  const size = SIZES[state.size];
  const off = document.createElement('canvas');
  off.width = size.w;
  off.height = size.h;
  drawCover(off, {
    layout: state.layout,
    panels: state.panels.slice(0, panelCount()),
    title: state.title,
    subtitle: state.subtitle,
    grade: state.grade,
    lettering: state.lettering,
  });
  const blob = await new Promise((resolve) => off.toBlob(resolve, 'image/png'));
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `vice-cover-${size.w}x${size.h}.png`;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 5000);
  setStatus(`Exported ${a.download} — ${(blob.size / 1024).toFixed(0)} KiB PNG.`);
  return blob;
}

// ---- controls -----------------------------------------------------------

document.querySelectorAll('[data-layout]').forEach((el) => {
  el.addEventListener('click', () => {
    state.layout = el.dataset.layout;
    state.selected = Math.min(state.selected, panelCount() - 1);
    markActive('layout', state.layout);
    syncPanelControls();
    redraw();
  });
});
document.querySelectorAll('[data-grade]').forEach((el) => {
  el.addEventListener('click', () => {
    state.grade = el.dataset.grade;
    markActive('grade', state.grade);
    redraw();
  });
});
document.querySelectorAll('[data-lettering]').forEach((el) => {
  el.addEventListener('click', () => {
    state.lettering = el.dataset.lettering;
    markActive('lettering', state.lettering);
    redraw();
  });
});
document.querySelectorAll('[data-size]').forEach((el) => {
  el.addEventListener('click', () => {
    state.size = el.dataset.size;
    markActive('size', state.size);
    redraw();
  });
});

$('titleInput').addEventListener('input', (e) => {
  state.title = e.target.value;
  redraw();
});
$('subtitleInput').addEventListener('input', (e) => {
  state.subtitle = e.target.value;
  redraw();
});
$('zoomRange').addEventListener('input', (e) => {
  const slot = selectedSlot();
  if (!slot) return;
  slot.zoom = Number(e.target.value);
  redraw();
});
$('flipBtn').addEventListener('click', () => {
  const slot = selectedSlot();
  if (!slot) return;
  slot.flip = !slot.flip;
  redraw();
});
$('fillAllBtn').addEventListener('click', () => {
  const slot = selectedSlot();
  if (!slot) return;
  for (let i = 0; i < panelCount(); i++) {
    state.panels[i] = { ...slot };
  }
  redraw();
  setStatus(`Panel ${state.selected + 1}'s photo now fills every panel.`);
});
$('clearBtn').addEventListener('click', () => {
  state.panels[state.selected] = null;
  syncPanelControls();
  redraw();
});
$('uploadBtn').addEventListener('click', () => $('fileInput').click());
$('fileInput').addEventListener('change', async (e) => {
  const file = e.target.files[0];
  if (!file) return;
  try {
    await assignFile(file, state.selected);
  } catch (err) {
    setStatus(`Could not read that file: ${err.message}`);
  }
  e.target.value = '';
});
$('demoBtn').addEventListener('click', loadDemo);
$('exportBtn').addEventListener('click', () => {
  exportCover().catch((err) => setStatus(`Export failed: ${err.message}`));
});

// Sample thumbnails fill the selected panel.
document.querySelectorAll('#samples button').forEach((btn) => {
  btn.addEventListener('click', async () => {
    const file = btn.dataset.sample;
    try {
      const img = await loadSample(file);
      await assignPhoto(state.selected, img, file);
      setStatus(`Sample ${file} loaded into panel ${state.selected + 1}.`);
    } catch (err) {
      setStatus(`Could not load sample: ${err.message}`);
    }
  });
});

// Drag to pan, wheel to zoom, drop files onto the preview.
let drag = null;
function panelAt(clientX, clientY) {
  const rect = preview.getBoundingClientRect();
  const dims = previewDims();
  const scale = dims.w / SIZES[state.size].w;
  const px = (clientX - rect.left) / (rect.width / dims.w);
  const py = (clientY - rect.top) / (rect.height / dims.h);
  const { panels } = layoutPanels(state.layout, dims.w, dims.h);
  const i = panels.findIndex((p) => px >= p.x && px <= p.x + p.w && py >= p.y && py <= p.y + p.h);
  return { index: i, px, py, panels, scale };
}
preview.addEventListener('pointerdown', (e) => {
  const hit = panelAt(e.clientX, e.clientY);
  if (hit.index < 0) return;
  state.selected = hit.index;
  syncPanelControls();
  redraw();
  const slot = selectedSlot();
  if (!slot) return;
  preview.setPointerCapture(e.pointerId);
  drag = { x: e.clientX, y: e.clientY, ox: slot.ox, oy: slot.oy, panel: hit.panels[hit.index] };
});
preview.addEventListener('pointermove', (e) => {
  if (!drag) return;
  const slot = selectedSlot();
  if (!slot) return;
  const rect = preview.getBoundingClientRect();
  const dims = previewDims();
  const scaleX = rect.width / dims.w;
  const dx = (e.clientX - drag.x) / scaleX / drag.panel.w;
  const dy = (e.clientY - drag.y) / scaleX / drag.panel.h;
  const max = 0.45;
  slot.ox = Math.max(-max, Math.min(max, drag.ox + dx));
  slot.oy = Math.max(-max, Math.min(max, drag.oy + dy));
  redraw();
});
preview.addEventListener('pointerup', () => { drag = null; });
preview.addEventListener('wheel', (e) => {
  const slot = selectedSlot();
  if (!slot) return;
  e.preventDefault();
  slot.zoom = Math.max(1, Math.min(4, slot.zoom * (1 - e.deltaY * 0.0012)));
  $('zoomRange').value = String(slot.zoom);
  redraw();
}, { passive: false });
preview.addEventListener('dragover', (e) => e.preventDefault());
preview.addEventListener('drop', async (e) => {
  e.preventDefault();
  const files = [...e.dataTransfer.files].filter((f) => f.type.startsWith('image/'));
  for (let i = 0; i < files.length && state.selected + i < panelCount(); i++) {
    try { await assignFile(files[i], state.selected + i); } catch { /* keep going */ }
  }
});

// ---- self test (?selftest=1): renders every size, checks the PNG bytes ---
// Fully synchronous (toDataURL, no toBlob): headless --dump-dom with a
// virtual-time budget can starve async callbacks, so nothing here awaits.
function selfTest() {
  const out = { layouts: {}, sizes: {}, errors: [] };
  try {
    for (const layout of Object.keys(LAYOUTS)) {
      const c = document.createElement('canvas');
      c.width = 540;
      c.height = 540;
      drawCover(c, { layout, panels: state.panels.slice(0, LAYOUTS[layout].panels), title: 'TEST', subtitle: 'SELF TEST', grade: 'sunset', lettering: 'sunset' });
      out.layouts[layout] = 'drawn';
    }
    for (const [key, size] of Object.entries(SIZES)) {
      const c = document.createElement('canvas');
      c.width = size.w;
      c.height = size.h;
      drawCover(c, { layout: state.layout, panels: state.panels.slice(0, panelCount()), title: state.title, subtitle: state.subtitle, grade: state.grade, lettering: state.lettering });
      const url = c.toDataURL('image/png');
      // PNG files start with the bytes 89 50 4E 47, which base64 as iVBORw0K.
      const pngMagic = url.startsWith('data:image/png;base64,iVBORw0K');
      out.sizes[key] = { w: size.w, h: size.h, dataUrlChars: url.length, pngMagic };
    }
  } catch (err) {
    out.errors.push(String(err && err.message || err));
  }
  selftestEl.textContent = JSON.stringify(out);
  document.title = `SELFTEST ${JSON.stringify(out)}`;
  window.__selftest = out;
}

// ---- boot ---------------------------------------------------------------
window.addEventListener('error', (e) => {
  const el = $('err');
  if (el) el.textContent = `Error: ${e.message}`;
});

const params = new URLSearchParams(location.search);
markActive('layout', state.layout);
markActive('grade', state.grade);
markActive('lettering', state.lettering);
markActive('size', state.size);
syncPanelControls();

(async () => {
  try {
    await Promise.all([
      document.fonts.load('900 100px "ViceDisplay"'),
      document.fonts.load('700 40px "ViceBold"'),
    ]);
  } catch { /* fall back to system fonts */ }
  const shot = params.get('shot');
  if (!shot) {
    redraw();
    if (params.get('selftest') === '1') await selfTest();
    return;
  }
  const { runShot } = await import('./shots.js');
  // The shot runner renders the cover from these live references.
  window.__vicePanels = state.panels;
  window.__viceState = state;
  await runShot(shot, params, { assignPhoto, loadDemo, setState: (patch) => Object.assign(state, patch), redraw });
  if (params.get('selftest') === '1') await selfTest();
})();
