# celery.py

import os

from celery import Celery

# Set the default Django settings module for the 'celery' program.
os.environ.setdefault("DJANGO_SETTINGS_MODULE", "app.settings")

# Create the Celery app instance
app = Celery("nextdjango")

# Load the Celery configuration from Django settings
app.config_from_object("django.conf:settings", namespace="CELERY")

# Discover tasks in the project
app.autodiscover_tasks()
