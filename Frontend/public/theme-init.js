// Apply the saved theme before paint to avoid a flash of the wrong theme.
// Extracted to an external file so CSP script-src 'self' can be enforced
// (inline scripts would require 'unsafe-inline' which defeats CSP).
(function () {
  try {
    var saved = localStorage.getItem('theme')
    var prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
    var theme = saved === 'light' || saved === 'dark' ? saved : (prefersDark ? 'dark' : 'light')
    document.documentElement.classList.add(theme)
    document.documentElement.style.colorScheme = theme
  } catch (e) {}
})()
