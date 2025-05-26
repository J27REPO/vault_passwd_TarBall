// src/renderer/components/PasswordListItem.js
import React, { useState } from 'react';

function PasswordListItem({ entry, onShowError, onDelete, onEdit }) {
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);
  const [copyStatus, setCopyStatus] = useState('');

  const togglePasswordVisibility = () => {
    setIsPasswordVisible(!isPasswordVisible);
  };

  const handleCopyToClipboard = async () => {
    if (window.electronAPI && window.electronAPI.copyToClipboard) {
      const result = await window.electronAPI.copyToClipboard(entry.password);
      if (result.success) {
        setCopyStatus('¡Copiado!');
        setTimeout(() => setCopyStatus(''), 1500);
      } else {
        setCopyStatus('Error al copiar');
        if (onShowError) onShowError(`Error al copiar: ${result.error || 'Error desconocido'}`);
        setTimeout(() => setCopyStatus(''), 2500);
        console.error('Error al copiar:', result.error);
      }
    } else {
      console.warn("electronAPI.copyToClipboard no está disponible. Usando método de fallback.");
      const tempInput = document.createElement("input");
      tempInput.style.position = "absolute";
      tempInput.style.left = "-9999px";
      tempInput.value = entry.password;
      document.body.appendChild(tempInput);
      tempInput.select();
      try {
        document.execCommand('copy');
        setCopyStatus('¡Copiado! (fallback)');
        setTimeout(() => setCopyStatus(''), 1500);
      } catch (err) {
        setCopyStatus('Error (fallback)');
        if (onShowError) onShowError('Error al copiar la contraseña (fallback).');
        setTimeout(() => setCopyStatus(''), 2500);
      }
      document.body.removeChild(tempInput);
    }
  };

  const escapeHtml = (unsafe) => {
    if (unsafe === null || typeof unsafe === 'undefined') return '';
    return unsafe
         .toString()
         .replace(/&/g, "&amp;")
         .replace(/</g, "&lt;")
         .replace(/>/g, "&gt;")
         .replace(/"/g, "&quot;")
         .replace(/'/g, "&#039;");
  };

  const categoryColorClasses = {
    work: 'border-l-blue-500',
    personal: 'border-l-emerald-500',
    social: 'border-l-pink-500',
    finance: 'border-l-amber-500',
    other: 'border-l-gray-500',
  };
  const categoryClass = categoryColorClasses[entry.category] || categoryColorClasses.other;

  return (
    <div className={`password-entry bg-gray-700 p-4 rounded-lg shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center border-l-4 ${categoryClass} mb-3`}>
      <div className="flex-grow mb-3 md:mb-0">
        <h3 className="text-lg font-semibold text-gray-100">{escapeHtml(entry.name)}</h3>
        <p className="text-sm text-gray-300">Usuario: {escapeHtml(entry.username)}</p>
        <p className="text-sm text-gray-400">
          Categoría: {escapeHtml(entry.category.charAt(0).toUpperCase() + entry.category.slice(1))}
        </p>
        {isPasswordVisible && (
          <div className="mt-2">
            <p className="text-sm text-gray-300 break-all">
              Contraseña: <span>{escapeHtml(entry.password)}</span>
            </p>
            {entry.notes && (
              <p className="text-sm text-gray-400 mt-1">
                Notas: {escapeHtml(entry.notes)}
              </p>
            )}
          </div>
        )}
      </div>
      <div className="flex space-x-2 items-center flex-shrink-0">
        <button
          onClick={togglePasswordVisibility}
          title={isPasswordVisible ? "Ocultar Contraseña" : "Mostrar Contraseña"}
          className="text-blue-400 hover:text-blue-300 p-2 rounded"
        >
          <i className={`fas ${isPasswordVisible ? 'fa-eye-slash' : 'fa-eye'}`}></i>
        </button>
        <button
          onClick={handleCopyToClipboard}
          title="Copiar Contraseña"
          className="text-green-400 hover:text-green-300 p-2 rounded relative"
        >
          <i className="fas fa-copy"></i>
          {copyStatus && (
            <span className="absolute -top-8 left-1/2 -translate-x-1/2 whitespace-nowrap bg-gray-900 text-white text-xs px-2 py-1 rounded shadow-lg">
              {copyStatus}
            </span>
          )}
        </button>
        
        {/* Botón de Eliminar IMPLEMENTADO */}
        <button
          onClick={() => {
            if (window.confirm(`¿Estás seguro de que quieres eliminar la entrada para "${entry.name}"?`)) {
              onDelete(entry.id); // Llama a la función onDelete pasada como prop
            }
          }}
          title="Eliminar Entrada"
          className="text-red-400 hover:text-red-300 p-2 rounded"
        >
          <i className="fas fa-trash-alt"></i>
        </button>
        
        {/* Botón de Editar (sigue comentado, para el siguiente paso) */}
        {
        <button
          onClick={() => onEdit(entry)} // onEdit será la prop para iniciar la edición
          title="Editar Entrada"
          className="text-yellow-400 hover:text-yellow-300 p-2 rounded"
        >
          <i className="fas fa-edit"></i>
        </button>
        }
      </div>
    </div>
  );
}

export default PasswordListItem;