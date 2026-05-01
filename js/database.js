/**
 * HeatCheck - Nigerian Basketball Player Database Logic
 */

let playersData = [];
let rosterGapsData = [];
let filteredPlayers = [];

// DOM Elements
const playersGrid = document.getElementById('playersGrid');
const playersTableWrapper = document.getElementById('playersTableWrapper');
const playersTableBody = document.getElementById('playersTableBody');
const resultsCount = document.getElementById('resultsCount');
const filterTeam = document.getElementById('filterTeam');
const filterPos = document.getElementById('filterPos');
const filterConfidence = document.getElementById('filterConfidence');
const searchName = document.getElementById('searchName');
const btnResetFilters = document.getElementById('btnResetFilters');
const btnViewCard = document.getElementById('btnViewCard');
const btnViewTable = document.getElementById('btnViewTable');

// Drawer DOM
const profileDrawer = document.getElementById('profileDrawer');
const pdOverlay = document.getElementById('pdOverlay');
const pdClose = document.getElementById('pdClose');

// Stats DOM
const dbStatsContainer = document.getElementById('dbStatsContainer');
const gapsContainer = document.getElementById('gapsContainer');

let currentView = 'card'; // 'card' or 'table'

// Initialize
function initDatabase() {
  try {
    // Read from the globally loaded js/data.js instead of fetching to prevent CORS issues on local files
    playersData = playersDataRaw || [];
    rosterGapsData = rosterGapsDataRaw || [];
    
    // Clean data (some objects might have nulls or be empty rows)
    playersData = playersData.filter(p => p['Player Name'] && p['Player Name'].trim() !== '');
    rosterGapsData = rosterGapsData.filter(g => g['Team Name'] && g['Team Name'].trim() !== '');
    
    filteredPlayers = [...playersData];
    
    populateFilters();
    renderStats();
    renderGaps();
    renderPlayers();
    setupEventListeners();
  } catch (error) {
    console.error("Error loading database:", error);
    resultsCount.innerHTML = `<span style="color:red">Error loading database. Ensure data.js exists.</span>`;
  }
}

function setupEventListeners() {
  // Filters
  searchName.addEventListener('input', applyFilters);
  filterTeam.addEventListener('change', applyFilters);
  filterPos.addEventListener('change', applyFilters);
  filterConfidence.addEventListener('change', applyFilters);
  
  btnResetFilters.addEventListener('click', () => {
    searchName.value = '';
    filterTeam.value = '';
    filterPos.value = '';
    filterConfidence.value = '';
    applyFilters();
  });

  // Views
  btnViewCard.addEventListener('click', () => {
    currentView = 'card';
    btnViewCard.classList.add('active');
    btnViewTable.classList.remove('active');
    playersGrid.style.display = 'grid';
    playersTableWrapper.style.display = 'none';
  });
  
  btnViewTable.addEventListener('click', () => {
    currentView = 'table';
    btnViewTable.classList.add('active');
    btnViewCard.classList.remove('active');
    playersGrid.style.display = 'none';
    playersTableWrapper.style.display = 'block';
  });

  // Drawer
  pdClose.addEventListener('click', closeDrawer);
  pdOverlay.addEventListener('click', closeDrawer);
}

function populateFilters() {
  // Extract unique teams
  const teams = new Set();
  playersData.forEach(p => {
    if (p.Team && p.Team.trim() !== '') teams.add(p.Team.trim());
  });
  
  const sortedTeams = Array.from(teams).sort();
  sortedTeams.forEach(team => {
    const opt = document.createElement('option');
    opt.value = team;
    opt.textContent = team;
    filterTeam.appendChild(opt);
  });
}

function applyFilters() {
  const qName = searchName.value.toLowerCase();
  const qTeam = filterTeam.value;
  const qPos = filterPos.value;
  const qConf = filterConfidence.value;

  filteredPlayers = playersData.filter(p => {
    const matchName = !qName || p['Player Name'].toLowerCase().includes(qName) || (p['Alt/Spelling'] && p['Alt/Spelling'].toLowerCase().includes(qName));
    const matchTeam = !qTeam || p.Team === qTeam;
    // Simple position match (could be exact or inclusive)
    const matchPos = !qPos || (p.Position && p.Position.includes(qPos));
    const matchConf = !qConf || p.Confidence === qConf;

    return matchName && matchTeam && matchPos && matchConf;
  });

  renderPlayers();
}

