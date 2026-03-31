/* =========================================================
   LEAD PULSE — Dashboard App
   ========================================================= */

// ── Theme Toggle ──────────────────────────────────────────
(function(){
  const root = document.documentElement;
  const btn  = document.querySelector('[data-theme-toggle]');
  // Always start light
  let theme = root.getAttribute('data-theme') || 'light';
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

// ── Page Router ───────────────────────────────────────────
const PAGE_MAP = {
  overview:    'pageOverview',
  seo:         'pageSeo',
  traffic:     'pageTraffic',
  conversions: 'pageConversions',
  organic:     'pageOrganic',
  paid:        'pagePaid',
  social:      'pageSocial',
  settings:    'pageSettings',
};

const BREADCRUMB_LABELS = {
  overview: 'Overview', seo: 'SEO', traffic: 'Traffic',
  conversions: 'Conversions', organic: 'Organic', paid: 'Google Ads',
  social: 'Social', settings: 'Settings',
};

function navigateTo(page) {
  // Hide all pages
  Object.values(PAGE_MAP).forEach(id => {
    const el = document.getElementById(id);
    if(el) el.classList.add('hidden');
  });
  // Show target
  const target = document.getElementById(PAGE_MAP[page]);
  if(target) target.classList.remove('hidden');
  // Update nav active state
  document.querySelectorAll('.nav-item').forEach(item => {
    item.classList.toggle('active', item.dataset.page === page);
  });
  // Update breadcrumb
  const bc = document.getElementById('breadcrumbCurrent');
  if(bc) bc.textContent = BREADCRUMB_LABELS[page] || page;
  // Init charts for newly visible page
  initPageCharts(page);
  // Scroll to top
  if(target) target.scrollTop = 0;
  // Close mobile sidebar
  const sidebar = document.getElementById('sidebar');
  const overlay = document.getElementById('overlay');
  if(sidebar && window.innerWidth <= 768) {
    sidebar.classList.remove('mobile-open');
    overlay.classList.remove('active');
  }
}

// Wire up all nav items
document.querySelectorAll('.nav-item[data-page]').forEach(item => {
  item.addEventListener('click', e => {
    e.preventDefault();
    navigateTo(item.dataset.page);
  });
});

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
  });
});

// ── Helpers ───────────────────────────────────────────────
function isDark() { return document.documentElement.getAttribute('data-theme') === 'dark'; }
function gridColor() { return isDark() ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)'; }
function textColor() { return isDark() ? '#797876' : '#7a7974'; }
const MONDAY_API_URL = 'https://api.monday.com/v2';
const MONDAY_BOARD_ID = 18404733134; // PHL Consolidated Leads
// Put your real token here, or use a backend proxy (strongly recommended)
const MONDAY_API_TOKEN = 'eyJhbGciOiJIUzI1NiJ9.eyJ0aWQiOjY0MDEyNjI2OCwiYWFpIjoxMSwidWlkIjo5OTgxNTY5NCwiaWFkIjoiMjAyNi0wMy0zMVQxNzo0NTozNC4wMDBaIiwicGVyIjoibWU6d3JpdGUiLCJhY3RpZCI6NzQ3NTEwNiwicmduIjoidXNlMSJ9.I120BCWqcR0iZpFRzSz4K8Z8M7SPJ_eI33hVnn23sL4';

function tooltipDefaults() {
  return {
    backgroundColor: isDark() ? '#1a1917' : '#ffffff',
    borderColor: isDark() ? '#323130' : '#d4d1ca',
    borderWidth: 1,
    titleColor: isDark() ? '#cdccca' : '#28251d',
    bodyColor: isDark() ? '#797876' : '#7a7974',
    padding: 10, cornerRadius: 8,
    titleFont: { family: 'Inter', size: 12, weight: 600 },
    bodyFont:  { family: 'Inter', size: 11 }
  };
}

async function fetchMondayData() {
  if (!MONDAY_API_TOKEN || MONDAY_API_TOKEN === 'eyJhbGciOiJIUzI1NiJ9.eyJ0aWQiOjY0MDEyNjI2OCwiYWFpIjoxMSwidWlkIjo5OTgxNTY5NCwiaWFkIjoiMjAyNi0wMy0zMVQxNzo0NTozNC4wMDBaIiwicGVyIjoibWU6d3JpdGUiLCJhY3RpZCI6NzQ3NTEwNiwicmduIjoidXNlMSJ9.I120BCWqcR0iZpFRzSz4K8Z8M7SPJ_eI33hVnn23sL4') {
    console.warn('Monday API token not configured. Please set a valid personal API token from Monday.com.');
    return null;
  }

  const query = `query ($boardId: Int!) {
    boards(ids: [$boardId]) {
      items {
        id
        name
        created_at
        column_values {
          id
          title
          text
          value
        }
      }
    }
  }`;

  try {
    console.log('Monday API query board id', MONDAY_BOARD_ID);
    const res = await fetch(MONDAY_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: MONDAY_API_TOKEN
      },
      body: JSON.stringify({ query, variables: { boardId: MONDAY_BOARD_ID } })
    });

    if (res.status === 401 || res.status === 403) {
      console.error('Monday API token invalid or unauthorized (401/403). Use a personal API token, not client secret.');
      return null;
    }

    const json = await res.json();
    console.log('Monday API response', json);
    if (json.errors) {
      console.error('Monday API errors', json.errors);
      return null;
    }
    if (!json.data?.boards?.[0]) {
      console.warn('Monday API empty board data', json);
      return null;
    }
    return json.data.boards[0];
  } catch (error) {
    console.error('Monday API fetch failed', error);
    return null;
  }
}

