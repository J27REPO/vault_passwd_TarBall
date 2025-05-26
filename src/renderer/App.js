// src/renderer/App.js
import React, { useState, useEffect } from 'react';

// Componentes de las diferentes pantallas/secciones
import MasterPasswordLogin from './components/MasterPasswordLogin.js';
import MasterPasswordSetup from './components/MasterPasswordSetup.js';
import VaultScreen from './components/VaultScreen.js';

import { encryptData, bufferToHex } from './cryptoUtils.js';

// Estilos para el contenedor principal de la aplicación
const appContainerStyle = {
    backgroundColor: '#1a202c', // bg-gray-900
    color: '#e2e8f0', // text-gray-200
    minHeight: '100vh',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '1rem',
};

// Estilos para el contenedor del contenido principal (el "card" central)
const mainContentStyle = {
    width: '100%',
    maxWidth: '42rem', // max-w-2xl
    backgroundColor: '#2d3748', // bg-gray-800
    padding: '2rem',
    borderRadius: '0.75rem',
    boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
};

const VAULT_STORAGE_KEY = 'securePasswordVault';

function App() {
  // Estados principales de la aplicación
  const [currentScreen, setCurrentScreen] = useState('loading'); // 'loading', 'setup', 'login', 'vault'
  const [masterKeySession, setMasterKeySession] = useState(null); // La clave derivada para la sesión actual
  const [passwordsSession, setPasswordsSession] = useState([]);   // Array de contraseñas descifradas
  const [appError, setAppError] = useState(''); // Para mostrar errores generales o de autenticación

  // Efecto para cargar el estado inicial de la bóveda al iniciar la app
  useEffect(() => {
    const storedVault = localStorage.getItem(VAULT_STORAGE_KEY);
    if (!storedVault) {
      setCurrentScreen('setup');
      setAppError(''); 
    } else {
      setCurrentScreen('login');
    }
  }, []);

  // --- Funciones Callback para los Componentes Hijos ---
  const handleUnlockSuccess = (key, decryptedPasswords) => {
    setMasterKeySession(key);
    setPasswordsSession(decryptedPasswords);
    setCurrentScreen('vault');
    setAppError('');
  };

  const handleSetupSuccess = (key, initialPasswordsArray) => {
    setMasterKeySession(key);
    setPasswordsSession(initialPasswordsArray);
    setCurrentScreen('vault');
    setAppError('');
  };

  const handleLockVault = () => {
    setMasterKeySession(null);
    setPasswordsSession([]);
    setCurrentScreen('login');
    setAppError('');
  };

  const displayError = (message) => {
    setAppError(message);
  };

  // --- Funciones para Modificar la Bóveda ---
  const savePasswordsToVault = async (updatedPasswordsArray) => {
    if (!masterKeySession) {
      console.error("App.js - savePasswordsToVault: Error - Intento de guardar sin masterKey en sesión.");
      displayError("Error al guardar: Sesión no válida. Intenta bloquear y desbloquear.");
      return false;
    }
    try {
      const storedVaultDataString = localStorage.getItem(VAULT_STORAGE_KEY);
      if (!storedVaultDataString) {
          console.error("App.js - savePasswordsToVault: Error - No se encontró la bóveda en localStorage para obtener el salt.");
          throw new Error("No se encontró la bóveda en localStorage para obtener el salt.");
      }
      const storedVaultData = JSON.parse(storedVaultDataString);
      if (!storedVaultData.salt) {
          console.error("App.js - savePasswordsToVault: Error - El salt no se encontró en los datos de la bóveda almacenada.");
          throw new Error("El salt no se encontró en los datos de la bóveda almacenada.");
      }

      const { ciphertext, iv } = await encryptData(masterKeySession, JSON.stringify(updatedPasswordsArray));
      
      const vaultToStore = {
        salt: storedVaultData.salt,
        iv: bufferToHex(iv),
        ciphertext: bufferToHex(ciphertext)
      };
      localStorage.setItem(VAULT_STORAGE_KEY, JSON.stringify(vaultToStore));
      
      // DEBUG: Log antes de llamar a setPasswordsSession
      console.log("App.js - savePasswordsToVault: Llamando a setPasswordsSession con:", JSON.parse(JSON.stringify(updatedPasswordsArray)));
      setPasswordsSession(updatedPasswordsArray);
      
      return true;
    } catch (error) {
      console.error("App.js - savePasswordsToVault: Error al guardar la bóveda:", error);
      displayError(`Error al guardar la bóveda: ${error.message}`);
      return false;
    }
  };

  const handleAddPasswordEntry = async (newEntry) => {
    // El ID ya debería estar generado por PasswordForm si es una nueva entrada
    const updatedPasswords = [...passwordsSession, newEntry];
    const success = await savePasswordsToVault(updatedPasswords);
    if (success) {
      console.log("App.js - handleAddPasswordEntry: Nueva contraseña añadida y bóveda guardada.");
      displayError(''); // Limpiar errores si el guardado fue exitoso
    }
  };

// En src/renderer/App.js
  const handleUpdatePasswordEntry = async (updatedEntryFromForm) => {
    console.log("App.js - handleUpdatePasswordEntry: Llamada con:", JSON.parse(JSON.stringify(updatedEntryFromForm)));
    console.log("App.js - handleUpdatePasswordEntry: passwordsSession ANTES de actualizar:", JSON.parse(JSON.stringify(passwordsSession)));

    let found = false;
    const updatedPasswordsArray = passwordsSession.map((p, index) => { // Añadir index para logging
        // LOG DETALLADO DE COMPARACIÓN
        console.log(
            `[App.js map iter ${index}] Comparando: p.id = "${p.id}" (tipo: ${typeof p.id}) CON updatedEntryFromForm.id = "${updatedEntryFromForm.id}" (tipo: ${typeof updatedEntryFromForm.id})`
        );

        if (p.id === updatedEntryFromForm.id) {
            console.log(`[App.js map iter ${index}] ¡Coincidencia encontrada! Actualizando entrada.`);
            found = true;
            return { ...p, ...updatedEntryFromForm }; 
        }
        return p;
    });

    if (!found) {
        // Este log ahora es más sospechoso si updatedEntryFromForm.id era válido antes del map
        console.error("App.js - handleUpdatePasswordEntry: No se encontró la entrada con ID para actualizar. ID buscado (de updatedEntryFromForm.id):", updatedEntryFromForm.id);
        displayError("Error: No se pudo encontrar la entrada para actualizar.");
        return;
    }
    
    console.log("App.js - handleUpdatePasswordEntry: passwordsSession DESPUÉS del map (antes de save):", JSON.parse(JSON.stringify(updatedPasswordsArray)));

    const success = await savePasswordsToVault(updatedPasswordsArray);

    if (success) {
      console.log("App.js - handleUpdatePasswordEntry: Contraseña actualizada y bóveda guardada (después de savePasswordsToVault).");
      displayError('');
    } else {
      console.error("App.js - handleUpdatePasswordEntry: savePasswordsToVault falló.");
    }
  };

  const handleDeletePasswordEntry = async (entryIdToDelete) => {
    console.log("App.js - handleDeletePasswordEntry: Intentando eliminar ID:", entryIdToDelete);
    const updatedPasswords = passwordsSession.filter(p => p.id !== entryIdToDelete);
    const success = await savePasswordsToVault(updatedPasswords);
    if (success) {
      console.log("App.js - handleDeletePasswordEntry: Contraseña eliminada y bóveda guardada.");
      displayError(''); // Limpiar errores
    }
  };

  // --- Renderizado Condicional de Pantallas ---
  let screenContent;

  if (currentScreen === 'loading') {
    screenContent = <p className="text-xl text-center">Cargando aplicación...</p>;
  } else if (currentScreen === 'setup') {
    screenContent = (
      <div>
        <MasterPasswordSetup 
          onSetupComplete={handleSetupSuccess}
          onShowError={displayError}
        />
        {appError && <p className="text-red-400 text-sm mt-3 text-center">{appError}</p>}
      </div>
    );
  } else if (currentScreen === 'login') {
    screenContent = (
      <div>
        <h1 className="text-3xl font-bold text-center text-blue-400 mb-6">Gestor de Contraseñas (React)</h1>
        <MasterPasswordLogin 
            onUnlock={handleUnlockSuccess} 
            onShowError={displayError} 
        />
        {appError && <p className="text-red-400 text-sm mt-3 text-center">{appError}</p>}
      </div>
    );
  } else if (currentScreen === 'vault') {
    screenContent = (
        <VaultScreen
            passwords={passwordsSession}
            onLock={handleLockVault}
            onAddPassword={handleAddPasswordEntry}
            onUpdatePassword={handleUpdatePasswordEntry}
            onDeletePassword={handleDeletePasswordEntry}
        />
    );
  } else {
    screenContent = <p className="text-xl text-center text-red-500">Error: Pantalla desconocida.</p>;
  }

  return (
    <div style={appContainerStyle}>
        <div style={mainContentStyle}>
            {screenContent}
        </div>
    </div>
  );
}

export default App;