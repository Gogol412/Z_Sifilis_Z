// script.js
class LanguageSwitcher {
    constructor() {
        this.currentLang = 'ru';
        this.currentNotification = null;
        this.init();
    }

    init() {
        // Обработчики для кнопок перевода
        document.querySelectorAll('.language-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const lang = e.target.dataset.lang;
                this.switchLanguage(lang);
            });
        });

        // Загружаем сохраненный язык из localStorage
        const savedLang = localStorage.getItem('hotelLang');
        if (savedLang && savedLang !== 'ru') {
            this.switchLanguage(savedLang);
        }
    }

    switchLanguage(lang) {
        if (this.currentLang === lang) return;

        // Удаляем предыдущее уведомление, если оно есть
        this.removeCurrentNotification();

        this.currentLang = lang;

        // Обновляем активную кнопку
        document.querySelectorAll('.language-btn').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.lang === lang);
        });

        // Обновляем все элементы с атрибутами data-ru и data-en
        document.querySelectorAll('[data-ru]').forEach(element => {
            if (element.tagName === 'INPUT' || element.tagName === 'TEXTAREA') {
                element.placeholder = element.getAttribute(`data-${lang}`);
            } else {
                element.textContent = element.getAttribute(`data-${lang}`);
            }
        });

        // Обновляем атрибут lang у html
        document.documentElement.lang = lang;

        // Сохраняем выбор в localStorage
        localStorage.setItem('hotelLang', lang);

        // Показываем уведомление о смене языка
        this.showLanguageNotification(lang);
    }

    removeCurrentNotification() {
        if (this.currentNotification) {
            this.currentNotification.remove();
            this.currentNotification = null;
        }
    }

    showLanguageNotification(lang) {
        // Создаем уведомление
        const notification = document.createElement('div');
        notification.className = 'language-notification show';
        notification.textContent = lang === 'ru'
            ? 'Язык изменен на русский'
            : 'Language switched to English';

        document.body.appendChild(notification);
        this.currentNotification = notification;

        // Удаляем уведомление через 2 секунды
        setTimeout(() => {
            notification.classList.remove('show');
            setTimeout(() => {
                if (notification.parentNode) {
                    notification.parentNode.removeChild(notification);
                }
                if (this.currentNotification === notification) {
                    this.currentNotification = null;
                }
            }, 300);
        }, 2000);
    }
}

// Класс для управления якорными ссылками
class AnchorNavigation {

    constructor() {
        this.sections = [];
        this.anchorLinks = [];
        this.init();
    }

    init() {
        this.createAnchorNavigation();
        this.setupEventListeners();
        this.updateActiveAnchor();
    }

    createAnchorNavigation() {

        if (window.location.pathname.includes('booking-selection.html') ||
            document.getElementById('roomsList')) {
            return; // Не создаем якорные ссылки на странице бронирования
        }

        // Создаем контейнер для якорных ссылок
        const anchorContainer = document.createElement('div');
        anchorContainer.className = 'anchor-links';

        // Секции для навигации
        const sections = [
            { id: 'about-contacts', nameRu: 'История', nameEn: 'History' },
            { id: 'hotel', nameRu: 'Отель', nameEn: 'Hotel' },
            { id: 'restaurant', nameRu: 'Ресторан', nameEn: 'Restaurant' },
            { id: 'bar', nameRu: 'Бар', nameEn: 'Bar' },
            { id: 'reservation', nameRu: 'Бронирование', nameEn: 'Reservation' }
        ];

        sections.forEach(section => {
            const anchorLink = document.createElement('a');
            anchorLink.href = `#${section.id}`;
            anchorLink.className = 'anchor-link';
            anchorLink.setAttribute('data-section', section.id);

            const tooltip = document.createElement('span');
            tooltip.className = 'anchor-tooltip';
            tooltip.setAttribute('data-ru', section.nameRu);
            tooltip.setAttribute('data-en', section.nameEn);
            tooltip.textContent = section.nameRu;

            anchorLink.appendChild(tooltip);
            anchorContainer.appendChild(anchorLink);

            this.anchorLinks.push(anchorLink);
        });

        document.body.appendChild(anchorContainer);

        // Создаем индикатор прогресса
        const progressIndicator = document.createElement('div');
        progressIndicator.className = 'progress-indicator';
        progressIndicator.id = 'progressIndicator';
        document.body.appendChild(progressIndicator);

        // Создаем кнопку "Наверх"
        const backToTop = document.createElement('button');
        backToTop.className = 'back-to-top';
        backToTop.id = 'backToTop';
        backToTop.innerHTML = '↑';
        backToTop.setAttribute('data-ru', 'Наверх');
        backToTop.setAttribute('data-en', 'Top');
        backToTop.title = 'Наверх';
        document.body.appendChild(backToTop);
    }

