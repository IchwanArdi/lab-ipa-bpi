# Lab IPA BPI - Sistem Informasi Laboratorium

Sistem informasi laboratorium IPA untuk Sekolah BPI Bandung. Website ini digunakan oleh admin lab dan guru IPA untuk mengelola inventaris alat, peminjaman alat, laporan barang rusak, tata tertib, dan keamanan (K3).

## Tech Stack

- **Framework:** Next.js 16 (App Router)
- **Language:** TypeScript
- **Styling:** TailwindCSS
- **Authentication:** NextAuth.js v5
- **Database:** MySQL (dengan mysql2)
- **Validation:** Zod

## Fitur

1. **Dashboard** - Ringkasan inventaris, peminjaman aktif, laporan rusak
2. **Inventaris Alat** - CRUD alat (nama, kode, kategori, stok, kondisi)
3. **Peminjaman Alat** - Form peminjaman dengan status (menunggu, disetujui, dipinjam, dikembalikan)
4. **Barang Rusak** - Laporan barang rusak dengan upload foto
5. **Tata Tertib** - Tampilkan peraturan lab
6. **K3 / Keamanan** - Panduan SOP dan alat keselamatan
7. **Manajemen Pengguna** - Buat akun guru/admin, reset password

## Role Pengguna

- **Admin** - Kelola semua data dan akun pengguna
- **Guru** - Login, pinjam alat, lapor kerusakan, lihat tata tertib

## Akun Default

- **Admin:** username `admin`, password `12345678`
- **Guru:** username `guru1`, password `12345678`

## Setup & Instalasi

### 1. Install Dependencies

```bash
npm install
```

### 2. Install & Setup MySQL

**Install MySQL Server** (jika belum):

- Windows: Download dari [MySQL Official](https://dev.mysql.com/downloads/mysql/) atau gunakan XAMPP/WAMP
- Mac: `brew install mysql`
- Linux: `sudo apt-get install mysql-server`

**Buat Database:**

```sql
CREATE DATABASE bpi_lab;
```

Atau via command line:

```bash
mysql -u root -p -e "CREATE DATABASE bpi_lab;"
```

### 3. Setup Environment Variables

Buat file `.env` di root project dengan isi:

```env
# Database Configuration
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=
DB_NAME=bpi_lab

# NextAuth Configuration
NEXTAUTH_SECRET="your-secret-key-change-this-in-production"
NEXTAUTH_URL="http://localhost:3000"
```

**Catatan:**

- `DB_HOST`: Host MySQL (default: localhost)
- `DB_USER`: Username MySQL (default: root)
- `DB_PASSWORD`: Password MySQL (kosongkan jika tidak ada password)
- `DB_NAME`: Nama database (default: bpi_lab)
- Generate `NEXTAUTH_SECRET` dengan: `openssl rand -base64 32`

**Alternatif:** Anda juga bisa menggunakan format `DATABASE_URL`:

```env
DATABASE_URL="mysql://root:password@localhost:3306/bpi_lab"
```

### 4. Setup Database Schema

Jalankan script setup untuk membuat database dan tabel:

```bash
npm run db:setup
```

Script ini akan:

- Membuat database `bpi_lab` (jika belum ada)
- Membuat semua tabel (User, Item, Loan, DamageReport, Notification)
- Membuat user default (admin dan guru)

**Alternatif:** Jika ingin manual, jalankan SQL script:

```bash
mysql -u root -p bpi_lab < database/schema.sql
```

### 5. Jalankan Development Server

```bash
npm run dev
```

Buka [http://localhost:3000](http://localhost:3000) di browser.

## 📁 Struktur Project

```
app/
├── api/              # API routes
├── dashboard/        # Halaman dashboard
├── login/            # Halaman login
└── layout.tsx        # Root layout

components/           # Komponen reusable
database/             # SQL schema file
lib/                  # Utilities (auth, db)
types/                # TypeScript type definitions
public/               # Static files & uploads
```

## 🔄 Database Configuration

Aplikasi menggunakan MySQL sebagai database. Untuk development, pastikan:

- MySQL server sudah running
- Database sudah dibuat
- `DATABASE_URL` di `.env` sudah dikonfigurasi dengan benar
- Semua tabel sudah dibuat dengan menjalankan `database/schema.sql`

Format `DATABASE_URL`:

```
mysql://username:password@host:port/database_name
```

## 📝 Scripts

- `npm run dev` - Jalankan development server
- `npm run build` - Build untuk production
- `npm run start` - Jalankan production server
- `npm run lint` - Run ESLint

## 🔒 Security Notes

- Password disimpan dengan bcrypt hash
- Route protection dengan NextAuth middleware
- Role-based access control (RBAC)
- File upload validation
- SQL injection protection dengan prepared statements

## 📄 License

Private project untuk Sekolah BPI Bandung
