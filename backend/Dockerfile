FROM python:3.12-slim
RUN apt-get update && apt-get upgrade -y && \
    apt-get clean && \
    rm -rf /var/lib/apt/lists/*

# Definimos el directorio de trabajo
WORKDIR /app

# Configuramos las variables de entorno para evitar buffering y evitar escribir en el archivo de código
ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1

#copiamos el archivo de requerimientos y lo instalamos
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

#copiamos el resto del codigo de la aplicacion
COPY . .

#exponemos el puerto 8000
EXPOSE 8000

#ejecutamos el servidor de django
CMD sh -c "python manage.py migrate && python manage.py runserver 0.0.0.0:8000"