    setupEventListeners() {
        // Обработчики для якорных ссылок
        this.anchorLinks.forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                const targetId = link.getAttribute('data-section');
                this.scrollToSection(targetId);
            });
        });

        // Обработчик для кнопки "Наверх"
        const backToTop = document.getElementById('backToTop');
        if (backToTop) {
            backToTop.addEventListener('click', () => {
                window.scrollTo({
                    top: 0,
                    behavior: 'smooth'
                });
            });
        }

        // Обновление активной секции при скролле
        window.addEventListener('scroll', () => {
            this.updateActiveAnchor();
            this.updateProgressIndicator();
            this.toggleBackToTop();
        });

        // Обновление при изменении языка
        document.addEventListener('languageChanged', () => {
            this.updateTooltips();
        });
    }

    scrollToSection(sectionId) {
        const targetSection = document.getElementById(sectionId);
        if (targetSection) {
            const offsetTop = targetSection.offsetTop - 80;
            window.scrollTo({
                top: offsetTop,
                behavior: 'smooth'
            });
        }
    }

    updateActiveAnchor() {
        const scrollPosition = window.pageYOffset + 100;

        this.anchorLinks.forEach(link => {
            link.classList.remove('active', 'pulse');
        });

        // Находим активную секцию
        let currentSection = '';
        const sections = ['about-contacts', 'hotel', 'restaurant', 'bar', 'reservation'];

        sections.forEach(sectionId => {
            const section = document.getElementById(sectionId);
            if (section) {
                const sectionTop = section.offsetTop;
                const sectionHeight = section.clientHeight;

                if (scrollPosition >= sectionTop && scrollPosition < sectionTop + sectionHeight) {
                    currentSection = sectionId;
                }
            }
        });

        // Активируем соответствующую якорную ссылку
        if (currentSection) {
            const activeLink = document.querySelector(`.anchor-link[data-section="${currentSection}"]`);
            if (activeLink) {
                activeLink.classList.add('active', 'pulse');
            }
        }
    }

    updateProgressIndicator() {
        const progressIndicator = document.getElementById('progressIndicator');
        if (progressIndicator) {
            const windowHeight = window.innerHeight;
            const documentHeight = document.documentElement.scrollHeight - windowHeight;
            const progress = (window.pageYOffset / documentHeight) * 100;
            progressIndicator.style.transform = `scaleX(${progress / 100})`;
        }
    }

    toggleBackToTop() {
        const backToTop = document.getElementById('backToTop');
        if (backToTop) {
            if (window.pageYOffset > 500) {
                backToTop.classList.add('visible');
            } else {
                backToTop.classList.remove('visible');
            }
        }
    }

    updateTooltips() {
        const currentLang = localStorage.getItem('hotelLang') || 'ru';
        document.querySelectorAll('.anchor-tooltip').forEach(tooltip => {
            tooltip.textContent = tooltip.getAttribute(`data-${currentLang}`);
        });

        const backToTop = document.getElementById('backToTop');
        if (backToTop) {
            backToTop.title = backToTop.getAttribute(`data-${currentLang}`);
        }
    }
}

// Класс для управления бронированием
class BookingManager {
    constructor() {
        this.bookingData = {};
        this.init();
    }

    init() {
        this.loadBookingData();
        this.setupEventListeners();
        this.setupDateValidation(); // Добавляем валидацию даты
    }

    // Добавляем метод для настройки валидации даты
    setupDateValidation() {
        const dateInput = document.getElementById('date');
        if (dateInput) {
            // Устанавливаем минимальную дату (сегодня)
            const today = new Date().toISOString().split('T')[0];
            dateInput.setAttribute('min', today);

            // Добавляем обработчик изменения даты
            dateInput.addEventListener('change', () => {
                this.validateDate(dateInput);
            });
        }
    }

    // Метод валидации даты
    validateDate(dateInput) {
        const selectedDate = new Date(dateInput.value);
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        if (selectedDate < today) {
            this.showDateError('❌ Нельзя выбрать прошедшую дату! Пожалуйста, выберите дату сегодня или позже.');
            dateInput.style.borderColor = '#e74c3c';
            return false;
        } else {
            this.hideDateError();
            dateInput.style.borderColor = '#27ae60';
            return true;
        }
    }

