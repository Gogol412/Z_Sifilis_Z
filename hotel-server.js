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
            db.configure("busyTimeout", 5000); // 5 секунд таймаут
        }

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

function checkTableStructure() {
    if (!db) return;

    console.log('🔍 Проверка структуры таблицы Bookings...');

    db.all("PRAGMA table_info(Bookings)", [], (err, columns) => {
        if (err) {
            console.error('❌ Ошибка получения информации о таблице:', err.message);
            return;
        }

        console.log('📊 Столбцы таблицы Bookings:');
        columns.forEach(col => {
            console.log(`  - ${col.name} (${col.type})`);
        });

        const requiredColumns = ['checkout_date', 'guest_count', 'total_price'];
        const missingColumns = requiredColumns.filter(col =>
            !columns.some(c => c.name === col)
        );

        if (missingColumns.length > 0) {
            console.error(`❌ Отсутствуют столбцы: ${missingColumns.join(', ')}`);
            console.log('💡 Создайте таблицу с помощью SQL:');
            console.log(`
                CREATE TABLE IF NOT EXISTS Bookings (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    booking_number TEXT NOT NULL UNIQUE,
                    room_id INTEGER NOT NULL,
                    guest_name TEXT NOT NULL,
                    guest_lastname TEXT NOT NULL,
                    guest_surname TEXT,
                    guest_phone TEXT NOT NULL,
                    guest_email TEXT NOT NULL,
                    checkin_date TEXT NOT NULL,
                    checkout_date TEXT NOT NULL,
                    guest_count INTEGER NOT NULL,
                    total_price REAL NOT NULL,
                    services_json TEXT,
                    meals_json TEXT,
                    spa_json TEXT,
                    passport_series TEXT,
                    passport_number TEXT,
                    passport_issued_by TEXT,
                    passport_issue_date TEXT,
                    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                    FOREIGN KEY (room_id) REFERENCES Room (id)
                )
            `);
        } else {
            console.log('✅ Структура таблицы Bookings в порядке');
        }
    });
}

if (db) {
    db.get("SELECT name FROM sqlite_master WHERE type='table' AND name='Bookings'", (err, row) => {
        if (err) {
            console.error('❌ Ошибка проверки таблицы Bookings:', err.message);
        } else if (!row) {
            console.error('❌ Таблица Bookings не существует!');
            createBookingsTable();
        } else {
            console.log('✅ Таблица Bookings доступна');
            checkTableStructure();
        }
    });
}

function createBookingsTable() {
    if (!db) return;

    const sql = `
        CREATE TABLE IF NOT EXISTS Bookings (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            booking_number TEXT NOT NULL UNIQUE,
            room_id INTEGER NOT NULL,
            guest_name TEXT NOT NULL,
            guest_lastname TEXT NOT NULL,
            guest_surname TEXT,
            guest_phone TEXT NOT NULL,
            guest_email TEXT NOT NULL,
            checkin_date TEXT NOT NULL,
            checkout_date TEXT NOT NULL,
            guest_count INTEGER NOT NULL,
            total_price REAL NOT NULL,
            services_json TEXT,
            meals_json TEXT,
            spa_json TEXT,
            passport_series TEXT,
            passport_number TEXT,
            passport_issued_by TEXT,
            passport_issue_date TEXT,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (room_id) REFERENCES Room (id)
        )
    `;

    db.run(sql, (err) => {
        if (err) {
            console.error('❌ Ошибка создания таблицы Bookings:', err.message);
        } else {
            console.log('✅ Таблица Bookings создана');
        }
    });
}


