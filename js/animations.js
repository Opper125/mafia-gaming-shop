// ============================================
// ANIMATIONS & UI EFFECTS
// ============================================

const Animations = {
    // Initialize all animations
    init() {
        this.initScrollAnimations();
        this.initRippleEffect();
        this.initParallax();
    },
    
    // ============================================
    // INTRO ANIMATION
    // ============================================
    
    // Play intro animation
    playIntro(duration = 5000) {
        return new Promise((resolve) => {
            const introScreen = document.getElementById('intro-screen');
            const mainApp = document.getElementById('main-app');
            
            if (!introScreen) {
                resolve();
                return;
            }
            
            // Show intro
            introScreen.classList.remove('hidden');
            
            // Add animation classes
            setTimeout(() => {
                introScreen.classList.add('fade-out');
            }, duration - 500);
            
            // Hide intro and show main app
            setTimeout(() => {
                introScreen.classList.add('hidden');
                introScreen.classList.remove('fade-out');
                if (mainApp) {
                    mainApp.classList.remove('hidden');
                    mainApp.classList.add('fade-in');
                }
                resolve();
            }, duration);
        });
    },
    
    // Skip intro
    skipIntro() {
        const introScreen = document.getElementById('intro-screen');
        const mainApp = document.getElementById('main-app');
        
        if (introScreen) {
            introScreen.classList.add('hidden');
        }
        if (mainApp) {
            mainApp.classList.remove('hidden');
        }
    },
    
    // ============================================
    // PAGE TRANSITIONS
    // ============================================
    
    // Fade in element
    fadeIn(element, duration = 300) {
        return new Promise((resolve) => {
            if (!element) {
                resolve();
                return;
            }
            
            element.style.opacity = '0';
            element.style.display = 'block';
            element.style.transition = `opacity ${duration}ms ease`;
            
            requestAnimationFrame(() => {
                element.style.opacity = '1';
            });
            
            setTimeout(resolve, duration);
        });
    },
    
    // Fade out element
    fadeOut(element, duration = 300) {
        return new Promise((resolve) => {
            if (!element) {
                resolve();
                return;
            }
            
            element.style.transition = `opacity ${duration}ms ease`;
            element.style.opacity = '0';
            
            setTimeout(() => {
                element.style.display = 'none';
                resolve();
            }, duration);
        });
    },
    
    // Slide up element
    slideUp(element, duration = 300) {
        return new Promise((resolve) => {
            if (!element) {
                resolve();
                return;
            }
            
            element.style.transform = 'translateY(100%)';
            element.style.display = 'block';
            element.style.transition = `transform ${duration}ms ease`;
            
            requestAnimationFrame(() => {
                element.style.transform = 'translateY(0)';
            });
            
            setTimeout(resolve, duration);
        });
    },
    
    // Slide down element
    slideDown(element, duration = 300) {
        return new Promise((resolve) => {
            if (!element) {
                resolve();
                return;
            }
            
            element.style.transition = `transform ${duration}ms ease`;
            element.style.transform = 'translateY(100%)';
            
            setTimeout(() => {
                element.style.display = 'none';
                element.style.transform = '';
                resolve();
            }, duration);
        });
    },
    
    // Scale in element
    scaleIn(element, duration = 300) {
        return new Promise((resolve) => {
            if (!element) {
                resolve();
                return;
            }
            
            element.style.transform = 'scale(0.8)';
            element.style.opacity = '0';
            element.style.display = 'block';
            element.style.transition = `transform ${duration}ms ease, opacity ${duration}ms ease`;
            
            requestAnimationFrame(() => {
                element.style.transform = 'scale(1)';
                element.style.opacity = '1';
            });
            
            setTimeout(resolve, duration);
        });
    },
    
    // Scale out element
    scaleOut(element, duration = 300) {
        return new Promise((resolve) => {
            if (!element) {
                resolve();
                return;
            }
            
            element.style.transition = `transform ${duration}ms ease, opacity ${duration}ms ease`;
            element.style.transform = 'scale(0.8)';
            element.style.opacity = '0';
            
            setTimeout(() => {
                element.style.display = 'none';
                element.style.transform = '';
                element.style.opacity = '';
                resolve();
            }, duration);
        });
    },
    
    // ============================================
    // BANNER SLIDER
    // ============================================
    
    bannerSlider: {
        currentIndex: 0,
        interval: null,
        banners: [],
        
        // Initialize slider
        init(banners, autoPlayInterval = 7000) {
            this.banners = banners;
            this.currentIndex = 0;
            
            if (this.interval) {
                clearInterval(this.interval);
            }
            
            this.render();
            
            if (banners.length > 1) {
                this.startAutoPlay(autoPlayInterval);
            }
        },
        
        // Render banners
        render() {
            const container = document.getElementById('banner-container');
            const dotsContainer = document.getElementById('banner-dots');
            
            if (!container || !this.banners.length) return;
            
            // Render slides
            container.innerHTML = this.banners.map((banner, index) => `
                <div class="banner-slide ${index === 0 ? 'active' : ''}">
                    <img src="${banner.image}" alt="Banner ${index + 1}" loading="lazy">
                </div>
            `).join('');
            
            // Render dots
            if (dotsContainer && this.banners.length > 1) {
                dotsContainer.innerHTML = this.banners.map((_, index) => `
                    <div class="banner-dot ${index === 0 ? 'active' : ''}" onclick="Animations.bannerSlider.goTo(${index})"></div>
                `).join('');
            }
        },
        
        // Go to specific slide
        goTo(index) {
            if (index < 0) index = this.banners.length - 1;
            if (index >= this.banners.length) index = 0;
            
            this.currentIndex = index;
            
            const container = document.getElementById('banner-container');
            if (container) {
                container.style.transform = `translateX(-${index * 100}%)`;
            }
            
            // Update dots
            const dots = document.querySelectorAll('.banner-dot');
            dots.forEach((dot, i) => {
                dot.classList.toggle('active', i === index);
            });
            
            // Haptic feedback
            if (TelegramApp && TelegramApp.haptic) {
                TelegramApp.haptic('selection');
            }
        },
        
        // Next slide
        next() {
            this.goTo(this.currentIndex + 1);
        },
        
        // Previous slide
        prev() {
            this.goTo(this.currentIndex - 1);
        },
        
        // Start auto play
        startAutoPlay(interval = 7000) {
            if (this.interval) {
                clearInterval(this.interval);
            }
            
            this.interval = setInterval(() => {
                this.next();
            }, interval);
        },
        
        // Stop auto play
        stopAutoPlay() {
            if (this.interval) {
                clearInterval(this.interval);
                this.interval = null;
            }
        },
        
        // Destroy slider
        destroy() {
            this.stopAutoPlay();
            this.banners = [];
            this.currentIndex = 0;
        }
    },
    
    // ============================================
    // MARQUEE ANIMATION
    // ============================================
    
    marquee: {
        // Initialize marquee
        init(text, speed = 15) {
            const marqueeContent = document.getElementById('announcement-text');
            if (!marqueeContent) return;
            
            marqueeContent.textContent = text;
            marqueeContent.style.animationDuration = `${speed}s`;
        },
        
        // Update text
        updateText(text) {
            const marqueeContent = document.getElementById('announcement-text');
            if (marqueeContent) {
                marqueeContent.textContent = text;
            }
        },
        
        // Pause
        pause() {
            const marqueeContent = document.getElementById('announcement-text');
            if (marqueeContent) {
                marqueeContent.style.animationPlayState = 'paused';
            }
        },
        
        // Resume
        resume() {
            const marqueeContent = document.getElementById('announcement-text');
            if (marqueeContent) {
                marqueeContent.style.animationPlayState = 'running';
            }
        }
    },
    
    // ============================================
    // SCROLL ANIMATIONS
    // ============================================
    
    initScrollAnimations() {
        const observerOptions = {
            threshold: 0.1,
            rootMargin: '0px 0px -50px 0px'
        };
        
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('animate-in');
                    observer.unobserve(entry.target);
                }
            });
        }, observerOptions);
        
        // Observe elements with animation class
        document.querySelectorAll('.animate-on-scroll').forEach(el => {
            observer.observe(el);
        });
    },
    
    // ============================================
    // RIPPLE EFFECT
    // ============================================
    
    initRippleEffect() {
        document.addEventListener('click', (e) => {
            const target = e.target.closest('.ripple, .nav-item, .category-card, .product-card, .menu-item, button');
            
            if (target) {
                this.createRipple(e, target);
            }
        });
    },
    
    createRipple(event, element) {
        const ripple = document.createElement('span');
        ripple.classList.add('ripple-effect');
        
        const rect = element.getBoundingClientRect();
        const size = Math.max(rect.width, rect.height);
        
        ripple.style.width = ripple.style.height = `${size}px`;
        ripple.style.left = `${event.clientX - rect.left - size / 2}px`;
        ripple.style.top = `${event.clientY - rect.top - size / 2}px`;
        
        element.style.position = 'relative';
        element.style.overflow = 'hidden';
        element.appendChild(ripple);
        
        setTimeout(() => {
            ripple.remove();
        }, 600);
    },
    
    // ============================================
    // PARALLAX EFFECT
    // ============================================
    
    initParallax() {
        let ticking = false;
        
        window.addEventListener('scroll', () => {
            if (!ticking) {
                requestAnimationFrame(() => {
                    this.updateParallax();
                    ticking = false;
                });
                ticking = true;
            }
        });
    },
    
    updateParallax() {
        const scrolled = window.pageYOffset;
        const parallaxElements = document.querySelectorAll('.parallax');
        
        parallaxElements.forEach(el => {
            const speed = el.dataset.speed || 0.5;
            el.style.transform = `translateY(${scrolled * speed}px)`;
        });
    },
    
    // ============================================
    // LOADING ANIMATIONS
    // ============================================
    
    // Show loading overlay
    showLoading(text = 'Loading...') {
        const overlay = document.getElementById('loading-overlay');
        const loadingText = document.getElementById('loading-text');
        
        if (overlay) {
            overlay.classList.remove('hidden');
            if (loadingText) {
                loadingText.textContent = text;
            }
        }
    },
    
    // Hide loading overlay
    hideLoading() {
        const overlay = document.getElementById('loading-overlay');
        if (overlay) {
            overlay.classList.add('hidden');
        }
    },
    
    // Update loading text
    updateLoadingText(text) {
        const loadingText = document.getElementById('loading-text');
        if (loadingText) {
            loadingText.textContent = text;
        }
    },
    
    // ============================================
    // SKELETON LOADING
    // ============================================
    
    // Create skeleton element
    createSkeleton(type = 'text', count = 1) {
        const skeletons = [];
        
        for (let i = 0; i < count; i++) {
            const skeleton = document.createElement('div');
            skeleton.classList.add('skeleton', `skeleton-${type}`);
            skeletons.push(skeleton);
        }
        
        return skeletons;
    },
    
    // Show skeleton in container
    showSkeleton(container, type = 'card', count = 4) {
        if (!container) return;
        
        container.innerHTML = '';
        
        for (let i = 0; i < count; i++) {
            const skeleton = document.createElement('div');
            skeleton.classList.add('skeleton-card');
            skeleton.innerHTML = `
                <div class="skeleton skeleton-image"></div>
                <div class="skeleton skeleton-text"></div>
                <div class="skeleton skeleton-text short"></div>
            `;
            container.appendChild(skeleton);
        }
    },
    
    // ============================================
    // TOAST NOTIFICATIONS
    // ============================================
    
    // Show toast
    showToast(message, type = 'info', duration = 3000) {
        const container = document.getElementById('toast-container');
        if (!container) return;
        
        const toast = document.createElement('div');
        toast.classList.add('toast', type);
        
        const icons = {
            success: 'fa-check-circle',
            error: 'fa-times-circle',
            warning: 'fa-exclamation-triangle',
            info: 'fa-info-circle'
        };
        
        toast.innerHTML = `
            <i class="fas ${icons[type] || icons.info}"></i>
            <span>${message}</span>
        `;
        
        container.appendChild(toast);
        
        // Haptic feedback
        if (TelegramApp && TelegramApp.haptic) {
            if (type === 'success') {
                TelegramApp.haptic('notification', 'success');
            } else if (type === 'error') {
                TelegramApp.haptic('notification', 'error');
            } else {
                TelegramApp.haptic('notification', 'warning');
            }
        }
        
        // Remove after duration
        setTimeout(() => {
            toast.classList.add('fade-out');
            setTimeout(() => {
                toast.remove();
            }, 300);
        }, duration);
    },
    
    // Success toast
    showSuccess(message) {
        this.showToast(message, 'success');
    },
    
    // Error toast
    showError(message) {
        this.showToast(message, 'error');
    },
    
    // Warning toast
    showWarning(message) {
        this.showToast(message, 'warning');
    },
    
    // Info toast
    showInfo(message) {
        this.showToast(message, 'info');
    },
    
    // ============================================
    // MODAL ANIMATIONS
    // ============================================
    
    // Open modal
    openModal(modalId) {
        const modal = document.getElementById(modalId);
        if (!modal) return;
        
        modal.classList.remove('hidden');
        
        // Prevent body scroll
        document.body.style.overflow = 'hidden';
        
        // Animate content
        const content = modal.querySelector('.modal-content');
        if (content) {
            content.style.transform = 'translateY(100%)';
            requestAnimationFrame(() => {
                content.style.transition = 'transform 0.3s ease';
                content.style.transform = 'translateY(0)';
            });
        }
        
        // Haptic feedback
        if (TelegramApp && TelegramApp.haptic) {
            TelegramApp.haptic('impact', 'light');
        }
    },
    
    // Close modal
    closeModal(modalId) {
        const modal = document.getElementById(modalId);
        if (!modal) return;
        
        const content = modal.querySelector('.modal-content');
        if (content) {
            content.style.transform = 'translateY(100%)';
        }
        
        setTimeout(() => {
            modal.classList.add('hidden');
            document.body.style.overflow = '';
            
            if (content) {
                content.style.transform = '';
                content.style.transition = '';
            }
        }, 300);
    },
    
    // ============================================
    // BUTTON ANIMATIONS
    // ============================================
    
    // Button loading state
    setButtonLoading(button, loading = true) {
        if (!button) return;
        
        if (loading) {
            button.dataset.originalText = button.innerHTML;
            button.innerHTML = '<div class="btn-spinner"></div>';
            button.disabled = true;
            button.classList.add('loading');
        } else {
            button.innerHTML = button.dataset.originalText || button.innerHTML;
            button.disabled = false;
            button.classList.remove('loading');
        }
    },
    
    // Button success animation
    buttonSuccess(button) {
        if (!button) return;
        
        const originalText = button.innerHTML;
        button.innerHTML = '<i class="fas fa-check"></i>';
        button.classList.add('success');
        
        setTimeout(() => {
            button.innerHTML = originalText;
            button.classList.remove('success');
        }, 1500);
    },
    
    // Button error animation
    buttonError(button) {
        if (!button) return;
        
        button.classList.add('shake');
        
        setTimeout(() => {
            button.classList.remove('shake');
        }, 500);
    },
    
    // ============================================
    // NUMBER ANIMATIONS
    // ============================================
    
    // Animate number counting
    animateNumber(element, start, end, duration = 1000, suffix = '') {
        if (!element) return;
        
        const startTime = performance.now();
        const range = end - start;
        
        const update = (currentTime) => {
            const elapsed = currentTime - startTime;
            const progress = Math.min(elapsed / duration, 1);
            
            // Easing function
            const easeOutQuart = 1 - Math.pow(1 - progress, 4);
            const current = start + (range * easeOutQuart);
            
            element.textContent = Math.floor(current).toLocaleString() + suffix;
            
            if (progress < 1) {
                requestAnimationFrame(update);
            } else {
                element.textContent = end.toLocaleString() + suffix;
            }
        };
        
        requestAnimationFrame(update);
    },
    
    // Animate balance change
    animateBalanceChange(newBalance, isIncrease = true) {
        const balanceElement = document.getElementById('user-balance');
        if (!balanceElement) return;
        
        balanceElement.classList.add(isIncrease ? 'balance-increase' : 'balance-decrease');
        
        setTimeout(() => {
            balanceElement.classList.remove('balance-increase', 'balance-decrease');
        }, 500);
    },
    
    // ============================================
    // PULL TO REFRESH
    // ============================================
    
    pullToRefresh: {
        startY: 0,
        pulling: false,
        threshold: 80,
        
        init(callback) {
            const container = document.querySelector('.pages-container');
            if (!container) return;
            
            container.addEventListener('touchstart', (e) => {
                if (window.scrollY === 0) {
                    this.startY = e.touches[0].pageY;
                    this.pulling = true;
                }
            });
            
            container.addEventListener('touchmove', (e) => {
                if (!this.pulling) return;
                
                const currentY = e.touches[0].pageY;
                const diff = currentY - this.startY;
                
                if (diff > 0 && diff < 150) {
                    container.style.transform = `translateY(${diff * 0.4}px)`;
                }
            });
            
            container.addEventListener('touchend', (e) => {
                if (!this.pulling) return;
                
                const currentY = e.changedTouches[0].pageY;
                const diff = currentY - this.startY;
                
                container.style.transform = '';
                container.style.transition = 'transform 0.3s ease';
                
                setTimeout(() => {
                    container.style.transition = '';
                }, 300);
                
                if (diff > this.threshold) {
                    if (callback) callback();
                }
                
                this.pulling = false;
            });
        }
    },
    
    // ============================================
    // CONFETTI ANIMATION
    // ============================================
    
    showConfetti() {
        const colors = ['#8b5cf6', '#a78bfa', '#22c55e', '#fbbf24', '#ef4444'];
        const confettiCount = 50;
        
        for (let i = 0; i < confettiCount; i++) {
            const confetti = document.createElement('div');
            confetti.classList.add('confetti');
            confetti.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)];
            confetti.style.left = Math.random() * 100 + 'vw';
            confetti.style.animationDuration = (Math.random() * 2 + 1) + 's';
            confetti.style.animationDelay = Math.random() * 0.5 + 's';
            
            document.body.appendChild(confetti);
            
            setTimeout(() => {
                confetti.remove();
            }, 3000);
        }
    }
};