    // Показ ошибки даты
    showDateError(message) {
        let errorElement = document.querySelector('.date-error');
        if (!errorElement) {
            errorElement = document.createElement('div');
            errorElement.className = 'error-message date-error';
            document.getElementById('date').parentNode.appendChild(errorElement);
        }
        errorElement.textContent = message;
        errorElement.style.display = 'block';
    }

    hideDateError() {
        const errorElement = document.querySelector('.date-error');
        if (errorElement) {
            errorElement.style.display = 'none';
        }
    }

    // Обновляем обработчик отправки формы
    handleReservationSubmit(e) {
        e.preventDefault();

        // Валидация даты
        const dateInput = document.getElementById('date');
        if (!this.validateDate(dateInput)) {
            return false;
        }

        const formData = new FormData(e.target);
        const reservationData = Object.fromEntries(formData);

        // Добавляем количество гостей, если поле отсутствует
        if (!reservationData.guests) {
            reservationData.guests = '1';
        }

        console.log('Сохранение данных бронирования:', reservationData); // Добавьте эту строку для отладки

        // Сохраняем данные формы
        this.bookingData.reservation = reservationData;
        this.saveBookingData();

        // Открываем страницу выбора услуг
        this.openBookingSelection();

        return false;
    }

    // Добавляем метод для форматирования даты
    static formatDisplayDate(dateString) {
        if (!dateString) return '-';

        const date = new Date(dateString);
        const options = {
            day: 'numeric',
            month: 'long',
            year: 'numeric',
            weekday: 'long'
        };

        return date.toLocaleDateString('ru-RU', options);
    }

    // Остальные существующие методы остаются без изменений
    loadBookingData() {
        const savedData = localStorage.getItem('hotelBookingData');
        if (savedData) {
            this.bookingData = JSON.parse(savedData);
        }
    }

    saveBookingData() {
        localStorage.setItem('hotelBookingData', JSON.stringify(this.bookingData));
    }

    setupEventListeners() {
        // Обработчик формы бронирования
        const reservationForm = document.querySelector('.reservation-form');
        if (reservationForm) {
            reservationForm.addEventListener('submit', (e) => {
                this.handleReservationSubmit(e);
            });
        }

        // Обработчик кнопки паспортных данных
        const passportToggle = document.querySelector('.passport-toggle');
        const passportFields = document.querySelector('.passport-fields');

        if (passportToggle && passportFields) {
            passportToggle.addEventListener('click', function () {
                passportFields.classList.toggle('active');

                // Меняем текст кнопки
                const currentLang = localStorage.getItem('hotelLang') || 'ru';
                if (passportFields.classList.contains('active')) {
                    this.textContent = currentLang === 'ru'
                        ? '− СКРЫТЬ ПАСПОРТНЫЕ ДАННЫЕ'
                        : '− HIDE PASSPORT DETAILS';
                } else {
                    this.textContent = currentLang === 'ru'
                        ? '+ ДОБАВИТЬ ПАСПОРТНЫЕ ДАННЫЕ'
                        : '+ ADD PASSPORT DETAILS';
                }
            });
        }

        // Добавляем поле для количества гостей, если его нет
        this.addGuestsField();
    }

    // Метод для добавления поля количества гостей
    addGuestsField() {
        if (!document.getElementById('guests')) {
            const dateGroup = document.querySelector('.form-group:has(#date)');
            if (dateGroup) {
                const currentLang = localStorage.getItem('hotelLang') || 'ru';
                const labelText = currentLang === 'ru' ? 'КОЛИЧЕСТВО ГОСТЕЙ' : 'NUMBER OF GUESTS';
                const guestsHtml = `
                    <div class="form-group">
                        <label for="guests">${labelText}</label>
                        <input type="number" id="guests" name="guests" min="1" max="10" value="1" required>
                    </div>
                `;
                dateGroup.insertAdjacentHTML('afterend', guestsHtml);
            }
        }
    }

    openBookingSelection() {
        // Открываем новое окно с выбором услуг
        const features = 'width=1200,height=800,scrollbars=yes,resizable=yes,menubar=no,toolbar=no,location=no,status=no';
        window.open('booking-selection.html', 'bookingSelection', features);
    }

