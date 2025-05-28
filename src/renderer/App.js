// src/renderer/App.js
import React, { useState, useEffect } from 'react';

// Componentes de las diferentes pantallas/secciones
import MasterPasswordLogin from './components/MasterPasswordLogin.js';
import MasterPasswordSetup from './components/MasterPasswordSetup.js';
import VaultScreen from './components/VaultScreen.js';

// Funciones de cripto que necesitaremos aquí
import { encryptData, bufferToHex, deriveKey, decryptData, hexToBuffer } from './cryptoUtils.js';

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

const VAULT_PATH_STORAGE_KEY = 'securePasswordVaultPath';

function App() {
  const [currentScreen, setCurrentScreen] = useState('loading');
  // masterKeySession ahora será un objeto: { key: CryptoKey, saltHex: string } | null
  const [masterKeySession, setMasterKeySession] = useState(null); 
  const [passwordsSession, setPasswordsSession] = useState([]);
  const [appError, setAppError] = useState('');
  const [vaultFilePath, setVaultFilePath] = useState(null);
  const [isLoadingVault, setIsLoadingVault] = useState(true);

  // Función para intentar el desbloqueo automático o preparar para login/setup manual
  const attemptAutoUnlockOrCreateSetup = async (filePath) => {
    setIsLoadingVault(true); // Iniciar carga
    setAppError(''); // Limpiar errores previos

    if (!filePath) {
      console.log("[App.js] No hay ruta de bóveda (filePath es null/undefined), yendo a setup.");
      setCurrentScreen('setup');
      setIsLoadingVault(false);
      return;
    }

    console.log("[App.js] Ruta de bóveda para procesar:", filePath);
    setVaultFilePath(filePath); // Asegurar que el estado vaultFilePath esté actualizado para el login manual si es necesario

    // Verificar si las APIs de Electron están disponibles
    if (!window.electronAPI || 
        !window.electronAPI.keytarGetMasterPassword || 
        !window.electronAPI.readVaultFile ||
        !window.electronAPI.keytarDeleteMasterPassword) {
      setAppError("Funciones críticas de la API de Electron no están disponibles.");
      setCurrentScreen('login'); // Ir a login manual como fallback si la API no está
      setIsLoadingVault(false);
      return;
    }

    // 1. Intentar obtener la contraseña maestra del llavero
    const keytarResult = await window.electronAPI.keytarGetMasterPassword();

    if (keytarResult.success && keytarResult.password) {
      const rememberedPassword = keytarResult.password;
      console.log("[App.js] Contraseña maestra recuperada del llavero. Intentando descifrar...");

      // 2. Si se obtuvo, intentar descifrar la bóveda
      const readResult = await window.electronAPI.readVaultFile(filePath);
      if (readResult.success && readResult.data) {
        try {
          const storedVaultData = JSON.parse(readResult.data);
          if (!storedVaultData.salt || !storedVaultData.iv || !storedVaultData.ciphertext) {
            throw new Error("Datos de la bóveda en archivo incompletos o corruptos.");
          }

          const saltFromFileHex = storedVaultData.salt;
          const saltBuffer = hexToBuffer(saltFromFileHex);
          const ivBuffer = hexToBuffer(storedVaultData.iv);
          const ciphertextBuffer = hexToBuffer(storedVaultData.ciphertext);

          const derivedKey = await deriveKey(rememberedPassword, saltBuffer);
          const decryptedDataString = await decryptData(derivedKey, ciphertextBuffer, ivBuffer);

          if (decryptedDataString !== null) {
            console.log("[App.js] Desbloqueo automático exitoso.");
            const decryptedPasswords = JSON.parse(decryptedDataString);
            // Llamar a handleUnlockSuccess que actualiza el estado y la pantalla
            handleUnlockSuccess({ key: derivedKey, saltHex: saltFromFileHex }, decryptedPasswords);
            // setIsLoadingVault(false); // handleUnlockSuccess ya podría cambiar la pantalla
            // return; // Éxito, salir de la función
          } else {
            console.warn("[App.js] Contraseña del llavero incorrecta para la bóveda. Borrando del llavero.");
            await window.electronAPI.keytarDeleteMasterPassword();
            setAppError("La contraseña maestra guardada no es correcta. Por favor, ingrésala manualmente.");
            setCurrentScreen('login'); // Ir a login manual
          }
        } catch (error) {
          console.error("[App.js] Error al procesar la bóveda durante el desbloqueo automático:", error);
          setAppError(`Error al procesar la bóveda: ${error.message}. Puede estar corrupta.`);
          setCurrentScreen('login'); // Ir a login manual
        }
      } else {
        // El archivo no se pudo leer (podría no existir en la ruta guardada)
        console.warn(`[App.js] No se pudo leer el archivo de la bóveda en ${filePath} para desbloqueo automático. Código: ${readResult.code}, Error: ${readResult.error}`);
        setAppError(`No se pudo leer la bóveda en la ruta guardada. Por favor, verifica la ruta o crea una nueva bóveda.`);
        // Si no se puede leer, podría ser que el archivo fue borrado. Permitir al usuario loguear
        // y el componente Login manejará el error de archivo no encontrado.
        // O mejor, ir a setup si el archivo no existe.
        if (readResult.code === 'ENOENT') { // ENOENT: Error NO ENTry (archivo o directorio no existe)
            localStorage.removeItem(VAULT_PATH_STORAGE_KEY); // Limpiar ruta incorrecta
            setVaultFilePath(null);
            setCurrentScreen('setup');
            setAppError("El archivo de la bóveda no se encontró en la ruta guardada. Por favor, configura una nueva bóveda o abre una existente.");
        } else {
            setCurrentScreen('login'); // Para otros errores de lectura, intentar login manual
        }
      }
    } else { // No hay contraseña en el llavero o hubo error al obtenerla
      if (keytarResult.success && keytarResult.password === null) {
        console.log("[App.js] No hay contraseña maestra guardada en el llavero para desbloqueo automático.");
      } else if (!keytarResult.success) {
        console.warn("[App.js] Error al intentar obtener contraseña del llavero:", keytarResult.error);
      }
      console.log("[App.js] Desbloqueo automático no realizado o no aplicable, yendo a login manual.");
      setCurrentScreen('login');
    }
    setIsLoadingVault(false);
  };


  useEffect(() => {
    const storedPath = localStorage.getItem(VAULT_PATH_STORAGE_KEY);
    attemptAutoUnlockOrCreateSetup(storedPath);
  }, []);

  const displayError = (message) => { setAppError(message); };

  const handleUnlockSuccess = (masterKeyObject, decryptedPasswords) => {
    setMasterKeySession(masterKeyObject);
    setPasswordsSession(decryptedPasswords);
    setCurrentScreen('vault');
    setAppError('');
    setIsLoadingVault(false); // Asegurar que la carga ha terminado
  };

  const handleSetupSuccess = (masterKeyObject, initialPasswordsArray, filePath) => {
    setMasterKeySession(masterKeyObject);
    setPasswordsSession(initialPasswordsArray);
    setVaultFilePath(filePath);
    localStorage.setItem(VAULT_PATH_STORAGE_KEY, filePath);
    setCurrentScreen('vault');
    setAppError('');
    setIsLoadingVault(false); // Asegurar que la carga ha terminado
    console.log("[App.js handleSetupSuccess] Bóveda configurada y guardada en:", filePath);
  };

  const handleLockVault = () => {
    setMasterKeySession(null);
    setPasswordsSession([]);
    setCurrentScreen('login');
    setAppError('');
  };

  const savePasswordsToVault = async (updatedPasswordsArray) => {
    if (!masterKeySession || !masterKeySession.key || !masterKeySession.saltHex) {
      console.error("App.js - savePasswordsToVault: Error - masterKey o saltHex no disponibles en sesión.");
      displayError("Error al guardar: Sesión no válida o incompleta.");
      return false;
    }
    if (!vaultFilePath) {
      console.error("App.js - savePasswordsToVault: Error - No hay ruta de archivo para la bóveda.");
      displayError("Error al guardar: Ruta de archivo de la bóveda no definida.");
      return false;
    }

    try {
      const saltForStorageInFile = masterKeySession.saltHex;
      const keyForEncryption = masterKeySession.key;

      const { ciphertext, iv } = await encryptData(keyForEncryption, JSON.stringify(updatedPasswordsArray));
      
      const vaultToStore = {
        salt: saltForStorageInFile, 
        iv: bufferToHex(iv),
        ciphertext: bufferToHex(ciphertext)
      };

      const writeResult = await window.electronAPI.writeVaultFile(vaultFilePath, JSON.stringify(vaultToStore));
      if (!writeResult.success) {
        throw new Error(`Fallo al escribir en el archivo de la bóveda: ${writeResult.error}`);
      }

      console.log("[App.js savePasswordsToVault] Llamando a setPasswordsSession con:", JSON.parse(JSON.stringify(updatedPasswordsArray)));
      setPasswordsSession(updatedPasswordsArray);
      return true;
    } catch (error) {
      console.error("App.js - savePasswordsToVault: Error al guardar la bóveda:", error);
      displayError(`Error al guardar la bóveda: ${error.message}`);
      return false;
    }
  };
  
  const handleAddPasswordEntry = async (newEntry) => {
    const updatedPasswords = [...passwordsSession, newEntry];
    const success = await savePasswordsToVault(updatedPasswords);
    if (success) {
      console.log("App.js - handleAddPasswordEntry: Nueva contraseña añadida y bóveda guardada.");
      displayError(''); 
    }
  };

  const handleUpdatePasswordEntry = async (updatedEntryFromForm) => {
    console.log("App.js - handleUpdatePasswordEntry: Llamada con (updatedEntryFromForm):", JSON.parse(JSON.stringify(updatedEntryFromForm || {})));
    console.log("App.js - handleUpdatePasswordEntry: passwordsSession ANTES de actualizar:", JSON.parse(JSON.stringify(passwordsSession || [])));

    let found = false;
    const updatedPasswordsArray = passwordsSession.map((p, index) => {
        console.log(
            `[App.js map iter ${index}] Comparando: p.id = "${p.id}" (tipo: ${typeof p.id}) CON updatedEntryFromForm.id = "${updatedEntryFromForm ? updatedEntryFromForm.id : 'undefined'}" (tipo: ${updatedEntryFromForm ? typeof updatedEntryFromForm.id : 'undefined'})`
        );

        if (updatedEntryFromForm && p.id === updatedEntryFromForm.id) {
            console.log(`[App.js map iter ${index}] ¡Coincidencia encontrada! Actualizando entrada:`, JSON.parse(JSON.stringify(p)));
            found = true;
            return { ...p, ...updatedEntryFromForm }; 
        }
        return p;
    });

    if (!found) {
        console.error(
            "App.js - handleUpdatePasswordEntry: No se encontró la entrada con ID para actualizar. ID buscado (de updatedEntryFromForm.id al final del map):", 
            updatedEntryFromForm ? updatedEntryFromForm.id : "updatedEntryFromForm es nulo/undefined o no tiene id"
        );
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
      displayError('');
    }
  };

  // --- Renderizado Condicional ---
  let screenContent;

  if (isLoadingVault || currentScreen === 'loading') {
    screenContent = <p className="text-xl text-center">Cargando aplicación...</p>;
  } else if (currentScreen === 'setup') {
    screenContent = (
      <MasterPasswordSetup 
        onSetupComplete={handleSetupSuccess}
        onShowError={displayError}
      />
    );
  } else if (currentScreen === 'login') {
    screenContent = (
      <div>
        <h1 className="text-3xl font-bold text-center text-blue-400 mb-6">Gestor de Contraseñas (React)</h1>
        <MasterPasswordLogin 
            onUnlock={handleUnlockSuccess}
            onShowError={displayError}
            vaultFilePath={vaultFilePath}
        />
        {appError && <p className="text-red-400 text-sm mt-3 text-center">{appError}</p>}
        {(currentScreen === 'login') && (
             <button 
                onClick={async () => {
                    if (!window.electronAPI || !window.electronAPI.showOpenVaultDialog) {
                        displayError("Error: La función para abrir diálogo no está disponible.");
                        return;
                    }
                    const { canceled, filePath: newPath } = await window.electronAPI.showOpenVaultDialog();
                    if (!canceled && newPath) {
                        localStorage.setItem(VAULT_PATH_STORAGE_KEY, newPath); // Guardar nueva ruta
                        setAppError(''); 
                        // Recargar la lógica de inicio con la nueva ruta
                        attemptAutoUnlockOrCreateSetup(newPath); 
                    }
                }}
                className="mt-4 w-full text-sm bg-gray-600 hover:bg-gray-500 text-white py-2 px-4 rounded"
            >
                Abrir Otra Bóveda
            </button>
        )}
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