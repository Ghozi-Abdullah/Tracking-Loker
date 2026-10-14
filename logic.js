// Loker Radar: fungsi murni (tanpa DOM) untuk membaca data, menyaring, dan meringkas lowongan.
// Diuji di logic.test.mjs.

export const KARIRHUB_WEB = 'https://karirhub.kemnaker.go.id';
export const KARIRHUB_DETAIL_API = 'https://api.kemnaker.go.id/karirhub/vacancy/v2/published-industrial-vacancies/';

const BULAN = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
const HARI = 86400;

// Jenjang dari API Karirhub (/v1/educations). SMA dan SMK setara.
export const EDU_LEVEL = {
  'Tidak Tamat SD/Tidak Sekolah': 0,
  'SD atau Sederajat': 10,
  'SMP atau Sederajat': 20,
  'SMA atau Sederajat': 30,
  'SMK': 30,
  'Diploma': 40,
  'Profesi': 50,
  'Sarjana': 50,
  'Magister': 60,
  'Doktoral': 80
};

export const EDU_SHORT = {
  'Tidak Tamat SD/Tidak Sekolah': 'Tanpa ijazah',
  'SD atau Sederajat': 'SD',
  'SMP atau Sederajat': 'SMP',
  'SMA atau Sederajat': 'SMA',
  'SMK': 'SMK',
  'Diploma': 'Diploma',
  'Profesi': 'Profesi',
  'Sarjana': 'S1',
  'Magister': 'S2',
  'Doktoral': 'S3'
};

export const EDU_CHOICES = [
  { key: '', label: 'Semua', level: Infinity },
  { key: 'smp', label: 'SD/SMP', level: 20 },
  { key: 'sma', label: 'SMA/SMK', level: 30 },
  { key: 'd3', label: 'Diploma', level: 40 },
  { key: 's1', label: 'S1', level: 50 },
  { key: 's2', label: 'S2/S3', level: 80 }
];

export const GAJI_CHOICES = [
  { key: '', label: 'Semua', min: 0 },
  { key: 'ada', label: 'Dicantumkan', min: 1 },
  { key: '3', label: '≥ 3 jt', min: 3e6 },
  { key: '5', label: '≥ 5 jt', min: 5e6 },
  { key: '8', label: '≥ 8 jt', min: 8e6 },
  { key: '12', label: '≥ 12 jt', min: 12e6 }
];

export const WAKTU_CHOICES = [
  { key: '', label: 'Kapan saja', days: 0 },
  { key: '1', label: '24 jam', days: 1 },
  { key: '3', label: '3 hari', days: 3 },
  { key: '7', label: '7 hari', days: 7 },
  { key: '30', label: '30 hari', days: 30 }
];

export const SORTS = [
  { key: '', label: 'Terbaru' },
  { key: 'gaji', label: 'Gaji tertinggi' },
  { key: 'tutup', label: 'Segera ditutup' },
  { key: 'az', label: 'Perusahaan A–Z' }
];

export const DIRECT = '@perusahaan';

export const EMPTY_FILTERS = Object.freeze({
  q: '', prov: '', city: '', fn: '', types: [], edu: '', gaji: '', waktu: '', src: '', sort: ''
});

export function fold(text) {
  return String(text || '')
    .normalize('NFD').replace(/[̀-ͯ]/g, '')
    .toLowerCase().replace(/\s+/g, ' ').trim();
}

/** "Kota Jakarta Selatan" -> "Jakarta Selatan", "Kab. Badung" tetap. */
export function cityLabel(city) {
  return String(city || '').replace(/^Kota\s+/i, '').replace(/^Kab\s+/i, 'Kab. ').trim();
}

/** Baca jobs.json (format ringkas dari update.py) menjadi daftar objek. */
export function decode(data) {
  const empty = { jobs: [], updated: null, sources: [], logoBase: '' };
  if (!data || data.v !== 1) return empty;
  const fields = data.fields || [];
  const lists = data.lists || {};
  const at = (name) => fields.indexOf(name);
  const pick = (row, name) => {
    const idx = row[at(name)];
    const list = lists[name] || [];
    return typeof idx === 'number' && idx < list.length ? list[idx] : '';
  };
  const jobs = (data.jobs || []).map((row) => {
    const companyIdx = row[at('company')];
    const job = {
      id: row[at('id')],
      title: row[at('title')],
      company: pick(row, 'company'),
      logo: (lists.logo || [])[companyIdx] || '',
      city: pick(row, 'city'),
      province: pick(row, 'province'),
      platform: pick(row, 'platform'),
      fn: pick(row, 'function'),
      industry: pick(row, 'industry'),
      type: pick(row, 'type'),
      edu: pick(row, 'edu'),
      smin: row[at('smin')] || 0,
      smax: row[at('smax')] || 0,
      posted: row[at('posted')] || 0,
      expires: row[at('expires')] || 0,
      first: row[at('first')] || 0,
      via: pick(row, 'via')
    };
    job.eduLevel = job.edu in EDU_LEVEL ? EDU_LEVEL[job.edu] : -1;
    job.pay = salaryMid(job);
    job.hay = fold([job.title, job.company, cityLabel(job.city), job.province, job.fn, job.industry, job.platform].join(' '));
    return job;
  });
  return { jobs, updated: data.updated || null, sources: data.sources || [], logoBase: data.logoBase || '' };
}

