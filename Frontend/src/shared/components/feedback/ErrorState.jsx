export default function ErrorState({ title = 'Something went wrong', message = 'Please try again later.' }) {
  return (
    <div className="rounded-2xl border border-red-200 bg-red-50 p-6 text-red-700">
      <h3 className="font-bold">{title}</h3>
      <p className="mt-1 text-sm">{message}</p>
    </div>
  )
}
