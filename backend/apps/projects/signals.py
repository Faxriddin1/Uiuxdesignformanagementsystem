"""
=============================================================================
Project Signals
=============================================================================
"""

from django.db.models.signals import post_save
from django.dispatch import receiver

from .models import Project


@receiver(post_save, sender=Project)
def project_post_save(sender, instance, created, **kwargs):
    """
    Обработка после сохранения проекта.
    """
    if created:
        # Можно добавить дополнительную логику при создании
        pass
