// Tracking Loker: tampilan. Data dibaca dari jobs.json (ditulis update.py lewat GitHub Actions setiap pagi).
import {
  decode, filterJobs, sortJobs, countBy, salaryBy, summarize, salaryText, juta, ribu, ago, dateText, timeText,
  karirhubUrl, initials, hue, htmlToText, filtersFromQuery, filtersToQuery, activeCount, cityLabel,
  EMPTY_FILTERS, MAJORS, findMajor, EDU_CHOICES, EDU_SHORT, EDU_LEVEL, GAJI_CHOICES, WAKTU_CHOICES, SORTS, DIRECT, KARIRHUB_DETAIL_API
} from './logic.js';

const PAGE = 30;

// Pesan semangat untuk teman-teman yang masih mencari kerja. Berganti setiap hari.
const MESSAGES = [
  { bubble: 'Semangat, ya!', title: 'Istirahat boleh, menyerah jangan.', body: 'Kalau lagi capek, ambil jeda sebentar. Lowongan baru tetap masuk setiap pagi, dan Tracking Loker akan terus mengumpulkannya untukmu.' },
  { bubble: 'Satu lamaran lagi!', title: 'Lamaran yang belum berhasil tetap ada gunanya.', body: 'Setiap lamaran yang kamu kirim bikin kamu makin paham apa yang dicari perusahaan. Bisa jadi yang berikutnya justru yang berhasil.' },
  { bubble: 'Kamu pasti bisa!', title: 'Pelan-pelan, asal tetap jalan.', body: 'Tiga lamaran yang disesuaikan dengan posisinya sering lebih ampuh daripada puluhan lamaran yang dikirim sekaligus.' },
  { bubble: 'Hari baru, peluang baru', title: 'Hari ini ada {fresh} peluang baru.', body: 'Pilih yang paling cocok dengan kemampuanmu, rapikan CV sebentar, lalu kirim dengan percaya diri.' },
  { bubble: 'Coba lagi, yuk!', title: 'Coba lirik bidang yang masih serumpun.', body: 'Kalau bidang incaranmu sedang sepi, cek halaman Pasar. Pengalaman di bidang yang dekat bisa jadi batu loncatan.' },
  { bubble: 'Kamu hebat!', title: 'Terima kasih sudah terus mencoba.', body: 'Mencari kerja memang melelahkan. Kamu masih berusaha sampai hari ini, dan itu patut dihargai.' },
  { bubble: 'Ayo, mulai hari ini!', title: 'Melamar lebih awal, peluangnya lebih besar.', body: 'Banyak perekrut membaca lamaran yang masuk di hari-hari pertama. Cek lowongan bertanda "Baru" setiap pagi.' }
];

// Jurusan yang tampil sebagai pintasan di bawah kolom pencarian.
const POPULAR_MAJORS = ['Akuntansi', 'Manajemen', 'Teknik Informatika', 'Administrasi Perkantoran', 'Desain Komunikasi Visual',
  'Teknik Mesin', 'Teknik Sipil & Arsitektur', 'Keperawatan & Kebidanan', 'Tata Boga & Kuliner', 'Pendidikan', 'Hukum'];

const MOODS = [
  { tone: 'blue', title: 'Lulusan SMA/SMK', unit: 'lowongan', icon: 'star', img: 'orang-raka.svg', patch: { edu: 'sma' } },
  { tone: 'green', title: 'Mau magang dulu', unit: 'magang', icon: 'cap', img: 'orang-nadia.svg', patch: { types: ['Magang'] } },
  { tone: 'pink', title: 'Baru masuk hari ini', unit: 'dalam 24 jam', icon: 'bolt', img: 'orang-ayu.svg', patch: { waktu: '1' } },
  { tone: 'yellow', title: 'Gaji di atas 5 juta', unit: 'lowongan', icon: 'coin', img: 'orang-laila.svg', patch: { gaji: '5' } }
];

function todayMessage() {
  const day = Math.floor((state.ref + 7 * 3600) / 86400);
  return MESSAGES[day % MESSAGES.length];
}

function emptyArt(img, tone = '') {
  return `<div class="empty-art ${tone}"><img src="${img}" alt=""></div>`;
}
// Kunci lama dipertahankan supaya lowongan yang sudah disimpan pengguna tidak hilang.
const SAVED_KEY = 'loker-radar:saved';
const $ = (s, root = document) => root.querySelector(s);
const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const nowSec = () => Math.floor(Date.now() / 1000);
const icon = (name) => `<svg><use href="#i-${name}"/></svg>`;

const state = {
  all: [],
  byId: new Map(),
  updated: null,
  ref: nowSec(),
  logoBase: '',
  sources: [],
  days: [],
  f: filtersFromQuery(location.search),
  list: [],
  shown: PAGE,
  view: 'cari',
  pasarProv: '',
  openId: '',
  saved: loadSaved(),
  links: null,
  loaded: false
};

// ---------------------------------------------------------------- data

async function getJSON(url) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`${url}: ${res.status}`);
  return res.json();
}

async function boot() {
  bindEvents();
  renderStatic();
  setView(viewFromHash(), false);
  $('#job-list').innerHTML = Array.from({ length: 6 }, () => '<div class="skeleton"></div>').join('');
  try {
    const [data, stats] = await Promise.all([getJSON('jobs.json'), getJSON('stats.json').catch(() => ({ days: [] }))]);
    const d = decode(data);
    state.all = d.jobs;
    state.byId = new Map(d.jobs.map((j) => [j.id, j]));
    state.updated = d.updated;
    state.ref = d.updated ? Math.floor(Date.parse(d.updated) / 1000) : nowSec();
    state.logoBase = d.logoBase;
    state.sources = d.sources;
    state.days = (stats && stats.days) || [];
    state.loaded = true;
  } catch (err) {
    console.error(err);
    $('#updated').textContent = 'Data gagal dimuat';
    $('#job-list').innerHTML = `<div class="empty"><b>Data belum bisa dimuat</b><p>Periksa koneksi internet lalu muat ulang halaman.</p><button class="btn dark" type="button" onclick="location.reload()">Muat ulang</button></div>`;
    return;
  }
  renderMeta();
  renderMoods();
  renderCheer();
  apply(false);
  const id = new URLSearchParams(location.search).get('id');
  if (id) openJob(id);
}

