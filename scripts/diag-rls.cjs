const { createClient } = require('@supabase/supabase-js');

const url = 'https://qdgmxtnqppfrijlvtbhf.supabase.co';
const key = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFkZ214dG5xcHBmcmlqbHZ0YmhmIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4NjU2MzgxMywiZXhwIjoyMTAyMTM5ODEzfQ.Xb8ZPMs8uqlI-C0-RxFqtptX6TNpVy2MDhcP_FZTidk';

const supabase = createClient(url, key);

(async () => {
  // 1. Check tables exist
  const { data: tables, error: e1 } = await supabase
    .from('bookings').select('count', { count: 'exact', head: true });
  console.log('bookings table count:', tables, e1 ? e1.message : 'ok');

  // 2. Query RLS state via RPC or direct SQL using PostgREST? Use rpc on exec
  // Supabase JS can't run arbitrary SQL directly. Use the REST /rpc if a function exists.
  // Instead query information_schema via a view? Not directly available.
  // Fallback: check relrowsecurity via REST is not possible without SQL function.
  console.log('Use SQL Editor to run diagnostic (below).');
})();
