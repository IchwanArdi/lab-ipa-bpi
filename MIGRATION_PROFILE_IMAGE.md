# Migration: Tambah Kolom Profile Image

## Cara Menjalankan Migration

Untuk menambahkan kolom `profileImage` ke tabel User, jalankan script berikut:

```bash
node scripts/add-profile-image-column.js
```

Script ini akan:

1. Menambahkan kolom `profileImage VARCHAR(500) NULL` ke tabel User
2. Memeriksa apakah kolom sudah ada sebelumnya (untuk menghindari error)

## Atau Manual SQL

Jika Anda lebih suka menjalankan SQL secara manual:

```sql
ALTER TABLE User
ADD COLUMN profileImage VARCHAR(500) NULL
AFTER name;
```

## Fitur yang Ditambahkan

1. **Upload Gambar Profile**

   - Format yang didukung: JPG, PNG, WEBP
   - Ukuran maksimal: 2MB
   - Gambar disimpan di `public/uploads/profiles/`

2. **API Endpoints**

   - `POST /api/profile/upload` - Upload gambar profile
   - `GET /api/profile` - Mengambil data profile (termasuk profileImage)
   - `PUT /api/profile` - Update profile (termasuk profileImage)

3. **Halaman Profile**
   - Upload gambar langsung dari card profile (ikon kamera)
   - Upload gambar dari form edit
   - Preview gambar sebelum upload
   - Hapus gambar profile
   - Fallback ke avatar dengan inisial jika tidak ada gambar

## Catatan

- Pastikan folder `public/uploads/profiles/` memiliki permission write
- Gambar disimpan dengan format: `{userId}-{timestamp}.{extension}`
- Gambar lama tidak otomatis dihapus (bisa ditambahkan cleanup script jika diperlukan)
