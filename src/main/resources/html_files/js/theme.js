/**
 * Theme Module - Handles dynamic theme color changes
 */
export class Theme {
    constructor() {
        this.beginColorPicker = document.getElementById('begin-color');
        this.endColorPicker = document.getElementById('end-color');
        this.beginValueDisplay = document.getElementById('begin-value');
        this.endValueDisplay = document.getElementById('end-value');
        this.init();
    }

    init() {
        this.bindEvents();
        this.updateTheme(); // Initialize theme on load
    }

    bindEvents() {
        this.beginColorPicker.addEventListener('input', () => this.updateTheme());
        this.endColorPicker.addEventListener('input', () => this.updateTheme());
    }

    updateTheme() {
        const beginColor = this.beginColorPicker.value;
        const endColor = this.endColorPicker.value;

        // Update CSS custom properties
        this.setCSSProperty('--color-begin', beginColor);
        this.setCSSProperty('--color-end', endColor);

        // Update display values
        this.updateDisplayValues(beginColor, endColor);
    }

    setCSSProperty(property, value) {
        document.documentElement.style.setProperty(property, value);
    }

    updateDisplayValues(beginColor, endColor) {
        if (this.beginValueDisplay) {
            this.beginValueDisplay.textContent = beginColor;
        }
        if (this.endValueDisplay) {
            this.endValueDisplay.textContent = endColor;
        }
    }

    // Method to programmatically set colors
    setColors(beginColor, endColor) {
        this.beginColorPicker.value = beginColor;
        this.endColorPicker.value = endColor;
        this.updateTheme();
    }

    // Method to get current colors
    getCurrentColors() {
        return {
            begin: this.beginColorPicker.value,
            end: this.endColorPicker.value
        };
    }
}