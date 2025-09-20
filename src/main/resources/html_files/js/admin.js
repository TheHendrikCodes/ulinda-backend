export class Admin {


    constructor() {
        this.apiBaseUrl = 'http://localhost:8080';
        this.init();
    }

    init() {
        this.bindEvents()
    }

    bindEvents() {
        document.getElementById('admin-button-user-management').addEventListener('click', async (e) => {
            e.preventDefault();
            document.getElementById('users-table-body').innerHTML = '<tr><td colspan="5" class="loading-cell">Loading...</td></tr>';
            await this.retrieveUsers()
        });
        document.getElementById('add-new-user-button').addEventListener('click', () => {
            document.getElementById('add-user-form').style.display = 'block';
            console.log(document.getElementById('users-table-container').style.display);
            document.getElementById('users-table-container').style.display = 'none';
        });
        document.getElementById('add-save-user-button').addEventListener('click', async (e) => {
            const username = document.getElementById('create-user-username').value;
            const name = document.getElementById('create-user-name').value;
            const surname = document.getElementById('create-user-surname').value;
            const userCreated = await this.createUser(username, surname, name);
            document.getElementById('add-user-form').style.display = 'none';
            document.getElementById('user-created-form').style.display = 'block';
            document.getElementById('created-user-password').innerHTML = userCreated.password;

        });
        document.getElementById('created-user-ok-button').addEventListener('click', async (e) => {
            document.getElementById('add-user-form').style.display = 'none';
            document.getElementById('users-table-container').style.display = 'block';
            document.getElementById('users-table-body').innerHTML = '<tr><td colspan="5" class="loading-cell">Loading...</td></tr>';
            document.getElementById('user-created-form').style.display = 'none';
            await this.retrieveUsers();
        });
        // Add save user changes listener
        document.getElementById('save-user-changes').addEventListener('click', async (e) => {
            e.preventDefault();
            await this.saveUserChanges();
        });

    }

    async createUser(username, surname, name) {
        try {
            const token = localStorage.getItem('jwt_token');

            if (!token) {
                throw new Error('No authentication token found');
            }

            const requestBody = {
                username: username,
                surname: surname,
                name: name
            };

            const response = await fetch(`${this.apiBaseUrl}/admin/users`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(requestBody)
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            console.log('User created successfully:', data);
            return data;

        } catch (error) {
            console.error('Error creating user:', error);
            // You might want to show an error message to the user here
            throw error;
        }
    }

    async retrieveUsers() {

        document.getElementById('user-management-div').classList.add('active');
        document.getElementById('admin').classList.remove('active');

        try {

            // Make API call
            const token = localStorage.getItem('jwt_token');

            if (!token) {
                throw new Error('No authentication token found');
            }

            const response = await fetch(`${this.apiBaseUrl}/admin/users`, {
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
            this.renderUsers(data.users);

        } catch (error) {
            console.log(error);
        }
    }

    renderUsers(users) {
        console.log(users);
        const usersHTML = users.map(user => `
            <tr>
                <td>${this.escapeHtml(user.name)}</td>
                <td>${this.escapeHtml(user.surname)}</td>
                <td>${this.escapeHtml(user.userName)}</td>
                <td>
                    ${user.roles && user.roles.includes('ADMIN') ? '✅' : ''}
                </td>
                <td>${user.canCreateModels ? '✅' : ''}</td>
                <td><button class="user-edit-button" data-action="edit" data-user-id="${user.userId}">Edit</button></td>
            </tr>
    `).join('');

        document.getElementById('users-table-body').innerHTML = usersHTML;

        // Add onclick events after table is rendered
        this.addEditButtonListeners();

        //Add Back To Users listener
        this.addBackButtonListener();
    }

    addBackButtonListener() {

        document.getElementById('back-to-users').addEventListener('click', () => {
            document.getElementById('edit-user').classList.remove('active');
            document.getElementById('user-management-div').classList.add('active');
            document.getElementById('users-table-body').innerHTML = '<tr><td colspan="5" class="loading-cell">Loading...</td></tr>';
            this.retrieveUsers()
        });

    }

    addEditButtonListeners() {
        const editButtons = document.querySelectorAll('.user-edit-button');
        editButtons.forEach(button => {
            button.onclick = (event) => {
                const userId = event.target.getAttribute('data-user-id');
                const action = event.target.getAttribute('data-action');
                console.log(`${action} user with ID: ${userId}`);

                // Call your edit function here
                this.editUser(userId);
            };
        });
    }

    async editUser(userId) {
        this.currentEditingUserId = userId;

        // DISABLE save button when starting edit
        const saveButton = document.getElementById('save-user-changes');
        saveButton.disabled = true;
        saveButton.textContent = 'Loading...';

        console.log(`Editing user ${userId}`);

        // Make API call
        const token = localStorage.getItem('jwt_token');

        if (!token) {
            throw new Error('No authentication token found');
        }

        const response = await fetch(`${this.apiBaseUrl}/admin/user/${userId}`, {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();

        console.log('User being edited:', data);

        document.getElementById('edit-user-name').value = data.name;
        document.getElementById('edit-user-surname').value = data.surname;
        document.getElementById('edit-user-username').value = data.userName;
        document.getElementById('edit-user-can-create-models').checked = !!data.canCreateModels;
        document.getElementById('edit-user-admin').checked = !!data.adminUser;

        this.getUserModelPermissions(data.userId);

        window.app.getNavigation().setActiveSection('edit-user');
    }

    // Utility method to escape HTML to prevent XSS
    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    async getUserModelPermissions(userId) {
        console.log("Getting model permissions for user: " + userId);

        // Show loading state
        document.getElementById('edit-user-models-permissions').querySelector('tbody').innerHTML =
            '<tr><td colspan="7" class="loading-cell">Loading model permissions...</td></tr>';

        try {
            const token = localStorage.getItem('jwt_token');

            if (!token) {
                throw new Error('No authentication token found');
            }

            // Get all models
            const modelsResponse = await fetch(`${this.apiBaseUrl}/v1/models`, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            if (!modelsResponse.ok) {
                throw new Error(`HTTP error getting models! status: ${modelsResponse.status}`);
            }

            const modelsData = await modelsResponse.json();

            // Get user's current permissions
            const permissionsResponse = await fetch(`${this.apiBaseUrl}/admin/user/model-permissions/${userId}`, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            if (!permissionsResponse.ok) {
                throw new Error(`HTTP error getting permissions! status: ${permissionsResponse.status}`);
            }

            const permissionsData = await permissionsResponse.json();

            // Render the permissions table
            this.renderModelPermissionsTable(modelsData.models, permissionsData.userModelPermissions);

        } catch (error) {
            console.error('Error getting model permissions:', error);
            document.getElementById('edit-user-models-permissions').querySelector('tbody').innerHTML =
                '<tr><td colspan="7" class="error-cell">Error loading model permissions</td></tr>';
        }
    }

    renderModelPermissionsTable(models, userPermissions) {
        // Create a map of user's current permissions for quick lookup
        const userPermissionMap = {};
        userPermissions.forEach(perm => {
            if (!userPermissionMap[perm.modelId]) {
                userPermissionMap[perm.modelId] = [];
            }
            userPermissionMap[perm.modelId].push(perm.permission);
        });

        // All possible permissions (matching your enum)
        const allPermissions = [
            'VIEW_RECORDS',
            'ADD_RECORDS',
            'EDIT_RECORDS',
            'DELETE_RECORDS',
            'ADD_FIELDS',
            'REMOVE_FIELDS'
        ];

        // Generate table rows
        const tableHTML = models.map(model => {
            const modelPermissions = userPermissionMap[model.id] || [];

            return `
            <tr>
                <td>${this.escapeHtml(model.name)}</td>
                ${allPermissions.map(permission => {
                const isChecked = modelPermissions.includes(permission);
                return `
                        <td>
                            <input 
                                type="checkbox" 
                                data-model-id="${model.id}" 
                                data-permission="${permission}"
                                ${isChecked ? 'checked' : ''}
                            />
                        </td>
                    `;
            }).join('')}
            </tr>
        `;
        }).join('');

        // Insert into table body
        document.getElementById('edit-user-models-permissions').querySelector('tbody').innerHTML = tableHTML;

        // ENABLE save button after permissions are loaded
        const saveButton = document.getElementById('save-user-changes');
        saveButton.disabled = false;
        saveButton.textContent = 'Save Changes';
    }

    async saveUserChanges() {
        try {
            // Show loading state on button
            const saveButton = document.getElementById('save-user-changes');
            const originalText = saveButton.textContent;
            saveButton.textContent = 'Saving...';
            saveButton.disabled = true;

            // Get user ID (you'll need to store this when editing starts)
            const userId = this.currentEditingUserId;

            // Collect user basic info
            const userData = {
                userId: userId,
                name: document.getElementById('edit-user-name').value,
                surname: document.getElementById('edit-user-surname').value,
                adminUser: document.getElementById('edit-user-admin').checked,
                canCreateModels: document.getElementById('edit-user-can-create-models').checked,
                permissions: this.collectPermissions()
            };

            console.log('Saving user data:', userData);

            // Make API call
            const token = localStorage.getItem('jwt_token');
            const response = await fetch(`${this.apiBaseUrl}/admin/user/model-permissions`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(userData)
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            // Success feedback
            saveButton.textContent = 'Saved!';
            saveButton.style.backgroundColor = '#10b981';

            setTimeout(() => {
                saveButton.textContent = originalText;
                saveButton.style.backgroundColor = '';
                saveButton.disabled = false;
            }, 2000);

            console.log('User changes saved successfully');

        } catch (error) {
            console.error('Error saving user changes:', error);

            // Error feedback
            const saveButton = document.getElementById('save-user-changes');
            saveButton.textContent = 'Error - Try Again';
            saveButton.style.backgroundColor = '#ef4444';

            setTimeout(() => {
                saveButton.textContent = 'Save Changes';
                saveButton.style.backgroundColor = '';
                saveButton.disabled = false;
            }, 3000);
        }
    }

    collectPermissions() {
        const permissions = [];
        const checkboxes = document.querySelectorAll('#edit-user-models-permissions input[type="checkbox"]:checked');

        checkboxes.forEach(checkbox => {
            permissions.push({
                modelId: checkbox.getAttribute('data-model-id'),
                permission: checkbox.getAttribute('data-permission')
            });
        });

        return permissions;
    }
}