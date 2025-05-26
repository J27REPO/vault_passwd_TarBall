// src/renderer/components/MasterPasswordSetup.js
import React, { useState } from 'react';
// Asegúrate de que esta ruta es correcta
import { deriveKey, encryptData, bufferToHex } from '../cryptoUtils.js'; 

function MasterPasswordSetup({ onSetupComplete, onShowError }) {
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSetupAttempt = async () => {
    if (!newPassword || !confirmPassword) {
      onShowError('Por favor, completa ambos campos de contraseña.');
      return;
    }
    if (newPassword.length < 8) { // Misma validación que tenías antes
      onShowError('La contraseña maestra debe tener al menos 8 caracteres.');
      return;
    }
    if (newPassword !== confirmPassword) {
      onShowError('Las contraseñas no coinciden.');
      return;
    }

    setIsLoading(true);
    onShowError(''); // Limpiar errores previos

    try {
      // Generar un nuevo salt
      const salt = window.crypto.getRandomValues(new Uint8Array(16));
      const key = await deriveKey(newPassword, salt);

      // La bóveda inicial estará vacía
      const initialPasswordsArray = [];
      const { ciphertext, iv } = await encryptData(key, JSON.stringify(initialPasswordsArray));

      const vaultToStore = {
        salt: bufferToHex(salt),
        iv: bufferToHex(iv),
        ciphertext: bufferToHex(ciphertext)
      };

      const VAULT_STORAGE_KEY = 'securePasswordVault'; // Constante compartida
      localStorage.setItem(VAULT_STORAGE_KEY, JSON.stringify(vaultToStore));

      // Notificar a App.js que la configuración está completa,
      // pasar la nueva clave y el array de contraseñas vacío.
      onSetupComplete(key, initialPasswordsArray);

    } catch (error) {
      console.error("Error durante la configuración de la contraseña maestra:", error);
      onShowError('Error al configurar la contraseña maestra. Inténtalo de nuevo.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full">
      <h2 className="text-xl font-semibold text-center text-gray-100 mb-4">Configura tu Contraseña Maestra</h2>
      <p className="text-sm text-gray-400 mb-4 text-center">
        Esta contraseña protegerá todas tus demás contraseñas. ¡No la olvides!
      </p>
      <input
        type="password"
        id="new-master-password"
        value={newPassword}
        onChange={(e) => setNewPassword(e.target.value)}
        placeholder="Nueva Contraseña Maestra"
        className="w-full p-3 mb-3 rounded-md bg-gray-700 border-gray-600 text-gray-200 focus:border-blue-500 focus:ring-blue-500"
        disabled={isLoading}
      />
      <input
        type="password"
        id="confirm-master-password"
        value={confirmPassword}
        onChange={(e) => setConfirmPassword(e.target.value)}
        onKeyPress={(e) => e.key === 'Enter' && !isLoading && handleSetupAttempt()}
        placeholder="Confirma Contraseña Maestra"
        className="w-full p-3 mb-4 rounded-md bg-gray-700 border-gray-600 text-gray-200 focus:border-blue-500 focus:ring-blue-500"
        disabled={isLoading}
      />
      <button
        id="set-master-password-btn"
        onClick={handleSetupAttempt}
        className="w-full bg-blue-600 hover:bg-blue-700 text-white p-3 rounded-md font-semibold transition-colors duration-150 ease-in-out disabled:opacity-50"
        disabled={isLoading}
      >
        {isLoading ? 'Configurando...' : 'Establecer Contraseña Maestra'}
      </button>
    </div>
  );
}

export default MasterPasswordSetup;