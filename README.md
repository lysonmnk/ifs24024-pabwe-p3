# Praktikum 3 — JavaScript (Studi Kasus)

Aplikasi web satu halaman (single page) yang mendemonstrasikan konsep DOM, event handling, validasi form, logika aplikasi, dan `localStorage` — **tanpa backend/API**. Terdiri dari 3 fitur yang dapat diakses melalui sistem tab: **Expense Tracker**, **Bookmark Manager**, dan **Quiz App**.

---

## 📁 Struktur Proyek

```
.
├── index.html            # Markup & struktur UI (tab, panel, modal)
├── assets/
│   ├── script.js         # Seluruh logika JavaScript (DOM, event, validasi, state, localStorage)
│   └── img/               # (opsional) aset gambar/ikon tambahan
└── README.md
```

> **Catatan:** `index.html` hanya berisi struktur/markup. Seluruh logika (event listener, validasi, manipulasi data, localStorage, query string) ditulis di `assets/script.js` — **tidak ada `onclick` inline**.

---

## 🛠️ Teknologi & Dependency

| Teknologi | Fungsi |
|---|---|
| **HTML5 (Semantic)** | Struktur halaman |
| **Tailwind CSS (CDN)** | Styling & layout responsive |
| **Google Fonts** | Tipografi |
| **Tabler Icons (CDN)** | Ikon UI |
| **Vanilla JavaScript (ES6+)** | Seluruh logika aplikasi |
| **Web Storage API (`localStorage`)** | Penyimpanan data persisten di sisi klien |

Tidak ada backend, database, atau `fetch` ke API eksternal — semua data disimpan dan diolah di browser.

---

## 🚀 Cara Menjalankan

1. Clone atau download repository ini.
2. Buka file `index.html` langsung di browser, **atau** jalankan melalui local server (disarankan agar path asset lebih konsisten), misalnya:

   ```bash
   # Menggunakan Python
   python -m http.server 5500

   # Atau menggunakan ekstensi Live Server di VS Code
   ```
3. Akses `http://localhost:5500` di browser.

---

## 🧭 Navigasi Tab

Aplikasi memiliki 3 tab utama, namun **hanya satu panel yang aktif** dalam satu waktu.

| Tab | Query URL |
|---|---|
| Expense Tracker | `?tab=expense` |
| Bookmark Manager | `?tab=bookmark` |
| Quiz App | `?tab=quiz` |

- Status tab aktif **disimpan dan dipulihkan melalui query string URL** (`URLSearchParams` + `history.replaceState`), **bukan** `localStorage`.
- Saat pertama kali dibuka tanpa parameter `tab`, aplikasi akan default ke salah satu tab (misalnya `expense`) dan otomatis memperbarui URL.
- Refresh halaman pada URL seperti `index.html?tab=quiz` akan langsung menampilkan panel Quiz yang aktif.

---

## 1️⃣ Expense Tracker

Fitur pencatatan pemasukan & pengeluaran sederhana.

### Field Input
- Judul transaksi
- Kategori
- Jumlah (nominal, wajib angka > 0)
- Tipe: **Pemasukan** / **Pengeluaran**
- Tanggal

### Fungsionalitas
- **Ringkasan otomatis**: total pemasukan, total pengeluaran, dan saldo akhir (ter-update setiap ada perubahan data).
- **Cari** transaksi berdasarkan judul/kategori.
- **Filter** berdasarkan tipe (Pemasukan/Pengeluaran/Semua).
- **Sort** berdasarkan tanggal atau jumlah (ascending/descending).
- **Empty state** ditampilkan saat data kosong atau hasil pencarian/filter tidak ditemukan.
- **CRUD lengkap**:
  - Create: tambah transaksi baru melalui form.
  - Read: daftar transaksi ditampilkan dalam list/table yang di-render secara dinamis dari data.
  - Update: klik tombol ubah → membuka **modal edit** → data tersimpan kembali.
  - Delete: klik tombol hapus → **modal konfirmasi** → data terhapus dari `localStorage`.

### Penyimpanan
- Key `localStorage`: **`expense_tracker_data`**
- Format: array of object, contoh:
  ```json
  [
    {
      "id": "e-1699999999999",
      "title": "Gaji Bulanan",
      "category": "Gaji",
      "amount": 5000000,
      "type": "income",
      "date": "2025-06-01"
    }
  ]
  ```

---

## 2️⃣ Bookmark Manager

Fitur penyimpanan tautan (bookmark) favorit.

### Field Input
- Judul
- URL (**wajib** diawali `http://` atau `https://`, divalidasi dengan regex/`URL()`)
- Kategori
- Catatan (opsional)

### Fungsionalitas
- **Validasi URL**: form tidak bisa disubmit jika URL tidak valid/tidak berformat `http(s)://`.
- **Buka link** di tab baru menggunakan `target="_blank"` beserta `rel="noopener noreferrer"` (mencegah tab-nabbing).
- **Cari** bookmark berdasarkan judul/kategori.
- **Sort** berdasarkan judul (A-Z/Z-A) atau tanggal ditambahkan.
- **CRUD lengkap** melalui modal (tambah, ubah, hapus dengan konfirmasi).

