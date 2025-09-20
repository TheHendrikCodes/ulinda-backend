/**
 * Records Module - Handles model records display, pagination, sorting, and editing
 */
export class Records {
    constructor() {
        this.apiBaseUrl = 'http://localhost:8080/v1';
        this.currentModel = null;
        this.currentSortField = 'created_at';
        this.currentSortOrder = 'desc';
        this.currentCursor = null;
        this.limit = 5;
        this.fields = [];
        this.currentRecords = [];
        this.currentPagination = null;
        this.currentRecord = null;
        this.eventDelegationSetup = false;
        this.isSearchMode = false;
        this.currentSearchCriteria = null;
        this.visibleColumns = new Set();
        this.init();
    }

    init() {
        this.bindEvents();
    }

    bindEvents() {
        // Back to models button
        document.getElementById('back-to-models').addEventListener('click', () => {
            this.hideRecords();
        });

        // Back to records button
        document.getElementById('back-to-records').addEventListener('click', () => {
            this.hideRecordDetail();
        });

        // Add record button
        document.getElementById('add-record-btn').addEventListener('click', () => {
            this.showAddRecordForm();
        });

        // Back to records from add form
        document.getElementById('back-to-records-from-add').addEventListener('click', () => {
            this.hideAddRecordForm();
        });

        // Cancel add record button
        document.getElementById('cancel-add-record-btn').addEventListener('click', () => {
            this.hideAddRecordForm();
        });

        // Add record form submit
        document.getElementById('add-record-form').addEventListener('submit', (e) => {
            e.preventDefault();
            this.handleAddRecordSubmit();
        });

        // Pagination controls
        document.getElementById('prev-page').addEventListener('click', () => {
            this.loadPreviousPage();
        });

        document.getElementById('next-page').addEventListener('click', () => {
            this.loadNextPage();
        });

        // Column visibility controls
        document.getElementById('toggle-columns-btn').addEventListener('click', () => {
            this.toggleColumnSelector();
        });

        document.getElementById('close-column-selector').addEventListener('click', () => {
            this.hideColumnSelector();
        });
    }

    bindRecordDetailEvents() {
        // Edit record button
        const editBtn = document.getElementById('edit-record-btn');
        if (editBtn) {
            editBtn.replaceWith(editBtn.cloneNode(true));
            const newEditBtn = document.getElementById('edit-record-btn');
            newEditBtn.addEventListener('click', () => {
                this.enterEditMode();
            });
        }

        // Save record button
        const saveBtn = document.getElementById('save-record-btn');
        if (saveBtn) {
            saveBtn.replaceWith(saveBtn.cloneNode(true));
            const newSaveBtn = document.getElementById('save-record-btn');
            newSaveBtn.addEventListener('click', () => {
                this.saveRecord();
            });
        }

        // Cancel edit button
        const cancelBtn = document.getElementById('cancel-edit-btn');
        if (cancelBtn) {
            cancelBtn.replaceWith(cancelBtn.cloneNode(true));
            const newCancelBtn = document.getElementById('cancel-edit-btn');
            newCancelBtn.addEventListener('click', () => {
                this.exitEditMode();
            });
        }
    }

    setupTableEventDelegation() {
        const tableBody = document.getElementById('table-body');
        const tableHeaders = document.getElementById('table-headers');

        if (!tableBody) return;

        // Existing row click handler
        tableBody.addEventListener('click', (event) => {
            const row = event.target.closest('tr.record-row');
            if (row && row.dataset.recordId) {
                const recordId = row.dataset.recordId;
                const record = this.currentRecords?.find(r => r.id === recordId);
                if (record) {
                    this.showRecordDetail(record);
                }
            }
        });

        // Search dropdown handlers
        if (tableHeaders) {
            tableHeaders.addEventListener('change', (event) => {
                if (event.target.classList.contains('date-search-type')) {
                    this.handleDateSearchTypeChange(event.target);
                } else if (event.target.classList.contains('number-search-type')) {
                    this.handleNumberSearchTypeChange(event.target);
                } else if (event.target.classList.contains('text-search-type')) {
                    this.handleTextSearchTypeChange(event.target);
                }
                
                // Update search button state after any dropdown change
                setTimeout(() => this.updateSearchUI(), 0);
            });

            // Add input event listeners for real-time search button state updates
            tableHeaders.addEventListener('input', (event) => {
                if (event.target.classList.contains('text-search-value') ||
                    event.target.classList.contains('number-search-value') ||
                    event.target.classList.contains('date-search-from') ||
                    event.target.classList.contains('date-search-to')) {
                    
                    // Update search button state after input changes
                    setTimeout(() => this.updateSearchUI(), 0);
                }
            });

            // Search button handler
            tableHeaders.addEventListener('click', (event) => {
                if (event.target.id === 'perform-search-btn') {
                    if (this.isSearchMode) {
                        this.cancelSearch();
                    } else {
                        this.performSearch();
                    }
                }
            });
        }
    }

    handleDateSearchTypeChange(selectElement) {
        const container = selectElement.closest('.date-search-container');
        const inputsDiv = container.querySelector('.date-search-inputs');
        const fromInput = container.querySelector('.date-search-from');
        const toInput = container.querySelector('.date-search-to');

        const selectedType = selectElement.value;

        if (selectedType === '') {
            inputsDiv.style.display = 'none';
            fromInput.value = '';
            toInput.value = '';
        } else {
            inputsDiv.style.display = 'flex';

            if (selectedType === 'between') {
                toInput.style.display = 'block';
                fromInput.placeholder = 'From';
            } else {
                toInput.style.display = 'none';
                toInput.value = '';

                switch (selectedType) {
                    case 'on':
                        fromInput.placeholder = 'Select date';
                        break;
                    case 'before':
                        fromInput.placeholder = 'Before date';
                        break;
                    case 'after':
                        fromInput.placeholder = 'After date';
                        break;
                }
            }
        }
    }

    handleNumberSearchTypeChange(selectElement) {
        const container = selectElement.closest('.number-search-container');
        const inputsDiv = container.querySelector('.number-search-inputs');
        const valueInput = container.querySelector('.number-search-value');

        const selectedType = selectElement.value;

        if (selectedType === '') {
            inputsDiv.style.display = 'none';
            valueInput.value = '';
        } else {
            inputsDiv.style.display = 'flex';

            switch (selectedType) {
                case 'equals':
                    valueInput.placeholder = 'Enter number';
                    break;
                case 'greater':
                    valueInput.placeholder = 'Greater than';
                    break;
                case 'less':
                    valueInput.placeholder = 'Less than';
                    break;
            }
        }
    }

