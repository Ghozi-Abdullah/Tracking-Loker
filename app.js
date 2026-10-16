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
  { tone: 'blue', title: 'Lulusan SMA/SMK', unit: 'lowongan', icon: 'star', img: 'foto-mekanik.webp', fit: 'right:0', patch: { edu: 'sma' } },
  { tone: 'green', title: 'Mau magang dulu', unit: 'magang', icon: 'cap', img: 'foto-magang.webp', fit: 'right:0', patch: { types: ['Magang'] } },
  { tone: 'pink', title: 'Baru masuk hari ini', unit: 'dalam 24 jam', icon: 'bolt', img: 'foto-chef.webp', fit: 'right:5%', patch: { waktu: '1' } },
  { tone: 'yellow', title: 'Gaji di atas 5 juta', unit: 'lowongan', icon: 'coin', img: 'foto-perawat.webp', fit: 'right:7%', patch: { gaji: '5' } }
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
      <img src="${m.img}" alt="" loading="lazy" style="${m.fit}">
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
    <div class="cheer-art"><img src="foto-eksekutif.webp" alt=""></div>
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
    listEl.innerHTML = `<div class="empty">${emptyArt('foto-kantor.webp', 'yellow')}<b>Data pertama sedang disiapkan</b><p>Lowongan dari Karirhub Kemnaker dan situs karier perusahaan ditarik otomatis setiap pagi pukul 06.00 WIB.</p></div>`;
    $('#more').hidden = true;
    return;
  }
  if (!list.length) {
    listEl.innerHTML = `<div class="empty">${emptyArt('foto-magang.webp', 'green')}<b>Belum ketemu yang cocok</b><p>Coba kata kunci lain atau longgarkan filternya. Lowongan baru masuk setiap pagi, jadi besok bisa saja muncul.</p><button class="btn cta" type="button" data-reset>Hapus semua filter <span class="cta-dot"><svg><use href="#i-play"/></svg></span></button></div>`;
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
    bento.innerHTML = `<div class="tile wide"><div class="empty" style="box-shadow:none;padding:24px">${emptyArt('foto-kantor.webp', 'yellow')}<b>Analisis muncul setelah data pertama masuk</b></div></div>`;
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

    <div class="tile wide trend">
      <div class="tile-head trend-head">
        <div><span class="tile-title">Lowongan dari hari ke hari</span><p class="trend-sum" id="trend-sum"></p></div>
        <div class="trend-ctrl">
        <div class="seg" id="trend-range" role="group" aria-label="Rentang waktu" hidden>
          <button type="button" class="on" data-trend-range="30" aria-pressed="true">30 hari</button>
          <button type="button" data-trend-range="0" aria-pressed="false">Semua</button>
        </div>
        <div class="seg" role="group" aria-label="Tampilan tren">
          <button type="button" class="on" data-trend-view="chart" aria-pressed="true">Grafik</button>
          <button type="button" data-trend-view="table" aria-pressed="false">Tabel</button>
        </div>
        </div>
      </div>
      <div id="trend"></div>
    </div>

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

const BULAN_PENDEK = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
const tgl = (d, year = false) => { const [y, m, dd] = d.split('-'); return `${+dd} ${BULAN_PENDEK[+m - 1]}${year ? ` ${y}` : ''}`; };
const signed = (n) => (n > 0 ? `+${ribu(n)}` : n < 0 ? `−${ribu(-n)}` : '0');
const C_LINE = '#1E2257';
const C_NEW = '#2E9E62';
const C_CLOSED = '#F27BA0';

// Skala sumbu Y yang bulat: kelipatan 1, 2, 5 × 10^n, dan batas bawah/atas ikut jatuh di garis bantu.
function yScale(min, max, count = 4) {
  const span = Math.max(max - min, max * 0.01, 10);
  const raw = span * 1.4 / count;
  const mag = 10 ** Math.floor(Math.log10(raw));
  const step = [1, 2, 5, 10].map((k) => k * mag).find((v) => v >= raw);
  const lo = Math.floor((min - span * 0.2) / step) * step;
  const hi = Math.ceil((max + span * 0.2) / step) * step;
  const ticks = [];
  for (let v = lo; v <= hi + step / 2; v += step) ticks.push(Math.round(v));
  return { lo, hi, ticks, step };
}
function tickText(v, step) {
  if (step < 10) return ribu(v);
  const dec = step >= 1000 ? 0 : step >= 100 ? 1 : 2;
  return `${(v / 1000).toFixed(dec).replace(/(\.\d*?)0+$/, '$1').replace(/\.$/, '').replace('.', ',')} rb`;
}
// Label tanggal dihitung mundur dari hari terakhir supaya tanggal terbaru selalu tampil dan jaraknya rata.
function dateMarks(n, width) {
  const every = Math.max(1, Math.ceil(n / Math.max(2, Math.floor(width / 64))));
  const out = [];
  for (let i = n - 1; i >= 0; i -= every) out.push(i);
  return out;
}

state.trendView = 'chart';
state.trendRange = 30;

function renderTrend() {
  const box = $('#trend');
  if (!box) return;
  const all = state.days.filter((d) => d.active);
  const sum = $('#trend-sum');
  const ranges = $('#trend-range');
  if (all.length < 2) {
    if (sum) sum.textContent = 'Seluruh Indonesia';
    if (ranges) ranges.hidden = true;
    box.innerHTML = `<div class="trend-empty">${emptyArt('foto-tambang.webp', 'blue')}<div><b>Grafik tren sedang tumbuh</b>Garisnya muncul setelah data terkumpul minimal 2 hari. Hari ini tercatat ${ribu(all[0]?.active || state.all.length)} lowongan aktif.</div></div>`;
    return;
  }
  const long = all.length > 30;
  if (ranges) ranges.hidden = !long;
  const days = long && state.trendRange ? all.slice(-state.trendRange) : all;
  const first = days[0];
  const last = days[days.length - 1];
  const diff = last.active - first.active;
  const pctTxt = `${(Math.abs(diff) / first.active * 100).toFixed(1).replace('.', ',')}%`;
  if (sum) {
    sum.innerHTML = diff === 0
      ? `Stabil di <b>${ribu(last.active)}</b> lowongan sejak ${tgl(first.d)}. Seluruh Indonesia, dicatat setiap pagi.`
      : `${diff > 0 ? 'Naik' : 'Turun'} <b>${ribu(Math.abs(diff))} lowongan</b> (${diff > 0 ? '+' : '−'}${pctTxt}) sejak ${tgl(first.d)}. Seluruh Indonesia, dicatat setiap pagi.`;
  }
  for (const b of document.querySelectorAll('[data-trend-view]')) {
    const on = b.dataset.trendView === state.trendView;
    b.classList.toggle('on', on);
    b.setAttribute('aria-pressed', on);
  }
  for (const b of document.querySelectorAll('[data-trend-range]')) {
    const on = +b.dataset.trendRange === state.trendRange;
    b.classList.toggle('on', on);
    b.setAttribute('aria-pressed', on);
  }

  if (state.trendView === 'table') {
    const rows = days.slice().reverse();
    box.innerHTML = `<div class="trend-table-wrap"><div class="trend-table-scroll"><table class="trend-table">
      <thead><tr><th>Tanggal</th><th>Lowongan aktif</th><th>Baru masuk</th><th>Ditutup</th><th>Selisih</th></tr></thead>
      <tbody>${rows.map((d, i) => {
        const prev = rows[i + 1] || all[all.indexOf(d) - 1];
        return `<tr><td>${tgl(d.d, true)}</td><td>${ribu(d.active)}</td><td>${d.new == null ? '–' : `+${ribu(d.new)}`}</td><td>${d.closed == null ? '–' : `−${ribu(d.closed)}`}</td><td>${prev ? signed(d.active - prev.active) : '–'}</td></tr>`;
      }).join('')}</tbody></table></div>
      <p class="note">Baru masuk = lowongan yang belum ada di catatan sebelumnya. Ditutup = lowongan yang sudah hilang atau lewat batas waktu. Hari pertama belum punya pembanding.</p></div>`;
    return;
  }

  box.innerHTML = `<div class="trend-grid">
      <figure class="trend-panel" id="tp-line"><figcaption><span>Jumlah lowongan aktif</span></figcaption><div class="trend-plot"></div></figure>
      <figure class="trend-panel" id="tp-bars"><figcaption><span>Perubahan harian</span>
        <span class="legend-mini"><i style="background:${C_NEW}"></i>Baru masuk<i style="background:${C_CLOSED}"></i>Ditutup</span></figcaption><div class="trend-plot"></div></figure>
    </div><div class="trend-tip" role="status" aria-live="polite" hidden></div>`;
  drawLine(days, $('#tp-line .trend-plot'));
  drawBars(days, $('#tp-bars .trend-plot'));
}

function trendTip(d, x, y, host) {
  const tip = $('#trend .trend-tip');
  if (!tip) return;
  if (!d) { tip.hidden = true; return; }
  tip.innerHTML = `<span class="tip-date">${tgl(d.d, true)}</span>
    <span><b>${ribu(d.active)}</b> lowongan aktif</span>
    ${d.new == null ? '<span class="tip-muted">Hari pertama pencatatan</span>'
      : `<span><i style="background:${C_NEW}"></i>+${ribu(d.new)} baru masuk</span><span><i style="background:${C_CLOSED}"></i>−${ribu(d.closed)} ditutup</span>`}`;
  tip.hidden = false;
  const box = $('#trend').getBoundingClientRect();
  const r = host.getBoundingClientRect();
  let left = r.left - box.left + x + 16;
  if (left + tip.offsetWidth > box.width) left = r.left - box.left + x - tip.offsetWidth - 16;
  tip.style.left = `${Math.max(0, left)}px`;
  tip.style.top = `${Math.max(0, r.top - box.top + y - tip.offsetHeight / 2)}px`;
}

// Satu lapisan sentuh untuk seluruh area grafik: arahkan kursor/jari ke mana saja, hari terdekat yang aktif.
function hoverLayer(svg, host, n, W, H, indexAt, onShow, onHide) {
  let cur = n - 1;
  const show = (i) => {
    cur = Math.max(0, Math.min(n - 1, i));
    const [px, py] = onShow(cur);
    trendTip(state.trendDays[cur], px * host.clientWidth / W, py * host.clientHeight / H, host);
  };
  const hide = () => { onHide(); trendTip(null); };
  svg.addEventListener('pointermove', (e) => {
    const r = svg.getBoundingClientRect();
    show(indexAt((e.clientX - r.left) * W / r.width));
  });
  svg.addEventListener('pointerdown', (e) => {
    const r = svg.getBoundingClientRect();
    show(indexAt((e.clientX - r.left) * W / r.width));
  });
  svg.addEventListener('pointerleave', hide);
  svg.addEventListener('focus', () => show(cur));
  svg.addEventListener('blur', hide);
  svg.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowLeft') { e.preventDefault(); show(cur - 1); }
    if (e.key === 'ArrowRight') { e.preventDefault(); show(cur + 1); }
    if (e.key === 'Escape') hide();
  });
}

