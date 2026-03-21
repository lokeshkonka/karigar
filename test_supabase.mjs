import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

const envFile = fs.readFileSync('.env.local', 'utf8');
const lines = envFile.split('\n');
let supabaseUrl = '';
let supabaseKey = '';

for (const line of lines) {
  if (line.startsWith('NEXT_PUBLIC_SUPABASE_URL=')) {
    supabaseUrl = line.split('=')[1].replace(/"/g, '').replace(/'/g, '').trim();
  }
  if (line.startsWith('NEXT_PUBLIC_SUPABASE_ANON_KEY=')) {
    supabaseKey = line.split('=')[1].replace(/"/g, '').replace(/'/g, '').trim();
  }
}

console.log("=== SUPABASE CONNECTION TESTER ===");

if (!supabaseUrl || !supabaseKey || supabaseUrl.includes('mock123')) {
  console.log("❌ Missing or Mock Supabase credentials. Did you paste real keys in .env.local?");
  process.exit(1);
}

console.log(`🔌 Attempting connection to: ${supabaseUrl}`);

const supabase = createClient(supabaseUrl, supabaseKey);

async function testConnection() {
  const { data, error } = await supabase.from('customers').select('*').limit(1);
  if (error) {
     if (error.code === '42P01') {
        console.log("✅ Connection Successful! 🛠️  However, the 'customers' table does not exist yet.");
        console.log("👉 Next Step: Run the SQL in garageos_schema.sql in your Supabase Dashboard.");
     } else {
        console.log("🚨 Connection Reached, but returned error:", error.message);
     }
  } else {
     console.log("✅ Superb! Connection successful and 'customers' table exists.");
     console.log("Loaded data probe:", data);
  }
}

testConnection();