    handleTextSearchTypeChange(selectElement) {
        const container = selectElement.closest('.text-search-container');
        const inputsDiv = container.querySelector('.text-search-inputs');
        const valueInput = container.querySelector('.text-search-value');

        const selectedType = selectElement.value;

        if (selectedType === '') {
            inputsDiv.style.display = 'none';
            valueInput.value = '';
        } else {
            inputsDiv.style.display = 'flex';

            switch (selectedType) {
                case 'contains':
                    valueInput.placeholder = 'Text to find';
                    break;
                case 'equals':
                    valueInput.placeholder = 'Exact text';
                    break;
                case 'starts_with':
                    valueInput.placeholder = 'Starts with';
                    break;
                case 'ends_with':
                    valueInput.placeholder = 'Ends with';
                    break;
                case 'not_contains':
                    valueInput.placeholder = 'Text to exclude';
                    break;
                case 'not_equals':
                    valueInput.placeholder = 'Text not equal to';
                    break;
            }
        }
    }

    async performSearch() {
        console.log('Search button clicked! Collecting search criteria...');
        
        // Check if there are valid search criteria
        if (!this.hasValidSearchCriteria()) {
            console.log('No valid search criteria found, search cancelled');
            return;
        }
        
        // Collect search criteria from all search inputs
        this.currentSearchCriteria = this.collectSearchCriteria();
        
        if (!this.currentSearchCriteria) {
            console.log('No search criteria collected, search cancelled');
            return;
        }
        
        // Toggle to search mode
        this.isSearchMode = true;
        this.updateSearchUI();
        
        // Disable all search inputs
        this.disableSearchInputs();
        
        // Reset cursor for search
        this.currentCursor = null;
        
        // Load records with search criteria
        await this.loadRecords();
    }

    cancelSearch() {
        console.log('Cancel search clicked!');
        
        // Clear search criteria
        this.currentSearchCriteria = null;
        
        // Toggle out of search mode
        this.isSearchMode = false;
        this.updateSearchUI();
        
        // Enable all search inputs
        this.enableSearchInputs();
        
        // Clear all search input values
        this.clearSearchInputs();
        
        // Reset cursor
        this.currentCursor = null;
        
        // Load records without search criteria
        this.loadRecords();
    }

    collectSearchCriteria() {
        const criteria = {};
        
        // Collect text search criteria
        document.querySelectorAll('.text-search-container').forEach(container => {
            const selectElement = container.querySelector('.text-search-type');
            const inputElement = container.querySelector('.text-search-value');
            
            if (selectElement && inputElement && selectElement.value && inputElement.value.trim()) {
                const fieldId = selectElement.dataset.fieldId;
                criteria[fieldId] = {
                    type: 'text',
                    operation: selectElement.value,
                    value: inputElement.value.trim()
                };
            }
        });
        
        // Collect number search criteria
        document.querySelectorAll('.number-search-container').forEach(container => {
            const selectElement = container.querySelector('.number-search-type');
            const inputElement = container.querySelector('.number-search-value');
            
            if (selectElement && inputElement && selectElement.value && inputElement.value.trim()) {
                const fieldId = selectElement.dataset.fieldId;
                criteria[fieldId] = {
                    type: 'number',
                    operation: selectElement.value,
                    value: parseFloat(inputElement.value)
                };
            }
        });
        
        // Collect boolean search criteria
        document.querySelectorAll('.boolean-search-container').forEach(container => {
            const selectElement = container.querySelector('.boolean-search-type');
            
            if (selectElement && selectElement.value) {
                const fieldId = selectElement.dataset.fieldId;
                criteria[fieldId] = {
                    type: 'boolean',
                    operation: 'equals',
                    value: selectElement.value === 'true'
                };
            }
        });
        
        // Collect date search criteria
        document.querySelectorAll('.date-search-container').forEach(container => {
            const selectElement = container.querySelector('.date-search-type');
            const fromInput = container.querySelector('.date-search-from');
            const toInput = container.querySelector('.date-search-to');
            
            if (selectElement && selectElement.value && fromInput && fromInput.value) {
                const fieldId = selectElement.dataset.fieldId;
                const criteriaItem = {
                    type: 'date',
                    operation: selectElement.value,
                    value: fromInput.value
                };
                
                if (selectElement.value === 'between' && toInput && toInput.value) {
                    criteriaItem.toValue = toInput.value;
                }
                
                criteria[fieldId] = criteriaItem;
            }
        });
        
        console.log('Collected search criteria:', criteria);
        return Object.keys(criteria).length > 0 ? criteria : null;
    }

    hasValidSearchCriteria() {
        // Check text search criteria
        const textContainers = document.querySelectorAll('.text-search-container');
        for (const container of textContainers) {
            const selectElement = container.querySelector('.text-search-type');
            const inputElement = container.querySelector('.text-search-value');
            if (selectElement && inputElement && selectElement.value && inputElement.value.trim()) {
                return true;
            }
        }
        
        // Check number search criteria
        const numberContainers = document.querySelectorAll('.number-search-container');
        for (const container of numberContainers) {
            const selectElement = container.querySelector('.number-search-type');
            const inputElement = container.querySelector('.number-search-value');
            if (selectElement && inputElement && selectElement.value && inputElement.value.trim()) {
                return true;
            }
        }
        
        // Check boolean search criteria
        const booleanContainers = document.querySelectorAll('.boolean-search-container');
        for (const container of booleanContainers) {
            const selectElement = container.querySelector('.boolean-search-type');
            if (selectElement && selectElement.value) {
                return true;
            }
        }
        
        // Check date search criteria
        const dateContainers = document.querySelectorAll('.date-search-container');
        for (const container of dateContainers) {
            const selectElement = container.querySelector('.date-search-type');
            const fromInput = container.querySelector('.date-search-from');
            if (selectElement && selectElement.value && fromInput && fromInput.value) {
                return true;
            }
        }
        
        return false;
    }

