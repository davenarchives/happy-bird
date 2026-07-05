const SUPABASE_URL = 'https://pbevtaysuyhzcpmgdfwi.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_AfL7Jf42JGwSef1RWaJQzQ_J0XsjRbi';

let supabaseClient = null;

export const initSupabase = () => {
  if (window.supabase) {
    supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
  }
};

export const fetchLeaderboard = async () => {
  if (!supabaseClient || SUPABASE_URL === 'YOUR_SUPABASE_URL') return null;

  try {
    const { data, error } = await supabaseClient
      .from('leaderboard')
      .select('name, score')
      .order('score', { ascending: false })
      .limit(10);
      
    if (error) {
      console.error('Error fetching leaderboard:', error);
      return null;
    }
    
    return data;
  } catch (err) {
    console.error('Supabase fetch exception:', err);
    return null;
  }
};

export const insertScore = async (name, score) => {
  if (!supabaseClient || SUPABASE_URL === 'YOUR_SUPABASE_URL') return;

  try {
    const { error } = await supabaseClient
      .from('leaderboard')
      .insert([{ name, score }]);
      
    if (error) {
      console.error('Error inserting score:', error);
    }
  } catch (err) {
    console.error('Supabase insert exception:', err);
  }
};