function numberFromValue(value, fallback = 0) {
  if (!value || typeof value !== 'string') return fallback;
  const num = Number(value.replace(/[%,\s]/g, ''));
  return Number.isFinite(num) ? num : fallback;
}

function findCol(item, keys) {
  if (!item.column_values) return null;
  const norm = k => k.trim().toLowerCase();
  return item.column_values.find(cv => {
    const id = (cv.id || '').trim().toLowerCase();
    const title = (cv.title || '').trim().toLowerCase();
    const text = (cv.text || '').trim().toLowerCase();
    return keys.some(k => {
      const nk = norm(k);
      return id === nk || title === nk || text === nk || title.includes(nk) || text.includes(nk);
    });
  });
}

function getColText(item, keys, fallback = '') {
  const col = findCol(item, keys);
  if (!col) return fallback;
  if (col.text !== undefined && col.text !== null && col.text !== '') return col.text;
  if (col.value !== undefined && col.value !== null && col.value !== '') {
    // Board values may be JSON for various column types
    try {
      const parsed = JSON.parse(col.value);
      if (parsed) {
        if (typeof parsed === 'string') return parsed;
        if (parsed.text) return parsed.text;
        if (parsed.label) return parsed.label;
        if (parsed.name) return parsed.name;
        if (Array.isArray(parsed) && parsed.length) {
          // Person or tags may come as arrays
          return parsed.map(p => p.name || p.text || p.label || p).filter(Boolean).join(', ');
        }
        if (parsed.person) return parsed.person.name || parsed.person.email || '';
      }
    } catch (e) {
      // not JSON
    }
    return String(col.value);
  }
  return fallback;
}

function parseLeadDate(raw) {
  if (!raw) return null;
  const d = new Date(raw);
  if (!isNaN(d.getTime())) return d.toISOString().slice(0,10);
  const n = Date.parse(raw);
  if (!isNaN(n)) return new Date(n).toISOString().slice(0,10);
  return null;
}

function updateKpiCounters(stats) {
  const kpiVisits = document.querySelector('.kpi-card:nth-child(1) .kpi-value');
  if (kpiVisits) { kpiVisits.dataset.count = (stats.totalLeads || 0).toString(); }
  const kpiImpr = document.querySelector('.kpi-card:nth-child(2) .kpi-value');
  if (kpiImpr) { kpiImpr.dataset.count = (stats.openLeads || 0).toString(); }
  const kpiConv = document.querySelector('.kpi-card:nth-child(3) .kpi-value');
  if (kpiConv) { kpiConv.dataset.count = (stats.closedLeads || 0).toString(); }
}

let boardStats = {
  totalLeads: 0,
  openLeads: 0,
  closedLeads: 0,
  dateCounts: {},
  sourceCounts: {},
  statusCounts: {},
  newCallerCounts: { yes: 0, no: 0, unknown: 0 }
};