    updateSearchUI() {
        const searchButton = document.getElementById('perform-search-btn');
        if (searchButton) {
            searchButton.textContent = this.isSearchMode ? 'Cancel Search' : 'Search';
            searchButton.className = this.isSearchMode ? 'search-button cancel-search' : 'search-button';
            
            // Disable search button if no valid criteria and not in search mode
            if (!this.isSearchMode) {
                const hasValidCriteria = this.hasValidSearchCriteria();
                searchButton.disabled = !hasValidCriteria;
                if (!hasValidCriteria) {
                    searchButton.classList.add('disabled');
                } else {
                    searchButton.classList.remove('disabled');
                }
            } else {
                searchButton.disabled = false;
                searchButton.classList.remove('disabled');
            }
        }
        
        // Update table header styling to indicate search mode
        const tableHeaders = document.getElementById('table-headers');
        if (tableHeaders) {
            if (this.isSearchMode) {
                tableHeaders.classList.add('search-mode');
            } else {
                tableHeaders.classList.remove('search-mode');
            }
        }
    }

    disableSearchInputs() {
        // Disable all search input elements
        const searchInputs = [
            '.text-search-type', '.text-search-value',
            '.number-search-type', '.number-search-value',
            '.boolean-search-type',
            '.date-search-type', '.date-search-from', '.date-search-to'
        ];
        
        searchInputs.forEach(selector => {
            document.querySelectorAll(selector).forEach(element => {
                element.disabled = true;
            });
        });
    }

    enableSearchInputs() {
        // Enable all search input elements
        const searchInputs = [
            '.text-search-type', '.text-search-value',
            '.number-search-type', '.number-search-value',
            '.boolean-search-type',
            '.date-search-type', '.date-search-from', '.date-search-to'
        ];
        
        searchInputs.forEach(selector => {
            document.querySelectorAll(selector).forEach(element => {
                element.disabled = false;
            });
        });
    }

    clearSearchInputs() {
        // Clear all search input values
        document.querySelectorAll('.text-search-type, .number-search-type, .boolean-search-type, .date-search-type').forEach(select => {
            select.value = '';
        });
        
        document.querySelectorAll('.text-search-value, .number-search-value, .date-search-from, .date-search-to').forEach(input => {
            input.value = '';
        });
        
        // Hide input containers
        document.querySelectorAll('.text-search-inputs, .number-search-inputs, .date-search-inputs').forEach(container => {
            container.style.display = 'none';
        });
    }

    captureCurrentSearchValues() {
        const searchValues = {};
        
        // Capture text search values
        document.querySelectorAll('.text-search-container').forEach((container, index) => {
            const selectElement = container.querySelector('.text-search-type');
            const inputElement = container.querySelector('.text-search-value');
            if (selectElement && inputElement) {
                searchValues[`text_${index}`] = {
                    type: selectElement.value,
                    value: inputElement.value,
                    fieldId: selectElement.dataset.fieldId
                };
            }
        });
        
        // Capture number search values
        document.querySelectorAll('.number-search-container').forEach((container, index) => {
            const selectElement = container.querySelector('.number-search-type');
            const inputElement = container.querySelector('.number-search-value');
            if (selectElement && inputElement) {
                searchValues[`number_${index}`] = {
                    type: selectElement.value,
                    value: inputElement.value,
                    fieldId: selectElement.dataset.fieldId
                };
            }
        });
        
        // Capture boolean search values
        document.querySelectorAll('.boolean-search-container').forEach((container, index) => {
            const selectElement = container.querySelector('.boolean-search-type');
            if (selectElement) {
                searchValues[`boolean_${index}`] = {
                    type: selectElement.value,
                    fieldId: selectElement.dataset.fieldId
                };
            }
        });
        
        // Capture date search values
        document.querySelectorAll('.date-search-container').forEach((container, index) => {
            const selectElement = container.querySelector('.date-search-type');
            const fromInput = container.querySelector('.date-search-from');
            const toInput = container.querySelector('.date-search-to');
            if (selectElement) {
                searchValues[`date_${index}`] = {
                    type: selectElement.value,
                    fromValue: fromInput ? fromInput.value : '',
                    toValue: toInput ? toInput.value : '',
                    fieldId: selectElement.dataset.fieldId
                };
            }
        });
        
        return searchValues;
    }

    restoreSearchValues(searchValues) {
        // Restore text search values
        document.querySelectorAll('.text-search-container').forEach((container, index) => {
            const key = `text_${index}`;
            if (searchValues[key] && searchValues[key].fieldId) {
                const selectElement = container.querySelector('.text-search-type');
                const inputElement = container.querySelector('.text-search-value');
                
                if (selectElement && selectElement.dataset.fieldId === searchValues[key].fieldId) {
                    selectElement.value = searchValues[key].type;
                    if (inputElement) {
                        inputElement.value = searchValues[key].value;
                    }
                    
                    // Trigger the change event to show/hide inputs
                    if (searchValues[key].type) {
                        this.handleTextSearchTypeChange(selectElement);
                    }
                }
            }
        });
        
        // Restore number search values
        document.querySelectorAll('.number-search-container').forEach((container, index) => {
            const key = `number_${index}`;
            if (searchValues[key] && searchValues[key].fieldId) {
                const selectElement = container.querySelector('.number-search-type');
                const inputElement = container.querySelector('.number-search-value');
                
                if (selectElement && selectElement.dataset.fieldId === searchValues[key].fieldId) {
                    selectElement.value = searchValues[key].type;
                    if (inputElement) {
                        inputElement.value = searchValues[key].value;
                    }
                    
                    // Trigger the change event to show/hide inputs
                    if (searchValues[key].type) {
                        this.handleNumberSearchTypeChange(selectElement);
                    }
                }
            }
        });
        
        // Restore boolean search values
        document.querySelectorAll('.boolean-search-container').forEach((container, index) => {
            const key = `boolean_${index}`;
            if (searchValues[key] && searchValues[key].fieldId) {
                const selectElement = container.querySelector('.boolean-search-type');
                
                if (selectElement && selectElement.dataset.fieldId === searchValues[key].fieldId) {
                    selectElement.value = searchValues[key].type;
                }
            }
        });
        
        // Restore date search values
        document.querySelectorAll('.date-search-container').forEach((container, index) => {
            const key = `date_${index}`;
            if (searchValues[key] && searchValues[key].fieldId) {
                const selectElement = container.querySelector('.date-search-type');
                const fromInput = container.querySelector('.date-search-from');
                const toInput = container.querySelector('.date-search-to');
                
                if (selectElement && selectElement.dataset.fieldId === searchValues[key].fieldId) {
                    selectElement.value = searchValues[key].type;
                    if (fromInput) {
                        fromInput.value = searchValues[key].fromValue;
                    }
                    if (toInput) {
                        toInput.value = searchValues[key].toValue;
                    }
                    
                    // Trigger the change event to show/hide inputs
                    if (searchValues[key].type) {
                        this.handleDateSearchTypeChange(selectElement);
                    }
                }
            }
        });
        
        // Re-disable inputs if we're in search mode
        if (this.isSearchMode) {
            this.disableSearchInputs();
        }
    }