function renderStats() {
  const total = playersData.length;
  const highConf = playersData.filter(p => p.Confidence === 'High').length;
  const needVerif = playersData.filter(p => p.Confidence === 'Low' || !p.Confidence).length;
  const bplTeamsCount = new Set(playersData.map(p => p.Team).filter(Boolean)).size;

  dbStatsContainer.innerHTML = `
    <div class="db-stat-card">
      <div class="db-stat-val">${total}</div>
      <div class="db-stat-label">Total Players</div>
    </div>
    <div class="db-stat-card">
      <div class="db-stat-val">${bplTeamsCount}</div>
      <div class="db-stat-label">Teams Tracked</div>
    </div>
    <div class="db-stat-card">
      <div class="db-stat-val" style="color: #10b981;">${highConf}</div>
      <div class="db-stat-label">High Confidence</div>
    </div>
    <div class="db-stat-card">
      <div class="db-stat-val" style="color: #ef4444;">${needVerif}</div>
      <div class="db-stat-label">Needs Verification</div>
    </div>
  `;
}

function renderGaps() {
  if (!rosterGapsData.length) {
    gapsContainer.innerHTML = '<p style="color:var(--db-text-muted)">No gap data available.</p>';
    return;
  }

  let html = '';
  rosterGapsData.forEach(gap => {
    // Expected keys: Team Name, Confirmed Players, Target Roster Size, Gap
    const team = gap['Team Name'];
    const confirmed = parseInt(gap['Confirmed Players']) || 0;
    const target = parseInt(gap['Target Roster Size']) || 15;
    const pct = Math.min(100, Math.round((confirmed / target) * 100));
    
    html += `
      <div class="gap-item">
        <div class="gap-header">
          <span class="gap-team">${team}</span>
          <span class="gap-val">${confirmed} / ${target} filled</span>
        </div>
        <div class="gap-bar">
          <div class="gap-fill" style="width: ${pct}%; ${pct < 50 ? 'background: #ef4444;' : pct < 80 ? 'background: #f59e0b;' : ''}"></div>
        </div>
      </div>
    `;
  });
  gapsContainer.innerHTML = html;
}

function renderPlayers() {
  resultsCount.textContent = `Showing ${filteredPlayers.length} records`;
  
  if (filteredPlayers.length === 0) {
    playersGrid.innerHTML = `<div class="empty-state">No players match your filters.</div>`;
    playersTableBody.innerHTML = `<tr><td colspan="6" style="text-align:center; padding: 2rem;">No players found.</td></tr>`;
    return;
  }

  let gridHtml = '';
  let tableHtml = '';

  filteredPlayers.forEach((p, index) => {
    const name = p['Player Name'] || 'Unknown';
    const initial = name.charAt(0);
    const team = p.Team || 'Not verified';
    const pos = p.Position || '-';
    const height = p.Height || 'N/A';
    const age = p['DOB/Age'] || 'N/A';
    const conf = p.Confidence || 'Unfilled';
    
    let confClass = 'tag-conf-low';
    if(conf === 'High') confClass = 'tag-conf-high';
    else if(conf === 'Medium') confClass = 'tag-conf-medium';

    // Cards
    gridHtml += `
      <div class="player-card" onclick="openDrawer(${index})">
        <div class="pc-header">
          <div class="pc-avatar">${initial}</div>
          <div class="pc-info">
            <div class="pc-name">${name}</div>
            <div class="pc-team">${team}</div>
          </div>
        </div>
        <div class="pc-meta">
          <div class="pc-meta-item">
            <div class="pc-meta-lbl">Position</div>
            <div class="pc-meta-val">${pos}</div>
          </div>
          <div class="pc-meta-item">
            <div class="pc-meta-lbl">Height</div>
            <div class="pc-meta-val">${height}</div>
          </div>
        </div>
        <div class="pc-tags">
          <span class="tag ${confClass}">${conf} Confidence</span>
          ${p['Season/Context'] ? `<span class="tag tag-comp">${p['Season/Context']}</span>` : ''}
        </div>
      </div>
    `;

    // Table
    tableHtml += `
      <tr onclick="openDrawer(${index})">
        <td style="font-weight:600; color:white;">${name}</td>
        <td>${team}</td>
        <td>${pos}</td>
        <td>${height}</td>
        <td>${age}</td>
        <td><span class="tag ${confClass}">${conf}</span></td>
      </tr>
    `;
  });

  playersGrid.innerHTML = gridHtml;
  playersTableBody.innerHTML = tableHtml;
}

