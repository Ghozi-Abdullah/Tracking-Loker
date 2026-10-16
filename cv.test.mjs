// Tes pembaca CV dan pencocokan lowongan. Jalankan: node --test
import test from 'node:test';
import assert from 'node:assert/strict';
import { fold, EDU_LEVEL } from './logic.js';
import {
  readCV, splitSections, toLines, pdfLines, readPlace, makeMatcher, recommend, whyText, atsReport, keywordTips,
  compareJob, storable, seniorityOf, isStrong
} from './cv.js';

const NOW = Math.floor(Date.UTC(2026, 9, 16) / 1000);
const PLACES = [
  { city: 'Kota Bandung', prov: 'Jawa Barat' }, { city: 'Kab. Bandung', prov: 'Jawa Barat' },
  { city: 'Kota Adm. Jakarta Selatan', prov: 'DKI Jakarta' }, { city: 'Kota Surabaya', prov: 'Jawa Timur' },
  { city: 'Kab. Sleman', prov: 'Daerah Istimewa Yogyakarta' }, { city: 'Kota Depok', prov: 'Jawa Barat' },
  { city: 'Kab. Bogor', prov: 'Jawa Barat' }, { city: 'Kota Bogor', prov: 'Jawa Barat' }, { city: 'Kota Medan', prov: 'Sumatera Utara' }
];

const AKUNTANSI = `NADIA PUTRI LESTARI
Fresh Graduate Akuntansi
Jl. Cihampelas No. 12, Coblong, Kota Bandung, Jawa Barat 40131
nadia.putri@email.com | 0812-3456-7890

PROFIL
Lulusan S1 Akuntansi yang teliti dan terbiasa mengolah laporan keuangan.

PENDIDIKAN
Universitas Padjadjaran — S1 Akuntansi
2020 – 2024 | IPK 3,62
SMA Negeri 3 Bandung
2017 – 2020

PENGALAMAN KERJA
Magang Staff Keuangan — PT Sinar Abadi
Jan 2024 – Apr 2024
• Membuat jurnal umum dan rekonsiliasi bank bulanan

PENGALAMAN ORGANISASI
Bendahara Himpunan Mahasiswa Akuntansi
2022 – 2023

PRESTASI
Juara 2 Lomba Business Plan Tingkat Nasional 2023

KEAHLIAN
Microsoft Excel (VLOOKUP, pivot table), Accurate, Brevet Pajak A & B`;

const MESIN_MARKETING = `RAKA PRATAMA
Jakarta Selatan, DKI Jakarta · raka@mail.com · +62 813 1111 2222

PENGALAMAN KERJA
Digital Marketing Specialist — PT Kreasi Digital
Maret 2023 – Sekarang
- Mengelola kampanye Meta Ads dan content planner Instagram
Social Media Officer — Toko Online
Juli 2022 – Februari 2023
- Membuat konten dan copywriting untuk marketplace

PENDIDIKAN
Institut Teknologi Bandung, S1 Teknik Mesin, 2017 – 2022

KEAHLIAN
Canva, Meta Ads, Google Analytics, SEO, AutoCAD`;

const MAHASISWA = `Salsabila Rahma
Sleman, D.I. Yogyakarta | salsa@gmail.com | 0821 9876 5432

Pendidikan
Universitas Gadjah Mada, S1 Ilmu Komunikasi
2022 – Sekarang (Semester 7)

Pengalaman Organisasi & Kepanitiaan
Koordinator Divisi Acara, Festival Komunikasi 2024
Staf Humas, Himpunan Mahasiswa Komunikasi
MC acara seminar nasional

Keahlian
Public speaking, copywriting, Canva`;

const read = (txt) => readCV(txt.split('\n'), PLACES, NOW, { kind: 'test' });

function job(over = {}) {
  const j = { id: Math.random().toString(36).slice(2), title: 'Staff Accounting', fn: 'Akuntansi & Keuangan', industry: '', edu: 'Sarjana',
    type: 'Full time', city: 'Kota Bandung', province: 'Jawa Barat', posted: NOW - 86400, ...over };
  j.titleFold = fold(j.title);
  j.eduLevel = j.edu in EDU_LEVEL ? EDU_LEVEL[j.edu] : -1;
  return j;
}

test('judul bagian dikenali, termasuk judul dengan isi di baris yang sama dan bahasa Inggris', () => {
  const sec = splitSections(toLines('Nama\nPENGALAMAN KERJA\nStaff\nPendidikan: S1 Hukum\nSkills\nExcel\nWork Experience\nIntern'));
  assert.deepEqual(sec.pendidikan, ['S1 Hukum']);
  assert.deepEqual(sec.keahlian, ['Excel']);
  assert.deepEqual(sec.pengalaman, ['Staff', 'Intern']);
  assert.equal(sec._found, 4);
});

