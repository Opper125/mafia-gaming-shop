/* ============================================
   ANIMATIONS MODULE
   Mafia Gaming Shop
   ============================================ */

// ============================================
// Intro Animation
// ============================================

const IntroAnimation = {
    duration: 5000, // 5 seconds

    async play() {
        const introScreen = document.getElementById('intro-screen');
        const mainApp = document.getElementById('main-app');
        
        if (!introScreen) return;

        // Start animation
        await this.animateIntro();

        // Hide intro and show main app
        setTimeout(() => {
            introScreen.style.opacity = '0';
            introScreen.style.transition = 'opacity 0.5s ease-out';
            
            setTimeout(() => {
                introScreen.classList.add('hidden');
                if (mainApp) {
                    mainApp.classList.remove('hidden');
                }
            }, 500);
        }, this.duration);
    },

    async animateIntro() {
        return new Promise((resolve) => {
            // Additional intro animations can be added here
            setTimeout(resolve, this.duration);
        });
    },

    skip() {
        const introScreen = document.getElementById('intro-screen');
        const mainApp = document.getElementById('main-app');
        
        if (introScreen) {
            introScreen.classList.add('hidden');
        }
        if (mainApp) {
            mainApp.classList.remove('hidden');
        }
    }
};

// ============================================
// Banner Carousel
// ============================================

const BannerCarousel = {
    currentIndex: 0,
    interval: null,
    autoPlayDuration: 7000, // 7 seconds
    slides: [],
    indicators: [],

    init(containerId = 'banner-carousel') {
        const container = document.getElementById(containerId);
        if (!container) return;

        this.slidesContainer = container.querySelector('.banner-slides');
        this.indicatorsContainer = container.querySelector('.banner-indicators');
        
        this.slides = this.slidesContainer?.querySelectorAll('.banner-slide') || [];
        
        if (this.slides.length > 1) {
            this.createIndicators();
            this.startAutoPlay();
            this.addSwipeSupport(container);
        }
    },

    createIndicators() {
        if (!this.indicatorsContainer) return;
        
        this.indicatorsContainer.innerHTML = '';
        
        for (let i = 0; i < this.slides.length; i++) {
            const indicator = document.createElement('div');
            indicator.className = `banner-indicator ${i === 0 ? 'active' : ''}`;
            indicator.addEventListener('click', () => this.goTo(i));
            this.indicatorsContainer.appendChild(indicator);
        }
        
        this.indicators = this.indicatorsContainer.querySelectorAll('.banner-indicator');
    },

    goTo(index) {
        if (index < 0) index = this.slides.length - 1;
        if (index >= this.slides.length) index = 0;
        
        this.currentIndex = index;
        
        if (this.slidesContainer) {
            this.slidesContainer.style.transform = `translateX(-${index * 100}%)`;
        }
        
        // Update indicators
        this.indicators.forEach((indicator, i) => {
            indicator.classList.toggle('active', i === index);
        });

        // Haptic feedback
        if (window.TelegramWebApp) {
            TelegramWebApp.haptic('selection');
        }
    },

    next() {
        this.goTo(this.currentIndex + 1);
    },

    prev() {
        this.goTo(this.currentIndex - 1);
    },

    startAutoPlay() {
        this.stopAutoPlay();
        this.interval = setInterval(() => this.next(), this.autoPlayDuration);
    },

    stopAutoPlay() {
        if (this.interval) {
            clearInterval(this.interval);
            this.interval = null;
        }
    },

    addSwipeSupport(container) {
        let startX = 0;
        let endX = 0;
        
        container.addEventListener('touchstart', (e) => {
            startX = e.touches[0].clientX;
            this.stopAutoPlay();
        }, { passive: true });
        
        container.addEventListener('touchmove', (e) => {
            endX = e.touches[0].clientX;
        }, { passive: true });
        
        container.addEventListener('touchend', () => {
            const diff = startX - endX;
            
            if (Math.abs(diff) > 50) {
                if (diff > 0) {
                    this.next();
                } else {
                    this.prev();
                }
            }
            
            this.startAutoPlay();
        });
    },

    updateBanners(banners) {
        if (!this.slidesContainer) return;
        
        if (banners.length === 0) {
            this.slidesContainer.innerHTML = `
                <div class="banner-placeholder">
                    <i class="fas fa-image"></i>
                    <span>No Banners</span>
                </div>
            `;
            return;
        }

        this.slidesContainer.innerHTML = banners.map(banner => `
            <div class="banner-slide">
                <img src="${banner.image}" alt="${banner.title || 'Banner'}" loading="lazy">
            </div>
        `).join('');

        this.slides = this.slidesContainer.querySelectorAll('.banner-slide');
        this.currentIndex = 0;
        this.createIndicators();
        
        if (this.slides.length > 1) {
            this.startAutoPlay();
        }
    }
};

