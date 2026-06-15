@echo off
start cmd /k "cd /d C:\Users\HP\Desktop\tribunal\tribunal_backend && venv\Scripts\activate && python manage.py runserver"
start cmd /k "cd /d C:\Users\HP\Desktop\tribunal\tribunal_frontend && npm run dev"