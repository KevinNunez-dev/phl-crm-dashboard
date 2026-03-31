const DEFAULT_CONFIG = {
  apiUrl: "https://api.monday.com/v2",
  boardId: "18404733134",
  boardUrl: "https://rptclinic.monday.com/boards/18404733134",
  apiToken: "eyJhbGciOiJIUzI1NiJ9.eyJ0aWQiOjY0MDEyNjI2OCwiYWFpIjoxMSwidWlkIjo5OTgxNTY5NCwiaWFkIjoiMjAyNi0wMy0zMVQxNzo0NTozNC4wMDBaIiwicGVyIjoibWU6d3JpdGUiLCJhY3RpZCI6NzQ3NTEwNiwicmduIjoidXNlMSJ9.I120BCWqcR0iZpFRzSz4K8Z8M7SPJ_eI33hVnn23sL4",
};

const STORAGE_KEY = "phl-crm-dashboard-config";
const MAX_LOG_ENTRIES = 8;

const COLUMN_ALIASES = {
  clientName: ["client name", "client", "full name", "name"],
  dateOfLead: ["date of lead", "lead date", "date"],
  source: ["source (campaign)", "source campaign", "lead source", "source", "campaign"],
  landingPage: ["landing page url", "landing page", "url", "website"],
  postalCode: ["postal code", "zip code", "zip", "postcode"],
  contactNumber: ["contact number", "phone number", "phone", "contact"],
  newCaller: ["new caller", "new caller?"],
  status: ["status", "lead status", "stage", "pipeline stage"],
};

const state = {
  config: loadConfig(),
  board: null,
  leads: [],
  filteredLeads: [],
  metrics: null,
  charts: {},
  logs: [],
};

function loadConfig() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { ...DEFAULT_CONFIG };
    const parsed = JSON.parse(raw);
    return { ...DEFAULT_CONFIG, ...parsed };
  } catch (error) {
    return { ...DEFAULT_CONFIG };
  }
}

function saveConfig(config) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(config));
}

function clearConfig() {
  localStorage.removeItem(STORAGE_KEY);
  state.config = { ...DEFAULT_CONFIG };
}