// ---------------------------------------------------------------- kontrol statis

function renderStatic() {
  $('#sort').innerHTML = SORTS.map((s) => `<option value="${s.key}">${s.label}</option>`).join('');
  $('#f-edu').innerHTML = EDU_CHOICES.map((c) => `<button type="button" class="chip" data-edu="${c.key}">${c.label}</button>`).join('');
  $('#f-gaji').innerHTML = GAJI_CHOICES.map((c) => `<button type="button" class="chip" data-gaji="${c.key}">${c.label}</button>`).join('');
  $('#f-waktu').innerHTML = WAKTU_CHOICES.map((c) => `<button type="button" class="chip" data-waktu="${c.key}">${c.label}</button>`).join('');
  $('#q').value = state.f.q;
}

function renderMeta() {
  const upd = $('#updated');
  if (!state.updated) {
    upd.textContent = 'Menunggu penarikan data pertama';
  } else {
    const age = nowSec() - state.ref;
    upd.textContent = `Diperbarui ${dateText(state.ref, true)}, ${timeText(state.ref)} WIB` + (age > 36 * 3600 ? ` · ${ago(state.ref, nowSec())}` : '');
  }
  const parts = state.sources.map((s) => s.ok
    ? `${esc(s.name)}: ${ribu(s.count)} lowongan`
    : `${esc(s.name)}: gagal ditarik pada pembaruan terakhir, menampilkan data sebelumnya`);
  $('#source-status').innerHTML = parts.join(' · ');
  updateSavedBadge();
}

// ---------------------------------------------------------------- filter + hasil

function apply(scrollTop = true) {
  const f = state.f;
  state.list = sortJobs(filterJobs(state.all, f, state.ref), f.sort);
  state.shown = PAGE;
  renderControls();
  renderHero();
  renderResults();
  syncURL();
  if (state.view === 'pasar') renderPasar();
  if (scrollTop && state.view === 'cari' && window.scrollY > $('.layout').offsetTop) {
    window.scrollTo({ top: $('.layout').offsetTop - 12, behavior: 'smooth' });
  }
}

function optionList(entries, allLabel, selected, labelFn = (v) => v) {
  const has = !selected || entries.some(([v]) => v === selected);
  const extra = has ? [] : [[selected, 0]];
  return [`<option value="">${allLabel}</option>`]
    .concat([...entries, ...extra].map(([v, n]) => `<option value="${esc(v)}"${v === selected ? ' selected' : ''}>${esc(labelFn(v))} (${ribu(n)})</option>`))
    .join('');
}

function renderControls() {
  const { f, all, ref } = state;
  const byProv = countBy(filterJobs(all, f, ref, 'prov'), 'province').sort((a, b) => a[0].localeCompare(b[0], 'id'));
  $('#f-prov').innerHTML = optionList(byProv, 'Semua provinsi', f.prov);
  $('#prov-top').innerHTML = optionList(byProv, 'Seluruh Indonesia', f.prov);

  const city = $('#f-city');
  if (f.prov) {
    const byCity = countBy(filterJobs(all, f, ref, 'city'), 'city');
    city.innerHTML = optionList(byCity, 'Semua kota/kabupaten', f.city, cityLabel);
    city.disabled = false;
  } else {
    city.innerHTML = '<option value="">Pilih provinsi dulu</option>';
    city.disabled = true;
  }

  $('#f-fn').innerHTML = optionList(countBy(filterJobs(all, f, ref, 'fn'), 'fn'), 'Semua bidang', f.fn);

  const bySrc = countBy(filterJobs(all, f, ref, 'src'), 'platform');
  const direct = filterJobs(all, f, ref, 'src').filter((j) => j.via !== 'karirhub').length;
  $('#f-src').innerHTML = optionList(bySrc, 'Semua sumber', f.src === DIRECT ? '' : f.src)
    + (direct ? `<option value="${DIRECT}"${f.src === DIRECT ? ' selected' : ''}>Langsung dari situs perusahaan (${ribu(direct)})</option>` : '');

  const types = countBy(filterJobs(all, f, ref, 'types'), 'type', 7);
  for (const t of f.types) if (!types.some(([v]) => v === t)) types.push([t, 0]);
  $('#f-types').innerHTML = types.map(([t, n]) =>
    `<button type="button" class="chip${f.types.includes(t) ? ' on' : ''}" data-type="${esc(t)}">${esc(t)} <small>${ribu(n)}</small></button>`).join('')
    || '<span class="fhint">Belum ada data.</span>';

  for (const el of document.querySelectorAll('[data-edu]')) el.classList.toggle('on', el.dataset.edu === f.edu);
  for (const el of document.querySelectorAll('[data-gaji]')) el.classList.toggle('on', el.dataset.gaji === f.gaji);
  for (const el of document.querySelectorAll('[data-waktu]')) el.classList.toggle('on', el.dataset.waktu === f.waktu);
  $('#sort').value = f.sort;
  if (document.activeElement !== $('#q')) $('#q').value = f.q;

  const n = activeCount(f);
  const badge = $('#filter-badge');
  badge.hidden = !n;
  badge.textContent = n;

  // Pintasan jurusan di bawah kolom pencarian (jumlahnya mengikuti filter lain yang aktif).
  const active = findMajor(f.jur);
  const base = filterJobs(all, f, ref, 'jur');
  const chips = POPULAR_MAJORS.map((label) => {
    const n = filterJobs(base, { ...EMPTY_FILTERS, types: [], jur: label }, ref).length;
    const on = active && active.label === label;
    return `<button type="button" class="chip${on ? ' on' : ''}" data-jur="${esc(on ? '' : label)}">${esc(label)} <small>${ribu(n)}</small></button>`;
  });
  $('#quick').innerHTML = `<span class="quick-label">Cari sesuai jurusan</span>${chips.join('')}`;
  if (document.activeElement !== $('#jur')) $('#jur').value = f.jur;

  renderActiveChips();
}

