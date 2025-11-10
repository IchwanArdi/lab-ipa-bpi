# Analisis Mendalam & Perbaikan Sistem Lab IPA BPI

## 🔍 Masalah yang Ditemukan

### 1. **Dashboard - Tidak Dibedakan per Role**

**Masalah:**

- Dashboard menampilkan data yang sama untuk ADMIN dan GURU
- Stats cards menampilkan semua data (tidak difilter per user)
- Analytics charts muncul untuk semua user (seharusnya hanya ADMIN)
- Recent activities menampilkan semua peminjaman (GURU seharusnya hanya lihat miliknya)

**Solusi:**

- Dashboard ADMIN: Stats lengkap + Analytics + Recent activities semua user
- Dashboard GURU: Stats personal + Reminders + Recent activities sendiri

### 2. **Halaman Peminjaman - Fungsi Tidak Jelas**

**Masalah:**

- ADMIN dan GURU melihat halaman yang sama
- GURU bisa lihat semua peminjaman (seharusnya hanya miliknya)
- Kolom "Peminjam" tidak relevan untuk GURU
- Filter status sama untuk semua

**Solusi:**

- ADMIN: Lihat semua peminjaman, bisa approve/reject, kolom "Peminjam" penting
- GURU: Hanya lihat peminjaman sendiri, tidak ada kolom "Peminjam", fokus pada status

### 3. **Halaman Inventaris - Akses Tidak Optimal**

**Masalah:**

- GURU melihat semua alat termasuk yang tidak tersedia
- Tidak ada filter untuk GURU (hanya alat tersedia)
- Deskripsi terlalu detail untuk GURU

**Solusi:**

- ADMIN: Lihat semua alat, bisa CRUD
- GURU: Default filter hanya alat tersedia (stok > 0, kondisi BAIK), bisa pinjam langsung

### 4. **Halaman Barang Rusak - Struktur Sama**

**Masalah:**

- Kolom "Pelapor" tidak relevan untuk GURU (sudah tahu itu dirinya)
- Tampilan sama untuk ADMIN dan GURU

**Solusi:**

- ADMIN: Lihat semua laporan, kolom "Pelapor" penting, bisa update status
- GURU: Hanya lihat laporan sendiri, tidak ada kolom "Pelapor", hanya bisa buat baru

### 5. **Sidebar - Bisa Diperbaiki**

**Masalah:**

- Menu "Peminjaman" dan "Barang Rusak" ada di dua tempat (common + role-specific)
- Label tidak jelas perbedaan fungsi

**Solusi:**

- Pisahkan jelas: GURU untuk "meminjam/melaporkan", ADMIN untuk "mengelola"

### 6. **Analytics - Seharusnya Hanya ADMIN**

**Masalah:**

- Analytics charts muncul untuk semua user
- GURU tidak perlu melihat analytics global

**Solusi:**

- Analytics hanya muncul untuk ADMIN
- GURU bisa lihat statistik personal sederhana

### 7. **Reminders - Perlu Disesuaikan**

**Masalah:**

- Reminders sama untuk semua
- ADMIN perlu lihat semua reminders, GURU hanya miliknya

**Solusi:**

- ADMIN: Lihat semua reminders (untuk monitoring)
- GURU: Hanya lihat reminders sendiri

## 📋 Rencana Perbaikan

### Prioritas 1: Dashboard

- [ ] Bedakan query data per role
- [ ] Sembunyikan Analytics untuk GURU
- [ ] Filter recent activities per role
- [ ] Stats cards berbeda per role

### Prioritas 2: Halaman Peminjaman

- [ ] Bedakan kolom untuk ADMIN vs GURU
- [ ] Filter otomatis untuk GURU
- [ ] Judul dan deskripsi berbeda per role

### Prioritas 3: Halaman Inventaris

- [ ] Default filter untuk GURU (hanya tersedia)
- [ ] Sembunyikan detail teknis untuk GURU
- [ ] Highlight alat tersedia untuk GURU

### Prioritas 4: Halaman Barang Rusak

- [ ] Sembunyikan kolom "Pelapor" untuk GURU
- [ ] Judul berbeda per role

### Prioritas 5: Sidebar

- [ ] Perbaiki struktur menu
- [ ] Label lebih jelas

### Prioritas 6: Analytics & Reminders

- [ ] Analytics hanya untuk ADMIN
- [ ] Reminders filter per role
