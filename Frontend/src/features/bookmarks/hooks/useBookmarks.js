import { useCallback, useEffect, useState } from 'react'
import { getApiErrorMessage } from '../../auth/utils/normalizeAuthUser.js'
import { extractCollection, normalizeEvents } from '../../events/utils/normalizeEvent.js'
import { bookmarkService } from '../services/bookmarkService.js'
import { useAuth } from '../../auth/hooks/useAuth.js'

const BOOKMARKS_UPDATED_EVENT = 'bookmarks-updated'

function normalizeBookmarks(apiBookmarks = []) {
  return apiBookmarks.map((bookmark) => ({
    id: bookmark.id,
    eventId: Number(bookmark.event_id),
    event: bookmark.event,
    createdAt: bookmark.created_at,
  }))
}

export function useBookmarks() {
  const [bookmarks, setBookmarks] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const fetchBookmarks = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const response = await bookmarkService.getBookmarks({ per_page: 50 })
      setBookmarks(normalizeBookmarks(extractCollection(response.data, 'bookmarks')))
    } catch (fetchError) {
      setError(getApiErrorMessage(fetchError, 'Unable to load bookmarks.'))
    } finally {
      setLoading(false)
    }
  }, [])

  const { isAuthenticated } = useAuth()

  useEffect(() => {
    if (!isAuthenticated) {
      setLoading(false)
      return
    }
    fetchBookmarks()

    function handleBookmarksUpdated() {
      fetchBookmarks()
    }

    window.addEventListener(BOOKMARKS_UPDATED_EVENT, handleBookmarksUpdated)
    return () => window.removeEventListener(BOOKMARKS_UPDATED_EVENT, handleBookmarksUpdated)
  }, [fetchBookmarks, isAuthenticated])

  function isBookmarked(eventId) {
    return bookmarks.some((bookmark) => Number(bookmark.eventId) === Number(eventId))
  }

  async function addBookmark(eventId) {
    const currentlyBookmarked = isBookmarked(eventId)
    if (currentlyBookmarked) return true

    setBookmarks((prev) => [...prev, { id: Date.now(), eventId, event: null, createdAt: new Date().toISOString() }])
    
    try {
      await bookmarkService.addBookmark(eventId)
      window.dispatchEvent(new CustomEvent(BOOKMARKS_UPDATED_EVENT))
      return true
    } catch (error) {
      setBookmarks((prev) => prev.filter((b) => b.eventId !== eventId))
      throw error
    }
  }

  async function removeBookmark(eventId) {
    const currentlyBookmarked = isBookmarked(eventId)
    if (!currentlyBookmarked) return false

    const previousBookmarks = [...bookmarks]
    setBookmarks((prev) => prev.filter((b) => b.eventId !== eventId))
    
    try {
      await bookmarkService.removeBookmark(eventId)
      window.dispatchEvent(new CustomEvent(BOOKMARKS_UPDATED_EVENT))
      return false
    } catch (error) {
      setBookmarks(previousBookmarks)
      throw error
    }
  }

  async function toggleBookmark(eventId) {
    if (isBookmarked(eventId)) {
      await removeBookmark(eventId)
      return false
    }
    await addBookmark(eventId)
    return true
  }

  const bookmarkedEvents = normalizeEvents(bookmarks.map((bookmark) => bookmark.event).filter(Boolean))

  return {
    bookmarks,
    bookmarkedEventIds: bookmarks.map((bookmark) => bookmark.eventId),
    bookmarkedEvents,
    bookmarkCount: bookmarks.length,
    loading,
    error,
    isBookmarked,
    addBookmark,
    removeBookmark,
    toggleBookmark,
    refetch: fetchBookmarks,
  }
}