function renderActiveChips() {
  const f = state.f;
  const chips = [];
  const add = (label, patch) => chips.push({ label, patch });
  if (f.q) add(`“${f.q}”`, { q: '' });
  if (f.jur) add(`Jurusan: ${findMajor(f.jur)?.label || f.jur}`, { jur: '' });
  if (f.prov) add(f.prov, { prov: '', city: '' });
  if (f.city) add(cityLabel(f.city), { city: '' });
  if (f.fn) add(f.fn, { fn: '' });
  for (const t of f.types) add(t, { types: f.types.filter((x) => x !== t) });
  if (f.edu) add(`Pendidikan: ${EDU_CHOICES.find((c) => c.key === f.edu)?.label}`, { edu: '' });
  if (f.gaji) add(`Gaji: ${GAJI_CHOICES.find((c) => c.key === f.gaji)?.label}`, { gaji: '' });
  if (f.waktu) add(`Diposting ${WAKTU_CHOICES.find((c) => c.key === f.waktu)?.label} terakhir`, { waktu: '' });
  if (f.src) add(f.src === DIRECT ? 'Situs perusahaan' : f.src, { src: '' });
  const box = $('#active-chips');
  box.innerHTML = chips.map((c, i) => `<button type="button" class="chip" data-unset="${i}">${esc(c.label)} ${icon('x')}</button>`).join('')
    + (chips.length > 1 ? '<button type="button" class="chip clear" data-reset>Hapus semua</button>' : '');
  box._patches = chips.map((c) => c.patch);
}

function renderHero() {
  const s = summarize(state.all, state.ref);
  if (!state.loaded) return;
  if (!state.all.length) {
    $('#hero-title').innerHTML = 'Tracking Loker sedang menyiapkan <mark>data lowongan</mark> untukmu.';
    $('#hero-sub').textContent = 'Lowongan dari Karirhub Kemnaker dan situs karier perusahaan ditarik otomatis setiap pagi pukul 06.00 WIB.';
    return;
  }
  $('#hero-count').textContent = ribu(s.total);
  $('#hero-sub').innerHTML = `Dari <b>${ribu(s.companies)}</b> perusahaan di ${s.provinces} provinsi, <b>${ribu(s.fresh)}</b> di antaranya baru masuk dalam 24 jam terakhir. Pekerjaan berikutnya mungkin ada di daftar hari ini.`;
}

function renderMoods() {
  if (!state.loaded || !state.all.length) {
    $('#moods').hidden = true;
    return;
  }
  $('#moods').hidden = false;
  $('#moods').innerHTML = MOODS.map((m) => {
    const n = filterJobs(state.all, { ...EMPTY_FILTERS, types: [], ...m.patch }, state.ref).length;
    return `<button type="button" class="mood ${m.tone}" data-mood='${esc(JSON.stringify(m.patch))}'>
      <span class="mood-title">${m.title}</span>
      <span class="mood-chip">${ribu(n)} ${m.unit}</span>
      <svg class="mood-icon"><use href="#i-${m.icon}"/></svg>
      <img src="${m.img}" alt="" loading="lazy">
    </button>`;
  }).join('');
}

function renderCheer() {
  const m = todayMessage();
  $('#hero-bubble').textContent = m.bubble;
  if (!state.loaded || !state.all.length) {
    $('#cheer').innerHTML = '';
    return;
  }
  const fresh = summarize(state.all, state.ref).fresh;
  $('#cheer').innerHTML = `
    <div class="cheer-art"><img src="orang-bima.svg" alt=""></div>
    <div>
      <p class="cheer-eyebrow"><svg><use href="#i-heart"/></svg>Pesan hari ini untuk yang masih berjuang</p>
      <h2>${esc(m.title)}</h2>
      <p>${esc(m.body.replace('{fresh}', ribu(fresh)))}</p>
    </div>
    <button type="button" class="btn cta" data-mood='{"waktu":"1"}'>Lihat ${ribu(fresh)} lowongan baru <span class="cta-dot"><svg><use href="#i-play"/></svg></span></button>`;
}

function logoHTML(job, cls = '') {
  const src = job.logo ? (/^https?:/.test(job.logo) ? job.logo : state.logoBase + job.logo) : '';
  const mono = `logo m${hue(job.company)} ${cls}`;
  if (!src) return `<span class="${mono}" aria-hidden="true">${esc(initials(job.company))}</span>`;
  return `<span class="${mono}" data-ini="${esc(initials(job.company))}" aria-hidden="true"><img src="${esc(src)}" alt="" loading="lazy" referrerpolicy="no-referrer"></span>`;
}

function place(job) {
  return cityLabel(job.city) || job.province || 'Indonesia';
}

function cardHTML(job, closed = false) {
  const isNew = !closed && job.posted >= state.ref - 86400;
  const pay = salaryText(job.smin, job.smax);
  const saved = state.saved.some((s) => s.id === job.id);
  const tags = [
    closed ? '<span class="tag">Sudah ditutup</span>' : '',
    isNew ? '<span class="tag new">Baru</span>' : '',
    `<span class="tag">${icon('pin')}${esc(place(job))}</span>`,
    job.type ? `<span class="tag">${esc(job.type)}</span>` : '',
    job.edu ? `<span class="tag">Min. ${esc(EDU_SHORT[job.edu] || job.edu)}</span>` : ''
  ].join('');
  return `<div class="job" data-id="${esc(job.id)}">
    <div class="job-top">
      ${logoHTML(job)}
      <div class="job-head">
        <h3 class="job-title"><a href="?id=${encodeURIComponent(job.id)}" data-open="${esc(job.id)}" style="text-decoration:none">${esc(job.title)}</a></h3>
        <p class="job-co">${esc(job.company)}</p>
      </div>
      <button type="button" class="save${saved ? ' on' : ''}" data-save="${esc(job.id)}" aria-label="${saved ? 'Hapus dari simpanan' : 'Simpan lowongan'}" aria-pressed="${saved}">${icon('bookmark')}</button>
    </div>
    <div class="job-tags">${tags}</div>
    <div class="job-foot">
      <span class="pay${pay ? '' : ' none'}">${pay || 'Gaji tidak dicantumkan'}</span>
      <span class="when"><b>${esc(ago(job.posted, nowSec()))}</b>${esc(job.platform)}</span>
    </div>
  </div>`;
}

