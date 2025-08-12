# DuoFinder - Frontend

[![Licencia](https://img.shields.io/badge/Licencia-MIT-blue)](https://opensource.org/licenses/MIT)

<p align="center">
  <img src="public/logo.png" alt="Logo de DuoFinder" width="200">
</p>

DuoFinder es una aplicación web moderna para conectar personas con intereses similares. La aplicación permite a los usuarios deslizar tarjetas de perfil (like/dislike), y cuando hay un match, pueden iniciar una conversación y jugar juegos interactivos. Este repositorio contiene el frontend de la aplicación, construido con Next.js.

## Características Principales

- 🎴 **Interfaz de Swipe**: Sistema de tarjetas deslizables estilo Tinder
- 👤 **Perfiles de Usuario**: Muestra información detallada de cada perfil
- ❤️ **Acciones Rápidas**: Botones de like/dislike para fácil interacción
- 📱 **Diseño Responsive**: Funciona perfectamente en móviles y desktop
- ⚡ **Rendimiento Optimizado**: Carga rápida y experiencia fluida

## Tecnologías Utilizadas

- [Next.js](https://nextjs.org/) - Framework de React para renderizado del lado del servidor
- [TypeScript](https://www.typescriptlang.org/) - JavaScript con sintaxis tipada
- [React](https://reactjs.org/) - Biblioteca para interfaces de usuario
- [CSS Modules](https://github.com/css-modules/css-modules) - Para estilos encapsulados
- [ESLint](https://eslint.org/) - Linter para mantener calidad de código
- [Vercel](https://vercel.com/) - Plataforma de despliegue

## Instalación y Configuración

Sigue estos pasos para instalar y ejecutar el proyecto en tu máquina local:

1. **Clonar el repositorio**:
   ```bash
   git clone https://github.com/TheLampT/DuoFinder.git
   cd DuoFinder-frontend

2. **Instalar dependencias**:
    ```bash
    npm install

2. **Configurar variables de entorno**:
Crea un archivo .env.local en la raíz del proyecto:
    ```env
    Configuración básica
    PORT=3000

4. **Ejecutar el servidor de desarrollo**:
    ```bash
    npm run dev

5. **Abrir en el navegador**:
Visita http://localhost:3000 para ver la aplicación.

# Estructura del Proyecto
    ```
    DuoFinder-frontend/
    ├── app/                  # Rutas de la aplicación (Next.js App Router)
    │   ├── layout.tsx        # Layout principal
    │   └── page.tsx          # Página principal (swipe)
    ├── components/           # Componentes reutilizables
    │   ├── ActionButtons.tsx # Botones de like/dislike
    │   └── SwipeCard.tsx     # Tarjeta de perfil para deslizar
    ├── lib/                  # Utilidades y datos mock
    │   └── mockData.ts       # Datos de perfiles de ejemplo
    ├── public/               # Archivos estáticos
    │   └── profiles/         # Imágenes de perfiles
    ├── styles/               # Hojas de estilo
    │   ├── globals.css       # Estilos globales
    │   └── SwipeCard.module.css # Estilos para la tarjeta
    ├── .eslintrc.json        # Configuración de ESLint
    ├── .gitignore            # Archivos ignorados por Git
    ├── next.config.js        # Configuración de Next.js
    ├── package.json          # Dependencias y scripts
    ├── README.md             # Este archivo
    └── tsconfig.json         # Configuración de TypeScript

# Capturas de Pantalla
https://public/screenshots/swipe-screen.png
Interfaz principal para descubrir personas

# Contacto
Para consultas sobre el proyecto, contacta a:

Martin Curzel - [martin.curzel@gmail.com]