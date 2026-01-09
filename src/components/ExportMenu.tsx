/**
 * Меню экспорта и печати
 * Позволяет экспортировать задачи/проекты в различных форматах
 */

import { Download, Printer, FileText, Table, FileSpreadsheet, ChevronDown } from 'lucide-react';
import { useState } from 'react';
import { Task, Project, Research, User } from '../types';
import { useUsers, getUsersSync } from '../hooks/useUsers';
import { getTaskStatusText } from '../utils/statusHelpers';
import { getUserRoleLabel } from '../utils/helpers';

interface ExportMenuProps {
  data: Task[] | Project[] | Research[];
  type: 'tasks' | 'projects' | 'researches';
  currentUser: User;
}

export function ExportMenu({ data, type, currentUser }: ExportMenuProps) {
  const [isOpen, setIsOpen] = useState(false);
  const users = getUsersSync();

  /**
   * Экспорт в CSV
   */
  const exportToCSV = () => {
    let csvContent = '';
    
    if (type === 'tasks') {
      const tasks = data as Task[];
      csvContent = 'ID,Название,Описание,Тип,Статус,Исполнитель,Дедлайн,Создано\n';
      
      tasks.forEach(task => {
        const assignee = users.find(u => u.id === task.assigneeId);
        csvContent += [
          task.id,
          `"${task.title.replace(/"/g, '""')}"`,
          `"${task.description.replace(/"/g, '""')}"`,
          task.taskType,
          getTaskStatusText(task.status, task.taskType),
          assignee?.name || 'Неизвестно',
          task.deadline.toLocaleDateString('ru-RU'),
          task.createdAt.toLocaleDateString('ru-RU')
        ].join(',') + '\n';
      });
    } else if (type === 'projects') {
      const projects = data as Project[];
      csvContent = 'ID,Название,Описание,Статус,Ответственный,Создано\n';
      
      projects.forEach(project => {
        const responsible = users.find(u => u.id === project.responsibleId);
        csvContent += [
          project.id,
          `"${project.title.replace(/"/g, '""')}"`,
          `"${project.description.replace(/"/g, '""')}"`,
          project.status,
          responsible?.name || 'Неизвестно',
          project.createdAt.toLocaleDateString('ru-RU')
        ].join(',') + '\n';
      });
    } else if (type === 'researches') {
      const researches = data as Research[];
      csvContent = 'ID,Название,Резюме,Статус,Автор,Создано\n';
      
      researches.forEach(research => {
        const author = users.find(u => u.id === research.authorId);
        csvContent += [
          research.id,
          `"${research.title.replace(/"/g, '""')}"`,
          `"${research.summary.replace(/"/g, '""')}"`,
          research.status,
          author?.name || 'Неизвестно',
          research.createdAt.toLocaleDateString('ru-RU')
        ].join(',') + '\n';
      });
    }

    downloadFile(csvContent, `${type}-${Date.now()}.csv`, 'text/csv;charset=utf-8;');
    setIsOpen(false);
  };

  /**
   * Экспорт в JSON
   */
  const exportToJSON = () => {
    const jsonContent = JSON.stringify(data, null, 2);
    downloadFile(jsonContent, `${type}-${Date.now()}.json`, 'application/json');
    setIsOpen(false);
  };

  /**
   * Экспорт в Excel (простой формат)
   */
  const exportToExcel = () => {
    // Простой XML формат для Excel
    let xmlContent = '<?xml version="1.0"?>\n';
    xmlContent += '<?mso-application progid="Excel.Sheet"?>\n';
    xmlContent += '<Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet"\n';
    xmlContent += ' xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet">\n';
    xmlContent += '<Worksheet ss:Name="' + type + '">\n';
    xmlContent += '<Table>\n';

    if (type === 'tasks') {
      const tasks = data as Task[];
      xmlContent += '<Row>\n';
      ['ID', 'Название', 'Тип', 'Статус', 'Исполнитель', 'Дедлайн'].forEach(header => {
        xmlContent += `<Cell><Data ss:Type="String">${header}</Data></Cell>\n`;
      });
      xmlContent += '</Row>\n';

      tasks.forEach(task => {
        const assignee = users.find(u => u.id === task.assigneeId);
        xmlContent += '<Row>\n';
        [
          task.id,
          task.title,
          task.taskType,
          getTaskStatusText(task.status, task.taskType),
          assignee?.name || 'Неизвестно',
          task.deadline.toLocaleDateString('ru-RU')
        ].forEach(value => {
          xmlContent += `<Cell><Data ss:Type="String">${String(value).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')}</Data></Cell>\n`;
        });
        xmlContent += '</Row>\n';
      });
    }

    xmlContent += '</Table>\n';
    xmlContent += '</Worksheet>\n';
    xmlContent += '</Workbook>';

    downloadFile(xmlContent, `${type}-${Date.now()}.xls`, 'application/vnd.ms-excel');
    setIsOpen(false);
  };

  /**
   * Печать
   */
  const handlePrint = () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    let htmlContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <title>Печать - ${type}</title>
          <style>
            body {
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
              padding: 20px;
              color: #333;
            }
            h1 {
              font-size: 24px;
              margin-bottom: 20px;
              border-bottom: 2px solid #3B82F6;
              padding-bottom: 10px;
            }
            table {
              width: 100%;
              border-collapse: collapse;
              margin-top: 20px;
            }
            th, td {
              border: 1px solid #ddd;
              padding: 12px;
              text-align: left;
            }
            th {
              background-color: #f3f4f6;
              font-weight: 600;
            }
            tr:nth-child(even) {
              background-color: #f9fafb;
            }
            .footer {
              margin-top: 30px;
              padding-top: 20px;
              border-top: 1px solid #ddd;
              font-size: 12px;
              color: #666;
            }
            @media print {
              body { padding: 0; }
              .no-print { display: none; }
            }
          </style>
        </head>
        <body>
          <h1>Реестр ${type === 'tasks' ? 'задач' : type === 'projects' ? 'проектов' : 'исследований'}</h1>
          <table>
    `;

    if (type === 'tasks') {
      const tasks = data as Task[];
      htmlContent += '<thead><tr><th>№</th><th>Название</th><th>Тип</th><th>Статус</th><th>Исполнитель</th><th>Дедлайн</th></tr></thead><tbody>';
      
      tasks.forEach((task, index) => {
        const assignee = users.find(u => u.id === task.assigneeId);
        htmlContent += `
          <tr>
            <td>${index + 1}</td>
            <td>${task.title}</td>
            <td>${task.taskType}</td>
            <td>${getTaskStatusText(task.status, task.taskType)}</td>
            <td>${assignee?.name || 'Неизвестно'}</td>
            <td>${task.deadline.toLocaleDateString('ru-RU')}</td>
          </tr>
        `;
      });
    } else if (type === 'projects') {
      const projects = data as Project[];
      htmlContent += '<thead><tr><th>№</th><th>Название</th><th>Статус</th><th>Ответственный</th><th>Создано</th></tr></thead><tbody>';
      
      projects.forEach((project, index) => {
        const responsible = users.find(u => u.id === project.responsibleId);
        htmlContent += `
          <tr>
            <td>${index + 1}</td>
            <td>${project.title}</td>
            <td>${project.status}</td>
            <td>${responsible?.name || 'Неизвестно'}</td>
            <td>${project.createdAt.toLocaleDateString('ru-RU')}</td>
          </tr>
        `;
      });
    }

    htmlContent += `
          </tbody>
        </table>
        <div class="footer">
          <p>Экспортировано: ${new Date().toLocaleString('ru-RU')}</p>
          <p>Пользователь: ${currentUser.name} (${getUserRoleLabel(currentUser.role)})</p>
          <p>Всего записей: ${data.length}</p>
        </div>
        <script>
          window.onload = () => {
            window.print();
          };
        </script>
      </body>
      </html>
    `;

    printWindow.document.write(htmlContent);
    printWindow.document.close();
    setIsOpen(false);
  };

  /**
   * Вспомогательная функция для скачивания файла
   */
  const downloadFile = (content: string, fileName: string, mimeType: string) => {
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors text-gray-700"
      >
        <Download className="w-4 h-4" />
        <span>Экспорт</span>
        <ChevronDown className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <>
          {/* Overlay для закрытия */}
          <div
            className="fixed inset-0 z-40"
            onClick={() => setIsOpen(false)}
          />

          {/* Меню */}
          <div className="absolute right-0 mt-2 w-56 bg-white border border-gray-200 rounded-lg shadow-xl z-50 overflow-hidden">
            <button
              onClick={exportToCSV}
              className="w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition-colors text-left"
            >
              <FileText className="w-4 h-4 text-gray-600" />
              <div>
                <p className="text-sm text-gray-900">Экспорт в CSV</p>
                <p className="text-xs text-gray-500">Для Excel, таблиц</p>
              </div>
            </button>

            <button
              onClick={exportToExcel}
              className="w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition-colors text-left border-t border-gray-100"
            >
              <FileSpreadsheet className="w-4 h-4 text-green-600" />
              <div>
                <p className="text-sm text-gray-900">Экспорт в Excel</p>
                <p className="text-xs text-gray-500">Формат .xls</p>
              </div>
            </button>

            <button
              onClick={exportToJSON}
              className="w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition-colors text-left border-t border-gray-100"
            >
              <Table className="w-4 h-4 text-blue-600" />
              <div>
                <p className="text-sm text-gray-900">Экспорт в JSON</p>
                <p className="text-xs text-gray-500">Для разработчиков</p>
              </div>
            </button>

            <div className="border-t border-gray-200 mt-1" />

            <button
              onClick={handlePrint}
              className="w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition-colors text-left"
            >
              <Printer className="w-4 h-4 text-gray-600" />
              <div>
                <p className="text-sm text-gray-900">Печать</p>
                <p className="text-xs text-gray-500">Открыть диалог печати</p>
              </div>
            </button>
          </div>
        </>
      )}
    </div>
  );
}
