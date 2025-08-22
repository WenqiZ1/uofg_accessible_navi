/* ===================== Core config ===================== */
mapboxgl.accessToken =
  'pk.eyJ1Ijoid2VucWl6IiwiYSI6ImNtNXdqNjRodTBibW0yaXNmampmamw4YW4ifQ.OJyicFr9txX6JXaUH9OzYQ';

const styleURLs = {
  default: 'mapbox://styles/wenqiz/cmcghjml7051e01s5bte83vm3',
  highcontrast: 'mapbox://styles/wenqiz/cmdmxmd08000301p915cm90zc',
  satellite: 'mapbox://styles/mapbox/satellite-streets-v11',
};

// Map 5000/5001 to your OSRM services
const OSRM_BASES = {
  '5000': 'https://all-access.onrender.com',
  '5001': 'https://step-free-yhgh.onrender.com',
};

let currentStyle = 'default';

/* Route styles + cache */
const ROUTE_LAYERS = {
  all:  { sourceId: 'route-all',  layerId: 'route-all-layer',  color: '#1da1f2', dash: null,    width: 6 },
  step: { sourceId: 'route-step', layerId: 'route-step-layer', color: '#34c759', dash: [2, 2], width: 6 }
};
const routeCache = { all: null, step: null };

/* Utilities */
function ensureStyleReady(map) {
  return new Promise((res) => {
    if (map.isStyleLoaded && map.isStyleLoaded()) return res();
    map.once('idle', () => res());
  });
}
function safeRemoveLayer(id)  { if (map.getLayer(id))  map.removeLayer(id); }
function safeRemoveSource(id) { if (map.getSource(id)) map.removeSource(id); }

/* ===================== Map init ===================== */
const map = new mapboxgl.Map({
  container: 'map',
  style: styleURLs[currentStyle],
  center: [-4.289, 55.873],
  zoom: 15,
});
map.addControl(new mapboxgl.NavigationControl(), 'bottom-right');
map.addControl(
  new mapboxgl.GeolocateControl({
    positionOptions: { enableHighAccuracy: true },
    trackUserLocation: true,
  }),
  'bottom-right'
);

/* ===================== i18n ===================== */
const I18N = {
  en: {
    ui: {
      title: 'Accessible Routing on University of Glasgow’s Gilmorehill Campus',
      subtitle: 'Wenqi Zhou · Student ID: 2983273z',
      allAccess: 'All Access Route',
      stepFree: 'Step-Free Route',
      detailed: 'Detailed Map',
      highContrast: 'High Contrast Map',
      satellite: 'Satellite Imagery',
      startPH: 'Start location',
      endPH: 'End location',
      plan: 'Plan Route',
      legendAll: 'All-Access Route',
      legendStep: 'Step-Free Route',
      elev: 'Elevator',
      ramp: 'Ramp',
      at: 'Accessible toilet',
    },
    yn: { Yes: 'Yes', No: 'No', 'N/A': 'N/A', 'Partial/Assisted': 'Partial/Assisted' },
  },
  zh: {
    ui: {
      title: '格拉斯哥大学吉尔摩山校区无障碍路径规划',
      subtitle: '周文琦 · 学号：2983273z',
      allAccess: '通行优先路径',
      stepFree: '无台阶路径',
      detailed: '细节底图',
      highContrast: '高对比度底图',
      satellite: '卫星影像',
      startPH: '起点位置',
      endPH: '终点位置',
      plan: '开始规划',
      legendAll: '通行优先路径',
      legendStep: '无台阶路径',
      elev: '电梯',
      ramp: '坡道',
      at: '无障碍厕所',
    },
    yn: { Yes: '有', No: '无', 'N/A': '无', 'Partial/Assisted': '部分/需协助' },
  },
};
let CURRENT_LANG = localStorage.getItem('uofg_lang') || 'en';