test('CV akuntansi: jenjang, jurusan, domisili, magang, dan bidang terkuat', () => {
  const p = read(AKUNTANSI);
  assert.equal(p.level, 50);
  assert.equal(p.levelLabel, 'S1');
  assert.equal(p.studying, false);
  assert.equal(p.major, 'Akuntansi');
  assert.equal(p.city, 'Kota Bandung');
  assert.equal(p.prov, 'Jawa Barat');
  assert.equal(p.months, 0, 'magang tidak dihitung sebagai pengalaman kerja');
  assert.equal(p.internMonths, 3);
  assert.equal(p.signals[0].id, 'keuangan');
  assert.ok(p.signals[0].src.pengalaman.includes('rekonsiliasi'));
  assert.ok(p.signals[0].src.organisasi.includes('bendahara'));
  assert.ok(p.signals.some((s) => s.id === 'bisnis' && s.src.prestasi), 'lomba business plan terbaca');
});

test('yang disimpan tidak memuat nama, email, nomor HP, atau kalimat CV', () => {
  const saved = JSON.stringify(storable(read(AKUNTANSI)));
  for (const bit of ['NADIA', 'Nadia', 'nadia.putri', '0812', 'Cihampelas', 'Padjadjaran', 'Sinar Abadi', 'Membuat jurnal']) {
    assert.ok(!saved.includes(bit), `tersimpan: ${bit}`);
  }
});

test('jurusan dan pengalaman beda arah: keduanya terbaca', () => {
  const p = read(MESIN_MARKETING);
  assert.equal(p.major, 'Teknik Mesin');
  assert.equal(p.signals[0].id, 'pemasaran');
  assert.equal(p.city, 'Kota Adm. Jakarta Selatan');
  // Mar 2023 – Okt 2026 (43 bulan) + Jul 2022 – Feb 2023 (7 bulan)
  assert.equal(p.months, 50);
  assert.equal(seniorityOf(p.months), 'mid');
});

test('mahasiswa yang masih kuliah: jenjang selesai SMA, status masih kuliah', () => {
  const p = read(MAHASISWA);
  assert.equal(p.studying, true);
  assert.equal(p.level, 30);
  assert.equal(p.levelLabel, 'S1');
  assert.equal(p.major, 'Ilmu Komunikasi');
  assert.equal(p.prov, 'Daerah Istimewa Yogyakarta');
  assert.equal(p.city, 'Kab. Sleman');
  assert.equal(p.months, null);
});

test('lulusan SMK dikenali, tempat lahir tidak dianggap domisili', () => {
  const p = read('Data Diri\nTempat, tanggal lahir: Medan, 1 Mei 2006\nAlamat: Jl. Melati 3, Depok, Jawa Barat\n\nPendidikan\nSMK Negeri 1 Depok, Akuntansi Keuangan Lembaga\n2021 - 2024\n\nKeahlian\nExcel, Accurate, pembukuan, kasir, administrasi, input data dan pengarsipan dokumen kantor dengan rapi dan teliti setiap hari kerja');
  assert.equal(p.smk, true);
  assert.equal(p.level, 30);
  assert.equal(p.major, 'Akuntansi');
  assert.equal(p.city, 'Kota Depok');
});

test('lama pengalaman: format tanggal angka, tahun saja, dan "present"', () => {
  const p = read('Experience\nAdmin, PT A\n01/2020 - 12/2021\nStaff, PT B\n2022 - 2024\nSupervisor, PT C\nJan 2025 - Present\n\nEducation\nBachelor of Law, 2015 - 2019');
  // 23 + 24 + 21 bulan
  assert.equal(p.months, 68);
  assert.equal(p.major, 'Hukum');
});

test('PDF dua kolom dibaca kolom kiri dulu; tanggal rata kanan tidak dianggap kolom', () => {
  const rows = [];
  for (let i = 0; i < 20; i++) {
    rows.push({ str: `Kiri ${i} keahlian`, x: 40, y: 800 - i * 20, w: 120, h: 10 });
    rows.push({ str: `Kanan ${i} pengalaman kerja panjang`, x: 260, y: 800 - i * 20, w: 260, h: 10 });
  }
  const two = pdfLines([rows]);
  assert.equal(two.twoCol, true);
  assert.equal(two.lines[0], 'Kiri 0 keahlian');
  assert.equal(two.lines[20], 'Kanan 0 pengalaman kerja panjang');

  const dated = [];
  for (let i = 0; i < 20; i++) {
    dated.push({ str: `Staff Admin ${i}`, x: 40, y: 800 - i * 20, w: 120, h: 10 });
    dated.push({ str: `Jan 20${10 + i} – Des 20${11 + i}`, x: 440, y: 800 - i * 20, w: 100, h: 10 });
  }
  const one = pdfLines([dated]);
  assert.equal(one.twoCol, false);
  assert.match(one.lines[0], /^Staff Admin 0 +Jan 2010/);
});

