/**
 * Models Module - Handles model list display and management
 */
export class Models {
    constructor(recordsModule, modelFormModule) {
        this.apiBaseUrl = 'http://localhost:8080/v1';
        this.recordsModule = recordsModule;
        this.modelFormModule = modelFormModule;
        this.init();
    }

    init() {
        // Models module doesn't need immediate event binding
        // Events are bound when models are rendered
    }

    async loadModels() {
        const modelsGrid = document.querySelector('.models-grid');
        const modelsHeader = document.querySelector('.models-header');

        // Ensure models view is visible and other views are hidden
        modelsHeader.style.display = 'flex';
        modelsGrid.style.display = 'flex';
        document.getElementById('model-records-container').style.display = 'none';
        document.getElementById('add-model-container').style.display = 'none';
        document.getElementById('record-detail-container').style.display = 'none';
        document.getElementById('add-record-container').style.display = 'none';

        try {
            // Show loading state
            modelsGrid.innerHTML = '<div class="loading">Loading models...</div>';

            // Make API call
            const token = localStorage.getItem('jwt_token');

            if (!token) {
                throw new Error('No authentication token found');
            }

            const response = await fetch(`${this.apiBaseUrl}/models`, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();

            // Render models
            this.renderModels(data.models);

        } catch (error) {
            console.error('Error loading models:', error);
            modelsGrid.innerHTML = `
                <div class="error-message">
                    <h3>Error Loading Models</h3>
                    <p>Failed to load models from the API. Please check if the server is running.</p>
                    <p class="error-details">${error.message}</p>
                </div>
            `;
        }
        this.bindAddNewModelEvent();
    }

    renderModels(models) {
        const modelsGrid = document.querySelector('.models-grid');

        if (!models || models.length === 0) {
            modelsGrid.innerHTML = '<div class="no-models">No models found.</div>';
            return;
        }

        const modelsHTML = models.map(model => `
            <div class="model-card" data-model-id="${model.id}" data-model-name="${this.escapeHtml(model.name)}">
                <div class="model-card-header">
                    <div class="model-card-content">
                        <h3>${this.escapeHtml(model.name)}</h3>
                        <p>${this.escapeHtml(model.description)}</p>
                    </div>
                    <button class="model-edit-button" data-action="edit" data-model-id="${model.id}">Edit</button>
                </div>
                <div class="model-id">ID: ${model.id}</div>
            </div>
        `).join('');

        modelsGrid.innerHTML = modelsHTML;

        // Add click handlers for model cards and edit buttons
        this.bindModelCardEvents();

    }

    bindModelCardEvents() {
        const modelCards = document.querySelectorAll('.model-card');
        console.log(`Found ${modelCards.length} model cards to bind events to`);

        modelCards.forEach(card => {
            // Handle clicks on the card content area (not edit button)
            card.addEventListener('click', (e) => {
                // Don't trigger if clicking on edit button
                if (e.target.classList.contains('model-edit-button')) {
                    console.log('Edit button clicked for model:', e.target.dataset.modelId);
                    this.handleEditModel(e.target.dataset.modelId);
                    return;
                }

                // Handle card click to view records
                console.log('Model card clicked!');
                const modelId = card.dataset.modelId;
                const modelName = card.dataset.modelName;
                console.log(`Model ID: ${modelId}, Model Name: ${modelName}`);

                if (this.recordsModule) {
                    this.recordsModule.showModelRecords(modelId, modelName);
                } else {
                    console.error('Records module not available');
                }
            });
        });
    }

    bindAddNewModelEvent() {
        console.log('**************** Add new model button **********');
        const addButton = document.getElementById('add-new-model-btn');
        if (addButton) {
            // Remove existing event listeners
            addButton.replaceWith(addButton.cloneNode(true));
            const newAddButton = document.getElementById('add-new-model-btn');

            newAddButton.addEventListener('click', () => {
                console.log('Add New Model clicked');
                this.handleAddNewModel();
            });
        }
    }

    handleEditModel(modelId) {
        console.log('Handling edit model:', modelId);
        // TODO: Implement model editing functionality
        alert(`Edit model functionality not yet implemented for model: ${modelId}`);
    }

    handleAddNewModel() {
        console.log('Handling add new model');

        if (this.modelFormModule) {
            this.modelFormModule.showForm();
        } else {
            console.error('Model form module not available');
            alert('Model form functionality not available');
        }
    }

    // Utility method to escape HTML to prevent XSS
    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
}