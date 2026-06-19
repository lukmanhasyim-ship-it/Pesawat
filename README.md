# Pesawat - Pesan Masal Secepat Kilat

**Pesawat** adalah ekstensi Google Chrome untuk mengirim pesan WhatsApp secara massal (WhatsApp Blast) melalui WhatsApp Web. Ekstensi ini memproses data dari file Excel/CSV dan mengirim pesan secara otomatis dengan jeda acak untuk menghindari deteksi spam.

---

## Persyaratan Sistem

- **Google Chrome** versi 88 atau lebih baru (Manifest V3)
- **WhatsApp Web** (https://web.whatsapp.com) sudah login
- File data dalam format **.xlsx**, **.xls**, atau **.csv**

---

## Cara Pemasangan (Instalasi)

Karena ekstensi ini belum dipublikasikan ke Chrome Web Store, Anda harus memasangnya secara manual melalui mode **Developer** Chrome.

### Langkah 1: Simpan Proyek ke Local Disk

**Simpan folder proyek di local disk (C:\)**, misalnya:

```
C:\Pesawat
```

Atau clone repositori:

```
git clone https://github.com/username/pesawat.git C:\Pesawat
```

> Pastikan folder tersimpan di lokal agar ekstensi dapat berfungsi dengan baik.

### Langkah 2: Buka Halaman Ekstensi Chrome

Buka Chrome dan ketik URL berikut di address bar:

```
chrome://extensions
```

### Langkah 3: Aktifkan Mode Developer

Aktifkan toggle **"Developer mode"** (Mode Pengembang) di pojok kanan atas halaman.

![Developer Mode](https://developer.chrome.com/static/images/devtools/extension-dev-mode.png)

### Langkah 4: Muat Ekstensi

Klik tombol **"Load unpacked"** (Muat ekstensi yang belum dibongkar), lalu pilih folder proyek `Pesawat` (folder yang berisi file `manifest.json`).

### Langkah 5: Verifikasi Pemasangan

Setelah berhasil dimuat, ekstensi **Pesawat** akan muncul di daftar ekstensi dengan nama **"Pesawat - Pesan Masal Secepat Kilat"**.

### Langkah 6: Sematkan Ekstensi (Opsional)

Agar ekstensi mudah diakses setiap saat, sematkan (pin) ke toolbar Chrome:

1. Klik ikon **puzzle** (Extensions) di pojok kanan atas toolbar Chrome.
2. Cari ekstensi **"Pesawat - Pesan Masal Secepat Kilat"** di daftar.
3. Klik ikon **pin** di samping nama ekstensi (akan berubah menjadi warna biru/terisi).
4. Ikon Pesawat akan muncul langsung di toolbar untuk akses cepat.

Setelah disematkan, cukup klik ikon **P** di toolbar untuk membuka side panel Pesawat.

---

## Cara Penggunaan

### 1. Buka WhatsApp Web

Buka https://web.whatsapp.com dan pastikan Anda sudah login dengan memindai QR code.

### 2. Buka Side Panel

Klik ikon ekstensi Pesawat di toolbar Chrome. Side panel akan terbuka di sisi kanan browser.

Alternatif: Gunakan shortcut `Alt+S` untuk memulai.

### 3. Upload Data (Step 1)

- **Drag & drop** file Excel/CSV ke area yang tersedia, atau klik area tersebut untuk memilih file.
- File harus memiliki kolom **Nomor** (atau **Telepon**, **Phone**, **No**) yang berisi nomor WhatsApp tujuan.
- Setelah file terupload, sistem akan menampilkan jumlah kontak dan kolom yang terdeteksi.
- Pilih kode negara default sesuai kebutuhan.
- Klik **"Lanjutkan"**.

### 4. Buat Pesan & Lampiran (Step 2)

- Tulis template pesan di kolom yang tersedia.
- Gunakan placeholder `{{NamaKolom}}` untuk data dinamis. Contoh:
  ```
  Halo {{Nama}}, tagihan Anda sebesar Rp{{Tagihan}} sudah jatuh tempo.
  Silakan segera lakukan pembayaran. Terima kasih.
  ```
- Pratinjau pesan akan tampil secara real-time menggunakan data baris pertama.
- **Lampiran (Opsional)**: Upload file yang ingin dilampirkan ke semua kontak:
  - Format didukung: **PDF**, **PNG**, **JPG**, **MP4**, **MOV**, **3GP**
  - Tarik & drop atau klik area upload untuk memilih file
  - File akan dikirim sebagai lampiran, teks template menjadi caption
  - Ukuran file mengikuti kebijakan WhatsApp Web
- Atur kecepatan pengiriman dengan slider **Pengaturan Jeda**:
  - **Lambat** (1): jeda 8-15 detik (paling aman)
  - **Normal** (3): jeda 3-8 detik
  - **Cepat** (5): jeda 1-3 detik (risiko tinggi)
- Klik **"Mulai Blast"** untuk lanjut.

### 5. Eksekusi Pengiriman (Step 3)

- Dashboard akan menampilkan status pengiriman secara real-time.
- Gunakan tombol kontrol:
  - **Jeda** (`Alt+P`) : Menjeda proses sementara
  - **Lanjutkan** (`Alt+S`) : Melanjutkan proses yang dijeda
  - **Berhenti** : Menghentikan proses sepenuhnya
- Setelah selesai, klik **"Download Laporan"** untuk mengunduh hasil dalam format CSV.

---

## Struktur File

```
Pesawat/
├── manifest.json          # Konfigurasi ekstensi Chrome
├── background.js          # Service worker (background process)
├── sidepanel.html         # Antarmuka utama (side panel)
├── sidepanel.js           # Logika antarmuka dan kontrol
├── content.js             # Skrip injeksi untuk WhatsApp Web
├── click.js               # Helper untuk klik elemen DOM
├── lib/
│   ├── phone.js           # Library validasi nomor telepon
│   └── xlsx.full.min.js   # Library SheetJS (Excel/CSV parser)
├── assets/                # Folder aset (ikon, dll.)
├── RPD.md                 # Dokumen Rapid Prototype Development
└── README.md              # File ini
```

---

## Pintasan Keyboard (Shortcuts)

| Shortcut | Fungsi |
|----------|--------|
| `Alt+S`  | Mulai / Lanjutkan Blast |
| `Alt+P`  | Jeda Blast |

---

## Format File Data

Ekstensi mendukung file dengan ekstensi `.xlsx`, `.xls`, dan `.csv`.

Contoh format tabel yang benar:

| Nama | Nomor | Tagihan |
|------|-------|---------|
| Andi | 08123456789 | 150000 |
| Budi | 08234567890 | 250000 |

Kolom **Nomor** (atau variasi seperti `Telepon`, `Phone`, `No`) **wajib** ada. Kolom lain bersifat opsional dan bisa digunakan sebagai placeholder di template pesan.

---

## Keamanan & Privasi

- **100% Client-side**: Semua data diproses di browser Anda sendiri.
- **Tidak ada data yang dikirim ke server pihak ketiga**.
- Koneksi hanya terjadi antara ekstensi dan WhatsApp Web.

---

## Catatan Penting

1. **Gunakan jeda yang cukup** untuk menghindari pemblokiran akun WhatsApp. Disarankan jeda minimal 5-10 detik.
2. **Jangan gunakan untuk spam**. Ekstensi ini dibuat untuk keperluan komunikasi resmi seperti pengumuman, tagihan, atau undangan.
3. **Pastikan nomor valid**. Nomor yang tidak terdaftar di WhatsApp akan dicatat sebagai gagal.
4. **Batasan WhatsApp Web**: WhatsApp Web mungkin membatasi pengiriman jika terdeteksi aktivitas tidak wajar.
5. **WhatsApp Business**: Jika menggunakan WhatsApp Business dengan **AI auto-reply** aktif, ekstensi akan otomatis mengeklik tombol **"Tanggapi secara manual"** agar pesan dapat terkirim.
6. **Lampiran file**: File dikirim ke semua kontak sebagai caption. Untuk mengirim lampiran berbeda per kontak, gunakan kolom `Lampiran` di file Excel (pengembangan mendatang).

---

## Troubleshooting

### Ekstensi tidak muncul
- Pastikan **Developer mode** sudah aktif di `chrome://extensions`.
- Coba klik tombol **"Load unpacked"** ulang.
- Refresh halaman `chrome://extensions`.

### Side panel tidak terbuka
- Klik ikon ekstensi di toolbar, bukan klik kanan.
- Pastikan WhatsApp Web sudah terbuka di tab aktif.

### Data tidak terbaca
- Pastikan file menggunakan ekstensi `.xlsx`, `.xls`, atau `.csv`.
- Pastikan ada kolom yang mengandung kata "Nomor", "Telepon", "Phone", atau "No".
- Periksa apakah file tidak sedang dibuka di program lain.

### Pengiriman gagal terus
- Periksa format nomor (gunakan format internasional jika perlu).
- Coba atur jeda lebih lambat.
- Refresh WhatsApp Web dan coba lagi.

### Lampiran tidak terkirim
- Pastikan format file didukung (PDF, PNG, JPG, MP4, MOV, 3GP).
- File terlalu besar mungkin ditolak oleh WhatsApp Web.
- Coba kurangi jumlah atau ukuran file lampiran.

### WA Business AI auto-reply menghalangi
- Ekstensi akan otomatis mengeklik **"Tanggapi secara manual"**.
- Jika masih terblokir, pastikan overlay WA Business benar-benar muncul.
- Jika masalah berlanjut, nonaktifkan sementara fitur AI auto-reply di pengaturan WhatsApp Business.

---

## Lisensi

Hak cipta © SMKS AL AZHAR SEMPU - Mohamad Lukman Nurhasyim, S.Kom, Gr.

---

## Kontak

Untuk laporan bug atau saran, silakan hubungi pengembang.
