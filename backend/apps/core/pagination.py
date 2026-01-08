"""
=============================================================================
Custom Pagination Classes
=============================================================================

Стандартная пагинация для всего API.
"""

from rest_framework.pagination import PageNumberPagination
from rest_framework.response import Response


class StandardPagination(PageNumberPagination):
    """
    Стандартная пагинация с метаданными.
    
    Параметры запроса:
    - page: номер страницы (по умолчанию 1)
    - page_size: размер страницы (по умолчанию 20, максимум 100)
    
    Формат ответа:
    {
        "count": 100,
        "page": 1,
        "page_size": 20,
        "total_pages": 5,
        "next": "http://api/items/?page=2",
        "previous": null,
        "results": [...]
    }
    """
    
    page_size = 20
    page_size_query_param = 'page_size'
    max_page_size = 100
    
    def get_paginated_response(self, data):
        return Response({
            'count': self.page.paginator.count,
            'page': self.page.number,
            'page_size': self.get_page_size(self.request),
            'total_pages': self.page.paginator.num_pages,
            'next': self.get_next_link(),
            'previous': self.get_previous_link(),
            'results': data,
        })


class LargePagination(StandardPagination):
    """Пагинация для больших списков (например, логи)."""
    
    page_size = 50
    max_page_size = 500


class SmallPagination(StandardPagination):
    """Пагинация для небольших списков."""
    
    page_size = 10
    max_page_size = 50