test('pencocokan: syarat pendidikan di atas jenjang disembunyikan, posisi senior diturunkan untuk fresh graduate', () => {
  const p = read(AKUNTANSI);
  const score = makeMatcher(p, { ref: NOW });
  assert.equal(score(job({ edu: 'Magister' })), null);
  const staff = score(job({ title: 'Staff Accounting' }));
  const manager = score(job({ title: 'Accounting Manager' }));
  assert.ok(staff.score > manager.score * 2);
  const near = score(job({ city: 'Kota Bandung' }));
  const far = score(job({ city: 'Kota Medan', province: 'Sumatera Utara' }));
  assert.ok(near.score > far.score);
  assert.equal(score(job({ title: 'Barista', fn: 'Makanan dan Minuman' })), null);
});

test('mahasiswa: magang tetap muncul walau syaratnya S1, kerja penuh waktu S1 tidak', () => {
  const p = read(MAHASISWA);
  const score = makeMatcher(p, { ref: NOW });
  const intern = score(job({ title: 'Public Relations Intern', fn: 'Hubungan Masyarakat', type: 'Magang' }));
  assert.ok(intern && intern.score > 0);
  assert.equal(score(job({ title: 'Public Relations Officer', fn: 'Hubungan Masyarakat' })), null);
});

test('rekomendasi: setiap lowongan sekali, ada jalur jurusan sendiri saat jurusan beda arah dengan pengalaman', () => {
  const p = read(MESIN_MARKETING);
  const jobs = [
    ...Array.from({ length: 8 }, (_, i) => job({ title: `Digital Marketing Staff ${i}`, fn: 'Pemasaran Internet', city: 'Kota Adm. Jakarta Selatan', province: 'DKI Jakarta' })),
    job({ title: 'Social Media Officer', fn: 'Marketing dan Relasi Publik' }),
    job({ title: 'Maintenance Engineer', fn: 'Teknik, Mesin' }),
    job({ title: 'Mechanical Engineer', fn: 'Teknik, Mesin' }),
    job({ title: 'Kasir', fn: 'Operasi Ritel', edu: 'SMA atau Sederajat' })
  ];
  const r = recommend(jobs, p, { ref: NOW });
  const ids = r.groups.flatMap((g) => g.items.map((it) => it.job.id));
  assert.equal(new Set(ids).size, ids.length);
  assert.ok(r.groups.some((g) => g.key === 'jurusan' && g.items.some((it) => it.job.title === 'Mechanical Engineer')));
  assert.ok(!ids.includes(jobs.at(-1).id), 'kasir tidak nyambung dengan CV ini');
  const why = whyText(r.groups[0].items[0].parts, p);
  assert.ok(why.some((w) => w.startsWith('pengalaman')));
});

test('cek ATS: CV gambar/scan langsung diberi tahu', () => {
  const p = readCV(['', ' ', 'CV'], PLACES, NOW, { pages: 1 });
  const a = atsReport(p);
  assert.equal(a.items.length, 1);
  assert.equal(a.items[0].ok, false);
  assert.equal(p.signals.length, 0);
});

test('saran kata kunci tidak menyarankan yang sudah ada di CV', () => {
  const p = read(MESIN_MARKETING);
  const tips = keywordTips(p);
  const pem = tips.find((t) => t.id === 'pemasaran');
  if (pem) for (const done of ['Meta Ads', 'Google Analytics', 'SEO', 'Copywriting']) assert.ok(!pem.missing.includes(done));
  assert.ok(p.signals.filter(isStrong).length >= 1);
});

test('dibanding kualifikasi: pengalaman dan keahlian yang sudah/belum ada', () => {
  const p = read(AKUNTANSI);
  const c = compareJob(p, job(), { minYears: 2, text: 'Menguasai Accurate dan SAP, memahami perpajakan PPh 21, mampu membuat laporan keuangan' });
  const exp = c.rows.find((r) => r.label === 'Pengalaman');
  assert.equal(exp.ok, false);
  assert.ok(c.have.includes('accurate'));
  assert.ok(c.have.includes('laporan keuangan'));
  assert.ok(c.missing.includes('pph'));
  assert.equal(c.rows.find((r) => r.label === 'Pendidikan').ok, true);
});

test('domisili dari baris alamat, bukan nama jalan', () => {
  const sec = splitSections(toLines('Budi\nAlamat: Jl. Raya Bogor KM 30, Cimanggis, Depok, Jawa Barat 16452'));
  assert.deepEqual(readPlace(sec, PLACES), { city: 'Kota Depok', prov: 'Jawa Barat' });
});
