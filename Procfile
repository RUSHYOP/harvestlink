# Procfile for Heroku/Cloud deployment
web: gunicorn server:app --bind 0.0.0.0:$PORT --workers 4 --timeout 120 --log-level info
