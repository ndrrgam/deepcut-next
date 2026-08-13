# DEEP CUT Barbershop — Backend Reservasi

Backend sistem reservasi barbershop dengan **Next.js (App Router)** + **Supabase (PostgreSQL)**.

## Ringkasan Fitur

- **Customer booking**: pilih cabang, tanggal, dan slot jam (interval 30 menit, 10.00–20.00 WIB).
- **Anti-bentrok**: kombinasi `(branch_id, tanggal, jam_mulai)` unik via constraint DB.
- **Admin dashboard**: login (Supabase Auth), filter booking, update status, edit/hapus, lihat jadwal harian, blokir slot manual.

## Struktur Proyek

```
app/api/
  branches/route.ts            # GET daftar cabang
  available-slots/route.ts     # GET slot kosong (?branch_id=...&date=...)
  bookings/route.ts            # POST buat booking (customer), GET daftar (admin)
  bookings/[id]/route.ts       # PATCH update status/edit, DELETE hapus
  schedule/route.ts            # GET jadwal harian per cabang (admin)
  slots/block/route.ts         # POST/DELETE blokir slot manual (admin)
lib/
  supabase/server.ts           # Supabase server client (cookie session)
  supabase/client.ts           # Supabase browser client (anon key)
  supabase/admin.ts            # Supabase admin client (service role, server-only)
  constants.ts                 # Aturan bisnis (jam operasional, interval, dll.)
  datetime.ts                  # Helper waktu WIB
  slots.ts                     # Generate & validasi slot
  validation.ts                # Validasi nomor WA Indonesia
  types.ts                     # Type definitions database
  api.ts                       # Helper response & guard admin
middleware.ts                  # Proteksi route /admin/*
supabase/migrations/*.sql      # SQL migration (tabel + RLS + constraint)
.env.local.example             # Template env vars
```

---

## 1. Setup Supabase

