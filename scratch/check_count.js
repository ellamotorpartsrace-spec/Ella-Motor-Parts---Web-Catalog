import { supabase } from '../api/config/supabase.js';

async function checkCount() {
    const { count, error } = await supabase
        .from('products')
        .select('*', { count: 'exact', head: true });
    
    if (error) {
        console.error('Error:', error);
    } else {
        console.log('Total products in database:', count);
    }
}

checkCount();
