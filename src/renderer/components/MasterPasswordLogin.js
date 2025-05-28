// src/renderer/components/MasterPasswordLogin.js
import React, { useState, useEffect } from 'react';
// Asegúrate de que la ruta a cryptoUtils.js sea correcta
import { deriveKey, decryptData, hexToBuffer } from '../cryptoUtils.js';

function MasterPasswordLogin({ 
    onUnlock, 
    onShowError, 
    vaultFilePath, 
    // onVaultPathSelected // Esta prop se usa en App.js para el botón "Abrir Otra Bóveda"
}) {
  const [loginPass, setLoginPass] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [rememberMasterPassword, setRememberMasterPassword] = useState(false); // NUEVO: Estado para la casilla

  useEffect(() => {
    setLoginPass('');
    if (onShowError) onShowError('');
  }, [vaultFilePath, onShowError]);

  const handleLoginAttempt = async () => {
    if (!loginPass) {
      onShowError('Por favor, ingresa tu contraseña maestra.');
      return;
    }
    if (!vaultFilePath) {
      onShowError('No se ha especificado una ruta para la bóveda.');
      return;
    }

    setIsLoading(true);
    onShowError('');

    try {
      if (!window.electronAPI || 
          !window.electronAPI.readVaultFile ||
          !window.electronAPI.keytarSetMasterPassword || // Verificar si existe la API
          !window.electronAPI.keytarDeleteMasterPassword ) { // Verificar si existe la API
        throw new Error("Las funciones de la API de Electron (archivos o llavero) no están disponibles.");
      }
      const readResult = await window.electronAPI.readVaultFile(vaultFilePath);

      if (!readResult.success) {
        if (readResult.code === 'ENOENT') {
            onShowError(`Archivo de bóveda no encontrado en: ${vaultFilePath}.`);
        } else {
            onShowError(`Error al leer el archivo de la bóveda: ${readResult.error}`);
        }
        setIsLoading(false);
        return;
      }

      const storedVaultData = JSON.parse(readResult.data);

      if (!storedVaultData.salt || !storedVaultData.iv || !storedVaultData.ciphertext) {
          onShowError('El archivo de la bóveda está incompleto o corrupto.');
          setIsLoading(false);
          return;
      }

      const saltFromFileHex = storedVaultData.salt;
      const saltBuffer = hexToBuffer(saltFromFileHex);
      const ivBuffer = hexToBuffer(storedVaultData.iv);
      const ciphertextBuffer = hexToBuffer(storedVaultData.ciphertext);
      
      const derivedKey = await deriveKey(loginPass, saltBuffer);
      const decryptedDataString = await decryptData(derivedKey, ciphertextBuffer, ivBuffer);

      if (decryptedDataString === null) {
        onShowError('Contraseña maestra incorrecta.');
        setLoginPass('');
      } else {
        const decryptedPasswords = JSON.parse(decryptedDataString);

        // NUEVO: Lógica para guardar/eliminar la contraseña maestra en el llavero
        if (rememberMasterPassword) {
          const setResult = await window.electronAPI.keytarSetMasterPassword(loginPass);
          if (!setResult.success) {
            console.warn("No se pudo guardar la contraseña maestra en el llavero:", setResult.error);
            // No es un error crítico para el login, pero el usuario debería saberlo
            onShowError("Contraseña maestra correcta, pero no se pudo guardar para desbloqueo automático."); 
            // Continuar con el desbloqueo de todas formas
          } else {
            console.log("Contraseña maestra guardada en el llavero.");
          }
        } else {
          // Si no se marca "recordar", intentamos eliminarla por si estaba guardada antes.
          // keytar.deletePassword no falla si la contraseña no existe.
          const deleteResult = await window.electronAPI.keytarDeleteMasterPassword();
          if (deleteResult.success) {
            console.log("Contraseña maestra eliminada del llavero (o no estaba).");
          } else {
            console.warn("No se pudo eliminar la contraseña maestra del llavero:", deleteResult.error);
          }
        }
        
        onUnlock({ key: derivedKey, saltHex: saltFromFileHex }, decryptedPasswords);
      }
    } catch (error) {
      console.error("Error durante el intento de login:", error);
      if (error instanceof SyntaxError) {
        onShowError('Error: El archivo de la bóveda parece estar corrupto (JSON inválido).');
      } else {
        onShowError(`Error al procesar la bóveda: ${error.message}`);
      }
      setLoginPass('');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full">
      <h2 className="text-xl font-semibold text-center text-gray-100 mb-4">Ingresa tu Contraseña Maestra</h2>
      {vaultFilePath ? (
        <p className="text-xs text-center text-gray-400 mb-3 truncate" title={vaultFilePath}>
          Bóveda: {vaultFilePath.length > 50 ? `...${vaultFilePath.slice(-47)}` : vaultFilePath}
        </p>
      ) : (
        <p className="text-xs text-center text-yellow-400 mb-3">
          No hay una bóveda seleccionada.
        </p>
      )}
      <input
        type="password"
        id="login-master-password"
        value={loginPass}
        onChange={(e) => setLoginPass(e.target.value)}
        onKeyPress={(e) => e.key === 'Enter' && !isLoading && handleLoginAttempt()}
        placeholder="Contraseña Maestra"
        className="w-full p-3 mb-3 rounded-md bg-gray-700 border-gray-600 text-gray-200 focus:border-blue-500 focus:ring-blue-500"
        disabled={isLoading || !vaultFilePath}
      />
      {/* NUEVO: Casilla para Recordar Contraseña Maestra */}
      <div className="mb-4 flex items-center">
        <input
          type="checkbox"
          id="remember-master-password"
          checked={rememberMasterPassword}
          onChange={(e) => setRememberMasterPassword(e.target.checked)}
          className="h-4 w-4 text-blue-600 bg-gray-700 border-gray-500 rounded focus:ring-blue-500"
          disabled={isLoading || !vaultFilePath}
        />
        <label htmlFor="remember-master-password" className="ml-2 block text-sm text-gray-300">
          Recordar contraseña maestra en este equipo (desbloqueo automático)
        </label>
      </div>
      <button
        id="login-btn"
        onClick={handleLoginAttempt}
        className="w-full bg-green-600 hover:bg-green-700 text-white p-3 rounded-md font-semibold transition-colors duration-150 ease-in-out disabled:opacity-50"
        disabled={isLoading || !vaultFilePath}
      >
        {isLoading ? 'Desbloqueando...' : 'Desbloquear Bóveda'}
      </button>
    </div>
  );
}

export default MasterPasswordLogin;