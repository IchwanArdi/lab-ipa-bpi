    # 🚀 Panduan Deployment ke Vercel

Panduan lengkap untuk deploy project Lab IPA BPI ke Vercel.

## 📋 Prerequisites

1. **Akun Vercel** - Daftar di [vercel.com](https://vercel.com)
2. **GitHub Repository** - Project sudah di-push ke GitHub
3. **MongoDB Atlas** - Database sudah setup dan running
4. **Node.js 18+** - Untuk build verification (optional)

## ⚠️ Catatan Penting

### File Upload Limitation

Vercel menggunakan **read-only filesystem** di production. File upload ke `/public/uploads` **TIDAK akan persist** setelah deployment. File akan hilang setiap kali redeploy.

**Solusi:**

- Gunakan **Vercel Blob Storage** (recommended)
- Atau gunakan **Cloud Storage** seperti AWS S3, Cloudinary, dll
- Untuk sementara, file upload akan berfungsi tapi tidak persist

## 📝 Step-by-Step Deployment

### Step 1: Persiapan MongoDB Atlas

1. **Login ke MongoDB Atlas** → [cloud.mongodb.com](https://cloud.mongodb.com)

2. **Configure Network Access:**

   - Buka **Network Access** di sidebar
   - Klik **Add IP Address**
   - Pilih **Allow Access from Anywhere** (`0.0.0.0/0`)
   - Atau tambahkan IP Vercel ranges (akan otomatis jika menggunakan Vercel)

3. **Copy Connection String:**
   - Buka **Database** → **Connect**
   - Pilih **Connect your application**
   - Copy connection string (sudah ada: `mongodb+srv://ichwanpwt22_db_user:cP0AguBQugICDU7R@labipabpi.wukd9uc.mongodb.net/?appName=LabIpaBpi`)

### Step 2: Generate NEXTAUTH_SECRET

Generate secret key untuk NextAuth:

**Windows PowerShell:**

```powershell
[Convert]::ToBase64String((1..32 | ForEach-Object { Get-Random -Minimum 0 -Maximum 256 }))
```

**Atau menggunakan OpenSSL:**

```bash
openssl rand -base64 32
```

**Simpan secret key ini** - akan digunakan di Step 4.

### Step 3: Verifikasi Build Lokal (Optional)

Sebelum deploy, pastikan project bisa di-build:

```bash
# Install dependencies
npm install

# Build project
npm run build

# Jika build berhasil, lanjut ke step berikutnya
```

### Step 4: Deploy ke Vercel

#### Opsi A: Deploy via Vercel Dashboard (Recommended)

1. **Login ke Vercel:**

   - Buka [vercel.com](https://vercel.com)
   - Login dengan GitHub account

2. **Import Project:**

   - Klik **Add New** → **Project**
   - Pilih repository **lab-ipa-bpi** (atau nama repo Anda)
   - Klik **Import**

3. **Configure Project:**

   - **Framework Preset:** Next.js (auto-detect)
   - **Root Directory:** `./` (default)
   - **Build Command:** `npm run build` (default)
   - **Output Directory:** `.next` (default)
   - **Install Command:** `npm install` (default)

4. **Environment Variables:**
   Klik **Environment Variables** dan tambahkan:

   | Name              | Value                                                                                                 | Environment                      |
   | ----------------- | ----------------------------------------------------------------------------------------------------- | -------------------------------- |
   | `MONGODB_URI`     | `mongodb+srv://ichwanpwt22_db_user:cP0AguBQugICDU7R@labipabpi.wukd9uc.mongodb.net/?appName=LabIpaBpi` | Production, Preview, Development |
   | `NEXTAUTH_SECRET` | `[secret-key-yang-digenerate-di-step-2]`                                                              | Production, Preview, Development |
   | `NEXTAUTH_URL`    | `https://your-project.vercel.app`                                                                     | Production                       |
   | `NEXTAUTH_URL`    | `https://your-project-git-main.vercel.app`                                                            | Preview                          |
   | `NEXTAUTH_URL`    | `http://localhost:3000`                                                                               | Development                      |

   **Catatan:**

   - Ganti `your-project` dengan nama project Anda di Vercel
   - `NEXTAUTH_URL` untuk Production akan otomatis terisi setelah deployment pertama
   - Setelah deployment pertama, update `NEXTAUTH_URL` Production dengan URL yang benar

5. **Deploy:**
   - Klik **Deploy**
   - Tunggu proses build dan deploy selesai (2-5 menit)
   - Setelah selesai, Anda akan mendapat URL: `https://your-project.vercel.app`

#### Opsi B: Deploy via Vercel CLI

1. **Install Vercel CLI:**

   ```bash
   npm i -g vercel
   ```

2. **Login:**

   ```bash
   vercel login
   ```

3. **Deploy:**

   ```bash
   vercel
   ```

4. **Set Environment Variables:**

   ```bash
   vercel env add MONGODB_URI
   vercel env add NEXTAUTH_SECRET
   vercel env add NEXTAUTH_URL
   ```

5. **Deploy Production:**
   ```bash
   vercel --prod
   ```

### Step 5: Update NEXTAUTH_URL

Setelah deployment pertama:

1. **Copy Production URL** dari Vercel dashboard (contoh: `https://lab-ipa-bpi.vercel.app`)

2. **Update Environment Variable:**

   - Buka Vercel Dashboard → Project → Settings → Environment Variables
   - Edit `NEXTAUTH_URL` untuk Production
   - Set value: `https://your-actual-url.vercel.app`
   - Save

3. **Redeploy:**
   - Buka **Deployments** tab
   - Klik **...** pada deployment terbaru
   - Pilih **Redeploy**

### Step 6: Seed Database (Optional)

Setelah deployment, seed database dengan user default:

```bash
# Ganti URL dengan production URL Anda
curl -X POST https://your-project.vercel.app/api/seed
```

Atau buka browser dan akses:

```
https://your-project.vercel.app/api/seed
```

**Default Users:**

- **Admin:** username `admin`, password `12345678`
- **Guru:** username `guru1`, password `12345678`

⚠️ **PENTING:** Ganti password default setelah login pertama kali!

### Step 7: Verifikasi Deployment

1. **Test Login:**

   - Buka production URL
   - Login dengan user default
   - Pastikan semua fitur berfungsi

2. **Test Fitur:**

   - ✅ Dashboard loading
   - ✅ Inventaris CRUD
   - ✅ Peminjaman
   - ✅ Laporan kerusakan
   - ✅ Notifikasi
   - ✅ Profile update

3. **Check Logs:**
   - Buka Vercel Dashboard → Project → **Logs**
   - Pastikan tidak ada error

## 🔧 Troubleshooting

### Error: "MONGODB_URI is not defined"

**Solusi:**

- Pastikan environment variable sudah di-set di Vercel
- Pastikan value benar (tanpa quotes)
- Redeploy setelah menambahkan env var

### Error: "no matching decryption secret"

**Solusi:**

- Pastikan `NEXTAUTH_SECRET` sudah di-set
- Pastikan `NEXTAUTH_URL` sesuai dengan production URL
- Generate secret baru jika perlu
- Redeploy setelah update

### Error: MongoDB Connection Timeout

**Solusi:**

- Pastikan MongoDB Atlas Network Access sudah allow `0.0.0.0/0`
- Check connection string benar
- Pastikan database user memiliki permission yang cukup

### Build Error

**Solusi:**

- Check build logs di Vercel dashboard
- Pastikan semua dependencies terinstall
- Pastikan TypeScript tidak ada error
- Run `npm run build` lokal untuk debug

### File Upload Tidak Persist

**Ini normal** - Vercel filesystem read-only. File akan hilang setelah redeploy.

**Solusi untuk Production:**

1. **Vercel Blob Storage** (Recommended)
2. **Cloudinary** untuk image upload
3. **AWS S3** untuk file storage
4. **Supabase Storage**

## 📦 Vercel Configuration

Project ini sudah kompatibel dengan Vercel tanpa perlu konfigurasi tambahan. Next.js 16 auto-detect oleh Vercel.

### Build Settings (Auto-detect)

- **Framework:** Next.js
- **Build Command:** `npm run build`
- **Output Directory:** `.next`
- **Install Command:** `npm install`
- **Node Version:** 18.x (default)

## 🔐 Security Checklist

- [x] `NEXTAUTH_SECRET` menggunakan random string yang kuat
- [x] MongoDB connection string tidak di-commit ke git
- [x] Environment variables hanya di-set di Vercel dashboard
- [x] Password default sudah diganti setelah deployment
- [ ] File upload menggunakan external storage (recommended)

## 📊 Monitoring

Setelah deployment, monitor:

1. **Vercel Analytics** (optional)

   - Buka Project → Analytics
   - Enable untuk tracking

2. **Error Tracking:**

   - Check Logs tab secara berkala
   - Setup error monitoring (Sentry, dll) jika perlu

3. **Performance:**
   - Check deployment speed
   - Monitor API response time

## 🔄 Update Deployment

Setiap kali push ke `main` branch, Vercel akan otomatis:

1. Build project baru
2. Deploy ke production
3. Update URL (jika ada perubahan)

**Manual Redeploy:**

- Vercel Dashboard → Deployments → ... → Redeploy

## 📝 Environment Variables Summary

| Variable          | Description                     | Example                       |
| ----------------- | ------------------------------- | ----------------------------- |
| `MONGODB_URI`     | MongoDB Atlas connection string | `mongodb+srv://...`           |
| `NEXTAUTH_SECRET` | Secret untuk encrypt JWT        | Random base64 string          |
| `NEXTAUTH_URL`    | Production URL aplikasi         | `https://your-app.vercel.app` |

## ✅ Deployment Checklist

- [ ] MongoDB Atlas Network Access configured
- [ ] Environment variables di-set di Vercel
- [ ] Build lokal berhasil (`npm run build`)
- [ ] Project di-deploy ke Vercel
- [ ] `NEXTAUTH_URL` di-update dengan production URL
- [ ] Database di-seed dengan user default
- [ ] Login test berhasil
- [ ] Semua fitur di-test
- [ ] Password default sudah diganti

## 🎉 Selesai!

Setelah semua step selesai, aplikasi Anda sudah live di Vercel!

**Production URL:** `https://your-project.vercel.app`

---

**Need Help?**

- Vercel Docs: [vercel.com/docs](https://vercel.com/docs)
- Next.js Deployment: [nextjs.org/docs/deployment](https://nextjs.org/docs/deployment)