function getAvailableRooms(req, res, query) {
    if (!db) {
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'База данных недоступна' }));
        return;
    }

    const { checkin, checkout, guests } = query;

    if (!checkin || !checkout || !guests) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
            error: 'Необходимо указать checkin, checkout и guests'
        }));
        return;
    }

    console.log(`🔍 Поиск номеров: ${checkin} - ${checkout}, гостей: ${guests}`);

    const sql = `
        SELECT 
            r.id,
            r.room_number,
            r.current_price,
            rt.name AS room_type_name,
            rt.capacity
        FROM Room r
        JOIN Room_types rt ON r.room_type_id = rt.id
        WHERE rt.capacity >= ?
        AND r.id NOT IN (
            SELECT room_id FROM Bookings
            WHERE NOT (
                checkout_date <= ?  -- существующее бронирование ЗАКАНЧИВАЕТСЯ до checkin пользователя
                OR 
                checkin_date >= ?   -- существующее бронирование НАЧИНАЕТСЯ после checkout пользователя
            )
            -- Эквивалентно: WHERE checkin_date < ? AND checkout_date > ?
            -- но более понятно: номер занят если периоды ПЕРЕСЕКАЮТСЯ
        )
        ORDER BY r.room_number
    `;

    console.log(`📊 SQL параметры: гости=${guests}, checkin=${checkin}, checkout=${checkout}`);

    db.all(sql, [guests, checkin, checkout], (err, rooms) => {
        if (err) {
            console.error('❌ Ошибка SQL:', err.message);
            res.writeHead(500, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: err.message }));
            return;
        }

        console.log(`✅ Найдено номеров: ${rooms.length}`);

        if (rooms.length > 0) {
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({
                availableRooms: rooms,
                dates: { checkin, checkout, guests }
            }));
        } else {
            findAlternativeOptions(checkin, checkout, guests, res);
        }
    });
}

function findAlternativeOptions(checkin, checkout, guests, res) {
    console.log(`🔍 Поиск альтернативных вариантов для: ${checkin} - ${checkout}, гостей: ${guests}`);

    const findNextDateSQL = `
        SELECT 
            b.checkout_date as next_available_date,
            r.room_number,
            rt.name as room_type_name,
            rt.capacity,
            'after' as availability_type
        FROM Bookings b
        JOIN Room r ON b.room_id = r.id
        JOIN Room_types rt ON r.room_type_id = rt.id
        WHERE rt.capacity >= ?
        AND b.checkout_date >= ?  -- номер освобождается после или в день желаемого заезда
        AND r.id NOT IN (
            SELECT room_id FROM Bookings b2
            WHERE b2.checkin_date < DATE(b.checkout_date, '+1 day')
            AND b2.checkout_date > DATE(b.checkout_date, '+1 day')
        )
        ORDER BY b.checkout_date ASC
        LIMIT 3
    `;

    const findPreviousDateSQL = `
        SELECT 
            b.checkin_date as previous_checkin_date,
            DATE(b.checkin_date, '-1 day') as available_before_date,
            r.room_number,
            rt.name as room_type_name,
            rt.capacity,
            'before' as availability_type
        FROM Bookings b
        JOIN Room r ON b.room_id = r.id
        JOIN Room_types rt ON r.room_type_id = rt.id
        WHERE rt.capacity >= ?
        AND b.checkin_date <= ?  -- номер заселяется до или в день желаемого выезда
        AND r.id NOT IN (
            SELECT room_id FROM Bookings b2
            WHERE b2.checkin_date < DATE(b.checkin_date, '-1 day')
            AND b2.checkout_date > DATE(b.checkin_date, '-1 day')
        )
        ORDER BY b.checkin_date DESC
        LIMIT 3
    `;

    const alternativeRoomsSQL = `
        SELECT 
            r.id,
            r.room_number,
            r.current_price,
            rt.name AS room_type_name,
            rt.capacity,
            'different_type' as suggestion_type
        FROM Room r
        JOIN Room_types rt ON r.room_type_id = rt.id
        WHERE rt.capacity >= ?  -- Исправлено: >= вместо >
        AND r.id NOT IN (
            SELECT room_id FROM Bookings
            WHERE checkin_date < ?
            AND checkout_date > ?
        )
        ORDER BY rt.capacity, r.room_number
    `;

    db.all(findNextDateSQL, [guests, checkin], (err, nextDates) => {
        if (err) {
            console.error('Ошибка поиска следующих дат:', err);
            nextDates = [];
        }

        db.all(findPreviousDateSQL, [guests, checkout], (err, previousDates) => {
            if (err) {
                console.error('Ошибка поиска предыдущих дат:', err);
                previousDates = [];
            }

            db.all(alternativeRoomsSQL, [guests, checkout, checkin], (err, altRooms) => {
                if (err) {
                    console.error('Ошибка поиска альтернат. номеров:', err);
                    altRooms = [];
                }

                const suggestions = [];

                if (nextDates && nextDates.length > 0) {
                    nextDates.forEach(date => {
                        suggestions.push({
                            type: 'alternative_date_after',
                            message: `Номер освободится ${date.next_available_date}`,
                            nextAvailableDate: date.next_available_date,
                            roomNumber: date.room_number,
                            roomType: date.room_type_name,
                            capacity: date.capacity,
                            note: "Заезд после освобождения номера"
                        });
                    });
                }

                if (previousDates && previousDates.length > 0) {
                    previousDates.forEach(date => {
                        suggestions.push({
                            type: 'alternative_date_before',
                            message: `Номер доступен до ${date.previous_checkin_date}`,
                            availableUntil: date.available_before_date,
                            roomNumber: date.room_number,
                            roomType: date.room_type_name,
                            capacity: date.capacity,
                            note: "Выезд до заселения следующего гостя"
                        });
                    });
                }

                if (altRooms && altRooms.length > 0) {
                    suggestions.push({
                        type: 'different_room_type',
                        message: `Доступны номера подходящего размера (${altRooms.length} вариантов)`,
                        rooms: altRooms.slice(0, 3)
                    });
                }

                if (suggestions.length === 0) {
                    suggestions.push({
                        type: 'no_options',
                        message: `К сожалению, на данный момент нет подходящих вариантов. Попробуйте изменить даты или количество гостей.`
                    });
                }

                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({
                    availableRooms: [],
                    suggestions: suggestions,
                    originalRequest: { checkin, checkout, guests },
                    message: 'На выбранные даты свободных номеров нет. Предлагаем альтернативные варианты:'
                }));
            });
        });
    });
}


