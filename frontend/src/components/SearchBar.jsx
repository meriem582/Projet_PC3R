import React, { useState } from 'react'

function SearchBar({ onSearch }) {
  const [input, setInput] = useState('')

  const handleSubmit = (e) => {
    e.preventDefault()
    if (input.trim()) {
      onSearch(input)
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      <input
        type="text"
        placeholder="Rechercher un artiste..."
        value={input}
        onChange={(e) => setInput(e.target.value)}
      />
      <button type="submit">🔍</button>
    </form>
  )
}

export default SearchBar
