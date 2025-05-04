from flask import Flask
from .core.config import settings
from .api import register_blueprints   # collects blueprints

def create_app() -> Flask:
    app = Flask(__name__)
    app.config.update(**settings.dict())   # inject config
    register_blueprints(app)
    return app

# So `gunicorn app.wsgi:application` works
application = create_app()
