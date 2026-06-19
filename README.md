# Pesawat - Pesan Masal Secepat Kilat

**Pesawat** adalah ekstensi Google Chrome untuk mengirim pesan WhatsApp secara massal (WhatsApp Blast) melalui WhatsApp Web. Ekstensi ini memproses data dari file Excel/CSV dan mengirim pesan otomatis ke banyak kontak dengan dukungan lampiran (PDF, gambar, video).

---

## Fitur

- **Kirim pesan massal** ke ratusan kontak WA secara otomatis
- **Template dinamis** dengan placeholder `{{NamaKolom}}`
- **Lampiran file**: PDF, PNG, JPG, MP4, MOV, 3GP (caption = teks template)
- **Jeda acak** untuk menghindari deteksi spam (5 level kecepatan)
- **Live dashboard**: progress, statistik sukses/gagal, estimasi waktu real-time
- **Resume otomatis** jika side panel tertutup (state tersimpan)
- **Deteksi koneksi** WhatsApp Web via heartbeat
- **WA Business AI** auto-reply bypass
- **Laporan CSV** setelah pengiriman selesai
- **Shortcut keyboard**: `Alt+S` (mulai/lanjutkan), `Alt+P` (jeda)

---

## Persyaratan Sistem

- **Google Chrome** versi 88+ (Manifest V3)
- **WhatsApp Web** (https://web.whatsapp.com) sudah login
- File data dalam format **.xlsx**, **.xls**, atau **.csv**

---

## Cara Pemasangan (Instalasi)

Karena ekstensi ini belum dipublikasikan ke Chrome Web Store, pasang secara manual melalui mode Developer Chrome.

### 1. Simpan Proyek ke Local Disk

Simpan folder proyek di local disk, misalnya:

```
C:\Pesawat
```

Atau clone repositori:

```
git clone https://github.com/username/pesawat.git C:\Pesawat
```

### 2. Buka Halaman Ekstensi Chrome

```
chrome://extensions
```

### 3. Aktifkan Mode Developer

Aktifkan toggle **"Developer mode"** (pojok kanan atas).

### 4. Muat Ekstensi

Klik **"Load unpacked"**, pilih folder `C:\Pesawat`.

### 5. Sematkan ke Toolbar

Klik ikon **puzzle** (Extensions) di toolbar, cari **"Pesawat"**, klik ikon pin agar mudah diakses.

---

## Cara Penggunaan

### 1. Buka WhatsApp Web

Buka https://web.whatsapp.com dan login.

### 2. Buka Side Panel

Klik ikon Pesawat di toolbar Chrome. Side panel terbuka di sisi kanan.

### 3. Upload Data (Step 1)

- **Drag & drop** atau klik untuk memilih file Excel/CSV.
- Kolom dengan nama seperti **Phone**, **Telepon**, **No WA**, **Nomor**, dll. akan otomatis dikenali sebagai nomor tujuan.
- Klik **"Lanjutkan"**.

### 4. Buat Pesan & Lampiran (Step 2)

- Tulis template pesan. Contoh:
  ```
  Halo {{Nama}}, tagihan Rp{{Tagihan}} sudah jatuh tempo.
  ```
- Klik placeholder `{{NamaKolom}}` untuk menyisipkan otomatis.
- **Lampiran (opsional)**: Tarik & drop atau klik area upload. Format: PDF, PNG, JPG, MP4, MOV, 3GP.
- Atur jeda dengan slider. Makin lambat makin aman.
- Konfirmasi jumlah kontak dan lampiran sebelum memulai.

### 5. Eksekusi (Step 3)

- Dashboard menampilkan progress real-time + **estimasi waktu sisa** (countdown).
- Tombol kontrol: **Jeda** (`Alt+P`), **Lanjutkan** (`Alt+S`), **Berhenti**.
- Setelah selesai, klik **"Download Laporan"** (format CSV).

---

## Struktur File

```
Pesawat/
├── manifest.json          # Konfigurasi ekstensi Chrome
├── background.js          # Service worker
├── sidepanel.html         # Antarmuka side panel
├── sidepanel.js           # Logika antarmuka
├── content.js             # Skrip injeksi ke WhatsApp Web
├── click.js               # Helper klik elemen DOM
├── LOGO.png               # Ikon aplikasi (bundar)
├── lib/
│   ├── phone.js           # Validasi nomor telepon
│   └── xlsx.full.min.js   # Parser Excel/CSV (SheetJS)
├── RPD.md                 # Dokumen pengembangan
└── README.md              # File ini
```

---

## Pintasan Keyboard

| Shortcut | Fungsi |
|----------|--------|
| `Alt+S`  | Mulai / Lanjutkan Blast |
| `Alt+P`  | Jeda Blast |

---

## Format File Data

Ekstensi mendukung `.xlsx`, `.xls`, dan `.csv`.

Contoh tabel:

| Nama | Nomor | Tagihan |
|------|-------|---------|
| Andi | 08123456789 | 150000 |
| Budi | 08234567890 | 250000 |

Kolom **nomor** (Phone, Telepon, No HP, WA, dll.) **wajib** ada. Format nomor: awalan `0`, `62`, atau `+62` akan dibersihkan otomatis.

---

## Keamanan & Privasi

- **100% Client-side**: Semua data diproses di browser Anda.
- **Tidak ada data dikirim ke server pihak ketiga**.
- Hanya terhubung ke WhatsApp Web.

---

## Catatan Penting

1. **Gunakan jeda cukup** (minimal 5-10 detik) untuk menghindari pemblokiran akun.
2. **Jangan gunakan untuk spam**. Ekstensi ini untuk keperluan resmi seperti pengumuman atau tagihan.
3. **Nomor tidak terdaftar** di WA akan dicatat sebagai gagal.
4. **WA Business**: Ekstensi otomatis mengeklik **"Tanggapi secara manual"** jika AI auto-reply aktif.
5. **Lampiran**: File dikirim sebagai media, teks template sebagai caption. Satu set lampiran sama untuk semua kontak.

---

## Troubleshooting

### Ekstensi tidak muncul
- Aktifkan **Developer mode** di `chrome://extensions`.
- Klik **"Load unpacked"** ulang, arahkan ke folder proyek.

### Side panel tidak terbuka
- Klik ikon ekstensi di toolbar.
- Pastikan WhatsApp Web terbuka di tab aktif.

### Data tidak terbaca
- Gunakan file `.xlsx`, `.xls`, atau `.csv`.
- Pastikan ada kolom nomor (Phone, Telepon, WA, No, dll.).

### Pengiriman gagal terus
- Periksa format nomor (boleh dengan `0`, `62`, atau `+62`).
- Atur jeda lebih lambat.
- Refresh WhatsApp Web.

### Lampiran tidak terkirim
- Format didukung: PDF, PNG, JPG, MP4, MOV, 3GP.
- Ukuran terlalu besar mungkin ditolak WA Web.
- WA Web harus dalam keadaan fokus dan terhubung.

### WA Business AI auto-reply
- Ekstensi otomatis mengeklik **"Tanggapi secara manual"**.
- Jika masih terblokir, nonaktifkan AI auto-reply di pengaturan WA Business.

---

## Lisensi

Hak cipta © Mohamad Lukman Nurhasyim, S.Kom, Gr.

---

## Kontak

Untuk laporan bug atau saran, hubungi pengembang.