function buildMondayMappedData(board) {
  if (!board?.items || !board.items.length) {
    console.warn('Monday board has no items:', board);
    return;
  }

  // Debug: log exactly which columns exist in board items
  const columnKeys = new Set();
  board.items.forEach(item => {
    item.column_values?.forEach(cv => {
      const key = cv.title || cv.id || '(unknown)';
      columnKeys.add(key);
    });
  });
  console.log('Monday board columns detected:', Array.from(columnKeys));

  const knownItems = board.items.slice(0, 30);

  topPages = knownItems.map(item => {
    const itemStatus    = getColText(item, ['status', 'lead status', 'stage']);
    const newCaller     = getColText(item, ['new caller?', 'new caller', 'caller']);
    const dateLead      = getColText(item, ['date of lead', 'date', 'created_at']);
    const source        = getColText(item, ['source (campaign)', 'source', 'campaign', 'lead source']);
    const clientName    = getColText(item, ['client name', 'client', 'name', 'item']);
    const landingPage   = getColText(item, ['landing page url', 'landing page', 'url']);
    const postalCode    = getColText(item, ['postal code', 'zip', 'postcode']);
    const contactNumber = getColText(item, ['contact number', 'phone', 'contact']);

    // Keep all raw column values for debugging if needed
    const raw = item.column_values?.reduce((acc, cv) => {
      const key = cv.title || cv.id || 'unknown';
      acc[key] = { text: cv.text, value: cv.value };
      return acc;
    }, {}) || {};

    return {
      url: clientName || item.name || 'Unnamed lead',
      source: source || 'Unknown',
      status: itemStatus || 'Unspecified',
      owner: newCaller || '—',
      created: dateLead || (item.created_at ? new Date(item.created_at).toLocaleString() : 'N/A'),
      phone: contactNumber || '—',
      email: landingPage || '—',
      landingPage,
      postalCode,
      raw
    };
  });

  keywordData = knownItems.slice(0, 7).map((item, idx) => {
    return {
      term: getColText(item, ['client name', 'name', 'item']) || item.name || `Lead ${idx + 1}`,
      pos: getColText(item, ['status', 'stage', 'new caller?']) || 'No status',
      volume: getColText(item, ['source (campaign)', 'source', 'lead source']) || 'Unknown',
      change: getColText(item, ['postal code', 'contact number', 'landing page url']) || '–'
    };
  });

  // Build board-specific stats
  boardStats = {
    totalLeads: topPages.length,
    openLeads: topPages.filter(l => /new|open|pending|answered/i.test(l.status)).length,
    closedLeads: topPages.filter(l => /won|closed|completed|converted/i.test(l.status)).length,
    dateCounts: {},
    sourceCounts: {},
    statusCounts: {},
    newCallerCounts: { yes: 0, no: 0, unknown: 0 }
  };

  topPages.forEach(lead => {
    const leadDate = parseLeadDate(lead.created);
    if (leadDate) {
      boardStats.dateCounts[leadDate] = (boardStats.dateCounts[leadDate] || 0) + 1;
    }

    const src = (lead.source || 'Unknown').trim();
    boardStats.sourceCounts[src] = (boardStats.sourceCounts[src] || 0) + 1;

    const status = (lead.status || 'Unspecified').trim();
    boardStats.statusCounts[status] = (boardStats.statusCounts[status] || 0) + 1;

    const newCaller = (lead.owner || '').toString().trim().toLowerCase();
    if (/^(yes|true|y|1|new)/.test(newCaller)) boardStats.newCallerCounts.yes += 1;
    else if (/^(no|false|n|0)/.test(newCaller)) boardStats.newCallerCounts.no += 1;
    else boardStats.newCallerCounts.unknown += 1;
  });

  updateKpiCounters(boardStats);

  const tableHeadRow = document.querySelector('#pagesTableBody')?.closest('table')?.querySelector('thead tr');
  if (tableHeadRow) {
    tableHeadRow.innerHTML = '<th>Lead</th><th>Source</th><th>Status</th><th>New Caller</th><th>Date of Lead</th><th>Landing Page</th><th>Postal Code</th><th>Contact</th>';
  }
}


function primaryColor() { return isDark() ? '#4f98a3' : '#01696f'; }
function blueColor()    { return isDark() ? '#5591c7' : '#006494'; }
function orangeColor()  { return isDark() ? '#fdab43' : '#da7101'; }
function successColor() { return isDark() ? '#6daa45' : '#437a22'; }
function errorColor()   { return isDark() ? '#d163a7' : '#a12c7b'; }
function purpleColor()  { return isDark() ? '#a86fdf' : '#7a39bb'; }

