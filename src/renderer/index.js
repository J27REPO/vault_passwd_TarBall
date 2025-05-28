import React from 'react';
import ReactDOM from 'react-dom/client'; // Asegúrate de usar react-dom/client para React 18+
import App from './App';
import './styles/global.css'; 
// Si decides usar un archivo CSS global para tus estilos base de React (aparte de Tailwind CDN)
// import './globalStyles.css'; // Descomenta y crea este archivo si lo necesitas

const rootElement = document.getElementById('root');
const root = ReactDOM.createRoot(rootElement);

root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);