# Gestor de Contraseñas Seguro (Vault Passwd) - Aplicación de Escritorio

Bienvenido al repositorio del **Gestor de Contraseñas Seguro**, una aplicación de escritorio para Linux construida con Electron. Esta herramienta te permite gestionar tus credenciales de forma local y segura.

## Características Principales

* **Totalmente Local y Privado:** Tus datos se almacenan cifrados en tu ordenador y nunca se envían a ningún servidor.
* **Cifrado Fuerte:** Utiliza AES-GCM de 256 bits para proteger tu bóveda de contraseñas.
* **Contraseña Maestra Segura:** La clave de cifrado se deriva de tu contraseña maestra mediante PBKDF2.
* **Interfaz Gráfica Independiente:** No depende de un navegador web externo.
* **Gestión Completa:**
    * Añade, visualiza y elimina entradas de contraseñas.
    * Organiza por nombre de sitio/app, nombre de usuario, contraseña y categoría.
    * Incluye notas adicionales para cada entrada.
* **Generador de Contraseñas Seguras.**
* **Copia Fácil al Portapapeles.**
* **Búsqueda Rápida** de entradas.

## Tecnologías Utilizadas

* **Electron:** Para construir la aplicación de escritorio multiplataforma.
* **Node.js:** Para el entorno de ejecución del proceso principal.
* **HTML5, CSS3, JavaScript (ES6+):** Para la interfaz de usuario.
    * **Tailwind CSS** (vía CDN en la versión actual del HTML): Para el diseño de la interfaz.
    * **Web Crypto API:** Para las operaciones de cifrado.

## Cómo Empezar

Tienes dos opciones para usar la aplicación:

**Opción 1: Usar una Release Preconstruida (Recomendado para usuarios finales)**

1.  **Descarga la Última Versión:**
    * Ve a la sección de **[Releases](https://github.com/J27REPO/vault_passwd_TarBall/releases)** de este repositorio.
    * Descarga el archivo `.tar.gz` más reciente para Linux (por ejemplo, `gestor-contrasenas-seguro-v1.0.0.tar.gz`).

2.  **Extrae el Archivo:**
    Abre una terminal, navega al directorio de descarga y ejecuta:
    ```bash
    tar -xzvf nombre-del-archivo-release.tar.gz
    ```
    Esto creará una carpeta con la aplicación lista para usar (ej. `gestor-contrasenas-seguro-linux-unpacked`).

3.  **Ejecuta la Aplicación:**
    Navega dentro de la carpeta extraída y ejecuta el archivo principal de la aplicación:
    ```bash
    cd nombre-de-la-carpeta-extraida/
    ./gestor-contrasenas-seguro # O el nombre del ejecutable que aparezca
    ```

4.  **(Opcional) Crear Acceso Directo en el Escritorio (Linux):**
    Para facilitar el acceso, puedes crear un archivo `.desktop`:
    * Crea un archivo (ej. `gestor-contrasenas-seguro.desktop`) en `~/.local/share/applications/`.
    * Añade el siguiente contenido, **ajustando las rutas en `Exec=` e `Icon=`** a donde extrajiste la aplicación:

        ```ini
        [Desktop Entry]
        Version=1.0
        Name=Gestor de Contraseñas Seguro
        Comment=Gestor de contraseñas local y seguro (App Electron)
        Exec=/ruta/completa/a/la/carpeta_extraida/nombre-del-ejecutable
        Icon=/ruta/completa/a/la/carpeta_extraida/resources/app.asar.unpacked/build/icon.png # Ajusta si es necesario
        Terminal=false
        Type=Application
        Categories=Utility;Security;Office;
        ```
    * Guarda el archivo. La aplicación debería aparecer en tu menú.

**Opción 2: Construir desde la Fuente (Para desarrolladores o si quieres la última versión no empaquetada)**

1.  **Requisitos Previos:**
    * Node.js (incluye npm). Puedes instalarlo desde los repositorios de Arch Linux: `sudo pacman -S nodejs npm`
    * Git (para clonar el repositorio).

2.  **Clona el Repositorio:**
    ```bash
    git clone [https://github.com/tu-usuario/vault_passwd_TarBall.git](https://github.com/tu-usuario/vault_passwd_TarBall.git)
    cd vault_passwd_TarBall
    ```
    *(Reemplaza `tu-usuario` con tu nombre de usuario de GitHub)*

3.  **Instala las Dependencias:**
    ```bash
    npm install
    ```

4.  **Ejecuta en Modo Desarrollo:**
    ```bash
    npm start
    ```
    Esto lanzará la aplicación. La persistencia de datos (contraseña maestra) puede no ser robusta entre sesiones de `npm start`. Para probar la persistencia real, usa una versión empaquetada.

5.  **Construye el Paquete Distribuible (opcional):**
    Si quieres crear tu propio paquete `.tar.gz` (u otros formatos):
    * Asegúrate de tener una carpeta `build` con un archivo `icon.png` (512x512px recomendado) en la raíz del proyecto.
    * Ejecuta:
        ```bash
        npm run dist
        ```
    * Los archivos de salida se encontrarán en la carpeta `dist/`.

## Estructura del Proyecto (Simplificada)

* `package.json`: Define el proyecto, dependencias y scripts.
* `main.js`: Script principal de Electron (proceso principal).
* `preload.js`: Script de precarga para comunicación segura entre procesos.
* `gestor_contrasenas.html`: El archivo HTML que contiene la interfaz de usuario.
* `build/icon.png`: Icono utilizado para la aplicación.

## Contribuciones

¡Las contribuciones son bienvenidas! Si deseas mejorar la aplicación:
* Reporta errores o sugiere características abriendo un "Issue" en este repositorio.
* Si quieres contribuir con código, por favor haz un "Fork" del repositorio y envía un "Pull Request" con tus cambios.

## Licencia

Este proyecto se distribuye bajo la **Licencia MIT**. Ver el archivo `LICENSE` para más detalles.

---

*Si tienes alguna pregunta o problema, no dudes en abrir un "Issue".*
