/* =========================================================
   DASHBOARD APP — Pulse Analytics
   ========================================================= */

// ── Theme Toggle ──────────────────────────────────────────
(function(){
  const root = document.documentElement;
  const btn = document.querySelector('[data-theme-toggle]');
  let theme = root.getAttribute('data-theme') || 'dark';
  root.setAttribute('data-theme', theme);
  const MOON = '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>';
  const SUN  = '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="5"/><path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"/></svg>';
  if(btn){ btn.innerHTML = theme === 'dark' ? SUN : MOON; }
  if(btn) btn.addEventListener('click', () => {
    theme = theme === 'dark' ? 'light' : 'dark';
    root.setAttribute('data-theme', theme);
    btn.innerHTML = theme === 'dark' ? SUN : MOON;
    updateChartTheme();
  });
})();

// ── Sidebar Toggle ────────────────────────────────────────
const sidebar      = document.getElementById('sidebar');
const mainWrapper  = document.getElementById('mainWrapper');
const sidebarToggle = document.getElementById('sidebarToggle');
const mobileMenuBtn = document.getElementById('mobileMenuBtn');
const overlay      = document.getElementById('overlay');
let sidebarCollapsed = false;

sidebarToggle && sidebarToggle.addEventListener('click', () => {
  sidebarCollapsed = !sidebarCollapsed;
  sidebar.classList.toggle('collapsed', sidebarCollapsed);
  mainWrapper.classList.toggle('expanded', sidebarCollapsed);
});

mobileMenuBtn && mobileMenuBtn.addEventListener('click', () => {
  sidebar.classList.add('mobile-open');
  overlay.classList.add('active');
});

overlay.addEventListener('click', () => {
  sidebar.classList.remove('mobile-open');
  overlay.classList.remove('active');
});

// ── Chart Tab Switching ───────────────────────────────────
document.querySelectorAll('.chart-tab').forEach(tab => {
  tab.addEventListener('click', () => {
    tab.closest('.chart-tabs').querySelectorAll('.chart-tab').forEach(t => t.classList.remove('active'));
    tab.classList.add('active');
    // In a real app, this would update the chart data
  });
});

// ── KPI Counter Animation ─────────────────────────────────
function animateCounters() {
  document.querySelectorAll('.kpi-value[data-count]').forEach(el => {
    const target   = parseFloat(el.dataset.count);
    const isDecimal = el.dataset.decimal === 'true';
    const prefix   = el.dataset.prefix || '';
    const suffix   = el.dataset.suffix || '';
    const duration = 1200;
    const start    = performance.now();
    function tick(now) {
      const progress = Math.min((now - start) / duration, 1);
      const eased    = 1 - Math.pow(1 - progress, 3);
      const current  = target * eased;
      const formatted = isDecimal
        ? current.toFixed(1)
        : Math.floor(current).toLocaleString();
      el.textContent = prefix + formatted + suffix;
      if(progress < 1) requestAnimationFrame(tick);
    }
    requestAnimationFrame(tick);
  });
}

// ── Sparklines ────────────────────────────────────────────
function getSparkData(trend = 'up') {
  const base = trend === 'up' ? 60 : trend === 'down' ? 80 : 70;
  return Array.from({length: 12}, (_, i) => {
    const noise = (Math.random() - 0.5) * 20;
    const drift = trend === 'up' ? i * 2.5 : trend === 'down' ? -i * 2 : 0;
    return Math.max(20, base + drift + noise);
  });
}

function makeSparkline(id, trend, color) {
  const canvas = document.getElementById(id);
  if(!canvas) return;
  canvas.style.height = '40px';
  new Chart(canvas, {
    type: 'line',
    data: {
      labels: Array(12).fill(''),
      datasets: [{
        data: getSparkData(trend),
        borderColor: color,
        borderWidth: 2,
        fill: true,
        backgroundColor: color + '22',
        pointRadius: 0,
        tension: 0.4
      }]
    },
    options: {
      responsive: true, maintainAspectRatio: false,
      animation: { duration: 800 },
      plugins: { legend: { display: false }, tooltip: { enabled: false } },
      scales: { x: { display: false }, y: { display: false } }
    }
  });
}

