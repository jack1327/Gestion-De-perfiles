// Sistema de almacenamiento local
class StorageManager {
    static USERS_KEY = 'gestor_users';
    static PROFILES_KEY = 'gestor_profiles';
    static CURRENT_USER_KEY = 'gestor_current_user';

    static getUsers() {
        const users = localStorage.getItem(this.USERS_KEY);
        return users ? JSON.parse(users) : [];
    }

    static saveUser(user) {
        const users = this.getUsers();
        users.push(user);
        localStorage.setItem(this.USERS_KEY, JSON.stringify(users));
    }

    static findUser(email) {
        const users = this.getUsers();
        return users.find(u => u.email === email);
    }

    static setCurrentUser(user) {
        localStorage.setItem(this.CURRENT_USER_KEY, JSON.stringify(user));
    }

    static getCurrentUser() {
        const user = localStorage.getItem(this.CURRENT_USER_KEY);
        return user ? JSON.parse(user) : null;
    }

    static logout() {
        localStorage.removeItem(this.CURRENT_USER_KEY);
    }

    static getProfiles(userEmail) {
        const allProfiles = localStorage.getItem(this.PROFILES_KEY);
        const profiles = allProfiles ? JSON.parse(allProfiles) : {};
        return profiles[userEmail] || [];
    }

    static saveProfiles(userEmail, profiles) {
        const allProfiles = localStorage.getItem(this.PROFILES_KEY);
        const profilesData = allProfiles ? JSON.parse(allProfiles) : {};
        profilesData[userEmail] = profiles;
        localStorage.setItem(this.PROFILES_KEY, JSON.stringify(profilesData));
    }
}

// Gestión de pantallas
class ScreenManager {
    static showScreen(screenId) {
        document.querySelectorAll('.screen').forEach(screen => {
            screen.classList.remove('active');
        });
        document.getElementById(screenId).classList.add('active');
    }
}

// Gestión de autenticación
class AuthManager {
    static init() {
        const loginForm = document.getElementById('login-form');
        const registerForm = document.getElementById('register-form');
        const showRegisterBtn = document.getElementById('show-register');
        const showLoginBtn = document.getElementById('show-login');
        const logoutBtn = document.getElementById('logout-btn');

        // Cambiar entre pantallas
        showRegisterBtn.addEventListener('click', (e) => {
            e.preventDefault();
            ScreenManager.showScreen('register-screen');
        });

        showLoginBtn.addEventListener('click', (e) => {
            e.preventDefault();
            ScreenManager.showScreen('login-screen');
        });

        // Login
        loginForm.addEventListener('submit', (e) => {
            e.preventDefault();
            this.handleLogin();
        });

        // Registro
        registerForm.addEventListener('submit', (e) => {
            e.preventDefault();
            this.handleRegister();
        });

        // Logout
        logoutBtn.addEventListener('click', () => {
            this.handleLogout();
        });

        // Verificar si hay usuario logueado
        this.checkAuth();
    }

    static handleLogin() {
        const email = document.getElementById('login-email').value;
        const password = document.getElementById('login-password').value;

        const user = StorageManager.findUser(email);

        if (user && user.password === password) {
            StorageManager.setCurrentUser(user);
            this.showDashboard();
            this.showAlert('¡Bienvenido!', 'success');
        } else {
            this.showAlert('Credenciales incorrectas', 'error');
        }
    }

    static handleRegister() {
        const name = document.getElementById('register-name').value;
        const email = document.getElementById('register-email').value;
        const password = document.getElementById('register-password').value;
        const confirm = document.getElementById('register-confirm').value;

        // Validaciones
        if (password !== confirm) {
            this.showAlert('Las contraseñas no coinciden', 'error');
            return;
        }

        if (password.length < 6) {
            this.showAlert('La contraseña debe tener al menos 6 caracteres', 'error');
            return;
        }

        // Verificar si el usuario ya existe
        if (StorageManager.findUser(email)) {
            this.showAlert('Este correo ya está registrado', 'error');
            return;
        }

        // Guardar usuario
        const user = { name, email, password };
        StorageManager.saveUser(user);
        StorageManager.setCurrentUser(user);

        this.showAlert('¡Cuenta creada exitosamente!', 'success');
        setTimeout(() => {
            this.showDashboard();
        }, 1000);
    }

    static handleLogout() {
        StorageManager.logout();
        ScreenManager.showScreen('login-screen');
        document.getElementById('login-form').reset();
        this.showAlert('Sesión cerrada', 'success');
    }