function getServices(res) {
    const services = [
        { id: 1, name: "Трансфер из аэропорта", description: "Комфортабельный трансфер до отеля", price: 1500 },
        { id: 2, name: "Прачечная", description: "Стирка и глажка одежды", price: 800 },
        { id: 3, name: "Услуги няни", description: "Присмотр за детьми", price: 1200 }
    ];
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(services));
}

function getMeals(res) {
    const meals = [
        { id: 1, name: "Завтрак шведский стол", description: "Полноценный завтрак", price: 1200 },
        { id: 2, name: "Полупансион", description: "Завтрак + ужин", price: 2500 },
        { id: 3, name: "Полный пансион", description: "Завтрак + обед + ужин", price: 3800 }
    ];
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(meals));
}

function getSpaServices(res) {
    const spaServices = [
        { id: 1, name: "Массаж расслабляющий", description: "Расслабляющий массаж всего тела", price: 3000, duration: 60 },
        { id: 2, name: "SPA-процедура", description: "Комплексная SPA-процедура", price: 5000, duration: 90 },
        { id: 3, name: "Сауна", description: "Посещение сауны с бассейном", price: 2000, duration: 120 }
    ];
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(spaServices));
}

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

    const checkAvailabilitySQL = `
        SELECT COUNT(*) as count 
        FROM Bookings 
        WHERE room_id = ? 
        AND (
            (checkin_date < ? AND checkout_date > ?) OR
            (checkin_date >= ? AND checkin_date < ?) OR
            (checkout_date > ? AND checkout_date <= ?)
        )
    `;

    const availabilityParams = [
        bookingData.room?.id || 0,
        bookingData.checkoutDate || '',
        bookingData.checkinDate || '',
        bookingData.checkinDate || '',
        bookingData.checkoutDate || '',
        bookingData.checkinDate || '',
        bookingData.checkoutDate || ''
    ];

    console.log('🔍 Проверка доступности номера:', availabilityParams);

    db.get(checkAvailabilitySQL, availabilityParams, (err, row) => {
        if (err) {
            console.error('❌ Ошибка проверки доступности:', err.message);
            res.writeHead(500, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({
                error: 'Ошибка проверки доступности',
                details: err.message
            }));
            return;
        }

        const isAvailable = row.count === 0;
        console.log(`📊 Номер доступен: ${isAvailable}, занят бронированиями: ${row.count}`);

        if (!isAvailable) {
            console.log(`❌ Номер ${bookingData.room?.id} занят на ${bookingData.checkinDate} - ${bookingData.checkoutDate}`);

            const altDatesSQL = `
                SELECT 
                    b.checkout_date as next_available_date,
                    r.room_number,
                    rt.name as room_type_name
                FROM Bookings b
                JOIN Room r ON b.room_id = r.id
                JOIN Room_types rt ON r.room_type_id = rt.id
                WHERE b.room_id = ?
                AND b.checkout_date >= ?
                AND r.id NOT IN (
                    SELECT room_id FROM Bookings b2
                    WHERE b2.checkin_date < DATE(b.checkout_date, '+1 day')
                    AND b2.checkout_date > DATE(b.checkout_date, '+1 day')
                )
                ORDER BY b.checkout_date ASC
                LIMIT 3
            `;

            db.all(altDatesSQL, [bookingData.room?.id, bookingData.checkinDate], (err, alternativeDates) => {
                if (err) {
                    console.error('Ошибка поиска альтернативных дат:', err);
                    alternativeDates = [];
                }

                const altRoomsSQL = `
                    SELECT 
                        r.id,
                        r.room_number,
                        r.current_price,
                        rt.name AS room_type_name,
                        rt.capacity
                    FROM Room r
                    JOIN Room_types rt ON r.room_type_id = rt.id
                    WHERE rt.capacity >= ?
                    AND r.id != ?
                    AND r.id NOT IN (
                        SELECT room_id FROM Bookings
                        WHERE checkin_date < ?
                        AND checkout_date > ?
                    )
                    ORDER BY r.room_number
                    LIMIT 5
                `;

                const altRoomsParams = [
                    bookingData.guestCount || 1,
                    bookingData.room?.id || 0,
                    bookingData.checkoutDate || '',
                    bookingData.checkinDate || ''
                ];

                db.all(altRoomsSQL, altRoomsParams, (err, alternativeRooms) => {
                    if (err) {
                        console.error('Ошибка поиска альтернативных номеров:', err);
                        alternativeRooms = [];
                    }

                    console.log('📊 Найдено альтернатив:');
                    console.log('- Даты:', alternativeDates?.length || 0);
                    console.log('- Номера:', alternativeRooms?.length || 0);

                    res.writeHead(400, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify({
                        success: false,
                        error: 'Номер занят на выбранные даты',
                        roomNotAvailable: true,
                        alternatives: {
                            alternativeDates: alternativeDates || [],
                            alternativeRooms: alternativeRooms || [],
                            originalRoom: bookingData.room || null,
                            originalDates: {
                                checkin: bookingData.checkinDate || '',
                                checkout: bookingData.checkoutDate || ''
                            }
                        },
                        message: 'Этот номер занят. Мы нашли для вас альтернативные варианты:'
                    }));
                });
            });
            return;
        }

        const insertSQL = `
            INSERT INTO Bookings (
                booking_number, room_id, guest_name, guest_lastname,
                guest_surname, guest_phone, guest_email, checkin_date,
                guest_count, total_price, services_json, meals_json,
                spa_json, passport_series, passport_number,
                passport_issued_by, passport_issue_date, checkout_date
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `;

        const values = [
            bookingData.bookingNumber || `BK-${Date.now()}-${Math.random().toString(36).substr(2, 5).toUpperCase()}`,
            bookingData.room?.id || 0,
            bookingData.guestInfo?.name || '',
            bookingData.guestInfo?.lastname || '',
            bookingData.guestInfo?.surname || '',
            bookingData.guestInfo?.phone || '',
            bookingData.guestInfo?.email || '',
            bookingData.checkinDate || '',
            bookingData.guestCount || 1,
            bookingData.totalCost || 0,
            JSON.stringify(bookingData.services || {}),
            JSON.stringify(bookingData.meals || {}),
            JSON.stringify(bookingData.spa || {}),
            bookingData.passportInfo?.series || '',
            bookingData.passportInfo?.number || '',
            bookingData.passportInfo?.issuedBy || '',
            bookingData.passportInfo?.issueDate || '',
            bookingData.checkoutDate || ''
        ];

        console.log('🚀 Выполнение INSERT запроса с значениями:', values);

        db.run(insertSQL, values, function (err) {
            if (err) {
                console.error('❌ Ошибка сохранения бронирования:', err.message);
                console.error('📋 SQL запрос:', insertSQL);
                res.writeHead(500, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({
                    error: 'Ошибка сохранения бронирования',
                    details: err.message,
                    sqlError: err.message
                }));
            } else {
                console.log(`✅ Бронирование сохранено с ID: ${this.lastID}`);
                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({
                    success: true,
                    bookingId: this.lastID,
                    bookingNumber: bookingData.bookingNumber || values[0]
                }));
            }
        });
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



function findNextAvailableDate(checkin, guests, res) {
    const sql = `
        SELECT MIN(b.checkout_date) AS next_date
        FROM Bookings b
        JOIN Room r ON r.id = b.room_id
        JOIN Room_types rt ON rt.id = r.room_type_id
        WHERE rt.capacity >= ?
        AND b.checkout_date > ?
    `;

    db.get(sql, [guests, checkin], (err, row) => {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
            availableRooms: [],
            suggestion: {
                nextAvailableDate: row?.next_date || null
            }
        }));
    });
}

