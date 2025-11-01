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

// Инициализация при загрузке DOM
document.addEventListener('DOMContentLoaded', () => {
    // Инициализация переключателя языка
    new LanguageSwitcher();
    
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

    // Обработчик формы бронирования
    const reservationForm = document.querySelector('.reservation-form');
    if (reservationForm) {
        reservationForm.addEventListener('submit', function(e) {
            e.preventDefault();
            const currentLang = localStorage.getItem('hotelLang') || 'ru';
            const message = currentLang === 'ru' 
                ? 'Бронирование отправлено! Мы свяжемся с вами в ближайшее время.' 
                : 'Reservation submitted! We will contact you shortly.';
            
            alert(message);
            this.reset();
            
            // Сбрасываем состояние паспортных данных
            if (passportFields) {
                passportFields.classList.remove('active');
                const resetText = currentLang === 'ru' 
                    ? '+ ДОБАВИТЬ ПАСПОРТНЫЕ ДАННЫЕ' 
                    : '+ ADD PASSPORT DETAILS';
                passportToggle.textContent = resetText;
            }
        });
    }

    // Обработчик кнопки просмотра ассортимента
    const assortmentBtn = document.querySelector('.assortment-btn');
    if (assortmentBtn) {
        assortmentBtn.addEventListener('click', function(e) {
            e.preventDefault();
            // Открываем новое окно с файлом assortiment.html
            window.open('assortiment.html', 'assortiment', 'width=800,height=600,scrollbars=yes,resizable=yes');
        });
    }

    // Обработчик кнопки просмотра меню
    const menuBtn = document.querySelector('.menu-btn');
    if (menuBtn) {
        menuBtn.addEventListener('click', function() {
            const currentLang = localStorage.getItem('hotelLang') || 'ru';
            const message = currentLang === 'ru' 
                ? 'Функция просмотра меню скоро будет доступна!' 
                : 'Menu viewing feature will be available soon!';
            
            alert(message);
        });
    }

    // Обработчик мобильного меню
    const mobileMenuBtn = document.querySelector('.mobile-menu-btn');
    const navLinks = document.querySelector('.nav-links');
    
    if (mobileMenuBtn && navLinks) {
        mobileMenuBtn.addEventListener('click', function() {
            navLinks.classList.toggle('active');
        });
    }

    // Smooth scroll for navigation links
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
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
            if (navLinks && navLinks.classList.contains('active')) {
                navLinks.classList.remove('active');
            }
        });
    });
});