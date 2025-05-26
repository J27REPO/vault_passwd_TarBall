// En: src/renderer/components/MasterPasswordLogin.js

import React, { useState } from 'react';
// Asegúrate de que esta ruta sea correcta para tu estructura de archivos
import { deriveKey, decryptData, hexToBuffer } from '../cryptoUtils.js';

function MasterPasswordLogin({ onUnlock, onShowError }) { // Funciones pasadas desde App.js
  const [loginPass, setLoginPass] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleLoginAttempt = async () => {
    if (!loginPass) {
      onShowError('Por favor, ingresa tu contraseña maestra.');
      return;
    }
    setIsLoading(true);
    onShowError(''); // Limpiar errores previos

    const VAULT_STORAGE_KEY = 'securePasswordVault'; // Sería ideal mover esto a una constante compartida
    const storedVaultDataString = localStorage.getItem(VAULT_STORAGE_KEY);

    if (!storedVaultDataString) {
      // Esto podría indicar que es la primera vez o que la bóveda fue eliminada.
      // App.js debería manejar la lógica para redirigir a la pantalla de setup si es necesario.
      onShowError('No se encontró la bóveda. ¿Necesitas configurar una nueva?');
      setIsLoading(false);
      return;
    }

    try {
      const storedVaultData = JSON.parse(storedVaultDataString);

      // Validar que los datos necesarios de la bóveda existen
      if (!storedVaultData.salt || !storedVaultData.iv || !storedVaultData.ciphertext) {
          onShowError('Los datos de la bóveda están incompletos o corruptos.');
          setIsLoading(false);
          return;
      }

      const salt = hexToBuffer(storedVaultData.salt);
      const iv = hexToBuffer(storedVaultData.iv);
      const ciphertext = hexToBuffer(storedVaultData.ciphertext);
      
      const key = await deriveKey(loginPass, salt); // loginPass es del estado del input
      const decryptedDataString = await decryptData(key, ciphertext, iv);

      if (decryptedDataString === null) {
        // Esto sucede si decryptData devuelve null, típicamente por una contraseña incorrecta
        onShowError('Contraseña maestra incorrecta.');
        setLoginPass(''); // Limpiar el input para que el usuario intente de nuevo
      } else {
        // Descifrado exitoso
        const decryptedPasswords = JSON.parse(decryptedDataString);
        onUnlock(key, decryptedPasswords); // Pasa la clave derivada y las contraseñas descifradas a App.js
      }
    } catch (error) {
      console.error("Error durante el intento de login:", error);
      // Un error aquí podría ser por JSON.parse(storedVaultDataString) si está corrupto,
      // o un error inesperado en las funciones de criptografía.
      onShowError('Error al intentar descifrar la bóveda o los datos están corruptos.');
      setLoginPass(''); // Limpiar por seguridad o para reintento
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full"> {/* Clases de Tailwind */}
      <h2 className="text-xl font-semibold text-center text-gray-100 mb-4">Ingresa tu Contraseña Maestra</h2>
      <input
        type="password"
        id="login-master-password"
        value={loginPass}
        onChange={(e) => setLoginPass(e.target.value)}
        onKeyPress={(e) => e.key === 'Enter' && !isLoading && handleLoginAttempt()}
        placeholder="Contraseña Maestra"
        className="w-full p-3 mb-4 rounded-md bg-gray-700 border-gray-600 text-gray-200 focus:border-blue-500 focus:ring-blue-500"
        disabled={isLoading}
      />
      <button
        id="login-btn"
        onClick={handleLoginAttempt}
        className="w-full bg-green-600 hover:bg-green-700 text-white p-3 rounded-md font-semibold transition-colors duration-150 ease-in-out disabled:opacity-50"
        disabled={isLoading}
      >
        {isLoading ? 'Desbloqueando...' : 'Desbloquear Bóveda'}
      </button>
    </div>
  );
}

export default MasterPasswordLogin;