    async showModelRecords(modelId, modelName) {
        this.currentModel = { id: modelId, name: modelName };
        this.currentCursor = null;
        this.currentSortField = 'created_at';
        this.currentSortOrder = 'desc';
        
        // Reset search state
        this.isSearchMode = false;
        this.currentSearchCriteria = null;

        // Reset column visibility - will be initialized after fields are loaded

        // Hide ALL other views first
        const modelsHeader = document.querySelector('.models-header');
        const modelsGrid = document.querySelector('.models-grid');

        if (modelsHeader) modelsHeader.style.display = 'none';
        if (modelsGrid) modelsGrid.style.display = 'none';

        document.getElementById('add-model-container').style.display = 'none';
        document.getElementById('record-detail-container').style.display = 'none';
        document.getElementById('add-record-container').style.display = 'none';

        // Show only the records container
        document.getElementById('model-records-container').style.display = 'block';
        document.getElementById('selected-model-name').textContent = `${modelName} - Records`;

        // Set up table event delegation
        if (!this.eventDelegationSetup) {
            this.setupTableEventDelegation();
            this.eventDelegationSetup = true;
        }

        // Load records (this will initialize column visibility after fields are loaded)
        await this.loadRecords();
    }

    hideRecords() {
        // Hide all record-related views
        document.getElementById('model-records-container').style.display = 'none';
        document.getElementById('record-detail-container').style.display = 'none';
        document.getElementById('add-record-container').style.display = 'none';

        // Show models view
        document.querySelector('.models-header').style.display = 'flex';
        document.querySelector('.models-grid').style.display = 'flex';
        document.getElementById('add-model-container').style.display = 'none';

        this.currentModel = null;
    }

    hideRecordDetail() {
        this.loadRecords(this.currentCursor, false);
        document.getElementById('record-detail-container').style.display = 'none';
        document.getElementById('model-records-container').style.display = 'block';
    }

    showAddRecordForm() {
        document.getElementById('model-records-container').style.display = 'none';
        document.getElementById('add-record-container').style.display = 'block';
        document.getElementById('add-record-title').textContent = `Add New ${this.currentModel.name} Record`;
        this.renderAddRecordForm();
    }

    hideAddRecordForm() {
        document.getElementById('add-record-container').style.display = 'none';
        document.getElementById('model-records-container').style.display = 'block';
        this.clearAddRecordForm();
    }

    renderAddRecordForm() {
        const container = document.getElementById('add-record-fields-container');

        if (!this.fields || this.fields.length === 0) {
            container.innerHTML = '<div class="no-fields-message">No fields available for this model.</div>';
            return;
        }

        const fieldsHTML = this.fields.map(field => {
            const inputElement = this.createAddRecordInput(field);
            return `
                <div class="add-record-field-item">
                    <div class="add-record-field-header">
                        <label class="add-record-field-name">${this.escapeHtml(field.name)}</label>
                        <span class="add-record-field-type">${field.type}</span>
                    </div>
                    <div class="add-record-field-description">${this.escapeHtml(field.description || '')}</div>
                    ${inputElement}
                </div>
            `;
        }).join('');

        container.innerHTML = fieldsHTML;
    }

    createAddRecordInput(field) {
        const fieldId = `add-field-${field.id}`;
        const dataAttrs = `data-field-id="${field.id}" data-field-type="${field.type}"`;

        switch (field.type) {
            case 'EMAIL':
            case 'SINGLE_LINE_TEXT':
                return `<input type="text" id="${fieldId}" class="add-record-field-input" placeholder="Enter ${field.name.toLowerCase()}" ${dataAttrs}>`;
            case 'MULTI_LINE_TEXT':
                return `<textarea id="${fieldId}" class="add-record-field-input add-record-field-textarea" placeholder="Enter ${field.name.toLowerCase()}" ${dataAttrs}></textarea>`;

            case 'NUMBER':
                return `<input type="number" id="${fieldId}" class="add-record-field-input" placeholder="Enter decimal number" step="any" ${dataAttrs}>`;

            case 'BOOLEAN':
                return `<input type="checkbox" id="${fieldId}" class="add-record-field-input" ${dataAttrs}>`;

            case 'DATE':
                return `<input type="date" id="${fieldId}" class="add-record-field-input" ${dataAttrs}>`;

            case 'DATETIME':
                return `<input type="datetime-local" id="${fieldId}" class="add-record-field-input" ${dataAttrs}>`;

            default:
                return `<input type="text" id="${fieldId}" class="add-record-field-input" placeholder="Enter ${field.name.toLowerCase()}" ${dataAttrs}>`;
        }
    }

    clearAddRecordForm() {
        const container = document.getElementById('add-record-fields-container');
        const inputs = container.querySelectorAll('[data-field-id]');

        inputs.forEach(input => {
            if (input.type === 'checkbox') {
                input.checked = false;
            } else {
                input.value = '';
            }
        });

        const existingMessage = document.querySelector('.add-record-error, .add-record-success');
        if (existingMessage) {
            existingMessage.remove();
        }
    }

