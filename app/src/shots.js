// Vice Cover Studio — fixed scenes for screenshots.
// `?shot=cover` shows the finished cover alone at export size;
// `?shot=editor` shows the editor with photos loaded. Query params:
// layout, size (square|portrait|wide), title, subtitle, grade, lettering,
// photos (comma list of sample files). Sets window.__shotReady once painted.
import { drawCover, LAYOUTS, SIZES } from './cover.js';

function loadImage(url) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error(`could not load ${url}`));
    img.src = url;
  });
}

export async function runShot(shot, query, api) {
  const layout = query.get('layout') || 'hero';
  const sizeKey = query.get('size') || 'square';
  const title = query.get('title') || 'NEON NIGHTS';
  const subtitle = query.get('subtitle') || 'OCEAN DRIVE AFTER DARK';
  const grade = query.get('grade') || 'sunset';
  const lettering = query.get('lettering') || 'sunset';
  const photoNames = (query.get('photos') || 'vice-dude.jpg,vice-gal.jpg,vice-ride.jpg').split(',');

  api.setState({ layout, size: sizeKey, title, subtitle, grade, lettering });
  const titleInput = document.getElementById('titleInput');
  const subtitleInput = document.getElementById('subtitleInput');
  if (titleInput) titleInput.value = title;
  if (subtitleInput) subtitleInput.value = subtitle;
  document.querySelectorAll('[data-layout]').forEach((el) => el.classList.toggle('active', el.dataset.layout === layout));
  document.querySelectorAll('[data-grade]').forEach((el) => el.classList.toggle('active', el.dataset.grade === grade));
  document.querySelectorAll('[data-lettering]').forEach((el) => el.classList.toggle('active', el.dataset.lettering === lettering));
  document.querySelectorAll('[data-size]').forEach((el) => el.classList.toggle('active', el.dataset.size === sizeKey));

  const count = LAYOUTS[layout].panels;
  for (let i = 0; i < count; i++) {
    const file = photoNames[i % photoNames.length];
    const img = await loadImage(`samples/${file}`);
    await api.assignPhoto(i, img, file);
  }

  if (shot === 'cover') {
    // Full export-size render, chrome hidden: this is the app's own drawing
    // of the cover, exactly what Export PNG writes.
    document.body.classList.add('shot-cover');
    const size = SIZES[sizeKey];
    const canvas = document.getElementById('preview');
    canvas.width = size.w;
    canvas.height = size.h;
    drawCover(canvas, {
      layout,
      panels: window.__vicePanels.slice(0, count),
      title,
      subtitle,
      grade,
      lettering,
    });
  } else {
    api.redraw();
  }
  await new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)));
  window.__shotReady = true;
}