export function salaryMid(job) {
  if (job.smin && job.smax) return (job.smin + job.smax) / 2;
  return job.smin || job.smax || 0;
}

/** Saring lowongan. `skip` dipakai untuk hitungan per pilihan (faset): abaikan satu filter. */
export function filterJobs(jobs, f, ref, skip = '') {
  const tokens = fold(f.q).split(' ').filter(Boolean);
  const edu = EDU_CHOICES.find((c) => c.key === f.edu);
  const gaji = GAJI_CHOICES.find((c) => c.key === f.gaji);
  const waktu = WAKTU_CHOICES.find((c) => c.key === f.waktu);
  const since = waktu && waktu.days ? ref - waktu.days * HARI : 0;
  const types = new Set(f.types || []);
  return jobs.filter((j) => {
    if (skip !== 'prov' && f.prov && j.province !== f.prov) return false;
    if (skip !== 'city' && skip !== 'prov' && f.city && j.city !== f.city) return false;
    if (skip !== 'fn' && f.fn && j.fn !== f.fn) return false;
    if (skip !== 'src' && f.src) {
      // '@perusahaan' = semua lowongan yang ditarik langsung dari situs karier perusahaan.
      if (f.src === DIRECT ? j.via === 'karirhub' : j.platform !== f.src) return false;
    }
    if (skip !== 'types' && types.size && !types.has(j.type)) return false;
    if (skip !== 'edu' && edu && edu.key && j.eduLevel > edu.level) return false;
    if (skip !== 'gaji' && gaji && gaji.min) {
      if (gaji.min === 1 ? !j.pay : Math.max(j.smin, j.smax) < gaji.min) return false;
    }
    if (skip !== 'waktu' && since && j.posted < since) return false;
    for (const t of tokens) if (!j.hay.includes(t)) return false;
    return true;
  });
}

export function sortJobs(list, sort) {
  const out = list.slice();
  if (sort === 'gaji') out.sort((a, b) => Math.max(b.smin, b.smax) - Math.max(a.smin, a.smax) || b.posted - a.posted);
  else if (sort === 'tutup') out.sort((a, b) => (a.expires || Infinity) - (b.expires || Infinity) || b.posted - a.posted);
  else if (sort === 'az') out.sort((a, b) => a.company.localeCompare(b.company, 'id') || b.posted - a.posted);
  else out.sort((a, b) => b.posted - a.posted);
  return out;
}

/** [[nilai, jumlah], ...] urut terbanyak. Nilai kosong diabaikan. */
export function countBy(list, key, limit = 0) {
  const map = new Map();
  for (const j of list) {
    const v = typeof key === 'function' ? key(j) : j[key];
    if (!v) continue;
    map.set(v, (map.get(v) || 0) + 1);
  }
  const out = [...map].sort((a, b) => b[1] - a[1] || String(a[0]).localeCompare(String(b[0]), 'id'));
  return limit ? out.slice(0, limit) : out;
}

export function median(values) {
  const v = values.filter((x) => x > 0).sort((a, b) => a - b);
  if (!v.length) return 0;
  const m = v.length >> 1;
  return v.length % 2 ? v[m] : (v[m - 1] + v[m]) / 2;
}

/** Median gaji per kelompok, hanya kelompok dengan minimal `minN` lowongan bergaji. */
export function salaryBy(list, key, minN = 5, limit = 10) {
  const groups = new Map();
  for (const j of list) {
    if (!j.pay || !j[key]) continue;
    if (!groups.has(j[key])) groups.set(j[key], []);
    groups.get(j[key]).push(j.pay);
  }
  return [...groups]
    .filter(([, v]) => v.length >= minN)
    .map(([name, v]) => ({ name, median: median(v), n: v.length }))
    .sort((a, b) => b.median - a.median)
    .slice(0, limit);
}

export function ribu(n) {
  return Math.round(n || 0).toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.');
}

/** 4500000 -> "4,5 jt", 750000 -> "750 rb". */
export function juta(n) {
  if (n >= 1e9) return `${trim(n / 1e9)} M`;
  if (n >= 1e6) return `${trim(n / 1e6)} jt`;
  if (n >= 1e3) return `${Math.round(n / 1e3)} rb`;
  return String(n);
}

function trim(x) {
  const r = Math.round(x * 10) / 10;
  return String(r).replace('.', ',');
}

