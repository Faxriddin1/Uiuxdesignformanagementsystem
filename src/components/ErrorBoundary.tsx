import React, { Component, ReactNode } from 'react';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';
import { Button } from './ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/Card';

/**
 * Props для ErrorBoundary компонента
 */
interface ErrorBoundaryProps {
  /** Дочерние компоненты для обёртывания */
  children: ReactNode;
  /** Кастомный UI для отображения ошибки */
  fallback?: ReactNode;
  /** Callback при возникновении ошибки */
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void;
  /** Показывать детали ошибки (только для dev) */
  showDetails?: boolean;
}

/**
 * Состояние ErrorBoundary
 */
interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: React.ErrorInfo | null;
}

/**
 * Error Boundary - ловит JavaScript ошибки в дереве компонентов
 * 
 * @description
 * React Error Boundary для graceful error handling.
 * Ловит ошибки в render, lifecycle методах и конструкторах дочерних компонентов.
 * НЕ ловит ошибки в event handlers, async коде, SSR и в самом Error Boundary.
 * 
 * @example
 * ```tsx
 * // Обёртка всего приложения
 * <ErrorBoundary>
 *   <App />
 * </ErrorBoundary>
 * 
 * // Обёртка отдельной секции с кастомным fallback
 * <ErrorBoundary fallback={<p>Ошибка загрузки виджета</p>}>
 *   <DashboardWidget />
 * </ErrorBoundary>
 * 
 * // С логированием в Sentry
 * <ErrorBoundary onError={(error) => Sentry.captureException(error)}>
 *   <App />
 * </ErrorBoundary>
 * ```
 */
export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
  }

  /**
   * Вызывается когда потомок выбрасывает ошибку
   */
  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    return { hasError: true, error };
  }

  /**
   * Вызывается после того, как ошибка была поймана
   * Используется для логирования
   */
  componentDidCatch(error: Error, errorInfo: React.ErrorInfo): void {
    this.setState({ errorInfo });

    // Вызываем пользовательский обработчик если есть
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }

    // В production можно отправлять в Sentry/LogRocket/etc
    if (process.env.NODE_ENV === 'production') {
      console.error('Error caught by ErrorBoundary:', error);
      // Пример: Sentry.captureException(error, { extra: errorInfo });
    } else {
      console.error('ErrorBoundary caught an error:', error, errorInfo);
    }
  }

  /**
   * Сбросить состояние ошибки и попробовать снова
   */
  handleRetry = (): void => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    });
  };

  /**
   * Перейти на главную страницу
   */
  handleGoHome = (): void => {
    window.location.href = '/';
  };

  /**
   * Перезагрузить страницу
   */
  handleReload = (): void => {
    window.location.reload();
  };

  render(): ReactNode {
    const { hasError, error, errorInfo } = this.state;
    const { children, fallback, showDetails } = this.props;

    if (hasError) {
      // Кастомный fallback UI
      if (fallback) {
        return fallback;
      }

      // Дефолтный UI ошибки
      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
          <Card className="max-w-lg w-full shadow-lg">
            <CardHeader className="text-center">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-red-100">
                <AlertTriangle className="h-8 w-8 text-red-600" />
              </div>
              <CardTitle className="text-xl text-gray-900">
                Что-то пошло не так
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-center text-gray-600">
                Произошла непредвиденная ошибка. Попробуйте перезагрузить страницу
                или вернуться на главную.
              </p>

              {/* Детали ошибки (только для разработки) */}
              {(showDetails || process.env.NODE_ENV === 'development') && error && (
                <details className="mt-4">
                  <summary className="cursor-pointer text-sm font-medium text-gray-500 hover:text-gray-700">
                    Техническая информация
                  </summary>
                  <div className="mt-2 rounded-md bg-gray-100 p-3">
                    <p className="text-sm font-mono text-red-600 break-all">
                      {error.name}: {error.message}
                    </p>
                    {errorInfo?.componentStack && (
                      <pre className="mt-2 text-xs text-gray-500 overflow-auto max-h-48">
                        {errorInfo.componentStack}
                      </pre>
                    )}
                  </div>
                </details>
              )}

              {/* Кнопки действий */}
              <div className="flex flex-col sm:flex-row gap-3 pt-4">
                <Button
                  onClick={this.handleRetry}
                  variant="outline"
                  className="flex-1"
                >
                  <RefreshCw className="mr-2 h-4 w-4" />
                  Попробовать снова
                </Button>
                <Button
                  onClick={this.handleGoHome}
                  className="flex-1"
                >
                  <Home className="mr-2 h-4 w-4" />
                  На главную
                </Button>
              </div>

              <p className="text-center text-xs text-gray-400 pt-2">
                Если ошибка повторяется, обратитесь в техподдержку
              </p>
            </CardContent>
          </Card>
        </div>
      );
    }

    return children;
  }
}

/**
 * Hook-based Error Boundary wrapper для использования с функциональными компонентами
 * 
 * @example
 * ```tsx
 * function Dashboard() {
 *   return (
 *     <ErrorBoundaryWrapper>
 *       <DashboardContent />
 *     </ErrorBoundaryWrapper>
 *   );
 * }
 * ```
 */
export const ErrorBoundaryWrapper: React.FC<ErrorBoundaryProps> = (props) => {
  return <ErrorBoundary {...props} />;
};

export default ErrorBoundary;
