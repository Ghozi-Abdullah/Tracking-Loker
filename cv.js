// Tracking Loker: membaca isi CV menjadi profil singkat, lalu mencocokkannya dengan lowongan.
// Semua berjalan di perangkat pengguna. Yang disimpan hanya ringkasan (jenjang, jurusan, domisili,
// lama pengalaman, dan kata kunci dari kamus di bawah), bukan isi CV. Diuji di cv.test.mjs.
import { MAJORS, fold, cityLabel } from './logic.js';

export const CV_VERSION = 1;

// ---------------------------------------------------------------- kamus bidang
// terms = kata yang dicari di CV dan di kualifikasi lowongan; fns = bidang Karirhub; kw = kata di judul lowongan;
// ind = industri yang menguatkan; tips = kata kunci umum di bidang itu (disarankan kalau belum ada di CV).
export const CLUSTERS = [
  { id: 'keuangan', label: 'Keuangan & akuntansi',
    terms: ['akuntansi', 'accounting', 'laporan keuangan', 'financial statement', 'financial report', 'jurnal umum', 'pembukuan', 'bookkeeping', 'bendahara', 'treasurer', 'petty cash', 'kas kecil', 'rekonsiliasi', 'reconciliation', 'accounts payable', 'accounts receivable', 'hutang piutang', 'piutang', 'faktur', 'invoice', 'invoicing', 'perpajakan', 'pajak', 'tax', 'spt', 'brevet', 'pph', 'ppn', 'e-faktur', 'accurate', 'zahir', 'myob', 'sap fico', 'audit', 'auditor', 'budgeting', 'keuangan', 'finance', 'payroll', 'penggajian', 'kasir', 'cashier', 'cash flow', 'arus kas', 'neraca', 'excel'],
    fns: ['Akuntansi & Keuangan', 'Akuntan Perpajakan', 'Audit Intern / Pengawasan', 'Keuangan, Analis', 'Penggajian dan Fasilitas'],
    kw: ['akuntan', 'accounting', 'accountant', 'finance', 'keuangan', 'pajak', 'tax', 'audit', 'auditor', 'kasir', 'cashier', 'payroll', 'bookkeeping', 'treasury', 'account payable', 'account receivable', 'billing', 'invoice', 'collection'],
    tips: ['Laporan keuangan', 'Jurnal umum', 'Rekonsiliasi', 'Perpajakan', 'Accurate', 'Excel'] },
  { id: 'perbankan', label: 'Perbankan & asuransi',
    terms: ['perbankan', 'banking', 'teller', 'kredit', 'credit analyst', 'analis kredit', 'funding', 'lending', 'relationship officer', 'relationship manager', 'penagihan', 'collection', 'asuransi', 'insurance', 'investasi', 'investment', 'pasar modal', 'saham', 'reksa dana', 'waperd', 'aaji', 'aasi', 'kyc', 'anti pencucian uang'],
    fns: ['Operasi Perbankan', 'Kredit / Pinjaman', 'Investasi dan Keuangan', 'Sekuritas, Trader', 'Kolektor', 'Broker Asuransi', 'Penanggung (asuransi)', 'Bagian Klaim'],
    kw: ['bank', 'banking', 'teller', 'kredit', 'credit', 'collection', 'collector', 'relationship officer', 'relationship manager', 'funding', 'insurance', 'asuransi', 'financial advisor', 'financial planner', 'underwriter', 'claim', 'klaim'],
    ind: ['Banking & Financial Services', 'Insurance', 'Teknologi Finansial', 'Financial Technology'],
    tips: ['Analisis kredit', 'Funding', 'KYC', 'Pelayanan nasabah', 'WAPERD'] },
  { id: 'penjualan', label: 'Penjualan',
    terms: ['sales', 'penjualan', 'target penjualan', 'sales target', 'closing', 'canvasser', 'canvassing', 'door to door', 'spg', 'spb', 'promotor', 'negosiasi', 'negotiation', 'b2b', 'b2c', 'key account', 'account executive', 'prospek', 'prospecting', 'cold calling', 'telemarketing', 'telesales', 'jualan', 'berjualan', 'reseller', 'dropship', 'omzet', 'omset', 'upselling', 'cross selling'],
    fns: ['Penjualan dan Pemasaran', 'Penjualan dan Pengembangan Bisnis', 'Penjualan (Non-Teknis)', 'Penjualan (Teknis)', 'Telemarketing'],
    kw: ['sales', 'penjualan', 'account executive', 'telemarketing', 'telesales', 'canvasser', 'canvas', 'promotor', 'spg', 'spb', 'marketing executive', 'sales executive', 'sales representative', 'salesman', 'account manager', 'sales consultant'],
    tips: ['Target penjualan', 'Negosiasi', 'Prospecting', 'Closing', 'Key account'] },
  { id: 'pemasaran', label: 'Pemasaran digital & konten',
    terms: ['digital marketing', 'pemasaran digital', 'social media', 'media sosial', 'social media specialist', 'instagram', 'tiktok', 'content planner', 'content creator', 'konten', 'content', 'copywriting', 'copywriter', 'seo', 'sem', 'google ads', 'meta ads', 'facebook ads', 'iklan', 'campaign', 'kampanye', 'branding', 'brand awareness', 'marketplace', 'shopee', 'tokopedia', 'e-commerce', 'ecommerce', 'email marketing', 'kol', 'influencer', 'google analytics', 'marketing', 'pemasaran', 'market research', 'riset pasar', 'publikasi', 'live streaming', 'live host'],
    fns: ['Pemasaran Internet', 'Marketing dan Relasi Publik', 'Pemasaran (Non-Teknis)', 'Pemasaran (Teknis)', 'Manajemen Merk / Produk'],
    kw: ['digital marketing', 'social media', 'content', 'konten', 'copywriter', 'seo', 'sem', 'ads', 'marketing', 'pemasaran', 'brand', 'branding', 'e-commerce', 'ecommerce', 'marketplace', 'live host', 'host live', 'live streaming', 'kol', 'creator', 'campaign', 'performance marketing'],
    ind: ['Media, Entertainment & Advertising'],
    tips: ['Social media', 'Content planner', 'Copywriting', 'Meta Ads', 'Google Analytics', 'SEO'] },
  { id: 'humas', label: 'Humas & komunikasi',
    terms: ['humas', 'hubungan masyarakat', 'public relations', 'public relation', 'media relations', 'master of ceremony', 'mc', 'pembawa acara', 'moderator', 'public speaking', 'presentasi', 'presentation', 'jurnalis', 'jurnalistik', 'journalism', 'reporter', 'wartawan', 'penyiar', 'broadcaster', 'broadcasting', 'radio', 'media partner', 'press release', 'siaran pers', 'komunikasi', 'communication', 'external relations', 'hubungan eksternal', 'spokesperson', 'host', 'presenter'],
    fns: ['Hubungan Masyarakat', 'Komunikasi', 'Marketing dan Relasi Publik', 'Penyiar, TV / Radio', 'Reporter'],
    kw: ['public relation', 'humas', 'communication', 'komunikasi', 'host', 'presenter', 'mc', 'reporter', 'jurnalis', 'journalist', 'announcer', 'penyiar', 'media relation', 'corporate communication', 'event host'],
    tips: ['Public speaking', 'Press release', 'Media relations', 'Presentasi'] },
  { id: 'penulisan', label: 'Penulisan & penerjemahan',
    terms: ['menulis', 'penulis', 'writer', 'writing', 'artikel', 'article', 'blog', 'blogger', 'editor', 'editing', 'proofreading', 'proofreader', 'penerjemah', 'translator', 'translation', 'terjemahan', 'karya tulis', 'karya tulis ilmiah', 'esai', 'essay', 'storytelling', 'script writer', 'scriptwriter', 'naskah', 'jurnal ilmiah', 'content writer', 'ghostwriter'],
    fns: ['Penulis / Media & Jurnalisme / Percetakan dan Penerbitan', 'Editor', 'Penerjemah'],
    kw: ['writer', 'penulis', 'content writer', 'copywriter', 'editor', 'translator', 'penerjemah', 'script', 'proofreader', 'jurnalis', 'interpreter'],
    tips: ['Copywriting', 'SEO writing', 'Proofreading', 'Storytelling'] },
  { id: 'desain', label: 'Desain grafis & UI/UX',
    terms: ['desain grafis', 'graphic design', 'graphic designer', 'desainer', 'designer', 'desain', 'design', 'canva', 'photoshop', 'adobe photoshop', 'illustrator', 'adobe illustrator', 'coreldraw', 'corel draw', 'figma', 'ui/ux', 'ui ux', 'ui design', 'ux design', 'user interface', 'user experience', 'wireframe', 'prototype', 'prototyping', 'layout', 'tipografi', 'typography', 'logo', 'poster', 'indesign', 'adobe xd', 'ilustrasi', 'illustration', 'branding', 'pdd', 'publikasi dan dokumentasi', 'desain produk', 'product design'],
    fns: ['Design', 'Desainer Grafis Komputer', 'Juru Gambar'],
    kw: ['desain', 'design', 'designer', 'desainer', 'graphic', 'grafis', 'ui', 'ux', 'ilustrator', 'illustrator', 'layouter', 'visual'],
    ind: ['Media, Entertainment & Advertising', 'Printing & Publishing', 'Printing and Packaging'],
    tips: ['Adobe Photoshop', 'Adobe Illustrator', 'Figma', 'Canva', 'Portofolio'] },
  { id: 'video', label: 'Video & fotografi',
    terms: ['video editing', 'editing video', 'video editor', 'premiere', 'adobe premiere', 'after effects', 'capcut', 'davinci resolve', 'final cut', 'videografi', 'videography', 'videografer', 'videographer', 'fotografi', 'photography', 'fotografer', 'photographer', 'lightroom', 'kamera', 'camera', 'dokumentasi', 'documentation', 'sinematografi', 'cinematography', 'motion graphic', 'motion graphics', 'animasi', 'animation', 'animator', 'youtube', 'konten video', 'reels'],
    fns: ['Fotografer', 'Design'],
    kw: ['video', 'videografer', 'videographer', 'video editor', 'editor video', 'fotografer', 'photographer', 'motion', 'animator', 'multimedia', 'content creator', 'konten kreator', 'cinematographer', 'youtube'],
    ind: ['Media, Entertainment & Advertising', 'Entertainment'],
    tips: ['Adobe Premiere', 'After Effects', 'CapCut', 'Lightroom', 'Portofolio'] },
  { id: 'software', label: 'Pengembangan software',
    terms: ['programming', 'pemrograman', 'programmer', 'developer', 'software', 'web developer', 'web development', 'website', 'html', 'css', 'javascript', 'typescript', 'react', 'react.js', 'reactjs', 'next.js', 'vue', 'vue.js', 'angular', 'node.js', 'nodejs', 'express', 'php', 'laravel', 'codeigniter', 'python', 'django', 'flask', 'java', 'spring boot', 'kotlin', 'android', 'flutter', 'dart', 'swift', 'ios', 'golang', 'c++', 'c#', '.net', 'ruby', 'git', 'github', 'gitlab', 'rest api', 'restful', 'backend', 'back end', 'back-end', 'frontend', 'front end', 'front-end', 'full stack', 'fullstack', 'mobile app', 'mysql', 'postgresql', 'mongodb', 'firebase', 'database', 'basis data', 'devops', 'docker', 'kubernetes', 'aws', 'google cloud', 'azure', 'linux', 'unit testing', 'software testing', 'quality assurance', 'agile', 'scrum'],
    fns: ['IT', 'Teknik, Perangkat Lunak', 'TI, Web Developer', 'TI, Programmer', 'TI, Systems Analyst'],
    kw: ['developer', 'programmer', 'software', 'web', 'frontend', 'front end', 'backend', 'back end', 'fullstack', 'full stack', 'mobile', 'android', 'ios', 'flutter', 'devops', 'qa engineer', 'tester', 'quality assurance', 'it', 'engineer software', 'software engineer', 'system analyst', 'programer'],
    ind: ['IT & Telecommunication', 'Consultancy (IT & Technology Sciences)', 'IT / Computers-Hardware', 'Teknologi Finansial', 'Financial Technology'],
    tips: ['Git', 'REST API', 'SQL', 'JavaScript', 'Python', 'Portofolio GitHub'] },
  { id: 'data', label: 'Data & analisis',
    terms: ['data analyst', 'analisis data', 'data analysis', 'data analytics', 'analitik data', 'pivot table', 'vlookup', 'power bi', 'tableau', 'looker studio', 'google data studio', 'statistik', 'statistika', 'statistics', 'spss', 'stata', 'eviews', 'r studio', 'rstudio', 'python', 'pandas', 'sql', 'machine learning', 'data science', 'data scientist', 'visualisasi data', 'data visualization', 'dashboard', 'big data', 'excel', 'microsoft excel', 'google sheets', 'forecasting', 'business intelligence'],
    fns: ['Pemrosesan Data', 'Keuangan, Analis', 'Penelitian dan Manajemen Kualitas', 'IT'],
    kw: ['data analyst', 'data scientist', 'data engineer', 'analyst', 'analis', 'business intelligence', 'reporting', 'data', 'mis', 'insight'],
    tips: ['SQL', 'Excel (pivot, VLOOKUP)', 'Power BI', 'Python', 'Visualisasi data'] },
  { id: 'jaringan', label: 'Jaringan & IT support',
    terms: ['jaringan komputer', 'jaringan', 'network', 'networking', 'mikrotik', 'cisco', 'ccna', 'mtcna', 'troubleshooting', 'instalasi jaringan', 'lan', 'wan', 'server', 'helpdesk', 'help desk', 'it support', 'teknisi komputer', 'hardware', 'perakitan komputer', 'rakit komputer', 'fiber optik', 'fiber optic', 'cctv', 'windows server', 'active directory', 'instalasi software', 'instal ulang', 'tkj'],
    fns: ['TI, Network Engineer', 'TI, Administrator', 'Teknik, Jaringan', 'Teknik, Perangkat Keras', 'IT', 'Teknik, Telekomunikasi'],
    kw: ['network', 'jaringan', 'it support', 'helpdesk', 'help desk', 'teknisi it', 'teknisi komputer', 'noc', 'cctv', 'fiber optic', 'fiber optik', 'technical support', 'it staff', 'it', 'system administrator', 'sysadmin'],
    ind: ['IT & Telecommunication', 'IT / Computers-Hardware'],
    tips: ['Troubleshooting', 'MikroTik', 'Instalasi jaringan', 'CCNA', 'Helpdesk'] },
  { id: 'admin', label: 'Administrasi & kesekretariatan',
    terms: ['administrasi', 'administration', 'administrative', 'admin', 'data entry', 'input data', 'entri data', 'pengarsipan', 'arsip', 'filing', 'surat menyurat', 'korespondensi', 'notulen', 'notulensi', 'sekretaris', 'secretary', 'kesekretariatan', 'microsoft office', 'ms office', 'microsoft word', 'microsoft excel', 'excel', 'google sheets', 'google workspace', 'spreadsheet', 'powerpoint', 'mengetik', 'typing', 'inventaris', 'front office', 'resepsionis', 'receptionist', 'general affair', 'personal assistant', 'office'],
    fns: ['Administrasi & Customer Relationship', 'Sekretaris', 'Bagian Umum', 'Resepsionis'],
    kw: ['admin', 'administrasi', 'administration', 'administrative', 'sekretaris', 'secretary', 'data entry', 'receptionist', 'resepsionis', 'general affair', 'office', 'staff administrasi', 'personal assistant', 'clerk', 'document control', 'dokumen'],
    tips: ['Microsoft Excel', 'Data entry', 'Pengarsipan', 'Surat menyurat', 'Google Workspace'] },
  { id: 'layanan', label: 'Layanan pelanggan',
    terms: ['customer service', 'layanan pelanggan', 'pelayanan pelanggan', 'pelayanan', 'call center', 'contact center', 'komplain', 'complaint handling', 'penanganan keluhan', 'customer care', 'customer relationship', 'crm', 'customer experience', 'customer support', 'front liner', 'frontliner', 'cs'],
    fns: ['Layanan Pelanggan', 'Administrasi & Customer Relationship', 'Telemarketing'],
    kw: ['customer service', 'cs', 'call center', 'customer care', 'customer relation', 'customer experience', 'customer support', 'contact center', 'frontliner', 'front liner', 'telesales', 'live chat', 'customer success'],
    tips: ['Penanganan keluhan', 'Komunikasi', 'CRM', 'Customer experience'] },
  { id: 'sdm', label: 'SDM & rekrutmen',
    terms: ['hrd', 'human resource', 'human resources', 'sumber daya manusia', 'sdm', 'psdm', 'pengembangan sumber daya', 'rekrutmen', 'recruitment', 'recruiter', 'talent acquisition', 'psikotes', 'psikologi', 'onboarding', 'personalia', 'payroll', 'employee engagement', 'employee relations', 'kaderisasi', 'hr', 'bpjs ketenagakerjaan', 'kpi'],
    fns: ['SDM', 'Penggajian dan Fasilitas'],
    kw: ['hr', 'hrd', 'human resource', 'recruiter', 'recruitment', 'rekrutmen', 'talent', 'people', 'personalia', 'psikolog', 'hrga', 'hr generalist', 'training officer', 'learning'],
    tips: ['Rekrutmen', 'Psikotes', 'Payroll', 'Employee engagement', 'BPJS Ketenagakerjaan'] },
  { id: 'mengajar', label: 'Mengajar & pelatihan',
    terms: ['mengajar', 'pengajar', 'guru', 'teacher', 'teaching', 'tutor', 'les privat', 'private tutor', 'bimbel', 'bimbingan belajar', 'asisten dosen', 'asisten praktikum', 'asprak', 'teaching assistant', 'mentor', 'mentoring', 'fasilitator', 'facilitator', 'instruktur', 'trainer', 'kurikulum', 'ppl', 'kampus mengajar', 'relawan mengajar', 'microteaching', 'rpp', 'modul ajar'],
    fns: ['Edukasi', 'Guru / Tutor', 'Pelatih, Pendidik', 'Kepala Sekolah'],
    kw: ['guru', 'teacher', 'tutor', 'pengajar', 'instruktur', 'instructor', 'trainer', 'edukator', 'educator', 'mentor', 'fasilitator', 'dosen', 'lecturer', 'pendidik', 'wali kelas'],
    ind: ['Education & Training'],
    tips: ['Microteaching', 'RPP / modul ajar', 'Mentoring', 'Public speaking'] },
  { id: 'event', label: 'Event & kepanitiaan',
    terms: ['event', 'event organizer', 'kepanitiaan', 'panitia', 'ketua pelaksana', 'ketua panitia', 'divisi acara', 'sie acara', 'seksi acara', 'koordinator acara', 'rundown', 'festival', 'konser', 'seminar nasional', 'webinar', 'wedding organizer', 'perlengkapan', 'logistik acara', 'liaison officer', 'project officer'],
    fns: ['Marketing dan Relasi Publik', 'Manajemen Proyek'],
    kw: ['event', 'acara', 'project officer', 'eo', 'mice', 'activation', 'wedding', 'liaison'],
    tips: ['Rundown', 'Koordinasi vendor', 'Manajemen acara', 'Anggaran acara'] },
  { id: 'bisnis', label: 'Pengembangan bisnis & wirausaha',
    terms: ['business development', 'pengembangan bisnis', 'business plan', 'rencana bisnis', 'kewirausahaan', 'wirausaha', 'entrepreneur', 'entrepreneurship', 'startup', 'usaha sendiri', 'umkm', 'pitching', 'pitch deck', 'kerja sama', 'partnership', 'kemitraan', 'sponsorship', 'fundraising', 'danus', 'dana usaha', 'studi kelayakan', 'feasibility study', 'business case', 'business model canvas'],
    fns: ['Penjualan dan Pengembangan Bisnis', 'Manajemen Merk / Produk', 'Pengembangan Produk', 'Management Trainee'],
    kw: ['business development', 'bd', 'partnership', 'kemitraan', 'account manager', 'business analyst', 'management trainee', 'product', 'produk', 'bisnis', 'business'],
    tips: ['Business plan', 'Partnership', 'Riset pasar', 'Negosiasi', 'Pitching'] },
  { id: 'pimpin', label: 'Kepemimpinan',
    terms: ['ketua umum', 'ketua', 'wakil ketua', 'presiden mahasiswa', 'kepala divisi', 'kadiv', 'koordinator', 'coordinator', 'team leader', 'leader', 'leadership', 'kepemimpinan', 'pemimpin', 'chairman', 'chairperson', 'head of', 'supervisor', 'lkmm', 'ldk'],
    fns: ['Management Trainee', 'Manajemen Operasional'],
    kw: ['management trainee', 'mt', 'officer development program', 'odp', 'leader', 'supervisor', 'koordinator', 'coordinator', 'team leader', 'kepala', 'head'],
    tips: ['Leadership', 'Manajemen tim', 'Problem solving'] },
  { id: 'logistik', label: 'Logistik & gudang',
    terms: ['logistik', 'logistics', 'logistic', 'gudang', 'warehouse', 'inventory', 'persediaan', 'stock opname', 'stok', 'ekspedisi', 'pengiriman', 'shipping', 'supply chain', 'rantai pasok', 'purchasing', 'pengadaan', 'procurement', 'ekspor', 'impor', 'export', 'import', 'forklift', 'wms', 'fifo', 'distribusi', 'distribution'],
    fns: ['Logistik', 'Operasi Gudang', 'Transportasi', 'Administrasi Export', 'Procurement', 'Pembelian / Purchasing'],
    kw: ['logistik', 'logistic', 'gudang', 'warehouse', 'inventory', 'stock', 'stok', 'ppic', 'supply chain', 'purchasing', 'procurement', 'ekspedisi', 'delivery', 'export', 'import', 'checker', 'picker', 'packer', 'packing', 'distribusi', 'distribution'],
    ind: ['Transportation & Logistic', 'Shipping'],
    tips: ['Inventory control', 'Stock opname', 'FIFO', 'Supply chain', 'Excel'] },
  { id: 'produksi', label: 'Produksi & mutu',
    terms: ['produksi', 'production', 'quality control', 'qc', 'quality assurance', 'qa', 'iso 9001', 'haccp', 'gmp', 'cpob', 'lean', 'six sigma', '5s', 'kaizen', 'ppic', 'manufaktur', 'manufacturing', 'operator produksi', 'line produksi', 'sop', 'inspeksi', 'inspection'],
    fns: ['Manufaktur dan Produksi', 'Quality Control (QC)', 'Penelitian dan Manajemen Kualitas', 'Manajemen Mutu (ISO)', 'Manajemen Pabrik', 'Operator'],
    kw: ['produksi', 'production', 'qc', 'qa', 'quality', 'ppic', 'operator', 'manufacturing', 'manufaktur', 'inspector', 'packing', 'helper produksi'],
    ind: ['Manufaktur', 'Other Manufacturers', 'FMCG', 'Electronics Manufacturing', 'Industrial Goods & Chemical'],
    tips: ['Quality control', 'ISO 9001', '5S / Kaizen', 'SOP produksi'] },
  { id: 'mesin', label: 'Mesin & perawatan',
    terms: ['teknik mesin', 'mesin', 'mekanik', 'mechanic', 'mechanical', 'maintenance', 'perawatan mesin', 'preventive maintenance', 'pengelasan', 'welding', 'welder', 'bubut', 'cnc', 'machining', 'solidworks', 'autodesk inventor', 'catia', 'hidrolik', 'pneumatik', 'pneumatic', 'hydraulic', 'plc', 'otomasi', 'automation', 'mekatronika', 'mechatronics', 'kompresor', 'genset', 'hvac', 'refrigerasi', 'teknisi ac'],
    fns: ['Teknik, Mesin', 'Maintenance', 'Manufaktur dan Produksi', 'Teknik, Umum', 'Teknik'],
    kw: ['mesin', 'mechanical', 'mekanik', 'mechanic', 'maintenance', 'teknisi', 'technician', 'welder', 'welding', 'cnc', 'machinist', 'plc', 'hvac', 'engineer mesin', 'mechanical engineer', 'drafter mesin'],
    tips: ['Preventive maintenance', 'AutoCAD / SolidWorks', 'PLC', 'Troubleshooting'] },
  { id: 'otomotif', label: 'Otomotif',
    terms: ['otomotif', 'automotive', 'bengkel', 'servis motor', 'servis mobil', 'service kendaraan', 'tune up', 'sepeda motor', 'kendaraan ringan', 'alat berat', 'heavy equipment', 'spooring', 'balancing', 'body repair', 'engine', 'kelistrikan kendaraan', 'tkr', 'tsm', 'tbsm'],
    fns: ['Maintenance', 'Teknik, Mesin'],
    kw: ['mekanik', 'mechanic', 'otomotif', 'automotive', 'bengkel', 'service advisor', 'alat berat', 'heavy equipment', 'teknisi motor', 'teknisi mobil', 'body repair', 'painter', 'workshop'],
    ind: ['Automotive & Component', 'Heavy Equipment & Industrial Machinery'],
    tips: ['Tune up', 'Kelistrikan kendaraan', 'Service berkala', 'SIM aktif'] },
  { id: 'elektro', label: 'Kelistrikan & elektronika',
    terms: ['listrik', 'kelistrikan', 'electrical', 'elektro', 'elektronika', 'electronics', 'instalasi listrik', 'panel listrik', 'wiring', 'arduino', 'mikrokontroler', 'microcontroller', 'iot', 'internet of things', 'plc', 'instrumentasi', 'instrumentation', 'telekomunikasi', 'telecommunication', 'solar panel', 'plts', 'scada', 'titl'],
    fns: ['Teknik, Elektro', 'Teknik, Telekomunikasi', 'Maintenance'],
    kw: ['elektro', 'electrical', 'listrik', 'electrician', 'elektronika', 'electronic', 'instrument', 'telekomunikasi', 'fiber optic', 'teknisi listrik', 'iot', 'teknisi elektronik', 'electrical engineer'],
    tips: ['Instalasi listrik', 'PLC', 'Wiring', 'K3 listrik'] },
  { id: 'sipil', label: 'Sipil, arsitektur & konstruksi',
    terms: ['autocad', 'sketchup', 'revit', 'civil 3d', 'etabs', 'sap2000', 'rab', 'rencana anggaran biaya', 'estimasi biaya', 'drafter', 'drafting', 'gambar kerja', 'shop drawing', 'konstruksi', 'construction', 'surveying', 'pengukuran', 'total station', 'pengawas lapangan', 'site engineer', 'quantity surveyor', 'bim', 'arsitektur', 'architecture', 'desain interior', 'interior design', 'lumion', '3ds max', 'teknik sipil', 'civil engineering', 'dpib'],
    fns: ['Teknik, Sipil', 'Arsitek', 'Juru Gambar', 'Manajemen Proyek', 'Manajemen Properti'],
    kw: ['sipil', 'civil', 'drafter', 'drafting', 'arsitek', 'architect', 'surveyor', 'konstruksi', 'construction', 'site engineer', 'quantity surveyor', 'estimator', 'interior', 'pelaksana', 'qs', 'site manager', 'pengawas'],
    ind: ['Engineering, Procurement, Construction (EPC)', 'Real Estate & Property', 'Building Material & Sanitary'],
    tips: ['AutoCAD', 'RAB', 'SketchUp', 'Shop drawing', 'Pengawasan lapangan'] },
  { id: 'k3', label: 'K3 & lingkungan',
    terms: ['k3', 'hse', 'hsse', 'qhse', 'keselamatan kerja', 'kesehatan dan keselamatan kerja', 'safety', 'ahli k3', 'ak3u', 'iso 45001', 'iso 14001', 'amdal', 'limbah', 'waste management', 'first aid', 'p3k', 'pertolongan pertama', 'fire fighting', 'teknik lingkungan', 'kesehatan lingkungan', 'environmental'],
    fns: ['Teknik, Keselamatan', 'Teknik, Lainnya'],
    kw: ['hse', 'k3', 'safety', 'hsse', 'qhse', 'environment', 'lingkungan', 'safety officer', 'safetyman', 'ehs'],
    ind: ['Mining, Oil & Gas', 'Engineering, Procurement, Construction (EPC)', 'Environmental & Facilities Services'],
    tips: ['Ahli K3 Umum', 'ISO 45001', 'JSA / HIRADC', 'First aid'] },
  { id: 'tambang', label: 'Tambang & geologi',
    terms: ['tambang', 'pertambangan', 'mining', 'geologi', 'geology', 'geologist', 'eksplorasi', 'exploration', 'pemetaan geologi', 'gis', 'arcgis', 'qgis', 'batubara', 'coal', 'nikel', 'nickel', 'migas', 'oil and gas', 'minyak dan gas', 'drilling', 'pengeboran', 'smelter', 'surpac', 'minescape', 'geofisika'],
    fns: ['Teknik, Perminyakan', 'Ahli Geologi'],
    kw: ['tambang', 'mining', 'mine', 'geolog', 'geologist', 'migas', 'oil', 'gas', 'drilling', 'smelter', 'nikel', 'batubara', 'coal', 'mine plan', 'geologi'],
    ind: ['Mining, Oil & Gas', 'Natural Resources Processing', 'Natural Resources, Others', 'Utilities & Energy'],
    tips: ['ArcGIS / QGIS', 'Pemetaan', 'Surpac', 'K3 tambang'] },
  { id: 'kesehatan', label: 'Kesehatan & keperawatan',
    terms: ['perawat', 'keperawatan', 'nurse', 'nursing', 'asuhan keperawatan', 'bidan', 'kebidanan', 'midwife', 'klinik', 'clinic', 'rumah sakit', 'hospital', 'puskesmas', 'pasien', 'patient', 'bls', 'btcls', 'ppgd', 'acls', 'str', 'rekam medis', 'medical record', 'laboratorium klinik', 'analis kesehatan', 'radiologi', 'fisioterapi', 'gizi', 'nutrisi', 'posyandu', 'caregiver', 'perawat lansia', 'kesehatan masyarakat', 'promosi kesehatan'],
    fns: ['Kesehatan dan Medis', 'Perawat', 'Bidan', 'Asisten Teknis Kesehatan', 'Laboratorium', 'Dokter Umum', 'Dokter Gigi', 'Dokter Spesialis'],
    kw: ['perawat', 'nurse', 'ners', 'bidan', 'midwife', 'klinik', 'clinic', 'caregiver', 'medis', 'medical', 'kesehatan', 'health', 'terapis', 'therapist', 'fisioterapis', 'radiografer', 'analis', 'gizi', 'rekam medis', 'apoteker', 'dokter'],
    ind: ['Healthcare & Pharmaceutical'],
    tips: ['STR aktif', 'BTCLS / BLS', 'Asuhan keperawatan', 'Rekam medis'] },
  { id: 'farmasi', label: 'Farmasi',
    terms: ['farmasi', 'apotek', 'apoteker', 'pharmacy', 'pharmacist', 'kefarmasian', 'tenaga teknis kefarmasian', 'ttk', 'obat', 'resep', 'cpob', 'cpotb', 'medical representative'],
    fns: ['Apoteker / Farmasi'],
    kw: ['apoteker', 'farmasi', 'pharmacist', 'pharmacy', 'kefarmasian', 'ttk', 'apotek', 'asisten apoteker', 'medical representative', 'medrep'],
    ind: ['Healthcare & Pharmaceutical'],
    tips: ['STRA / STRTTK', 'Pelayanan resep', 'CPOB', 'Manajemen stok obat'] },
  { id: 'perhotelan', label: 'Perhotelan & pariwisata',
    terms: ['hotel', 'perhotelan', 'hospitality', 'front office', 'front desk', 'housekeeping', 'room attendant', 'concierge', 'reservasi', 'reservation', 'bellboy', 'pramuwisata', 'tour guide', 'pemandu wisata', 'travel', 'tour', 'ticketing', 'pariwisata', 'tourism', 'resort', 'villa', 'spa', 'waiter', 'waitress', 'pramusaji', 'banquet', 'food and beverage service', 'guest relation'],
    fns: ['Operasi Hotel', 'Tour & Travel', 'Operasi Restoran', 'Resepsionis'],
    kw: ['hotel', 'front office', 'front desk', 'housekeeping', 'receptionist', 'resepsionis', 'tour', 'travel', 'guest', 'concierge', 'bellboy', 'waiter', 'waitress', 'server', 'villa', 'resort', 'spa', 'ticketing', 'reservation', 'room attendant', 'steward', 'banquet'],
    ind: ['Hospitality, Travel & Tourism', 'Leisure'],
    tips: ['Guest service', 'Reservasi', 'Bahasa Inggris', 'Grooming'] },
  { id: 'kuliner', label: 'Kuliner & F&B',
    terms: ['memasak', 'cooking', 'cook', 'chef', 'koki', 'kitchen', 'dapur', 'pastry', 'bakery', 'baking', 'baker', 'kue', 'barista', 'latte art', 'bartender', 'kuliner', 'culinary', 'catering', 'katering', 'food handler', 'food safety', 'tata boga', 'food and beverage', 'f&b', 'restoran', 'restaurant', 'coffee shop'],
    fns: ['Juru Masak', 'Makanan dan Minuman', 'Operasi Restoran'],
    kw: ['cook', 'chef', 'koki', 'kitchen', 'dapur', 'pastry', 'baker', 'bakery', 'barista', 'bartender', 'juru masak', 'commis', 'cook helper', 'crew outlet', 'crew restoran', 'crew resto', 'crew store', 'waiter', 'f&b', 'food', 'cafe', 'kafe'],
    ind: ['Food & Beverage', 'Restaurant & Food Services', 'Candy / Confectionery'],
    tips: ['Food safety / HACCP', 'Food handler', 'Latte art', 'Food cost'] },
  { id: 'ritel', label: 'Ritel & toko',
    terms: ['kasir', 'cashier', 'retail', 'ritel', 'minimarket', 'supermarket', 'alfamart', 'indomaret', 'pramuniaga', 'shopkeeper', 'crew store', 'store crew', 'visual merchandising', 'display produk', 'stock opname', 'point of sale', 'spg', 'spb'],
    fns: ['Operasi Ritel', 'Merchandiser', 'Penjualan (Non-Teknis)'],
    kw: ['kasir', 'cashier', 'crew store', 'store crew', 'store', 'toko', 'retail', 'pramuniaga', 'merchandiser', 'sales associate', 'shopkeeper', 'frontliner', 'store leader', 'crew'],
    ind: ['Retail & Wholesale Trading', 'Consumer Electronics, Appliance & Furnishing', 'Jewellry & Luxury Goods'],
    tips: ['Pelayanan pelanggan', 'Mesin kasir (POS)', 'Stock opname', 'Visual merchandising'] },
  { id: 'hukum', label: 'Hukum & kepatuhan',
    terms: ['hukum', 'legal', 'law', 'contract drafting', 'legal drafting', 'perjanjian', 'litigasi', 'litigation', 'advokat', 'paralegal', 'notaris', 'kenotariatan', 'peradi', 'pkpa', 'compliance', 'kepatuhan', 'moot court', 'peradilan semu', 'debat hukum', 'lbh', 'bantuan hukum', 'legal opinion', 'due diligence'],
    fns: ['Legal, Konsultasi & Advisori'],
    kw: ['legal', 'hukum', 'lawyer', 'advokat', 'paralegal', 'notaris', 'compliance', 'kepatuhan', 'corporate secretary', 'counsel'],
    ind: ['Consulting, Research & Legal Services'],
    tips: ['Legal drafting', 'Review kontrak', 'Legal opinion', 'PKPA'] },
  { id: 'bahasa', label: 'Bahasa asing',
    terms: ['bahasa inggris', 'english', 'toefl', 'ielts', 'toeic', 'bahasa jepang', 'japanese', 'jlpt', 'bahasa mandarin', 'mandarin', 'chinese', 'hsk', 'bahasa korea', 'korean', 'bahasa arab', 'arabic', 'bahasa jerman', 'german', 'bahasa prancis', 'french', 'penerjemah', 'translator', 'interpreter', 'bilingual'],
    fns: ['Penerjemah'],
    kw: ['english', 'inggris', 'mandarin', 'chinese', 'japanese', 'jepang', 'korean', 'korea', 'translator', 'penerjemah', 'interpreter', 'bilingual', 'arabic', 'arab'],
    tips: ['Skor TOEFL / IELTS', 'Bahasa Inggris aktif'] },
  { id: 'pengemudi', label: 'Mengemudi & pengiriman',
    terms: ['sim a', 'sim b', 'sim b1', 'sim b2', 'sim c', 'mengemudi', 'menyetir', 'driving', 'driver', 'supir', 'sopir', 'kurir', 'courier', 'delivery', 'ojek online', 'ojol', 'gojek', 'grab'],
    fns: ['Supir', 'Transportasi'],
    kw: ['driver', 'supir', 'sopir', 'kurir', 'courier', 'delivery', 'pengemudi', 'helper driver', 'rider', 'pengantar'],
    ind: ['Transportation & Logistic'],
    tips: ['SIM aktif', 'Hafal rute', 'Kendaraan pribadi'] },
  { id: 'pertanian', label: 'Pertanian & peternakan',
    terms: ['pertanian', 'agribisnis', 'agroteknologi', 'agronomi', 'perkebunan', 'kelapa sawit', 'sawit', 'budidaya', 'hidroponik', 'peternakan', 'perikanan', 'akuakultur', 'kehutanan', 'pupuk', 'penyuluh pertanian', 'penyuluhan', 'teknologi pangan', 'food technology', 'agriculture'],
    fns: ['Teknik, Pertanian', 'Peternakan'],
    kw: ['pertanian', 'agronomi', 'agronomist', 'agri', 'perkebunan', 'kebun', 'plantation', 'peternakan', 'farm', 'perikanan', 'kehutanan', 'sawit', 'pangan', 'food technologist', 'mandor', 'asisten kebun'],
    ind: ['Agriculture, Fisheries & Plantation', 'Fertilizer & Pesticides', 'Paper & Forestry Product', 'Comodities Trading'],
    tips: ['Budidaya tanaman', 'Pengendalian hama', 'Penyuluhan', 'Analisis lab'] },
  { id: 'busana', label: 'Busana & kecantikan',
    terms: ['menjahit', 'jahit', 'sewing', 'tata busana', 'fashion', 'pola', 'pattern making', 'garment', 'konveksi', 'tekstil', 'textile', 'desain busana', 'bordir', 'makeup', 'make up', 'mua', 'tata rias', 'kecantikan', 'beauty', 'skincare', 'salon', 'nail art', 'hair stylist', 'barber', 'beauty advisor'],
    fns: ['Pembuat Pola', 'Model Fashion'],
    kw: ['fashion', 'busana', 'jahit', 'penjahit', 'tailor', 'garment', 'pola', 'pattern', 'tekstil', 'textile', 'beauty', 'beautician', 'makeup', 'mua', 'terapis', 'therapist', 'salon', 'stylist', 'barber', 'nail', 'skincare', 'beauty advisor'],
    ind: ['Apparel, Textile & Fashion', 'Beauty & Wellness', 'Shoes'],
    tips: ['Portofolio karya', 'Pengetahuan produk', 'Pelayanan pelanggan'] },
  { id: 'riset', label: 'Riset & survei',
    terms: ['penelitian', 'research', 'riset', 'peneliti', 'researcher', 'asisten peneliti', 'research assistant', 'survei', 'survey', 'kuesioner', 'questionnaire', 'enumerator', 'focus group', 'fgd', 'publikasi ilmiah', 'jurnal ilmiah', 'literature review', 'pkm'],
    fns: ['Penelitian dan Manajemen Kualitas'],
    kw: ['research', 'riset', 'researcher', 'peneliti', 'enumerator', 'surveyor', 'analyst', 'analis'],
    ind: ['Consulting, Research & Legal Services', 'Science & Technology'],
    tips: ['Metodologi penelitian', 'Analisis data', 'SPSS', 'Penulisan laporan'] },
  { id: 'olahraga', label: 'Olahraga & kebugaran',
    terms: ['pelatih olahraga', 'coach', 'coaching', 'atlet', 'athlete', 'futsal', 'sepak bola', 'basket', 'bola voli', 'badminton', 'bulu tangkis', 'renang', 'gym', 'fitness', 'personal trainer', 'senam', 'yoga', 'pencak silat', 'karate', 'taekwondo'],
    fns: ['Pelatih Olahraga'],
    kw: ['coach', 'pelatih', 'personal trainer', 'fitness', 'instruktur senam', 'gym', 'swimming', 'renang', 'atlet'],
    tips: ['Sertifikat pelatih', 'Program latihan', 'P3K'] },
  { id: 'keamanan', label: 'Keamanan',
    terms: ['satpam', 'security', 'keamanan', 'gada pratama', 'gada madya', 'bela diri', 'resimen mahasiswa', 'menwa', 'patroli'],
    fns: ['Satuan Pengamanan'],
    kw: ['security', 'satpam', 'keamanan', 'guard', 'scurity', 'patroli', 'bodyguard'],
    tips: ['Sertifikat Gada Pratama', 'Bela diri', 'Patroli'] },
  { id: 'properti', label: 'Properti',
    terms: ['properti', 'property', 'real estate', 'agen properti', 'perumahan', 'kpr'],
    fns: ['Agen Real Estat', 'Manajemen Properti'],
    kw: ['property', 'properti', 'real estate', 'estate', 'perumahan', 'building management'],
    ind: ['Real Estate & Property'],
    tips: ['Prospecting', 'KPR', 'Negosiasi'] }
];
export const CLUSTER_BY_ID = new Map(CLUSTERS.map((c) => [c.id, c]));