/* ===================== Style switch ===================== */
document.getElementById('styleSwitcher').addEventListener('change', function () {
  const selected = this.value;
  if (!styleURLs[selected]) return;

  currentStyle = selected;
  const center = map.getCenter();
  const zoom = map.getZoom();

  // avoid duplicate default controls
  document.querySelectorAll('.mapboxgl-ctrl').forEach((c) => c.remove());

  map.setStyle(styleURLs[selected]);

  map.once('styledata', async () => {
    map.setCenter(center);
    map.setZoom(zoom);

    map.addControl(new mapboxgl.NavigationControl(), 'bottom-right');
    map.addControl(
      new mapboxgl.GeolocateControl({
        positionOptions: { enableHighAccuracy: true },
        trackUserLocation: true,
      }),
      'bottom-right'
    );

    // restore routes
    await ensureStyleReady(map);
    ['all', 'step'].forEach((kind) => {
      const cfg = ROUTE_LAYERS[kind];
      const geom = routeCache[kind];
      if (!geom) return;
      safeRemoveLayer(cfg.layerId);
      safeRemoveSource(cfg.sourceId);
      map.addSource(cfg.sourceId, { type: 'geojson', data: { type: 'Feature', geometry: geom } });
      const paint = { 'line-color': cfg.color, 'line-width': cfg.width };
      if (cfg.dash) paint['line-dasharray'] = cfg.dash;
      map.addLayer({
        id: cfg.layerId,
        type: 'line',
        source: cfg.sourceId,
        layout: { 'line-join': 'round', 'line-cap': 'round' },
        paint,
      });
    });
  });
});

