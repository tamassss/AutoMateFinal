# Egy könnyített Python 3.10-es Linux alap
FROM python:3.10-slim

# Szükséges rendszerösszetevők a MySQL-hez (Linux alatt ezek kellenek)
RUN apt-get update && apt-get install -y \
    default-libmysqlclient-dev \
    build-essential \
    pkg-config \
    && rm -rf /var/lib/apt/lists/*

# Munkakönyvtár beállítása a konténeren belül
WORKDIR /app

# Telepítjük a legfontosabb dolgokat (mivel a barátod req.txt-je hibás)
RUN pip install django==4.2.11 djangorestframework mysqlclient django-cors-headers

# Másoljuk a kódodat a konténerbe
COPY . .

# Indítási parancs
CMD ["python", "manage.py", "runserver", "0.0.0.0:8000"]