// Bidang yang sifatnya pelengkap (bukan arah karier utama): bobotnya dikecilkan.
const SOFT = new Set(['pimpin', 'bahasa', 'olahraga', 'pengemudi']);

/** Sinyal yang cukup kuat untuk jadi arah karier sendiri: minimal dua kata kunci berbeda, atau bobotnya besar. */
export function isStrong(s) {
  if (s.id === 'jurusan' || 'minat' in (s.src || {})) return true;
  const uniq = new Set(Object.values(s.src || {}).flat());
  return uniq.size >= 2 || s.w >= 6;
}

// ---------------------------------------------------------------- bagian CV
const HEADINGS = {
  pendidikan: ['pendidikan', 'riwayat pendidikan', 'pendidikan formal', 'latar belakang pendidikan', 'education', 'educational background', 'education background', 'academic background', 'academic', 'pendidikan terakhir'],
  pengalaman: ['pengalaman kerja', 'pengalaman bekerja', 'pengalaman profesional', 'pengalaman magang', 'pengalaman', 'riwayat pekerjaan', 'riwayat kerja', 'work experience', 'working experience', 'professional experience', 'employment history', 'employment', 'experience', 'experiences', 'internship experience', 'internship', 'internships', 'magang', 'career history', 'job experience', 'riwayat pengalaman'],
  organisasi: ['pengalaman organisasi', 'organisasi', 'riwayat organisasi', 'organizational experience', 'organization experience', 'organisational experience', 'organization', 'organizations', 'organisation', 'kepanitiaan', 'pengalaman kepanitiaan', 'volunteer', 'volunteering', 'volunteer experience', 'kegiatan', 'aktivitas', 'kegiatan kampus', 'extracurricular', 'extracurricular activities', 'ekstrakurikuler', 'leadership experience', 'leadership', 'activities', 'committee', 'committee experience', 'relawan', 'pengalaman relawan', 'kegiatan sosial'],
  prestasi: ['prestasi', 'penghargaan', 'prestasi dan penghargaan', 'penghargaan dan prestasi', 'achievement', 'achievements', 'award', 'awards', 'honors', 'honours', 'honors and awards', 'awards and achievements', 'lomba', 'kompetisi', 'competition', 'competitions', 'kejuaraan'],
  keahlian: ['keahlian', 'keterampilan', 'kemampuan', 'kompetensi', 'skill', 'skills', 'hard skills', 'hard skill', 'soft skills', 'soft skill', 'technical skills', 'technical skill', 'skills and interests', 'skills and abilities', 'keahlian dan kemampuan', 'bahasa', 'languages', 'language', 'tools', 'software', 'keahlian khusus', 'kemampuan bahasa'],
  sertifikat: ['sertifikasi', 'sertifikat', 'pelatihan', 'pelatihan dan sertifikasi', 'sertifikasi dan pelatihan', 'certification', 'certifications', 'certificate', 'certificates', 'licenses', 'licenses and certifications', 'licenses & certifications', 'training', 'trainings', 'courses', 'course', 'kursus', 'seminar', 'seminar dan pelatihan', 'workshop', 'pelatihan dan seminar', 'bootcamp'],
  proyek: ['proyek', 'project', 'projects', 'portofolio', 'portfolio', 'karya', 'pengalaman proyek', 'project experience', 'personal projects'],
  ringkasan: ['profil', 'profil singkat', 'profil diri', 'tentang saya', 'ringkasan', 'ringkasan profil', 'summary', 'professional summary', 'profile', 'about me', 'about', 'objective', 'career objective', 'personal statement', 'deskripsi diri', 'tujuan karier'],
  kontak: ['data diri', 'data pribadi', 'informasi pribadi', 'personal information', 'personal data', 'personal details', 'contact', 'contacts', 'kontak', 'informasi kontak', 'contact information', 'biodata'],
  lain: ['referensi', 'references', 'reference', 'hobi', 'hobby', 'hobbies', 'minat', 'interests', 'interest', 'publikasi', 'publications']
};
const HEADING_LIST = Object.entries(HEADINGS).flatMap(([sec, names]) => names.map((n) => [n, sec])).sort((a, b) => b[0].length - a[0].length);