// ============================================
// Announcement Ticker
// ============================================

const AnnouncementTicker = {
    element: null,
    text: '',
    speed: 50, // pixels per second

    init(elementId = 'ticker-content') {
        this.element = document.getElementById(elementId);
    },

    update(text) {
        if (!this.element) return;
        
        this.text = text;
        this.element.innerHTML = `<span>${text}</span>`;
        
        // Calculate animation duration based on text length
        const textWidth = this.element.scrollWidth;
        const containerWidth = this.element.parentElement.clientWidth;
        const totalDistance = textWidth + containerWidth;
        const duration = totalDistance / this.speed;
        
        this.element.style.animationDuration = `${duration}s`;
    }
};

// ============================================
// Scroll Animations
// ============================================

const ScrollAnimations = {
    observer: null,

    init() {
        this.observer = new IntersectionObserver(
            (entries) => {
                entries.forEach(entry => {
                    if (entry.isIntersecting) {
                        entry.target.classList.add('animate-in');
                        this.observer.unobserve(entry.target);
                    }
                });
            },
            {
                threshold: 0.1,
                rootMargin: '0px 0px -50px 0px'
            }
        );
    },

    observe(elements) {
        if (!this.observer) this.init();
        
        if (typeof elements === 'string') {
            elements = document.querySelectorAll(elements);
        }
        
        elements.forEach(el => {
            el.classList.add('animate-prepare');
            this.observer.observe(el);
        });
    }
};

// ============================================
// Ripple Effect
// ============================================

const RippleEffect = {
    init() {
        document.addEventListener('click', (e) => {
            const target = e.target.closest('.ripple, button, .nav-tab, .category-card, .product-card');
            if (target) {
                this.create(e, target);
            }
        });
    },

    create(event, element) {
        const ripple = document.createElement('span');
        ripple.className = 'ripple-effect';
        
        const rect = element.getBoundingClientRect();
        const size = Math.max(rect.width, rect.height);
        const x = event.clientX - rect.left - size / 2;
        const y = event.clientY - rect.top - size / 2;
        
        ripple.style.cssText = `
            position: absolute;
            width: ${size}px;
            height: ${size}px;
            left: ${x}px;
            top: ${y}px;
            background: rgba(255, 255, 255, 0.3);
            border-radius: 50%;
            transform: scale(0);
            animation: ripple-animation 0.6s ease-out;
            pointer-events: none;
        `;
        
        element.style.position = 'relative';
        element.style.overflow = 'hidden';
        element.appendChild(ripple);
        
        setTimeout(() => ripple.remove(), 600);
    }
};

// Add ripple animation CSS
const rippleStyle = document.createElement('style');
rippleStyle.textContent = `
    @keyframes ripple-animation {
        to {
            transform: scale(4);
            opacity: 0;
        }
    }
    
    .animate-prepare {
        opacity: 0;
        transform: translateY(20px);
        transition: opacity 0.5s ease, transform 0.5s ease;
    }
    
    .animate-in {
        opacity: 1;
        transform: translateY(0);
    }
`;
document.head.appendChild(rippleStyle);

// ============================================
// Skeleton Loading
// ============================================

const Skeleton = {
    create(type = 'card', count = 1) {
        const skeletons = [];
        
        for (let i = 0; i < count; i++) {
            const skeleton = document.createElement('div');
            skeleton.className = `skeleton skeleton-${type}`;
            
            switch (type) {
                case 'card':
                    skeleton.innerHTML = `
                        <div class="skeleton-image"></div>
                        <div class="skeleton-content">
                            <div class="skeleton-line"></div>
                            <div class="skeleton-line short"></div>
                        </div>
                    `;
                    break;
                case 'category':
                    skeleton.innerHTML = `
                        <div class="skeleton-icon"></div>
                        <div class="skeleton-text"></div>
                    `;
                    break;
                case 'list':
                    skeleton.innerHTML = `
                        <div class="skeleton-avatar"></div>
                        <div class="skeleton-content">
                            <div class="skeleton-line"></div>
                            <div class="skeleton-line short"></div>
                        </div>
                    `;
                    break;
            }
            
            skeletons.push(skeleton);
        }
        
        return skeletons;
    },

    show(container, type = 'card', count = 4) {
        if (typeof container === 'string') {
            container = document.querySelector(container);
        }
        if (!container) return;
        
        container.innerHTML = '';
        const skeletons = this.create(type, count);
        skeletons.forEach(skeleton => container.appendChild(skeleton));
    },

    hide(container) {
        if (typeof container === 'string') {
            container = document.querySelector(container);
        }
        if (!container) return;
        
        container.querySelectorAll('.skeleton').forEach(s => s.remove());
    }
};

