const { createClient } = require('@supabase/supabase-js');

const url = 'https://qdgmxtnqppfrijlvtbhf.supabase.co';
const key = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFkZ214dG5xcHBmcmlqbHZ0YmhmIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4NjU2MzgxMywiZXhwIjoyMTAyMTM5ODEzfQ.Xb8ZPMs8uqlI-C0-RxFqtptX6TNpVy2MDhcP_FZTidk';

const supabase = createClient(url, key);

(async () => {
  const { data, error } = await supabase
    .from('bookings')
    .delete()
    .eq('nama', 'Budi Santoso');
  console.log('deleted test booking:', error ? error.message : JSON.stringify(data));
})();