/* ===================== Landmarks ===================== */
/* description 可为字符串或 {en:'..', zh:'..'} */
const landmarks = [
  { name: "University of Glasgow Library", coord: [-4.28898, 55.87320],
    description:{en: "The university's main library with extensive academic resources and study spaces.", zh:"格拉斯哥大学的主图书馆，拥有丰富的学术资源和学习空间。"},
    elevator: "Yes", ramp: "Yes", accessible_toilet: "Yes", type: "campus" },

  { name: "Molema Building", coord: [-4.2927, 55.87395],
    description:{en: "School of Geographical and Earth Sciences main building.",zh:"地理与地球科学学院主楼。"},
    elevator: "Yes", ramp: "Yes", accessible_toilet: "Yes", type: "campus" },

  { name: "James McCune Smith Learning Hub", coord: [-4.29167, 55.87302],
    description: {en:"Large modern learning facility offering various flexible teaching and study spaces.",zh:"大型现代化学习设施，提供各种灵活的教学和学习空间。"},
    elevator: "Yes", ramp: "Yes", accessible_toilet: "Yes", type: "campus" },

  { name: "Bower Building", coord: [-4.29167, 55.87245],
    description: { en: "Teaching and research facility for the School of Life Sciences.",
                   zh: "生命科学学院的教学与科研楼。" },
    elevator: "Yes", ramp: "Yes", accessible_toilet: "Yes", type: "campus" },

  { name: "Boyd Orr Building", coord: [-4.2927, 55.87355],
    description: {en:"Science teaching and labs; high-rise building facing University Avenue.",zh:"科学教学和实验室；面向大学大道的高层建筑。"},
    elevator: "Yes", ramp: "Yes", accessible_toilet: "Yes", type: "campus" },

  { name: "Fraser Building", coord: [-4.28780, 55.87310],
    description:{en: "Student services, catering and retail; step-free access at ground level.",zh:"提供学生服务、餐饮和零售；有地面无障碍通道。"},
    elevator: "Yes", ramp: "Yes", accessible_toilet: "Yes", type: "campus" },

  { name: "James Watt South Building", coord: [-4.28655, 55.87113],
    description:{en: "Major Engineering building adjacent to Rankine.",zh:"工程学院主要教学楼。"},
    elevator: "Yes", ramp: "Yes", accessible_toilet: "Yes", type: "campus" },

  { name: "Joseph Black Building (Chemistry)", coord: [-4.29299, 55.87208],
    description: {en:"School of Chemistry and associated laboratories.",zh:"化学学院及相关实验室。"},
    elevator: "Yes", ramp: "Yes", accessible_toilet: "Yes", type: "campus" },

  { name: "Rankine Building (Engineering)", coord: [-4.28559, 55.87245],
    description:{en: "Engineering teaching and research building close to University Avenue.",zh:"靠近大学路的工程教学科研大楼。"},
    elevator: "Yes", ramp: "Yes", accessible_toilet: "No", type: "campus" },

  { name: "Kelvin Building", coord: [-4.29130, 55.87175],
    description: {en:"Home to Physics & Astronomy; north side of University Avenue.",zh:"物理学和天文学研究中心；位于大学大道北侧。"},
    elevator: "Yes", ramp: "Yes", accessible_toilet: "No", type: "campus" },

  { name: "Stair Building (Mathematics & Statistics)", coord: [-4.2905, 55.87175],
    description: {en:"Teaching and offices for the School of Mathematics & Statistics.",zh:"数学与统计学院的教学和办公室。"},
    elevator: "Yes", ramp: "Yes", accessible_toilet: "Yes", type: "campus" },

  { name: "Advanced Research Building", coord: [-4.29580, 55.87145],
    description:{en: "A modern facility at the University of Glasgow dedicated to interdisciplinary research and innovation.",zh:"格拉斯哥大学的现代化设施，致力于跨学科研究和创新。"},
    elevator: "Yes", ramp: "Yes", accessible_toilet: "Yes", type: "campus" },

  { name: "School of Mathematics and Statistics", coord: [-4.29440, 55.87245],
    description: {en:"Modern teaching and offices of the School of Mathematics and Statistics.",zh:"数学与统计学院的现代化教学和办公室。"},
    elevator: "Yes", ramp: "Yes", accessible_toilet: "Yes", type: "campus" },

  { name: "McMillan Reading Room", coord: [-4.28801, 55.87271],
    description: {en:"Quiet study space between the Main Building and the Library.",zh:"主楼和图书馆之间安静的学习空间。"},
    elevator: "Yes", ramp: "Yes", accessible_toilet: "Yes", type: "campus" },

  { name: "Wolfson Medical School Building", coord: [-4.29310, 55.87302],
    description: {en:"Dedicated to medical education with advanced simulation facilities.",zh:"拥有先进模拟设施的医学教育设施。"},
    elevator: "Yes", ramp: "Yes", accessible_toilet: "Yes", type: "campus" },

  /* Museums */
  { name: "Hunterian Art Museum", coord: [-4.28835, 55.87180],
    description: { en: "Scotland's oldest public museum, located within the Gilbert Scott Building.",
                   zh: "位于 Gilbert Scott Building 内的苏格兰最古老公立博物馆。" },
    elevator: "Yes", ramp: "Yes", accessible_toilet: "No", type: "museum" },

  { name: "Kelvingrove Art Gallery and Museum", coord: [-4.29110, 55.86850],
    description: { en:  "Major civic museum beside Kelvingrove Park with art and natural history collections.",zh:"凯尔文格罗夫公园旁的大型市民博物馆，收藏艺术品和自然历史藏品。"},
    elevator: "Yes", ramp: "Yes", accessible_toilet: "Yes", type: "museum" },

  /* Transport */
  { name: "Kelvinhall Station", coord: [-4.29969, 55.87102],
    description: { en: "Glasgow Subway station serving the West End, near Kelvingrove Park and the University.",
                 zh: "服务西区的地铁站，靠近凯尔文格罗夫公园与校园。" },
    elevator: "No", ramp: "No", accessible_toilet: "No", type: "transport" },

  { name: "Hillhead Subway Station", coord: [-4.29329, 55.87519],
    description:  { en: "Subway Circle line station on Byres Road; step-free from street to concourse.",zh:"拜尔斯路 (Byres Road) 上的地铁环线站；从街道到大厅无台阶。"},
    elevator: "Partial/Assisted", ramp: "Yes", accessible_toilet: "No", type: "transport" },

  { name: "Partick Station", coord: [-4.30939, 55.87],
    description:  { en: "Major transport hub connecting ScotRail, the Glasgow Subway, and local buses.",zh:"连接苏格兰铁路、格拉斯哥地铁和当地公交车的主要交通枢纽。"},
    elevator: "Yes", ramp: "Yes", accessible_toilet: "Yes", type: "transport" }
];

