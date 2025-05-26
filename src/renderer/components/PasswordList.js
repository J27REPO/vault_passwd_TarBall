// src/renderer/components/PasswordList.js
import React from 'react';
import PasswordListItem from './PasswordListItem.js';

function PasswordList({ passwords, onShowError, onDeletePassword, onEditPassword }) {
  if (!passwords || passwords.length === 0) {
    // Este mensaje ahora se maneja en VaultScreen, pero podrías tener uno aquí
    // si PasswordList se usara en otros contextos.
    return null; 
  }

  return (
    <div className="space-y-0"> {/* Quitamos space-y-3 para que el mb-3 de ListItem funcione */}
      {passwords.map(entry => (
        <PasswordListItem
          key={entry.id} // React necesita una key única para elementos en una lista
          entry={entry}
          onShowError={onShowError} // Para errores de copia, etc.
          onDelete={onDeletePassword} // Se pasarán desde App.js -> VaultScreen
          onEdit={onEditPassword}     // Se pasarán desde App.js -> VaultScreen
        />
      ))}
    </div>
  );
}

export default PasswordList;