function normalize(value) {
  return String(value || "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

function escapeHtml(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function safeJsonParse(value) {
  if (!value || typeof value !== "string") return null;
  try {
    return JSON.parse(value);
  } catch (error) {
    return null;
  }
}

function formatNumber(value) {
  return Number(value || 0).toLocaleString();
}

function formatDate(value) {
  if (!value) return "No date";
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return "No date";
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(date);
}

function formatDateTime(value) {
  if (!value) return "Not synced yet";
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return "Not synced yet";
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(date);
}

function compareText(left, right) {
  return String(left || "").localeCompare(String(right || ""), undefined, { sensitivity: "base" });
}

function zipSortValue(value) {
  const digits = String(value || "").replace(/\D/g, "");
  return digits ? Number(digits) : Number.MAX_SAFE_INTEGER;
}

function cssVar(name) {
  return getComputedStyle(document.documentElement).getPropertyValue(name).trim();
}

function getThemeIconMarkup() {
  const isDark = document.documentElement.getAttribute("data-theme") === "dark";
  if (isDark) {
    return '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="5"></circle><path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"></path></svg>';
  }
  return '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 12.79A9 9 0 1 1 11.21 3c0.28 0 0.55 0.02 0.82 0.05A7 7 0 0 0 21 12.79z"></path></svg>';
}

function updateThemeButton() {
  const button = document.querySelector("[data-theme-toggle]");
  if (button) button.innerHTML = getThemeIconMarkup();
}

function logEvent(message, tone = "info") {
  const entry = { message, tone, time: new Date() };
  state.logs.unshift(entry);
  state.logs = state.logs.slice(0, MAX_LOG_ENTRIES);
  renderLogs();
}

function renderLogs() {
  const logRoot = document.getElementById("statusLog");
  if (!logRoot) return;

  if (!state.logs.length) {
    logRoot.innerHTML = '<div class="empty-state">Waiting for first sync...</div>';
    return;
  }

  logRoot.innerHTML = state.logs
    .map((entry) => {
      const pillClass =
        entry.tone === "error"
          ? "pill-danger"
          : entry.tone === "success"
            ? "pill-success"
            : entry.tone === "warning"
              ? "pill-warning"
              : "pill-primary";

      return `
        <div class="log-row">
          <span class="log-time">${escapeHtml(
            new Intl.DateTimeFormat("en-US", {
              hour: "numeric",
              minute: "2-digit",
              second: "2-digit",
            }).format(entry.time),
          )}</span>
          <div class="log-copy">
            <p class="log-message">${escapeHtml(entry.message)}</p>
          </div>
          <span class="pill ${pillClass}">${escapeHtml(entry.tone)}</span>
        </div>
      `;
    })
    .join("");
}

function setSyncState(status, message) {
  const pill = document.getElementById("syncPill");
  const label = document.getElementById("syncStatus");
  const summary = document.getElementById("syncSummary");
  if (!pill || !label || !summary) return;

  pill.classList.remove("sync-pill-loading", "sync-pill-success", "sync-pill-error");
  if (status === "success") pill.classList.add("sync-pill-success");
  else if (status === "error") pill.classList.add("sync-pill-error");
  else pill.classList.add("sync-pill-loading");

  label.textContent = status === "success" ? "Synced" : status === "error" ? "Error" : "Connecting";
  summary.textContent = message;
}

function getColumnTitle(columnValue) {
  return columnValue?.column?.title || columnValue?.id || "";
}

function findColumnValue(item, aliases) {
  const wanted = aliases.map(normalize);
  return (item.column_values || []).find((columnValue) => {
    const title = normalize(getColumnTitle(columnValue));
    const id = normalize(columnValue.id);
    return wanted.some((alias) => title === alias || id === alias || title.includes(alias));
  });
}

function extractColumnText(columnValue) {
  if (!columnValue) return "";
  if (columnValue.text) return String(columnValue.text).trim();

  const parsed = safeJsonParse(columnValue.value);
  if (parsed) {
    if (typeof parsed === "string") return parsed.trim();
    if (parsed.text) return String(parsed.text).trim();
    if (parsed.label) return String(parsed.label).trim();
    if (parsed.url) return String(parsed.url).trim();
    if (parsed.phone) return String(parsed.phone).trim();
    if (parsed.name) return String(parsed.name).trim();
    if (Array.isArray(parsed)) {
      return parsed
        .map((entry) => entry?.name || entry?.label || entry?.text || entry)
        .filter(Boolean)
        .join(", ");
    }
  }

  if (columnValue.value && typeof columnValue.value === "string") {
    return columnValue.value.trim();
  }

  return "";
}

function extractDateFromColumn(columnValue) {
  if (!columnValue) return null;

  const parsed = safeJsonParse(columnValue.value);
  if (parsed?.date) {
    const stamp = parsed.time ? `${parsed.date}T${parsed.time}` : `${parsed.date}T00:00:00`;
    const parsedDate = new Date(stamp);
    if (!Number.isNaN(parsedDate.getTime())) return parsedDate;
  }

  const text = extractColumnText(columnValue);
  if (text) {
    const parsedDate = new Date(text);
    if (!Number.isNaN(parsedDate.getTime())) return parsedDate;
  }

  return null;
}

function toYesNoUnknown(value) {
  const normalized = normalize(value);
  if (/^(yes|true|new|1)/.test(normalized)) return "yes";
  if (/^(no|false|0)/.test(normalized)) return "no";
  return "unknown";
}

function getStatusTone(status) {
  const normalized = normalize(status);
  if (/completed|closed|won|converted/.test(normalized)) return "success";
  if (/new|pending|follow up|waiting/.test(normalized)) return "warning";
  if (/missed|lost|cancelled|spam/.test(normalized)) return "danger";
  return "primary";
}

function parseLead(item) {
  const clientNameValue = findColumnValue(item, COLUMN_ALIASES.clientName);
  const dateValue = findColumnValue(item, COLUMN_ALIASES.dateOfLead);
  const sourceValue = findColumnValue(item, COLUMN_ALIASES.source);
  const landingValue = findColumnValue(item, COLUMN_ALIASES.landingPage);
  const postalValue = findColumnValue(item, COLUMN_ALIASES.postalCode);
  const contactValue = findColumnValue(item, COLUMN_ALIASES.contactNumber);
  const newCallerValue = findColumnValue(item, COLUMN_ALIASES.newCaller);
  const statusValue = findColumnValue(item, COLUMN_ALIASES.status);

  const clientName = extractColumnText(clientNameValue) || "";
  const landingPage = extractColumnText(landingValue);
  const status = extractColumnText(statusValue) || item.name || "Unspecified";
  const leadDate = extractDateFromColumn(dateValue) || new Date(item.created_at);

  return {
    itemId: item.id,
    mondayItemName: item.name || "",
    clientName,
    displayName: clientName || item.name || "Unnamed lead",
    status,
    source: extractColumnText(sourceValue) || "Unknown",
    newCallerRaw: extractColumnText(newCallerValue),
    newCaller: toYesNoUnknown(extractColumnText(newCallerValue)),
    postalCode: extractColumnText(postalValue) || "-",
    contactNumber: extractColumnText(contactValue) || "-",
    landingPage: landingPage || "",
    leadDate,
    leadDateLabel: formatDateTime(leadDate),
    createdAt: item.created_at ? new Date(item.created_at) : null,
  };
}

async function mondayRequest(query, variables) {
  const response = await fetch(state.config.apiUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: state.config.apiToken,
    },
    body: JSON.stringify({ query, variables }),
  });

  const payload = await response.json();

  if (!response.ok) {
    const errorText = payload?.error_message || payload?.errors?.[0]?.message || `HTTP ${response.status}`;
    throw new Error(errorText);
  }

  if (payload.errors?.length) {
    throw new Error(payload.errors.map((entry) => entry.message).join("; "));
  }

  return payload.data;
}

async function fetchBoardData() {
  if (!state.config.apiToken) {
    throw new Error("No monday API token configured.");
  }

  const initialQuery = `
    query GetBoard($boardIds: [ID!]!, $limit: Int!) {
      boards(ids: $boardIds) {
        id
        name
        description
        columns {
          id
          title
          type
        }
        items_page(limit: $limit) {
          cursor
          items {
            id
            name
            created_at
            updated_at
            column_values {
              id
              text
              type
              value
              column {
                title
              }
            }
          }
        }
      }
    }
  `;

  const nextPageQuery = `
    query GetNextItems($cursor: String!, $limit: Int!) {
      next_items_page(cursor: $cursor, limit: $limit) {
        cursor
        items {
          id
          name
          created_at
          updated_at
          column_values {
            id
            text
            type
            value
            column {
              title
            }
          }
        }
      }
    }
  `;

  const initialData = await mondayRequest(initialQuery, {
    boardIds: [state.config.boardId],
    limit: 500,
  });

  const board = initialData.boards?.[0];
  if (!board) throw new Error(`Board ${state.config.boardId} was not returned by the API.`);

  let items = [...(board.items_page?.items || [])];
  let cursor = board.items_page?.cursor || null;

  while (cursor) {
    const page = await mondayRequest(nextPageQuery, { cursor, limit: 500 });
    const nextPage = page.next_items_page;
    items = items.concat(nextPage?.items || []);
    cursor = nextPage?.cursor || null;
  }

  return {
    id: board.id,
    name: board.name,
    description: board.description || "",
    columns: board.columns || [],
    items,
  };
}

function buildMetrics(leads) {
  const sourceCounts = {};
  const statusCounts = {};
  const timelineCounts = {};
  const recentLeads = [...leads].sort((a, b) => b.leadDate - a.leadDate).slice(0, 8);
  const now = new Date();
  const weekAgo = new Date(now);
  weekAgo.setDate(now.getDate() - 6);

  let answered = 0;
  let completed = 0;
  let newCallerYes = 0;
  let thisWeek = 0;

  leads.forEach((lead) => {
    sourceCounts[lead.source] = (sourceCounts[lead.source] || 0) + 1;
    statusCounts[lead.status] = (statusCounts[lead.status] || 0) + 1;

    const dayKey = lead.leadDate instanceof Date && !Number.isNaN(lead.leadDate.getTime())
      ? lead.leadDate.toISOString().slice(0, 10)
      : "Unknown";
    timelineCounts[dayKey] = (timelineCounts[dayKey] || 0) + 1;

    const statusNormalized = normalize(lead.status);
    if (/answered|open|contacted|working/.test(statusNormalized)) answered += 1;
    if (/completed|closed|won|converted/.test(statusNormalized)) completed += 1;
    if (lead.newCaller === "yes") newCallerYes += 1;
    if (lead.leadDate instanceof Date && !Number.isNaN(lead.leadDate.getTime()) && lead.leadDate >= weekAgo) {
      thisWeek += 1;
    }
  });

  const topSourceEntry = Object.entries(sourceCounts).sort((a, b) => b[1] - a[1])[0] || ["-", 0];

  return {
    total: leads.length,
    answered,
    completed,
    newCallerYes,
    thisWeek,
    topSource: topSourceEntry[0],
    topSourceCount: topSourceEntry[1],
    sourceCounts,
    statusCounts,
    timelineCounts,
    recentLeads,
  };
}
function animateMetric(id, targetValue, format = (value) => formatNumber(value)) {
  const element = document.getElementById(id);
  if (!element) return;

  const numericTarget = Number(targetValue);
  if (!Number.isFinite(numericTarget)) {
    element.textContent = String(targetValue);
    return;
  }

  const start = Number(element.dataset.currentValue || 0);
  const startTime = performance.now();
  const duration = 700;

  function tick(now) {
    const progress = Math.min((now - startTime) / duration, 1);
    const eased = 1 - Math.pow(1 - progress, 3);
    const value = start + (numericTarget - start) * eased;
    element.textContent = format(value);
    if (progress < 1) {
      requestAnimationFrame(tick);
    } else {
      element.dataset.currentValue = String(numericTarget);
      element.textContent = format(numericTarget);
    }
  }

  requestAnimationFrame(tick);
}

function renderMetrics() {
  const metrics = state.metrics;
  if (!metrics) return;

  animateMetric("metricTotalValue", metrics.total);
  animateMetric("metricAnsweredValue", metrics.answered);
  animateMetric("metricCompletedValue", metrics.completed);
  animateMetric("metricNewCallerValue", metrics.newCallerYes);
  animateMetric("metricWeekValue", metrics.thisWeek);

  const topSourceValue = document.getElementById("metricTopSourceValue");
  if (topSourceValue) topSourceValue.textContent = metrics.topSource;

  document.getElementById("metricTotalNote").textContent = `${formatNumber(metrics.total)} rows pulled from monday`;
  document.getElementById("metricAnsweredNote").textContent = `${formatNumber(metrics.answered)} leads in answered/open-style statuses`;
  document.getElementById("metricCompletedNote").textContent = `${formatNumber(metrics.completed)} leads in completed/closed-style statuses`;
  document.getElementById("metricNewCallerNote").textContent = `${formatNumber(metrics.newCallerYes)} rows marked as new callers`;
  document.getElementById("metricTopSourceNote").textContent = `${formatNumber(metrics.topSourceCount)} leads from the top source`;
  document.getElementById("metricWeekNote").textContent = `${formatNumber(metrics.thisWeek)} leads dated within the last 7 days`;
}

function destroyCharts() {
  Object.values(state.charts).forEach((chart) => chart?.destroy?.());
  state.charts = {};
}

function chartOptions(options) {
  return {
    ...options,
    color: cssVar("--text-muted"),
    plugins: {
      tooltip: {
        backgroundColor: cssVar("--panel-strong"),
        titleColor: cssVar("--text"),
        bodyColor: cssVar("--text-muted"),
        borderColor: cssVar("--panel-border"),
        borderWidth: 1,
        padding: 12,
      },
      ...(options.plugins || {}),
    },
  };
}

function axisOptions(extra = {}) {
  return {
    grid: {
      color: cssVar("--panel-border"),
    },
    ticks: {
      color: cssVar("--text-muted"),
      font: {
        family: "Manrope",
        size: 11,
      },
      ...(extra.ticks || {}),
    },
    border: {
      display: false,
    },
    ...extra,
  };
}

function buildTimelineChart() {
  const ctx = document.getElementById("leadsTimelineChart");
  if (!ctx) return;

  const entries = Object.entries(state.metrics.timelineCounts)
    .filter(([key]) => key !== "Unknown")
    .sort((a, b) => a[0].localeCompare(b[0]));

  const labels = entries.length
    ? entries.map(([date]) =>
        new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric" }).format(new Date(date)),
      )
    : ["No dated leads"];
  const values = entries.length ? entries.map(([, count]) => count) : [0];

  state.charts.timeline = new Chart(ctx, {
    type: "line",
    data: {
      labels,
      datasets: [
        {
          label: "Leads",
          data: values,
          borderColor: cssVar("--primary"),
          backgroundColor: "rgba(11, 111, 97, 0.12)",
          fill: true,
          tension: 0.28,
          borderWidth: 3,
          pointRadius: 3,
          pointHoverRadius: 5,
        },
      ],
    },
    options: chartOptions({
      responsive: true,
      maintainAspectRatio: false,
      scales: {
        x: axisOptions(),
        y: axisOptions({ beginAtZero: true, ticks: { precision: 0 } }),
      },
      plugins: {
        legend: { display: false },
      },
    }),
  });
}

function buildSourceChart() {
  const ctx = document.getElementById("sourceChart");
  const legend = document.getElementById("sourceLegend");
  if (!ctx || !legend) return;

  const sourceEntries = Object.entries(state.metrics.sourceCounts).sort((a, b) => b[1] - a[1]);
  const labels = sourceEntries.length ? sourceEntries.map(([label]) => label) : ["No source data"];
  const values = sourceEntries.length ? sourceEntries.map(([, value]) => value) : [1];
  const palette = [cssVar("--primary"), "#3279a8", "#d18827", "#7d5ce6", "#d46b82", "#556d63"];

  state.charts.source = new Chart(ctx, {
    type: "doughnut",
    data: {
      labels,
      datasets: [
        {
          data: values,
          backgroundColor: labels.map((_, index) => palette[index % palette.length]),
          borderWidth: 0,
        },
      ],
    },
    options: chartOptions({
      responsive: true,
      maintainAspectRatio: false,
      cutout: "68%",
      plugins: {
        legend: { display: false },
      },
    }),
  });

  const total = values.reduce((sum, current) => sum + current, 0) || 1;
  legend.innerHTML = sourceEntries.length
    ? sourceEntries
        .map(([label, count], index) => {
          const percent = ((count / total) * 100).toFixed(1);
          return `
            <div class="legend-row">
              <div class="legend-label">
                <span class="legend-dot" style="background:${palette[index % palette.length]}"></span>
                <span>${escapeHtml(label)}</span>
              </div>
              <strong>${escapeHtml(percent)}%</strong>
            </div>
          `;
        })
        .join("")
    : '<div class="empty-state">No lead source values were detected on the board.</div>';
}

function buildStatusChart() {
  const ctx = document.getElementById("statusChart");
  if (!ctx) return;

  const statusEntries = Object.entries(state.metrics.statusCounts).sort((a, b) => b[1] - a[1]).slice(0, 8);
  const labels = statusEntries.length ? statusEntries.map(([label]) => label) : ["No status data"];
  const values = statusEntries.length ? statusEntries.map(([, value]) => value) : [0];

  state.charts.status = new Chart(ctx, {
    type: "bar",
    data: {
      labels,
      datasets: [
        {
          data: values,
          backgroundColor: labels.map((label) => {
            const tone = getStatusTone(label);
            if (tone === "success") return cssVar("--success");
            if (tone === "warning") return cssVar("--warning");
            if (tone === "danger") return cssVar("--danger");
            return cssVar("--primary");
          }),
          borderRadius: 12,
          borderSkipped: false,
        },
      ],
    },
    options: chartOptions({
      responsive: true,
      maintainAspectRatio: false,
      scales: {
        x: axisOptions(),
        y: axisOptions({ beginAtZero: true, ticks: { precision: 0 } }),
      },
      plugins: {
        legend: { display: false },
      },
    }),
  });
}

function renderSummaryLists() {
  const sourceRoot = document.getElementById("sourceBreakdownList");
  const recentRoot = document.getElementById("recentLeadsList");
  if (!sourceRoot || !recentRoot) return;

  const sourceEntries = Object.entries(state.metrics.sourceCounts).sort((a, b) => b[1] - a[1]);
  const sourceTotal = sourceEntries.reduce((sum, [, count]) => sum + count, 0) || 1;

  sourceRoot.innerHTML = sourceEntries.length
    ? sourceEntries
        .map(([source, count]) => {
          const percent = ((count / sourceTotal) * 100).toFixed(1);
          return `
            <div class="stack-item">
              <div class="stack-copy">
                <p class="stack-title">${escapeHtml(source)}</p>
                <p class="stack-meta">${escapeHtml(percent)}% of loaded leads</p>
              </div>
              <span class="pill pill-primary">${escapeHtml(formatNumber(count))}</span>
            </div>
          `;
        })
        .join("")
    : '<div class="empty-state">No source values found.</div>';

  recentRoot.innerHTML = state.metrics.recentLeads.length
    ? state.metrics.recentLeads
        .map((lead) => `
          <div class="stack-item">
            <div class="stack-copy">
              <p class="stack-title">${escapeHtml(lead.displayName)}</p>
              <p class="stack-meta">${escapeHtml(lead.status)} | ${escapeHtml(lead.source)}</p>
            </div>
            <span class="pill pill-warning">${escapeHtml(formatDate(lead.leadDate))}</span>
          </div>
        `)
        .join("")
    : '<div class="empty-state">No recent leads available.</div>';
}

function renderBoardMeta() {
  const boardName = state.board?.name || "PHL Consolidated Leads";
  const rowCount = state.leads.length;

  document.getElementById("boardNameSidebar").textContent = boardName;
  document.getElementById("sidebarBoardMeta").textContent = `${formatNumber(rowCount)} loaded row${rowCount === 1 ? "" : "s"}`;
  document.getElementById("boardIdLabel").textContent = state.config.boardId;
  document.getElementById("rowCountLabel").textContent = formatNumber(rowCount);
  document.getElementById("boardLink").href = state.config.boardUrl;
}

function populateFilterOptions() {
  const sourceFilter = document.getElementById("sourceFilter");
  const statusFilter = document.getElementById("statusFilter");
  if (!sourceFilter || !statusFilter) return;

  const sourceOptions = Object.keys(state.metrics.sourceCounts).sort();
  const statusOptions = Object.keys(state.metrics.statusCounts).sort();

  sourceFilter.innerHTML = ['<option value="all">All sources</option>']
    .concat(sourceOptions.map((value) => `<option value="${escapeHtml(value)}">${escapeHtml(value)}</option>`))
    .join("");

  statusFilter.innerHTML = ['<option value="all">All statuses</option>']
    .concat(statusOptions.map((value) => `<option value="${escapeHtml(value)}">${escapeHtml(value)}</option>`))
    .join("");
}

function renderSourceSegments() {
  const root = document.getElementById("sourceSegmentButtons");
  const sourceFilter = document.getElementById("sourceFilter");
  if (!root || !sourceFilter || !state.metrics) return;

  const selected = sourceFilter.value || "all";
  const entries = Object.entries(state.metrics.sourceCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10);

  const pills = [
    { label: "All sources", value: "all", count: state.leads.length },
    ...entries.map(([label, count]) => ({ label, value: label, count })),
  ];

  root.innerHTML = pills
    .map(
      (pill) => `
        <button
          type="button"
          class="segment-pill ${selected === pill.value ? "active" : ""}"
          data-source-segment="${escapeHtml(pill.value)}"
        >
          <span>${escapeHtml(pill.label)}</span>
          <span class="segment-pill-count">${escapeHtml(formatNumber(pill.count))}</span>
        </button>
      `,
    )
    .join("");

  root.querySelectorAll("[data-source-segment]").forEach((button) => {
    button.addEventListener("click", () => {
      sourceFilter.value = button.getAttribute("data-source-segment") || "all";
      applyFilters();
    });
  });
}

function applyFilters() {
  const search = normalize(document.getElementById("searchInput")?.value || "");
  const zipFilter = normalize(document.getElementById("zipFilter")?.value || "");
  const source = document.getElementById("sourceFilter")?.value || "all";
  const status = document.getElementById("statusFilter")?.value || "all";
  const newCaller = document.getElementById("newCallerFilter")?.value || "all";
  const sort = document.getElementById("sortFilter")?.value || "date-desc";

  let results = state.leads.filter((lead) => {
    const matchesSearch =
      !search ||
      normalize(`${lead.displayName} ${lead.clientName} ${lead.mondayItemName}`).includes(search);
    const matchesZip = !zipFilter || normalize(lead.postalCode).includes(zipFilter);

    const matchesSource = source === "all" || lead.source === source;
    const matchesStatus = status === "all" || lead.status === status;
    const matchesCaller = newCaller === "all" || lead.newCaller === newCaller;

    return matchesSearch && matchesZip && matchesSource && matchesStatus && matchesCaller;
  });

  results.sort((left, right) => {
    if (sort === "date-asc") return left.leadDate - right.leadDate;
    if (sort === "client-asc") return compareText(left.displayName, right.displayName);
    if (sort === "client-desc") return compareText(right.displayName, left.displayName);
    if (sort === "source-asc") return compareText(left.source, right.source);
    if (sort === "landing-asc") return compareText(left.landingPage || "~", right.landingPage || "~");
    if (sort === "landing-desc") return compareText(right.landingPage || "", left.landingPage || "");
    if (sort === "zip-asc") return zipSortValue(left.postalCode) - zipSortValue(right.postalCode);
    if (sort === "zip-desc") return zipSortValue(right.postalCode) - zipSortValue(left.postalCode);
    if (sort === "status-asc") return compareText(left.status, right.status);
    return right.leadDate - left.leadDate;
  });

  state.filteredLeads = results;
  renderSourceSegments();
  renderTable();
}

function renderTable() {
  const tbody = document.getElementById("leadsTableBody");
  const summary = document.getElementById("resultsSummary");
  if (!tbody || !summary) return;

  summary.textContent = `${formatNumber(state.filteredLeads.length)} lead${state.filteredLeads.length === 1 ? "" : "s"} shown`;

  if (!state.filteredLeads.length) {
    tbody.innerHTML = `
      <tr>
        <td colspan="8">
          <div class="empty-state">No leads match the current filters.</div>
        </td>
      </tr>
    `;
    return;
  }

  tbody.innerHTML = state.filteredLeads
    .map((lead) => {
      const statusTone = getStatusTone(lead.status);
      const statusClass =
        statusTone === "success"
          ? "status-badge-success"
          : statusTone === "warning"
            ? "status-badge-warning"
            : statusTone === "danger"
              ? "status-badge-danger"
              : "";
      const callerClass =
        lead.newCaller === "yes"
          ? "caller-badge-yes"
          : lead.newCaller === "no"
            ? "caller-badge-no"
            : "caller-badge-unknown";

      const landingContent = lead.landingPage
        ? `<a class="table-link" href="${escapeHtml(lead.landingPage)}" target="_blank" rel="noreferrer">${escapeHtml(lead.landingPage)}</a>`
        : '<span class="table-secondary">-</span>';

      return `
        <tr>
          <td><span class="status-badge ${statusClass}">${escapeHtml(lead.status)}</span></td>
          <td>
            <div class="table-primary">
              <strong>${escapeHtml(lead.displayName)}</strong>
              <span class="table-secondary table-mono">Item ${escapeHtml(lead.itemId)}</span>
            </div>
          </td>
          <td>${escapeHtml(lead.leadDateLabel)}</td>
          <td>${escapeHtml(lead.source)}</td>
          <td><span class="caller-badge ${callerClass}">${escapeHtml(lead.newCallerRaw || lead.newCaller)}</span></td>
          <td class="table-mono">${escapeHtml(lead.postalCode)}</td>
          <td class="table-mono">${escapeHtml(lead.contactNumber)}</td>
          <td>${landingContent}</td>
        </tr>
      `;
    })
    .join("");
}

function renderColumnMap() {
  const root = document.getElementById("columnMap");
  if (!root) return;

  const columns = state.board?.columns || [];
  if (!columns.length) {
    root.innerHTML = '<div class="empty-state">No columns loaded yet.</div>';
    return;
  }

  root.innerHTML = columns
    .map(
      (column) => `
        <div class="column-pill">
          <p class="column-title">${escapeHtml(column.title)}</p>
          <p class="column-type">${escapeHtml(column.id)} | ${escapeHtml(column.type)}</p>
        </div>
      `,
    )
    .join("");
}

function renderSettingsForm() {
  const boardInput = document.getElementById("boardIdInput");
  const tokenInput = document.getElementById("apiTokenInput");
  if (boardInput) boardInput.value = state.config.boardId;
  if (tokenInput) tokenInput.value = state.config.apiToken;
}

function downloadCsv() {
  if (!state.filteredLeads.length) {
    logEvent("Export skipped because there are no filtered leads to export.", "warning");
    return;
  }

  const rows = [
    ["Status", "Client Name", "Date of Lead", "Source", "New Caller", "Postal Code", "Contact Number", "Landing Page URL"],
    ...state.filteredLeads.map((lead) => [
      lead.status,
      lead.displayName,
      lead.leadDateLabel,
      lead.source,
      lead.newCallerRaw || lead.newCaller,
      lead.postalCode,
      lead.contactNumber,
      lead.landingPage,
    ]),
  ];

  const csv = rows
    .map((row) => row.map((value) => `"${String(value ?? "").replace(/"/g, '""')}"`).join(","))
    .join("\n");

  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `phl-consolidated-leads-${new Date().toISOString().slice(0, 10)}.csv`;
  link.click();
  URL.revokeObjectURL(url);
  logEvent(`Exported ${state.filteredLeads.length} filtered leads to CSV.`, "success");
}

function renderDashboard() {
  renderBoardMeta();
  renderMetrics();
  populateFilterOptions();
  applyFilters();
  renderSummaryLists();
  renderColumnMap();
  destroyCharts();
  buildTimelineChart();
  buildSourceChart();
  buildStatusChart();
}

async function loadDashboard() {
  try {
    setSyncState("loading", `Connecting to monday board ${state.config.boardId}...`);
    logEvent(`Fetching monday board ${state.config.boardId}.`, "info");

    state.board = await fetchBoardData();
    state.leads = (state.board.items || []).map(parseLead);
    state.metrics = buildMetrics(state.leads);

    renderDashboard();
    renderSettingsForm();

    const syncTime = new Date();
    document.getElementById("lastUpdatedLabel").textContent = formatDateTime(syncTime);
    setSyncState("success", `Loaded ${formatNumber(state.leads.length)} leads from "${state.board.name}".`);
    logEvent(`Loaded ${state.leads.length} board rows from ${state.board.name}.`, "success");
  } catch (error) {
    setSyncState("error", error.message);
    logEvent(error.message, "error");
  }
}
function bindEvents() {
  document.querySelector("[data-theme-toggle]")?.addEventListener("click", () => {
    const root = document.documentElement;
    const nextTheme = root.getAttribute("data-theme") === "dark" ? "light" : "dark";
    root.setAttribute("data-theme", nextTheme);
    updateThemeButton();
    if (state.metrics) {
      destroyCharts();
      buildTimelineChart();
      buildSourceChart();
      buildStatusChart();
    }
  });

  document.getElementById("refreshBtn")?.addEventListener("click", () => {
    loadDashboard();
  });

  document.getElementById("exportBtn")?.addEventListener("click", downloadCsv);
  document.getElementById("searchInput")?.addEventListener("input", applyFilters);
  document.getElementById("zipFilter")?.addEventListener("input", applyFilters);
  document.getElementById("sourceFilter")?.addEventListener("change", applyFilters);
  document.getElementById("statusFilter")?.addEventListener("change", applyFilters);
  document.getElementById("newCallerFilter")?.addEventListener("change", applyFilters);
  document.getElementById("sortFilter")?.addEventListener("change", applyFilters);

  document.getElementById("resetFiltersBtn")?.addEventListener("click", () => {
    document.getElementById("searchInput").value = "";
    document.getElementById("zipFilter").value = "";
    document.getElementById("sourceFilter").value = "all";
    document.getElementById("statusFilter").value = "all";
    document.getElementById("newCallerFilter").value = "all";
    document.getElementById("sortFilter").value = "date-desc";
    applyFilters();
  });

  document.getElementById("saveConfigBtn")?.addEventListener("click", () => {
    const boardId = document.getElementById("boardIdInput")?.value.trim();
    const apiToken = document.getElementById("apiTokenInput")?.value.trim();

    if (!boardId || !apiToken) {
      logEvent("Board ID and API token are both required before saving a local override.", "warning");
      return;
    }

    state.config = {
      ...state.config,
      boardId,
      boardUrl: `https://rptclinic.monday.com/boards/${boardId}`,
      apiToken,
    };
    saveConfig(state.config);
    renderSettingsForm();
    logEvent(`Saved local override for board ${boardId}.`, "success");
    loadDashboard();
  });

  document.getElementById("clearConfigBtn")?.addEventListener("click", () => {
    clearConfig();
    renderSettingsForm();
    logEvent("Cleared local config override and restored defaults from code.", "warning");
    loadDashboard();
  });

  const sidebar = document.getElementById("sidebar");
  const overlay = document.getElementById("overlay");

  document.getElementById("mobileMenuBtn")?.addEventListener("click", () => {
    sidebar?.classList.add("mobile-open");
    overlay?.classList.add("active");
  });

  overlay?.addEventListener("click", () => {
    sidebar?.classList.remove("mobile-open");
    overlay?.classList.remove("active");
  });

  document.querySelectorAll(".nav-link").forEach((link) => {
    link.addEventListener("click", (event) => {
      event.preventDefault();
      const targetId = link.getAttribute("href")?.replace("#", "");
      const target = targetId ? document.getElementById(targetId) : null;
      target?.scrollIntoView({ behavior: "smooth", block: "start" });
      sidebar?.classList.remove("mobile-open");
      overlay?.classList.remove("active");
    });
  });

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        const sectionId = entry.target.id;
        document.querySelectorAll(".nav-link").forEach((link) => {
          link.classList.toggle("active", link.dataset.section === sectionId);
        });
      });
    },
    { rootMargin: "-35% 0px -45% 0px", threshold: 0 },
  );

  ["overview", "analysis", "table", "settings"].forEach((id) => {
    const node = document.getElementById(id);
    if (node) observer.observe(node);
  });
}

function init() {
  updateThemeButton();
  renderSettingsForm();
  renderLogs();
  bindEvents();
  if (window.lucide) window.lucide.createIcons();
  loadDashboard();
}

init();

