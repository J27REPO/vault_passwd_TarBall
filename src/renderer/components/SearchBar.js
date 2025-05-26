// src/renderer/components/SearchBar.js
import React from 'react';

function SearchBar({ searchTerm, onSearchTermChange }) {
  return (
    <div className="my-4"> {/* Espaciado alrededor de la barra */}
      <input
        type="text"
        placeholder="Buscar contraseñas por nombre, usuario o categoría..."
        value={searchTerm}
        onChange={(e) => onSearchTermChange(e.target.value)}
        className="w-full p-3 rounded-md bg-gray-700 border-gray-600 text-gray-200 focus:border-blue-500 focus:ring-blue-500"
      />
    </div>
  );
}

export default SearchBar;