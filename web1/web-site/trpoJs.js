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

// Инициализация при загрузке DOM
document.addEventListener('DOMContentLoaded', () => {
    // Инициализация переключателя языка
    const languageSwitcher = new LanguageSwitcher();
    
    // Инициализация якорной навигации
    const anchorNavigation = new AnchorNavigation();
    
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
        if (!anchor.classList.contains('anchor-link')) {
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
        }
    });

    // Обновляем тултипы при смене языка
    const originalSwitchLanguage = languageSwitcher.switchLanguage;
    languageSwitcher.switchLanguage = function(lang) {
        originalSwitchLanguage.call(this, lang);
        anchorNavigation.updateTooltips();
    };
});