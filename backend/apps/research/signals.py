"""
=============================================================================
Research Signals
=============================================================================
"""

from django.db.models.signals import post_save
from django.dispatch import receiver

from .models import Research


@receiver(post_save, sender=Research)
def research_post_save(sender, instance, created, **kwargs):
    """
    Обработка после сохранения исследования.
    """
    if created:
        # Дополнительная логика при создании
        pass
