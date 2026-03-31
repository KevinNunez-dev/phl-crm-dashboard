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

const sparkInstances = {};
function makeSparkline(id, trend, color) {
  const canvas = document.getElementById(id);
  if(!canvas) return;
  if(sparkInstances[id]) { sparkInstances[id].destroy(); delete sparkInstances[id]; }
  sparkInstances[id] = new Chart(canvas, {
    type: 'line',
    data: {
      labels: Array(12).fill(''),
      datasets: [{ data: getSparkData(trend), borderColor: color, borderWidth: 2,
        fill: true, backgroundColor: color + '22', pointRadius: 0, tension: 0.4 }]
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
  const labels   = Array.from({length: 31}, (_, i) => `Mar ${i+1}`);
  const sessions = Array.from({length: 31}, () => Math.round(2200 + Math.random() * 800));
  const organic  = Array.from({length: 31}, () => Math.round(900  + Math.random() * 400));
  const paid     = Array.from({length: 31}, () => Math.round(400  + Math.random() * 200));
  if(trafficChart) trafficChart.destroy();
  trafficChart = new Chart(ctx, {
    type: 'line',
    data: { labels, datasets: [
      { label:'Sessions', data:sessions, borderColor:primaryColor(), backgroundColor:primaryColor()+'18', fill:true, borderWidth:2, pointRadius:0, tension:0.4 },
      { label:'Organic',  data:organic,  borderColor:blueColor(),   backgroundColor:'transparent', borderWidth:1.5, pointRadius:0, tension:0.4, borderDash:[4,3] },
      { label:'Paid',     data:paid,     borderColor:orangeColor(), backgroundColor:'transparent', borderWidth:1.5, pointRadius:0, tension:0.4, borderDash:[4,3] }
    ]},
    options: {
      responsive:true, maintainAspectRatio:false, resizeDelay:100,
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
  if(sourceChart) sourceChart.destroy();
  sourceChart = new Chart(ctx, {
    type: 'doughnut',
    data: {
      labels: ['Organic','Direct','Paid','Social','Other'],
      datasets: [{ data:[43,22,18,10,7],
        backgroundColor:[primaryColor(),blueColor(),orangeColor(),purpleColor(),isDark()?'#4a4948':'#bab9b4'],
        borderWidth:0, hoverOffset:6 }]
    },
    options: {
      responsive:true, maintainAspectRatio:false, resizeDelay:100,
      cutout:'68%',
      plugins:{ legend:{display:false}, tooltip:{ ...tooltipDefaults(), callbacks:{ label:c=>` ${c.label}: ${c.parsed}%` } } }
    }
  });
}

// ── SEO Charts ────────────────────────────────────────────
let seoChart, seoDonut;
function buildSeoCharts() {
  // Line
  const ctx = document.getElementById('seoChart');
  if(ctx) {
    if(seoChart) seoChart.destroy();
    const labels  = Array.from({length:31},(_,i)=>`Mar ${i+1}`);
    const impr    = Array.from({length:31},()=>Math.round(8000+Math.random()*2000));
    const clicks  = Array.from({length:31},()=>Math.round(900+Math.random()*400));
    seoChart = new Chart(ctx, {
      type:'line',
      data:{ labels, datasets:[
        { label:'Impressions', data:impr,   borderColor:blueColor(),    backgroundColor:blueColor()+'18',    fill:true, borderWidth:2, pointRadius:0, tension:0.4 },
        { label:'Clicks',      data:clicks, borderColor:primaryColor(), backgroundColor:primaryColor()+'18', fill:true, borderWidth:2, pointRadius:0, tension:0.4 }
      ]},
      options:{ responsive:true, maintainAspectRatio:false, resizeDelay:100,
        interaction:{mode:'index',intersect:false},
        plugins:{legend:{display:false}, tooltip:tooltipDefaults()},
        scales:{
          x:{grid:{color:gridColor()}, ticks:{color:textColor(),font:{family:'Inter',size:11},maxTicksLimit:8}, border:{display:false}},
          y:{grid:{color:gridColor()}, ticks:{color:textColor(),font:{family:'Inter',size:11},callback:v=>v>=1000?(v/1000).toFixed(1)+'k':v}, border:{display:false}}
        }
      }
    });
  }
  // Donut
  const dCtx = document.getElementById('seoDonut');
  if(dCtx) {
    if(seoDonut) seoDonut.destroy();
    seoDonut = new Chart(dCtx, {
      type:'doughnut',
      data:{ labels:['Physiotherapy','Occupational','Speech','Rehab','Other'],
        datasets:[{ data:[28,19,15,23,15],
          backgroundColor:[primaryColor(),blueColor(),orangeColor(),purpleColor(),isDark()?'#4a4948':'#bab9b4'],
          borderWidth:0, hoverOffset:6 }]
      },
      options:{ responsive:true, maintainAspectRatio:false, resizeDelay:100, cutout:'68%',
        plugins:{legend:{display:false}, tooltip:{...tooltipDefaults(), callbacks:{label:c=>` ${c.label}: ${c.parsed}%`}}}
      }
    });
  }
}

// ── Traffic Breakdown Charts ──────────────────────────────
let trafficBreakdownChart, deviceChart;
function buildTrafficCharts() {
  const ctx = document.getElementById('trafficBreakdownChart');
  if(ctx) {
    if(trafficBreakdownChart) trafficBreakdownChart.destroy();
    const labels  = Array.from({length:31},(_,i)=>`Mar ${i+1}`);
    const organic = Array.from({length:31},()=>Math.round(900+Math.random()*400));
    const paid    = Array.from({length:31},()=>Math.round(400+Math.random()*200));
    const direct  = Array.from({length:31},()=>Math.round(300+Math.random()*150));
    const social  = Array.from({length:31},()=>Math.round(150+Math.random()*100));
    trafficBreakdownChart = new Chart(ctx, {
      type:'bar',
      data:{ labels, datasets:[
        { label:'Organic', data:organic, backgroundColor:primaryColor()+'cc', borderRadius:2, borderSkipped:false },
        { label:'Paid',    data:paid,    backgroundColor:orangeColor()+'cc', borderRadius:2, borderSkipped:false },
        { label:'Direct',  data:direct,  backgroundColor:blueColor()+'cc', borderRadius:2, borderSkipped:false },
        { label:'Social',  data:social,  backgroundColor:purpleColor()+'cc', borderRadius:2, borderSkipped:false }
      ]},
      options:{ responsive:true, maintainAspectRatio:false, resizeDelay:100,
        interaction:{mode:'index',intersect:false},
        plugins:{ legend:{display:false}, tooltip:tooltipDefaults() },
        scales:{
          x:{ stacked:true, grid:{display:false}, ticks:{color:textColor(),font:{family:'Inter',size:11},maxTicksLimit:8}, border:{display:false} },
          y:{ stacked:true, grid:{color:gridColor()}, ticks:{color:textColor(),font:{family:'Inter',size:11},callback:v=>v>=1000?(v/1000).toFixed(1)+'k':v}, border:{display:false} }
        }
      }
    });
  }
  const dCtx = document.getElementById('deviceChart');
  if(dCtx) {
    if(deviceChart) deviceChart.destroy();
    deviceChart = new Chart(dCtx, {
      type:'doughnut',
      data:{ labels:['Mobile','Desktop','Tablet'],
        datasets:[{ data:[58,34,8],
          backgroundColor:[primaryColor(),blueColor(),orangeColor()],
          borderWidth:0, hoverOffset:6 }]
      },
      options:{ responsive:true, maintainAspectRatio:false, resizeDelay:100, cutout:'68%',
        plugins:{legend:{display:false}, tooltip:{...tooltipDefaults(), callbacks:{label:c=>` ${c.label}: ${c.parsed}%`}}}
      }
    });
  }
}

// ── Conversion Charts ─────────────────────────────────────
let convChart, convDonut;
function buildConvCharts() {
  const ctx = document.getElementById('convChart');
  if(ctx) {
    if(convChart) convChart.destroy();
    const labels = Array.from({length:31},(_,i)=>`Mar ${i+1}`);
    const forms  = Array.from({length:31},()=>Math.round(18+Math.random()*12));
    const calls  = Array.from({length:31},()=>Math.round(8+Math.random()*6));
    const chat   = Array.from({length:31},()=>Math.round(4+Math.random()*5));
    convChart = new Chart(ctx, {
      type:'bar',
      data:{ labels, datasets:[
        { label:'Forms',  data:forms, backgroundColor:primaryColor()+'cc', borderRadius:2, borderSkipped:false },
        { label:'Calls',  data:calls, backgroundColor:blueColor()+'cc',    borderRadius:2, borderSkipped:false },
        { label:'Chat',   data:chat,  backgroundColor:purpleColor()+'cc',  borderRadius:2, borderSkipped:false }
      ]},
      options:{ responsive:true, maintainAspectRatio:false, resizeDelay:100,
        interaction:{mode:'index',intersect:false},
        plugins:{ legend:{display:false}, tooltip:tooltipDefaults() },
        scales:{
          x:{ stacked:true, grid:{display:false}, ticks:{color:textColor(),font:{family:'Inter',size:11},maxTicksLimit:8}, border:{display:false} },
          y:{ stacked:true, grid:{color:gridColor()}, ticks:{color:textColor(),font:{family:'Inter',size:11}}, border:{display:false} }
        }
      }
    });
  }
  const dCtx = document.getElementById('convDonut');
  if(dCtx) {
    if(convDonut) convDonut.destroy();
    convDonut = new Chart(dCtx, {
      type:'doughnut',
      data:{ labels:['Organic','Paid','Direct','Social'],
        datasets:[{ data:[47,31,14,8],
          backgroundColor:[primaryColor(),orangeColor(),blueColor(),purpleColor()],
          borderWidth:0, hoverOffset:6 }]
      },
      options:{ responsive:true, maintainAspectRatio:false, resizeDelay:100, cutout:'68%',
        plugins:{legend:{display:false}, tooltip:{...tooltipDefaults(), callbacks:{label:c=>` ${c.label}: ${c.parsed}%`}}}
      }
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
const topPages = [
  { url:'/services/physiotherapy',      clicks:4821, impressions:38400, ctr:'12.6%', pos:'2.1', trend:'up',   delta:'+8%'  },
  { url:'/services/occupational-therapy',clicks:3290, impressions:29100, ctr:'11.3%', pos:'3.4', trend:'up',   delta:'+5%'  },
  { url:'/about-us',                    clicks:2741, impressions:22800, ctr:'12.0%', pos:'4.0', trend:'flat', delta:'0%'   },
  { url:'/blog/back-pain-tips',         clicks:2156, impressions:41200, ctr:'5.2%',  pos:'6.2', trend:'up',   delta:'+14%' },
  { url:'/contact',                     clicks:1894, impressions:18300, ctr:'10.3%', pos:'2.9', trend:'down', delta:'-3%'  },
  { url:'/locations/miami',             clicks:1743, impressions:15600, ctr:'11.2%', pos:'3.1', trend:'up',   delta:'+21%' },
  { url:'/services/speech-therapy',     clicks:1420, impressions:19700, ctr:'7.2%',  pos:'5.8', trend:'down', delta:'-7%'  },
];

function buildPagesTable() {
  const tbody = document.getElementById('pagesTableBody');
  if(!tbody) return;
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
  const kws = [
    { term:'physiotherapy miami',          pos:1,  volume:'2,400', change:'+2' },
    { term:'occupational therapy near me', pos:3,  volume:'1,900', change:'+5' },
    { term:'speech therapy clinic miami',  pos:4,  volume:'880',   change:'+1' },
    { term:'back pain physiotherapist',    pos:6,  volume:'3,200', change:'+8' },
    { term:'pediatric therapy miami',      pos:7,  volume:'720',   change:'0'  },
    { term:'sports injury rehab',          pos:9,  volume:'1,300', change:'-2' },
    { term:'telehealth therapy florida',   pos:11, volume:'590',   change:'+3' },
  ];
  list.innerHTML = kws.map(k => {
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
  const rows = [
    { kw:'physiotherapy miami',          pos:'1.0', clicks:4200, impr:18000, ctr:'23.3%', change:'+2' },
    { kw:'occupational therapy near me', pos:'3.2', clicks:2900, impr:15400, ctr:'18.8%', change:'+5' },
    { kw:'speech therapy clinic miami',  pos:'4.1', clicks:1800, impr:12200, ctr:'14.8%', change:'+1' },
    { kw:'back pain physiotherapist',    pos:'6.4', clicks:1300, impr:24000, ctr:'5.4%',  change:'+8' },
    { kw:'telehealth therapy florida',   pos:'11',  clicks:520,  impr:9400,  ctr:'5.5%',  change:'+3' },
  ];
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
  const rows = [
    { url:'/services/physiotherapy',       sessions:12400, newUsers:8200, bounce:'38%', time:'3m 12s', trend:'up'   },
    { url:'/locations/miami',              sessions:9800,  newUsers:7400, bounce:'41%', time:'2m 44s', trend:'up'   },
    { url:'/contact',                      sessions:7200,  newUsers:4100, bounce:'29%', time:'4m 01s', trend:'flat' },
    { url:'/blog/back-pain-tips',          sessions:6300,  newUsers:5800, bounce:'62%', time:'1m 58s', trend:'up'   },
    { url:'/services/occupational-therapy',sessions:5900,  newUsers:3800, bounce:'44%', time:'2m 55s', trend:'down' },
  ];
  tbody.innerHTML = rows.map(r => `<tr>
    <td><span class="page-url">${r.url}</span></td>
    <td class="num">${r.sessions.toLocaleString()}</td>
    <td class="num">${r.newUsers.toLocaleString()}</td>
    <td class="num">${r.bounce}</td>
    <td class="num">${r.time}</td>
    <td><span class="trend-${r.trend}">${r.trend==='up'?'↑':r.trend==='down'?'↓':'—'}</span></td>
  </tr>`).join('');
}

function buildCitiesList() {
  const list = document.getElementById('citiesList');
  if(!list) return;
  const cities = [
    { name:'Miami, FL',        sessions:41200, pct:'48.9%' },
    { name:'Miami Beach, FL',  sessions:8900,  pct:'10.6%' },
    { name:'Hialeah, FL',      sessions:6300,  pct:'7.5%'  },
    { name:'Coral Gables, FL', sessions:4800,  pct:'5.7%'  },
    { name:'Doral, FL',        sessions:3900,  pct:'4.6%'  },
    { name:'Homestead, FL',    sessions:2600,  pct:'3.1%'  },
    { name:'Other',            sessions:16620, pct:'19.7%' },
  ];
  list.innerHTML = cities.map(c => `<div class="keyword-item">
    <div class="kw-info"><div class="kw-term">${c.name}</div><div class="kw-meta">${c.sessions.toLocaleString()} sessions</div></div>
    <div class="kw-change" style="color:var(--color-text-muted)">${c.pct}</div>
  </div>`).join('');
}

function buildConvTable() {
  const tbody = document.getElementById('convTableBody');
  if(!tbody) return;
  const rows = [
    { url:'/contact',                      sessions:7200,  leads:284, rate:'3.94%', cpl:'$6.20', trend:'up'   },
    { url:'/services/physiotherapy',       sessions:12400, leads:312, rate:'2.52%', cpl:'$7.10', trend:'up'   },
    { url:'/locations/miami',              sessions:9800,  leads:198, rate:'2.02%', cpl:'$8.40', trend:'flat' },
    { url:'/services/occupational-therapy',sessions:5900,  leads:108, rate:'1.83%', cpl:'$9.20', trend:'down' },
    { url:'/blog/back-pain-tips',          sessions:6300,  leads:88,  rate:'1.40%', cpl:'$12.40',trend:'up'   },
  ];
  tbody.innerHTML = rows.map(r => `<tr>
    <td><span class="page-url">${r.url}</span></td>
    <td class="num">${r.sessions.toLocaleString()}</td>
    <td class="num">${r.leads}</td>
    <td class="num">${r.rate}</td>
    <td class="num">${r.cpl}</td>
    <td><span class="trend-${r.trend}">${r.trend==='up'?'↑':r.trend==='down'?'↓':'—'}</span></td>
  </tr>`).join('');
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
buildPagesTable();
buildKeywordList();
initPageCharts('overview');