function renderResults() {
  if (!state.loaded) return;
  const { list, shown } = state;
  const listEl = $('#job-list');
  $('#result-count').textContent = state.all.length ? `${ribu(list.length)} lowongan` : 'Belum ada data';
  const n = activeCount(state.f) + (state.f.q ? 1 : 0);
  const major = findMajor(state.f.jur);
  $('#result-note').textContent = !state.all.length ? '' : state.f.jur
    ? `dari ${ribu(state.all.length)} lowongan aktif · ${major ? `cocok untuk jurusan ${major.label}, dilihat dari bidang dan judul lowongan` : `bidang atau judulnya memuat "${state.f.jur}"`}`
    : n ? `dari ${ribu(state.all.length)} lowongan aktif` : 'Semua lowongan aktif, terbaru di atas';
  if (!state.all.length) {
    listEl.innerHTML = `<div class="empty">${emptyArt('orang-sari.svg', 'yellow')}<b>Data pertama sedang disiapkan</b><p>Lowongan dari Karirhub Kemnaker dan situs karier perusahaan ditarik otomatis setiap pagi pukul 06.00 WIB.</p></div>`;
    $('#more').hidden = true;
    return;
  }
  if (!list.length) {
    listEl.innerHTML = `<div class="empty">${emptyArt('orang-nadia.svg')}<b>Belum ketemu yang cocok</b><p>Coba kata kunci lain atau longgarkan filternya. Lowongan baru masuk setiap pagi, jadi besok bisa saja muncul.</p><button class="btn cta" type="button" data-reset>Hapus semua filter <span class="cta-dot"><svg><use href="#i-play"/></svg></span></button></div>`;
    $('#more').hidden = true;
    return;
  }
  listEl.innerHTML = list.slice(0, shown).map((j) => cardHTML(j)).join('');
  const more = $('#more');
  more.hidden = shown >= list.length;
  more.textContent = `Tampilkan ${ribu(Math.min(PAGE, list.length - shown))} lagi`;
}

function showMore() {
  const start = state.shown;
  state.shown += PAGE;
  $('#job-list').insertAdjacentHTML('beforeend', state.list.slice(start, state.shown).map((j) => cardHTML(j)).join(''));
  const more = $('#more');
  more.hidden = state.shown >= state.list.length;
  more.textContent = `Tampilkan ${ribu(Math.min(PAGE, state.list.length - state.shown))} lagi`;
}

function setFilters(patch, scroll = true) {
  state.f = { ...state.f, ...patch };
  if ('prov' in patch && patch.prov !== undefined && !('city' in patch)) state.f.city = '';
  apply(scroll);
}

function syncURL() {
  const qs = filtersToQuery(state.f);
  const p = new URLSearchParams(qs);
  if (state.openId) p.set('id', state.openId);
  const s = p.toString();
  history.replaceState(null, '', `${location.pathname}${s ? `?${s}` : ''}${location.hash}`);
}

// ---------------------------------------------------------------- pasar

function renderPasar() {
  if (!state.loaded) return;
  const scopeProv = state.pasarProv;
  const list = scopeProv ? state.all.filter((j) => j.province === scopeProv) : state.all;
  const provs = countBy(state.all, 'province').sort((a, b) => a[0].localeCompare(b[0], 'id'));
  $('#pasar-prov').innerHTML = optionList(provs, 'Seluruh Indonesia', scopeProv);
  $('#pasar-title').textContent = scopeProv || 'Seluruh Indonesia';
  const bento = $('#bento');
  if (!state.all.length) {
    $('#pasar-scope').textContent = '';
    bento.innerHTML = `<div class="tile wide"><div class="empty" style="box-shadow:none;padding:24px">${emptyArt('orang-sari.svg', 'yellow')}<b>Analisis muncul setelah data pertama masuk</b></div></div>`;
    return;
  }
  const s = summarize(list, state.ref);
  $('#pasar-scope').textContent = `${ribu(s.total)} lowongan aktif per ${dateText(state.ref, true)}. Klik baris mana pun untuk melihat lowongannya.`;

  const days = state.days;
  const last = days[days.length - 1];
  const prev = days[days.length - 2];
  const delta = !scopeProv && last && prev ? last.active - prev.active : null;
  const deltaText = delta === null ? 'Perubahan harian muncul mulai besok'
    : `${delta >= 0 ? '+' : '−'}${ribu(Math.abs(delta))} dibanding kemarin`;

  const where = scopeProv ? countBy(list, 'city', 10).map(([v, n]) => [cityLabel(v), n, { prov: scopeProv, city: v }])
    : countBy(list, 'province', 10).map(([v, n]) => [v, n, { prov: v }]);
  const base = scopeProv ? { prov: scopeProv } : {};
  const fns = countBy(list, 'fn', 10).map(([v, n]) => [v, n, { ...base, fn: v }]);
  const cos = countBy(list, 'company', 8);
  const pay = salaryBy(list, 'fn', scopeProv ? 3 : 10, 8);
  const edu = countBy(list, (j) => j.edu ? (EDU_SHORT[j.edu] === 'SMA' || EDU_SHORT[j.edu] === 'SMK' ? 'SMA/SMK' : eduGroup(j.edu)) : 'Tidak disebut');
  const types = countBy(list, (j) => j.type || 'Tidak disebut', 6);
  const srcs = countBy(list, 'platform', 8).map(([v, n]) => [v, n, { ...base, src: v }]);

  bento.innerHTML = `
    <div class="tile kpi navy"><span class="kpi-label">Lowongan aktif</span><span class="kpi-value">${ribu(s.total)}</span><span class="kpi-delta tile-sub">${scopeProv ? `${pct(s.total, state.all.length)} dari seluruh Indonesia` : deltaText}</span></div>
    <div class="tile kpi yellow"><span class="kpi-label">Diposting 24 jam terakhir</span><span class="kpi-value">${ribu(s.fresh)}</span><span class="tile-sub">${pct(s.fresh, s.total)} dari lowongan aktif</span></div>
    <div class="tile kpi green"><span class="kpi-label">Perusahaan merekrut</span><span class="kpi-value">${ribu(s.companies)}</span><span class="tile-sub">rata-rata ${(s.total / Math.max(1, s.companies)).toFixed(1).replace('.', ',')} lowongan per perusahaan</span></div>
    <div class="tile kpi pink"><span class="kpi-label">Median gaji tercantum</span><span class="kpi-value">${s.medianPay ? `<small>Rp</small>${juta(s.medianPay).replace(' jt', '<small> jt</small>')}` : '–'}</span><span class="tile-sub">hanya ${s.salariedPct}% lowongan mencantumkan gaji</span></div>

    <div class="tile wide trend"><div class="tile-head"><span class="tile-title">Lowongan aktif dari hari ke hari</span><span class="tile-sub">Seluruh Indonesia · garis = aktif, batang = baru terdeteksi</span></div><div id="trend"></div></div>

    <div class="tile" data-tone="blue"><div class="tile-head"><span class="tile-title">${scopeProv ? 'Kota/kabupaten terbanyak' : 'Provinsi terbanyak'}</span><span class="tile-sub">jumlah lowongan</span></div>${barsHTML(where)}</div>
    <div class="tile" data-tone="green"><div class="tile-head"><span class="tile-title">Bidang paling dicari</span><span class="tile-sub">jumlah lowongan</span></div>${barsHTML(fns)}</div>
    <div class="tile"><div class="tile-head"><span class="tile-title">Paling aktif merekrut</span><span class="tile-sub">lowongan terbuka</span></div>
      <div class="co-list">${cos.map(([name, n]) => {
        const job = list.find((j) => j.company === name);
        return `<button type="button" class="co-row" data-patch='${esc(JSON.stringify({ ...base, q: name }))}'>${logoHTML(job)}<span>${esc(name)}</span><b>${ribu(n)}</b></button>`;
      }).join('')}</div></div>
    <div class="tile" data-tone="pink"><div class="tile-head"><span class="tile-title">Median gaji per bidang</span><span class="tile-sub">dari lowongan yang mencantumkan gaji</span></div>
      ${pay.length ? barsHTML(pay.map((p) => [p.name, p.median, { ...base, fn: p.name, gaji: 'ada' }, `Rp${juta(p.median)}`, `${ribu(p.n)} data`])) : '<p class="note">Belum cukup lowongan bergaji untuk dihitung.</p>'}</div>

    <div class="tile"><div class="tile-head"><span class="tile-title">Siapa yang dicari</span><span class="tile-sub">porsi dari lowongan aktif</span></div>
      <div class="mix">
        <div class="mix-block"><h4>Syarat pendidikan minimal</h4>${stackHTML(edu, list.length, 'edu')}</div>
        <div class="mix-block"><h4>Tipe pekerjaan</h4>${stackHTML(types, list.length, 'type')}</div>
      </div></div>
    <div class="tile" data-tone="orange"><div class="tile-head"><span class="tile-title">Sumber lowongan</span><span class="tile-sub">platform asal di Karirhub</span></div>${barsHTML(srcs)}</div>
  `;
  bento._edu = edu;
  renderTrend();
}

