import { supabase } from './config/supabase.js';
import bcrypt from 'bcryptjs';

async function createAdmin() {
  try {
    const email = 'admin@motoparts.com';
    const password = 'admin123';
    const name = 'System Admin';

    // Check if exists
    const { data: existing, error: searchError } = await supabase
      .from('users')
      .select('id')
      .eq('email', email);
      
    if (searchError) throw searchError;
    
    if (existing && existing.length > 0) {
      console.log('Admin account already exists. Updating role to admin...');
      const { error: updateError } = await supabase
        .from('users')
        .update({ role: 'admin' })
        .eq('email', email);
        
      if (updateError) throw updateError;
      console.log('Update complete.');
      process.exit(0);
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    console.log('Creating default admin account...');
    const { data: result, error: insertError } = await supabase
      .from('users')
      .insert([{ name, email, password: hashedPassword, role: 'admin' }])
      .select()
      .single();
      
    if (insertError) throw insertError;

    // Create cart
    await supabase.from('carts').insert([{ user_id: result.id }]);

    console.log('Admin account created successfully!');
    console.log('Email: ' + email);
    console.log('Password: ' + password);
    process.exit(0);
  } catch (error) {
    console.error('Failed to create admin:', error);
    process.exit(1);
  }
}

createAdmin();