1. Buat project baru di [Supabase](https://supabase.com).
2. Buka **SQL Editor**, paste isi file `supabase/migrations/20260813000000_init.sql`, lalu **Run**.
   - Ini membuat tabel `branches`, `bookings`, enum `booking_status`, unique index anti-bentrok, dan RLS policies.
3. Buka **Authentication → Users → Add user** untuk membuat akun admin (email + password). Aktifkan "Auto Confirm User".

## 2. Setup Environment

Salin template dan isi nilainya:

```bash
cp .env.local.example .env.local
```

Isi `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, dan `SUPABASE_SERVICE_ROLE_KEY` dari **Dashboard Supabase → Settings → API**.

> ⚠️ `SUPABASE_SERVICE_ROLE_KEY` **hanya** dipakai di server-side. Jangan pernah import `lib/supabase/admin.ts` dari client component.

## 3. Install & Run

```bash
npm install
npm run dev
```

Project berjalan di `http://localhost:3000` (atau port berikutnya jika terpakai).

---

## 4. Referensi API

### GET `/api/branches`

**Response 200:**

```json
{
  "data": [
    { "id": "uuid", "nama_cabang": "Cabang Penjawi", "created_at": "..." },
    { "id": "uuid", "nama_cabang": "Cabang Jiwonolo", "created_at": "..." }
  ]
}
```

### GET `/api/available-slots?branch_id=<uuid>&date=YYYY-MM-DD`

**Response 200:**

```json
{
  "data": {
    "branch_id": "uuid",
    "date": "2026-08-14",
    "available_slots": [
      { "jam_mulai": "10:00", "jam_selesai": "10:30" },
      { "jam_mulai": "10:30", "jam_selesai": "11:00" }
    ],
    "total_available": 2
  }
}
```

**Error 400** (query tidak valid):

```json
{ "error": "Query tidak valid", "details": { "date": ["Format tanggal harus YYYY-MM-DD"] } }
```

### POST `/api/bookings`

**Request:**

```json
{
  "nama": "Budi Santoso",
  "no_wa": "081234567890",
  "branch_id": "uuid",
  "tanggal": "2026-08-14",
  "jam_mulai": "13:30"
}
```

**Response 201:**

```json
{
  "data": {
    "id": "uuid",
    "nama": "Budi Santoso",
    "no_wa": "6281234567890",
    "branch_id": "uuid",
    "tanggal": "2026-08-14",
    "jam_mulai": "13:30",
    "jam_selesai": "14:00",
    "status": "pending",
    "created_at": "..."
  },
  "message": "Booking berhasil dibuat. Status: pending (menunggu konfirmasi admin)."
}
```

**Error 409** (slot terisi / bentrok):

```json
{ "error": "Slot sudah terisi. Silakan pilih jam lain." }
```

**Error 400** (validasi gagal):

```json
{
  "error": "Data booking tidak valid",
  "details": { "no_wa": ["Format No. WhatsApp Indonesia tidak valid (08xxx / 628xxx)"] }
}
```

### GET `/api/bookings` (admin, auth required)

Query params opsional: `branch_id`, `tanggal`, `status`.

**Response 200:**

```json
{
  "data": [
    {
      "id": "uuid",
      "nama": "Budi Santoso",
      "no_wa": "6281234567890",
      "branch_id": "uuid",
      "tanggal": "2026-08-14",
      "jam_mulai": "13:30",
      "jam_selesai": "14:00",
      "status": "pending",
      "created_at": "...",
      "branches": { "nama_cabang": "Cabang Penjawi" }
    }
  ]
}
```

**Error 401** (belum login):

```json
{ "error": "Unauthorized" }
```

### PATCH `/api/bookings/[id]` (admin)

**Request** (update status):

```json
{ "status": "confirmed" }
```

**Request** (edit penuh):

```json
{
  "nama": "Budi S.",
  "no_wa": "081111222333",
  "tanggal": "2026-08-15",
  "jam_mulai": "15:00"
}
```

**Response 200:**

```json
{ "data": { "...": "booking ter-update" }, "message": "Booking diperbarui." }
```

### DELETE `/api/bookings/[id]` (admin)

**Response 200:**

```json
{ "message": "Booking dihapus." }
```

### GET `/api/schedule?branch_id=<uuid>&date=YYYY-MM-DD` (admin)

**Response 200:**

```json
{
  "data": {
    "branch_id": "uuid",
    "date": "2026-08-14",
    "total_slots": 20,
    "filled": 3,
    "empty": 17,
    "slots": [
      {
        "jam_mulai": "10:00",
        "jam_selesai": "10:30",
        "terisi": true,
        "booking": { "id": "uuid", "nama": "Budi", "status": "confirmed" }
      },
      { "jam_mulai": "10:30", "jam_selesai": "11:00", "terisi": false, "booking": null }
    ]
  }
}
```

### POST `/api/slots/block` (admin)

**Request:**

```json
{ "branch_id": "uuid", "tanggal": "2026-08-14", "jam_mulai": "18:00" }
```

**Response 201:**

```json
{ "data": { "...": "booking blokir" }, "message": "Slot diblokir." }
```

### DELETE `/api/slots/block` (admin)

**Request:** sama dengan POST. Menghapus booking blokir (`nama = "-- BLOKIR --"`).

---

## 5. Aturan Bisnis

| Aturan | Nilai |
| --- | --- |
| Jam operasional | 10.00–20.00 WIB, Senin–Minggu |
| Interval slot | 30 menit |
| Slot terakhir | 19:30–20:00 |
| Minimal lead time | 1 jam sebelum jam mulai |
| Format WA valid | `08xxxxxxxxxx`, `+628xxxxxxxxxx`, `628xxxxxxxxxx` |

---

## 6. Keamanan

- **RLS** aktif di kedua tabel:
  - `branches`: SELECT publik.
  - `bookings`: INSERT publik; SELECT/UPDATE/DELETE hanya `authenticated`.
- **Service role key** hanya di server (`lib/supabase/admin.ts`).
- **Middleware** memproteksi seluruh route `/admin/*` dan mengarahkan ke `/admin/login` jika belum login.
- **Anti-bentrok** dijamin oleh unique index `(branch_id, tanggal, jam_mulai) WHERE status <> 'cancelled'`.

---

## 7. Catatan

- Tidak ada notifikasi WhatsApp otomatis — konfirmasi ditangani manual oleh admin.
- Blokir slot manual direpresentasikan sebagai booking dengan `nama = "-- BLOKIR --"` dan `status = "confirmed"`.
