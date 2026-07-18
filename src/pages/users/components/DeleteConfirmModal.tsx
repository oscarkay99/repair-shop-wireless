interface DeleteConfirmModalProps {
  userId: string | null;
  onConfirm: (id: string) => void;
  onCancel: () => void;
}

export default function DeleteConfirmModal({ userId, onConfirm, onCancel }: DeleteConfirmModalProps) {
  if (!userId) return null;

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4" onClick={onCancel}>
      <div className="bg-[hsl(var(--card))] rounded-2xl p-6 w-full max-w-sm text-center" onClick={(e) => e.stopPropagation()}>
        <div className="w-12 h-12 rounded-2xl flex items-center justify-center mx-auto mb-4 bg-red-50">
          <i className="ri-delete-bin-line text-xl text-red-500" />
        </div>
        <h3 className="text-base font-bold text-[hsl(var(--foreground))] mb-2">Delete User?</h3>
        <p className="text-sm text-[hsl(var(--muted-foreground))] mb-5">This action cannot be undone. The user will lose all access immediately.</p>
        <div className="flex gap-3">
          <button onClick={onCancel} className="flex-1 py-2.5 rounded-xl text-sm font-semibold border border-[hsl(var(--border))] text-[hsl(var(--muted-foreground))] cursor-pointer whitespace-nowrap">
            Cancel
          </button>
          <button onClick={() => onConfirm(userId)} className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-white cursor-pointer whitespace-nowrap bg-red-500">
            Delete
          </button>
        </div>
      </div>
    </div>
  );
}
