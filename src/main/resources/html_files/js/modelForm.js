/**
 * Model Form Module - Handles creating and editing models
 */
export class ModelForm {
    constructor() {
        this.apiBaseUrl = 'http://localhost:8080/v1';
        this.fieldTypes = [
            'SINGLE_LINE_TEXT', 'MULTI_LINE_TEXT', 'NUMBER', 'BOOLEAN', 'DATE',
            'DATETIME', 'EMAIL'
        ];
        this.fieldCounter = 0;
        this.init();
    }

    init() {
        this.bindEvents();
    }

    bindEvents() {
        // Back to models list button
        document.getElementById('back-to-models-list').addEventListener('click', () => {
            this.hideForm();
        });

        // Add field button
        document.getElementById('add-field-btn').addEventListener('click', () => {
            this.addField();
        });

        // Cancel button
        document.getElementById('cancel-model-btn').addEventListener('click', () => {
            this.hideForm();
        });

        // Form submit
        document.getElementById('add-model-form').addEventListener('submit', (e) => {
            e.preventDefault();
            this.handleSubmit();
        });
    }

    showForm() {
        console.log('Showing add model form');

        // Hide models grid and show form
        document.querySelector('.models-grid').style.display = 'none';
        document.getElementById('add-model-container').style.display = 'block';

        // Reset form
        this.resetForm();

        // Add initial field
        this.addField();
    }

    hideForm() {
        // Show models grid and hide form
        document.querySelector('.models-grid').style.display = 'flex';
        document.getElementById('add-model-container').style.display = 'none';

        // Reset form
        this.resetForm();
    }

    resetForm() {
        // Clear form inputs
        document.getElementById('model-name').value = '';
        document.getElementById('model-description').value = '';

        // Clear fields container
        document.getElementById('fields-container').innerHTML = '';

        // Reset field counter
        this.fieldCounter = 0;

        // Clear any error messages
        this.clearErrors();
    }

    addField() {
        this.fieldCounter++;
        const fieldsContainer = document.getElementById('fields-container');

        const fieldDiv = document.createElement('div');
        fieldDiv.className = 'field-item';
        fieldDiv.dataset.fieldIndex = this.fieldCounter;

        fieldDiv.innerHTML = `
            <div class="field-item-header">
                <span class="field-number">Field ${this.fieldCounter}</span>
                <button type="button" class="remove-field-button" onclick="this.closest('.field-item').remove()">Remove</button>
            </div>
            
            <div class="field-form-row">
                <div class="form-group">
                    <label>Field Name</label>
                    <input type="text" name="field-name" required class="form-input" placeholder="Enter field name">
                </div>
                
                <div class="form-group">
                    <label>Field Type</label>
                    <select name="field-type" required class="form-select">
                        <option value="">Select type...</option>
                        ${this.fieldTypes.map(type =>
            `<option value="${type}">${type}</option>`
        ).join('')}
                    </select>
                </div>
                
<!--                <div class="form-group">-->
<!--                    <label>Parent Field</label>-->
<!--                    <div class="parent-field-checkbox">-->
<!--                        <input type="checkbox" name="field-parent">-->
<!--                        <span>Is parent field</span>-->
<!--                    </div>-->
<!--                </div>-->
            </div>
            
            <div class="field-description-row">
                <div class="form-group">
                    <label>Description</label>
                    <input type="text" name="field-description" class="form-input" placeholder="Enter field description (optional)">
                </div>
            </div>
        `;

        fieldsContainer.appendChild(fieldDiv);

        // Focus on the new field name input
        const nameInput = fieldDiv.querySelector('input[name="field-name"]');
        nameInput.focus();

        console.log(`Added field ${this.fieldCounter}`);
    }

    collectFormData() {
        // Get basic model info
        const name = document.getElementById('model-name').value.trim();
        const description = document.getElementById('model-description').value.trim();

        if (!name || !description) {
            throw new Error('Model name and description are required');
        }

        // Collect fields
        const fields = [];
        const fieldItems = document.querySelectorAll('#fields-container .field-item');

        if (fieldItems.length === 0) {
            throw new Error('At least one field is required');
        }

        fieldItems.forEach((fieldItem, index) => {
            console.log(fieldItem);
            const fieldName = fieldItem.querySelector('input[name="field-name"]').value.trim();
            const fieldType = fieldItem.querySelector('select[name="field-type"]').value;
            const fieldDescription = fieldItem.querySelector('input[name="field-description"]').value.trim();

            if (!fieldName) {
                throw new Error(`Field ${index + 1} name is required`);
            }

            if (!fieldType) {
                throw new Error(`Field ${index + 1} type is required`);
            }

            fields.push({
                name: fieldName,
                type: fieldType,
                description: fieldDescription || null
            });
        });

        return {
            name,
            description,
            fields
        };
    }

    async handleSubmit() {
        const submitButton = document.getElementById('create-model-btn');
        const originalText = submitButton.textContent;

        try {
            // Disable submit button
            submitButton.disabled = true;
            submitButton.textContent = 'Creating...';

            // Clear previous errors
            this.clearErrors();

            // Collect and validate form data
            const formData = this.collectFormData();
            console.log('Form data:', formData);

            // Make API call
            const token = localStorage.getItem('jwt_token');

            if (!token) {
                throw new Error('No authentication token found');
            }

            const response = await fetch(`${this.apiBaseUrl}/create-model`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(formData)
            });

            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`Failed to create model: ${response.status} ${errorText}`);
            }

            console.log('Model created successfully');

            // Show success and hide form
            this.showSuccess('Model created successfully!');

            // Wait a bit then hide form and refresh models list
            setTimeout(() => {
                this.hideForm();
                // Trigger models list refresh
                window.app.getModels().loadModels();
            }, 1500);

        } catch (error) {
            console.error('Error creating model:', error);
            this.showError(error.message);
        } finally {
            // Re-enable submit button
            submitButton.disabled = false;
            submitButton.textContent = originalText;
        }
    }

    showError(message) {
        this.clearErrors();

        const errorDiv = document.createElement('div');
        errorDiv.className = 'form-error';
        errorDiv.innerHTML = `
            <div style="background: rgba(255, 100, 100, 0.2); border: 1px solid rgba(255, 100, 100, 0.3); border-radius: 8px; padding: 1rem; margin-bottom: 1rem; color: #ff6b6b;">
                <strong>Error:</strong> ${this.escapeHtml(message)}
            </div>
        `;

        const form = document.getElementById('add-model-form');
        form.insertBefore(errorDiv, form.firstChild);
    }

    showSuccess(message) {
        this.clearErrors();

        const successDiv = document.createElement('div');
        successDiv.className = 'form-success';
        successDiv.innerHTML = `
            <div style="background: rgba(0, 200, 100, 0.2); border: 1px solid rgba(0, 200, 100, 0.3); border-radius: 8px; padding: 1rem; margin-bottom: 1rem; color: #00ff88;">
                <strong>Success:</strong> ${this.escapeHtml(message)}
            </div>
        `;

        const form = document.getElementById('add-model-form');
        form.insertBefore(successDiv, form.firstChild);
    }

    clearErrors() {
        const existingError = document.querySelector('.form-error');
        const existingSuccess = document.querySelector('.form-success');

        if (existingError) {
            existingError.remove();
        }
        if (existingSuccess) {
            existingSuccess.remove();
        }
    }

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
}