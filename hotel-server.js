const http = require('http');
const fs = require('fs');
const path = require('path');
const url = require('url');

let sqlite3;
try {
    sqlite3 = require('sqlite3').verbose();
    console.log('✅ Модуль sqlite3 загружен');
} catch (error) {
    console.log('❌ Модуль sqlite3 не установлен. Запускаем без базы данных...');
    console.log('💡 Для установки выполните: npm install sqlite3');
}

let db = null;

if (sqlite3) {
    try {
        db = new sqlite3.Database('D:/Z_Sifilis_Z/Main/database.db', (err) => {
            if (err) {
                console.error('❌ Ошибка подключения к БД:', err.message);
            } else {
                console.log('✅ Подключен к SQLite базе');
            }
        });

        if (db) {
            db.get("SELECT name FROM sqlite_master WHERE type='table' AND name='Bookings'", (err, row) => {
                if (err) {
                    console.error('❌ Ошибка проверки таблицы Bookings:', err.message);
                } else if (!row) {
                    console.error('❌ Таблица Bookings не существует!');
                } else {
                    console.log('✅ Таблица Bookings доступна');
                }
            });
        }
    } catch (dbError) {
        console.error('❌ Ошибка инициализации БД:', dbError.message);
        db = null;
    }
} else {
    console.log('🚫 Работаем без базы данных');
}

// Функция для получения номеров с информацией о типах
function getRooms(res) {
    if (!db) {
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'База данных не доступна' }));
        return;
    }

    const sql = `
        SELECT 
            r.id,
            r.room_number,
            r.current_price,
            rt.name as room_type_name,
            rt.capacity,
            rt.base_price as type_base_price
        FROM Room r
        JOIN Room_types rt ON r.room_type_id = rt.id
        ORDER BY r.room_number
    `;

    db.all(sql, [], (err, rows) => {
        if (err) {
            console.error('Ошибка SQL при запросе номеров:', err.message);
            res.writeHead(500, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: 'Ошибка базы данных' }));
        } else {
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify(rows));
        }
    });
}

// Функция для получения услуг (примерные данные)
function getServices(res) {
    const services = [
        { id: 1, name: "Трансфер из аэропорта", description: "Комфортабельный трансфер до отеля", price: 1500 },
        { id: 2, name: "Прачечная", description: "Стирка и глажка одежды", price: 800 },
        { id: 3, name: "Услуги няни", description: "Присмотр за детьми", price: 1200 }
    ];
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(services));
}

// Функция для получения вариантов питания (примерные данные)
function getMeals(res) {
    const meals = [
        { id: 1, name: "Завтрак шведский стол", description: "Полноценный завтрак", price: 1200 },
        { id: 2, name: "Полупансион", description: "Завтрак + ужин", price: 2500 },
        { id: 3, name: "Полный пансион", description: "Завтрак + обед + ужин", price: 3800 }
    ];
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(meals));
}

// Функция для получения SPA-услуг (примерные данные)
function getSpaServices(res) {
    const spaServices = [
        { id: 1, name: "Массаж расслабляющий", description: "Расслабляющий массаж всего тела", price: 3000, duration: 60 },
        { id: 2, name: "SPA-процедура", description: "Комплексная SPA-процедура", price: 5000, duration: 90 },
        { id: 3, name: "Сауна", description: "Посещение сауны с бассейном", price: 2000, duration: 120 }
    ];
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(spaServices));
}

// Остальные существующие функции (getDB, searchDrinks, searchRoom) остаются без изменений
function getDB(res) {
    if (!db) {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify([]));
        return;
    }

    const sql = 'SELECT * FROM drink ORDER BY name';
    db.all(sql, [], (err, rows) => {
        if (err) {
            console.error('Ошибка SQL:', err.message);
            res.writeHead(500, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: 'Ошибка базы данных' }));
        } else {
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify(rows));
        }
    });
}

