# VOCACLIMB: Web-Based Snakes and Ladders Educational Game

VOCACLIMB adalah media pembelajaran interaktif berbasis web berupa permainan ular tangga edukatif untuk meningkatkan penguasaan kosakata bahasa Inggris (*English vocabulary*) bagi siswa kelas II sekolah dasar. Proyek ini dikembangkan sebagai bagian dari penelitian tugas akhir/skripsi.

---

## 💡 Alasan Pemilihan Platform & Arsitektur Aplikasi

Pemilihan teknologi dan arsitektur pada VOCACLIMB dirancang khusus untuk menjawab tantangan nyata di lapangan:

1. **Kompatibilitas Perangkat Sekolah (Low-Spec & Chromebook Friendly):**
   Aplikasi berbasis web ini dioptimalkan agar dapat berjalan mulus di perangkat sekolah berspesifikasi rendah atau Chromebook yang umum digunakan di sekolah dasar, tanpa memerlukan instalasi aplikasi tambahan.
2. **Menyesuaikan Kebijakan Sekolah (Tanpa Smartphone):**
   Sebagian besar sekolah dasar melarang siswanya membawa ponsel pintar (*smartphone*). Penggunaan platform berbasis web memastikan siswa tetap bisa mengakses pembelajaran interaktif menggunakan komputer atau laptop sekolah.
3. **Ketangguhan di Daerah (Pelosok):**
   Dengan arsitektur web modern yang ringan (React Vite + Supabase), aplikasi ini dirancang tetap responsif dan andal meskipun diuji pada keterbatasan infrastruktur atau jaringan di daerah pelosok.
4. **Skalabilitas Logika:**
   Filosofi pengembangannya sederhana: **"Jika aplikasi ini terbukti lancar dan tangguh berjalan di sekolah dengan fasilitas terbatas, maka sistem ini otomatis akan berjalan jauh lebih optimal di sekolah modern."**

---

## 🚀 Fitur Utama
- **Game Edukasi Ular Tangga Interaktif:** Papan permainan digital terintegrasi kuis kosakata.
- **Manajemen Soal Dinamis:** Memungkinkan pengajar memperbarui materi soal secara fleksibel.
- **Live Demo:** Dapat diakses secara publik melalui Vercel.

## 🛠️ Teknologi yang Digunakan
- **Frontend Framework:** React JS (Vite)
- **Styling:** Tailwind CSS
- **Database & Backend Services:** Supabase
- **Deployment:** Vercel
---

## ⚙️ Cara Instalasi & Menjalankan Proyek Secara Lokal

### 1. Clone Repositori
```bash
git clone [https://github.com/Guapaiz/nama-repo-vocaclimb.git](https://github.com/Guapaiz/nama-repo-vocaclimb.git)
cd nama-repo-vocaclimb
2. Install Dependensi
Bash
npm install
3. Konfigurasi Environment Variables
Buat file .env di root direktori:

Code snippet
VITE_SUPABASE_URL=url_supabase_anda
VITE_SUPABASE_ANON_KEY=anon_key_supabase_anda
4. Jalankan Development Server
Bash
npm run dev
Akses melalui http://localhost:5173.

🌐 Live Demo
vocaclimb.vercel.app

👨‍💻 Author
Nama: Guapaiz

GitHub: @Guapaiz