    async saveBookingToServer(bookingData) {
        try {
            const response = await fetch('http://localhost:3000/api/bookings', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(bookingData)
            });

            if (!response.ok) {
                throw new Error('Ошибка сервера при сохранении бронирования');
            }

            const result = await response.json();
            return result;
        } catch (error) {
            console.error('Ошибка сохранения бронирования:', error);
            throw error;
        }
    }

    async confirmFinalBooking(selectionData) {
        try {
            // Получаем данные из формы
            const reservationData = this.bookingData.reservation;

            // Формируем полные данные для сохранения
            const fullBookingData = {
                bookingNumber: this.generateBookingNumber(),
                room: selectionData.room,
                guestInfo: {
                    name: reservationData.name,
                    lastname: reservationData.lastname,
                    surname: reservationData.surname,
                    phone: reservationData.phone,
                    email: reservationData.email
                },
                checkinDate: reservationData.date,
                guestCount: reservationData.guests || '1',
                totalCost: selectionData.totalCost,
                services: selectionData.services,
                meals: selectionData.meals,
                spa: selectionData.spa,
                passportInfo: {
                    series: reservationData.passport_series,
                    number: reservationData.passport_number,
                    issuedBy: reservationData.passport_issued,
                    issueDate: reservationData.passport_date
                }
            };

            // Сохраняем в базу данных
            const saveResult = await this.saveBookingToServer(fullBookingData);

            // Обновляем локальные данные
            this.bookingData.selection = selectionData;
            this.bookingData.confirmedAt = new Date().toISOString();
            this.bookingData.bookingNumber = fullBookingData.bookingNumber;
            this.bookingData.serverId = saveResult.bookingId;

            this.saveBookingData();

            // Показываем подтверждение
            this.showConfirmation(saveResult.bookingNumber);

            return saveResult;

        } catch (error) {
            console.error('Ошибка подтверждения бронирования:', error);
            this.showError('Произошла ошибка при сохранении бронирования. Пожалуйста, попробуйте еще раз.');
            throw error;
        }
    }

    generateBookingNumber() {
        return 'BK-' + Date.now() + '-' + Math.random().toString(36).substr(2, 5).toUpperCase();
    }

    showConfirmation() {
        const currentLang = localStorage.getItem('hotelLang') || 'ru';
        const message = currentLang === 'ru'
            ? `🎉 Бронирование #${this.bookingData.bookingNumber} подтверждено! Мы отправили детали на вашу почту.`
            : `🎉 Booking #${this.bookingData.bookingNumber} confirmed! We have sent details to your email.`;

        alert(message);
    }

    showError(message) {
        alert(`❌ ${message}`);
    }
}

// Класс для управления мобильным меню
class MobileMenu {
    constructor() {
        this.menuBtn = document.querySelector('.mobile-menu-btn');
        this.navLinks = document.querySelector('.nav-links');
        this.init();
    }

    init() {
        if (this.menuBtn && this.navLinks) {
            this.menuBtn.addEventListener('click', () => {
                this.toggleMenu();
            });

            // Закрываем меню при клике на ссылку
            this.navLinks.querySelectorAll('a').forEach(link => {
                link.addEventListener('click', () => {
                    this.closeMenu();
                });
            });

            // Закрываем меню при клике вне его
            document.addEventListener('click', (e) => {
                if (!this.navLinks.contains(e.target) && !this.menuBtn.contains(e.target)) {
                    this.closeMenu();
                }
            });
        }
    }

    toggleMenu() {
        this.navLinks.classList.toggle('active');
    }

    closeMenu() {
        this.navLinks.classList.remove('active');
    }
}

// Класс для управления дополнительными кнопками
class ButtonManager {
    constructor() {
        this.init();
    }

    init() {
        this.setupAssortmentButton();
        this.setupMenuButton();
        this.setupSmoothScroll();
    }

    setupAssortmentButton() {
        const assortmentBtn = document.querySelector('.assortment-btn');
        if (assortmentBtn) {
            assortmentBtn.addEventListener('click', (e) => {
                e.preventDefault();
                // Открываем новое окно с файлом assortiment.html
                const features = 'width=800,height=600,scrollbars=yes,resizable=yes,menubar=no,toolbar=no,location=no,status=no';
                window.open('assortiment.html', 'assortiment', features);
            });
        }
    }

    setupMenuButton() {
        const menuBtn = document.querySelector('.menu-btn');
        if (menuBtn) {
            menuBtn.addEventListener('click', (e) => {
                e.preventDefault();
                // Открываем новое окно с файлом menu.html
                const features = 'width=800,height=600,scrollbars=yes,resizable=yes,menubar=no,toolbar=no,location=no,status=no';
                window.open('menu.html', 'menu', features);
            });
        }
    }