function eduGroup(name) {
  const lvl = EDU_LEVEL[name];
  if (lvl === undefined) return name;
  if (lvl <= 20) return 'SD/SMP';
  if (lvl === 40) return 'Diploma';
  if (name === 'Sarjana' || name === 'Profesi') return 'S1';
  return 'S2/S3';
}

const pct = (a, b) => `${b ? Math.round((a / b) * 100) : 0}%`;

function barsHTML(rows) {
  if (!rows.length) return '<p class="note">Belum ada data.</p>';
  const max = Math.max(...rows.map((r) => r[1]));
  return `<div class="bars">${rows.map(([name, n, patch, label, title]) => `
    <button type="button" class="bar${patch ? '' : ' static'}" ${patch ? `data-patch='${esc(JSON.stringify(patch))}'` : ''} ${title ? `title="${esc(title)}"` : ''}>
      <span class="bar-name">${esc(name)}</span><span class="bar-val">${label || ribu(n)}</span>
      <span class="bar-track"><span class="bar-fill" style="width:${Math.max(2, (n / max) * 100).toFixed(1)}%"></span></span>
    </button>`).join('')}</div>`;
}

const STACK_COLORS = ['#1E2257', '#FFC83D', '#2E9E62', '#F27BA0', '#5B8DEF', '#F28C4E', '#E8DCCD'];

function stackHTML(rows, total, kind) {
  if (!rows.length) return '<p class="note">Belum ada data.</p>';
  const segs = rows.map(([name, n], i) => ({ name, n, color: STACK_COLORS[i % STACK_COLORS.length] }));
  return `<div class="stack">${segs.map((s) => `<span style="flex:${s.n};background:${s.color}" title="${esc(s.name)}: ${ribu(s.n)}"></span>`).join('')}</div>
    <div class="legend">${segs.map((s) => `<button type="button" data-stack="${kind}" data-value="${esc(s.name)}"><i style="background:${s.color}"></i>${esc(s.name)} <b>${pct(s.n, total)}</b></button>`).join('')}</div>`;
}

