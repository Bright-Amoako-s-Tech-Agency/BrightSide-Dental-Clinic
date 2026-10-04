import { supabase } from '../../config/supabase.js';
import { AppError } from '../../utils/AppError.js';

const patientSelect = `
  id,
  first_name,
  last_name,
  phone,
  email,
  date_of_birth,
  notes,
  created_at,
  updated_at
`;

export async function findPatientByPhone(phone) {
    const { data, error } = await supabase
        .from('patients')
        .select(patientSelect)
        .eq('phone', phone)
        .maybeSingle();

    if (error) {
        throw new AppError('Failed to find patient', 500);
    }

    return data;
}

export async function createPatient(patientData) {
    const {
        first_name,
        last_name,
        phone,
        email,
        date_of_birth,
        notes
    } = patientData;

    if (!first_name || !last_name || !phone) {
        throw new AppError(
            'first_name, last_name and phone are required',
            400
        );
    }

    const existingPatient = await findPatientByPhone(phone);

    if (existingPatient) {
        return {
            patient: existingPatient,
            created: false
        };
    }

    const { data, error } = await supabase
        .from('patients')
        .insert({
            first_name,
            last_name,
            phone,
            email: email || null,
            date_of_birth: date_of_birth || null,
            notes: notes || null
        })
        .select(patientSelect)
        .single();

    if (error) {
        throw new AppError('Failed to create patient', 500);
    }

    return {
        patient: data,
        created: true
    };
}