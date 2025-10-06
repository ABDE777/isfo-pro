import * as dotenv from 'dotenv';
dotenv.config();
import { createClient } from '@supabase/supabase-js';

// Supabase configuration
const supabaseUrl = process.env.VITE_SUPABASE_URL || '';
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

if (!supabaseUrl || !supabaseServiceRoleKey) {
  console.error('Missing Supabase environment variables');
  console.error('Please ensure you have set SUPABASE_SERVICE_ROLE_KEY in your .env file');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);

async function listStudents() {
  try {
    // Fetch all students with only the required fields
    const { data: students, error } = await supabase
      .from('students')
      .select('first_name, last_name, cin')
      .order('last_name', { ascending: true });

    if (error) {
      console.error('Error fetching students:', error.message);
      process.exit(1);
    }

    console.log('Students in database:');
    console.log('====================');
    
    // Display student information
    students.forEach((student, index) => {
      console.log(`${index + 1}. ${student.first_name} ${student.last_name} - CIN: ${student.cin || 'N/A'}`);
    });

    console.log(`\nTotal students: ${students.length}`);

  } catch (error) {
    console.error('Error:', (error as Error).message);
    process.exit(1);
  }
}

// Run the function
listStudents();