    async handleAddRecordSubmit() {
        const submitButton = document.getElementById('create-record-btn');
        const originalText = submitButton.textContent;

        try {
            submitButton.disabled = true;
            submitButton.textContent = 'Creating...';
            this.clearAddRecordMessages();

            // Collect field values
            const fieldValues = {};
            const inputs = document.querySelectorAll('[data-field-id]');

            inputs.forEach(input => {
                const fieldId = input.dataset.fieldId;
                const fieldType = input.dataset.fieldType;
                let value;

                switch (fieldType) {
                    case 'BOOLEAN':
                        value = input.checked;
                        break;
                    case 'NUMBER':
                        value = input.value ? parseFloat(input.value) : null;
                        break;
                    case 'DATETIME':
                        // Convert HTML5 datetime-local format to SQL timestamp format
                        value = input.value ? this.convertDateTimeToSqlFormat(input.value) : null;
                        break;
                    default:
                        value = input.value || null;
                }

                if (value !== null && value !== '') {
                    fieldValues[fieldId] = value;
                }
            });

            // Make API call to create record

            // Make API call
            const token = localStorage.getItem('jwt_token');

            if (!token) {
                throw new Error('No authentication token found');
            }

            const response = await fetch(`${this.apiBaseUrl}/models/${this.currentModel.id}/records`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    fieldValues: fieldValues
                })
            });

            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`Failed to create record: ${response.status} ${errorText}`);
            }

            const recordId = await response.text();
            this.showAddRecordMessage('Record created successfully!', 'success');
            this.clearAddRecordForm();

            setTimeout(() => {
                this.hideAddRecordForm();
                this.loadRecords(this.currentCursor, false);
            }, 1500);

        } catch (error) {
            this.showAddRecordMessage(error.message, 'error');
        } finally {
            submitButton.disabled = false;
            submitButton.textContent = originalText;
        }
    }

    showAddRecordMessage(message, type) {
        this.clearAddRecordMessages();

        const messageDiv = document.createElement('div');
        messageDiv.className = `add-record-${type}`;
        messageDiv.innerHTML = `<strong>${type === 'success' ? 'Success' : 'Error'}:</strong> ${this.escapeHtml(message)}`;

        const form = document.getElementById('add-record-form');
        form.insertBefore(messageDiv, form.firstChild);
    }

    clearAddRecordMessages() {
        const existingMessages = document.querySelectorAll('.add-record-error, .add-record-success');
        existingMessages.forEach(msg => msg.remove());
    }

    async loadRecords(cursor = null, isPreviousPage = false) {
        try {
            this.showLoading();

            let url = `${this.apiBaseUrl}/models/${this.currentModel.id}/records`;
            url += `?limit=${this.limit}&sortField=${this.currentSortField}&sortOrder=${this.currentSortOrder}`;

            if (cursor) {
                url += `&cursor=${encodeURIComponent(cursor)}`;
            }

            if (isPreviousPage) {
                url += '&previous=true';
            }

            // Add search criteria to URL if in search mode
            if (this.isSearchMode && this.currentSearchCriteria) {
                url += '&search=' + encodeURIComponent(JSON.stringify(this.currentSearchCriteria));
            }

            // Make API call
            const token = localStorage.getItem('jwt_token');

            if (!token) {
                throw new Error('No authentication token found');
            }

            const response = await fetch(url, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            this.fields = data.fields;
            
            // Initialize column visibility whenever fields change (new model loaded)
            this.initializeColumnVisibility();
            
            // Update column selector if it's currently open
            this.updateColumnSelectorIfOpen();
            
            this.renderTable(data.records, data.pagination);

        } catch (error) {
            this.showError(error.message);
        }
    }

    showLoading() {
        const tableBody = document.getElementById('table-body');
        tableBody.innerHTML = '<tr><td colspan="100%" class="loading-cell">Loading records...</td></tr>';
        document.getElementById('prev-page').disabled = true;
        document.getElementById('next-page').disabled = true;
    }

    showError(message) {
        const tableBody = document.getElementById('table-body');
        tableBody.innerHTML = `<tr><td colspan="100%" class="error-cell">Error: ${message}</td></tr>`;
    }

    renderTable(records, pagination) {
        this.currentRecords = records;
        this.renderHeaders();
        this.renderRows(records);
        this.updatePagination(pagination);
        
        // Update search UI after rendering headers (since search button is created dynamically)
        setTimeout(() => {
            this.updateSearchUI();
        }, 0);
    }

    renderHeaders() {
        const tableHeaders = document.getElementById('table-headers');
        
        // Store current search criteria values if in search mode
        const preservedSearchValues = this.isSearchMode ? this.captureCurrentSearchValues() : null;
        
        const headerRow = document.createElement('tr');

        if (this.isColumnVisible('id')) {
            headerRow.appendChild(this.createHeaderCell('ID', 'id'));
        }
        if (this.isColumnVisible('created_at')) {
            headerRow.appendChild(this.createHeaderCell('Created At', 'created_at'));
        }
        if (this.isColumnVisible('updated_at')) {
            headerRow.appendChild(this.createHeaderCell('Updated At', 'updated_at'));
        }

        this.fields.forEach(field => {
            if (this.isColumnVisible(field.id)) {
                headerRow.appendChild(this.createHeaderCell(field.name, field.id));
            }
        });

        // Add search button column header
        if (this.isColumnVisible('search')) {
            const searchButtonHeader = document.createElement('th');
            searchButtonHeader.classList.add('column-search');
            searchButtonHeader.innerHTML = 'Search';
            headerRow.appendChild(searchButtonHeader);
        }

        const headerSearchRow = document.createElement('tr');
        if (this.isColumnVisible('id')) {
            headerSearchRow.appendChild(this.createHeaderSearchCell({ id: 'id', type: 'SINGLE_LINE_TEXT' })); // ID
        }
        if (this.isColumnVisible('created_at')) {
            headerSearchRow.appendChild(this.createHeaderSearchCell({ id: 'created_at', type: 'DATETIME' })); // Created At
        }
        if (this.isColumnVisible('updated_at')) {
            headerSearchRow.appendChild(this.createHeaderSearchCell({ id: 'updated_at', type: 'DATETIME' })); // Updated At
        }

        this.fields.forEach(field => {
            if (this.isColumnVisible(field.id)) {
                headerSearchRow.appendChild(this.createHeaderSearchCell(field));
            }
        });

        // Add search button cell
        if (this.isColumnVisible('search')) {
            const searchButtonCell = document.createElement('th');
            searchButtonCell.classList.add('column-search');
            searchButtonCell.innerHTML = `<button class="search-button" id="perform-search-btn">Search</button>`;
            headerSearchRow.appendChild(searchButtonCell);
        }

        tableHeaders.innerHTML = '';
        tableHeaders.appendChild(headerRow);
        tableHeaders.appendChild(headerSearchRow);
        
        // Restore search criteria values if they were preserved
        if (preservedSearchValues) {
            setTimeout(() => {
                this.restoreSearchValues(preservedSearchValues);
            }, 0);
        }
    }

    createHeaderCell(displayName, sortField) {
        const th = document.createElement('th');
        th.className = 'sortable-header';
        
        // Add column-specific class
        if (sortField === 'id') {
            th.classList.add('column-id');
        } else if (sortField === 'created_at') {
            th.classList.add('column-created-at');
        } else if (sortField === 'updated_at') {
            th.classList.add('column-updated-at');
        } else {
            th.classList.add('column-field');
        }
        
        th.innerHTML = `
            ${this.escapeHtml(displayName)}
            <span class="sort-indicator ${sortField === this.currentSortField ? 'active' : ''} ${this.currentSortOrder}"></span>
        `;

        th.addEventListener('click', () => {
            this.handleSort(sortField);
        });

        return th;
    }

    createHeaderSearchCell(field) {
        const th = document.createElement('th');
        
        // Add column-specific class
        if (field.id === 'id') {
            th.classList.add('column-id');
        } else if (field.id === 'created_at') {
            th.classList.add('column-created-at');
        } else if (field.id === 'updated_at') {
            th.classList.add('column-updated-at');
        } else {
            th.classList.add('column-field');
        }

        if (field.type === 'DATE' || field.type === 'DATETIME') {
            th.innerHTML = this.createDateSearchControl(field);
        } else if (field.type === 'BOOLEAN') {
            th.innerHTML = this.createBooleanSearchControl(field);
        } else if (field.type === 'NUMBER') {
            th.innerHTML = this.createNumberSearchControl(field);
        } else if (field.type === 'SINGLE_LINE_TEXT' || field.type === 'MULTI_LINE_TEXT' || field.type === 'EMAIL') {
            th.innerHTML = this.createTextSearchControl(field);
        } else {
            th.innerHTML = `<input class="input-search-records" type="text" value="" placeholder="Search..."/>`;
        }

        return th;
    }

    createDateSearchControl(field) {
        const inputType = field.type === 'DATE' ? 'date' : 'datetime-local';
        const fieldId = field.id || field.type; // Handle system fields like created_at

        return `
        <div class="date-search-container">
            <select class="date-search-type" data-field-id="${fieldId}">
                <option value="">All dates</option>
                <option value="on">On</option>
                <option value="before">Before</option>
                <option value="after">After</option>
                <option value="between">Between</option>
            </select>
            <div class="date-search-inputs" style="display: none;">
                <input type="${inputType}" class="date-search-from" placeholder="From" />
                <input type="${inputType}" class="date-search-to" placeholder="To" style="display: none;" />
            </div>
        </div>
    `;
    }

    createBooleanSearchControl(field) {
        const fieldId = field.id || field.type;

        return `
        <div class="boolean-search-container">
            <select class="search-dropdown boolean-search-type" data-field-id="${fieldId}">
                <option value="">All values</option>
                <option value="true">Yes</option>
                <option value="false">No</option>
            </select>
        </div>
    `;
    }

    createNumberSearchControl(field) {
        const fieldId = field.id || field.type;

        return `
        <div class="number-search-container">
            <select class="search-dropdown number-search-type" data-field-id="${fieldId}">
                <option value="">All numbers</option>
                <option value="equals">Equals</option>
                <option value="greater">Bigger than</option>
                <option value="less">Smaller than</option>
            </select>
            <div class="number-search-inputs" style="display: none;">
                <input type="number" class="number-search-value" placeholder="Enter value" step="any" />
            </div>
        </div>
    `;
    }

    createTextSearchControl(field) {
        const fieldId = field.id || field.type;

        return `
        <div class="text-search-container">
            <select class="search-dropdown text-search-type" data-field-id="${fieldId}">
                <option value="">All text</option>
                <option value="contains">Contains</option>
                <option value="equals">Equals</option>
                <option value="starts_with">Starts with</option>
                <option value="ends_with">Ends with</option>
                <option value="not_contains">Not Contains</option>
                <option value="not_equals">Not Equals</option>
            </select>
            <div class="text-search-inputs" style="display: none;">
                <input type="text" class="text-search-value" placeholder="Search text..." />
            </div>
        </div>
    `;
    }

    renderRows(records) {
        const tableBody = document.getElementById('table-body');

        if (!records || records.length === 0) {
            tableBody.innerHTML = '<tr><td colspan="100%" class="no-data-cell">No records found</td></tr>';
            return;
        }

        tableBody.innerHTML = '';

        records.forEach(record => {
            const row = document.createElement('tr');
            row.className = 'record-row';
            row.dataset.recordId = record.id;
            row.style.cursor = 'pointer';

            if (this.isColumnVisible('id')) {
                row.appendChild(this.createCell(record.id, 'id', 'id'));
            }
            if (this.isColumnVisible('created_at')) {
                row.appendChild(this.createCell(this.formatDateTime(record.createdAt), 'datetime', 'created_at'));
            }
            if (this.isColumnVisible('updated_at')) {
                row.appendChild(this.createCell(this.formatDateTime(record.updatedAt), 'datetime', 'updated_at'));
            }

            this.fields.forEach(field => {
                if (this.isColumnVisible(field.id)) {
                    const value = record.fieldValues[field.id];
                    row.appendChild(this.createCell(this.formatFieldValue(value, field.type), field.type.toLowerCase(), field.id));
                }
            });

            // Add empty cell for search button column
            if (this.isColumnVisible('search')) {
                row.appendChild(this.createCell('', 'search-actions', 'search'));
            }

            tableBody.appendChild(row);
        });
    }

    createCell(value, type, columnId) {
        const td = document.createElement('td');
        td.className = `cell-${type}`;
        
        // Add column-specific class
        if (columnId === 'id') {
            td.classList.add('column-id');
        } else if (columnId === 'created_at') {
            td.classList.add('column-created-at');
        } else if (columnId === 'updated_at') {
            td.classList.add('column-updated-at');
        } else if (columnId === 'search') {
            td.classList.add('column-search');
        } else {
            td.classList.add('column-field');
        }
        
        td.innerHTML = this.escapeHtml(String(value || ''));
        return td;
    }

    formatDateTime(isoString) {
        if (!isoString) return '';
        const date = new Date(isoString);
        if (isNaN(date.getTime())) return '';
        
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        const hours = String(date.getHours()).padStart(2, '0');
        const minutes = String(date.getMinutes()).padStart(2, '0');
        
        return `${year}/${month}/${day} ${hours}:${minutes}`;
    }

    formatFieldValue(value, type) {
        if (value === null || value === undefined) return '';

        switch (type) {
            case 'SINGLE_LINE_TEXT':
            case 'MULTI_LINE_TEXT':
                return String(value);
            case 'NUMBER':
                return !isNaN(Number(value)) ? Number(value).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 10 }) : String(value);
            case 'BOOLEAN':
                return value ? 'Yes' : 'No';
            case 'DATE':
                try {
                    const date = new Date(value);
                    if (isNaN(date.getTime())) return String(value);
                    
                    const year = date.getFullYear();
                    const month = String(date.getMonth() + 1).padStart(2, '0');
                    const day = String(date.getDate()).padStart(2, '0');
                    
                    return `${year}/${month}/${day}`;
                } catch {
                    return String(value);
                }
            case 'DATETIME':
                try {
                    const date = new Date(value);
                    if (isNaN(date.getTime())) return String(value);
                    
                    const year = date.getFullYear();
                    const month = String(date.getMonth() + 1).padStart(2, '0');
                    const day = String(date.getDate()).padStart(2, '0');
                    const hours = String(date.getHours()).padStart(2, '0');
                    const minutes = String(date.getMinutes()).padStart(2, '0');
                    
                    return `${year}/${month}/${day} ${hours}:${minutes}`;
                } catch {
                    return String(value);
                }
            default:
                return String(value);
        }
    }

    async handleSort(sortField) {
        if (this.currentSortField === sortField) {
            this.currentSortOrder = this.currentSortOrder === 'desc' ? 'asc' : 'desc';
        } else {
            this.currentSortField = sortField;
            this.currentSortOrder = 'desc';
        }

        this.currentCursor = null;
        await this.loadRecords(null, false);
    }

    async loadNextPage() {
        const nextCursor = this.currentPagination?.nextCursor;
        if (nextCursor) {
            this.currentCursor = nextCursor;
            await this.loadRecords(nextCursor, false);
        }
    }

    async loadPreviousPage() {
        const prevCursor = this.currentPagination?.previousCursor;
        if (prevCursor) {
            this.currentCursor = prevCursor;
            await this.loadRecords(prevCursor, true);
        }
    }

    updatePagination(pagination) {
        this.currentPagination = pagination;

        const infoText = document.getElementById('pagination-info-text');
        const recordsText = `Showing ${this.limit} of ~${pagination.totalEstimate} records`;
        infoText.textContent = this.isSearchMode ? `${recordsText} (filtered)` : recordsText;

        const prevBtn = document.getElementById('prev-page');
        const nextBtn = document.getElementById('next-page');

        prevBtn.disabled = !pagination.hasPrevious;
        nextBtn.disabled = !pagination.hasNext;
    }

    showRecordDetail(record) {
        this.currentRecord = record;

        document.getElementById('model-records-container').style.display = 'none';
        document.getElementById('record-detail-container').style.display = 'block';

        document.getElementById('record-detail-title').textContent = `${this.currentModel.name} - Record Details`;
        document.getElementById('record-id').textContent = record.id;
        document.getElementById('record-created').textContent = this.formatDateTime(record.createdAt);
        document.getElementById('record-updated').textContent = this.formatDateTime(record.updatedAt);

        this.renderRecordFields(record);
        this.exitEditMode();

        setTimeout(() => {
            this.bindRecordDetailEvents();
        }, 100);
    }

    renderRecordFields(record) {
        const container = document.getElementById('record-fields-container');

        if (!this.fields || this.fields.length === 0) {
            container.innerHTML = '<div class="no-fields">No fields defined for this model.</div>';
            return;
        }

        const fieldsHTML = this.fields.map(field => {
            const value = record.fieldValues[field.id];
            const formattedValue = this.formatFieldValue(value, field.type);

            return `
                <div class="field-item">
                    <div class="field-header">
                        <label class="field-name">${this.escapeHtml(field.name)}</label>
                        <span class="field-type">${field.type}</span>
                    </div>
                    <div class="field-description">${this.escapeHtml(field.description || '')}</div>
                    <div class="field-value field-value-${field.type.toLowerCase()}">${this.escapeHtml(formattedValue)}</div>
                </div>
            `;
        }).join('');

        container.innerHTML = fieldsHTML;
    }

    enterEditMode() {
        document.getElementById('record-fields-container').style.display = 'none';
        document.getElementById('edit-form-container').style.display = 'block';
        document.getElementById('edit-record-btn').disabled = true;
        this.renderEditForm();
    }

    exitEditMode() {
        document.getElementById('record-fields-container').style.display = 'grid';
        document.getElementById('edit-form-container').style.display = 'none';

        const editBtn = document.getElementById('edit-record-btn');
        if (editBtn) {
            editBtn.disabled = false;
        }

        const existingError = document.querySelector('.edit-error');
        if (existingError) {
            existingError.remove();
        }
    }

    renderEditForm() {
        const container = document.getElementById('edit-fields-container');

        if (!this.fields || this.fields.length === 0) {
            container.innerHTML = '<div class="edit-loading">No fields available for editing.</div>';
            return;
        }

        const fieldsHTML = this.fields.map(field => {
            const currentValue = this.currentRecord.fieldValues[field.id] || '';
            const inputElement = this.createEditInput(field, currentValue);

            return `
                <div class="edit-field-item">
                    <div class="edit-field-header">
                        <label class="edit-field-name">${this.escapeHtml(field.name)}</label>
                        <span class="edit-field-type">${field.type}</span>
                    </div>
                    <div class="edit-field-description">${this.escapeHtml(field.description || '')}</div>
                    ${inputElement}
                </div>
            `;
        }).join('');

        container.innerHTML = fieldsHTML;
    }

    createEditInput(field, currentValue) {
        const fieldId = `edit-field-${field.id}`;
        const escapedValue = this.escapeHtml(String(currentValue || ''));
        const dataAttrs = `data-field-id="${field.id}" data-field-type="${field.type}"`;

        switch (field.type) {
            case 'EMAIL':
            case 'SINGLE_LINE_TEXT':
                return `<input type="text" id="${fieldId}" class="edit-field-input" value="${escapedValue}" ${dataAttrs}>`;
            case 'MULTI_LINE_TEXT':
                return `<textarea id="${fieldId}" class="edit-field-input edit-field-textarea" ${dataAttrs}>${escapedValue}</textarea>`;
            case 'NUMBER':
                return `<input type="number" id="${fieldId}" class="edit-field-input" value="${currentValue || ''}" ${dataAttrs} ${field.type === 'NUMBER' ? 'step="any"' : 'step="1"'}>`;
            case 'BOOLEAN':
                return `<input type="checkbox" id="${fieldId}" class="edit-field-input" ${currentValue ? 'checked' : ''} ${dataAttrs}>`;
            case 'DATE':
                const dateValue = currentValue ? this.formatDateForInput(currentValue) : '';
                return `<input type="date" id="${fieldId}" class="edit-field-input" value="${dateValue}" ${dataAttrs}>`;
            case 'DATETIME':
                const datetimeValue = currentValue ? this.formatDateTimeForInput(currentValue) : '';
                return `<input type="datetime-local" id="${fieldId}" class="edit-field-input" value="${datetimeValue}" ${dataAttrs}>`;
            default:
                return `<input type="text" id="${fieldId}" class="edit-field-input" value="${escapedValue}" ${dataAttrs}>`;
        }
    }

    formatDateForInput(value) {
        try {
            const date = new Date(value);
            return date.toISOString().split('T')[0];
        } catch {
            return '';
        }
    }

    formatDateTimeForInput(value) {
        try {
            const date = new Date(value);
            return date.toISOString().slice(0, 16);
        } catch {
            return '';
        }
    }

    async saveRecord() {
        const saveBtn = document.getElementById('save-record-btn');
        const originalText = saveBtn.textContent;
        saveBtn.disabled = true;
        saveBtn.textContent = 'Saving...';

        try {
            const fieldValues = {};
            const inputs = document.querySelectorAll('[data-field-id]');

            inputs.forEach(input => {
                const fieldId = input.dataset.fieldId;
                const fieldType = input.dataset.fieldType;
                let value;

                switch (fieldType) {
                    case 'BOOLEAN':
                        value = input.checked;
                        break;
                    case 'NUMBER':
                        value = input.value ? parseFloat(input.value) : null;
                        break;
                    case 'DATETIME':
                        // Convert HTML5 datetime-local format to SQL timestamp format
                        value = input.value ? this.convertDateTimeToSqlFormat(input.value) : null;
                        break;
                    default:
                        value = input.value || null;
                }

                if (value !== null && value !== '') {
                    fieldValues[fieldId] = value;
                }
            });

            // Make API call
            const token = localStorage.getItem('jwt_token');

            if (!token) {
                throw new Error('No authentication token found');
            }

            const response = await fetch(`${this.apiBaseUrl}/records/${this.currentRecord.id}`, {
                method: 'PUT',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    fieldValues: fieldValues
                })
            });

            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`Failed to update record: ${response.status} ${errorText}`);
            }

            const updatedRecord = await response.json();
            this.currentRecord = updatedRecord;
            this.renderRecordFields(updatedRecord);
            document.getElementById('record-updated').textContent = this.formatDateTime(updatedRecord.updatedAt);
            this.exitEditMode();

        } catch (error) {
            this.showEditError(error.message);
        } finally {
            saveBtn.disabled = false;
            saveBtn.textContent = originalText;
        }
    }

    showEditError(message) {
        const existingError = document.querySelector('.edit-error');
        if (existingError) {
            existingError.remove();
        }

        const errorDiv = document.createElement('div');
        errorDiv.className = 'edit-error';
        errorDiv.textContent = message;
        document.getElementById('edit-form-container').appendChild(errorDiv);
    }

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    convertDateTimeToSqlFormat(htmlDateTimeValue) {
        // Convert HTML5 datetime-local format (e.g., "2025-09-10T09:07") 
        // to SQL timestamp format (e.g., "2025-09-10 09:07:00")
        if (!htmlDateTimeValue) return null;
        
        // Replace 'T' with space and ensure seconds are included
        let sqlFormat = htmlDateTimeValue.replace('T', ' ');
        
        // Add seconds if not present
        if (sqlFormat.length === 16) { // "YYYY-MM-DD HH:mm"
            sqlFormat += ':00';
        }
        
        return sqlFormat;
    }

    // Column Visibility Methods
    initializeColumnVisibility() {
        // Initialize with all columns visible by default
        this.visibleColumns.clear();
        this.visibleColumns.add('id');
        this.visibleColumns.add('created_at');
        this.visibleColumns.add('updated_at');
        
        // Add all field columns
        this.fields.forEach(field => {
            this.visibleColumns.add(field.id);
        });
        
        this.visibleColumns.add('search'); // Search column
    }

    toggleColumnSelector() {
        const selector = document.getElementById('column-selector');
        if (selector.style.display === 'none') {
            this.showColumnSelector();
        } else {
            this.hideColumnSelector();
        }
    }

    showColumnSelector() {
        this.renderColumnCheckboxes();
        document.getElementById('column-selector').style.display = 'block';
    }

    hideColumnSelector() {
        document.getElementById('column-selector').style.display = 'none';
    }

    renderColumnCheckboxes() {
        const container = document.getElementById('column-checkboxes');
        
        const columns = [
            { id: 'id', name: 'ID', system: true },
            { id: 'created_at', name: 'Created At', system: true },
            { id: 'updated_at', name: 'Updated At', system: true },
            ...this.fields.map(field => ({ id: field.id, name: field.name, system: false })),
            { id: 'search', name: 'Search', system: true }
        ];
        
        container.innerHTML = columns.map(column => `
            <div class="column-checkbox-item">
                <label>
                    <input type="checkbox" 
                           data-column-id="${column.id}"
                           ${this.visibleColumns.has(column.id) ? 'checked' : ''}
                           onchange="window.recordsInstance.handleColumnToggle('${column.id}', this.checked)">
                    <span>${this.escapeHtml(column.name)}</span>
                </label>
            </div>
        `).join('');
    }

    handleColumnToggle(columnId, isVisible) {
        if (isVisible) {
            this.visibleColumns.add(columnId);
        } else {
            this.visibleColumns.delete(columnId);
        }
        
        // Re-render table with updated column visibility
        this.renderTable(this.currentRecords, this.currentPagination);
    }

    isColumnVisible(columnId) {
        return this.visibleColumns.has(columnId);
    }

    updateColumnSelectorIfOpen() {
        const selector = document.getElementById('column-selector');
        // Only update if the column selector is currently visible
        if (selector && selector.style.display === 'block') {
            this.renderColumnCheckboxes();
        }
    }
}