// ── Main Traffic Chart ────────────────────────────────────
let trafficChart;
function buildTrafficChart() {
  const ctx = document.getElementById('trafficChart');
  if(!ctx) return;
  const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
  const gridColor = isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)';
  const textColor = isDark ? '#797876' : '#7a7974';
  const labels = Array.from({length: 31}, (_, i) => `Mar ${i+1}`);
  const sessions  = Array.from({length: 31}, () => Math.round(2200 + Math.random() * 800));
  const organic   = Array.from({length: 31}, () => Math.round(900 + Math.random() * 400));
  const paid      = Array.from({length: 31}, () => Math.round(400 + Math.random() * 200));

  const primaryColor = isDark ? '#4f98a3' : '#01696f';
  const blueColor    = isDark ? '#5591c7' : '#006494';
  const orangeColor  = isDark ? '#fdab43' : '#da7101';

  if(trafficChart) trafficChart.destroy();
  trafficChart = new Chart(ctx, {
    type: 'line',
    data: {
      labels,
      datasets: [
        { label: 'Sessions',  data: sessions, borderColor: primaryColor, backgroundColor: primaryColor + '18', fill: true, borderWidth: 2, pointRadius: 0, tension: 0.4 },
        { label: 'Organic',   data: organic,  borderColor: blueColor,   backgroundColor: 'transparent', borderWidth: 1.5, pointRadius: 0, tension: 0.4, borderDash: [4,3] },
        { label: 'Paid',      data: paid,     borderColor: orangeColor, backgroundColor: 'transparent', borderWidth: 1.5, pointRadius: 0, tension: 0.4, borderDash: [4,3] }
      ]
    },
    options: {
      responsive: true, maintainAspectRatio: false,
      resizeDelay: 200,
      interaction: { mode: 'index', intersect: false },
      plugins: {
        legend: { display: false },
        tooltip: {
          backgroundColor: isDark ? '#1a1917' : '#ffffff',
          borderColor: isDark ? '#323130' : '#d4d1ca',
          borderWidth: 1,
          titleColor: isDark ? '#cdccca' : '#28251d',
          bodyColor: isDark ? '#797876' : '#7a7974',
          padding: 10,
          cornerRadius: 8,
          titleFont: { family: 'Inter', size: 12, weight: 600 },
          bodyFont: { family: 'Inter', size: 11 }
        }
      },
      scales: {
        x: {
          grid: { color: gridColor },
          ticks: { color: textColor, font: { family: 'Inter', size: 11 }, maxTicksLimit: 8 },
          border: { display: false }
        },
        y: {
          grid: { color: gridColor },
          ticks: { color: textColor, font: { family: 'Inter', size: 11 }, callback: v => v >= 1000 ? (v/1000).toFixed(1)+'k' : v },
          border: { display: false }
        }
      }
    }
  });
}

// ── Donut Chart ───────────────────────────────────────────
let sourceChart;
function buildSourceChart() {
  const ctx = document.getElementById('sourceChart');
  if(!ctx) return;
  const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
  const primary = isDark ? '#4f98a3' : '#01696f';
  const blue    = isDark ? '#5591c7' : '#006494';
  const orange  = isDark ? '#fdab43' : '#da7101';
  const purple  = isDark ? '#a86fdf' : '#7a39bb';
  const faint   = isDark ? '#4a4948' : '#bab9b4';

  if(sourceChart) sourceChart.destroy();
  sourceChart = new Chart(ctx, {
    type: 'doughnut',
    data: {
      labels: ['Organic', 'Direct', 'Paid', 'Social', 'Other'],
      datasets: [{
        data: [43, 22, 18, 10, 7],
        backgroundColor: [primary, blue, orange, purple, faint],
        borderWidth: 0, hoverOffset: 6
      }]
    },
    options: {
      responsive: true, maintainAspectRatio: false,
      resizeDelay: 200,
      cutout: '68%',
      plugins: {
        legend: { display: false },
        tooltip: {
          backgroundColor: isDark ? '#1a1917' : '#ffffff',
          borderColor: isDark ? '#323130' : '#d4d1ca',
          borderWidth: 1,
          titleColor: isDark ? '#cdccca' : '#28251d',
          bodyColor: isDark ? '#797876' : '#7a7974',
          padding: 10,
          cornerRadius: 8,
          callbacks: { label: ctx => ` ${ctx.label}: ${ctx.parsed}%` }
        }
      }
    }
  });
}