function drawLine(days, host) {
  state.trendDays = days;
  const W = Math.max(260, host.clientWidth);
  const H = 230;
  const pad = { l: 50, r: 18, t: 30, b: 30 };
  const vals = days.map((d) => d.active);
  const { lo, hi, ticks, step } = yScale(Math.min(...vals), Math.max(...vals));
  const n = days.length;
  const x = (i) => pad.l + i * (W - pad.l - pad.r) / (n - 1);
  const y = (v) => pad.t + (1 - (v - lo) / (hi - lo)) * (H - pad.t - pad.b);
  const line = vals.map((v, i) => `${i ? 'L' : 'M'}${x(i).toFixed(1)},${y(v).toFixed(1)}`).join('');
  const area = `${line}L${x(n - 1).toFixed(1)},${y(lo).toFixed(1)}L${x(0).toFixed(1)},${y(lo).toFixed(1)}Z`;
  const showDots = n <= 10;
  const lx = x(n - 1);
  const ly = y(vals[n - 1]);
  const dropping = n > 1 && vals[n - 1] < vals[n - 2];
  const marks = dateMarks(n, W - pad.l - pad.r);
  host.innerHTML = `<svg viewBox="0 0 ${W} ${H}" width="${W}" height="${H}" tabindex="0" role="img" aria-label="Grafik garis jumlah lowongan aktif per hari dari ${tgl(days[0].d)} sampai ${tgl(days[n - 1].d)}. Gunakan panah kiri dan kanan untuk melihat angka tiap hari.">
    <defs><linearGradient id="trend-wash" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${C_LINE}" stop-opacity=".14"/><stop offset="1" stop-color="${C_LINE}" stop-opacity=".02"/></linearGradient></defs>
    ${ticks.map((t) => `<line x1="${pad.l}" x2="${W - pad.r}" y1="${y(t).toFixed(1)}" y2="${y(t).toFixed(1)}" class="grid"/><text class="axis" x="${pad.l - 10}" y="${(y(t) + 4).toFixed(1)}" text-anchor="end">${tickText(t, step)}</text>`).join('')}
    ${marks.map((i) => `<text class="axis" x="${x(i).toFixed(1)}" y="${H - 8}" text-anchor="${i === 0 ? 'start' : i === n - 1 ? 'end' : 'middle'}">${tgl(days[i].d)}</text>`).join('')}
    <path d="${area}" fill="url(#trend-wash)"/>
    <path d="${line}" fill="none" stroke="${C_LINE}" stroke-width="2" stroke-linejoin="round" stroke-linecap="round"/>
    <line class="cross" x1="0" x2="0" y1="${pad.t - 10}" y2="${H - pad.b}" visibility="hidden"/>
    ${vals.map((v, i) => (showDots || i === n - 1) ? `<circle cx="${x(i).toFixed(1)}" cy="${y(v).toFixed(1)}" r="${i === n - 1 ? 5 : 4}" fill="${C_LINE}" stroke="#FFFCF8" stroke-width="2"/>` : '').join('')}
    <text class="val halo" x="${(lx - 4).toFixed(1)}" y="${(dropping ? ly + 22 : ly - 13).toFixed(1)}" text-anchor="end">${ribu(vals[n - 1])}</text>
    <circle class="hot" r="7" fill="#FFFCF8" stroke="${C_LINE}" stroke-width="2.5" visibility="hidden"/>
  </svg>`;
  const svg = host.querySelector('svg');
  const cross = svg.querySelector('.cross');
  const hot = svg.querySelector('.hot');
  const stepX = (W - pad.l - pad.r) / (n - 1);
  hoverLayer(svg, host, n, W, H, (px) => Math.round((px - pad.l) / stepX), (i) => {
    const cx = x(i);
    const cy = y(vals[i]);
    cross.setAttribute('x1', cx); cross.setAttribute('x2', cx); cross.setAttribute('visibility', 'visible');
    hot.setAttribute('cx', cx); hot.setAttribute('cy', cy); hot.setAttribute('visibility', 'visible');
    return [cx, cy];
  }, () => { cross.setAttribute('visibility', 'hidden'); hot.setAttribute('visibility', 'hidden'); });
}

