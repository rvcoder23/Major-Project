const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.SUPABASE_URL || 'https://nsqnuzzxgbuyxnvikflf.supabase.co';
const supabaseKey = process.env.SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5zcW51enp4Z2J1eXhudmlrZmxmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjEwNDU2OTgsImV4cCI6MjA3NjYyMTY5OH0.irdjnh9X31pnvDlRrAV1-vWndpmAzEnyqGmG1CiVKbg';

if (!supabaseUrl || !supabaseKey) {
    throw new Error('Supabase URL और Key environment variables में set करें');
}

const supabase = createClient(supabaseUrl, supabaseKey);

module.exports = supabase;