// Bobot tiap bagian saat menghitung kekuatan bidang.
export const SOURCE_WEIGHT = { pengalaman: 4, proyek: 2.5, organisasi: 2.5, prestasi: 2.5, keahlian: 2, sertifikat: 2, ringkasan: 1.5, pendidikan: 1, umum: 1.5, minat: 3 };
// Label pendek (di kartu lowongan) dan label panjang (di judul jalur).
export const SOURCE_LABEL = {
  jurusan: 'jurusan', pengalaman: 'pengalaman', proyek: 'proyek', organisasi: 'organisasi', prestasi: 'lomba/prestasi',
  keahlian: 'keahlian', sertifikat: 'sertifikat', ringkasan: 'profil', pendidikan: 'pendidikan', umum: 'CV', minat: 'pilihanmu'
};
export const SOURCE_LONG = {
  jurusan: 'jurusan', pengalaman: 'pengalaman kerja/magang', proyek: 'proyek', organisasi: 'organisasi & kepanitiaan', prestasi: 'lomba & prestasi',
  keahlian: 'keahlian', sertifikat: 'sertifikat & pelatihan', ringkasan: 'profil CV', pendidikan: 'riwayat pendidikan', umum: 'isi CV', minat: 'bidang yang kamu pilih'
};

function headingOf(line) {
  const raw = fold(line).replace(/[•●▪◦‣■□►▶✓✔·|*]/g, ' ').trim();
  const [head] = raw.split(':');
  const colon = line.indexOf(':');
  const rest = colon >= 0 ? [line.slice(colon + 1)] : [];
  const t = head.replace(/[^a-z0-9&/ ]/g, ' ').replace(/\s+/g, ' ').trim();
  if (!t || t.length > 46) return null;
  for (const [name, sec] of HEADING_LIST) {
    if (t === name || (t.startsWith(`${name} `) && t.split(' ').length <= name.split(' ').length + 3)) {
      // "Pendidikan: S1 Akuntansi" → judul + isi di baris yang sama.
      return { sec, rest: rest.join(':').trim() };
    }
  }
  return null;
}

