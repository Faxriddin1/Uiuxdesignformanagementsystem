"""
=============================================================================
JSON Formatter для логирования
=============================================================================
"""

import json
import logging
from datetime import datetime


class JsonFormatter(logging.Formatter):
    """
    Форматтер для структурированного JSON логирования.
    
    Удобен для production, где логи собираются в ELK/Loki/etc.
    """
    
    def format(self, record):
        log_record = {
            'timestamp': datetime.utcnow().isoformat(),
            'level': record.levelname,
            'logger': record.name,
            'message': record.getMessage(),
            'module': record.module,
            'function': record.funcName,
            'line': record.lineno,
        }
        
        # Добавляем exception info если есть
        if record.exc_info:
            log_record['exception'] = self.formatException(record.exc_info)
        
        # Добавляем extra fields
        for key, value in record.__dict__.items():
            if key not in [
                'name', 'msg', 'args', 'created', 'filename', 'funcName',
                'levelname', 'levelno', 'lineno', 'module', 'msecs',
                'pathname', 'process', 'processName', 'relativeCreated',
                'stack_info', 'exc_info', 'exc_text', 'thread', 'threadName',
                'message'
            ]:
                try:
                    json.dumps(value)  # Проверяем сериализуемость
                    log_record[key] = value
                except (TypeError, ValueError):
                    log_record[key] = str(value)
        
        return json.dumps(log_record, ensure_ascii=False)
