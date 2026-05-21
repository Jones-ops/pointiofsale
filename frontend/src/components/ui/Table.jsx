export default function Table({ columns, data, onRowClick, loading }) {
  return (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            {columns.map((col) => (
              <th key={col.key} className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{col.label}</th>
            ))}
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {loading ? (
            <tr><td colSpan={columns.length} className="px-4 py-8 text-center text-sm text-gray-500">Loading...</td></tr>
          ) : data.length === 0 ? (
            <tr><td colSpan={columns.length} className="px-4 py-8 text-center text-sm text-gray-500">No records found</td></tr>
          ) : data.map((row, i) => (
            <tr key={row.id || i} className={`${onRowClick ? 'cursor-pointer hover:bg-gray-50' : ''} ${i % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'}`} onClick={() => onRowClick?.(row)}>
              {columns.map((col) => (
                <td key={col.key} className="px-4 py-3 text-sm text-gray-700 whitespace-nowrap">
                  {col.render ? col.render(row[col.key], row) : row[col.key]}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
