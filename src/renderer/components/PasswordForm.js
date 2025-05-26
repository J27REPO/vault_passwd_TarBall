// src/renderer/components/PasswordForm.js
import React, { useState, useEffect } from 'react';

function PasswordForm({ onSavePassword, onShowError, entryToEdit, onCancelEdit }) {
  const [siteName, setSiteName] = useState('');
  const [username, setUsername] = useState('');
  const [sitePassword, setSitePassword] = useState('');
  const [category, setCategory] = useState('other');
  const [notes, setNotes] = useState('');
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);
  // formId ya no es estrictamente necesario si usamos entryToEdit.id directamente en handleSubmit
  // pero lo dejamos por los logs y el useEffect.
  const [formId, setFormId] = useState(null); 

  const isEditing = !!entryToEdit;

  useEffect(() => {
    console.log("[PF useEffect] entryToEdit recibido:", JSON.parse(JSON.stringify(entryToEdit || {})));
    if (entryToEdit) {
      console.log("[PF useEffect] ID de entryToEdit:", entryToEdit.id);
      setFormId(entryToEdit.id); // Establecer para referencia, aunque no lo usaremos directamente para construir el ID
      setSiteName(entryToEdit.name || '');
      setUsername(entryToEdit.username || '');
      setSitePassword(entryToEdit.password || '');
      setCategory(entryToEdit.category || 'other');
      setNotes(entryToEdit.notes || '');
      setIsPasswordVisible(true);
    } else {
      console.log("[PF useEffect] No hay entryToEdit, reseteando formulario.");
      resetFormFields();
    }
  }, [entryToEdit]);

  const resetFormFields = () => {
    setFormId(null);
    setSiteName('');
    setUsername('');
    setSitePassword('');
    setCategory('other');
    setNotes('');
    setIsPasswordVisible(false);
    if (onShowError) onShowError('');
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!siteName || !username || !sitePassword) {
      if (onShowError) onShowError('Nombre del sitio, usuario y contraseña son obligatorios.');
      return;
    }

    console.log("[PF handleSubmit] VALOR DE PROP entryToEdit ANTES DE USARLO:", JSON.parse(JSON.stringify(entryToEdit || {})));
    console.log("[PF handleSubmit] VALOR DE ESTADO formId ANTES DE USARLO:", formId);


    let passwordData = {
        name: siteName,
        username: username,
        password: sitePassword,
        category: category,
        notes: notes,
        // El ID se asignará condicionalmente
    };

    if (isEditing && entryToEdit && typeof entryToEdit.id !== 'undefined') {
      // MODO EDICIÓN: Asignar el ID de la entrada original
      console.log(`[PF handleSubmit] MODO EDICIÓN: Asignando ID de entryToEdit: "${entryToEdit.id}"`);
      passwordData.id = entryToEdit.id;
    } else if (isEditing) {
      // MODO EDICIÓN PERO entryToEdit.id ES PROBLEMÁTICO (esto no debería pasar si entryToEdit está bien)
      // Intentar usar el formId del estado como último recurso, pero loguear una advertencia
      console.warn(`[PF handleSubmit] MODO EDICIÓN: entryToEdit.id era undefined. Intentando usar formId del estado: "${formId}". Esto es inesperado.`);
      if (typeof formId !== 'undefined' && formId !== null) {
        passwordData.id = formId;
      } else {
        console.error("[PF handleSubmit] MODO EDICIÓN: ¡FALLO CRÍTICO! No se pudo determinar el ID para la actualización. Abortando envío.");
        onShowError("Error crítico: No se pudo determinar el ID de la entrada para actualizar.");
        return; // No enviar si no tenemos ID en modo edición
      }
    }
    else { 
      // MODO AÑADIR NUEVO: Generar un nuevo ID
      console.log("[PF handleSubmit] MODO AÑADIR: Generando nuevo ID.");
      passwordData.id = Date.now().toString();
    }
    
    console.log("[PF handleSubmit] passwordData A ENVIAR:", JSON.parse(JSON.stringify(passwordData)), "Es edición:", isEditing);
    
    // Verificar que el ID está presente si es edición antes de enviar
    if (isEditing && (typeof passwordData.id === 'undefined' || passwordData.id === null)) {
        console.error("[PF handleSubmit] MODO EDICIÓN: Intento de enviar sin ID. Abortando.");
        onShowError("Error: No se pudo enviar la actualización porque falta el ID.");
        return;
    }

    onSavePassword(passwordData, isEditing); 
    
    if (!isEditing) {
        resetFormFields();
    }
  };

  // ... (resto del PasswordForm.js: togglePasswordVisibility, generateSecurePassword, y el JSX del return no necesitan cambios) ...
  const togglePasswordVisibility = () => {
    setIsPasswordVisible(!isPasswordVisible);
  };

  const generateSecurePassword = () => {
    const length = 16;
    const charset = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*()_+-=[]{}|;:,.<>?";
    let retVal = "";
    for (let i = 0, n = charset.length; i < length; ++i) {
        retVal += charset.charAt(Math.floor(Math.random() * n));
    }
    setSitePassword(retVal);
    setIsPasswordVisible(true);
  };

  return (
    <form onSubmit={handleSubmit} className="bg-gray-700 p-6 rounded-lg mb-6 shadow-md">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold mb-4 text-gray-100">
          {isEditing ? 'Editar Contraseña' : 'Añadir Nueva Contraseña'}
        </h2>
        {isEditing && onCancelEdit && (
          <button
            type="button"
            onClick={onCancelEdit}
            className="mb-4 text-sm bg-gray-500 hover:bg-gray-600 text-white py-1 px-3 rounded"
          >
            Cancelar Edición
          </button>
        )}
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <input
          type="text"
          value={siteName}
          onChange={(e) => setSiteName(e.target.value)}
          placeholder="Nombre del Sitio/App"
          className="p-3 rounded-md bg-gray-600 border-gray-500 text-gray-200 focus:border-blue-500 focus:ring-blue-500"
        />
        <input
          type="text"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          placeholder="Nombre de Usuario"
          className="p-3 rounded-md bg-gray-600 border-gray-500 text-gray-200 focus:border-blue-500 focus:ring-blue-500"
        />
        <div className="relative md:col-span-1">
          <input
            type={isPasswordVisible ? 'text' : 'password'}
            value={sitePassword}
            onChange={(e) => setSitePassword(e.target.value)}
            placeholder="Contraseña"
            className="w-full p-3 rounded-md bg-gray-600 border-gray-500 text-gray-200 focus:border-blue-500 focus:ring-blue-500 pr-10"
          />
          <button
            type="button"
            onClick={togglePasswordVisibility}
            className="absolute inset-y-0 right-0 px-3 flex items-center text-gray-400 hover:text-gray-200"
            aria-label={isPasswordVisible ? "Ocultar contraseña" : "Mostrar contraseña"}
          >
            <i className={`fas ${isPasswordVisible ? 'fa-eye-slash' : 'fa-eye'}`}></i>
          </button>
        </div>
        <button
          type="button"
          onClick={generateSecurePassword}
          className="bg-yellow-500 hover:bg-yellow-600 text-gray-900 p-3 rounded-md font-semibold transition-colors duration-150 ease-in-out flex items-center justify-center text-sm"
        >
          <i className="fas fa-key mr-2"></i>Generar Contraseña
        </button>
        <select
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          className="p-3 rounded-md bg-gray-600 border-gray-500 text-gray-200 focus:border-blue-500 focus:ring-blue-500 md:col-span-2"
        >
          <option value="other">Otra</option>
          <option value="work">Trabajo</option>
          <option value="personal">Personal</option>
          <option value="social">Redes Sociales</option>
          <option value="finance">Finanzas</option>
        </select>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Notas adicionales (opcional)"
          rows="2"
          className="md:col-span-2 p-3 rounded-md bg-gray-600 border-gray-500 text-gray-200 focus:border-blue-500 focus:ring-blue-500"
        ></textarea>
      </div>
      <button
        type="submit"
        className="mt-4 w-full bg-green-600 hover:bg-green-700 text-white p-3 rounded-md font-semibold transition-colors duration-150 ease-in-out flex items-center justify-center"
      >
        <i className={`fas ${isEditing ? 'fa-save' : 'fa-plus-circle'} mr-2`}></i>
        {isEditing ? 'Guardar Cambios' : 'Añadir Contraseña'}
      </button>
    </form>
  );
}
export default PasswordForm;