#!/usr/bin/env node

/**
 * Скрипт для назначения роли администратора первому пользователю
 * Используется только для тестирования/демонстрации
 */

const fs = require('fs');
const path = require('path');

// Читаем исходный файл index.js
const indexPath = path.join(__dirname, 'src', 'index.js');
let content = fs.readFileSync(indexPath, 'utf8');

// Находим место после создания массива users и добавляем инициализацию админа
const initCode = `
// Инициализация администратора для демонстрации (только для dev!)
const initAdmin = async () => {
  const adminExists = users.some(u => u.email === 'admin@demo.com');
  if (!adminExists) {
    const bcrypt = require('bcryptjs');
    const hash = await bcrypt.hash('admin123', 10);
    users.push({
      id: 'admin-001',
      email: 'admin@demo.com',
      first_name: 'Demo',
      last_name: 'Admin',
      password: hash,
      role: ROLES.ADMIN,
      is_blocked: false,
    });
    // eslint-disable-next-line no-console
    console.log('✅ Admin user created: admin@demo.com / admin123');
  }
};

// Вызываем после запуска сервера
setTimeout(initAdmin, 100);
`;

// Вставляем код перед app.listen
if (!content.includes('initAdmin')) {
  content = content.replace(
    "app.listen(PORT, () => {",
    initCode + "\napp.listen(PORT, () => {"
  );
  
  fs.writeFileSync(indexPath, content, 'utf8');
  console.log('✅ Admin initialization code added to src/index.js');
  console.log('   Admin credentials: admin@demo.com / admin123');
} else {
  console.log('ℹ️  Admin initialization already exists');
}