function renderTrend() {
  const box = $('#trend');
  if (!box) return;
  const days = state.days.filter((d) => d.active);
  if (days.length < 2) {
    box.innerHTML = `<div class="trend-empty">${emptyArt('orang-dimas.svg', 'blue')}<div><b>Grafik tren sedang tumbuh</b>Garisnya muncul setelah data terkumpul minimal 2 hari. Hari ini tercatat ${ribu(days[0]?.active || state.all.length)} lowongan aktif.</div></div>`;
    return;
  }
  const W = Math.max(280, box.clientWidth);
  const H = 200;
  const pad = { l: 8, r: 8, t: 22, b: 24 };
  const vals = days.map((d) => d.active);
  const lo = Math.min(...vals) * 0.97;
  const hi = Math.max(...vals) * 1.01;
  const step = (W - pad.l - pad.r) / (days.length - 1);
  const x = (i) => pad.l + i * step;
  const y = (v) => pad.t + (1 - (v - lo) / (hi - lo || 1)) * (H - pad.t - pad.b);
  const news = days.map((d) => d.new || 0);
  const maxNew = Math.max(1, ...news);
  const barW = Math.max(3, Math.min(18, step * 0.5));
  const line = days.map((d, i) => `${i ? 'L' : 'M'}${x(i).toFixed(1)},${y(d.active).toFixed(1)}`).join('');
  const area = `${line}L${x(days.length - 1).toFixed(1)},${H - pad.b}L${x(0).toFixed(1)},${H - pad.b}Z`;
  const bars = days.map((d, i) => {
    const h = ((d.new || 0) / maxNew) * (H - pad.t - pad.b) * 0.35;
    return `<rect x="${(x(i) - barW / 2).toFixed(1)}" y="${(H - pad.b - h).toFixed(1)}" width="${barW.toFixed(1)}" height="${h.toFixed(1)}" rx="3" fill="#FFC83D"/>`;
  }).join('');
  const hits = days.map((d, i) => `<rect x="${(x(i) - step / 2).toFixed(1)}" y="0" width="${step.toFixed(1)}" height="${H}" fill="transparent"><title>${d.d.split('-').reverse().join('-')}: ${ribu(d.active)} aktif${d.new != null ? `, ${ribu(d.new)} baru, ${ribu(d.closed)} ditutup` : ''}</title></rect>`).join('');
  const lastI = days.length - 1;
  const fmt = (d) => { const [, m, dd] = d.split('-'); return `${+dd} ${['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'][+m - 1]}`; };
  box.innerHTML = `<svg viewBox="0 0 ${W} ${H}" width="${W}" height="${H}" role="img" aria-label="Grafik lowongan aktif per hari">
    <defs><linearGradient id="g-area" x1="0" x2="0" y1="0" y2="1"><stop offset="0" stop-color="#1E2257" stop-opacity=".12"/><stop offset="1" stop-color="#1E2257" stop-opacity="0"/></linearGradient></defs>
    ${bars}
    <path d="${area}" fill="url(#g-area)" stroke="none"/>
    <path d="${line}" fill="none" stroke="#1E2257" stroke-width="2.2"/>
    <circle cx="${x(lastI)}" cy="${y(vals[lastI])}" r="5" fill="#1E2257" stroke="#fff" stroke-width="2.5"/>
    <text class="axis" x="${pad.l}" y="${H - 6}">${fmt(days[0].d)}</text>
    <text class="axis" x="${W - pad.r}" y="${H - 6}" text-anchor="end">${fmt(days[lastI].d)}</text>
    <text class="axis" x="${x(lastI) - 10}" y="${vals[lastI - 1] > vals[lastI] ? y(vals[lastI]) + 20 : Math.max(12, y(vals[lastI]) - 12)}" text-anchor="end" style="fill:#1E2257;font-weight:600">${ribu(vals[lastI])}</text>
    ${hits}
  </svg>`;
}

// ---------------------------------------------------------------- simpanan

function loadSaved() {
  try { return JSON.parse(localStorage.getItem(SAVED_KEY) || '[]').filter((s) => s && s.id); } catch { return []; }
}

function storeSaved() {
  try { localStorage.setItem(SAVED_KEY, JSON.stringify(state.saved)); } catch { /* mode privat */ }
}

function toggleSave(id) {
  const idx = state.saved.findIndex((s) => s.id === id);
  if (idx >= 0) {
    state.saved.splice(idx, 1);
    toast('Dihapus dari simpanan');
  } else {
    const j = state.byId.get(id);
    if (!j) return;
    const { hay, ...snap } = j;
    state.saved.unshift({ ...snap, savedAt: nowSec() });
    toast('Disimpan di perangkat ini');
  }
  storeSaved();
  updateSavedBadge();
  for (const el of document.querySelectorAll(`[data-save="${CSS.escape(id)}"]`)) {
    const on = state.saved.some((s) => s.id === id);
    el.classList.toggle('on', on);
    el.setAttribute('aria-pressed', on);
  }
  if (state.view === 'simpan') renderSaved();
}

function updateSavedBadge() {
  const b = $('#saved-count');
  b.hidden = !state.saved.length;
  b.textContent = state.saved.length;
}

function renderSaved() {
  const box = $('#saved-list');
  if (!state.saved.length) {
    box.innerHTML = `<div class="empty">${emptyArt('orang-putri.svg', 'blue')}<b>Belum ada lowongan incaran</b><p>Ketuk ikon penanda di kartu lowongan untuk menyimpannya di sini, supaya tidak lupa dilamar. Simpanan hanya ada di perangkat ini.</p><a class="btn cta" href="#cari">Cari lowongan <span class="cta-dot"><svg><use href="#i-play"/></svg></span></a></div>`;
    return;
  }
  box.innerHTML = state.saved.map((s) => {
    const live = state.byId.get(s.id);
    return cardHTML(live || s, state.loaded && !live);
  }).join('');
}

// ---------------------------------------------------------------- detail

function openJob(id) {
  const job = state.byId.get(id) || state.saved.find((s) => s.id === id);
  if (!job) {
    toast('Lowongan ini sudah tidak aktif');
    return;
  }
  const closed = !state.byId.has(id);
  state.openId = id;
  syncURL();
  const pay = salaryText(job.smin, job.smax);
  const saved = state.saved.some((s) => s.id === id);
  const kh = karirhubUrl(job);
  const facts = [
    ['Lokasi', [cityLabel(job.city), job.province].filter(Boolean).join(', ') || 'Indonesia'],
    ['Tipe pekerjaan', job.type],
    ['Pendidikan minimal', job.edu],
    ['Bidang', job.fn],
    ['Industri', job.industry],
    ['Diposting', job.posted ? `${dateText(job.posted, true)} · ${ago(job.posted, nowSec())}` : ''],
    ['Batas tayang', job.expires ? dateText(job.expires, true) : ''],
    ['Sumber', job.platform]
  ].filter(([, v]) => v);

  $('#drawer-inner').innerHTML = `
    <div class="d-bar">
      <button class="round" type="button" data-close aria-label="Tutup">${icon('x')}</button>
      <div class="d-bar-actions">
        <button class="round" type="button" data-share aria-label="Bagikan">${icon('share')}</button>
        <button class="round${saved ? ' on' : ''}" type="button" data-save="${esc(id)}" aria-label="Simpan" aria-pressed="${saved}">${icon('bookmark')}</button>
      </div>
    </div>
    <div class="d-head">
      ${logoHTML(job)}
      <div><h2 class="d-title" id="d-title">${esc(job.title)}</h2><p class="d-co">${esc(job.company)}</p></div>
    </div>
    ${closed ? '<div class="warn-box">Lowongan ini sudah tidak muncul di sumbernya, kemungkinan sudah ditutup.</div>' : ''}
    <div class="d-pay${pay ? '' : ' none'}"><b>${pay || 'Gaji tidak dicantumkan'}</b>${pay ? '<span>per bulan</span>' : ''}</div>
    <div class="facts">${facts.map(([k, v]) => `<div class="fact"><span>${k}</span><b>${esc(v)}</b></div>`).join('')}</div>
    <div class="d-section" id="d-detail">${job.via === 'karirhub' ? '<div class="d-load"></div>' : `<p class="d-text">Deskripsi lengkap dan formulir lamaran ada di situs karier ${esc(job.company)}.</p>`}</div>
    ${closed ? '' : `<div class="cheer-note">${icon('heart')}<span>Semoga lolos! Baca lagi kualifikasinya dan sesuaikan CV-mu sebelum melamar.</span></div>`}
    <div class="warn-box">Lowongan resmi tidak memungut biaya apa pun. Waspadai permintaan transfer uang, biaya pelatihan, atau seragam.</div>
    <div class="d-actions">
      <a class="btn cta" id="apply-link" href="${esc(kh || '#')}" target="_blank" rel="noopener">Lamar di ${esc(job.via === 'karirhub' ? 'Karirhub' : job.platform)} <span class="cta-dot">${icon('arrow')}</span></a>
      <a class="btn outline" id="kh-link" href="${esc(kh)}" target="_blank" rel="noopener" hidden>Lihat di Karirhub</a>
    </div>`;
  $('#drawer').hidden = false;
  $('#scrim').hidden = false;
  document.body.classList.add('lock');
  $('#drawer').focus({ preventScroll: true });

  applyLink(job);
  if (job.via === 'karirhub') loadDetail(job);
}

