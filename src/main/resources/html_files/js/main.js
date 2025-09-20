/**
 * Main Application Entry Point
 * Initializes all modules and handles application startup
 */
import { Navigation } from './navigation.js';
import { Theme } from './theme.js';
import { Records } from './records.js';
import { Models } from './models.js';
import { ModelForm } from './modelForm.js';
import { Login } from "./login.js";
import { Admin } from './admin.js';
import { Logout } from "./logout.js";
import { LinkModels } from './linkModels.js';

class App {
    constructor() {
        this.navigation = null;
        this.theme = null;
        this.records = null;
        this.models = null;
        this.modelForm = null;
        this.login = null;
        this.admin = null;
        this.logout = null;
        this.linkModels = null;
        this.modelsAlreadyInitialized = false;
        this.init();
    }

    init() {
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => this.checkAuthAndInitialize());
        } else {
            this.checkAuthAndInitialize();
        }
    }

    checkAuthAndInitialize() {
        // Check if user is already logged in
        const token = localStorage.getItem('jwt_token');

        if (token) {
            // User has token, initialize main app directly
            console.log('User already logged in, initializing main app...');
            this.initializeModules();
            this.hideLogin();
        } else {
            // No token, show login
            console.log('No token found, showing login...');
            this.initializeLogin();
        }
    }

    initializeLogin() {
        // Pass a callback function that will be called when login succeeds
        this.login = new Login((loginData) => {
            console.log('Login callback triggered with data:', loginData);
            this.initializeModules();
        });
    }

    hideLogin() {
        const loginPage = document.getElementById('login-page');
        if (loginPage) {
            loginPage.classList.remove('active');
            loginPage.style.display = 'none';
        }

        // Show navigation (change from 'block' to 'flex')
        const nav = document.querySelector('.top-menu');
        if (nav) {
            nav.style.display = 'flex'; // Changed from 'block' to 'flex'
        }

        //Show model view
        document.getElementById('models').classList.add('active');
    }

    initializeModules() {
        if (this.modelsAlreadyInitialized) {
            this.hideLogin();
            console.log('Models already initialized...');
            return;
        }
        try {
            // Hide login if still visible
            this.hideLogin();

            // Initialize all modules
            this.records = new Records();
            window.recordsInstance = this.records; // Make globally accessible for column toggle callbacks
            console.log('Records module initialized:', this.records);

            this.modelForm = new ModelForm();
            console.log('Model form module initialized:', this.modelForm);

            this.models = new Models(this.records, this.modelForm);
            console.log('Models module initialized:', this.models);
            this.models.loadModels();

            this.navigation = new Navigation(this.models);
            console.log('Navigation module initialized:', this.navigation);

            this.theme = new Theme();
            console.log('Theme module initialized:', this.theme);
            this.theme.setColors('#222020', '#222020');

            this.admin = new Admin();
            console.log('Admin module initialized:', this.admin);

            // Add this line to bind logout event after modules are initialized
            this.bindLogoutEvent();

            this.logout = new Logout();
            console.log('Logout module initialized')

            this.linkModels = new LinkModels();
            console.log('LinkModels module initialized');

            console.log('Dynamic Theme App initialized successfully');
            this.modelsAlreadyInitialized = true;

        } catch (error) {
            console.error('Error initializing application:', error);
        }
    }

    // Add this method to bind the logout event
    bindLogoutEvent() {

        const logoutButton = document.getElementById('logout-button');
        if (logoutButton) {
            logoutButton.addEventListener('click', () => {
                console.log('Logging out');
                localStorage.removeItem('jwt_token');
                this.logout.logout();
                //this.resetApplicationState();
                //this.checkAuthAndInitialize();
            });
        }
    }

// Add this method to reset application state on logout
    resetApplicationState() {
        // Reset all modules to null
        this.navigation = null;
        this.theme = null;
        this.records = null;
        this.models = null;
        this.modelForm = null;
        this.admin = null;

        console.log('Application state reset');
    }

    // Public methods for external access if needed
    getNavigation() {
        return this.navigation;
    }

    getTheme() {
        return this.theme;
    }

    getRecords() {
        return this.records;
    }

    getModels() {
        return this.models;
    }

    getModelForm() {
        return this.modelForm;
    }
}

// Initialize the application
const app = new App();

// Make app available globally if needed for debugging
window.app = app;