/** Bersihkan teks hasil ekstraksi menjadi baris-baris. */
export function toLines(text) {
  return String(text || '')
    .replace(/\r/g, '')
    .replace(/[​-‍﻿]/g, '')
    .split('\n')
    .map((l) => l.replace(/^[\s•●▪◦‣■□►▶✓✔·*\-–—]+/, '').replace(/[ \t ]+/g, ' ').trim());
}

export function splitSections(lines) {
  const sec = { atas: [] };
  let cur = 'atas';
  let found = 0;
  for (const line of lines) {
    if (!line) continue;
    const h = line.length <= 60 ? headingOf(line) : null;
    if (h) {
      cur = h.sec;
      found += 1;
      sec[cur] = sec[cur] || [];
      if (h.rest) sec[cur].push(h.rest);
      continue;
    }
    (sec[cur] = sec[cur] || []).push(line);
  }
  sec._found = found;
  return sec;
}

// ---------------------------------------------------------------- baris dari PDF
/** pages = [[{str, x, y, w, h}]] dari pdf.js. Hasil: baris teks urut baca, kolom kiri dulu bila CV dua kolom. */
export function pdfLines(pages) {
  const out = [];
  let twoCol = false;
  for (const raw of pages) {
    const items = raw.filter((i) => i.str && i.str.trim());
    const cols = splitColumns(items);
    if (cols.length > 1) twoCol = true;
    for (const col of cols) {
      for (const row of groupRows(col)) out.push(row.text);
    }
    out.push('');
  }
  return { lines: out, twoCol };
}

function groupRows(items) {
  const rows = [];
  const sorted = items.slice().sort((a, b) => b.y - a.y || a.x - b.x);
  for (const it of sorted) {
    const tol = Math.max(2, (it.h || 10) * 0.45);
    let row = null;
    for (let k = rows.length - 1; k >= 0 && k >= rows.length - 3; k--) {
      if (Math.abs(rows[k].y - it.y) <= tol) { row = rows[k]; break; }
    }
    if (row) row.items.push(it); else rows.push({ y: it.y, items: [it] });
  }
  for (const r of rows) {
    r.items.sort((a, b) => a.x - b.x);
    let s = '';
    let end = null;
    r.gaps = [];
    for (const it of r.items) {
      if (end !== null) {
        const gap = it.x - end;
        if (gap > 28) r.gaps.push({ at: end + gap / 2, right: it });
        if (gap > 1.5 && !s.endsWith(' ') && !it.str.startsWith(' ')) s += gap > 28 ? '   ' : ' ';
      }
      s += it.str;
      end = it.x + (it.w || 0);
    }
    r.text = s.replace(/\s+$/, '');
  }
  return rows;
}

const DATEISH = /((19|20)\d{2}|sekarang|present|now|saat ini|current)/i;
/**
 * CV dua kolom (gaya Canva): cari garis tegak tempat banyak teks dimulai, yang tidak dilewati teks dari kiri.
 * Tanggal yang rata kanan di CV satu kolom tidak dihitung sebagai kolom.
 */
function splitColumns(items) {
  if (items.length < 20) return [items];
  const starts = new Map();
  for (const it of items) {
    const k = Math.round(it.x / 4) * 4;
    starts.set(k, (starts.get(k) || 0) + 1);
  }
  const minX = Math.min(...items.map((i) => i.x));
  let best = null;
  for (const [x, n] of starts) {
    if (x - minX < 60 || n < items.length * 0.12) continue;
    const left = items.filter((i) => i.x < x - 2);
    const right = items.filter((i) => i.x >= x - 2);
    if (left.length < items.length * 0.15 || right.length < items.length * 0.15) continue;
    const crossing = left.filter((i) => i.x + (i.w || 0) > x - 3).length;
    if (crossing > left.length * 0.1) continue;
    const rightRows = new Set(right.map((i) => Math.round(i.y))).size;
    if (rightRows < 5) continue;
    if (right.filter((i) => DATEISH.test(i.str)).length > right.length * 0.5) continue;
    const balance = Math.min(left.length, right.length);
    if (!best || balance > best.balance) best = { x, left, right, balance };
  }
  return best ? [best.left, best.right] : [items];
}