function openDrawer(filteredIndex) {
  const p = filteredPlayers[filteredIndex];
  if(!p) return;

  const name = p['Player Name'] || 'Unknown';
  
  document.getElementById('pdName').textContent = name;
  document.getElementById('pdAvatar').textContent = name.charAt(0);
  document.getElementById('pdTeam').textContent = p.Team || 'Team: Not verified';
  document.getElementById('pdContext').textContent = p['Season/Context'] || 'No competition context available';
  
  document.getElementById('pdPos').textContent = p.Position || 'Not verified';
  document.getElementById('pdHeight').textContent = p.Height || 'Not verified';
  document.getElementById('pdAge').textContent = p['DOB/Age'] || 'Not verified';
  document.getElementById('pdNation').textContent = p.Nationality || 'Not verified';
  
  document.getElementById('pdConf').textContent = p.Confidence || 'Unfilled';
  document.getElementById('pdStatus').textContent = p.Status || 'Active record';
  
  const notes = p.Notes || 'No scouting notes added yet.';
  document.getElementById('pdNotes').textContent = notes;
  document.getElementById('pdAction').textContent = p['Next Action'] || 'No pending action.';

  // Generate About text
  let aboutTxt = `${name} is a Nigerian basketball player`;
  if(p.Team) aboutTxt += ` listed with ${p.Team}`;
  if(p['Season/Context']) aboutTxt += ` in ${p['Season/Context']}.`;
  else aboutTxt += '.';
  
  aboutTxt += ` Available records show his position as ${p.Position || 'unverified'}`;
  if(p.Height) aboutTxt += `, and height as ${p.Height}.`;
  else aboutTxt += `.`;
  
  aboutTxt += ` This profile is part of the HeatCheck Nigerian Basketball Player Database and is updated as more verified data becomes available.`;
  document.getElementById('pdAbout').textContent = aboutTxt;

  // Source Links
  const sourcesContainer = document.getElementById('pdSourceContainer');
  let sourceHtml = '';
  if (p['Source URL(s)']) {
    // naive split if multiple urls are separated by comma or space
    const urls = p['Source URL(s)'].toString().split(/[\s,]+/);
    urls.forEach((url, i) => {
      if(url.startsWith('http')) {
        sourceHtml += `<a href="${url}" target="_blank" rel="noopener" style="display:inline-block; margin-right: 0.5rem; margin-bottom:0.5rem; background:rgba(255,255,255,0.05); color:var(--db-accent-cyan); padding:0.5rem 1rem; border-radius:4px; text-decoration:none; font-size:0.85rem; border:1px solid rgba(255,255,255,0.1);">Verified Source Link ${i+1} ↗</a>`;
      }
    });
  }
  
  if(!sourceHtml) {
    sourceHtml = `<p style="font-size: 0.85rem; color: var(--db-text-muted);">No direct source URL available.</p>`;
  }
  sourcesContainer.innerHTML = sourceHtml;

  pdOverlay.classList.add('active');
  profileDrawer.classList.add('active');
  document.body.style.overflow = 'hidden'; // Prevent background scroll
}

function closeDrawer() {
  pdOverlay.classList.remove('active');
  profileDrawer.classList.remove('active');
  document.body.style.overflow = '';
}

// Start
document.addEventListener('DOMContentLoaded', initDatabase);