    setupSmoothScroll() {
        // Smooth scroll for navigation links
        document.querySelectorAll('a[href^="#"]').forEach(anchor => {
            if (!anchor.classList.contains('anchor-link') && !anchor.classList.contains('assortment-btn') && !anchor.classList.contains('menu-btn')) {
                anchor.addEventListener('click', function (e) {
                    e.preventDefault();
                    const target = document.querySelector(this.getAttribute('href'));
                    if (target) {
                        target.scrollIntoView({
                            behavior: 'smooth',
                            block: 'start'
                        });
                    }

                    // Закрываем мобильное меню после клика
                    const navLinks = document.querySelector('.nav-links');
                    if (navLinks && navLinks.classList.contains('active')) {
                        navLinks.classList.remove('active');
                    }
                });
            }
        });
    }
}

// Главный класс приложения
class HotelApp {
    constructor() {
        this.languageSwitcher = null;
        this.anchorNavigation = null;
        this.bookingManager = null;
        this.mobileMenu = null;
        this.buttonManager = null;
        this.init();
    }

    init() {
        // Инициализируем все компоненты
        this.languageSwitcher = new LanguageSwitcher();
        this.anchorNavigation = new AnchorNavigation();
        this.bookingManager = new BookingManager();
        this.mobileMenu = new MobileMenu();
        this.buttonManager = new ButtonManager();

        // Настраиваем связи между компонентами
        this.setupComponentConnections();

        console.log('LUMINA ESTERIA GRAND HOTEL app initialized');
    }

    setupComponentConnections() {
        // Обновляем тултипы при смене языка
        const originalSwitchLanguage = this.languageSwitcher.switchLanguage;
        this.languageSwitcher.switchLanguage = (lang) => {
            originalSwitchLanguage.call(this.languageSwitcher, lang);
            this.anchorNavigation.updateTooltips();
        };
    }

    // Метод для получения данных бронирования (может быть использован в других файлах)
    static getBookingData() {
        const savedData = localStorage.getItem('hotelBookingData');
        return savedData ? JSON.parse(savedData) : null;
    }

    // Метод для очистки данных бронирования
    static clearBookingData() {
        localStorage.removeItem('hotelBookingData');
    }
}

// Инициализация при загрузке DOM
document.addEventListener('DOMContentLoaded', () => {
    // Создаем экземпляр приложения
    const app = new HotelApp();

    // Добавляем глобальные обработчики ошибок
    window.addEventListener('error', (e) => {
        console.error('Global error:', e.error);
    });

    // Обработчик для обновления языка при загрузке страницы
    const savedLang = localStorage.getItem('hotelLang');
    if (savedLang) {
        document.documentElement.lang = savedLang;
    }
});

// Глобальные вспомогательные функции
function formatPrice(price) {
    if (!price) return '0 ₽';
    return `${parseFloat(price).toFixed(2)} ₽`;
}

function escapeHtml(unsafe) {
    if (!unsafe) return '';
    return unsafe
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}

function showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.textContent = message;

    // Стили для уведомления
    notification.style.cssText = `
        position: fixed;
        top: 100px;
        right: 20px;
        background: ${type === 'error' ? '#e74c3c' : type === 'success' ? '#27ae60' : '#3498db'};
        color: white;
        padding: 15px 20px;
        border-radius: 8px;
        z-index: 10000;
        box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        transform: translateX(100%);
        transition: transform 0.3s ease;
    `;

    document.body.appendChild(notification);

    // Анимация появления
    setTimeout(() => {
        notification.style.transform = 'translateX(0)';
    }, 100);

    // Автоматическое скрытие
    setTimeout(() => {
        notification.style.transform = 'translateX(100%)';
        setTimeout(() => {
            if (notification.parentNode) {
                notification.parentNode.removeChild(notification);
            }
        }, 300);
    }, 3000);
}

// Функция для проверки валидности email
function isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

// Функция для проверки валидности телефона
function isValidPhone(phone) {
    const phoneRegex = /^[\+]?[0-9\s\-\(\)]{10,}$/;
    return phoneRegex.test(phone);
}

// Функция для форматирования даты
function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('ru-RU', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
    });
}

// Экспортируем классы для использования в других файлах
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        HotelApp,
        LanguageSwitcher,
        AnchorNavigation,
        BookingManager,
        MobileMenu,
        ButtonManager,
        formatPrice,
        escapeHtml,
        showNotification,
        isValidEmail,
        isValidPhone,
        formatDate
    };
}
