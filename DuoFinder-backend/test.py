import os
import urllib.parse
from sqlalchemy import create_engine, text
from dotenv import load_dotenv

# Cargar variables del .env
load_dotenv()

# Obtener la DATABASE_URL
raw_url = os.getenv("DATABASE_URL")
print(raw_url)

if raw_url is None:
    print("❌ No se encontró DATABASE_URL en .env")
    exit()

# Si el driver contiene espacios, SQLAlchemy necesita que esté URL-encoded
# Esto lo arreglamos solo si lo escribiste mal, ejemplo: driver=ODBC Driver 17 for SQL Server
if "driver=ODBC Driver 17 for SQL Server" in raw_url:
    raw_url = raw_url.replace("driver=ODBC Driver 17 for SQL Server", "driver=" + urllib.parse.quote_plus("ODBC Driver 17 for SQL Server"))

print("🔌 Conectando a:", raw_url)

# Crear engine
try:
    engine = create_engine(raw_url)
    with engine.connect() as connection:
        result = connection.execute(text("SELECT 1"))
        print("✅ Conexión exitosa:", result.scalar())
except Exception as e:
    print("❌ Error de conexión:", e)