const emojiByType = { campus: '🎓', museum: '🏛️', transport: '🚇', gate: '🚪' };

const markers = [];
function getDescByLang(desc) {
  if (!desc) return '';
  if (typeof desc === 'string') return desc;
  return desc[CURRENT_LANG] || desc.en || '';
}
function yesNoLocalize(v) {
  const m = I18N[CURRENT_LANG].yn;
  return m[v] || v || '';
}
function buildPopupHTML(l) {
  const U = I18N[CURRENT_LANG].ui;
  const parts = [];
  parts.push(`<strong style="font-family:'Poppins',sans-serif;font-weight:600">${l.name}</strong>`);
  const d = getDescByLang(l.description);
  if (d) parts.push(d);
  if (l.elevator) parts.push(`${U.elev}: ${yesNoLocalize(l.elevator)}`);
  if (l.ramp) parts.push(`${U.ramp}: ${yesNoLocalize(l.ramp)}`);
  if (l.accessible_toilet) parts.push(`${U.at}: ${yesNoLocalize(l.accessible_toilet)}`);
  return `<div style="font-family:'Roboto',sans-serif;line-height:1.45;min-width:220px">${parts.join('<br/>')}</div>`;
}
function renderLandmarks() {
  landmarks.forEach((l) => {
    const el = document.createElement('div');
    el.title = l.name;
    el.innerHTML = emojiByType[l.type] || '📍';
    el.style.fontSize = '14px';

    const marker = new mapboxgl.Marker({ element: el })
      .setLngLat(l.coord)
      .setPopup(new mapboxgl.Popup({ offset: 25 }).setHTML(buildPopupHTML(l)))
      .addTo(map);

    markers.push({ marker, data: l });
  });
}
function refreshAllPopups() {
  markers.forEach(({ marker, data }) => {
    marker.getPopup().setHTML(buildPopupHTML(data));
  });
}

/* Legend */
function addLegend() {
  const legend = document.createElement('div');
  legend.style.cssText =
    'position:absolute;bottom:16px;left:16px;background:#fff;padding:8px 10px;border-radius:8px;font:12px/1.4 system-ui, sans-serif;box-shadow:0 1px 4px rgba(0,0,0,.15)';
  legend.innerHTML = `
    <div style="display:flex;align-items:center;gap:8px;margin-bottom:4px;">
      <span style="display:inline-block;width:20px;height:4px;background:${ROUTE_LAYERS.all.color};border-radius:2px;"></span>
      <span id="legendAll">${I18N[CURRENT_LANG].ui.legendAll}</span>
    </div>
    <div style="display:flex;align-items:center;gap:8px;">
      <span style="display:inline-block;width:20px;height:0;border-top:4px dashed ${ROUTE_LAYERS.step.color};"></span>
      <span id="legendStep">${I18N[CURRENT_LANG].ui.legendStep}</span>
    </div>`;
  map.getContainer().appendChild(legend);
}

