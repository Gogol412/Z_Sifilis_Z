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
    }

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
            passportToggle.addEventListener('click', function() {
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
    }

    handleReservationSubmit(e) {
        e.preventDefault();
        
        const formData = new FormData(e.target);
        const reservationData = Object.fromEntries(formData);
        
        // Сохраняем данные формы
        this.bookingData.reservation = reservationData;
        this.saveBookingData();
        
        // Открываем страницу выбора услуг
        this.openBookingSelection();
    }

    openBookingSelection() {
        // Открываем новое окно с выбором услуг
        const features = 'width=1200,height=800,scrollbars=yes,resizable=yes,menubar=no,toolbar=no,location=no,status=no';
        window.open('booking-selection.html', 'bookingSelection', features);
    }

    // Метод для подтверждения финального бронирования
    confirmFinalBooking(selectionData) {
        this.bookingData.selection = selectionData;
        this.bookingData.confirmedAt = new Date().toISOString();
        this.bookingData.bookingNumber = this.generateBookingNumber();
        
        this.saveBookingData();
        
        // Показываем подтверждение
        this.showConfirmation();
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