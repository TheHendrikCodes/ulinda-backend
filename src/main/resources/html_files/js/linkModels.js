export class LinkModels {
    constructor() {
        this.apiBaseUrl = 'http://localhost:8080';
        this.init();
    }

    init() {
        this.bindEvents()
    }

    bindEvents() {
        document.getElementById('link-models-btn').addEventListener('click', async (e) => {
            e.preventDefault();
            window.app.navigation.setActiveSection('section-link-models');
            this.getModels();
        });

        // Add event listener for the create link button
        document.getElementById('create-link-btn').addEventListener('click', async (e) => {
            e.preventDefault();
            await this.createLink();
        });
    }

    async getModels() {

        //document.getElementById('user-management-div').classList.add('active');
        //document.getElementById('admin').classList.remove('active');

        try {

            // Make API call
            const token = localStorage.getItem('jwt_token');

            if (!token) {
                throw new Error('No authentication token found');
            }

            const response = await fetch(`${this.apiBaseUrl}/v1/models`, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();

            // Render Users
            this.showModelsSelection(data);

        } catch (error) {
            console.log(error);
        }
    }

    showModelsSelection(data) {
        console.log("Model Information : ");
        console.log(data);

        const sourceDropdown = document.getElementById('source-model');
        const targetDropdown = document.getElementById('target-model');

        // Clear existing options (keep the default option)
        sourceDropdown.innerHTML = '<option value="">Select a model...</option>';
        targetDropdown.innerHTML = '<option value="">Select a model...</option>';

        // Populate both dropdowns with the models
        data.models.forEach(model => {
            const sourceOption = document.createElement('option');
            sourceOption.value = model.id;
            sourceOption.textContent = model.name;
            sourceDropdown.appendChild(sourceOption);

            const targetOption = document.createElement('option');
            targetOption.value = model.id;
            targetOption.textContent = model.name;
            targetDropdown.appendChild(targetOption);
        });

        // Add event listeners to enable/disable the create link button
        const createLinkBtn = document.getElementById('create-link-btn');

        const checkDropdowns = () => {
            const sourceValue = sourceDropdown.value;
            const targetValue = targetDropdown.value;
            createLinkBtn.disabled = !sourceValue || !targetValue || sourceValue === targetValue;
        };

        sourceDropdown.addEventListener('change', checkDropdowns);
        targetDropdown.addEventListener('change', checkDropdowns);
    }

    async createLink() {
        const sourceDropdown = document.getElementById('source-model');
        const targetDropdown = document.getElementById('target-model');
        const createLinkBtn = document.getElementById('create-link-btn');

        const sourceModelId = sourceDropdown.value;
        const targetModelId = targetDropdown.value;

        if (!sourceModelId || !targetModelId || sourceModelId === targetModelId) {
            alert('Please select two different models to link');
            return;
        }

        // Disable button and show loading state
        createLinkBtn.disabled = true;
        const originalText = createLinkBtn.textContent;
        createLinkBtn.textContent = 'Creating Link...';

        try {
            const token = localStorage.getItem('jwt_token');

            if (!token) {
                throw new Error('No authentication token found');
            }

            const response = await fetch(`${this.apiBaseUrl}/v1/models/link-models`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    model1Id: sourceModelId,
                    model2Id: targetModelId
                })
            });

            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`HTTP error! status: ${response.status}, message: ${errorText}`);
            }

            // Success
            alert('Models linked successfully!');

            // Reset dropdowns
            sourceDropdown.selectedIndex = 0;
            targetDropdown.selectedIndex = 0;

        } catch (error) {
            console.error('Error linking models:', error);
            alert(`Failed to link models: ${error.message}`);
        } finally {
            // Re-enable button and restore text
            createLinkBtn.textContent = originalText;
            createLinkBtn.disabled = true; // Keep disabled until new selections are made
        }
    }


}