// ============================================
// Pull to Refresh
// ============================================

const PullToRefresh = {
    startY: 0,
    currentY: 0,
    pulling: false,
    threshold: 80,
    onRefresh: null,

    init(callback) {
        this.onRefresh = callback;
        
        document.addEventListener('touchstart', (e) => this.handleTouchStart(e), { passive: true });
        document.addEventListener('touchmove', (e) => this.handleTouchMove(e), { passive: false });
        document.addEventListener('touchend', (e) => this.handleTouchEnd(e));
    },

    handleTouchStart(e) {
        if (window.scrollY === 0) {
            this.startY = e.touches[0].clientY;
            this.pulling = true;
        }
    },

    handleTouchMove(e) {
        if (!this.pulling) return;
        
        this.currentY = e.touches[0].clientY;
        const diff = this.currentY - this.startY;
        
        if (diff > 0 && window.scrollY === 0) {
            e.preventDefault();
            // Show pull indicator
        }
    },

    handleTouchEnd() {
        if (!this.pulling) return;
        
        const diff = this.currentY - this.startY;
        
        if (diff > this.threshold && this.onRefresh) {
            this.onRefresh();
            TelegramWebApp.haptic('impact', 'medium');
        }
        
        this.pulling = false;
        this.startY = 0;
        this.currentY = 0;
    }
};

// ============================================
// Number Counter Animation
// ============================================

const CounterAnimation = {
    animate(element, target, duration = 1000) {
        if (typeof element === 'string') {
            element = document.querySelector(element);
        }
        if (!element) return;

        const start = parseInt(element.textContent) || 0;
        const increment = (target - start) / (duration / 16);
        let current = start;
        
        const update = () => {
            current += increment;
            
            if ((increment > 0 && current >= target) || (increment < 0 && current <= target)) {
                element.textContent = target.toLocaleString();
                return;
            }
            
            element.textContent = Math.round(current).toLocaleString();
            requestAnimationFrame(update);
        };
        
        update();
    }
};

// ============================================
// Page Transitions
// ============================================

const PageTransition = {
    show(element, animation = 'fade') {
        if (typeof element === 'string') {
            element = document.querySelector(element);
        }
        if (!element) return;

        element.classList.remove('hidden');
        element.style.animation = `${animation}-in 0.3s ease-out forwards`;
    },

    hide(element, animation = 'fade') {
        if (typeof element === 'string') {
            element = document.querySelector(element);
        }
        if (!element) return;

        element.style.animation = `${animation}-out 0.3s ease-out forwards`;
        setTimeout(() => {
            element.classList.add('hidden');
            element.style.animation = '';
        }, 300);
    }
};

// Page transition animations
const pageTransitionStyles = document.createElement('style');
pageTransitionStyles.textContent = `
    @keyframes fade-in {
        from { opacity: 0; }
        to { opacity: 1; }
    }
    
    @keyframes fade-out {
        from { opacity: 1; }
        to { opacity: 0; }
    }
    
    @keyframes slide-in {
        from { opacity: 0; transform: translateX(20px); }
        to { opacity: 1; transform: translateX(0); }
    }
    
    @keyframes slide-out {
        from { opacity: 1; transform: translateX(0); }
        to { opacity: 0; transform: translateX(-20px); }
    }
    
    @keyframes scale-in {
        from { opacity: 0; transform: scale(0.95); }
        to { opacity: 1; transform: scale(1); }
    }
    
    @keyframes scale-out {
        from { opacity: 1; transform: scale(1); }
        to { opacity: 0; transform: scale(0.95); }
    }
`;
document.head.appendChild(pageTransitionStyles);

// ============================================
// Export Animations
// ============================================

window.Animations = {
    Intro: IntroAnimation,
    Banner: BannerCarousel,
    Ticker: AnnouncementTicker,
    Scroll: ScrollAnimations,
    Ripple: RippleEffect,
    Skeleton: Skeleton,
    PullToRefresh: PullToRefresh,
    Counter: CounterAnimation,
    PageTransition: PageTransition
};

// Initialize ripple effect
document.addEventListener('DOMContentLoaded', () => {
    RippleEffect.init();
});

console.log('✨ Animations module loaded');
