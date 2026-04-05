'use client';

import { useState } from 'react';
import toast from 'react-hot-toast';
import { Input, Select } from '@/components/ui/Input';
import { Spinner } from '@/components/ui/Spinner';
import { doctorService, type ApiError } from '@/lib/api/doctorService';
import { DoctorStatus, type CreateDoctorRequest, type Doctor } from '@/lib/types/doctor';
import { format } from 'date-fns';

interface DoctorFormProps {
  doctor?:   Doctor | null;   // null = create mode, Doctor = edit mode
  onSuccess: (doctor: Doctor) => void;
  onCancel:  () => void;
}

interface FormErrors {
  fullName?:          string;
  email?:             string;
  specialization?:    string;
  licenseNumber?:     string;
  licenseExpiryDate?: string;
  status?:            string;
  general?:           string;
}

function toInputDate(isoString: string) {
  // Convert ISO datetime → "YYYY-MM-DD" for date input
  return isoString ? format(new Date(isoString), 'yyyy-MM-dd') : '';
}

export function DoctorForm({ doctor, onSuccess, onCancel }: DoctorFormProps) {
  const isEdit = !!doctor;

  const [form, setForm] = useState<CreateDoctorRequest>({
    fullName:          doctor?.fullName          ?? '',
    email:             doctor?.email             ?? '',
    specialization:    doctor?.specialization    ?? '',
    licenseNumber:     doctor?.licenseNumber     ?? '',
    licenseExpiryDate: doctor?.licenseExpiryDate
                         ? toInputDate(doctor.licenseExpiryDate)
                         : '',
    status:            (doctor?.status === DoctorStatus.Expired
                         ? DoctorStatus.Active   // Expired is auto-managed, default to Active in edit
                         : doctor?.status)       ?? DoctorStatus.Active,
  });

  const [errors, setErrors]       = useState<FormErrors>({});
  const [isSubmitting, setSubmitting] = useState(false);

  const set = (field: keyof CreateDoctorRequest) => (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    setForm(prev => ({ ...prev, [field]: e.target.value }));
    // Clear field error on change
    if (errors[field as keyof FormErrors]) {
      setErrors(prev => ({ ...prev, [field]: undefined }));
    }
  };

  const validate = (): boolean => {
    const errs: FormErrors = {};

    if (!form.fullName.trim())       errs.fullName       = 'Full name is required.';
    if (!form.email.trim())          errs.email          = 'Email is required.';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email))
                                     errs.email          = 'Enter a valid email address.';
    if (!form.specialization.trim()) errs.specialization = 'Specialization is required.';
    if (!form.licenseNumber.trim())  errs.licenseNumber  = 'License number is required.';
    else if (!/^[A-Za-z0-9-]+$/.test(form.licenseNumber))
                                     errs.licenseNumber  = 'Only letters, digits, and hyphens allowed.';
    if (!form.licenseExpiryDate)     errs.licenseExpiryDate = 'License expiry date is required.';

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setSubmitting(true);
    setErrors({});

    try {
      // Format the date to ISO string
      const payload: CreateDoctorRequest = {
        ...form,
        licenseExpiryDate: new Date(form.licenseExpiryDate).toISOString(),
      };

      const saved = isEdit
        ? await doctorService.update(doctor!.id, payload)
        : await doctorService.create(payload);

      toast.success(isEdit ? 'Doctor updated successfully.' : 'Doctor created successfully.');
      onSuccess(saved);
    } catch (err: unknown) {
      const apiErr = err as ApiError;

      if (apiErr.errors) {
        // Map FluentValidation errors to form fields
        const fieldMap: Record<string, keyof FormErrors> = {
          fullName:          'fullName',
          email:             'email',
          specialization:    'specialization',
          licenseNumber:     'licenseNumber',
          licenseExpiryDate: 'licenseExpiryDate',
          status:            'status',
        };

        const mapped: FormErrors = {};
        for (const [key, msgs] of Object.entries(apiErr.errors)) {
          const field = fieldMap[key.charAt(0).toLowerCase() + key.slice(1)];
          if (field) mapped[field] = msgs[0];
        }
        setErrors(mapped);
      } else if (apiErr.code === 'DUPLICATE_LICENSE') {
        setErrors({ licenseNumber: apiErr.message });
      } else {
        setErrors({ general: apiErr.message ?? 'An error occurred. Please try again.' });
        toast.error(apiErr.message ?? 'Failed to save doctor.');
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5" noValidate>
      {errors.general && (
        <div className="rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
          {errors.general}
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
        <Input
          label="Full Name"
          placeholder="Dr. Jane Smith"
          value={form.fullName}
          onChange={set('fullName')}
          error={errors.fullName}
          required
        />

        <Input
          label="Email"
          type="email"
          placeholder="jane.smith@hospital.org"
          value={form.email}
          onChange={set('email')}
          error={errors.email}
          required
        />

        <Input
          label="Specialization"
          placeholder="Cardiology"
          value={form.specialization}
          onChange={set('specialization')}
          error={errors.specialization}
          required
        />

        <Input
          label="License Number"
          placeholder="MD-2024-001"
          value={form.licenseNumber}
          onChange={set('licenseNumber')}
          error={errors.licenseNumber}
          helperText="Letters, digits, and hyphens only."
          required
          disabled={isEdit}  // license number should not be changed after creation in a real system;
                             // for this demo we allow it but mark it visually distinct
          className={isEdit ? 'bg-slate-50' : undefined}
        />

        <Input
          label="License Expiry Date"
          type="date"
          value={form.licenseExpiryDate}
          onChange={set('licenseExpiryDate')}
          error={errors.licenseExpiryDate}
          required
        />

        <Select
          label="Status"
          value={form.status}
          onChange={set('status')}
          error={errors.status}
          required
        >
          <option value={DoctorStatus.Active}>Active</option>
          <option value={DoctorStatus.Suspended}>Suspended</option>
          {/* Expired is intentionally excluded — it is auto-computed */}
        </Select>
      </div>

      <p className="text-xs text-slate-500 italic">
        * <strong>Expired</strong> status is computed automatically when the license expiry date passes —
        it cannot be set manually.
      </p>

      <div className="flex items-center justify-end gap-3 pt-2">
        <button type="button" onClick={onCancel} className="btn-secondary" disabled={isSubmitting}>
          Cancel
        </button>
        <button type="submit" className="btn-primary" disabled={isSubmitting}>
          {isSubmitting && <Spinner size="sm" />}
          {isEdit ? 'Save Changes' : 'Create Doctor'}
        </button>
      </div>
    </form>
  );
}
