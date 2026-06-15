@echo off

set PGPASSWORD=admin
psql -U postgres -d postgres -c "DROP DATABASE IF EXISTS tribunal_db;"
psql -U postgres -d postgres -c "CREATE DATABASE tribunal_db;"

cd /d C:\Users\HP\Desktop\tribunal\tribunal_backend
call venv\Scripts\activate

python manage.py migrate