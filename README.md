# Lab IPA BPI - Sistem Informasi Laboratorium

Sistem informasi laboratorium IPA untuk Sekolah BPI Bandung. Website ini digunakan oleh admin lab dan guru IPA untuk mengelola inventaris alat, peminjaman alat, laporan barang rusak, tata tertib, dan keamanan (K3).

## Tech Stack

- **Framework:** Next.js 16 (App Router)
- **Language:** TypeScript
- **Styling:** TailwindCSS
- **Authentication:** NextAuth.js v5
- **Database:** MongoDB Atlas (dengan Mongoose)
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

### 2. Setup Environment Variables

Buat file `.env.local` di root project dengan isi:

```env
# MongoDB Atlas Connection String
MONGODB_URI=mongodb+srv://ichwanpwt22_db_user:cP0AguBQugICDU7R@labipabpi.wukd9uc.mongodb.net/?appName=LabIpaBpi

# NextAuth Configuration
NEXTAUTH_SECRET="your-secret-key-change-this-in-production"
NEXTAUTH_URL="http://localhost:3000"
```

**Catatan:**

- `MONGODB_URI`: Connection string MongoDB Atlas (sudah disediakan)
- Generate `NEXTAUTH_SECRET` dengan: `openssl rand -base64 32`
- `NEXTAUTH_URL`: URL aplikasi (untuk production, ganti dengan domain Anda)

### 3. Seed Database (Optional)

Untuk membuat user default (admin dan guru), jalankan:

```bash
# Pastikan server sudah running
npm run dev

# Di terminal lain, jalankan:
npm run seed
```

Atau manual via API:

```bash
curl -X POST http://localhost:3000/api/seed
```

### 4. Jalankan Development Server

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
models/               # Mongoose models
lib/                  # Utilities (auth, db)
types/                # TypeScript type definitions
public/               # Static files & uploads
```

## 🔄 Database Configuration

Aplikasi menggunakan MongoDB Atlas sebagai database. Connection string sudah disediakan di `.env.local`.

**Collections:**

- `users` - Data pengguna (admin dan guru)
- `items` - Data inventaris alat
- `loans` - Data peminjaman alat
- `damagereports` - Data laporan kerusakan
- `notifications` - Data notifikasi

## 📝 Scripts

- `npm run dev` - Jalankan development server
- `npm run build` - Build untuk production
- `npm run start` - Jalankan production server
- `npm run lint` - Run ESLint
- `npm run seed` - Seed database dengan user default

## 🔒 Security Notes

- Password disimpan dengan bcrypt hash
- Route protection dengan NextAuth middleware
- Role-based access control (RBAC)
- File upload validation
- MongoDB injection protection dengan Mongoose

## 📄 License

Private project untuk Sekolah BPI Bandung