    static checkAuth() {
        const user = StorageManager.getCurrentUser();
        if (user) {
            this.showDashboard();
        } else {
            ScreenManager.showScreen('login-screen');
        }
    }

    static showDashboard() {
        const user = StorageManager.getCurrentUser();
        document.getElementById('user-name-display').textContent = user.name;
        ScreenManager.showScreen('dashboard-screen');
        ProfileManager.loadProfiles();
    }

    static showAlert(message, type) {
        const existingAlert = document.querySelector('.alert');
        if (existingAlert) {
            existingAlert.remove();
        }

        const alert = document.createElement('div');
        alert.className = `alert alert-${type}`;
        alert.textContent = message;

        const activeScreen = document.querySelector('.screen.active .form-container');
        if (activeScreen) {
            activeScreen.insertBefore(alert, activeScreen.firstChild);
            setTimeout(() => alert.remove(), 3000);
        }
    }
}

// Gestión de perfiles
class ProfileManager {
    static currentEditId = null;

    static init() {
        const addProfileBtn = document.getElementById('add-profile-btn');
        const profileForm = document.getElementById('profile-form');
        const modal = document.getElementById('profile-modal');
        const closeBtn = modal.querySelector('.close');
        const cancelBtn = modal.querySelector('.cancel-btn');
        const searchInput = document.getElementById('search-input');

        // Abrir modal para nuevo perfil
        addProfileBtn.addEventListener('click', () => {
            this.openModal();
        });

        // Cerrar modal
        closeBtn.addEventListener('click', () => {
            this.closeModal();
        });

        cancelBtn.addEventListener('click', () => {
            this.closeModal();
        });

        // Cerrar modal al hacer clic fuera
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                this.closeModal();
            }
        });

        // Guardar perfil
        profileForm.addEventListener('submit', (e) => {
            e.preventDefault();
            this.saveProfile();
        });

        // Búsqueda
        searchInput.addEventListener('input', (e) => {
            this.filterProfiles(e.target.value);
        });
    }

    static openModal(profile = null) {
        const modal = document.getElementById('profile-modal');
        const modalTitle = document.getElementById('modal-title');
        const form = document.getElementById('profile-form');

        form.reset();

        if (profile) {
            modalTitle.textContent = 'Editar Perfil';
            this.currentEditId = profile.id;

            // Llenar formulario con datos existentes
            document.getElementById('profile-name').value = profile.name;
            document.getElementById('profile-lastname').value = profile.lastname;
            document.getElementById('profile-id').value = profile.idNumber;
            document.getElementById('profile-birth').value = profile.birthDate;
            document.getElementById('profile-phone').value = profile.phone;
            document.getElementById('profile-card').value = profile.creditCard || '';
            document.getElementById('profile-email').value = profile.email || '';
            document.getElementById('profile-address').value = profile.address || '';
        } else {
            modalTitle.textContent = 'Agregar Perfil';
            this.currentEditId = null;
        }

        modal.classList.add('active');
    }

    static closeModal() {
        const modal = document.getElementById('profile-modal');
        modal.classList.remove('active');
        this.currentEditId = null;
    }

    static saveProfile() {
        const user = StorageManager.getCurrentUser();
        const profiles = StorageManager.getProfiles(user.email);

        const profileData = {
            id: this.currentEditId || Date.now(),
            name: document.getElementById('profile-name').value,
            lastname: document.getElementById('profile-lastname').value,
            idNumber: document.getElementById('profile-id').value,
            birthDate: document.getElementById('profile-birth').value,
            phone: document.getElementById('profile-phone').value,
            creditCard: document.getElementById('profile-card').value,
            email: document.getElementById('profile-email').value,
            address: document.getElementById('profile-address').value,
            createdAt: this.currentEditId ? 
                profiles.find(p => p.id === this.currentEditId).createdAt : 
                new Date().toISOString()
        };

        if (this.currentEditId) {
            // Editar perfil existente
            const index = profiles.findIndex(p => p.id === this.currentEditId);
            profiles[index] = profileData;
        } else {
            // Agregar nuevo perfil
            profiles.push(profileData);
        }

        StorageManager.saveProfiles(user.email, profiles);
        this.closeModal();
        this.loadProfiles();
        this.showNotification(this.currentEditId ? 'Perfil actualizado' : 'Perfil agregado');
    }

    static deleteProfile(id) {
        if (!confirm('¿Estás seguro de eliminar este perfil?')) {
            return;
        }

        const user = StorageManager.getCurrentUser();
        let profiles = StorageManager.getProfiles(user.email);
        profiles = profiles.filter(p => p.id !== id);
        StorageManager.saveProfiles(user.email, profiles);
        this.loadProfiles();
        this.showNotification('Perfil eliminado');
    }

    static loadProfiles() {
        const user = StorageManager.getCurrentUser();
        const profiles = StorageManager.getProfiles(user.email);
        const container = document.getElementById('profiles-container');

        if (profiles.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <h3>No hay perfiles registrados</h3>
                    <p>Comienza agregando tu primer perfil</p>
                </div>
            `;
            return;
        }

        container.innerHTML = profiles.map(profile => this.createProfileCard(profile)).join('');

        // Agregar event listeners a los botones
        profiles.forEach(profile => {
            document.getElementById(`edit-${profile.id}`).addEventListener('click', () => {
                this.openModal(profile);
            });

            document.getElementById(`delete-${profile.id}`).addEventListener('click', () => {
                this.deleteProfile(profile.id);
            });
        });
    }

    static createProfileCard(profile) {
        const formatDate = (dateString) => {
            const date = new Date(dateString);
            return date.toLocaleDateString('es-ES', { 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric' 
            });
        };

        const maskCreditCard = (card) => {
            if (!card) return 'No registrada';
            return card.replace(/\d(?=\d{4})/g, '*');
        };

        return `
            <div class="profile-card fade-in">
                <div class="profile-header">
                    <div class="profile-name">${profile.name} ${profile.lastname}</div>
                    <div class="profile-actions">
                        <button id="edit-${profile.id}" class="btn btn-edit">Editar</button>
                        <button id="delete-${profile.id}" class="btn btn-danger">Eliminar</button>
                    </div>
                </div>
                <div class="profile-info">
                    <div class="info-item">
                        <span class="info-label">Identificación</span>
                        <span class="info-value">${profile.idNumber}</span>
                    </div>
                    <div class="info-item">
                        <span class="info-label">Fecha de Nacimiento</span>
                        <span class="info-value">${formatDate(profile.birthDate)}</span>
                    </div>
                    <div class="info-item">
                        <span class="info-label">Teléfono</span>
                        <span class="info-value">${profile.phone}</span>
                    </div>
                    <div class="info-item">
                        <span class="info-label">Tarjeta de Crédito</span>
                        <span class="info-value">${maskCreditCard(profile.creditCard)}</span>
                    </div>
                    ${profile.email ? `
                        <div class="info-item">
                            <span class="info-label">Correo</span>
                            <span class="info-value">${profile.email}</span>
                        </div>
                    ` : ''}
                    ${profile.address ? `
                        <div class="info-item">
                            <span class="info-label">Dirección</span>
                            <span class="info-value">${profile.address}</span>
                        </div>
                    ` : ''}
                </div>
            </div>
        `;
    }

    static filterProfiles(searchTerm) {
        const user = StorageManager.getCurrentUser();
        const profiles = StorageManager.getProfiles(user.email);
        const container = document.getElementById('profiles-container');

        const filtered = profiles.filter(profile => {
            const fullName = `${profile.name} ${profile.lastname}`.toLowerCase();
            const id = profile.idNumber.toLowerCase();
            const search = searchTerm.toLowerCase();
            return fullName.includes(search) || id.includes(search);
        });

        if (filtered.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <h3>No se encontraron resultados</h3>
                    <p>Intenta con otro término de búsqueda</p>
                </div>
            `;
            return;
        }

        container.innerHTML = filtered.map(profile => this.createProfileCard(profile)).join('');

        // Agregar event listeners
        filtered.forEach(profile => {
            document.getElementById(`edit-${profile.id}`).addEventListener('click', () => {
                this.openModal(profile);
            });

            document.getElementById(`delete-${profile.id}`).addEventListener('click', () => {
                this.deleteProfile(profile.id);
            });
        });
    }

    static showNotification(message) {
        const notification = document.createElement('div');
        notification.className = 'alert alert-success';
        notification.textContent = message;
        notification.style.position = 'fixed';
        notification.style.top = '20px';
        notification.style.right = '20px';
        notification.style.zIndex = '9999';

        document.body.appendChild(notification);
        setTimeout(() => notification.remove(), 3000);
    }
}

// Inicializar la aplicación
document.addEventListener('DOMContentLoaded', () => {
    AuthManager.init();
    ProfileManager.init();
});