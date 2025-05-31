// primary-weapons.js - Versión corregida y optimizada

let currentEditPrimaryWeapon = null;
let quantityControlsInitialized = false;

// Función principal de inicialización
function initializePrimaryWeapons() {
    setupPrimaryWeaponModal();
    setupPrimaryWeaponForm();
    setupEventDelegation();
    loadPrimaryWeapons();
    
    // Inicializar controles de cantidad solo una vez
    if (!quantityControlsInitialized) {
        setupQuantityControls();
        quantityControlsInitialized = true;
    }
}

// Cargar armas primarias desde la API
async function loadPrimaryWeapons() {
    try {
        showLoading(true);
        const response = await fetch('/api/primary-weapons');
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        
        const weapons = await response.json();
        renderPrimaryWeapons(weapons);
        updatePrimaryStats(weapons);
    } catch (error) {
        console.error('Error loading primary weapons:', error);
        showError('No se pudieron cargar las armas primarias');
    } finally {
        showLoading(false);
    }
}

// Renderizar la lista de armas
function renderPrimaryWeapons(weapons) {
    const grid = document.getElementById('primary-weapons-grid');
    if (!grid) {
        console.error('Elemento primary-weapons-grid no encontrado');
        return;
    }

    grid.innerHTML = '';

    if (weapons.length === 0) {
        grid.innerHTML = '<div class="no-weapons">No hay armas primarias registradas</div>';
        return;
    }

    weapons.forEach(weapon => {
        const card = document.createElement('div');
        card.className = 'weapon-card primary';
        card.innerHTML = `
            <div class="weapon-header">
                <h3>${weapon.name}</h3>
                <span class="weapon-pl">
                    <span class="pl-label">PL:</span>
                    <span class="pl-value">${weapon.pl || 0}</span>
                </span>
            </div>
            <div class="weapon-content">
                <div class="weapon-details">
                    <div class="weapon-parts">
                        <div class="part">
                            <span class="part-name">Culata</span>
                            <span class="part-count">${weapon.stock}</span>
                        </div>
                        <div class="part">
                            <span class="part-name">Receptor</span>
                            <span class="part-count">${weapon.receiver}</span>
                        </div>
                        <div class="part">
                            <span class="part-name">Cañón</span>
                            <span class="part-count">${weapon.barrel}</span>
                        </div>
                        <div class="part">
                            <span class="part-name">Plano</span>
                            <span class="part-count">${weapon.blueprint}</span>
                        </div>
                    </div>
                </div>
                <div class="weapon-image" style="background-image: url('${weapon.image || 'images/primary-weapons/default.webp'}')"
                     onerror="this.style.backgroundImage='url(images/primary-weapons/default.webp)'"></div>
            </div>
            <div class="weapon-actions">
                <button class="edit-weapon" data-weapon="${weapon.name}">
                    <i class="fas fa-edit"></i> Editar
                </button>
                <button class="delete-weapon" data-weapon="${weapon.name}">
                    <i class="fas fa-trash"></i> Eliminar
                </button>
            </div>
        `;
        grid.appendChild(card);
    });
}

// Actualizar estadísticas
function updatePrimaryStats(weapons) {
    const total = weapons.length;
    const complete = weapons.filter(w => 
        w.stock > 0 && w.receiver > 0 && w.barrel > 0 && w.blueprint > 0
    ).length;
    
    const totalEl = document.getElementById('total-primary');
    const completeEl = document.getElementById('complete-primary');
    
    if (totalEl) totalEl.textContent = total;
    if (completeEl) completeEl.textContent = complete;
}

// Configurar el modal
function setupPrimaryWeaponModal() {
    const modal = document.getElementById('primaryWeaponModal');
    if (!modal) {
        console.error('Modal de armas primarias no encontrado');
        return;
    }

    // Botón para abrir modal
    document.getElementById('addPrimaryWeaponBtn')?.addEventListener('click', () => {
        currentEditPrimaryWeapon = null;
        document.getElementById('primaryWeaponForm').reset();
        document.getElementById('primaryModalTitle').textContent = 'Añadir Nueva Arma Primaria';
        modal.style.display = 'block';
    });

    // Botón para cerrar modal
    modal.querySelector('.close-modal')?.addEventListener('click', () => {
        modal.style.display = 'none';
    });

    // Clic fuera del modal para cerrar
    window.addEventListener('click', (event) => {
        if (event.target === modal) {
            modal.style.display = 'none';
        }
    });
}

// Configurar el formulario
function setupPrimaryWeaponForm() {
    const form = document.getElementById('primaryWeaponForm');
    if (!form) {
        console.error('Formulario de armas primarias no encontrado');
        return;
    }

    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const submitBtn = form.querySelector('button[type="submit"]');
        const originalText = submitBtn.innerHTML;
        submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Guardando...';
        submitBtn.disabled = true;

        try {
            const formData = {
                name: document.getElementById('primaryWeaponName').value.trim(),
                stock: parseInt(document.getElementById('primaryStock').value) || 0,
                receiver: parseInt(document.getElementById('primaryReceiver').value) || 0,
                barrel: parseInt(document.getElementById('primaryBarrel').value) || 0,
                blueprint: parseInt(document.getElementById('primaryBlueprint').value) || 0,
                pl: parseInt(document.getElementById('primaryWeaponPL').value) || 0,
                image: `images/primary-weapons/${document.getElementById('primaryWeaponName').value.trim().toLowerCase().replace(/\s+/g, '-')}.webp`
            };

            if (!formData.name) {
                throw new Error('El nombre del arma es requerido');
            }

            const method = currentEditPrimaryWeapon ? 'PUT' : 'POST';
            const url = currentEditPrimaryWeapon 
                ? `/api/primary-weapons/${encodeURIComponent(currentEditPrimaryWeapon)}`
                : '/api/primary-weapons';

            const response = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData)
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.message || 'Error al guardar el arma');
            }

            document.getElementById('primaryWeaponModal').style.display = 'none';
            await loadPrimaryWeapons();
            showSuccess(currentEditPrimaryWeapon 
                ? 'Arma actualizada correctamente' 
                : 'Arma añadida correctamente');
            
            currentEditPrimaryWeapon = null;
        } catch (error) {
            console.error('Error al guardar:', error);
            showError(error.message || 'Error al guardar el arma');
        } finally {
            submitBtn.innerHTML = originalText;
            submitBtn.disabled = false;
        }
    });
}