export function salaryText(smin, smax) {
  if (smin && smax && smin !== smax) {
    if (smin >= 1e6 && smax >= 1e6 && smax < 1e9) return `Rp${trim(smin / 1e6)}–${trim(smax / 1e6)} jt`;
    return `Rp${juta(smin)}–${juta(smax)}`;
  }
  if (smin && smax) return `Rp${juta(smin)}`;
  if (smin) return `Mulai Rp${juta(smin)}`;
  if (smax) return `Hingga Rp${juta(smax)}`;
  return '';
}

export function dateText(epoch, withYear = false) {
  if (!epoch) return '';
  const d = new Date((epoch + 7 * 3600) * 1000); // tampilkan dalam WIB
  const base = `${d.getUTCDate()} ${BULAN[d.getUTCMonth()]}`;
  return withYear ? `${base} ${d.getUTCFullYear()}` : base;
}

export function timeText(epoch) {
  const d = new Date((epoch + 7 * 3600) * 1000);
  return `${String(d.getUTCHours()).padStart(2, '0')}.${String(d.getUTCMinutes()).padStart(2, '0')}`;
}

/** Waktu relatif berbahasa Indonesia. `now` dan `epoch` dalam detik. */
export function ago(epoch, now) {
  if (!epoch) return '';
  const s = Math.max(0, now - epoch);
  if (s < 60 * 5) return 'baru saja';
  if (s < 3600) return `${Math.floor(s / 60)} menit lalu`;
  if (s < HARI) return `${Math.floor(s / 3600)} jam lalu`;
  if (s < 2 * HARI) return 'kemarin';
  if (s < 7 * HARI) return `${Math.floor(s / HARI)} hari lalu`;
  if (s < 30 * HARI) return `${Math.floor(s / (7 * HARI))} minggu lalu`;
  return dateText(epoch, true);
}

export function slug(text) {
  return String(text || '').normalize('NFKD').replace(/[^\x00-\x7f]/g, '')
    .toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
}

export function karirhubUrl(job) {
  if (job.via !== 'karirhub') return '';
  return `${KARIRHUB_WEB}/lowongan-dalam-negeri/lowongan/${slug(job.title)}-${job.id}`;
}

export function initials(name) {
  const words = String(name || '')
    .replace(/\b(PT|CV|Tbk|UD|PD|Persero|Yayasan)\b\.?/gi, '')
    .split(/[\s.,&()-]+/).filter(Boolean);
  if (!words.length) return '?';
  return (words[0][0] + (words[1] ? words[1][0] : '')).toUpperCase();
}

export function hue(text) {
  let h = 0;
  for (const ch of String(text || '')) h = (h * 31 + ch.charCodeAt(0)) >>> 0;
  return h % 6;
}

/** Ubah HTML deskripsi menjadi teks bersih (baris per paragraf/poin). Tanpa DOM. */
export function htmlToText(html) {
  return String(html || '')
    .replace(/<\s*(br|\/p|\/li|\/div|\/h\d)\s*\/?>/gi, '\n')
    .replace(/<\s*li[^>]*>/gi, '• ')
    .replace(/<[^>]+>/g, '')
    .replace(/&nbsp;/g, ' ').replace(/&bull;/g, '•').replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&#39;/g, "'")
    .replace(/&[a-z]+;/gi, ' ')
    .split('\n').map((l) => l.replace(/\s+/g, ' ').trim()).filter(Boolean)
    .join('\n');
}

// ---------- Filter <-> URL ----------

const KEYS = ['q', 'prov', 'city', 'fn', 'edu', 'gaji', 'waktu', 'src', 'sort'];

export function filtersFromQuery(search) {
  const p = new URLSearchParams(search);
  const f = { ...EMPTY_FILTERS, types: [] };
  for (const k of KEYS) f[k] = p.get(k) || '';
  f.types = (p.get('tipe') || '').split(',').filter(Boolean);
  return f;
}

export function filtersToQuery(f) {
  const p = new URLSearchParams();
  for (const k of KEYS) if (f[k]) p.set(k, f[k]);
  if (f.types && f.types.length) p.set('tipe', f.types.join(','));
  const s = p.toString();
  return s ? `?${s}` : '';
}

export function activeCount(f) {
  let n = 0;
  for (const k of ['prov', 'city', 'fn', 'edu', 'gaji', 'waktu', 'src']) if (f[k]) n += 1;
  return n + (f.types || []).length;
}

/** Ringkasan untuk kartu pasar. `ref` = waktu data diperbarui (detik). */
export function summarize(list, ref) {
  const salaried = list.filter((j) => j.pay);
  return {
    total: list.length,
    companies: new Set(list.map((j) => j.company)).size,
    fresh: list.filter((j) => j.posted >= ref - HARI).length,
    salariedPct: list.length ? Math.round((salaried.length / list.length) * 100) : 0,
    medianPay: median(salaried.map((j) => j.pay)),
    provinces: new Set(list.map((j) => j.province).filter(Boolean)).size
  };
}
