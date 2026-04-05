'use client';

import { format } from 'date-fns';
import { Modal } from '@/components/ui/Modal';
import { StatusBadge } from '@/components/ui/Badge';
import type { Doctor } from '@/lib/types/doctor';
import { DoctorStatus } from '@/lib/types/doctor';
import clsx from 'clsx';

interface Props {
  doctor:  Doctor | null;
  onClose: () => void;
}

function Field({ label, value, className }: { label: string; value: React.ReactNode; className?: string }) {
  return (
    <div className={clsx('flex flex-col gap-0.5', className)}>
      <span className="text-xs font-medium text-slate-400 uppercase tracking-wide">{label}</span>
      <span className="text-sm text-slate-800 font-medium">{value}</span>
    </div>
  );
}

export function DoctorDetailModal({ doctor, onClose }: Props) {
  if (!doctor) return null;

  const isExpired = doctor.status === DoctorStatus.Expired;

  return (
    <Modal isOpen={!!doctor} onClose={onClose} title="Doctor Details" size="md">
      <div className="space-y-6">
        {/* Header card */}
        <div className={clsx(
          'rounded-xl p-4 border',
          isExpired ? 'bg-red-50 border-red-100' : 'bg-primary-50 border-primary-100'
        )}>
          <div className="flex items-start justify-between gap-4">
            <div>
              <h3 className="text-lg font-semibold text-slate-800">{doctor.fullName}</h3>
              <p className="text-sm text-slate-500 mt-0.5">{doctor.specialization}</p>
            </div>
            <StatusBadge status={doctor.status} />
          </div>
        </div>

        {/* Details grid */}
        <div className="grid grid-cols-2 gap-y-5 gap-x-6">
          <Field label="Email" value={doctor.email} className="col-span-2" />
          <Field label="License Number" value={doctor.licenseNumber} />
          <Field
            label="License Expiry"
            value={
              <span className={clsx(isExpired && 'text-red-600')}>
                {format(new Date(doctor.licenseExpiryDate), 'PPP')}
              </span>
            }
          />
          <Field label="Created" value={format(new Date(doctor.createdDate), 'PPP')} />
          <Field
            label="Last Updated"
            value={doctor.updatedDate ? format(new Date(doctor.updatedDate), 'PPP') : '—'}
          />
        </div>

        {isExpired && (
          <div className="flex items-center gap-2 text-sm text-red-700 bg-red-50 rounded-lg px-4 py-3 border border-red-100">
            <svg className="w-4 h-4 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd"
                d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                clipRule="evenodd" />
            </svg>
            This doctor's license has expired and requires renewal.
          </div>
        )}
      </div>
    </Modal>
  );
}
