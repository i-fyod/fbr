#!/usr/bin/env node

/**
 * Тестовый скрипт для проверки системы ролей
 * Запуск: node test-roles.js
 */

const http = require('http');

const PORT = process.env.PORT || 4101;
const BASE_URL = `http://localhost:${PORT}`;

function request(method, path, body = null, token = null) {
  return new Promise((resolve, reject) => {
    const url = new URL(path, BASE_URL);
    const options = {
      hostname: url.hostname,
      port: url.port,
      path: url.pathname,
      method,
      headers: {
        'Content-Type': 'application/json',
      },
    };

    if (token) {
      options.headers['Authorization'] = `Bearer ${token}`;
    }

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        resolve({
          status: res.statusCode,
          headers: res.headers,
          body: data ? JSON.parse(data) : null,
        });
      });
    });

    req.on('error', reject);

    if (body) {
      req.write(JSON.stringify(body));
    }
    req.end();
  });
}

async function runTests() {
  console.log('🧪 Тестирование системы ролей\n');

  // 1. Регистрация пользователей с разными ролями
  console.log('1️⃣ Регистрация пользователей...');
  
  const adminReg = await request('POST', '/api/auth/register', {
    email: 'admin@test.com',
    first_name: 'Admin',
    last_name: 'Test',
    password: 'admin123'
  });
  console.log(`   Admin registered: ${adminReg.status === 201 ? '✅' : '❌'} (role: ${adminReg.body?.role})`);

  const sellerReg = await request('POST', '/api/auth/register', {
    email: 'seller@test.com',
    first_name: 'Seller',
    last_name: 'Test',
    password: 'seller123'
  });
  console.log(`   Seller registered: ${sellerReg.status === 201 ? '✅' : '❌'} (role: ${sellerReg.body?.role})`);

  const userReg = await request('POST', '/api/auth/register', {
    email: 'user@test.com',
    first_name: 'User',
    last_name: 'Test',
    password: 'user123'
  });
  console.log(`   User registered: ${userReg.status === 201 ? '✅' : '❌'} (role: ${userReg.body?.role})`);

  // 2. Назначение ролей администратором
  console.log('\n2️⃣ Назначение ролей администратором...');
  
  const adminLogin = await request('POST', '/api/auth/login', {
    email: 'admin@test.com',
    password: 'admin123'
  });
  const adminToken = adminLogin.body?.accessToken;
  console.log(`   Admin logged in: ${adminLogin.status === 200 ? '✅' : '❌'}`);

  // Получаем ID продавца и пользователя
  const sellerId = sellerReg.body?.id;
  const userId = userReg.body?.id;

  // Назначаем роль seller
  const updateSeller = await request('PUT', `/api/users/${sellerId}`, {
    role: 'seller'
  }, adminToken);
  console.log(`   Set seller role: ${updateSeller.status === 200 ? '✅' : '❌'} (new role: ${updateSeller.body?.role})`);

  // 3. Тестирование прав доступа к продуктам
  console.log('\n3️⃣ Тестирование прав доступа к /api/products...');

  // GET /api/products - доступно всем
  const getProducts = await request('GET', '/api/products');
  console.log(`   GET /api/products (guest): ${getProducts.status === 200 ? '✅' : '❌'}`);

  // POST /api/products - только seller/admin
  const userLogin = await request('POST', '/api/auth/login', {
    email: 'user@test.com',
    password: 'user123'
  });
  const userToken = userLogin.body?.accessToken;

  const userCreateProduct = await request('POST', '/api/products', {
    title: 'Test Product',
    category: 'Test',
    description: 'Test',
    price: 100
  }, userToken);
  console.log(`   POST /api/products (user): ${userCreateProduct.status === 403 ? '✅ (403 Forbidden)' : '❌'}`);

  const sellerLogin = await request('POST', '/api/auth/login', {
    email: 'seller@test.com',
    password: 'seller123'
  });
  const sellerToken = sellerLogin.body?.accessToken;

  const sellerCreateProduct = await request('POST', '/api/products', {
    title: 'Seller Product',
    category: 'Test',
    description: 'Test',
    price: 200
  }, sellerToken);
  console.log(`   POST /api/products (seller): ${sellerCreateProduct.status === 201 ? '✅' : '❌'}`);

  // DELETE /api/products - только admin
  const productId = sellerCreateProduct.body?.id;
  const sellerDeleteProduct = await request('DELETE', `/api/products/${productId}`, null, sellerToken);
  console.log(`   DELETE /api/products (seller): ${sellerDeleteProduct.status === 403 ? '✅ (403 Forbidden)' : '❌'}`);

  const adminDeleteProduct = await request('DELETE', `/api/products/${productId}`, null, adminToken);
  console.log(`   DELETE /api/products (admin): ${adminDeleteProduct.status === 204 ? '✅' : '❌'}`);

  // 4. Тестирование прав доступа к пользователям
  console.log('\n4️⃣ Тестирование прав доступа к /api/users...');

  const userGetUsers = await request('GET', '/api/users', null, userToken);
  console.log(`   GET /api/users (user): ${userGetUsers.status === 403 ? '✅ (403 Forbidden)' : '❌'}`);

  const adminGetUsers = await request('GET', '/api/users', null, adminToken);
  console.log(`   GET /api/users (admin): ${adminGetUsers.status === 200 ? '✅' : '❌'}`);

  // Блокировка пользователя
  const adminBlockUser = await request('DELETE', `/api/users/${userId}`, null, adminToken);
  console.log(`   DELETE /api/users/:id (admin block): ${adminBlockUser.status === 200 ? '✅' : '❌'} (is_blocked: ${adminBlockUser.body?.is_blocked})`);

  // Проверка что заблокированный пользователь не может войти
  const blockedLogin = await request('POST', '/api/auth/login', {
    email: 'user@test.com',
    password: 'user123'
  });
  console.log(`   Login blocked user: ${blockedLogin.status === 403 ? '✅ (403 Forbidden)' : '❌'}`);

  console.log('\n✅ Тестирование завершено!\n');
}

runTests().catch(console.error);