// ============================================
// ADDITIONAL CSS FOR ANIMATIONS
// ============================================

const animationStyles = `
    .fade-out {
        animation: fadeOut 0.5s ease forwards;
    }
    
    .fade-in {
        animation: fadeIn 0.5s ease forwards;
    }
    
    @keyframes fadeOut {
        from { opacity: 1; }
        to { opacity: 0; }
    }
    
    .ripple-effect {
        position: absolute;
        border-radius: 50%;
        background: rgba(255, 255, 255, 0.3);
        transform: scale(0);
        animation: ripple 0.6s ease-out;
        pointer-events: none;
    }
    
    @keyframes ripple {
        to {
            transform: scale(4);
            opacity: 0;
        }
    }
    
    .animate-on-scroll {
        opacity: 0;
        transform: translateY(20px);
        transition: opacity 0.5s ease, transform 0.5s ease;
    }
    
    .animate-on-scroll.animate-in {
        opacity: 1;
        transform: translateY(0);
    }
    
    .skeleton {
        background: linear-gradient(90deg, var(--bg-tertiary) 25%, var(--bg-secondary) 50%, var(--bg-tertiary) 75%);
        background-size: 200% 100%;
        animation: skeleton-loading 1.5s infinite;
        border-radius: var(--border-radius-sm);
    }
    
    .skeleton-image {
        width: 100%;
        aspect-ratio: 1;
    }
    
    .skeleton-text {
        height: 16px;
        margin-top: 8px;
    }
    
    .skeleton-text.short {
        width: 60%;
    }
    
    .skeleton-card {
        padding: var(--spacing-md);
        background: var(--bg-secondary);
        border-radius: var(--border-radius-lg);
    }
    
    @keyframes skeleton-loading {
        0% { background-position: 200% 0; }
        100% { background-position: -200% 0; }
    }
    
    .btn-spinner {
        width: 20px;
        height: 20px;
        border: 2px solid rgba(255, 255, 255, 0.3);
        border-top-color: #fff;
        border-radius: 50%;
        animation: spin 0.8s linear infinite;
        margin: 0 auto;
    }
    
    .shake {
        animation: shake 0.5s ease;
    }
    
    @keyframes shake {
        0%, 100% { transform: translateX(0); }
        25% { transform: translateX(-10px); }
        75% { transform: translateX(10px); }
    }
    
    .balance-increase {
        animation: balanceIncrease 0.5s ease;
    }
    
    .balance-decrease {
        animation: balanceDecrease 0.5s ease;
    }
    
    @keyframes balanceIncrease {
        0% { transform: scale(1); color: inherit; }
        50% { transform: scale(1.2); color: var(--success); }
        100% { transform: scale(1); color: inherit; }
    }
    
    @keyframes balanceDecrease {
        0% { transform: scale(1); color: inherit; }
        50% { transform: scale(0.9); color: var(--error); }
        100% { transform: scale(1); color: inherit; }
    }
    
    .confetti {
        position: fixed;
        top: -10px;
        width: 10px;
        height: 10px;
        border-radius: 2px;
        z-index: 9999;
        animation: confetti-fall linear forwards;
    }
    
    @keyframes confetti-fall {
        0% {
            transform: translateY(0) rotate(0deg);
            opacity: 1;
        }
        100% {
            transform: translateY(100vh) rotate(720deg);
            opacity: 0;
        }
    }
    
    .toast.fade-out {
        animation: toastFadeOut 0.3s ease forwards;
    }
    
    @keyframes toastFadeOut {
        from {
            opacity: 1;
            transform: translateX(0);
        }
        to {
            opacity: 0;
            transform: translateX(100%);
        }
    }
`;

// Inject animation styles
const styleSheet = document.createElement('style');
styleSheet.textContent = animationStyles;
document.head.appendChild(styleSheet);

// Export
window.Animations = Animations;
