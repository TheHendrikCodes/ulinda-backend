/**
 * Navigation Module - Handles menu navigation functionality
 */
export class Navigation {
    constructor(modelsModule) {
        this.menuItems = document.querySelectorAll('.menu-item');
        this.sections = document.querySelectorAll('.section');
        this.modelsModule = modelsModule;
        this.init();
    }

    init() {
        this.bindEvents();
    }

    bindEvents() {
        this.menuItems.forEach(item => {
            item.addEventListener('click', (e) => this.handleMenuClick(e));
        });
    }

    async handleMenuClick(event) {
        const item = event.target;
        const targetSection = item.dataset.section;

        this.setActiveMenuItem(item);
        this.setActiveSection(targetSection);

        // Handle specific section logic
        if (targetSection === 'models') {
            await this.modelsModule.loadModels();
        }
    }

    setActiveMenuItem(activeItem) {
        // Remove active class from all menu items
        this.menuItems.forEach(menuItem => menuItem.classList.remove('active'));

        // Add active class to clicked menu item
        activeItem.classList.add('active');
    }

    setActiveSection(targetSection) {
        // Remove active class from all sections
        this.sections.forEach(section => section.classList.remove('active'));

        // Add active class to corresponding section
        const targetSectionElement = document.getElementById(targetSection);
        if (targetSectionElement) {
            targetSectionElement.classList.add('active');
        }
    }
}