function searchDrinks(query, res) {
    if (!db) {
        getDB(res);
        return;
    }

    if (!query) {
        getDB(res);
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

function searchRoom(query, res) {
    if (!db) {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify([]));
        return;
    }

    if (!query) {
        const sql = `SELECT 
            r.id,
            r.room_number,
            r.current_price,
            rt.name as room_type_name,
            rt.capacity
        FROM Room r
        JOIN Room_types rt ON r.room_type_id = rt.id
        ORDER BY r.room_number`;

        db.all(sql, [], (err, rows) => {
            if (err) {
                res.writeHead(500, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ error: err.message }));
            } else {
                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify(rows));
            }
        });
        return;
    }

    const sql = `SELECT 
        r.id,
        r.room_number,
        r.current_price,
        rt.name as room_type_name,
        rt.capacity
    FROM Room r
    JOIN Room_types rt ON r.room_type_id = rt.id
    WHERE r.room_number LIKE ? OR rt.name LIKE ? 
    ORDER BY r.room_number`;
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

function serveFile(filename, contentType, res) {
    const filePath = path.join(__dirname, filename);

    fs.readFile(filePath, (err, content) => {
        if (err) {
            console.error(`Ошибка чтения файла ${filename}:`, err.message);
            res.writeHead(404);
            res.end('Файл не найден');
        } else {
            res.writeHead(200, { 'Content-Type': contentType });
            res.end(content);
        }
    });
}

