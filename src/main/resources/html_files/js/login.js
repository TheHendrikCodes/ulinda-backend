export class Login {
    constructor(onLoginSuccess) {
        this.apiBaseUrl = 'http://localhost:8080';
        this.onLoginSuccess = onLoginSuccess; // Callback function
        this.init();
    }

    init() {
        this.bindEvents();
    }

    bindEvents() {
        document.getElementById('login-button-sign-in').addEventListener('click', async (e) => {
            e.preventDefault();
            await this.login();
        });
        
        document.getElementById('login-form-password').addEventListener('keypress', async (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                await this.login();
            }
        });
    }

    async login() {
        try {
            const username = document.getElementById('login-form-username').value;
            const password = document.getElementById('login-form-password').value;

            if (!username || !password) {
                alert('Please enter both username and password.');
                return;
            }

            const response = await fetch(`${this.apiBaseUrl}/auth/login`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    username: username,
                    password: password
                })
            });

            if (response.ok) {
                const data = await response.json();
                console.log('Login successful!', data);

                // Store JWT token
                localStorage.setItem('jwt_token', data.token);

                // Hide login page
                this.showMainApp();

                // Call the success callback to initialize main app
                if (this.onLoginSuccess) {
                    this.onLoginSuccess(data);
                }

            } else {
                const errorData = await response.json().catch(() => ({}));
                console.error('Login failed:', response.status, errorData);
                alert('Login failed. Please check your credentials.');
            }

        } catch (error) {
            console.error('Network error:', error);
            alert('Network error. Please try again.');
        }
    }

    showMainApp() {
        // Hide login page
        document.getElementById('login-page').classList.remove('active');
        document.getElementById('login-page').style.display = 'none';

        // Show navigation (change from 'block' to 'flex')
        const nav = document.querySelector('.top-menu');
        if (nav) {
            nav.style.display = 'flex'; // Changed from 'block' to 'flex'
        }

        console.log('Login page hidden, ready for main app...');
    }
}