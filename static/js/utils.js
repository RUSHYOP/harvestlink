// =================================================================
// TOAST NOTIFICATION SYSTEM
// =================================================================

class ToastManager {
    constructor() {
        this.container = null;
        this.init();
    }

    init() {
        // Create toast container if it doesn't exist
        if (!document.querySelector('.toast-container')) {
            this.container = document.createElement('div');
            this.container.className = 'toast-container';
            document.body.appendChild(this.container);
        } else {
            this.container = document.querySelector('.toast-container');
        }
    }

    show(message, type = 'info', duration = 4000) {
        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        
        const icons = {
            success: '✓',
            error: '✗',
            warning: '⚠',
            info: 'ℹ'
        };

        toast.innerHTML = `
            <span class="toast-icon">${icons[type] || icons.info}</span>
            <span class="toast-message">${message}</span>
            <button class="toast-close" onclick="this.parentElement.remove()">×</button>
        `;

        this.container.appendChild(toast);

        // Auto remove after duration
        if (duration > 0) {
            setTimeout(() => {
                toast.style.animation = 'slideUp 0.3s ease-out';
                setTimeout(() => toast.remove(), 300);
            }, duration);
        }

        return toast;
    }

    success(message, duration = 4000) {
        return this.show(message, 'success', duration);
    }

    error(message, duration = 5000) {
        return this.show(message, 'error', duration);
    }

    warning(message, duration = 4000) {
        return this.show(message, 'warning', duration);
    }

    info(message, duration = 4000) {
        return this.show(message, 'info', duration);
    }
}

// Global toast instance
const toast = new ToastManager();

// =================================================================
// LOADING INDICATOR
// =================================================================

class LoadingManager {
    constructor() {
        this.overlay = null;
        this.init();
    }

    init() {
        this.overlay = document.createElement('div');
        this.overlay.className = 'loading-overlay hidden';
        this.overlay.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100vw;
            height: 100vh;
            background: rgba(17, 24, 39, 0.7);
            backdrop-filter: blur(4px);
            display: flex;
            align-items: center;
            justify-content: center;
            z-index: 99999;
        `;
        this.overlay.innerHTML = '<div class="loading-spinner"></div>';
        document.body.appendChild(this.overlay);
    }

    show() {
        this.overlay.classList.remove('hidden');
    }

    hide() {
        this.overlay.classList.add('hidden');
    }
}

// Global loading instance
const loading = new LoadingManager();

// =================================================================
// FORM VALIDATION
// =================================================================

const Validators = {
    email(value) {
        const pattern = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
        return pattern.test(value);
    },

    phone(value) {
        const cleaned = value.replace(/[\s\-\+]/g, '');
        return /^[0-9]{10,15}$/.test(cleaned);
    },

    required(value) {
        return value !== null && value !== undefined && value.toString().trim() !== '';
    },

    minLength(value, min) {
        return value.toString().length >= min;
    },

    maxLength(value, max) {
        return value.toString().length <= max;
    },

    numeric(value) {
        return !isNaN(parseFloat(value)) && isFinite(value);
    },

    positive(value) {
        return this.numeric(value) && parseFloat(value) > 0;
    },

    min(value, minValue) {
        return this.numeric(value) && parseFloat(value) >= minValue;
    },

    max(value, maxValue) {
        return this.numeric(value) && parseFloat(value) <= maxValue;
    }
};

function validateForm(formElement) {
    let isValid = true;
    const inputs = formElement.querySelectorAll('input[required], select[required], textarea[required]');

    inputs.forEach(input => {
        const value = input.value.trim();
        let error = null;

        // Clear previous error
        const existingError = input.parentElement.querySelector('.form-error');
        if (existingError) existingError.remove();
        input.style.borderColor = '';

        // Required validation
        if (!Validators.required(value)) {
            error = 'This field is required';
            isValid = false;
        }
        // Email validation
        else if (input.type === 'email' && !Validators.email(value)) {
            error = 'Please enter a valid email address';
            isValid = false;
        }
        // Phone validation
        else if (input.type === 'tel' && !Validators.phone(value)) {
            error = 'Please enter a valid phone number (10-15 digits)';
            isValid = false;
        }
        // Number validations
        else if (input.type === 'number') {
            if (!Validators.numeric(value)) {
                error = 'Please enter a valid number';
                isValid = false;
            } else if (input.min && parseFloat(value) < parseFloat(input.min)) {
                error = `Value must be at least ${input.min}`;
                isValid = false;
            } else if (input.max && parseFloat(value) > parseFloat(input.max)) {
                error = `Value must be no more than ${input.max}`;
                isValid = false;
            }
        }
        // Password confirmation
        else if (input.id.includes('ConfirmPassword')) {
            const passwordId = input.id.replace('Confirm', '');
            const passwordField = document.getElementById(passwordId);
            if (passwordField && value !== passwordField.value) {
                error = 'Passwords do not match';
                isValid = false;
            }
        }

        // Display error
        if (error) {
            input.style.borderColor = 'var(--error)';
            const errorDiv = document.createElement('div');
            errorDiv.className = 'form-error';
            errorDiv.textContent = error;
            input.parentElement.appendChild(errorDiv);
        }
    });

    return isValid;
}

// =================================================================
// API HELPER FUNCTIONS
// =================================================================

async function apiRequest(url, options = {}) {
    try {
        loading.show();
        
        const defaultOptions = {
            headers: {
                'Content-Type': 'application/json',
            },
        };

        const response = await fetch(url, { ...defaultOptions, ...options });
        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.error || data.message || 'Request failed');
        }

        return data;
    } catch (error) {
        console.error('API Error:', error);
        toast.error(error.message || 'An error occurred. Please try again.');
        throw error;
    } finally {
        loading.hide();
    }
}

// =================================================================
// UTILITY FUNCTIONS
// =================================================================

function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

function throttle(func, limit) {
    let inThrottle;
    return function(...args) {
        if (!inThrottle) {
            func.apply(this, args);
            inThrottle = true;
            setTimeout(() => inThrottle = false, limit);
        }
    };
}

function formatDate(dateString) {
    const options = { 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    };
    return new Date(dateString).toLocaleDateString('en-US', options);
}

function formatCurrencyAdvanced(amount) {
    return new Intl.NumberFormat('en-IN', {
        style: 'currency',
        currency: 'INR',
        minimumFractionDigits: 2
    }).format(amount);
}

function sanitizeHTML(str) {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
}

// =================================================================
// LOCAL STORAGE HELPER
// =================================================================

const Storage = {
    set(key, value) {
        try {
            localStorage.setItem(key, JSON.stringify(value));
            return true;
        } catch (error) {
            console.error('Storage error:', error);
            return false;
        }
    },

    get(key) {
        try {
            const item = localStorage.getItem(key);
            return item ? JSON.parse(item) : null;
        } catch (error) {
            console.error('Storage error:', error);
            return null;
        }
    },

    remove(key) {
        try {
            localStorage.removeItem(key);
            return true;
        } catch (error) {
            console.error('Storage error:', error);
            return false;
        }
    },

    clear() {
        try {
            localStorage.clear();
            return true;
        } catch (error) {
            console.error('Storage error:', error);
            return false;
        }
    }
};

// =================================================================
// EXPORT FOR MODULE USAGE (if needed)
// =================================================================

if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        toast,
        loading,
        Validators,
        validateForm,
        apiRequest,
        debounce,
        throttle,
        formatDate,
        formatCurrencyAdvanced,
        sanitizeHTML,
        Storage
    };
}
