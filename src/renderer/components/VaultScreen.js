// src/renderer/components/VaultScreen.js
import React, { useState, useMemo } from 'react'; // Añadir useMemo
import PasswordForm from './PasswordForm.js';
import PasswordList from './PasswordList.js';
import SearchBar from './SearchBar.js'; // NUEVO: Importar SearchBar

function VaultScreen({
  passwords, // Este es passwordsSession de App.js
  onLock,
  onAddPassword,
  onUpdatePassword,
  onDeletePassword,
}) {
  
  const [formError, setFormError] = useState('');
  const [entryToEdit, setEntryToEdit] = useState(null);
  const [searchTerm, setSearchTerm] = useState(''); // NUEVO: Estado para el término de búsqueda

  const handleFormError = (message) => {
    setFormError(message);
    setTimeout(() => setFormError(''), 3000);
  };

  const handleEditEntry = (entryDataFromItem) => {
    console.log("[VaultScreen handleEditEntry] Recibido para editar:", JSON.parse(JSON.stringify(entryDataFromItem || {})));
    console.log("[VaultScreen handleEditEntry] Tipo de dato recibido:", typeof entryDataFromItem);
    setEntryToEdit(entryDataFromItem); 
    setFormError('');
    const formElement = document.querySelector('.bg-gray-700.p-6.rounded-lg'); // Selector para el div del formulario
    if (formElement) formElement.scrollIntoView({ behavior: 'smooth' });
  };

  const handleCancelEdit = () => {
    setEntryToEdit(null);
    setFormError('');
  };

  const handleSavePassword = (passwordData, isEditing) => {
    if (isEditing) {
      onUpdatePassword(passwordData);
    } else {
      onAddPassword(passwordData);
    }
    setEntryToEdit(null); 
  };

  // NUEVO: Filtrar contraseñas basado en searchTerm
  // useMemo para evitar recalcular en cada renderizado si passwords o searchTerm no cambian
  const filteredPasswords = useMemo(() => {
    if (!searchTerm) {
      return passwords; // Si no hay término de búsqueda, devolver todas las contraseñas
    }
    const lowerCaseSearchTerm = searchTerm.toLowerCase();
    return passwords.filter(entry => 
      (entry.name && entry.name.toLowerCase().includes(lowerCaseSearchTerm)) ||
      (entry.username && entry.username.toLowerCase().includes(lowerCaseSearchTerm)) ||
      (entry.category && entry.category.toLowerCase().includes(lowerCaseSearchTerm))
      // Podrías añadir búsqueda por notas también si quieres:
      // || (entry.notes && entry.notes.toLowerCase().includes(lowerCaseSearchTerm))
    );
  }, [passwords, searchTerm]);


  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-blue-400">Mi Bóveda (React)</h1>
        <button
          onClick={onLock}
          className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-md font-semibold btn flex items-center"
        >
          <i className="fas fa-lock mr-2"></i>Bloquear
        </button>
      </div>
      
      <PasswordForm 
        onSavePassword={handleSavePassword}
        onShowError={handleFormError}
        entryToEdit={entryToEdit}
        onCancelEdit={handleCancelEdit}
      />
      {formError && <p className="text-red-400 text-sm mt-2 mb-2 text-center">{formError}</p>}
      
      {/* NUEVO: Integrar SearchBar */}
      <SearchBar 
        searchTerm={searchTerm}
        onSearchTermChange={setSearchTerm} // Pasar la función para actualizar el estado
      />
      
      <p className="text-center mb-4 text-sm text-gray-400">
        Mostrando {filteredPasswords ? filteredPasswords.length : 0} de {passwords ? passwords.length : 0} contraseñas.
      </p>

      <div className="max-h-96 overflow-y-auto pr-2">
        {filteredPasswords && filteredPasswords.length > 0 ? (
          <PasswordList
            passwords={filteredPasswords} // MODIFICADO: Pasar las contraseñas filtradas
            onShowError={handleFormError}
            onDeletePassword={onDeletePassword}
            onEditPassword={handleEditEntry}
          />
        ) : (
          <p className="text-center text-gray-400 py-4">
            {searchTerm ? "No se encontraron contraseñas que coincidan con tu búsqueda." : 
             (entryToEdit ? "" : "Tu bóveda está vacía. ¡Añade tu primera contraseña!")
            }
          </p>
        )}
      </div>
    </div>
  );
}

export default VaultScreen;