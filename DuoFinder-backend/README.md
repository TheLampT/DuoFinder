
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


Para MacOS xd

¡Te lo dejo paso a paso para **macOS**! 👇

# 0) Antes de empezar

* macOS actualizado (Intel o Apple Silicon).
* Terminal: **zsh** (la que viene por defecto).

# 1) Instalar herramientas base

```bash
# 1.1 Homebrew (si no lo tenés)
#/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"

# 1.2 Python, Git
brew install python@3.11 git

# 1.3 ODBC + driver SQL Server (requeridos por pyodbc)
brew install unixodbc
brew tap microsoft/mssql-release
brew update
brew install msodbcsql18 mssql-tools18
```

> Tip: si al instalar el driver te pide aceptar la licencia, escribí `YES`.

# 2) Crear y activar el entorno virtual

```bash
cd /ruta/a/tu/proyecto
python3 -m venv .venv
source .venv/bin/activate
# verás (.venv) al inicio de tu prompt
```

# 3) Instalar dependencias del proyecto

```bash
pip install --upgrade pip
pip install -r requirements.txt
# si hace falta:
# pip install fastapi uvicorn "python-jose[cryptography]" passlib[bcrypt] sqlalchemy pyodbc python-dotenv
```

# 4) Configurar la conexión a SQL Server

En tu archivo **.env** (en la raíz del proyecto), poné algo así:

### Opción A: te conectás a un SQL Server remoto / Azure SQL

```
DATABASE_URL=mssql+pyodbc://USUARIO:CONTRASENA@HOST:1433/NOMBRE_BASE?driver=ODBC+Driver+18+for+SQL+Server&Encrypt=yes&TrustServerCertificate=yes
```

### Opción B: levantás SQL Server en Docker (local en tu Mac)

```bash
docker run -e "ACCEPT_EULA=Y" -e "MSSQL_SA_PASSWORD=YourStrong!Passw0rd" \
  -p 1433:1433 --name mssql -d mcr.microsoft.com/mssql/server:2022-latest
```

`.env`:

```
DATABASE_URL=mssql+pyodbc://sa:YourStrong!Passw0rd@localhost:1433/master?driver=ODBC+Driver+18+for+SQL+Server&Encrypt=yes&TrustServerCertificate=yes
```

> Notas:
>
> * En macOS el nombre del driver suele ser **`ODBC Driver 18 for SQL Server`** (o 17 si instalaste ese).
> * Si te da error “**Data source name not found**”, verificá el nombre del driver con:
>
>   ```bash
>   odbcinst -q -d -n "ODBC Driver 18 for SQL Server"
>   ```
>
>   Si no aparece, probá con `"ODBC Driver 17 for SQL Server"` o reinstalá msodbcsql.

# 5) Ejecutar el servidor FastAPI

Desde la carpeta del proyecto (con el venv activado):

```bash
uvicorn app.main:app --reload
```

Abrí:

* API: [http://localhost:8000](http://localhost:8000)
* Docs: [http://localhost:8000/docs](http://localhost:8000/docs)

# 6) Problemas comunes (y soluciones rápidas)

* **`pyodbc` no compila/instala**: asegurate de tener `unixodbc` (ya lo instalamos con brew).
* **Driver no encontrado**: revisá el nombre exacto del driver (17/18) y la mayúscula/minúscula en la query `driver=...`.
* **SSL/Encrypt** en Azure SQL: usá `Encrypt=yes&TrustServerCertificate=yes` (o configurá un CA válido).
* **Apple Silicon (M1/M2)**: todo lo de arriba funciona; Homebrew instala binarios nativos.

# 7) (Opcional) Scripts útiles

Agregá en `package.json` (si lo manejás con npm) o en `Makefile`:

```bash
# Makefile
run:
\tuvicorn app.main:app --reload

lint:
\tflake8 app

test:
\tpytest
```

Si querés, te paso un **.env de ejemplo completo** (incluyendo `SECRET_KEY`) y/o te dejo un **docker-compose** con el servicio de SQL Server para que no tengas que instalar nada extra en tu Mac.
