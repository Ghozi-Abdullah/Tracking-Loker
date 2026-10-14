<div align="center">

# Loker Radar

**Semua lowongan kerja di Indonesia dalam satu layar, diperbarui sendiri setiap pagi.**

[**Buka Loker Radar →**](https://ghozi-abdullah.github.io/Loker-Radar/)

</div>

Loker Radar mengumpulkan lowongan kerja dari **Karirhub Kemnaker**, bursa kerja resmi Kementerian Ketenagakerjaan, dan dari **situs karier perusahaan**. Setiap pagi pukul 06.00 WIB, belasan ribu lowongan ditarik ulang: lowongan baru masuk, lowongan yang sudah ditutup hilang, dan angka pasar kerjanya ikut berubah.

Karirhub sendiri sudah menghimpun lowongan dari Glints, JobStreet, Toploker, HiredToday, dan platform lain. Loker Radar menyajikannya dengan pencarian yang cepat, filter yang benar-benar dipakai pencari kerja, dan gambaran pasar kerja yang bisa dibaca dalam semenit.

## Kenapa Loker Radar

**Selalu segar tanpa disentuh.** Tidak ada yang mengetik ulang lowongan. Robot di GitHub Actions menarik data setiap pagi, lalu situs langsung memakai data terbaru.

**Filter yang jujur soal syarat.** Pilih pendidikanmu, dan yang tampil hanya lowongan yang syaratnya setara atau di bawahnya. Pilih "Gaji ≥ 5 jt", dan yang tampil hanya lowongan yang memang mencantumkan angka itu.

**Langsung ke sumber resmi.** Tombol lamar selalu membawa ke halaman lowongan aslinya, di Karirhub, platform asal, atau situs karier perusahaan. Loker Radar tidak menyimpan data pelamar.

**Ringan dan gratis.** Satu halaman statis di GitHub Pages. Tanpa akun, tanpa iklan, tanpa server.

## Fitur

### Cari dalam hitungan milidetik
Ketik posisi, nama perusahaan, atau kota, dan hasilnya berubah saat mengetik. Saring berdasarkan provinsi, kota/kabupaten, bidang pekerjaan, tipe kerja (full time, kontrak, magang, paruh waktu), pendidikan, gaji, waktu posting, dan sumber. Pilihan provinsi, kota, bidang, tipe kerja, dan sumber menampilkan jumlah lowongannya sebelum dipilih. Kombinasi filter tersimpan di alamat halaman dan bisa dibagikan.

### Detail lowongan lengkap
Buka satu lowongan untuk melihat gaji, lokasi, syarat pendidikan, bidang, industri, tanggal posting, batas tayang, dan platform asalnya, lalu lamar lewat halaman aslinya dengan satu ketukan. Setiap lowongan juga punya tautan sendiri yang bisa dikirim ke teman.

### Pasar kerja dalam satu layar
Halaman **Pasar** merangkum lowongan aktif, lowongan baru dalam 24 jam, jumlah perusahaan yang merekrut, dan median gaji yang dicantumkan. Lihat provinsi dan bidang dengan lowongan terbanyak, perusahaan yang paling aktif merekrut, median gaji per bidang, porsi syarat pendidikan dan tipe kerja, serta tren jumlah lowongan dari hari ke hari. Semua bisa dipersempit ke satu provinsi, dan setiap baris bisa diklik untuk langsung melihat lowongannya.

### Simpan untuk nanti
Tandai lowongan yang menarik. Simpanan tersimpan di perangkatmu, dan lowongan yang sudah ditutup diberi tanda supaya tidak terlewat.

### Nyaman di HP
Dirancang dari awal untuk layar ponsel: filter muncul sebagai lembar dari bawah, detail lowongan terbuka satu sentuhan, dan menu ada di jangkauan jempol.

## Data

| Sumber | Isi | Cara ditarik |
|---|---|---|
| [Karirhub Kemnaker](https://karirhub.kemnaker.go.id) | Lowongan dalam negeri dari pemberi kerja dan platform mitra Kemnaker | API publik Karirhub, semua halaman, setiap hari |
| Situs karier perusahaan | Lowongan berlokasi di Indonesia dari perusahaan di [`perusahaan.json`](perusahaan.json) (Greenhouse, Lever, Ashby) | API papan karier publik, setiap hari |

Setiap penarikan dicatat di `stats.json` (lowongan aktif, baru, dan ditutup per hari) sehingga tren pasar kerja terbentuk dengan sendirinya. Bila satu sumber gagal ditarik, lowongan lamanya tetap ditampilkan sampai sumber itu kembali, jadi situs tidak pernah tiba-tiba kosong.

Gaji ditampilkan apa adanya dari sumber, dalam rupiah per bulan. Hanya sebagian lowongan yang mencantumkan gaji, dan angka median dihitung dari lowongan tersebut saja.

## Keamanan pencari kerja

Lowongan resmi tidak pernah memungut biaya. Loker Radar mengingatkan hal ini di setiap detail lowongan dan selalu mengarahkan pelamar ke halaman resmi lowongan.

## Dibangun dengan

Python (pustaka standar) · GitHub Actions · JavaScript · GitHub Pages · Google Sans Flex

---

<div align="center">

Dibuat oleh [Ghozi Abdullah](https://github.com/Ghozi-Abdullah) · Proyek Hari 2 dari **#30Hari30Website**

Lisensi MIT · Data lowongan milik [Karirhub Kemnaker](https://karirhub.kemnaker.go.id) dan masing-masing perusahaan · Loker Radar tidak berafiliasi dengan Kementerian Ketenagakerjaan · Huruf Google Sans Flex (SIL Open Font License)

</div>