### Penyimpanan
- Key `localStorage`: **`bookmark_manager_data`** *(terpisah dari Expense Tracker)*
- Format: array of object, contoh:
  ```json
  [
    {
      "id": "b-1699999999999",
      "title": "MDN Web Docs",
      "url": "https://developer.mozilla.org",
      "category": "Dokumentasi",
      "note": "Referensi JavaScript"
    }
  ]
  ```

---

## 3️⃣ Quiz App

Fitur kuis interaktif dengan skor.

### Data Soal
- Minimal **5 soal** disimpan sebagai **array of object** di dalam `script.js` (bukan hardcode di HTML), contoh struktur:
  ```js
  const quizQuestions = [
    {
      id: 1,
      question: "Apa kepanjangan dari DOM?",
      options: [
        "Document Object Model",
        "Data Object Management",
        "Digital Ordering Method",
        "Document Order Management"
      ],
      answer: 0
    },
    // ...soal lainnya
  ];
  ```

### Alur Aplikasi
1. **Mulai** — layar awal berisi tombol "Mulai Kuis".
2. **Jawab** — soal ditampilkan satu per satu beserta pilihan jawaban.
3. **Feedback** — setelah memilih jawaban, tampil indikator benar/salah sebelum lanjut ke soal berikutnya.
4. **Skor akhir** — setelah semua soal terjawab, ditampilkan total skor.
5. **Ulangi** — tombol untuk mengulang kuis dari awal (reset state, urutan soal bisa diacak/tetap).

### Penyimpanan
- Key `localStorage`: **`quiz_app_highscore`** *(terpisah dari fitur lain)*
- Menyimpan skor tertinggi yang pernah dicapai pengguna, dan diperbarui otomatis jika skor baru lebih tinggi.

---

## 🧠 Konsep JavaScript yang Dilatih

| Konsep | Implementasi |
|---|---|
| Selektor & manipulasi DOM | `querySelector`, `querySelectorAll`, `createElement`, render list dinamis |
| Event handling | `click`, `submit`, `input`, `change` (via `addEventListener`, bukan inline) |
| Array & object method | `push`, `filter`, `find`, `sort`, `forEach`, `map` |
| Persistensi data | `localStorage.setItem` / `getItem` dikombinasikan dengan `JSON.stringify` / `JSON.parse` |
| Validasi form | Validasi angka (jumlah > 0), validasi format URL, validasi field wajib (required) |
| State UI | Manajemen state modal (buka/tutup), state layar kuis (mulai/jawab/hasil) |
| Query string | `URLSearchParams` untuk membaca tab aktif, `history.replaceState` untuk memperbarui URL tanpa reload |

---

## 🎨 Prinsip Desain Kode

- **Separation of Concern**
  - `index.html` → hanya struktur/markup (tab, panel, form, modal).
  - `assets/script.js` → seluruh logika (DOM, event, validasi, state, localStorage, routing tab via query string).
  - Data ketiga fitur menggunakan **key `localStorage` yang berbeda** sehingga tidak saling menimpa.
- **Clean Code**
  - Penamaan variabel, fungsi, dan `id`/`class` deskriptif dan konsisten.
  - Kode dikelompokkan per fitur (Expense, Bookmark, Quiz, Tab Router) dengan komentar penanda bagian, misalnya:
    ```js
    // ===== EXPENSE TRACKER =====
    // ===== BOOKMARK MANAGER =====
    // ===== QUIZ APP =====
    // ===== TAB ROUTER (QUERY STRING) =====
    ```
  - Indentasi konsisten, minim duplikasi kode (fungsi helper untuk render, validasi, dan localStorage dibuat reusable).
- **Responsive**
  - Layout menyesuaikan dari mobile hingga desktop menggunakan utility class Tailwind (`flex`, `grid`, breakpoint `sm:`, `md:`, `lg:`).

---

## 📋 Ringkasan Kriteria Penilaian

| Kriteria | Bobot | Fokus Utama |
|---|---|---|
| Struktur Project | 25% | File inti sesuai format, 3 tab berfungsi, tab via query URL, UI responsive |
| Clean Code | 25% | Keterbacaan, penamaan jelas, komentar per bagian, semantic HTML, tanpa duplikasi |
| Best Practice | 25% | Implementasi CRUD, validasi, sort/filter/search, localStorage per fitur sesuai spesifikasi |
| Separation of Concern | 25% | Pemisahan markup & logika, key storage terpisah, tab state di query string |
| **Total** | **100%** | |

---

## ✅ Checklist Fitur

- [x] Tab Expense, Bookmark, Quiz berfungsi dan hanya satu panel aktif
- [x] Tab aktif tersimpan di query URL (`?tab=...`), bukan localStorage
- [x] Expense Tracker: CRUD, ringkasan saldo, cari/filter/sort, validasi jumlah, modal ubah/hapus
- [x] Bookmark Manager: validasi URL http/https, buka tab baru aman (`noopener noreferrer`), cari/sort, CRUD modal
- [x] Quiz App: ≥5 soal (array of object), alur mulai→jawab→feedback→skor, high score localStorage, bisa diulang
- [x] Key localStorage terpisah untuk tiap fitur
- [x] Logika JS sepenuhnya di `assets/script.js`, tanpa `onclick` inline
- [x] Kode dikomentari per bagian & responsive di semua ukuran layar

---

## 👤 Author

Dibuat sebagai tugas **Praktikum 3 — JavaScript (Studi Kasus)**.
