'use client';

import { useCallback, useState } from 'react';
import toast from 'react-hot-toast';
import { DoctorTable } from '@/components/doctors/DoctorTable';
import { DoctorForm } from '@/components/doctors/DoctorForm';
import { DoctorDetailModal } from '@/components/doctors/DoctorDetailModal';
import { SearchFilterBar } from '@/components/doctors/SearchFilterBar';
import { Pagination } from '@/components/doctors/Pagination';
import { Modal } from '@/components/ui/Modal';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { FullPageSpinner } from '@/components/ui/Spinner';
import { StatusBadge } from '@/components/ui/Badge';
import { useDoctors } from '@/lib/hooks/useDoctors';
import { doctorService } from '@/lib/api/doctorService';
import { useAuth } from '@/lib/context/AuthContext';
import { DoctorStatus, type Doctor } from '@/lib/types/doctor';

export default function DoctorsPage() {
  const { isAdmin, tenant }  = useAuth();
  const { data, isLoading, error, params, setParams, refresh } = useDoctors({
    pageNumber: 1,
    pageSize:   10,
  });

  const [formModal, setFormModal]       = useState<{ open: boolean; doctor: Doctor | null }>({ open: false, doctor: null });
  const [detailDoctor, setDetailDoctor] = useState<Doctor | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Doctor | null>(null);
  const [isDeleting, setDeleting]       = useState(false);

  const openCreate = () => setFormModal({ open: true, doctor: null });
  const openEdit   = (d: Doctor) => setFormModal({ open: true, doctor: d });
  const closeForm  = () => setFormModal({ open: false, doctor: null });

  const handleFormSuccess = useCallback(() => { closeForm(); refresh(); }, [refresh]);

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await doctorService.delete(deleteTarget.id);
      toast.success(`${deleteTarget.fullName} removed.`);
      setDeleteTarget(null);
      refresh();
    } catch { toast.error('Failed to delete. Please try again.'); }
    finally { setDeleting(false); }
  };

  const doctors     = data?.items ?? [];
  const activeCount    = doctors.filter(d => d.status === DoctorStatus.Active).length;
  const expiredCount   = doctors.filter(d => d.status === DoctorStatus.Expired).length;
  const suspendedCount = doctors.filter(d => d.status === DoctorStatus.Suspended).length;

  return (
    <>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Doctors</h1>
          <p className="text-slate-500 mt-1 text-sm">Manage licenses for {tenant?.name}.</p>
        </div>
        {isAdmin && (
          <button onClick={openCreate} className="btn-primary">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Add Doctor
          </button>
        )}
      </div>

      {/* Stats */}
      {data && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
          {[
            { label: 'Total',     value: data.totalCount, color: 'text-slate-700',   bg: 'bg-slate-50'   },
            { label: 'Active',    value: activeCount,     color: 'text-emerald-700', bg: 'bg-emerald-50' },
            { label: 'Expired',   value: expiredCount,    color: 'text-red-700',     bg: 'bg-red-50'     },
            { label: 'Suspended', value: suspendedCount,  color: 'text-amber-700',   bg: 'bg-amber-50'   },
          ].map(({ label, value, color, bg }) => (
            <div key={label} className={`card px-5 py-4 ${bg}`}>
              <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">{label}</p>
              <p className={`text-2xl font-bold mt-1 ${color}`}>{value}</p>
            </div>
          ))}
        </div>
      )}

      <div className="card p-5 sm:p-6">
        <div className="mb-5">
          <SearchFilterBar params={params} onChange={setParams} />
        </div>

        {isLoading && <FullPageSpinner />}

        {!isLoading && error && (
          <div className="flex flex-col items-center justify-center py-16 gap-3">
            <p className="text-slate-600 font-medium">Failed to load doctors</p>
            <p className="text-sm text-slate-400">{error}</p>
            <button onClick={refresh} className="btn-secondary mt-1">Try again</button>
          </div>
        )}

        {!isLoading && !error && doctors.length === 0 && (
          <div className="flex flex-col items-center justify-center py-16 gap-3">
            <p className="text-slate-600 font-medium">No doctors found</p>
            <p className="text-sm text-slate-400">
              {params.search || params.status ? 'Try adjusting your search.' : 'Add your first doctor.'}
            </p>
            {isAdmin && !params.search && !params.status && (
              <button onClick={openCreate} className="btn-primary mt-1">Add Doctor</button>
            )}
          </div>
        )}

        {!isLoading && !error && doctors.length > 0 && (
          <>
            <DoctorTable
              doctors={doctors}
              onEdit={isAdmin ? openEdit : () => {}}
              onDelete={isAdmin ? setDeleteTarget : () => {}}
              onViewDetail={setDetailDoctor}
            />
            {data && (
              <Pagination
                pageNumber={data.pageNumber}
                totalPages={data.totalPages}
                totalCount={data.totalCount}
                pageSize={data.pageSize}
                onPageChange={(p) => setParams(prev => ({ ...prev, pageNumber: p }))}
              />
            )}
          </>
        )}
      </div>

      <Modal isOpen={formModal.open} onClose={closeForm}
             title={formModal.doctor ? 'Edit Doctor' : 'Add New Doctor'} size="lg">
        <DoctorForm doctor={formModal.doctor} onSuccess={handleFormSuccess} onCancel={closeForm} />
      </Modal>

      <DoctorDetailModal doctor={detailDoctor} onClose={() => setDetailDoctor(null)} />

      <ConfirmDialog
        isOpen={!!deleteTarget} onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete} isLoading={isDeleting}
        title="Remove Doctor"
        message={`Remove ${deleteTarget?.fullName ?? 'this doctor'}? This action cannot be undone.`}
        confirmLabel="Remove" variant="danger"
      />
    </>
  );
}