/* Language switch UI behaviour */
function setLang(lang) {
  CURRENT_LANG = lang;
  localStorage.setItem('uofg_lang', lang);

  // switch button active state
  document.querySelectorAll('#langSwitch .lang-btn').forEach((b) => {
    const on = b.dataset.lang === lang;
    b.classList.toggle('active', on);
  });

  // update page header title/subtitle
  const titleEl = document.getElementById('titleText');
  const subEl = document.getElementById('subtitleText');
  if (titleEl) titleEl.textContent = I18N[lang].ui.title;
  if (subEl) subEl.textContent = I18N[lang].ui.subtitle;

  // update selects / placeholders / button text
  const U = I18N[lang].ui;
  const mode = document.getElementById('mode');
  if (mode) {
    const o1 = mode.querySelector('option[value="5000"]');
    const o2 = mode.querySelector('option[value="5001"]');
    if (o1) o1.textContent = `🚶 ${U.allAccess}`;
    if (o2) o2.textContent = `♿ ${U.stepFree}`;
  }
  const ss = document.getElementById('styleSwitcher');
  if (ss) {
    ss.querySelector('option[value="default"]').textContent = `🗺️ ${U.detailed}`;
    ss.querySelector('option[value="highcontrast"]').textContent = `👁️ ${U.highContrast}`;
    ss.querySelector('option[value="satellite"]').textContent = `🛰️ ${U.satellite}`;
  }
  const sI = document.getElementById('start');
  if (sI) sI.placeholder = U.startPH;
  const eI = document.getElementById('end');
  if (eI) eI.placeholder = U.endPH;
  const btn = document.getElementById('routeBtn');
  if (btn) btn.textContent = U.plan;

  const la = document.getElementById('legendAll');
  if (la) la.textContent = U.legendAll;
  const ls = document.getElementById('legendStep');
  if (ls) ls.textContent = U.legendStep;

  refreshAllPopups();
}
document.querySelectorAll('#langSwitch .lang-btn').forEach((btn) => {
  btn.addEventListener('click', () => setLang(btn.dataset.lang));
});

/* ===================== Map load ===================== */
map.on('load', () => {
  renderLandmarks();
  addLegend();
  setLang(CURRENT_LANG); // apply saved language

  // Welcome modal (first-visit)
  const modal = document.getElementById('welcomeModal');
  const closeBtn = document.getElementById('closeModal');
  const dontShow = document.getElementById('dontShow');
  const STORAGE_KEY = 'uofg_accessible_routing_welcome_v1';

  if (modal && closeBtn) {
    if (localStorage.getItem(STORAGE_KEY) !== '1') {
      modal.classList.add('show');
    }
    closeBtn.addEventListener('click', () => {
      if (dontShow && dontShow.checked) localStorage.setItem(STORAGE_KEY, '1');
      modal.classList.remove('show');
    });
    modal.addEventListener('click', (e) => {
      if (e.target === modal) {
        if (dontShow && dontShow.checked) localStorage.setItem(STORAGE_KEY, '1');
        modal.classList.remove('show');
      }
    });
  }
});

/* ===================== Autocomplete (fixed below inputs) ===================== */
function setupAutocomplete(inputElement, isStart) {
  // Wrap the input with a relative-positioned container
  const wrapper = document.createElement('div');
  wrapper.style.position = 'relative';
  wrapper.style.flex = inputElement.style.flex || ''; // keep flex behaviour if any
  inputElement.parentNode.insertBefore(wrapper, inputElement);
  wrapper.appendChild(inputElement);

  // Create dropdown inside wrapper so it anchors below input
  const dropdown = document.createElement('div');
  dropdown.className = 'autocomplete-items';
  dropdown.style.display = 'none';
  wrapper.appendChild(dropdown);

  function show() { dropdown.style.display = ''; }
  function hide() { dropdown.style.display = 'none'; dropdown.innerHTML = ''; }

  inputElement.addEventListener('input', async function () {
    const value = this.value.trim().toLowerCase();
    dropdown.innerHTML = '';
    if (!value) return hide();

    const matches = landmarks.filter((l) => l.name.toLowerCase().includes(value));

    const addItem = (label, coord) => {
      const item = document.createElement('div');
      item.textContent = label;
      item.addEventListener('click', () => {
        inputElement.value = label;
        hide();
        if (isStart) {
          startCoord = coord;
          if (startMarker) startMarker.remove();
          startMarker = addMarker(coord, '#3bb2d0');
        } else {
          endCoord = coord;
          if (endMarker) endMarker.remove();
          endMarker = addMarker(coord, '#f30');
        }
      });
      dropdown.appendChild(item);
    };

    if (matches.length > 0) {
      matches.forEach((m) => addItem(m.name, m.coord));
      show();
    } else {
      try {
        const response = await fetch(
          `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(
            value
          )}.json?access_token=${mapboxgl.accessToken}&limit=3&bbox=-4.35,55.83,-4.20,55.90`
        );
        const result = await response.json();
        if (result.features && result.features.length > 0) {
          result.features.forEach((f) => addItem(f.place_name, f.geometry.coordinates));
          show();
        } else {
          hide();
        }
      } catch {
        hide();
      }
    }
  });

  // Hide dropdown on blur / outside click
  document.addEventListener('click', (e) => {
    if (!wrapper.contains(e.target)) hide();
  });
  inputElement.addEventListener('blur', () => {
    setTimeout(hide, 150); // allow click
  });
}

