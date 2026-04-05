'use client';

import { format } from 'date-fns';
import clsx from 'clsx';
import { StatusBadge } from '@/components/ui/Badge';
import { DoctorStatus, type Doctor } from '@/lib/types/doctor';

interface DoctorTableProps {
  doctors:       Doctor[];
  onEdit:        (doctor: Doctor) => void;
  onDelete:      (doctor: Doctor) => void;
  onViewDetail:  (doctor: Doctor) => void;
}

export function DoctorTable({ doctors, onEdit, onDelete, onViewDetail }: DoctorTableProps) {
  return (
    /* Horizontal scroll wrapper for mobile */
    <div className="overflow-x-auto rounded-xl border border-slate-200 shadow-card">
      <table className="min-w-full divide-y divide-slate-100">
        <thead>
          <tr className="bg-slate-50">
            {['Full Name', 'Email', 'Specialization', 'License Number', 'Expiry Date', 'Status', 'Actions']
              .map(col => (
              <th
                key={col}
                scope="col"
                className="px-4 py-3.5 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide whitespace-nowrap"
              >
                {col}
              </th>
            ))}
          </tr>
        </thead>

        <tbody className="divide-y divide-slate-100 bg-white">
          {doctors.map(doctor => {
            const isExpired = doctor.status === DoctorStatus.Expired;

            return (
              <tr
                key={doctor.id}
                className={clsx(
                  'transition-colors hover:bg-slate-50/70 group',
                  isExpired && 'bg-red-50/40 hover:bg-red-50/60'
                )}
              >
                {/* Full Name — clickable for detail view */}
                <td className="px-4 py-3.5 whitespace-nowrap">
                  <button
                    onClick={() => onViewDetail(doctor)}
                    className="text-sm font-medium text-slate-800 hover:text-primary-700 text-left transition-colors"
                  >
                    {doctor.fullName}
                  </button>
                </td>

                <td className="px-4 py-3.5 whitespace-nowrap text-sm text-slate-600">
                  {doctor.email}
                </td>

                <td className="px-4 py-3.5 whitespace-nowrap text-sm text-slate-600">
                  {doctor.specialization}
                </td>

                <td className="px-4 py-3.5 whitespace-nowrap">
                  <span className="text-sm font-mono text-slate-700 bg-slate-100 rounded px-2 py-0.5">
                    {doctor.licenseNumber}
                  </span>
                </td>

                <td className="px-4 py-3.5 whitespace-nowrap">
                  <span className={clsx('text-sm', isExpired ? 'text-red-600 font-medium' : 'text-slate-600')}>
                    {format(new Date(doctor.licenseExpiryDate), 'MMM d, yyyy')}
                  </span>
                  {isExpired && (
                    <span className="ml-1.5 text-xs text-red-500">(expired)</span>
                  )}
                </td>

                <td className="px-4 py-3.5 whitespace-nowrap">
                  <StatusBadge status={doctor.status} />
                </td>

                {/* Actions */}
                <td className="px-4 py-3.5 whitespace-nowrap">
                  <div className="flex items-center gap-1">
                    {/* View detail */}
                    <button
                      onClick={() => onViewDetail(doctor)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-primary-600 hover:bg-primary-50 transition-colors"
                      title="View details"
                    >
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                          d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                          d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      </svg>
                    </button>

                    {/* Edit */}
                    <button
                      onClick={() => onEdit(doctor)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-primary-600 hover:bg-primary-50 transition-colors"
                      title="Edit doctor"
                    >
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                          d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                    </button>

                    {/* Delete */}
                    <button
                      onClick={() => onDelete(doctor)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                      title="Delete doctor"
                    >
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                          d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
