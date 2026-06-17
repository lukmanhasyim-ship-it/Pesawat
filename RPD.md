# **Dokumen Rapid Prototype Development (RPD)**

## **Nama Proyek: Pesawat \-** PESAN MASAL SEPECEPAT KILAT **(Chrome Extension)**

### **1\. Deskripsi Proyek**

**WA Blast Pro** adalah ekstensi Google Chrome yang dirancang khusus untuk pengguna desktop. Ekstensi ini mengotomatiskan pengiriman pesan WhatsApp secara massal melalui WhatsApp Web (web.whatsapp.com) menggunakan sumber data dari file Excel (.xlsx/.csv). Prototipe ini berfokus pada UI yang modern, dinamis, dan aman (anti-banned).

### **2\. Analisis Kebutuhan (Requirements)**

#### **A. Kebutuhan Fungsional**

* **Upload Data:** Mendukung *Drag & Drop* file Excel/CSV.  
* **Message Builder:** Memungkinkan penulisan pesan dinamis dengan *placeholder* variabel (contoh: {{Nama}}, {{Tagihan}}) berdasarkan header kolom Excel.  
* **Automasi Pengiriman:** Mengendalikan DOM WhatsApp Web secara otomatis untuk mencari kontak, mengetik pesan, dan menekan tombol kirim.  
* **Manajemen Jeda (Delay):** Pengaturan *slider* untuk jeda waktu acak (contoh: 5-15 detik) antar pengiriman untuk menghindari deteksi *spam*.  
* **Export Laporan:** Mengunduh log hasil pengiriman (Berhasil/Gagal) ke dalam format CSV setelah proses selesai.

#### **B. Kebutuhan Non-Fungsional (Desktop Optimized)**

* **Antarmuka:** Berbasis **Chrome Side Panel** agar ekstensi tetap terbuka berdampingan dengan WhatsApp Web tanpa menghalangi pandangan pengguna.  
* **Performa:** Mampu memproses hingga ribuan baris data Excel tanpa membuat browser *freeze* (menggunakan *Web Workers* jika diperlukan).  
* **Keamanan Data:** 100% *Client-side processing*. Tidak ada data kontak atau pesan yang dikirim ke server pihak ketiga.

### **3\. Arsitektur dan Teknologi Dasar**

* **Platform:** Google Chrome Extension (Manifest V3).  
* **UI/UX Framework:** HTML5 & Tailwind CSS (via CDN untuk prototipe cepat).  
* **DOM Manipulation:** Vanilla JavaScript dengan MutationObserver.  
* **Library Pihak Ketiga:** SheetJS (untuk parsing dan export file Excel/CSV).  
* **Komponen Ekstensi Utama:**  
  * manifest.json: Konfigurasi dengan *permissions* sidePanel, activeTab, scripting.  
  * sidepanel.html & sidepanel.js: Antarmuka utama dan logika UI.  
  * content.js: Skrip injeksi untuk berinteraksi langsung dengan elemen WhatsApp Web.  
  * background.js (Service Worker): Mengelola komunikasi antara *Side Panel* dan *Content Script*.

### **4\. Desain Antarmuka (UI/UX)**

Menggunakan konsep **Minimalist Clean UI** dengan palet warna Hijau Sage (\#25D366) dan Soft Grey. Alur pengguna dibagi menjadi 3 tahap dinamis (Wizard) di dalam Side Panel:

1. **Step 1: Data Setup (Drag & Drop Area)**  
   * Area luas untuk menjatuhkan file Excel.  
   * Validasi otomatis: Menampilkan jumlah baris dan daftar kolom yang terdeteksi.  
2. **Step 2: Message & Settings**  
   * *Textarea* untuk menulis template pesan.  
   * *Live Preview Box*: Menampilkan pratinjau pesan riil mengambil data dari baris pertama Excel.  
   * *Delay Slider*: Mengatur kecepatan pengiriman (Lambat, Normal, Cepat).  
3. **Step 3: Live Dashboard (Execution)**  
   * *Progress Bar* dinamis.  
   * Log aktivitas *real-time* (Contoh: "Mengirim ke 0812xxxx... Berhasil").  
   * Tombol *Pause/Resume* dan *Stop*.  
   * Tombol *Download Report* muncul saat proses selesai.

### **5\. Strategi Teknis Inti (Optimasi Desktop)**

#### **A. DOM Polling yang Stabil**

WhatsApp Web adalah aplikasi React (SPA) yang dinamis. Prototipe ini **tidak akan menggunakan setTimeout statis** untuk mencari elemen. Sebagai gantinya, akan menggunakan **MutationObserver** untuk "mendengarkan" perubahan pada halaman, memastikan ekstensi hanya mengetik pesan ketika kotak obrolan *benar-benar* sudah di-*render* di layar.

#### **B. Anti-Ban Mechanism**

Menerapkan fungsi *Randomized Sleep/Delay* di content.js. Ekstensi akan mensimulasikan perilaku manusia:

1. Jeda sebelum mengetik.  
2. Jeda sebelum menekan tombol *Send*.  
3. Jeda acak (misal: antara 8 hingga 14 detik) sebelum berpindah ke nomor berikutnya.

#### **C. Hotkeys (Keyboard Shortcuts)**

Menambahkan *event listener* pada tingkat desktop untuk kemudahan navigasi, seperti:

* Alt \+ S: Start / Resume Blast  
* Alt \+ P: Pause Blast

### **6\. Roadmap Pengembangan (Fase RPD)**

* **Fase 1: Setup & UI Boilerplate (Hari 1-2)**  
  * Membuat struktur folder Manifest V3.  
  * Membangun UI *Side Panel* menggunakan Tailwind CSS (3-Step Wizard).  
* **Fase 2: Integrasi Data (Hari 3\)**  
  * Implementasi library SheetJS untuk *drag & drop* file.  
  * Membuat fitur *Live Preview* pesan berdasarkan data Excel.  
* **Fase 3: Core Automation Script (Hari 4-5)**  
  * Menulis content.js untuk identifikasi *selector* elemen WhatsApp (Kotak pencarian, kotak pesan, tombol kirim).  
  * Implementasi MutationObserver dan logika antrian pengiriman (*queue system*).  
* **Fase 4: Testing & Refinement (Hari 6-7)**  
  * Uji coba dengan data dummy (10-20 nomor).  
  * Menambahkan fitur jeda (*Pause/Resume*).  
  * Implementasi pembuatan laporan (Export to CSV) untuk nomor yang gagal/berhasil.

*Dokumen RPD ini berfungsi sebagai pedoman utama (blueprint) selama proses pengkodean (coding). Jika ada perubahan kebutuhan, dokumen ini harus diperbarui terlebih dahulu.*

*By SMKS AL AZHAR SEMPU \- Mohamad Lukman Nurhasyim, S.Kom, Gr.*