// Функция для генерации отчета в TXT формате
function generateTxtReport(query, res) {
    if (!db) {
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'База данных не доступна' }));
        return;
    }

    const { start_date, end_date } = query;

    if (!start_date || !end_date) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
            error: 'Необходимо указать start_date и end_date в формате YYYY-MM-DD'
        }));
        return;
    }

    console.log(`📊 Генерация TXT отчета за период: ${start_date} - ${end_date}`);

    const sql = `
        SELECT 
            b.id,
            b.booking_number,
            b.guest_name,
            b.guest_lastname,
            b.guest_surname,
            b.guest_phone,
            b.guest_email,
            b.checkin_date,
            b.checkout_date,
            b.guest_count,
            b.total_price,
            b.services_json,
            b.meals_json,
            b.spa_json,
            b.passport_series,
            b.passport_number,
            b.passport_issued_by,
            b.passport_issue_date,
            b.created_at,
            r.room_number,
            rt.name as room_type_name
        FROM Bookings b
        JOIN Room r ON b.room_id = r.id
        JOIN Room_types rt ON r.room_type_id = rt.id
        WHERE date(b.created_at) >= date(?)
        AND date(b.created_at) <= date(?)
        ORDER BY b.created_at DESC
    `;

    db.all(sql, [start_date, end_date], (err, bookings) => {
        if (err) {
            console.error('❌ Ошибка генерации отчета:', err.message);
            res.writeHead(500, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: err.message }));
            return;
        }

        const txtContent = generateReportContent(start_date, end_date, bookings);

        res.writeHead(200, {
            'Content-Type': 'text/plain; charset=utf-8',
            'Content-Disposition': `attachment; filename="report_${start_date}_${end_date}.txt"`
        });
        res.end(txtContent);
    });
}

