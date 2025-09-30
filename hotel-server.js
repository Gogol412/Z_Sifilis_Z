const http = require('http');
const fs = require('fs');
const path = require('path');
const url = require('url');

// Проверяем наличие sqlite3
let sqlite3;
try {
    sqlite3 = require('sqlite3').verbose();
    console.log('✅ Модуль sqlite3 загружен');
} catch (error) {
    console.log('❌ Модуль sqlite3 не установлен. Запускаем без базы данных...');
    console.log('💡 Для установки выполните: npm install sqlite3');
}

let db = null;

// Пытаемся подключить базу данных только если sqlite3 доступен
if (sqlite3) {
    try {
        // Используем относительный путь
        db = new sqlite3.Database('D:/Z_Sifilis_Z/database.db', (err) => {
            if (err) {
                console.error('❌ Ошибка подключения к БД:', err.message);
                console.log('💡 Создаем временную базу данных в памяти...');
                db = new sqlite3.Database(':memory:'); // Используем базу в памяти
                createDrinksTableIfNotExists();
            } else {
                console.log('✅ Подключен к SQLite базе');
                createDrinksTableIfNotExists();
            }
        });
    } catch (dbError) {
        console.error('❌ Ошибка инициализации БД:', dbError.message);
        db = null;
    }
} else {
    console.log('🚫 Работаем без базы данных');
}

function createDrinksTableIfNotExists() {
    if (!db) return;

    const createTableSQL = `
        CREATE TABLE IF NOT EXISTS drink (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            cost REAL NOT NULL,
            compound TEXT
        )
    `;

    db.run(createTableSQL, (err) => {
        if (err) {
            console.error('❌ Ошибка создания таблицы drink:', err.message);
        } else {
            console.log('✅ Таблица drink создана/проверена');
            insertSampleDrinks();
        }
    });
}

function insertSampleDrinks() {
    if (!db) return;

    db.get('SELECT COUNT(*) as count FROM drink', (err, row) => {
        if (err) {
            console.error('❌ Ошибка проверки данных:', err.message);
        } else if (row.count === 0) {
            console.log('📝 Добавляем тестовые напитки...');
            const sampleDrinks = [
                ['Мохито Люмина', 28.00, 'ром, мята, лайм, сахар, содовая'],
                ['Негрони', 32.00, 'джин, кампари, вермут'],
                ['Маргарита Эстерия', 30.00, 'текила, куантро, лайм'],
                ['Олд Фэшнд', 34.00, 'бурбон, сахар, ангостура'],
                ['Московский Мул', 29.00, 'водка, имбирное пиво, лайм'],
                ['Апероль Шприц', 27.00, 'апероль, просекко, содовая'],
                ['Виски Сауэр', 33.00, 'виски, лимонный сок, сахарный сироп'],
                ['Космополитен', 31.00, 'водка, трипл сек, клюквенный сок, лайм']
            ];

            const insert = db.prepare('INSERT INTO drink (name, cost, compound) VALUES (?, ?, ?)');
            sampleDrinks.forEach(drink => {
                insert.run(drink);
            });
            insert.finalize();
            console.log('✅ Тестовые напитки добавлены');
        } else {
            console.log(`✅ В таблице уже есть ${row.count} напитков`);
        }
    });
}

// Функция для получения напитков (с заглушкой если БД недоступна)
function getDrinks(res) {
    if (!db) {
        // Возвращаем тестовые данные если БД недоступна
        const testDrinks = [
            { id: 1, name: "Мохито Люмина", cost: 28.00, compound: "ром, мята, лайм, сахар, содовая" },
            { id: 2, name: "Негрони", cost: 32.00, compound: "джин, кампари, вермут" },
            { id: 3, name: "Маргарита Эстерия", cost: 30.00, compound: "текила, куантро, лайм" }
        ];
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(testDrinks));
        return;
    }

    const sql = 'SELECT * FROM drink ORDER BY name';
    db.all(sql, [], (err, rows) => {
        if (err) {
            console.error('❌ Ошибка SQL:', err.message);
            res.writeHead(500, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: 'Ошибка базы данных' }));
        } else {
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify(rows));
        }
    });
}

// Функция для поиска напитков
function searchDrinks(query, res) {
    if (!db) {
        // Заглушка для поиска без БД
        getDrinks(res);
        return;
    }

    if (!query) {
        getDrinks(res);
        return;
    }

    const sql = `SELECT * FROM drink 
                 WHERE name LIKE ? OR compound LIKE ? 
                 ORDER BY name`;
    const searchTerm = `%${query}%`;

    db.all(sql, [searchTerm, searchTerm], (err, rows) => {
        if (err) {
            res.writeHead(500, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: err.message }));
        } else {
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify(rows));
        }
    });
}

// Функция для обслуживания файлов
function serveFile(filename, contentType, res) {
    const filePath = path.join(__dirname, filename);

    fs.readFile(filePath, (err, content) => {
        if (err) {
            console.error(`❌ Ошибка чтения файла ${filename}:`, err.message);
            res.writeHead(404);
            res.end('Файл не найден');
        } else {
            res.writeHead(200, { 'Content-Type': contentType });
            res.end(content);
        }
    });
}

// Создаем сервер
const server = http.createServer((req, res) => {
    const parsedUrl = url.parse(req.url, true);
    const pathname = parsedUrl.pathname;

    // CORS headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    // Обработка preflight запросов
    if (req.method === 'OPTIONS') {
        res.writeHead(200);
        res.end();
        return;
    }

    // API для получения напитков
    if (pathname === '/api/drinks' && req.method === 'GET') {
        getDrinks(res);
        return;
    }

    // API для поиска напитков
    if (pathname === '/api/drinks/search' && req.method === 'GET') {
        const query = parsedUrl.query.q;
        searchDrinks(query, res);
        return;
    }

    // Главная страница
    if (pathname === '/' || pathname === '/2str.html') {
        serveFile('2str.html', 'text/html', res);
        return;
    }

    // Страница ассортимента
    if (pathname === '/assortiment.html') {
        serveFile('assortiment.html', 'text/html', res);
        return;
    }

    // 404 для остальных запросов
    res.writeHead(404, { 'Content-Type': 'text/html' });
    res.end('<h1>404 - Страница не найдена</h1>');
});

// Запуск сервера
const PORT = 3000;
server.listen(PORT, () => {
    console.log('='.repeat(50));
    console.log('🚀 СЕРВЕР ОТЕЛЯ ЗАПУЩЕН!');
    console.log('='.repeat(50));
    console.log(`🏨 Главная страница: http://localhost:${PORT}`);
    console.log(`🍸 Ассортимент: http://localhost:${PORT}/assortiment.html`);
    console.log(`📊 API напитков: http://localhost:${PORT}/api/drinks`);
    console.log(`💾 База данных: ${db ? 'подключена' : 'не доступна'}`);
    console.log('='.repeat(50));
});

// Graceful shutdown
process.on('SIGINT', () => {
    console.log('\n🛑 Выключение сервера...');
    if (db) {
        db.close((err) => {
            if (err) {
                console.error('Ошибка закрытия БД:', err.message);
            } else {
                console.log('✅ База данных закрыта');
            }
            process.exit(0);
        });
    } else {
        process.exit(0);
    }
});