function saveBooking(bookingData, res) {
    if (!db) {
        console.error('❌ База данных не доступна для сохранения бронирования');
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'База данных не доступна' }));
        return;
    }

    console.log('📦 Получены данные для бронирования:', JSON.stringify(bookingData, null, 2));

    const sql = `
        INSERT INTO Bookings (
            booking_number, room_id, guest_name, guest_lastname, guest_surname,
            guest_phone, guest_email, checkin_date, guest_count, total_price,
            services_json, meals_json, spa_json, passport_series, passport_number,
            passport_issued_by, passport_issue_date
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    const values = [
        bookingData.bookingNumber,
        bookingData.room.id,
        bookingData.guestInfo.name,
        bookingData.guestInfo.lastname,
        bookingData.guestInfo.surname || '',
        bookingData.guestInfo.phone,
        bookingData.guestInfo.email,
        bookingData.checkinDate,
        bookingData.guestCount,
        bookingData.totalCost,
        JSON.stringify(bookingData.services || {}),
        JSON.stringify(bookingData.meals || {}),
        JSON.stringify(bookingData.spa || {}),
        bookingData.passportInfo?.series || '',
        bookingData.passportInfo?.number || '',
        bookingData.passportInfo?.issuedBy || '',
        bookingData.passportInfo?.issueDate || ''
    ];

    console.log('🚀 Выполнение SQL запроса с значениями:', values);

    db.run(sql, values, function (err) {
        if (err) {
            console.error('❌ Ошибка сохранения бронирования:', err.message);
            console.error('📋 SQL запрос:', sql);
            console.error('📊 Значения:', values);
            res.writeHead(500, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({
                error: 'Ошибка сохранения бронирования',
                details: err.message
            }));
        } else {
            console.log(`✅ Бронирование сохранено с ID: ${this.lastID}`);
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({
                success: true,
                bookingId: this.lastID,
                bookingNumber: bookingData.bookingNumber
            }));
        }
    });
}

function getBookings(res) {
    if (!db) {
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'База данных не доступна' }));
        return;
    }

    const sql = `
        SELECT 
            b.*,
            r.room_number,
            rt.name as room_type_name
        FROM Bookings b
        JOIN Room r ON b.room_id = r.id
        JOIN Room_types rt ON r.room_type_id = rt.id
        ORDER BY b.created_at DESC
    `;

    db.all(sql, [], (err, rows) => {
        if (err) {
            console.error('Ошибка получения бронирований:', err.message);
            res.writeHead(500, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: 'Ошибка получения данных' }));
        } else {
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify(rows));
        }
    });
}


// ======================================================================================================
const server = http.createServer((req, res) => {
    const parsedUrl = url.parse(req.url, true);
    const pathname = parsedUrl.pathname;

    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
        res.writeHead(200);
        res.end();
        return;
    }

    // Новые API эндпоинты для бронирования
    if (pathname === '/api/rooms' && req.method === 'GET') {
        getRooms(res);
        return;
    }

    if (pathname === '/api/services' && req.method === 'GET') {
        getServices(res);
        return;
    }

    if (pathname === '/api/meals' && req.method === 'GET') {
        getMeals(res);
        return;
    }

    if (pathname === '/api/spa' && req.method === 'GET') {
        getSpaServices(res);
        return;
    }

    // Существующие эндпоинты
    if (pathname === '/api/drinks' && req.method === 'GET') {
        getDB(res);
        return;
    }

    if (pathname === '/api/drinks/search' && req.method === 'GET') {
        const query = parsedUrl.query.q;
        searchDrinks(query, res);
        return;
    }

    if (pathname === '/api/room' && req.method === 'GET') {
        searchRoom('', res); // Получить все комнаты
        return;
    }

    if (pathname === '/api/room/search' && req.method === 'GET') {
        const query = parsedUrl.query.q;
        searchRoom(query, res);
        return;
    }

    if (pathname === '/api/bookings' && req.method === 'POST') {
        let body = '';
        req.on('data', chunk => {
            body += chunk.toString();
        });
        req.on('end', () => {
            try {
                const bookingData = JSON.parse(body);
                saveBooking(bookingData, res);
            } catch (error) {
                res.writeHead(400, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ error: 'Неверный формат данных' }));
            }
        });
        return;
    }

    if (pathname === '/api/bookings' && req.method === 'GET') {
        getBookings(res);
        return;
    }

    // Статические файлы
    if (pathname === '/' || pathname === '/trpoMain.html') {
        serveFile('trpoMain.html', 'text/html', res);
        return;
    }

    if (pathname === '/assortiment.html') {
        serveFile('assortiment.html', 'text/html', res);
        return;
    }

    if (pathname === '/trpoCss.css') {
        serveFile('trpoCss.css', 'text/css', res);
        return;
    }

    if (pathname === '/booking-selection.html') {
        serveFile('booking-selection.html', 'text/html', res);
        return;
    }

    if (pathname === '/menu.html') {
        serveFile('menu.html', 'text/html', res);
        return;
    }

    if (pathname === '/trpoJs.js') {
        serveFile('trpoJs.js', 'application/javascript', res);
        return;
    }

    res.writeHead(404, { 'Content-Type': 'text/html' });
    res.end('<h1>404 - Страница не найдена</h1>');
});

const PORT = 3000;
server.listen(PORT, () => {
    console.log('='.repeat(50));
    console.log('СЕРВЕР ОТЕЛЯ ЗАПУЩЕН!');
    console.log('='.repeat(50));
    console.log(`Главная страница: http://localhost:${PORT}`);
    console.log(`Ассортимент: http://localhost:${PORT}/assortiment.html`);
    console.log(`Бронирование: http://localhost:${PORT}/booking-selection.html`);
    console.log(`API номеров: http://localhost:${PORT}/api/rooms`);
    console.log(`API напитков: http://localhost:${PORT}/api/drinks`);
    console.log(`База данных: ${db ? 'подключена' : 'не доступна'}`);
    console.log('='.repeat(50));
});

process.on('SIGINT', () => {
    console.log('\n Выключение сервера...');
    if (db) {
        db.close((err) => {
            if (err) {
                console.error('Ошибка закрытия БД:', err.message);
            } else {
                console.log('База данных закрыта');
            }
            process.exit(0);
        });
    } else {
        process.exit(0);
    }
});