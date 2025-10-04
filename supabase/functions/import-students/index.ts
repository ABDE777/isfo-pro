import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.57.4';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface StudentData {
  matricule: string;
  nom: string;
  prenom: string;
  dateNaissance: string;
  cin: string;
  code: string;
  libelleLong: string;
  telephone: string;
}

function extractFormationInfo(libelleLong: string) {
  const parts = libelleLong.split('-');
  
  const formationType = "Résidentielle";
  const formationMode = "Diplômante";
  const formationYear = parts[parts.length - 1] || "2025";
  
  const formationLevel = libelleLong.includes('_TS_') ? 'Technicien Spécialisé' : 'Technicien';
  
  let speciality = "";
  if (parts.length > 1) {
    speciality = parts[1].replace(/\s*\(\d+A\)/, '').trim();
  }
  
  return {
    formationType,
    formationMode,
    formationYear,
    formationLevel,
    speciality
  };
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { students } = await req.json() as { students: StudentData[] };

    if (!students || !Array.isArray(students)) {
      throw new Error('Invalid students data');
    }

    const results = {
      success: 0,
      errors: [] as any[],
      total: students.length
    };

    for (const studentData of students) {
      try {
        const formationInfo = extractFormationInfo(studentData.libelleLong);
        
        const student = {
          inscription_number: studentData.matricule,
          first_name: studentData.prenom,
          last_name: studentData.nom,
          cin: studentData.cin,
          birth_date: studentData.dateNaissance,
          email: `${studentData.matricule}@ofppt-edu.ma`,
          password_hash: studentData.matricule,
          password_changed: false,
          student_group: studentData.code,
          formation_level: formationInfo.formationLevel,
          speciality: formationInfo.speciality,
          formation_type: formationInfo.formationType,
          formation_mode: formationInfo.formationMode,
          formation_year: formationInfo.formationYear,
        };

        const { error } = await supabase
          .from('students')
          .insert(student);

        if (error) {
          console.error(`Error importing ${studentData.matricule}:`, error);
          results.errors.push({
            matricule: studentData.matricule,
            error: error.message
          });
        } else {
          results.success++;
        }
      } catch (err) {
        console.error(`Error processing ${studentData.matricule}:`, err);
        results.errors.push({
          matricule: studentData.matricule,
          error: err.message
        });
      }
    }

    return new Response(
      JSON.stringify(results),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    );

  } catch (error) {
    console.error('Import error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400 
      }
    );
  }
});
