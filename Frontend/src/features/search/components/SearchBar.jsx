import { useEffect, useState } from 'react'
import Button from '../../../shared/components/ui/Button.jsx'
import Input from '../../../shared/components/ui/Input.jsx'

export default function SearchBar({ value = '', onSearch }) {
  const [keyword, setKeyword] = useState(value)

  useEffect(() => {
    setKeyword(value)
  }, [value])

  function handleSubmit(event) {
    event.preventDefault()
    onSearch(keyword)
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-3 rounded-2xl bg-white p-4 shadow-sm sm:flex-row">
      <Input
        value={keyword}
        onChange={(event) => setKeyword(event.target.value)}
        placeholder="Search by event name, category, city, venue, or organizer..."
      />
      <Button type="submit" className="sm:w-36">Search</Button>
    </form>
  )
}
