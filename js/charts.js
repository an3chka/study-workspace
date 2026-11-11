// Простые графики на SVG — без внешних библиотек.
(function () {
  'use strict';

  const Charts = {};

  // Столбики: items = [{label, value, color?, title?, highlight?}], value в секундах.
  // goal — пунктирная линия цели (в секундах).
  Charts.bars = function (items, opts) {
    opts = opts || {};
    const W = 640, H = opts.height || 200, padL = 36, padB = 24, padT = 10;
    const max = Math.max(opts.goal || 0, ...items.map((i) => i.value), 60);
    const stepH = niceStep(max / 3600);
    const maxH = Math.ceil(max / 3600 / stepH) * stepH || stepH;
    const plotH = H - padB - padT;
    const plotW = W - padL - 6;
    const bw = plotW / items.length;
    const y = (sec) => padT + plotH - (sec / 3600 / maxH) * plotH;
    let s = '<svg class="chart" viewBox="0 0 ' + W + ' ' + H + '" preserveAspectRatio="none" role="img" aria-label="' + U.esc(opts.label || 'График') + '">';
    for (let v = 0; v <= maxH + 1e-9; v += stepH) {
      const yy = y(v * 3600);
      s += '<line class="grid" x1="' + padL + '" x2="' + W + '" y1="' + yy + '" y2="' + yy + '"/>';
      s += '<text class="axis" x="' + (padL - 6) + '" y="' + (yy + 4) + '" text-anchor="end">' + fmtH(v) + '</text>';
    }
    const every = Math.ceil(items.length / 16);
    items.forEach((it, i) => {
      const x = padL + i * bw;
      const h = Math.max(it.value > 0 ? 2 : 0, plotH - (y(it.value) - padT));
      const color = it.color || 'var(--accent)';
      s += '<g class="bar' + (it.highlight ? ' hl' : '') + '"><title>' + U.esc(it.title || (it.label + ': ' + U.human(it.value))) + '</title>';
      s += '<rect x="' + (x + bw * 0.18) + '" y="' + (padT + plotH - h) + '" width="' + (bw * 0.64) + '" height="' + h + '" rx="3" fill="' + color + '"/>';
      s += '<rect class="hit" x="' + x + '" y="' + padT + '" width="' + bw + '" height="' + plotH + '"/></g>';
      if (i % every === 0) s += '<text class="axis' + (it.highlight ? ' strong' : '') + '" x="' + (x + bw / 2) + '" y="' + (H - 6) + '" text-anchor="middle">' + U.esc(it.label) + '</text>';
    });
    if (opts.goal) {
      const gy = y(opts.goal);
      s += '<line class="goal" x1="' + padL + '" x2="' + W + '" y1="' + gy + '" y2="' + gy + '"/>';
    }
    return s + '</svg>';
  };

  // Кольцо прогресса (0..1).
  Charts.ring = function (frac, inner) {
    const r = 52, c = 2 * Math.PI * r;
    const f = Math.max(0, Math.min(1, frac));
    return '<svg class="ring" viewBox="0 0 120 120" role="img" aria-label="Прогресс ' + Math.round(f * 100) + '%">' +
      '<circle class="ring-bg" cx="60" cy="60" r="' + r + '"/>' +
      (f > 0 ? '<circle class="ring-fg' + (f >= 1 ? ' done' : '') + '" cx="60" cy="60" r="' + r + '" stroke-dasharray="' + (c * f) + ' ' + c + '" transform="rotate(-90 60 60)"/>' : '') +
      '<foreignObject x="10" y="10" width="100" height="100"><div class="ring-inner">' + inner + '</div></foreignObject></svg>';
  };

  // Горизонтальная полоса с долями: parts = [{value, color, label}]
  Charts.stack = function (parts) {
    const total = parts.reduce((a, p) => a + p.value, 0) || 1;
    return '<div class="stack">' + parts.map((p) =>
      '<span style="width:' + (p.value / total * 100) + '%;background:' + p.color + '" title="' + U.esc(p.label + ': ' + U.human(p.value)) + '"></span>'
    ).join('') + '</div>';
  };

  function niceStep(maxHours) {
    const steps = [0.25, 0.5, 1, 2, 3, 4, 6, 12];
    for (const st of steps) if (maxHours / st <= 4) return st;
    return 24;
  }
  function fmtH(v) {
    if (v === 0) return '0';
    if (v < 1) return Math.round(v * 60) + 'м';
    return (Number.isInteger(v) ? v : v.toFixed(1)) + 'ч';
  }

  window.Charts = Charts;
})();