// Configurar controles de cantidad

function setupQuantityControls() {
    // Eliminar todos los listeners click del documento (peligroso)
    const newDoc = document.cloneNode(true);
    document.replaceWith(newDoc);
    
    // Nueva implementación con delegación de eventos
    document.addEventListener('click', function(e) {
        if (e.target.classList.contains('quantity-btn')) {
            e.stopImmediatePropagation(); // Detiene todos los demás handlers
            
            const action = e.target.dataset.action;
            const part = e.target.dataset.part;
            const input = document.getElementById(part);
            
            if (!input) return;
            
            let value = parseInt(input.value) || 0;
            
            if (action === 'increase') {
                input.value = value + 1;
            } else {
                input.value = Math.max(0, value - 1);
            }
        }
    }, true); // Usamos captura en lugar de burbuja
}

function handleQuantityButtonClick(e) {
    const quantityBtn = e.target.closest('.quantity-btn');
    if (!quantityBtn) return;
    
    e.preventDefault();
    e.stopImmediatePropagation();
    
    const action = quantityBtn.getAttribute('data-action');
    const part = quantityBtn.getAttribute('data-part');
    const input = document.getElementById(part);
    
    if (!input) {
        console.warn(`Input no encontrado para parte: ${part}`);
        return;
    }
    
    let value = parseInt(input.value) || 0;
    
    if (action === 'increase') {
        input.value = value + 1;
    } else if (action === 'decrease') {
        input.value = Math.max(0, value - 1);
    }
    
    // Disparar evento change
    input.dispatchEvent(new Event('change', { bubbles: true }));
}
// Configurar delegación de eventos
function setupEventDelegation() {
    document.addEventListener('click', (e) => {
        const editBtn = e.target.closest('.edit-weapon');
        const deleteBtn = e.target.closest('.delete-weapon');
        
        if (editBtn) {
            editPrimaryWeapon(editBtn.dataset.weapon);
        }
        
        if (deleteBtn) {
            deletePrimaryWeapon(deleteBtn.dataset.weapon);
        }
    });
}

// Editar un arma existente
async function editPrimaryWeapon(name) {
    try {
        showLoading(true);
        const response = await fetch(`/api/primary-weapons/${name}`);
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        
        const weapon = await response.json();
        currentEditPrimaryWeapon = name;
        
        document.getElementById('primaryWeaponName').value = weapon.name;
        document.getElementById('primaryStock').value = weapon.stock;
        document.getElementById('primaryReceiver').value = weapon.receiver;
        document.getElementById('primaryBarrel').value = weapon.barrel;
        document.getElementById('primaryBlueprint').value = weapon.blueprint;
        document.getElementById('primaryWeaponPL').value = weapon.pl || 0;
        
        document.getElementById('primaryModalTitle').textContent = `Editar ${weapon.name}`;
        document.getElementById('primaryWeaponModal').style.display = 'block';
    } catch (error) {
        console.error('Error al editar:', error);
        showError('No se pudo cargar el arma para editar');
    } finally {
        showLoading(false);
    }
}

// Eliminar un arma
async function deletePrimaryWeapon(name) {
    if (!confirm(`¿Estás seguro de eliminar "${name}"? Esta acción no se puede deshacer.`)) {
        return;
    }
    
    try {
        showLoading(true);
        const response = await fetch(`/api/primary-weapons/${name}`, {
            method: 'DELETE'
        });
        
        if (!response.ok) throw new Error(await response.text());
        
        await loadPrimaryWeapons();
        showSuccess(`"${name}" eliminada correctamente`);
    } catch (error) {
        console.error('Error al eliminar:', error);
        showError('No se pudo eliminar el arma');
    } finally {
        showLoading(false);
    }
}

// Mostrar/ocultar loading
function showLoading(show) {
    const loader = document.getElementById('loading-overlay');
    if (loader) {
        loader.style.display = show ? 'flex' : 'none';
    }
}

// Mostrar notificación de error
function showError(message) {
    const notification = document.createElement('div');
    notification.className = 'notification error';
    notification.innerHTML = `<i class="fas fa-exclamation-circle"></i> ${message}`;
    document.body.appendChild(notification);
    setTimeout(() => notification.remove(), 5000);
}

// Mostrar notificación de éxito
function showSuccess(message) {
    const notification = document.createElement('div');
    notification.className = 'notification success';
    notification.innerHTML = `<i class="fas fa-check-circle"></i> ${message}`;
    document.body.appendChild(notification);
    setTimeout(() => notification.remove(), 3000);
}

// Exportar para inicialización controlada
window.initializePrimaryWeapons = initializePrimaryWeapons;

// Inicialización automática si el DOM ya está cargado
if (document.readyState !== 'loading') {
    initializePrimaryWeapons();
} else {
    document.addEventListener('DOMContentLoaded', initializePrimaryWeapons);
}