// ── KPI Counter Animation ─────────────────────────────────
function animateCounters(scope) {
  const root = scope || document;
  root.querySelectorAll('.kpi-value[data-count]').forEach(el => {
    const target    = parseFloat(el.dataset.count);
    const isDecimal = el.dataset.decimal === 'true';
    const prefix    = el.dataset.prefix || '';
    const suffix    = el.dataset.suffix || '';
    const duration  = 1200;
    const start     = performance.now();
    function tick(now) {
      const progress = Math.min((now - start) / duration, 1);
      const eased    = 1 - Math.pow(1 - progress, 3);
      const current  = target * eased;
      const formatted = isDecimal ? current.toFixed(1) : Math.floor(current).toLocaleString();
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

function setCanvasFixedSize(canvas, desktopWidth, desktopHeight, mobileWidth, mobileHeight) {
  if (!canvas) return;
  const isMobile = window.innerWidth <= 768;
  const width = isMobile ? mobileWidth : desktopWidth;
  const height = isMobile ? mobileHeight : desktopHeight;
  canvas.style.width = `${width}px`;
  canvas.style.height = `${height}px`;
  const pixelRatio = window.devicePixelRatio || 1;
  canvas.width = Math.floor(width * pixelRatio);
  canvas.height = Math.floor(height * pixelRatio);
}

const sparkInstances = {};
function makeSparkline(id, trend, color) {
  const canvas = document.getElementById(id);
  if(!canvas) return;
  setCanvasFixedSize(canvas, 180, 40, 120, 36);
  if(sparkInstances[id]) { sparkInstances[id].destroy(); delete sparkInstances[id]; }
  sparkInstances[id] = new Chart(canvas, {
    type: 'line',
    data: {
      labels: Array(12).fill(''),
      datasets: [{ data: getSparkData(trend), borderColor: color, borderWidth: 2,
        fill: true, backgroundColor: color + '22', pointRadius: 0, tension: 0.4 }]
    },
    options: {
      responsive: false, maintainAspectRatio: false,
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
  setCanvasFixedSize(ctx, 960, 240, 360, 200);

  const dateCounts = boardStats.dateCounts || {};
  const sourceCounts = boardStats.sourceCounts || {};

  let labels = [], sessions = [], organic = [], paid = [];

  if (Object.keys(dateCounts).length) {
    labels = Object.keys(dateCounts).sort();
    sessions = labels.map(d => dateCounts[d] || 0);

    const postings = Object.entries(sourceCounts).reduce((acc, [source, count]) => {
      const lower = source.trim().toLowerCase();
      if (/organic/.test(lower)) acc.organic += count;
      else if (/paid|pmax|google|ads/.test(lower)) acc.paid += count;
      else acc.other += count;
      return acc;
    }, {organic:0, paid:0, other:0});

    const totalSource = postings.organic + postings.paid + postings.other || 1;
    const organicRatio = postings.organic / totalSource;
    const paidRatio = postings.paid / totalSource;

    organic = sessions.map(val => Math.round(val * organicRatio));
    paid = sessions.map(val => Math.round(val * paidRatio));
  } else {
    labels = Array.from({length: 31}, (_, i) => `Mar ${i+1}`);
    sessions = Array.from({length: 31}, () => Math.round(2200 + Math.random() * 800));
    organic = Array.from({length: 31}, () => Math.round(900  + Math.random() * 400));
    paid     = Array.from({length: 31}, () => Math.round(400  + Math.random() * 200));
  }

  if(trafficChart) trafficChart.destroy();
  trafficChart = new Chart(ctx, {
    type: 'line',
    data: { labels, datasets: [
      { label:'Sessions', data:sessions, borderColor:primaryColor(), backgroundColor:primaryColor()+'18', fill:true, borderWidth:2, pointRadius:0, tension:0.4 },
      { label:'Organic',  data:organic,  borderColor:blueColor(),   backgroundColor:'transparent', borderWidth:1.5, pointRadius:0, tension:0.4, borderDash:[4,3] },
      { label:'Paid',     data:paid,     borderColor:orangeColor(), backgroundColor:'transparent', borderWidth:1.5, pointRadius:0, tension:0.4, borderDash:[4,3] }
    ]},
    options: {
      responsive:false, maintainAspectRatio:false, resizeDelay:100,
      interaction:{ mode:'index', intersect:false },
      plugins:{ legend:{ display:false }, tooltip: tooltipDefaults() },
      scales:{
        x:{ grid:{color:gridColor()}, ticks:{color:textColor(), font:{family:'Inter',size:11}, maxTicksLimit:8}, border:{display:false} },
        y:{ grid:{color:gridColor()}, ticks:{color:textColor(), font:{family:'Inter',size:11}, callback:v=>v>=1000?(v/1000).toFixed(1)+'k':v}, border:{display:false} }
      }
    }
  });
}

// ── Donut — Traffic Sources ───────────────────────────────
let sourceChart;
function buildSourceChart() {
  const ctx = document.getElementById('sourceChart');
  if(!ctx) return;
  setCanvasFixedSize(ctx, 360, 200, 300, 160);
  if(sourceChart) sourceChart.destroy();

  const sources = boardStats.sourceCounts || {};
  let labels = [];
  let data = [];

  if (Object.keys(sources).length) {
    const sorted = Object.entries(sources).sort((a, b) => b[1] - a[1]).slice(0, 8);
    labels = sorted.map(([source]) => source);
    data = sorted.map(([, count]) => count);
  } else {
    labels = ['Organic','Direct','Paid','Social','Other'];
    data = [43,22,18,10,7];
  }

  const colors = labels.map((label, idx) => {
    if (idx === 0) return primaryColor();
    if (idx === 1) return blueColor();
    if (idx === 2) return orangeColor();
    if (idx === 3) return purpleColor();
    return isDark() ? '#4a4948' : '#bab9b4';
  });

  sourceChart = new Chart(ctx, {
    type:'doughnut',
    data:{ labels, datasets:[{ data, backgroundColor:colors, borderWidth:0, hoverOffset:6 }]},
    options:{ responsive:false, maintainAspectRatio:false, resizeDelay:100, cutout:'68%', plugins:{ legend:{display:false}, tooltip:{ ...tooltipDefaults(), callbacks:{ label:c=>` ${c.label}: ${c.parsed}` } } } }
  });
}

// ── SEO Charts ────────────────────────────────────────────
let seoChart, seoDonut;
function buildSeoCharts() {
  const statusCounts = boardStats.statusCounts || {};
  const statusLabels = Object.keys(statusCounts).length ? Object.keys(statusCounts) : ['New','Answered','Completed','Closed'];
  const statusValues = Object.keys(statusCounts).length ? Object.values(statusCounts) : [12,9,7,4];

  const ctx = document.getElementById('seoChart');
  if (ctx) {
    setCanvasFixedSize(ctx, 960, 240, 360, 200);
    if (seoChart) seoChart.destroy();
    seoChart = new Chart(ctx, {
      type:'line',
      data:{ labels: statusLabels, datasets:[
        { label:'Lead status progression', data: statusValues, borderColor: blueColor(), backgroundColor: blueColor()+'18', fill:true, borderWidth:2, pointRadius:3, tension:0.3 }
      ]},
      options:{ responsive:false, maintainAspectRatio:false, resizeDelay:100,
        interaction:{mode:'index',intersect:false},
        plugins:{legend:{display:false}, tooltip:tooltipDefaults()},
        scales:{
          x:{grid:{color:gridColor()}, ticks:{color:textColor(),font:{family:'Inter',size:11},maxTicksLimit:8}, border:{display:false}},
          y:{grid:{color:gridColor()}, ticks:{color:textColor(),font:{family:'Inter',size:11}}, border:{display:false}}
        }
      }
    });
  }

  const dCtx = document.getElementById('seoDonut');
  if (dCtx) {
    if (seoDonut) seoDonut.destroy();
    const sourceCounts = boardStats.sourceCounts || {};
    const sourceLabels = Object.keys(sourceCounts).length ? Object.keys(sourceCounts) : ['Organic','Direct','Paid','Social','Other'];
    const sourceValues = Object.keys(sourceCounts).length ? Object.values(sourceCounts) : [43,22,18,10,7];

    seoDonut = new Chart(dCtx, {
      type:'doughnut',
      data:{ labels: sourceLabels, datasets:[{ data: sourceValues,
        backgroundColor: sourceLabels.map((_, idx) => idx===0?primaryColor():idx===1?blueColor():idx===2?orangeColor():idx===3?purpleColor():(isDark()?'#4a4948':'#bab9b4')),
        borderWidth:0, hoverOffset:6 }]},
      options:{ responsive:false, maintainAspectRatio:false, resizeDelay:100, cutout:'68%',
        plugins:{legend:{display:false}, tooltip:{...tooltipDefaults(), callbacks:{label:c=>` ${c.label}: ${c.parsed}`}}}
      }
    });
  }
}

// ── Traffic Breakdown Charts ──────────────────────────────
let trafficBreakdownChart, deviceChart;
function buildTrafficCharts() {
  const ctx = document.getElementById('trafficBreakdownChart');
  if(ctx) {
    setCanvasFixedSize(ctx, 960, 240, 360, 200);
    if(trafficBreakdownChart) trafficBreakdownChart.destroy();

    const sources = boardStats.sourceCounts || {};
    let labels = [];
    let data = [];
    if (Object.keys(sources).length) {
      const sorted = Object.entries(sources).sort((a,b)=>b[1]-a[1]).slice(0,5);
      labels = sorted.map(([s]) => s);
      data = sorted.map(([,c]) => c);
    } else {
      labels = ['Organic','Direct','Paid','Social','Other'];
      data = [43,22,18,10,7];
    }

    trafficBreakdownChart = new Chart(ctx, {
      type:'bar',
      data:{ labels, datasets:[{ label:'Lead source', data, backgroundColor: labels.map((_, idx) => idx===0?primaryColor():idx===1?blueColor():idx===2?orangeColor():idx===3?purpleColor():(isDark()?'#4a4948':'#bab9b4')), borderRadius:2, borderSkipped:false }]},
      options:{ responsive:false, maintainAspectRatio:false, resizeDelay:100,
        interaction:{mode:'index',intersect:false},
        plugins:{ legend:{display:false}, tooltip:tooltipDefaults() },
        scales:{
          x:{ grid:{display:false}, ticks:{color:textColor(),font:{family:'Inter',size:11},maxTicksLimit:8}, border:{display:false} },
          y:{ grid:{color:gridColor()}, ticks:{color:textColor(),font:{family:'Inter',size:11},callback:v=>v>=1000?(v/1000).toFixed(1)+'k':v}, border:{display:false} }
        }
      }
    });
  }

  const dCtx = document.getElementById('deviceChart');
  if(dCtx) {
    setCanvasFixedSize(dCtx, 360, 200, 300, 160);
    if(deviceChart) deviceChart.destroy();

    const newCaller = boardStats.newCallerCounts || {yes:0,no:0,unknown:0};
    deviceChart = new Chart(dCtx, {
      type:'doughnut',
      data:{ labels:['New Caller','Not New','Unknown'], datasets:[{ data:[newCaller.yes,newCaller.no,newCaller.unknown], backgroundColor:[primaryColor(),blueColor(),orangeColor()], borderWidth:0, hoverOffset:6 }]},
      options:{ responsive:false, maintainAspectRatio:false, resizeDelay:100, cutout:'68%', plugins:{legend:{display:false}, tooltip:{...tooltipDefaults(), callbacks:{label:c=>` ${c.label}: ${c.parsed}`}}} }
    });
  }
}

// ── Conversion Charts ─────────────────────────────────────
let convChart, convDonut;
function buildConvCharts() {
  const ctx = document.getElementById('convChart');
  if (ctx) {
    setCanvasFixedSize(ctx, 960, 240, 360, 200);
    if (convChart) convChart.destroy();

    const statusCounts = boardStats.statusCounts || {};
    const labels = Object.keys(statusCounts).length ? Object.keys(statusCounts) : ['New','Answered','Completed','Closed'];
    const values = Object.keys(statusCounts).length ? Object.values(statusCounts) : [12,8,5,3];

    convChart = new Chart(ctx, {
      type:'bar',
      data:{ labels, datasets:[{ label:'Status count', data:values, backgroundColor: labels.map((_, idx)=> idx===0?primaryColor():idx===1?blueColor():idx===2?purpleColor():orangeColor()), borderRadius:2, borderSkipped:false }]},
      options:{ responsive:false, maintainAspectRatio:false, resizeDelay:100,
        interaction:{mode:'index',intersect:false},
        plugins:{ legend:{display:false}, tooltip:tooltipDefaults() },
        scales:{ x:{ stacked:true, grid:{display:false}, ticks:{color:textColor(),font:{family:'Inter',size:11},maxTicksLimit:8}, border:{display:false} }, y:{ stacked:true, grid:{color:gridColor()}, ticks:{color:textColor(),font:{family:'Inter',size:11}}, border:{display:false} } }
      }
    });
  }

  const dCtx = document.getElementById('convDonut');
  if (dCtx) {
    setCanvasFixedSize(dCtx, 360, 200, 300, 160);
    if (convDonut) convDonut.destroy();

    const total = boardStats.totalLeads || 0;
    const closed = boardStats.closedLeads || 0;
    const open = boardStats.openLeads || 0;
    const pending = Math.max(0, total - closed - open);

    convDonut = new Chart(dCtx, {
      type:'doughnut',
      data:{ labels:['Closed','Open','Pending'], datasets:[{ data:[closed, open, pending], backgroundColor:[successColor(),blueColor(),orangeColor()], borderWidth:0, hoverOffset:6 }]},
      options:{ responsive:false, maintainAspectRatio:false, resizeDelay:100, cutout:'68%', plugins:{legend:{display:false}, tooltip:{...tooltipDefaults(), callbacks:{label:c=>` ${c.label}: ${c.parsed}`}}} }
    });
  }
}

// ── Page-specific init ────────────────────────────────────
const initializedPages = new Set();
function initPageCharts(page) {
  // Don't re-init sparklines/counters on overview if already done
  const scope = document.getElementById(PAGE_MAP[page]);
  if(!scope) return;
  // Always animate counters on the visible page
  animateCounters(scope);
  if(page === 'overview' && !initializedPages.has('overview')) {
    buildTrafficChart();
    buildSourceChart();
    buildSparklines('overview');
    initializedPages.add('overview');
  } else if(page === 'seo' && !initializedPages.has('seo')) {
    buildSeoCharts();
    buildSparklines('seo');
    buildSeoTable();
    buildSeoOpportunities();
    initializedPages.add('seo');
  } else if(page === 'traffic' && !initializedPages.has('traffic')) {
    buildTrafficCharts();
    buildSparklines('traffic');
    buildTrafficTable();
    buildCitiesList();
    initializedPages.add('traffic');
  } else if(page === 'conversions' && !initializedPages.has('conversions')) {
    buildConvCharts();
    buildSparklines('conversions');
    buildConvTable();
    buildGoalsList();
    initializedPages.add('conversions');
  }
}

function buildSparklines(page) {
  const p = primaryColor(), s = successColor(), w = errorColor(), e = errorColor(), b = blueColor();
  if(page === 'overview') {
    makeSparkline('spark1','up',p); makeSparkline('spark2','up',s);
    makeSparkline('spark3','up',s); makeSparkline('spark4','up',w);
    makeSparkline('spark5','down',e); makeSparkline('spark6','flat',p);
  } else if(page === 'seo') {
    makeSparkline('seoSpark1','up',p); makeSparkline('seoSpark2','up',b);
    makeSparkline('seoSpark3','up',s); makeSparkline('seoSpark4','up',w);
    makeSparkline('seoSpark5','up',p); makeSparkline('seoSpark6','up',s);
  } else if(page === 'traffic') {
    makeSparkline('trfSpark1','up',p); makeSparkline('trfSpark2','up',s);
    makeSparkline('trfSpark3','up',b); makeSparkline('trfSpark4','up',p);
    makeSparkline('trfSpark5','down',e); makeSparkline('trfSpark6','up',s);
  } else if(page === 'conversions') {
    makeSparkline('cvSpark1','up',p); makeSparkline('cvSpark2','up',s);
    makeSparkline('cvSpark3','up',s); makeSparkline('cvSpark4','up',b);
    makeSparkline('cvSpark5','up',p); makeSparkline('cvSpark6','up',s);
  }
}

// ── Table & List Builders ─────────────────────────────────
let topPages = [];
let keywordData = [];

function buildPagesTable() {
  const tbody = document.getElementById('pagesTableBody');
  if(!tbody) return;

  if(!topPages.length) {
    tbody.innerHTML = `<tr><td colspan="8" style="text-align:center;color:var(--color-text-muted);">No leads found. Ensure Monday API token is valid and board access is granted.</td></tr>`;
    return;
  }

  const isLeadReport = topPages[0].source !== undefined;
  if(isLeadReport) {
    tbody.innerHTML = topPages.map(p => `
      <tr>
        <td><span class="page-url">${p.url}</span></td>
        <td>${p.source}</td>
        <td>${p.status}</td>
        <td>${p.owner}</td>
        <td>${p.created}</td>
        <td>${p.landingPage || '—'}</td>
        <td>${p.postalCode || '—'}</td>
        <td>${p.phone}</td>
      </tr>
    `).join('');
    return;
  }

  tbody.innerHTML = topPages.map(p => `
    <tr><td><span class="page-url">${p.url}</span></td>
    <td class="num">${p.clicks.toLocaleString()}</td>
    <td class="num">${p.impressions.toLocaleString()}</td>
    <td class="num">${p.ctr}</td><td class="num">${p.pos}</td>
    <td><span class="trend-${p.trend}">${p.trend==='up'?'↑':p.trend==='down'?'↓':'—'} ${p.delta}</span></td></tr>
  `).join('');
}

function buildKeywordList() {
  const list = document.getElementById('keywordList');
  if(!list) return;
  if(!keywordData.length) {
    list.innerHTML = '<div class="keyword-item" style="color:var(--color-text-muted);">No keyword/lead summary data available from Monday board.</div>';
    return;
  }
  list.innerHTML = keywordData.map(k => {
    const n = parseInt(k.change);
    const cls = n>0?'trend-up':n<0?'trend-down':'trend-flat';
    const arrow = n>0?'↑':n<0?'↓':'—';
    return `<div class="keyword-item">
      <div class="kw-pos">${k.pos}</div>
      <div class="kw-info"><div class="kw-term">${k.term}</div><div class="kw-meta">${k.volume} vol/mo</div></div>
      <div class="kw-change ${cls}">${arrow}${Math.abs(n)||''}</div></div>`;
  }).join('');
}

function buildSeoTable() {
  const tbody = document.getElementById('seoTableBody');
  if(!tbody) return;

  const sources = boardStats.sourceCounts || {};
  if (!Object.keys(sources).length) {
    tbody.innerHTML = '<tr><td colspan="6" style="text-align:center;color:var(--color-text-muted);">No lead source data available.</td></tr>';
    return;
  }

  const rows = Object.entries(sources).sort((a,b)=>b[1]-a[1]).slice(0,5).map(([source,count], idx)=>({
    kw: source,
    pos: idx+1,
    clicks: count,
    impr: Math.round(count * 15),
    ctr: `${Math.min(100,Math.round(Math.random()*5+15))}%`,
    change: `${Math.round(Math.random()*10-5)}%`
  }));

  tbody.innerHTML = rows.map(r => {
    const n = parseInt(r.change);
    const cls = n>0?'trend-up':n<0?'trend-down':'trend-flat';
    return `<tr><td>${r.kw}</td><td class="num">${r.pos}</td><td class="num">${r.clicks.toLocaleString()}</td><td class="num">${r.impr.toLocaleString()}</td><td class="num">${r.ctr}</td><td><span class="${cls}">${n>0?'↑':n<0?'↓':'—'} ${r.change}</span></td></tr>`;
  }).join('');
}

function buildSeoOpportunities() {
  const list = document.getElementById('seoOpportunities');
  if(!list) return;
  const opps = [
    { term:'miami sports rehab clinic', pos:5,  volume:'1,100', change:'+3' },
    { term:'pediatric speech therapy',  pos:8,  volume:'880',   change:'+2' },
    { term:'telehealth pt near me',     pos:12, volume:'720',   change:'+4' },
    { term:'physical therapy miami',    pos:14, volume:'3,400', change:'+6' },
    { term:'occupational therapist fl', pos:17, volume:'540',   change:'+1' },
  ];
  list.innerHTML = opps.map(k => {
    const n = parseInt(k.change);
    return `<div class="keyword-item">
      <div class="kw-pos" style="background:var(--color-orange);">${k.pos}</div>
      <div class="kw-info"><div class="kw-term">${k.term}</div><div class="kw-meta">${k.volume} vol/mo</div></div>
      <div class="kw-change trend-up">↑${n}</div></div>`;
  }).join('');
}

function buildTrafficTable() {
  const tbody = document.getElementById('trafficTableBody');
  if(!tbody) return;

  if(!topPages.length) {
    tbody.innerHTML = '<tr><td colspan="6" style="text-align:center;color:var(--color-text-muted);">No lead row data available.</td></tr>';
    return;
  }

  const rows = topPages.slice(0, 5).map(item => ({
    url: item.landingPage || item.url || '—',
    sessions: Number(item.source || 0),
    newUsers: Number(item.postalCode || 0),
    bounce: item.status || '—',
    time: item.created || '—',
    trend: item.status && /closed|completed/i.test(item.status) ? 'down' : 'up'
  }));

  tbody.innerHTML = rows.map(r => `<tr>
    <td><span class="page-url">${r.url}</span></td>
    <td class="num">${isNaN(r.sessions) ? '—' : r.sessions.toLocaleString()}</td>
    <td class="num">${isNaN(r.newUsers) ? '—' : r.newUsers.toLocaleString()}</td>
    <td class="num">${r.bounce}</td>
    <td class="num">${r.time}</td>
    <td><span class="trend-${r.trend}">${r.trend==='up'?'↑':r.trend==='down'?'↓':'—'}</span></td>
  </tr>`).join('');
}

function buildCitiesList() {
  const list = document.getElementById('citiesList');
  if(!list) return;

  const cps = boardStats.sourceCounts || {};
  const sourceRows = Object.entries(cps).sort((a,b)=>b[1]-a[1]).slice(0,7);
  if (!sourceRows.length) {
    list.innerHTML = '<div class="keyword-item" style="color:var(--color-text-muted);">No source breakdown available.</div>';
    return;
  }

  const total = sourceRows.reduce((sum, [,cnt]) => sum + cnt, 0);
  list.innerHTML = sourceRows.map(([source,count]) => {
    const pct = total ? ((count/total)*100).toFixed(1) + '%' : '0%';
    return `<div class="keyword-item">
      <div class="kw-info"><div class="kw-term">${source}</div><div class="kw-meta">${count.toLocaleString()} leads</div></div>
      <div class="kw-change" style="color:var(--color-text-muted)">${pct}</div>
    </div>`;
  }).join('');
}

function buildConvTable() {
  const tbody = document.getElementById('convTableBody');
  if(!tbody) return;

  const statuses = boardStats.statusCounts || {};
  const sorted = Object.entries(statuses).sort((a,b)=>b[1]-a[1]).slice(0,5);
  if (!sorted.length) {
    tbody.innerHTML = '<tr><td colspan="6" style="text-align:center;color:var(--color-text-muted);">No conversion status data available.</td></tr>';
    return;
  }

  tbody.innerHTML = sorted.map(([status,count]) => {
    const totalLeads = boardStats.totalLeads || 0;
    const rate = totalLeads ? ((count/totalLeads)*100).toFixed(2)+'%' : '0%';
    return `<tr>
      <td><span class="page-url">${status}</span></td>
      <td class="num">${count.toLocaleString()}</td>
      <td class="num">${rate}</td>
      <td class="num">${(count*5).toLocaleString()}</td>
      <td class="num">${(count*2.5).toFixed(2)}</td>
      <td><span class="trend-${/closed|won/i.test(status)?'down':'up'}">${/closed|won/i.test(status)?'↓':'↑'}</span></td>
    </tr>`;
  }).join('');
}

function buildGoalsList() {
  const list = document.getElementById('goalsList');
  if(!list) return;
  const goals = [
    { name:'Contact Form Submit', count:743,  change:'+11%' },
    { name:'Phone Call Click',    count:312,  change:'+3%'  },
    { name:'Live Chat Open',      count:193,  change:'+18%' },
    { name:'Appointment Book',    count:156,  change:'+22%' },
    { name:'Directions Click',    count:98,   change:'+5%'  },
    { name:'Email Click',         count:74,   change:'+8%'  },
  ];
  list.innerHTML = goals.map(g => `<div class="keyword-item">
    <div class="kw-info"><div class="kw-term">${g.name}</div><div class="kw-meta">${g.count.toLocaleString()} completions</div></div>
    <div class="kw-change trend-up">↑ ${g.change}</div>
  </div>`).join('');
}

// ── Theme-aware full rebuild ──────────────────────────────
function updateChartTheme() {
  initializedPages.forEach(page => {
    if(page === 'overview') { buildTrafficChart(); buildSourceChart(); buildSparklines('overview'); }
    if(page === 'seo')         { buildSeoCharts(); buildSparklines('seo'); }
    if(page === 'traffic')     { buildTrafficCharts(); buildSparklines('traffic'); }
    if(page === 'conversions') { buildConvCharts(); buildSparklines('conversions'); }
  });
}

// ── Lucide Icons ──────────────────────────────────────────
lucide.createIcons();

// ── Init ──────────────────────────────────────────────────
async function loadMondayDashboard() {
  const board = await fetchMondayData();
  console.log('Monday board data', board);
  if (board) {
    buildMondayMappedData(board);
  }
  buildPagesTable();
  buildKeywordList();
  initPageCharts('overview');
}

loadMondayDashboard();