// ── Top Pages Table ───────────────────────────────────────
const pages = [
  { url: '/services/physiotherapy', clicks: 4821, impressions: 38400, ctr: '12.6%', pos: '2.1', trend: 'up', delta: '+8%' },
  { url: '/services/occupational-therapy', clicks: 3290, impressions: 29100, ctr: '11.3%', pos: '3.4', trend: 'up', delta: '+5%' },
  { url: '/about-us', clicks: 2741, impressions: 22800, ctr: '12.0%', pos: '4.0', trend: 'flat', delta: '0%' },
  { url: '/blog/back-pain-tips', clicks: 2156, impressions: 41200, ctr: '5.2%', pos: '6.2', trend: 'up', delta: '+14%' },
  { url: '/contact', clicks: 1894, impressions: 18300, ctr: '10.3%', pos: '2.9', trend: 'down', delta: '-3%' },
  { url: '/locations/miami', clicks: 1743, impressions: 15600, ctr: '11.2%', pos: '3.1', trend: 'up', delta: '+21%' },
  { url: '/services/speech-therapy', clicks: 1420, impressions: 19700, ctr: '7.2%', pos: '5.8', trend: 'down', delta: '-7%' },
];

function buildPagesTable() {
  const tbody = document.getElementById('pagesTableBody');
  if(!tbody) return;
  tbody.innerHTML = pages.map(p => `
    <tr>
      <td><span class="page-url">${p.url}</span></td>
      <td class="num">${p.clicks.toLocaleString()}</td>
      <td class="num">${p.impressions.toLocaleString()}</td>
      <td class="num">${p.ctr}</td>
      <td class="num">${p.pos}</td>
      <td>
        <span class="trend-${p.trend}">
          ${p.trend === 'up' ? '↑' : p.trend === 'down' ? '↓' : '—'}
          ${p.delta}
        </span>
      </td>
    </tr>
  `).join('');
}

// ── Keyword Rankings ──────────────────────────────────────
const keywords = [
  { term: 'physiotherapy miami', pos: 1, volume: '2,400', change: '+2' },
  { term: 'occupational therapy near me', pos: 3, volume: '1,900', change: '+5' },
  { term: 'speech therapy clinic miami', pos: 4, volume: '880', change: '+1' },
  { term: 'back pain physiotherapist', pos: 6, volume: '3,200', change: '+8' },
  { term: 'pediatric therapy miami', pos: 7, volume: '720', change: '0' },
  { term: 'sports injury rehab', pos: 9, volume: '1,300', change: '-2' },
  { term: 'telehealth therapy florida', pos: 11, volume: '590', change: '+3' },
];

function buildKeywordList() {
  const list = document.getElementById('keywordList');
  if(!list) return;
  list.innerHTML = keywords.map(k => {
    const num = parseInt(k.change);
    const cls = num > 0 ? 'trend-up' : num < 0 ? 'trend-down' : 'trend-flat';
    const arrow = num > 0 ? '↑' : num < 0 ? '↓' : '—';
    return `
      <div class="keyword-item">
        <div class="kw-pos">${k.pos}</div>
        <div class="kw-info">
          <div class="kw-term">${k.term}</div>
          <div class="kw-meta">${k.volume} vol/mo</div>
        </div>
        <div class="kw-change ${cls}">${arrow}${Math.abs(num)||''}</div>
      </div>
    `;
  }).join('');
}

// ── Theme-aware chart rebuild ─────────────────────────────
function updateChartTheme() {
  buildTrafficChart();
  buildSourceChart();
}

// ── Lucide Icons ──────────────────────────────────────────
lucide.createIcons();

// ── Init ──────────────────────────────────────────────────
animateCounters();
buildTrafficChart();
buildSourceChart();
buildPagesTable();
buildKeywordList();

// Sparklines
const primary = getComputedStyle(document.documentElement).getPropertyValue('--color-primary').trim() || '#4f98a3';
const success = getComputedStyle(document.documentElement).getPropertyValue('--color-success').trim() || '#6daa45';
const warning = getComputedStyle(document.documentElement).getPropertyValue('--color-warning').trim() || '#bb653b';
const error   = getComputedStyle(document.documentElement).getPropertyValue('--color-error').trim() || '#d163a7';

makeSparkline('spark1', 'up',   primary);
makeSparkline('spark2', 'up',   success);
makeSparkline('spark3', 'up',   success);
makeSparkline('spark4', 'up',   warning);
makeSparkline('spark5', 'down', error);
makeSparkline('spark6', 'flat', primary);
