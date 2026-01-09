# Исправление ошибок TypeScript в src/components

## CreateProjectDialog.tsx

### 1. Замените `required_error` на `message` в zod schema (строки 52, 56):
```typescript
// Было:
ownerId: z.string({
  required_error: 'Выберите владельца проекта',
}),
deadline: z.date({
  required_error: 'Укажите срок завершения проекта',
}),

// Должно быть:
ownerId: z.string({ message: 'Выберите владельца проекта' }),
deadline: z.date({ message: 'Укажите срок завершения проекта' }),
```

### 2. Добавьте 'rnd' и 'it_projects' в enum division (строка 59):
```typescript
// Было:
division: z.enum(['management', 'marketing', 'development', 'support', 'sales']),

// Должно быть:
division: z.enum(['rnd', 'it_projects', 'management', 'marketing', 'development', 'support', 'sales']),
```

### 3. Добавьте type cast для division (строка 83):
```typescript
// Было:
division: currentUser.division,

// Должно быть:
division: currentUser.division as any,
```

### 4. Добавьте `: any` ко всем `{ field }` (строки 137, 155, 177, 192-193, 212, 233, 262, 289):
```typescript
// Было:
render={({ field }) => (

// Должно быть:
render={({ field }: any) => (
```

### 5. Добавьте тип для handleSubmit (строка 132):
```typescript
// Было:
<form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">

// Должно быть:
<form onSubmit={form.handleSubmit(handleSubmit as any)} className="space-y-6">
```

### 6. Исправьте сравнение role (строки 192-193):
```typescript
// Было:
({user.role === 'director' ? 'Руководитель' :
  user.role === 'admin' ? 'Администратор' : 'Куратор'})

// Должно быть:
({user.role === 'management_head' ? 'Руководитель' :
  user.role === 'division_head' ? 'Нач. отдела' : 'Сотрудник'})
```

### 7. Добавьте тип Date для параметра disabled (строка 289):
```typescript
// Было:
disabled={(date) =>

// Должно быть:
disabled={(date: Date) =>
```

---

## CreateExternalPackageDialog.tsx

### 1. Замените `required_error` на `message` в zod schema (строки 53, 57, 59):
```typescript
// Было:
channel: z.enum(['email', 'sed', 'courier', 'other'], {
  required_error: 'Выберите канал отправки',
}),
responsibleId: z.string({
  required_error: 'Выберите ответственного',
}),
division: z.enum(['rnd', 'it_projects'], {
  required_error: 'Выберите отдел',
}),

// Должно быть:
channel: z.enum(['email', 'sed', 'courier', 'other'], { message: 'Выберите канал отправки' }),
responsibleId: z.string({ message: 'Выберите ответственного' }),
division: z.enum(['rnd', 'it_projects'], { message: 'Выберите отдел' }),
```

### 2. Добавьте `: any` ко всем `{ field }` (строки 209, 227, 250, 271, 302, 341, 371, 398, 419, 440):
```typescript
// Было:
render={({ field }) => (

// Должно быть:
render={({ field }: any) => (
```

### 3. Добавьте тип Date для параметра disabled (строка 398):
```typescript
// Было:
disabled={(date) =>

// Должно быть:
disabled={(date: Date) =>
```

---

## Инструкция по применению

Откройте каждый файл и примените изменения вручную, следуя указанным номерам строк.
