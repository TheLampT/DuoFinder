
DuoFinder - Backend

Este es el backend de DuoFinder, una aplicación para encontrar compañeros de juego de forma casual o competitiva.

A continuación te explicamos cómo podés ejecutar el proyecto desde cero, incluso si nunca programaste antes.

✅ Requisitos previos

Antes de empezar, asegurate de tener instalado:

- Python 3.10 o superior: https://www.python.org/downloads/
- Git (opcional, si vas a clonar el proyecto): https://git-scm.com/downloads

🧱 1. Crear y activar el entorno virtual

Un entorno virtual es un espacio aislado para instalar las librerías del proyecto sin afectar el resto de tu computadora.

En Windows:

Abrí la terminal (PowerShell) y escribí:

    python -m venv env
    .\env\Scripts\activate

Vas a ver que la terminal cambia y aparece (env) al principio: eso indica que el entorno está activado.

📦 2. Instalar dependencias

El proyecto necesita varias librerías para funcionar. Están listadas en el archivo requirements.txt.

Con el entorno virtual activado, ejecutá:

    pip install -r requirements.txt

Eso va a descargar e instalar automáticamente todo lo necesario.

⚙️ 3. Configurar la conexión a la base de datos

En el archivo .env, agregá la URL de conexión a tu base de datos SQL Server. Ejemplo:

    DATABASE_URL=mssql+pyodbc://USUARIO:CONTRASEÑA@localhost:1433/NOMBRE_BASE?driver=ODBC+Driver+17+for+SQL+Server

Cambialo con tus propios datos. Asegurate de tener instalado el ODBC Driver para SQL Server.

▶️ 4. Ejecutar el servidor

Desde la raíz del proyecto, ejecutá:

    uvicorn app.main:app --reload

La API va a quedar disponible en:

    http://localhost:8000

Y podés ver toda la documentación automática en:

    http://localhost:8000/docs

📌 ¿Y ahora qué?

Ya podés probar los endpoints, conectarte con el frontend o seguir desarrollando. Si necesitás ayuda, ¡no dudes en preguntar!
