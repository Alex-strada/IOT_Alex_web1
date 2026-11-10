'use strict';

(() => {
  const ZONES = ['A', 'B', 'C', 'D', 'E'];
  const SPACES_PER_ZONE = 20;
  const spaces = ZONES.flatMap(zone => Array.from({ length: SPACES_PER_ZONE }, (_, i) => ({
    id: `${zone}${String(i + 1).padStart(2, '0')}`, zone, occupied: Math.random() < 0.62
  })));
  const byId = new Map(spaces.map(space => [space.id, space]));
  const buttons = new Map();
  const zoneElements = new Map();
  const $ = id => document.getElementById(id);
  let selectedId = 'A01';
  let filter = 'all';
  let running = true;
  let interval = 5000;
  let timer = null;
  const events = [];
  const timeFormatter = new Intl.DateTimeFormat('en', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false });
  const icon = name => `<svg aria-hidden="true"><use href="#i-${name}"/></svg>`;

  // A schematic of the parallel, double-sided bays in the provided campus image.
  // The 100-space capacity is a simulation model, not a count of real campus spaces.
  for (const zone of ZONES) {
    const section = document.createElement('section');
    section.className = 'parking-zone';
    section.setAttribute('aria-label', `Zone ${zone}, 20 parking spaces`);
    const label = document.createElement('span');
    label.className = 'zone-name';
    label.textContent = `ZONE ${zone}`;
    const grid = document.createElement('div');
    grid.className = 'zone-spaces';
    for (const space of spaces.filter(s => s.zone === zone)) {
      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'space';
      button.dataset.space = space.id;
      button.addEventListener('click', () => {
        selectedId = space.id;
        changeSpace(space, 'Manual click');
        markUpdated();
        updateDashboard();
        announce(`${space.id} is now ${space.occupied ? 'occupied' : 'available'}.`);
      });
      grid.append(button);
      buttons.set(space.id, button);
    }
    section.append(label, grid);
    $('parking-zones').append(section);
    const summary = document.createElement('div');
    summary.className = 'zone-stat';
    summary.innerHTML = `<strong>Zone ${zone}</strong><div class="zone-values"><b></b><span>available</span></div><div class="zone-bar"><span></span></div><small></small>`;
    $('zone-summary').append(summary);
    zoneElements.set(zone, summary);
  }

  function announce(message) { $('announcement').textContent = message; }

  function changeSpace(space, source) {
    space.occupied = !space.occupied;
    events.unshift({ id: space.id, occupied: space.occupied, source, time: new Date() });
    events.splice(3);
    const button = buttons.get(space.id);
    button.classList.remove('sensor-change');
    // Restart the short feedback animation even when the same sensor changes twice.
    void button.offsetWidth;
    button.classList.add('sensor-change');
  }

  function updateDashboard() {
    const occupied = spaces.filter(s => s.occupied).length;
    const available = spaces.length - occupied;
    const percentage = Math.round(occupied / spaces.length * 100);
    $('total-count').textContent = spaces.length;
    $('occupied-count').textContent = occupied;
    $('available-count').textContent = available;
    $('occupancy-count').textContent = percentage;
    $('occupancy-fill').style.width = `${percentage}%`;
    $('occupancy-bar').setAttribute('aria-valuenow', String(percentage));
    $('capacity-note').textContent = available === 0 ? 'Parking lot is full' : `${available}% of the lot is available`;
    let matching = 0;
    for (const space of spaces) {
      const button = buttons.get(space.id);
      const isMatch = filter === 'all' || (filter === 'occupied' ? space.occupied : !space.occupied);
      if (isMatch) matching++;
      const state = space.occupied ? 'Occupied' : 'Available';
      button.dataset.occupied = String(space.occupied);
      button.classList.toggle('is-selected', space.id === selectedId);
      button.classList.toggle('is-filtered', !isMatch);
      // Filtering preserves the map geometry; nonmatching spaces remain operable.
      button.setAttribute('aria-label', `${space.id}, ${state}. Click to ${space.occupied ? 'free' : 'occupy'} this space.`);
      button.setAttribute('aria-pressed', String(space.occupied));
      button.title = `${space.id} · ${state} · Click to change`;
      const markup = `${space.occupied ? icon('car') : '<span class="parking-p" aria-hidden="true">P</span>'}<span class="space-label">${space.id}</span>`;
      if (button.innerHTML !== markup) button.innerHTML = markup;
    }
    $('filter-result').textContent = filter === 'all' ? `Showing all ${spaces.length} parking spaces. Scroll the map on small screens.` : `Highlighting ${matching} ${filter} spaces. Dimmed spaces remain clickable.`;
    for (const zone of ZONES) {
      const free = spaces.filter(s => s.zone === zone && !s.occupied).length;
      const element = zoneElements.get(zone);
      element.querySelector('b').textContent = free;
      element.querySelector('.zone-bar span').style.width = `${free / SPACES_PER_ZONE * 100}%`;
      element.querySelector('small').textContent = `${SPACES_PER_ZONE - free} occupied / ${SPACES_PER_ZONE}`;
    }
    const selected = byId.get(selectedId);
    $('selected-id').textContent = selected.id;
    $('selected-status').textContent = selected.occupied ? 'Occupied' : 'Available';
    $('selected-zone').textContent = `Zone ${selected.zone} · Virtual sensor`;
    $('selected-reading').textContent = selected.occupied ? '1 · Vehicle detected' : '0 · No vehicle';
    $('selected-icon').classList.toggle('occupied', selected.occupied);
    $('selected-icon').innerHTML = icon(selected.occupied ? 'car' : 'check');
    $('toggle-space').textContent = selected.occupied ? 'Mark as available' : 'Mark as occupied';
    renderActivity();
  }

  function renderActivity() {
    const list = $('activity-list');
    list.replaceChildren();
    if (!events.length) {
      const li = document.createElement('li');
      li.innerHTML = `<span class="event-dot">${icon('activity')}</span><span class="event-description"><strong>100 virtual sensors initialized</strong><br>Waiting for the next vehicle movement</span><span class="event-time">Ready</span>`;
      list.append(li);
      return;
    }
    for (const event of events) {
      const li = document.createElement('li');
      if (event.reset) {
        li.innerHTML = `<span class="event-dot">${icon('refresh')}</span><span class="event-description"><strong>All 100 sensors randomized</strong><br>New simulated parking snapshot</span><time class="event-time" datetime="${event.time.toISOString()}">${timeFormatter.format(event.time)}</time>`;
        list.append(li);
        continue;
      }
      li.innerHTML = `<span class="event-dot ${event.occupied ? 'arrival' : ''}">${icon(event.occupied ? 'car' : 'check')}</span><span class="event-description"><strong>${event.id} · ${event.occupied ? 'Vehicle arrived' : 'Space available'}</strong><br>${event.source}</span><time class="event-time" datetime="${event.time.toISOString()}">${timeFormatter.format(event.time)}</time>`;
      list.append(li);
    }
  }

  function markUpdated() {
    $('last-updated').textContent = `Updated ${timeFormatter.format(new Date())}`;
  }

  // Simulate one to three distinct virtual sensors reporting changed vehicle presence.
  function sensorTick() {
    const remaining = [...spaces];
    const count = 1 + Math.floor(Math.random() * 3);
    for (let i = 0; i < count; i++) {
      const index = Math.floor(Math.random() * remaining.length);
      changeSpace(remaining.splice(index, 1)[0], 'Automatic sensor update');
    }
    markUpdated();
    updateDashboard();
  }

  function schedule() {
    clearInterval(timer);
    timer = running ? setInterval(sensorTick, interval) : null;
  }

  $('pause-button').addEventListener('click', () => {
    running = !running;
    $('pause-label').textContent = running ? 'Pause simulation' : 'Resume simulation';
    $('pause-icon').textContent = running ? 'Ⅱ' : '▷';
    $('simulation-status').innerHTML = `<span class="status-dot"></span> ${running ? 'Running' : 'Paused'}`;
    $('simulation-status').classList.toggle('paused', !running);
    $('map-live').innerHTML = `<span class="status-dot"></span> ${running ? 'Live simulation' : 'Simulation paused'}`;
    $('map-live').classList.toggle('paused', !running);
    schedule();
    announce(running ? 'Automatic sensor updates resumed.' : 'Automatic sensor updates paused. You can still click individual spaces.');
  });

  $('update-speed').addEventListener('change', event => {
    interval = Number(event.target.value);
    schedule();
    announce(`Sensor update interval set to ${interval / 1000} seconds.`);
  });

  $('randomize-button').addEventListener('click', () => {
    for (const space of spaces) space.occupied = Math.random() < 0.62;
    events.length = 0;
    events.push({ reset: true, time: new Date() });
    updateDashboard();
    markUpdated();
    schedule();
    announce('All 100 parking spaces have new random sensor readings.');
  });

  $('toggle-space').addEventListener('click', () => {
    const space = byId.get(selectedId);
    changeSpace(space, 'Manual status change');
    markUpdated();
    updateDashboard();
    announce(`${space.id} is now ${space.occupied ? 'occupied' : 'available'}.`);
  });

  document.querySelectorAll('[data-filter]').forEach(button => {
    button.addEventListener('click', () => {
      filter = button.dataset.filter;
      document.querySelectorAll('[data-filter]').forEach(item => {
        item.classList.toggle('selected', item === button);
        item.setAttribute('aria-pressed', String(item === button));
      });
      updateDashboard();
    });
  });

  const dialog = $('reference-dialog');
  $('reference-button').addEventListener('click', () => dialog.showModal());
  $('reference-nav').addEventListener('click', () => dialog.showModal());
  $('close-reference').addEventListener('click', () => dialog.close());
  dialog.addEventListener('click', event => {
    const bounds = dialog.getBoundingClientRect();
    if (event.target === dialog && (event.clientX < bounds.left || event.clientX > bounds.right || event.clientY < bounds.top || event.clientY > bounds.bottom)) dialog.close();
  });

  markUpdated();
  updateDashboard();
  schedule();
})();
