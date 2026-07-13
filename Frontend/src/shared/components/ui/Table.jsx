export default function Table({ columns = [], rows = [] }) {
  return (
    <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
      <table className="w-full text-left text-sm">
        <thead className="bg-slate-50 text-slate-600">
          <tr>{columns.map((column) => <th key={column.key} className="px-4 py-3 font-semibold">{column.label}</th>)}</tr>
        </thead>
        <tbody>
          {rows.map((row, index) => (
            <tr key={row.id || index} className="border-t border-slate-100">
              {columns.map((column) => <td key={column.key} className="px-4 py-3">{row[column.key]}</td>)}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
