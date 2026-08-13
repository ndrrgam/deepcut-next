/**
 * Type definitions untuk Supabase database DEEP CUT.
 * Dipakai sebagai generic pada Supabase client agar hasil query ter-typed.
 *
 * Catatan: gunakan type alias (object literal), bukan `interface`,
 * karena Supabase mensyaratkan Row/Insert/Update assignable ke
 * `Record<string, unknown>`.
 */

export type BookingStatus = 'pending' | 'confirmed' | 'cancelled';

export type Branch = {
  id: string;
  nama_cabang: string;
  created_at: string;
};

export type Booking = {
  id: string;
  nama: string;
  no_wa: string | null;
  branch_id: string;
  tanggal: string; // YYYY-MM-DD
  jam_mulai: string; // HH:mm
  jam_selesai: string; // HH:mm
  kursi: number;
  status: BookingStatus;
  created_at: string;
};

export type Database = {
  public: {
    Tables: {
      branches: {
        Row: {
          id: string;
          nama_cabang: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          nama_cabang: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          nama_cabang?: string;
          created_at?: string;
        };
        Relationships: [];
      };
      bookings: {
        Row: {
          id: string;
          nama: string;
          no_wa: string | null;
          branch_id: string;
          tanggal: string;
          jam_mulai: string;
          jam_selesai: string;
          kursi: number;
          status: BookingStatus;
          created_at: string;
        };
        Insert: {
          id?: string;
          nama: string;
          no_wa?: string | null;
          branch_id: string;
          tanggal: string;
          jam_mulai: string;
          jam_selesai: string;
          kursi?: number;
          status?: BookingStatus;
          created_at?: string;
        };
        Update: {
          id?: string;
          nama?: string;
          no_wa?: string | null;
          branch_id?: string;
          tanggal?: string;
          jam_mulai?: string;
          jam_selesai?: string;
          kursi?: number;
          status?: BookingStatus;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'bookings_branch_id_fkey';
            columns: ['branch_id'];
            isOneToOne: false;
            referencedRelation: 'branches';
            referencedColumns: ['id'];
          },
        ];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: {
      booking_status: BookingStatus;
    };
    CompositeTypes: Record<string, never>;
  };
};