async function applyLink(job) {
  try {
    if (!state.links) state.links = getJSON('links.json').catch(() => ({}));
    const links = await state.links;
    const url = links[job.id];
    if (!url || state.openId !== job.id) return;
    setApply(job, url);
  } catch { /* tetap pakai tautan Karirhub */ }
}

function setApply(job, url) {
  const a = $('#apply-link');
  if (!a || !url) return;
  a.href = url;
  const host = job.via === 'karirhub' ? job.platform : job.company;
  a.innerHTML = `Lamar di ${esc(host)} <span class="cta-dot">${icon('arrow')}</span>`;
  const kh = $('#kh-link');
  if (kh && kh.getAttribute('href')) kh.hidden = false;
}

async function loadDetail(job) {
  const box = $('#d-detail');
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), 8000);
  try {
    const res = await fetch(KARIRHUB_DETAIL_API + encodeURIComponent(job.id), { signal: ctrl.signal, headers: { Accept: 'application/json' } });
    if (!res.ok) throw new Error(res.status);
    const d = (await res.json()).data || {};
    if (state.openId !== job.id) return;
    const desc = htmlToText(d.description);
    const qual = htmlToText(d.qualification);
    const req = [];
    if (d.min_year_experience != null) req.push(d.min_year_experience ? `Pengalaman minimal ${d.min_year_experience} tahun` : 'Terbuka untuk tanpa pengalaman');
    if (d.min_age && d.max_age) req.push(`Usia ${d.min_age}–${d.max_age} tahun`);
    const g = { male: 'Laki-laki', female: 'Perempuan' }[String(d.gender || '').toLowerCase()];
    if (g) req.push(`Khusus ${g.toLowerCase()}`);
    const skills = (d.skills || []).map((s) => (typeof s === 'string' ? s : s && s.name)).filter(Boolean);
    if (skills.length) req.push(`Keterampilan: ${skills.join(', ')}`);
    const addr = d.employer && d.employer.address;
    box.innerHTML = [
      desc && `<h3>Deskripsi pekerjaan</h3><p class="d-text clamp" id="d-desc">${esc(desc)}</p>`,
      qual && `<h3 style="margin-top:8px">Kualifikasi</h3><p class="d-text">${esc(qual)}</p>`,
      req.length && `<h3 style="margin-top:8px">Syarat lain</h3><p class="d-text">${req.map(esc).join('\n')}</p>`,
      addr && `<h3 style="margin-top:8px">Alamat</h3><p class="d-text">${esc(addr)}</p>`
    ].filter(Boolean).join('') || '<p class="d-text">Perusahaan tidak menulis deskripsi tambahan.</p>';
    const descEl = $('#d-desc');
    if (descEl && descEl.scrollHeight > 280) {
      descEl.insertAdjacentHTML('afterend', '<button class="linkish" type="button" data-expand>Baca selengkapnya</button>');
    } else if (descEl) {
      descEl.classList.remove('clamp');
    }
    if (d.platform_link && !(await (state.links || Promise.resolve({})))[job.id]) {
      setApply(job, d.platform_link);
    }
  } catch {
    if (state.openId !== job.id) return;
    box.innerHTML = '<p class="d-text">Deskripsi lengkap dan syarat melamar ada di halaman lowongan aslinya.</p>';
  } finally {
    clearTimeout(timer);
  }
}

function closeJob() {
  if (!state.openId) return;
  const id = state.openId;
  state.openId = '';
  $('#drawer').hidden = true;
  $('#scrim').hidden = true;
  document.body.classList.remove('lock');
  syncURL();
  const card = document.querySelector(`.view:not([hidden]) [data-open="${CSS.escape(id)}"]`);
  if (card) card.focus({ preventScroll: true });
}

async function share() {
  const job = state.byId.get(state.openId);
  const url = `${location.origin}${location.pathname}?id=${encodeURIComponent(state.openId)}`;
  const text = job ? `${job.title} di ${job.company}` : 'Lowongan';
  try {
    if (navigator.share) {
      await navigator.share({ title: text, text, url });
      return;
    }
    await navigator.clipboard.writeText(url);
    toast('Tautan lowongan disalin');
  } catch { /* dibatalkan */ }
}

// ---------------------------------------------------------------- tampilan & event

function viewFromHash() {
  const h = location.hash.replace('#', '');
  return ['cari', 'pasar', 'simpan'].includes(h) ? h : 'cari';
}

function setView(view, scroll = true) {
  state.view = view;
  for (const el of document.querySelectorAll('.view')) el.hidden = el.dataset.view !== view;
  for (const el of document.querySelectorAll('.tab')) el.classList.toggle('on', el.dataset.view === view);
  if (view === 'pasar') renderPasar();
  if (view === 'simpan') renderSaved();
  if (scroll) window.scrollTo({ top: 0 });
}

let toastTimer;
function toast(msg) {
  const t = $('#toast');
  t.textContent = msg;
  t.hidden = false;
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => { t.hidden = true; }, 2200);
}

function openFilters(open) {
  $('#filters').classList.toggle('open', open);
  $('#scrim').hidden = !open && !state.openId;
  document.body.classList.toggle('lock', open || !!state.openId);
}

