export default function Pagination({ page, total, limit = 50, onPageChange }) {
  const totalPages = Math.ceil(total / limit);
  if (totalPages <= 1) return null;
  return (
    <div className="flex items-center justify-between mt-4 text-sm text-gray-600">
      <span>Showing {(page - 1) * limit + 1}-{Math.min(page * limit, total)} of {total}</span>
      <div className="flex gap-1">
        <button disabled={page <= 1} onClick={() => onPageChange(page - 1)} className="px-3 py-1 rounded border hover:bg-gray-50 disabled:opacity-40">Prev</button>
        {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
          const p = Math.max(1, Math.min(page - 2, totalPages - 4)) + i;
          if (p > totalPages) return null;
          return (
            <button key={p} onClick={() => onPageChange(p)} className={`px-3 py-1 rounded border ${p === page ? 'bg-blue-600 text-white border-blue-600' : 'hover:bg-gray-50'}`}>
              {p}
            </button>
          );
        })}
        <button disabled={page >= totalPages} onClick={() => onPageChange(page + 1)} className="px-3 py-1 rounded border hover:bg-gray-50 disabled:opacity-40">Next</button>
      </div>
    </div>
  );
}
