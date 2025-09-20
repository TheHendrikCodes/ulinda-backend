export class Logout {
    constructor(onLoginSuccess) {
        this.apiBaseUrl = 'http://localhost:8080';
        this.onLoginSuccess = onLoginSuccess; // Callback function
        this.init();
    }

    init() {
        this.bindEvents();
    }

    bindEvents() {
        // document.getElementById('login-button-sign-in').addEventListener('click', async (e) => {
        //     e.preventDefault();
        //     await this.login();
        // });
    }

    logout() {
        // Clear JWT token
        localStorage.removeItem('jwt_token');

        // Hide navigation
        const nav = document.querySelector('.top-menu');
        if (nav) {
            nav.style.display = 'none';
        }

        // Hide all sections
        const sections = document.querySelectorAll('.section');
        sections.forEach(section => {
            section.classList.remove('active');
        });

        // Show login page
        console.log('Show login page');
        const loginPage = document.getElementById('login-page');
        if (loginPage) {
            loginPage.classList.add('active');
            loginPage.style.display = 'block';
        }

        // Clear form inputs
        document.getElementById('login-form-username').value = '';
        document.getElementById('login-form-password').value = '';

        console.log('User logged out successfully');
    }
}