function bindEvents() {
  let typing;
  let typingJur;
  $('#q').addEventListener('input', (e) => {
    clearTimeout(typing);
    typing = setTimeout(() => setFilters({ q: e.target.value.trim() }, false), 160);
  });
  $('#searchbar').addEventListener('submit', (e) => {
    e.preventDefault();
    clearTimeout(typing);
    $('#q').blur();
    clearTimeout(typingJur);
    setFilters({ q: $('#q').value.trim(), jur: $('#jur').value.trim() });
  });
  $('#prov-top').addEventListener('change', (e) => setFilters({ prov: e.target.value }, false));
  $('#f-prov').addEventListener('change', (e) => setFilters({ prov: e.target.value }, false));
  $('#f-city').addEventListener('change', (e) => setFilters({ city: e.target.value }, false));
  $('#f-fn').addEventListener('change', (e) => setFilters({ fn: e.target.value }, false));
  $('#f-src').addEventListener('change', (e) => setFilters({ src: e.target.value }, false));
  $('#sort').addEventListener('change', (e) => setFilters({ sort: e.target.value }, false));
  $('#pasar-prov').addEventListener('change', (e) => { state.pasarProv = e.target.value; renderPasar(); });
  $('#more').addEventListener('click', showMore);
  $('#reset').addEventListener('click', () => { state.f = { ...EMPTY_FILTERS, types: [], q: state.f.q, jur: state.f.jur, sort: state.f.sort }; apply(false); });
  $('#majors').innerHTML = MAJORS.map((m) => `<option value="${esc(m.label)}"></option>`).join('');
  $('#jur').addEventListener('input', (e) => {
    clearTimeout(typingJur);
    const v = e.target.value.trim();
    // Pilihan dari daftar langsung dipakai; ketikan bebas ditunggu sebentar.
    const picked = MAJORS.some((m) => m.label === v);
    typingJur = setTimeout(() => setFilters({ jur: v }, false), picked ? 0 : 350);
  });
  $('#open-filters').addEventListener('click', () => openFilters(true));
  window.addEventListener('hashchange', () => setView(viewFromHash()));

  document.addEventListener('click', (e) => {
    const t = e.target;
    const save = t.closest('[data-save]');
    if (save) { e.preventDefault(); toggleSave(save.dataset.save); return; }
    if (t.closest('[data-close]') || t.closest('#scrim')) {
      if ($('#filters').classList.contains('open')) openFilters(false); else closeJob();
      return;
    }
    if (t.closest('[data-close-filters]')) { openFilters(false); return; }
    if (t.closest('[data-share]')) { share(); return; }
    if (t.closest('[data-expand]')) {
      $('#d-desc')?.classList.remove('clamp');
      t.closest('[data-expand]').remove();
      return;
    }
    const chip = t.closest('[data-edu],[data-gaji],[data-waktu],[data-type]');
    if (chip) {
      const d = chip.dataset;
      if ('edu' in d) setFilters({ edu: d.edu }, false);
      else if ('gaji' in d) setFilters({ gaji: d.gaji }, false);
      else if ('waktu' in d) setFilters({ waktu: d.waktu }, false);
      else {
        const set = new Set(state.f.types);
        set.has(d.type) ? set.delete(d.type) : set.add(d.type);
        setFilters({ types: [...set] }, false);
      }
      return;
    }
    const jurChip = t.closest('[data-jur]');
    if (jurChip) { setFilters({ jur: jurChip.dataset.jur }, false); return; }
    const unset = t.closest('[data-unset]');
    if (unset) { setFilters($('#active-chips')._patches[+unset.dataset.unset], false); return; }
    if (t.closest('[data-reset]')) { state.f = { ...EMPTY_FILTERS, types: [] }; apply(false); return; }
    const mood = t.closest('[data-mood]');
    if (mood) {
      state.f = { ...EMPTY_FILTERS, types: [], q: state.f.q, jur: state.f.jur, prov: state.f.prov, city: state.f.city, ...JSON.parse(mood.dataset.mood) };
      apply(false);
      window.scrollTo({ top: $('.layout').getBoundingClientRect().top + window.scrollY - 12, behavior: 'smooth' });
      return;
    }
    const patch = t.closest('[data-patch]');
    if (patch) {
      state.f = { ...EMPTY_FILTERS, types: [], ...JSON.parse(patch.dataset.patch) };
      location.hash = 'cari';
      apply(false);
      window.scrollTo({ top: $('.layout').offsetTop - 12 });
      return;
    }
    const stack = t.closest('[data-stack]');
    if (stack) {
      const v = stack.dataset.value;
      const base = state.pasarProv ? { prov: state.pasarProv } : {};
      if (stack.dataset.stack === 'type' && v !== 'Tidak disebut') {
        state.f = { ...EMPTY_FILTERS, ...base, types: [v] };
      } else if (stack.dataset.stack === 'edu') {
        const key = { 'SD/SMP': 'smp', 'SMA/SMK': 'sma', Diploma: 'd3', S1: 's1', 'S2/S3': 's2' }[v];
        if (!key) return;
        state.f = { ...EMPTY_FILTERS, ...base, types: [], edu: key };
      } else return;
      location.hash = 'cari';
      apply(false);
      window.scrollTo({ top: $('.layout').offsetTop - 12 });
      return;
    }
    const open = t.closest('[data-open]') || t.closest('.job');
    if (open) {
      e.preventDefault();
      openJob(open.dataset.open || open.dataset.id);
    }
  });

  // Logo perusahaan yang gagal dimuat diganti inisial.
  document.addEventListener('error', (e) => {
    const img = e.target;
    if (img.tagName !== 'IMG' || !img.parentElement?.classList.contains('logo')) return;
    const box = img.parentElement;
    box.textContent = box.dataset.ini || '?';
  }, true);

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      if ($('#filters').classList.contains('open')) openFilters(false);
      else closeJob();
    }
    if (e.key === '/' && document.activeElement.tagName !== 'INPUT' && state.view === 'cari') {
      e.preventDefault();
      $('#q').focus();
    }
  });

  let resize;
  window.addEventListener('resize', () => {
    clearTimeout(resize);
    resize = setTimeout(() => { if (state.view === 'pasar') renderTrend(); }, 150);
  });
}

boot();