// Функция для формирования содержимого отчета
function generateReportContent(startDate, endDate, bookings) {
    let content = '';

    content += '═'.repeat(80) + '\n';
    content += ' '.repeat(25) + 'ОТЧЕТ ПО БРОНИРОВАНИЯМ\n';
    content += '═'.repeat(80) + '\n\n';

    content += `ПЕРИОД: ${startDate} - ${endDate}\n`;
    content += `СГЕНЕРИРОВАНО: ${new Date().toLocaleString('ru-RU')}\n`;
    content += `ОБЩЕЕ КОЛИЧЕСТВО: ${bookings.length} бронирований\n\n`;

    const totalGuests = bookings.reduce((sum, b) => sum + (parseInt(b.guest_count) || 1), 0);
    const totalRevenue = bookings.reduce((sum, b) => sum + (parseFloat(b.total_price) || 0), 0);

    content += '─'.repeat(80) + '\n';
    content += 'СТАТИСТИКА:\n';
    content += '─'.repeat(80) + '\n';
    content += `• Всего бронирований: ${bookings.length}\n`;
    content += `• Всего гостей: ${totalGuests}\n`;
    content += `• Общая выручка: ${totalRevenue.toFixed(2)} ₽\n`;
    content += `• Средняя выручка за бронирование: ${bookings.length > 0 ? (totalRevenue / bookings.length).toFixed(2) : '0'} ₽\n`;
    content += `• Среднее количество гостей: ${bookings.length > 0 ? (totalGuests / bookings.length).toFixed(1) : '0'}\n\n`;

    if (bookings.length > 0) {
        content += '─'.repeat(80) + '\n';
        content += 'ДЕТАЛИ БРОНИРОВАНИЙ:\n';
        content += '─'.repeat(80) + '\n\n';

        bookings.forEach((booking, index) => {
            const num = index + 1;

            content += `БРОНИРОВАНИЕ №${num} ${'─'.repeat(70 - String(num).length)}\n\n`;

            content += `  Номер брони: ${booking.booking_number}\n`;
            content += `  Дата создания: ${new Date(booking.created_at).toLocaleString('ru-RU')}\n\n`;

            content += `  НОМЕР:\n`;
            content += `    • Номер: ${booking.room_number}\n`;
            content += `    • Тип: ${booking.room_type_name}\n`;
            content += `    • Заезд: ${booking.checkin_date}\n`;
            content += `    • Выезд: ${booking.checkout_date}\n`;
            content += `    • Количество ночей: ${calculateNights(booking.checkin_date, booking.checkout_date)}\n`;
            content += `    • Гостей: ${booking.guest_count}\n\n`;

            content += `  ГОСТЬ:\n`;
            content += `    • ФИО: ${booking.guest_lastname} ${booking.guest_name} ${booking.guest_surname || ''}\n`;
            content += `    • Телефон: ${booking.guest_phone}\n`;
            content += `    • Email: ${booking.guest_email}\n`;

            if (booking.passport_series || booking.passport_number) {
                content += `    • Паспорт: ${booking.passport_series || ''} ${booking.passport_number || ''}\n`;
            }

            if (booking.passport_issued_by) {
                content += `    • Кем выдан: ${booking.passport_issued_by}\n`;
            }

            if (booking.passport_issue_date) {
                content += `    • Дата выдачи: ${booking.passport_issue_date}\n`;
            }
            content += '\n';

            let additionalServices = [];

            if (booking.services_json) {
                try {
                    const services = JSON.parse(booking.services_json);
                    if (Object.keys(services).length > 0) {
                        additionalServices.push('Услуги: ' + Object.values(services).filter(v => v > 0).length);
                    }
                } catch (e) { }
            }

            if (booking.meals_json) {
                try {
                    const meals = JSON.parse(booking.meals_json);
                    if (Object.keys(meals).length > 0) {
                        additionalServices.push('Питание: ' + Object.values(meals).filter(v => v > 0).length);
                    }
                } catch (e) { }
            }

            if (booking.spa_json) {
                try {
                    const spa = JSON.parse(booking.spa_json);
                    if (Object.keys(spa).length > 0) {
                        additionalServices.push('SPA: ' + Object.values(spa).filter(v => v > 0).length);
                    }
                } catch (e) { }
            }

            if (additionalServices.length > 0) {
                content += `  ДОПОЛНИТЕЛЬНЫЕ УСЛУГИ: ${additionalServices.join(', ')}\n\n`;
            }

            content += `  ФИНАНСЫ:\n`;
            content += `    • Стоимость номера: ${parseFloat(booking.total_price || 0).toFixed(2)} ₽\n`;
            content += `    • Стоимость за ночь: ${calculatePricePerNight(booking.total_price, booking.checkin_date, booking.checkout_date)} ₽\n\n`;

            content += '─'.repeat(80) + '\n\n';
        });
    } else {
        content += 'Нет бронирований за указанный период.\n\n';
    }

    content += '═'.repeat(80) + '\n';
    content += 'ИТОГОВАЯ ИНФОРМАЦИЯ:\n';
    content += '═'.repeat(80) + '\n';
    content += `• Отчет сгенерирован: ${new Date().toLocaleString('ru-RU')}\n`;
    content += `• Период отчета: ${startDate} - ${endDate}\n`;
    content += `• Всего бронирований: ${bookings.length}\n`;
    content += `• Общая выручка: ${totalRevenue.toFixed(2)} ₽\n\n`;

    content += 'Отчет сгенерирован автоматически системой LUMINA ESTERIA GRAND HOTEL\n';
    content += '═'.repeat(80);

    return content;
}

function calculateNights(checkin, checkout) {
    if (!checkin || !checkout) return '?';
    const checkinDate = new Date(checkin);
    const checkoutDate = new Date(checkout);
    const diffTime = Math.abs(checkoutDate - checkinDate);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
}

function calculatePricePerNight(totalPrice, checkin, checkout) {
    const nights = calculateNights(checkin, checkout);
    if (nights === '?' || nights === 0) return parseFloat(totalPrice || 0).toFixed(2);
    return (parseFloat(totalPrice || 0) / nights).toFixed(2);
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

    if (pathname === '/report.html') {
        serveFile('report.html', 'text/html', res);
        return;
    }

    if (pathname === '/api/report/txt' && req.method === 'GET') {
        generateTxtReport(parsedUrl.query, res);
        return;
    }

    if (pathname === '/api/rooms' && req.method === 'GET') {
        getAvailableRooms(req, res, parsedUrl.query);
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
        searchRoom('', res);
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
    console.log(`Генератор отчетов: http://localhost:${PORT}/report.html`);
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