function drawBars(days, host) {
  const W = Math.max(240, host.clientWidth);
  const H = 230;
  const pad = { l: 10, r: 10, t: 30, b: 30 };
  const n = days.length;
  const label = n <= 7;
  const up = Math.max(1, ...days.map((d) => d.new || 0));
  const down = Math.max(1, ...days.map((d) => d.closed || 0));
  const plotH = H - pad.t - pad.b - (label ? 20 : 4);
  const zero = pad.t + plotH * up / (up + down);
  const scale = plotH / (up + down);
  const band = (W - pad.l - pad.r) / n;
  const bw = band >= 8 ? Math.min(24, band * 0.5) : Math.max(1, band - 1);
  const gap = 2;
  const r = Math.min(4, bw / 2);
  const cx = (i) => pad.l + band * (i + 0.5);
  const cols = days.map((d, i) => {
    const c = cx(i);
    if (d.new == null) {
      return band >= 72 ? `<text class="axis" x="${c.toFixed(1)}" y="${(zero - 8).toFixed(1)}" text-anchor="middle">belum ada</text><text class="axis" x="${c.toFixed(1)}" y="${(zero + 16).toFixed(1)}" text-anchor="middle">pembanding</text>` : '';
    }
    const hu = Math.max(1.5, d.new * scale);
    const hd = Math.max(1.5, d.closed * scale);
    const rr = Math.min(r, hu, hd);
    // ujung data membulat, sisi yang menempel garis nol tetap rata
    const top = zero - gap / 2;
    const bot = zero + gap / 2;
    const l = c - bw / 2;
    const upPath = `M${l},${top}V${top - hu + rr}a${rr},${rr} 0 0 1 ${rr},-${rr}H${l + bw - rr}a${rr},${rr} 0 0 1 ${rr},${rr}V${top}Z`;
    const dnPath = `M${l},${bot}V${bot + hd - rr}a${rr},${rr} 0 0 0 ${rr},${rr}H${l + bw - rr}a${rr},${rr} 0 0 0 ${rr},-${rr}V${bot}Z`;
    return `<g class="col" data-i="${i}"><path d="${upPath}" fill="${C_NEW}"/><path d="${dnPath}" fill="${C_CLOSED}"/>
      ${label ? `<text class="val sm" x="${c.toFixed(1)}" y="${(top - hu - 7).toFixed(1)}" text-anchor="middle">+${ribu(d.new)}</text>
      <text class="val sm" x="${c.toFixed(1)}" y="${(bot + hd + 15).toFixed(1)}" text-anchor="middle">−${ribu(d.closed)}</text>` : ''}</g>`;
  }).join('');
  const marks = dateMarks(n, W - pad.l - pad.r);
  host.innerHTML = `<svg viewBox="0 0 ${W} ${H}" width="${W}" height="${H}" tabindex="0" role="img" aria-label="Grafik batang lowongan baru masuk (ke atas) dan ditutup (ke bawah) per hari. Gunakan panah kiri dan kanan untuk melihat angka tiap hari.">
    <rect class="band-hi" x="0" y="${pad.t - 12}" width="${band.toFixed(1)}" height="${H - pad.t - pad.b + 12}" rx="8" visibility="hidden"/>
    <line x1="${pad.l}" x2="${W - pad.r}" y1="${zero}" y2="${zero}" class="base"/>
    ${cols}
    ${marks.map((i) => `<text class="axis" x="${cx(i).toFixed(1)}" y="${H - 8}" text-anchor="${n > 7 && i === n - 1 ? 'end' : 'middle'}">${tgl(days[i].d)}</text>`).join('')}
  </svg>`;
  const svg = host.querySelector('svg');
  const hi = svg.querySelector('.band-hi');
  hoverLayer(svg, host, n, W, H, (px) => Math.floor((px - pad.l) / band), (i) => {
    hi.setAttribute('x', (cx(i) - band / 2).toFixed(1)); hi.setAttribute('visibility', 'visible');
    return [cx(i), zero];
  }, () => hi.setAttribute('visibility', 'hidden'));
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
    box.innerHTML = `<div class="empty">${emptyArt('foto-perawat.webp', 'yellow')}<b>Belum ada lowongan incaran</b><p>Ketuk ikon penanda di kartu lowongan untuk menyimpannya di sini, supaya tidak lupa dilamar. Simpanan hanya ada di perangkat ini.</p><a class="btn cta" href="#cari">Cari lowongan <span class="cta-dot"><svg><use href="#i-play"/></svg></span></a></div>`;
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
    const tv = t.closest('[data-trend-view]');
    if (tv) { state.trendView = tv.dataset.trendView; renderTrend(); return; }
    const tr = t.closest('[data-trend-range]');
    if (tr) { state.trendRange = +tr.dataset.trendRange; renderTrend(); return; }
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
