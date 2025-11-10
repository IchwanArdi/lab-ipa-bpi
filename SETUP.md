# Setup Simple - Lab IPA BPI

## Prerequisites

### 1. Install MySQL Server

Pastikan MySQL sudah terinstall di sistem Anda:

- **Windows:** Download dari [MySQL Official](https://dev.mysql.com/downloads/mysql/) atau gunakan XAMPP/WAMP
- **Mac:** `brew install mysql` atau download installer
- **Linux:** `sudo apt-get install mysql-server` (Ubuntu/Debian)

### 2. Buat Database MySQL

Login ke MySQL dan buat database baru:

```sql
CREATE DATABASE bpi_lab;
```

Atau via command line:

```bash
mysql -u root -p -e "CREATE DATABASE bpi_lab;"
```

## Langkah Setup

### 1. Install Dependencies

```bash
npm install
```

### 2. Buat file `.env`

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

### 3. Setup Database

Jalankan script setup untuk membuat database dan tabel:

```bash
npm run db:setup
```

Script ini akan:

- Membuat database `bpi_lab` (jika belum ada)
- Membuat semua tabel (User, Item, Loan, DamageReport, Teacher)
- Membuat user default:
  - **Admin**: username `admin`, password `12345678`
  - **Guru**: username `guru1`, password `12345678`

**Alternatif:** Jika ingin manual, jalankan SQL script:

```bash
mysql -u root -p bpi_lab < database/schema.sql
```

### 4. Jalankan Development Server

```bash
npm run dev
```

Buka [http://localhost:3000](http://localhost:3000) di browser.

### 5. Login

- **Admin**: username `admin`, password `12345678`
- **Guru**: username `guru1`, password `12345678`

## Troubleshooting

### Error Koneksi MySQL

Jika ada error koneksi ke MySQL:

1. Pastikan MySQL server sudah running
2. Cek username, password, dan nama database di `.env`
3. Pastikan database sudah dibuat: `CREATE DATABASE bpi_lab;`
4. Test koneksi: `mysql -u root -p -e "USE bpi_lab;"`
5. Pastikan semua tabel sudah dibuat dengan menjalankan `database/schema.sql`

### Error Module Not Found

Jika ada error module not found:

1. Hapus folder `node_modules` dan `package-lock.json`
2. Install ulang: `npm install`
3. Restart dev server

## Selesai! 🎉

Setelah seed berhasil, aplikasi siap digunakan!