/* Markers for chosen start/end */
let startCoord = null,
  endCoord = null;
let startMarker = null,
  endMarker = null;
function addMarker(coord, color) {
  return new mapboxgl.Marker({ color }).setLngLat(coord).addTo(map);
}
const startInput = document.getElementById('start');
const endInput = document.getElementById('end');
if (startInput) setupAutocomplete(startInput, true);
if (endInput) setupAutocomplete(endInput, false);

/* ===================== Routing ===================== */
async function drawRoute(start, end) {
  const modeEl = document.getElementById('mode');
  const modeValue = modeEl ? modeEl.value : '5000';
  const base = OSRM_BASES[modeValue] || modeValue;

  const url = `${base}/route/v1/foot/${start[0]},${start[1]};${end[0]},${end[1]}?geometries=geojson`;
  const kind = modeValue === '5000' ? 'all' : modeValue === '5001' ? 'step' : 'all';
  const cfg = ROUTE_LAYERS[kind];

  try {
    const resp = await fetch(url);
    if (!resp.ok) throw new Error('HTTP ' + resp.status);
    const data = await resp.json();
    if (!data.routes || data.routes.length === 0 || !data.routes[0].geometry) {
      alert('No route found.');
      return;
    }

    const routeGeom = data.routes[0].geometry;
    routeCache[kind] = routeGeom;

    await ensureStyleReady(map);
    safeRemoveLayer(cfg.layerId);
    safeRemoveSource(cfg.sourceId);

    map.addSource(cfg.sourceId, { type: 'geojson', data: { type: 'Feature', geometry: routeGeom } });
    const paint = { 'line-color': cfg.color, 'line-width': cfg.width };
    if (cfg.dash) paint['line-dasharray'] = cfg.dash;
    map.addLayer({
      id: cfg.layerId,
      type: 'line',
      source: cfg.sourceId,
      layout: { 'line-join': 'round', 'line-cap': 'round' },
      paint,
    });

    const bounds = new mapboxgl.LngLatBounds();
    routeGeom.coordinates.forEach((c) => bounds.extend(c));
    map.fitBounds(bounds, { padding: 50 });

    const distance = (data.routes[0].distance / 1000).toFixed(2);
    const duration = Math.round(data.routes[0].duration / 60);
    const infoEl = document.getElementById('info');
    if (infoEl) infoEl.textContent = `Distance: ${distance} km | Duration: ${duration} min`;
  } catch (err) {
    console.error('drawRoute error:', err);
    alert('Failed to fetch or render the route. Open the console for details.');
  }
}

/* Bind button */
const routeBtn = document.getElementById('routeBtn');
if (routeBtn) {
  routeBtn.addEventListener('click', () => {
    if (startCoord && endCoord) {
      drawRoute(startCoord, endCoord);
    } else {
      alert('Please select both start and end locations.');
    }
  });
}