// ---------------------------------------------------------------- pencocokan kata
const escRe = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
function wordRe(words) {
  const list = [...new Set(words.map((w) => fold(w)).filter(Boolean))].sort((a, b) => b.length - a.length);
  return new RegExp(`(^|[^a-z0-9])(${list.map(escRe).join('|')})(?![a-z0-9])`, 'g');
}
const termRes = new Map();
function termRe(cluster) {
  if (!termRes.has(cluster.id)) termRes.set(cluster.id, wordRe(cluster.terms));
  return termRes.get(cluster.id);
}
function findAll(re, text) {
  const out = [];
  re.lastIndex = 0;
  let m;
  while ((m = re.exec(text))) {
    out.push(m[2]);
    re.lastIndex = m.index + m[0].length;
  }
  return out;
}
/** Buang kata yang sudah tercakup kata lain yang lebih panjang ("excel" bila ada "microsoft excel"). */
function dedupeTerms(terms) {
  const uniq = [...new Set(terms)].sort((a, b) => b.length - a.length);
  return uniq.filter((t, i) => !uniq.slice(0, i).some((u) => u.includes(t)));
}

// ---------------------------------------------------------------- jenjang pendidikan
const LEVELS = [
  { level: 80, label: 'S3', re: /(^|[^a-z0-9])(s3|doktoral|doktor|ph\.? ?d|doctor of philosophy)(?![a-z0-9])/ },
  { level: 60, label: 'S2', re: /(^|[^a-z0-9])(s2|magister|master of|master's|masters|mba|m\.(sc|si|kom|pd|ak|psi|farm|ikom|ds|hum)|pascasarjana|postgraduate)(?![a-z0-9])/ },
  { level: 50, label: 'S1', re: /(^|[^a-z0-9])(s1|s-1|sarjana|bachelor|bachelor's|strata[- ]?(1|satu|i)|undergraduate|d4|d-iv|d iv|diploma iv|diploma 4|sarjana terapan|s\.tr|s\.(e|kom|t|pd|h|sos|ak|psi|farm|ked|gz|ds|si|p|pt|hut|kel|ip|ag|hum|ikom|i\.kom|kep|keb|kes|m|stat|mat))(?![a-z0-9])/ },
  { level: 40, label: 'Diploma', re: /(^|[^a-z0-9])(d3|d-iii|d iii|diploma|ahli madya|a\.md|amd|d1|d2|d-i|d-ii|associate degree|politeknik|polytechnic)(?![a-z0-9])/ },
  { level: 30, label: 'SMK', smk: true, re: /(^|[^a-z0-9])(smk|smkn|smks|stm|smea|vocational high school|vocational school|sekolah menengah kejuruan)(?![a-z0-9])/ },
  { level: 30, label: 'SMA', re: /(^|[^a-z0-9])(sma|sman|smas|smait|smu|madrasah aliyah|man \d+|senior high school|high school|sekolah menengah atas|slta|paket c)(?![a-z0-9])/ },
  { level: 20, label: 'SMP', re: /(^|[^a-z0-9])(smp|smpn|mts|mtsn|junior high school|sltp|paket b)(?![a-z0-9])/ }
];
const UNI = /(^|[^a-z0-9])(universitas|university|institut|institute|sekolah tinggi|stie|stmik|stikes|uin|iain)(?![a-z0-9])/;
const ONGOING = /(^|[^a-z0-9])(sekarang|present|now|saat ini|current|currently|expected|ongoing|semester \d+|mahasiswa aktif|masih kuliah|sedang menempuh|kini|in progress|on going)(?![a-z0-9])/;

function readLevel(eduLines, now) {
  const year = new Date(now * 1000).getUTCFullYear();
  const found = [];
  eduLines.forEach((line, i) => {
    const t = fold(line);
    let hit = LEVELS.find((L) => L.re.test(t));
    if (!hit && UNI.test(t) && !/(^|[^a-z])(sma|smk|smp)(?![a-z])/.test(t)) hit = { level: 50, label: 'S1', guess: true };
    if (!hit) return;
    // Masih kuliah? Lihat baris itu dan dua baris sesudahnya.
    const near = fold(eduLines.slice(i, i + 3).join(' '));
    const years = (near.match(/(19|20)\d{2}/g) || []).map(Number);
    const future = years.some((y) => y > year);
    const ongoing = future || (ONGOING.test(near) && !/(lulus|graduated|graduation)\D{0,14}(19|20)\d{2}/.test(near));
    found.push({ ...hit, ongoing: hit.level >= 40 && ongoing });
  });
  if (!found.length) return null;
  const top = found.sort((a, b) => b.level - a.level)[0];
  const done = found.filter((f) => !f.ongoing).sort((a, b) => b.level - a.level)[0];
  return {
    level: top.ongoing ? (done ? done.level : 30) : top.level,
    label: top.label,
    studying: !!top.ongoing,
    smk: found.some((f) => f.smk)
  };
}

// ---------------------------------------------------------------- jurusan
// Nama jurusan tambahan (termasuk bahasa Inggris) di luar daftar pencarian jurusan.
const MAJOR_EXTRA = {
  'Akuntansi': ['accounting', 'akuntansi syariah', 'akuntansi perpajakan', 'perpajakan', 'komputerisasi akuntansi', 'akuntansi keuangan', 'akuntansi keuangan lembaga', 'akl'],
  'Manajemen': ['management', 'manajemen bisnis', 'business administration', 'administrasi bisnis', 'business management', 'manajemen ritel', 'bisnis digital', 'digital business', 'manajemen keuangan', 'ilmu manajemen', 'bisnis manajemen'],
  'Ekonomi & Perbankan': ['economics', 'ilmu ekonomi', 'ekonomi pembangunan', 'perbankan', 'banking', 'banking and finance', 'keuangan dan perbankan', 'perbankan syariah', 'ekonomi syariah', 'ekonomi islam', 'aktuaria', 'actuarial'],
  'Teknik Informatika': ['informatics', 'informatics engineering', 'computer science', 'information systems', 'information technology', 'sistem informasi', 'teknologi informasi', 'ilmu komputer', 'teknik komputer', 'rekayasa perangkat lunak', 'software engineering', 'data science', 'sains data', 'teknik komputer dan jaringan', 'teknik komputer jaringan', 'tkj', 'rpl', 'manajemen informatika', 'teknik informatika', 'informatika', 'sistem informasi akuntansi', 'computer engineering'],
  'Desain Komunikasi Visual': ['visual communication design', 'graphic design', 'desain grafis', 'multimedia', 'animasi', 'desain produk', 'product design', 'seni rupa', 'fine arts', 'film dan televisi', 'desain komunikasi visual', 'dkv', 'desain grafika'],
  'Ilmu Komunikasi': ['communication', 'communications', 'communication science', 'ilmu komunikasi', 'jurnalistik', 'public relations', 'hubungan masyarakat', 'penyiaran', 'broadcasting', 'komunikasi dan penyiaran islam'],
  'Pemasaran': ['marketing', 'digital marketing', 'manajemen pemasaran', 'bisnis daring dan pemasaran', 'bdp', 'pemasaran', 'marketing communication', 'pemasaran digital'],
  'Teknik Mesin': ['mechanical engineering', 'teknik mesin', 'teknik pemesinan', 'teknik pengelasan', 'mekatronika', 'mechatronics', 'teknik manufaktur', 'teknik mesin industri'],
  'Teknik Otomotif': ['otomotif', 'teknik otomotif', 'teknik kendaraan ringan', 'teknik kendaraan ringan otomotif', 'tkr', 'tkro', 'teknik sepeda motor', 'tsm', 'tbsm', 'teknik bisnis sepeda motor', 'automotive engineering', 'teknik alat berat'],
  'Teknik Elektro': ['electrical engineering', 'teknik elektro', 'teknik elektronika', 'elektronika industri', 'teknik listrik', 'titl', 'teknik telekomunikasi', 'telecommunication engineering', 'teknik instalasi tenaga listrik', 'teknik audio video', 'teknik elektronika industri', 'teknik ketenagalistrikan', 'teknik energi'],
  'Teknik Sipil & Arsitektur': ['civil engineering', 'teknik sipil', 'arsitektur', 'architecture', 'desain interior', 'interior design', 'dpib', 'desain pemodelan dan informasi bangunan', 'teknik konstruksi', 'teknik bangunan', 'perencanaan wilayah', 'planologi', 'urban planning', 'teknik geodesi', 'geodesi', 'geomatika', 'teknik konstruksi gedung'],
  'Teknik Industri': ['industrial engineering', 'teknik industri', 'manajemen industri', 'teknik manajemen industri'],
  'Kimia': ['chemistry', 'chemical engineering', 'teknik kimia', 'kimia analis', 'analis kimia', 'kimia industri', 'kimia murni', 'biologi', 'biology', 'bioteknologi', 'biotechnology', 'mikrobiologi'],
  'Pertambangan & Geologi': ['mining engineering', 'teknik pertambangan', 'pertambangan', 'geology', 'geological engineering', 'teknik geologi', 'geologi', 'petroleum engineering', 'teknik perminyakan', 'geofisika', 'geophysics', 'teknik geofisika', 'teknik metalurgi', 'metallurgical engineering', 'geologi pertambangan'],
  'Logistik & Transportasi': ['logistics', 'manajemen logistik', 'teknik logistik', 'supply chain', 'supply chain management', 'manajemen transportasi', 'transportasi', 'logistik', 'manajemen rantai pasok'],
  'Psikologi & SDM': ['psychology', 'psikologi', 'manajemen sumber daya manusia', 'human resource management', 'msdm', 'manajemen sdm'],
  'Hukum': ['law', 'ilmu hukum', 'hukum', 'faculty of law', 'hukum ekonomi syariah', 'hukum keluarga', 'hukum bisnis', 'legal studies'],
  'Pendidikan': ['keguruan', 'fkip', 'pgsd', 'pg paud', 'pgpaud', 'pendidikan guru', 'tarbiyah', 'bimbingan konseling', 'bimbingan dan konseling', 'teacher education', 'pendidikan agama islam', 'manajemen pendidikan', 'teknologi pendidikan'],
  'Bahasa & Sastra': ['english literature', 'sastra inggris', 'bahasa inggris', 'sastra jepang', 'bahasa jepang', 'sastra mandarin', 'sastra cina', 'sastra china', 'sastra korea', 'sastra indonesia', 'bahasa dan sastra indonesia', 'linguistics', 'linguistik', 'english language', 'sastra arab', 'bahasa dan sastra', 'bahasa dan sastra inggris', 'english education', 'english department'],
  'Keperawatan & Kebidanan': ['nursing', 'keperawatan', 'ilmu keperawatan', 'ners', 'profesi ners', 'kebidanan', 'midwifery', 'asisten keperawatan', 'pendidikan profesi ners'],
  'Farmasi': ['pharmacy', 'farmasi', 'tenaga teknis kefarmasian', 'farmasi klinis', 'profesi apoteker', 'farmasi klinis dan komunitas', 'ttk'],
  'Kedokteran': ['medicine', 'pendidikan dokter', 'kedokteran', 'kedokteran gigi', 'dentistry', 'kedokteran hewan', 'veterinary', 'profesi dokter', 'medical doctor'],
  'Kesehatan Masyarakat & Gizi': ['public health', 'kesehatan masyarakat', 'kesmas', 'gizi', 'nutrition', 'ilmu gizi', 'analis kesehatan', 'teknologi laboratorium medis', 'tlm', 'radiologi', 'radiodiagnostik', 'fisioterapi', 'physiotherapy', 'kesehatan lingkungan', 'rekam medis', 'perekam medis', 'rekam medis dan informasi kesehatan', 'administrasi rumah sakit', 'keselamatan dan kesehatan kerja', 'kesehatan dan keselamatan kerja'],
  'Perhotelan & Pariwisata': ['hospitality', 'perhotelan', 'hotel management', 'manajemen perhotelan', 'pariwisata', 'tourism', 'usaha perjalanan wisata', 'upw', 'akomodasi perhotelan', 'perhotelan dan jasa pariwisata', 'divisi kamar', 'manajemen pariwisata', 'usaha layanan pariwisata'],
  'Tata Boga & Kuliner': ['tata boga', 'culinary', 'culinary arts', 'kuliner', 'seni kuliner', 'pastry', 'patiseri', 'kulinari', 'seni kuliner dan pengolahan', 'kuliner perhotelan'],
  'Pertanian & Peternakan': ['agriculture', 'agribisnis', 'agribusiness', 'agroteknologi', 'agronomi', 'agroekoteknologi', 'peternakan', 'animal science', 'perikanan', 'fisheries', 'kehutanan', 'forestry', 'teknologi pangan', 'food technology', 'ilmu dan teknologi pangan', 'teknologi hasil pertanian', 'agrikultur', 'agribisnis tanaman', 'agribisnis ternak', 'teknologi industri pertanian', 'budidaya perairan'],
  'Administrasi Perkantoran': ['administrasi perkantoran', 'otkp', 'mplb', 'manajemen perkantoran', 'manajemen perkantoran dan layanan bisnis', 'office administration', 'kesekretariatan', 'administrasi niaga', 'administrasi publik', 'public administration', 'ilmu administrasi negara', 'administrasi negara', 'ilmu administrasi publik', 'otomatisasi dan tata kelola perkantoran'],
  'Tata Busana & Fashion': ['tata busana', 'fashion design', 'desain mode', 'tekstil', 'textile', 'fashion', 'desain fashion', 'kriya tekstil'],
  'Pelayaran': ['nautika', 'teknika', 'pelayaran', 'kepelautan', 'teknik perkapalan', 'naval architecture', 'nautical', 'nautika kapal niaga', 'teknika kapal niaga']
};
// Jurusan di luar daftar: arahkan ke bidang yang paling dekat.
const MAJOR_TO_CLUSTERS = [
  { label: 'Matematika & Statistika', re: /(^|[^a-z])(matematika|mathematics|statistika|statistics|statistik|aktuaria)(?![a-z])/, clusters: ['data', 'riset', 'keuangan'] },
  { label: 'Fisika', re: /(^|[^a-z])(fisika|physics)(?![a-z])/, clusters: ['data', 'elektro', 'riset'] },
  { label: 'Ilmu Sosial & Politik', re: /(^|[^a-z])(hubungan internasional|international relations|ilmu politik|political science|ilmu pemerintahan|sosiologi|sociology|antropologi|kesejahteraan sosial|ilmu sejarah|sejarah|geografi)(?![a-z])/, clusters: ['admin', 'humas', 'riset'] },
  { label: 'Studi Agama', re: /(^|[^a-z])(studi islam|ilmu al-?quran|tafsir|dakwah|ushuluddin|syariah)(?![a-z])/, clusters: ['mengajar', 'admin'] }
];
const majorRes = MAJORS.map((m) => {
  const generic = new Set(['pendidikan', 'it', 'ti', 'tp', 'design', 'desain', 'bisnis', 'business', 'industri', 'administrasi', 'bahasa', 'english', 'hotel', 'interior', 'bangunan', 'konstruksi', 'mesin', 'medical', 'hr', 'hrd', 'sdm', 'k3', 'perawat', 'dokter', 'apoteker', 'arsitek', 'bidan', 'akuntan', 'pajak', 'tambang', 'mining', 'perminyakan', 'migas', 'sipil', 'civil', 'elektro', 'electrical', 'mechanical', 'chemical', 'kimia', 'law', 'sekretaris', 'fashion', 'busana', 'dokter gigi', 'dokter hewan', 'tourism']);
  const names = [...m.aka.filter((a) => !generic.has(a)), fold(m.label), ...(MAJOR_EXTRA[m.label] || [])];
  return { m, re: wordRe(names) };
});
// "Pendidikan Matematika", "Pendidikan Bahasa Inggris" → jurusan Pendidikan.
const EDU_MAJOR = /(^|[^a-z])pendidikan (matematika|fisika|kimia|biologi|ekonomi|sejarah|geografi|sosiologi|bahasa|olahraga|jasmani|agama|teknik|guru|anak|luar biasa|kewarganegaraan|pancasila|seni|ips|ipa|akuntansi|informatika|komputer|kepelatihan)/;
const MAJOR_LINE = /(^|[^a-z])(jurusan|program studi|prodi|major|study program|konsentrasi|fakultas|faculty|department|departemen|peminatan|kompetensi keahlian)(?![a-z])/;

function readMajor(eduLines, allLines) {
  const scan = (lines) => {
    const score = new Map();
    const text = fold(lines.join('\n'));
    // Kumpulkan semua kecocokan beserta posisinya; yang tertutup kecocokan lebih panjang dibuang
    // ("manajemen" di dalam "manajemen logistik" bukan jurusan Manajemen).
    const hits = [];
    for (const { m, re } of majorRes) {
      re.lastIndex = 0;
      let x;
      while ((x = re.exec(text))) {
        const start = x.index + x[1].length;
        hits.push({ label: m.label, term: x[2], start, end: start + x[2].length });
        re.lastIndex = x.index + x[0].length;
      }
    }
    for (const h of hits) {
      if (hits.some((o) => o !== h && o.label !== h.label && o.start <= h.start && o.end >= h.end && o.end - o.start > h.end - h.start)) continue;
      score.set(h.label, (score.get(h.label) || 0) + 1 + h.term.length / 20);
    }
    if (EDU_MAJOR.test(text)) score.set('Pendidikan', (score.get('Pendidikan') || 0) + 2.5);
    return [...score.entries()].sort((a, b) => b[1] - a[1]);
  };
  let ranked = scan(eduLines);
  if (!ranked.length) ranked = scan(allLines.filter((l) => MAJOR_LINE.test(fold(l))));
  if (ranked.length) return { label: ranked[0][0], also: ranked.slice(1, 2).filter(([, s]) => s >= ranked[0][1] * 0.6).map(([l]) => l) };
  const text = fold(eduLines.concat(allLines.filter((l) => MAJOR_LINE.test(fold(l)))).join(' '));
  const other = MAJOR_TO_CLUSTERS.find((x) => x.re.test(text));
  return other ? { label: other.label, clusters: other.clusters } : null;
}

// ---------------------------------------------------------------- domisili
const PROV_ALIAS = {
  'jakarta': 'DKI Jakarta', 'dki': 'DKI Jakarta', 'yogyakarta': 'Daerah Istimewa Yogyakarta', 'jogja': 'Daerah Istimewa Yogyakarta',
  'jogjakarta': 'Daerah Istimewa Yogyakarta', 'yogya': 'Daerah Istimewa Yogyakarta', 'diy': 'Daerah Istimewa Yogyakarta',
  'di yogyakarta': 'Daerah Istimewa Yogyakarta', 'jabar': 'Jawa Barat', 'jateng': 'Jawa Tengah', 'jatim': 'Jawa Timur',
  'sumut': 'Sumatera Utara', 'sumbar': 'Sumatera Barat', 'sumsel': 'Sumatera Selatan', 'sulsel': 'Sulawesi Selatan',
  'sulut': 'Sulawesi Utara', 'sulteng': 'Sulawesi Tengah', 'sultra': 'Sulawesi Tenggara', 'kalbar': 'Kalimantan Barat',
  'kaltim': 'Kalimantan Timur', 'kalsel': 'Kalimantan Selatan', 'kalteng': 'Kalimantan Tengah', 'kaltara': 'Kalimantan Utara',
  'ntb': 'Nusa Tenggara Barat', 'ntt': 'Nusa Tenggara Timur', 'babel': 'Kepulauan Bangka Belitung', 'bangka belitung': 'Kepulauan Bangka Belitung',
  'kepri': 'Kepulauan Riau', 'sumatra utara': 'Sumatera Utara', 'sumatra barat': 'Sumatera Barat', 'sumatra selatan': 'Sumatera Selatan',
  'nanggroe aceh darussalam': 'Aceh'
};
const ADDRESS = /(^|[^a-z])(alamat|domisili|address|tinggal|lokasi|location|kota|city)(?![a-z])/;

/** places = [{city, prov}] (kota/kabupaten yang ada di data lowongan). */
export function readPlace(sections, places) {
  const lines = [...(sections.atas || []).slice(0, 14), ...(sections.kontak || []).slice(0, 14)];
  for (const sec of Object.keys(sections)) {
    if (sec === 'atas' || sec === 'kontak' || sec.startsWith('_')) continue;
    for (const l of sections[sec]) if (ADDRESS.test(fold(l))) lines.push(l);
  }
  const provs = [...new Set(places.map((p) => p.prov))];
  const cities = [];
  for (const p of places) {
    const label = cityLabel(p.city);
    const bare = label.replace(/^Kab\.\s+/, '');
    for (const v of new Set([label, bare, p.city, `kabupaten ${bare}`, `kota ${bare}`])) cities.push({ key: fold(v), city: p.city, prov: p.prov, kab: /^Kab/.test(label) });
  }
  cities.sort((a, b) => b.key.length - a.key.length);
  for (const c of cities) c.re = new RegExp(`[^a-z](${escRe(c.key)})[^a-z]`);
  const provKeys = [...provs.map((p) => [fold(p), p]), ...Object.entries(PROV_ALIAS)].sort((a, b) => b[0].length - a[0].length)
    .map(([k, p]) => [new RegExp(`[^a-z]${escRe(k)}[^a-z]`), p]);
  let best = null;
  lines.forEach((line, li) => {
    const t = ` ${fold(line).replace(/\S+@\S+/g, ' ').replace(/https?:\S+|www\.\S+/g, ' ')} `;
    // Tempat lahir bukan domisili.
    if (/(^|[^a-z])(lahir|ttl|tempat|born|birth|place of birth)(?![a-z])/.test(t)) return;
    const provIn = provKeys.filter(([re]) => re.test(t)).map(([, p]) => p);
    for (const c of cities) {
      const m = c.re.exec(t);
      if (!m) continue;
      let s = 1 + m.index / 400;
      if (/(kota|kab|kabupaten)\.?\s*$/.test(t.slice(0, m.index + 1))) s += 3;
      if (provIn.includes(c.prov)) s += 2.5;
      if (/^[\s,.\-–]*(\d{5}|,|$|indonesia)/.test(t.slice(m.index + m[0].length - 1))) s += 1;
      if (c.key.length <= 4) s -= 1;
      s -= li * 0.05;
      if (!best || s > best.s) best = { s, city: c.city, prov: c.prov };
    }
    if (!best && provIn.length) best = { s: 0.5, city: '', prov: provIn[0] };
  });
  return best && best.s >= 1 ? { city: best.city, prov: best.prov } : best ? { city: '', prov: best.prov } : null;
}

// ---------------------------------------------------------------- lama pengalaman
const MONTHS = {
  jan: 1, januari: 1, january: 1, feb: 2, februari: 2, february: 2, peb: 2, mar: 3, maret: 3, march: 3, apr: 4, april: 4,
  mei: 5, may: 5, jun: 6, juni: 6, june: 6, jul: 7, juli: 7, july: 7, agu: 8, agt: 8, ags: 8, agus: 8, agustus: 8, aug: 8, august: 8,
  sep: 9, sept: 9, september: 9, okt: 10, oct: 10, oktober: 10, october: 10, nov: 11, nop: 11, november: 11, nopember: 11,
  des: 12, dec: 12, desember: 12, december: 12
};
const MON = Object.keys(MONTHS).sort((a, b) => b.length - a.length).join('|');
const DATE = `(?:(${MON})\\.?\\s*|(\\d{1,2})\\s*[/.\\-]\\s*)?((?:19|20)\\d{2})`;
const RANGE = new RegExp(`${DATE}\\s*(?:-|–|—|s\\.?\\s?d\\.?|sampai|hingga|to|until|~)\\s*(?:${DATE}|(sekarang|present|now|saat ini|current|currently|kini|today|skrg))`, 'g');
const INTERN = /(^|[^a-z])(magang|intern|internship|pkl|prakerin|praktik kerja|praktek kerja|kerja praktik|kerja praktek|kp|on the job training|ojt|studi independen|msib)(?![a-z])/;
const YEARS_SAID = /(\d{1,2})\+?\s*(tahun|thn|years?|yrs?)\s*(lebih\s*)?(pengalaman|of experience|experience|berpengalaman|bekerja)|(pengalaman|berpengalaman|experience)\s*(kerja\s*)?(lebih dari|selama|over|more than|±|\+-)?\s*(\d{1,2})\+?\s*(tahun|thn|years?)/;

function monthsBetween(a, b) {
  return (b.y - a.y) * 12 + (b.m - a.m);
}
function mergeMonths(ranges) {
  const list = ranges.map(([s, e]) => [s.y * 12 + s.m, e.y * 12 + e.m]).filter(([s, e]) => e >= s).sort((a, b) => a[0] - b[0]);
  let total = 0;
  let cur = null;
  for (const r of list) {
    if (!cur || r[0] > cur[1]) { if (cur) total += cur[1] - cur[0]; cur = r.slice(); } else cur[1] = Math.max(cur[1], r[1]);
  }
  if (cur) total += cur[1] - cur[0];
  return total;
}

function readExperience(sections, now) {
  const d = new Date(now * 1000);
  const today = { y: d.getUTCFullYear(), m: d.getUTCMonth() + 1 };
  const lines = sections.pengalaman || [];
  const work = [];
  const intern = [];
  lines.forEach((line, i) => {
    const t = fold(line);
    RANGE.lastIndex = 0;
    let m;
    while ((m = RANGE.exec(t))) {
      const sm = m[1] ? MONTHS[m[1]] : m[2] ? +m[2] : 0;
      const sy = +m[3];
      let em = 0;
      let ey = 0;
      if (m[7]) { em = today.m; ey = today.y; } else { em = m[4] ? MONTHS[m[4]] : m[5] ? +m[5] : 0; ey = +m[6]; }
      let s = { y: sy, m: sm || 0 };
      let e = { y: ey, m: em || 0 };
      if (!s.m && !e.m) { s.m = 1; e.m = 1; if (ey === sy) e.m = 7; } else if (!s.m) s.m = e.m; else if (!e.m) e.m = s.m;
      if (s.m > 12 || e.m > 12 || monthsBetween(s, e) < 0 || monthsBetween(s, e) > 480) continue;
      if (monthsBetween(s, e) === 0) e = { y: e.y, m: e.m + 1 };
      const ctx = fold([lines[i - 2], lines[i - 1], line, lines[i + 1]].filter(Boolean).join(' '));
      (INTERN.test(ctx) ? intern : work).push([s, e]);
    }
  });
  const workM = mergeMonths(work);
  const internM = mergeMonths(intern);
  let said = 0;
  const all = fold([...(sections.ringkasan || []), ...(sections.atas || []).slice(0, 20)].join(' '));
  const ys = YEARS_SAID.exec(all);
  if (ys) said = +(ys[1] || ys[8]) * 12;
  const months = Math.max(workM, said);
  const has = lines.length > 0;
  return { months: has || said ? months : null, internMonths: internM, dated: work.length + intern.length > 0 };
}

export function seniorityOf(months) {
  if (months == null || months < 12) return 'fresh';
  if (months < 36) return 'junior';
  if (months < 84) return 'mid';
  return 'senior';
}
export const SENIORITY_LABEL = { fresh: 'Fresh graduate / di bawah 1 tahun', junior: '1–3 tahun', mid: '3–7 tahun', senior: 'Lebih dari 7 tahun' };
export const SENIORITY_MONTHS = { fresh: 0, junior: 18, mid: 48, senior: 96 };

// ---------------------------------------------------------------- profil dari teks
/**
 * Baca teks CV menjadi profil. lines = baris teks (dari PDF/Word), places = [{city, prov}],
 * meta = { pages, twoCol, kind }. Yang dikembalikan tidak memuat nama, kontak, atau kalimat asli CV.
 */
export function readCV(lines, places = [], now = Math.floor(Date.now() / 1000), meta = {}) {
  const clean = toLines(lines.join('\n'));
  const text = clean.join('\n');
  const words = (text.match(/[A-Za-zÀ-ɏ]{2,}/g) || []).length;
  const sections = splitSections(clean);
  const has = (k) => (sections[k] || []).length > 0;
  const readable = words >= 60;

  const edu = readLevel(sections.pendidikan && sections.pendidikan.length ? sections.pendidikan : clean, now);
  const major = readMajor(sections.pendidikan || [], clean);
  const place = readPlace(sections, places);
  const exp = readExperience(sections, now);

  // Kekuatan per bidang, dihitung per bagian CV.
  const srcOf = (sec) => (sec === 'atas' ? (sections._found ? 'ringkasan' : 'umum') : sec in SOURCE_WEIGHT ? sec : null);
  const sig = new Map();
  const termsAll = new Set();
  for (const [sec, secLines] of Object.entries(sections)) {
    if (sec.startsWith('_') || !Array.isArray(secLines) || !secLines.length) continue;
    const src = srcOf(sec);
    const t = fold(secLines.join('\n'));
    for (const c of CLUSTERS) {
      const hits = findAll(termRe(c), t);
      if (!hits.length) continue;
      hits.forEach((h) => termsAll.add(h));
      if (!src) continue;
      const uniq = dedupeTerms(hits);
      const s = sig.get(c.id) || { id: c.id, w: 0, src: {} };
      const soft = SOFT.has(c.id) ? 0.55 : 1;
      s.w += SOURCE_WEIGHT[src] * soft * (1 + 0.45 * (Math.min(uniq.length, 4) - 1));
      s.src[src] = dedupeTerms([...(s.src[src] || []), ...uniq]).slice(0, 4);
      sig.set(c.id, s);
    }
  }
  if (major && major.clusters) {
    for (const id of major.clusters) {
      const s = sig.get(id) || { id, w: 0, src: {} };
      s.w += 3.5;
      s.src.jurusan = [major.label];
      sig.set(id, s);
    }
  }
  const signals = [...sig.values()]
    .map((s) => ({ ...s, w: Math.round(Math.min(s.w, 14) * 10) / 10 }))
    .filter((s) => s.w >= 2)
    .sort((a, b) => b.w - a.w)
    .slice(0, 10);

  // Kata kunci saran yang sudah ada di CV (disimpan sebagai daftar kata saran, bukan isi CV).
  const folded = ` ${fold(text)} `;
  const tipsHave = [];
  for (const c of CLUSTERS) {
    for (const tip of c.tips || []) {
      if (tipParts(tip).some((x) => new RegExp(`[^a-z0-9]${escRe(x)}[^a-z0-9]`).test(folded))) tipsHave.push(tip);
    }
  }
  const email = /[\w.+-]+@[\w-]+\.[\w.]+/.test(text);
  const phone = /(\+?62|0)\s?8[\d\s.\-()]{7,14}\d/.test(text);
  const garbled = (text.match(/[^\x20-\x7E -ɏ\n–—‘’“”•·…€]/g) || []).length / Math.max(1, text.length);

  return {
    v: CV_VERSION,
    at: now,
    kind: meta.kind || '',
    readable,
    words,
    level: edu ? edu.level : null,
    levelLabel: edu ? edu.label : '',
    studying: edu ? edu.studying : false,
    smk: edu ? edu.smk : false,
    major: major && !major.clusters ? major.label : '',
    majorOther: major && major.clusters ? major.label : '',
    majorAlso: major && major.also ? major.also : [],
    prov: place ? place.prov : '',
    city: place ? place.city : '',
    months: exp.months,
    internMonths: exp.internMonths,
    signals,
    terms: [...termsAll].sort(),
    tipsHave: [...new Set(tipsHave)],
    ats: {
      readable, words, pages: meta.pages || 0, twoCol: !!meta.twoCol, email, phone,
      sections: { pendidikan: has('pendidikan'), pengalaman: has('pengalaman'), organisasi: has('organisasi'), keahlian: has('keahlian'), ringkasan: has('ringkasan') },
      headings: sections._found, dated: exp.dated, garbled: Math.round(garbled * 1000) / 1000
    }
  };
}

// ---------------------------------------------------------------- cek ATS
export function atsReport(p) {
  const a = p.ats || {};
  if (!a.readable) {
    return { ok: 0, total: 1, items: [{ ok: false, label: 'Teks CV bisa dibaca mesin', tip: 'CV-mu sepertinya berupa gambar atau hasil scan. Sistem ATS perusahaan juga kemungkinan tidak bisa membacanya. Buat ulang CV di Word atau Google Docs, lalu simpan sebagai PDF.' }] };
  }
  const items = [
    { ok: true, label: 'Teks CV bisa dibaca mesin' },
    { ok: a.email && a.phone, label: 'Email dan nomor HP tercantum', tip: !a.email && !a.phone ? 'Tambahkan email dan nomor HP/WhatsApp aktif di bagian atas CV.' : !a.email ? 'Tambahkan alamat email yang profesional.' : 'Tambahkan nomor HP/WhatsApp aktif.' },
    { ok: a.sections && a.sections.pendidikan, label: 'Ada bagian Pendidikan', tip: 'Beri judul bagian yang jelas, misalnya "Pendidikan", berisi jenjang, jurusan, kampus/sekolah, dan tahun lulus.' },
    { ok: a.sections && (a.sections.pengalaman || a.sections.organisasi), label: 'Ada bagian Pengalaman (kerja, magang, atau organisasi)', tip: 'Tambahkan bagian "Pengalaman" walaupun isinya magang, organisasi, atau kepanitiaan. Tulis peran dan hasil kerjamu.' },
    { ok: a.sections && a.sections.keahlian, label: 'Ada bagian Keahlian', tip: 'Tambahkan bagian "Keahlian" berisi kemampuan teknis (software, alat, bahasa) supaya mudah dicocokkan sistem ATS.' },
    { ok: a.headings >= 3, label: 'Judul bagian mudah dikenali', tip: 'Gunakan judul bagian yang umum: Profil, Pendidikan, Pengalaman Kerja, Organisasi, Keahlian, Sertifikat.' },
    { ok: !a.twoCol, label: 'Tata letak satu kolom', tip: 'CV dua kolom sering terbaca acak oleh ATS. Tata letak satu kolom paling aman.' },
    { ok: a.words >= 180 && a.words <= 1100 && (!a.pages || a.pages <= 2), label: 'Panjang CV pas (1–2 halaman)', tip: a.words < 180 ? 'CV-mu masih sangat singkat. Tambahkan detail pengalaman, organisasi, dan keahlian.' : 'CV-mu cukup panjang. Ringkas jadi 1–2 halaman dan utamakan yang relevan dengan posisi.' },
    { ok: !a.sections || !a.sections.pengalaman || a.dated, label: 'Periode pengalaman ditulis jelas', tip: 'Tulis periode setiap pengalaman, misalnya "Jan 2023 – Des 2023", supaya lama pengalamanmu terbaca.' },
    { ok: a.garbled < 0.02, label: 'Huruf terbaca rapi', tip: 'Ada simbol atau huruf yang tidak terbaca. Hindari font hias, ikon, dan teks di dalam gambar.' }
  ];
  return { ok: items.filter((i) => i.ok).length, total: items.length, items };
}

/** Kata kunci umum yang belum ada di CV untuk bidang-bidang terkuat. */
function tipParts(tip) {
  return fold(tip).split(/[/()]|,| atau /).map((x) => x.trim()).filter((x) => x.length >= 3);
}
export function keywordTips(p, limit = 3) {
  const have = new Set(p.terms || []);
  const said = new Set(p.tipsHave || []);
  const out = [];
  for (const s of p.signals || []) {
    if (s.off || !isStrong(s)) continue;
    const c = CLUSTER_BY_ID.get(s.id);
    if (!c || SOFT.has(c.id) || !c.tips) continue;
    const missing = c.tips.filter((tip) => {
      if (said.has(tip)) return false;
      return !tipParts(tip).some((x) => have.has(x) || [...have].some((h) => h.length > 3 && (h.includes(x) || x.includes(h))));
    });
    if (missing.length) out.push({ id: c.id, label: c.label, missing: missing.slice(0, 5) });
    if (out.length >= limit) break;
  }
  return out;
}

// ---------------------------------------------------------------- pencocokan lowongan
const SENIOR_TITLE = /(^|[^a-z])(senior|sr|lead|head|kepala|manager|manajer|supervisor|spv|chief|direktur|director|vp|vice president|general manager|gm|principal|asisten manajer|assistant manager|koordinator|coordinator)(?![a-z])/;
const JUNIOR_TITLE = /(^|[^a-z])(junior|jr|staff|staf|trainee|management trainee|fresh graduate|freshgraduate|fresh grad|entry level|magang|intern|internship|asisten|assistant|helper|crew|officer development program|odp|pemula)(?![a-z])/;

// Kata judul yang terlalu umum: tetap dihitung, tapi lebih lemah dari kata yang spesifik.
const GENERIC_KW = new Set(['it', 'data', 'web', 'mobile', 'admin', 'office', 'marketing', 'sales', 'design', 'desain', 'content', 'konten',
  'teknisi', 'technician', 'operator', 'crew', 'store', 'toko', 'analyst', 'analis', 'staff', 'product', 'produk', 'bisnis', 'business',
  'food', 'kesehatan', 'health', 'medis', 'medical', 'visual', 'kepala', 'head', 'leader', 'supervisor', 'event', 'acara', 'quality', 'gudang']);
const TITLE_SKIP = new Set([...GENERIC_KW, 'excel', 'microsoft excel', 'english', 'komunikasi', 'communication', 'pelayanan', 'keuangan', 'finance',
  'administrasi', 'administration', 'host', 'mc', 'cs', 'pajak', 'tax', 'leadership', 'ketua', 'koordinator', 'coordinator']);

function compileSignal(s, majorLabel) {
  let fns;
  let kw;
  let ind = [];
  if (s.id === 'jurusan') {
    const m = MAJORS.find((x) => x.label === majorLabel);
    if (!m) return null;
    fns = m.fns; kw = m.kw;
  } else {
    const c = CLUSTER_BY_ID.get(s.id);
    if (!c) return null;
    fns = c.fns; kw = c.kw; ind = c.ind || [];
  }
  const strong = kw.filter((k) => !GENERIC_KW.has(fold(k)));
  const weak = kw.filter((k) => GENERIC_KW.has(fold(k)));
  return {
    s,
    fns: new Set(fns),
    re: strong.length ? new RegExp(wordRe(strong).source) : null,
    weakRe: weak.length ? new RegExp(wordRe(weak).source) : null,
    ind: new Set(ind)
  };
}

/** Sinyal lengkap untuk pencocokan: jurusan (bobot terbesar) + bidang dari CV. */
export function matchSignals(p) {
  const list = [];
  if (p.major && MAJORS.some((m) => m.label === p.major)) list.push({ id: 'jurusan', w: 8, src: { jurusan: [p.major] } });
  for (const also of p.majorAlso || []) {
    if (MAJORS.some((m) => m.label === also)) list.push({ id: 'jurusan', alt: also, w: 4, src: { jurusan: [also] } });
  }
  return list.concat((p.signals || []).filter((s) => !s.off));
}

export function makeMatcher(p, opts = {}) {
  const ref = opts.ref || Math.floor(Date.now() / 1000);
  const near = opts.near !== false;
  const onlyProv = opts.onlyProv || '';
  const level = p.level;
  const sen = seniorityOf(p.months);
  const sigs = matchSignals(p).map((s) => compileSignal(s, s.alt || p.major)).filter(Boolean);
  // Kata dari CV yang muncul persis di judul lowongan ("Java", "Tax", "NOC") menaikkan peringkat.
  const own = (p.terms || []).filter((t) => t.length >= 3 && !TITLE_SKIP.has(t));
  const ownRe = own.length ? wordRe(own) : null;
  return function score(j) {
    if (onlyProv && j.province !== onlyProv) return null;
    const parts = [];
    for (const c of sigs) {
      let m = 0;
      const byFn = c.fns.has(j.fn);
      const byTitle = c.re ? c.re.test(j.titleFold) : false;
      const byWeak = !byTitle && c.weakRe ? c.weakRe.test(j.titleFold) : false;
      if (byFn) m += 1;
      if (byTitle) m += 1.3;
      else if (byWeak) m += 0.6;
      if (!m) continue;
      if (c.ind.has(j.industry)) m += 0.2;
      parts.push({ s: c.s, v: c.s.w * Math.min(m, 2.3), byTitle });
    }
    if (!parts.length) return null;
    parts.sort((a, b) => b.v - a.v);
    let base = parts[0].v + (parts[1] ? parts[1].v * 0.6 : 0) + (parts[2] ? parts[2].v * 0.3 : 0);
    if (!parts.some((x) => x.byTitle)) base *= 0.85;
    if (ownRe) {
      const hits = new Set(findAll(ownRe, j.titleFold)).size;
      if (hits) base *= 1 + 0.12 * Math.min(hits, 3);
    }

    // Kesesuaian pendidikan: lowongan dengan syarat di atas jenjangmu tidak ditampilkan.
    let fit = 1;
    const jl = j.eduLevel;
    const intern = j.type === 'Magang' || /(^|[^a-z])(magang|intern|internship)(?![a-z])/.test(j.titleFold);
    if (level != null) {
      if (p.studying && intern) fit *= 1.2;
      else if (jl > level) return null;
      else if (jl < 0) fit *= 0.95;
      else {
        const gap = level - jl;
        fit *= gap === 0 ? 1.15 : gap <= 10 ? 1 : gap <= 20 ? 0.7 : 0.45;
        if (p.smk && j.edu === 'SMK') fit *= 1.1;
      }
    }
    // Senioritas dari judul lowongan.
    const senior = SENIOR_TITLE.test(j.titleFold);
    const junior = JUNIOR_TITLE.test(j.titleFold);
    if (sen === 'fresh') fit *= senior && !junior ? 0.35 : junior ? 1.15 : 1;
    else if (sen === 'junior') fit *= senior && !junior ? 0.7 : 1;
    else if (sen === 'senior') fit *= senior ? 1.15 : junior ? 0.75 : 1;
    if (p.studying) fit *= intern ? 1.25 : j.type === 'Part time' ? 1.1 : 0.85;
    else if (intern && sen !== 'fresh') fit *= 0.6;
    // Dekat domisili lebih dulu.
    if (near && p.prov) fit *= p.city && j.city === p.city ? 1.35 : j.province === p.prov ? 1.2 : 0.85;
    if (j.posted >= ref - 3 * 86400) fit *= 1.05;
    return { score: base * fit, parts };
  };
}

const SOURCE_ORDER = ['jurusan', 'pengalaman', 'proyek', 'organisasi', 'prestasi', 'keahlian', 'sertifikat', 'minat', 'ringkasan', 'umum', 'pendidikan'];

/** Bagian CV yang menjadi dasar satu sinyal, urut dari yang paling kuat. */
export function sourcesOf(s) {
  return SOURCE_ORDER.filter((k) => k in (s.src || {}));
}

/**
 * Kelompokkan rekomendasi: "Paling cocok", lalu satu jalur per arah karier (jurusan, lalu bidang dari
 * pengalaman, organisasi, lomba, keahlian). Setiap lowongan hanya muncul di satu jalur.
 */
export function recommend(jobs, p, opts = {}) {
  const score = makeMatcher(p, opts);
  const scored = [];
  for (const j of jobs) {
    const r = score(j);
    if (r) scored.push({ job: j, score: r.score, parts: r.parts });
  }
  scored.sort((a, b) => b.score - a.score);
  const cap = opts.cap || 60;
  const used = new Set();
  const groups = [];

  // Arah karier: sinyal yang cukup kuat. Jurusan digabung dengan bidang yang searah (mis. Akuntansi + Keuangan).
  const sigs = matchSignals(p).filter(isStrong);
  const major = MAJORS.find((m) => m.label === p.major);
  let twin = null;
  if (major) {
    let best = 0;
    for (const s of sigs) {
      const c = CLUSTER_BY_ID.get(s.id);
      if (!c) continue;
      // Searah bila sebagian besar bidang (atau kata judul) jurusan juga milik bidang ini.
      const fnShare = major.fns.length ? c.fns.filter((f) => major.fns.includes(f)).length / major.fns.length : 0;
      const kwShare = major.kw.length ? c.kw.filter((k) => major.kw.includes(k)).length / major.kw.length : 0;
      const overlap = Math.max(fnShare, kwShare);
      if (overlap > best) { best = overlap; twin = s.id; }
    }
    if (best < 0.5) twin = null;
  }
  const keyOf = (s) => (s.id === 'jurusan' ? (s.alt ? `jurusan:${s.alt}` : twin || 'jurusan') : s.id);
  const dirs = new Map();
  for (const s of sigs) {
    const key = keyOf(s);
    const d = dirs.get(key) || { key, sigs: [], w: 0, major: false };
    d.sigs.push(s);
    d.w += s.w;
    if (s.id === 'jurusan' && !s.alt) d.major = true;
    dirs.set(key, d);
  }

  const strong = scored.length ? scored[Math.min(scored.length - 1, 40)].score : 0;
  const top = [];
  for (const it of scored) {
    if (top.length >= cap || it.score < strong) break;
    const kinds = new Set(it.parts.slice(0, 3).flatMap((x) => sourcesOf(x.s).filter((k) => !['ringkasan', 'umum', 'pendidikan'].includes(k))));
    if (kinds.size >= 2) top.push(it);
  }
  for (const it of scored) {
    if (top.length >= 6) break;
    if (!top.includes(it)) top.push(it);
  }
  top.sort((a, b) => b.score - a.score);
  top.forEach((it) => used.add(it.job.id));
  if (top.length) groups.push({ key: 'top', title: 'Paling cocok untukmu', items: top.slice(0, cap), total: top.length, sources: [] });

  // Setiap lowongan masuk ke arah dari sinyal terkuatnya.
  const buckets = new Map();
  for (const it of scored) {
    if (used.has(it.job.id)) continue;
    const head = it.parts.find((x) => dirs.has(keyOf(x.s)));
    if (!head) continue;
    const key = keyOf(head.s);
    (buckets.get(key) || buckets.set(key, []).get(key)).push(it);
  }
  const order = [...dirs.values()].sort((a, b) => (b.major - a.major) || (b.w - a.w));
  for (const d of order) {
    let items = buckets.get(d.key) || [];
    // Buang ekor yang kecocokannya tipis.
    if (items.length) items = items.filter((it) => it.score >= Math.max(5, items[0].score * 0.3));
    if (!items.length) continue;
    const srcs = [...new Set(d.sigs.flatMap(sourcesOf))];
    const c = CLUSTER_BY_ID.get(d.key);
    const alt = d.key.startsWith('jurusan:') ? d.key.slice(8) : '';
    const title = c ? c.label : `Sesuai jurusan ${alt || p.major}`;
    groups.push({ key: d.key, title, major: d.major || !!alt, items: items.slice(0, cap), total: items.length, sources: srcs });
  }
  return { groups, count: scored.length };
}

/** Alasan singkat kenapa lowongan cocok, dari bagian CV yang paling berpengaruh. */
export function whyText(parts, p, fmt = (t) => t) {
  const out = [];
  const said = new Set();
  if (parts.some((x) => x.s.id === 'jurusan' && !x.s.alt) || parts.some((x) => x.s.src.jurusan)) {
    const j = parts.find((x) => x.s.src.jurusan);
    out.push(`jurusan ${j.s.src.jurusan[0]}`);
  }
  const bySrc = new Map();
  for (const x of parts.slice(0, 3)) {
    for (const src of sourcesOf(x.s)) {
      if (src === 'jurusan') continue;
      const list = bySrc.get(src) || [];
      for (const h of x.s.src[src]) if (!list.includes(h)) list.push(h);
      bySrc.set(src, list);
    }
  }
  for (const src of SOURCE_ORDER) {
    if (out.length >= 3) break;
    if (!bySrc.has(src)) continue;
    if (['ringkasan', 'umum', 'pendidikan'].includes(src) && out.length >= 2) continue;
    const hits = bySrc.get(src).filter((h) => !said.has(h)).slice(0, 2);
    if (src !== 'minat' && !hits.length) continue;
    hits.forEach((h) => said.add(h));
    out.push(src === 'minat' ? 'bidang yang kamu pilih' : `${SOURCE_LABEL[src]}: ${hits.map(fmt).join(', ')}`);
  }
  return out;
}

// ---------------------------------------------------------------- dibanding kualifikasi lowongan
const ALL_TERMS = wordRe(CLUSTERS.flatMap((c) => c.terms).filter((t) => t.length > 2 && !['admin', 'office', 'store', 'toko', 'event', 'design', 'desain', 'content', 'konten', 'sales', 'marketing', 'finance', 'keuangan', 'kas', 'host', 'cs', 'tour', 'travel', 'hotel', 'kue', 'kopi', 'cafe', 'pola', 'stok', 'law', 'hukum', 'obat', 'resep', 'sop', 'ppl', 'lan', 'wan', 'str', 'bls', 'gis', 'iot', 'rab', 'bim', 'pkm', 'gym', 'coach', 'english'].includes(t)));

/** Bandingkan kualifikasi satu lowongan (teks detail dari Karirhub) dengan profil CV. */
export function compareJob(p, job, detail = {}) {
  const rows = [];
  if (p.level != null && job.eduLevel >= 0) {
    const ok = job.eduLevel <= p.level || (p.studying && job.type === 'Magang');
    rows.push({ ok, label: 'Pendidikan', text: `Syarat ${job.edu}${ok ? ', sesuai' : `, CV-mu ${p.levelLabel}${p.studying ? ' (masih kuliah)' : ''}`}` });
  }
  if (detail.minYears != null) {
    const need = detail.minYears * 12;
    const have = p.months;
    if (need === 0) rows.push({ ok: true, label: 'Pengalaman', text: 'Terbuka untuk yang belum berpengalaman' });
    else if (have == null) rows.push({ ok: null, label: 'Pengalaman', text: `Minimal ${detail.minYears} tahun. Lama pengalamanmu belum terbaca dari CV.` });
    else {
      const intern = p.internMonths ? `, magang ${p.internMonths} bulan` : '';
      const mine = have === 0 ? `belum ada pengalaman kerja di CV-mu${intern}` : `CV-mu sekitar ${have < 12 ? `${have} bulan` : `${Math.round(have / 12 * 10) / 10} tahun`.replace('.', ',')}`;
      rows.push({ ok: have >= need, label: 'Pengalaman', text: `Minimal ${detail.minYears} tahun, ${mine}` });
    }
  }
  if (p.prov && job.province) {
    const same = job.province === p.prov;
    rows.push({ ok: same ? true : null, label: 'Lokasi', text: same ? `Satu provinsi dengan domisilimu (${p.prov})` : `Di ${job.province}, domisilimu ${p.prov}` });
  }
  const text = fold([detail.text || '', ...(detail.skills || [])].join('\n'));
  const found = dedupeTerms(findAll(ALL_TERMS, text));
  const have = new Set(p.terms || []);
  const covered = (t) => have.has(t) || [...have].some((h) => h.length > 3 && (h.includes(t) || t.includes(h)));
  return {
    rows,
    have: found.filter(covered).slice(0, 10),
    missing: found.filter((t) => !covered(t)).slice(0, 10)
  };
}

// ---------------------------------------------------------------- simpan
/** Bentuk yang aman disimpan: tanpa nama, kontak, atau kalimat CV. */
export function storable(p) {
  const { v, at, kind, readable, words, level, levelLabel, studying, smk, major, majorOther, majorAlso, prov, city, months, internMonths, signals, terms, tipsHave, ats } = p;
  return { v, at, kind, readable, words, level, levelLabel, studying, smk, major, majorOther, majorAlso, prov, city, months, internMonths, signals, terms, tipsHave, ats };
}
