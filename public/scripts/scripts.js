// ==================== VARIABLES GLOBALES ====================
let currentEditWarframe = null;
let sortAscending = true;
let currentSortCriteria = 'name';
window.primaryWeaponsLoaded = false;

// ==================== FUNCIONES WARFRAMES ====================
function verifyElements() {
    const requiredElements = [
        'warframes-grid', 'search', 'filter', 'addWarframeBtn', 
        'warframeModal', 'warframeForm'
    ];
    
    requiredElements.forEach(id => {
        if (!document.getElementById(id)) {
            console.error(`Elemento crítico no encontrado: #${id}`);
        }
    });
}

// Llama a esta función al inicio del DOMContentLoaded
document.addEventListener('DOMContentLoaded', () => {
    verifyElements();
    // ... resto de tu inicialización
});

function openAddModal() {
    const modal = document.getElementById('warframeModal');
    if (modal) {
        modal.style.display = 'block';
        document.getElementById('modalTitle').textContent = 'Añadir Nuevo Warframe';
        document.getElementById('warframeForm').reset();
        currentEditWarframe = null;
    } else {
        console.error('Modal no encontrado');
    }
}

async function loadWarframes() {
    try {
        const response = await fetch('/api/warframes');
        if (!response.ok) throw new Error(`Error HTTP: ${response.status}`);
        const warframes = await response.json();
        renderWarframes(warframes);
        updateStats(warframes);
    } catch (error) {
        console.error('Error cargando warframes:', error);
        showError('No se pudieron cargar los datos');
    }
}

function renderWarframes(warframes) {
    const grid = document.getElementById('warframes-grid');
    grid.innerHTML = '';

    const sortedWarframes = [...warframes].sort((a, b) => {
        if (currentSortCriteria === 'name') {
            return sortAscending 
                ? a.name.localeCompare(b.name) 
                : b.name.localeCompare(a.name);
        } else {
            return sortAscending 
                ? (a.pl || 0) - (b.pl || 0) 
                : (b.pl || 0) - (a.pl || 0);
        }
    });

    sortedWarframes.forEach(warframe => {
        const card = document.createElement('div');
        card.className = 'warframe-card';
        
        // Generar nombre de archivo de imagen
        const imageName = warframe.name.toLowerCase().replace(/\s+/g, '-');
        const imageUrl = `images/warframes/${imageName}.webp`;
        
        card.innerHTML = `
            <div class="warframe-header">
                <h3 class="warframe-name">${warframe.name}</h3>
            </div>
            <div class="warframe-content">
                <div class="warframe-details">
                    <div class="warframe-parts">
                        <div class="part">
                            <span class="part-name">Neuropticas</span>
                            <span class="part-count">${warframe.neuropticas}</span>
                        </div>
                        <div class="part">
                            <span class="part-name">Chasis</span>
                            <span class="part-count">${warframe.chasis}</span>
                        </div>
                        <div class="part">
                            <span class="part-name">Sistemas</span>
                            <span class="part-count">${warframe.systemas}</span>
                        </div>
                        <div class="part">
                            <span class="part-name">Plano</span>
                            <span class="part-count">${warframe.plano}</span>
                        </div>
                    </div>
                    <div class="warframe-pl ${currentSortCriteria === 'pl' ? 'highlight-pl' : ''}">
                        <span class="pl-label">PL</span>
                        <span class="pl-value">${warframe.pl || 0}</span>
                    </div>
                </div>
                <div class="warframe-image" style="background-image: url('${imageUrl}')" 
                 data-name="${imageName}" 
                 onerror="handleImageError(this)">
                 </div>
            </div>
            <div class="warframe-actions">
                <button class="edit-warframe" data-warframe="${warframe.name}">
                    <i class="fas fa-edit"></i> Editar
                </button>
                <button class="delete-warframe" data-warframe="${warframe.name}">
                    <i class="fas fa-trash"></i> Eliminar
                </button>
            </div>
        `;
        
        // Precargar imagen para evitar flashes
        const img = new Image();
        img.src = imageUrl;
        
        grid.appendChild(card);
        preloadImage(imageUrl, imageName);
    });
}


// Función para manejar errores de imagen
function handleImageError(imgElement) {
    imgElement.classList.add('broken');
    imgElement.style.backgroundImage = 'none';
}

// Precargar imágenes
function preloadImage(url, imageName) {
    const img = new Image();
    img.src = url;
    img.onerror = () => {
        console.warn(`La imagen para ${imageName} no se pudo cargar: ${url}`);
        // Opcional: intentar cargar una imagen por defecto diferente
        // document.querySelector(`.warframe-image[data-name="${imageName}"]`)
        //     .style.backgroundImage = "url('images/warframes/default.webp')";
    };
}

function updateStats(warframes) {
    const total = warframes.length;
    const complete = warframes.filter(wf => 
        wf.neuropticas > 0 && wf.chasis > 0 && wf.systemas > 0 && wf.plano > 0
    ).length;
    document.getElementById('total-warframes').textContent = total;
    document.getElementById('complete-warframes').textContent = complete;
}

// Función de filtrado actualizada
async function filterWarframes(searchTerm = '', filterType = 'all') {
    try {
        const response = await fetch('/api/warframes');
        if (!response.ok) throw new Error('Error en la respuesta de la API');
        
        const allWarframes = await response.json();
        
        const filtered = allWarframes.filter(warframe => {
            const nameMatches = warframe.name.toLowerCase().includes(searchTerm);
            let completionMatches = true;
            
            if (filterType === 'complete') {
                completionMatches = warframe.neuropticas > 0 && 
                                  warframe.chasis > 0 && 
                                  warframe.systemas > 0 && 
                                  warframe.plano > 0;
            } else if (filterType === 'incomplete') {
                completionMatches = warframe.neuropticas === 0 || 
                                  warframe.chasis === 0 || 
                                  warframe.systemas === 0 || 
                                  warframe.plano === 0;
            }
            
            return nameMatches && completionMatches;
        });
        
        renderWarframes(filtered);
        updateStats(filtered);
        
    } catch (error) {
        console.error('Error al filtrar:', error);
        showError('Error al filtrar los datos');
    }
}

function updateSortButton() {
    const sortButton = document.getElementById('sortButton');
    const icon = sortButton.querySelector('i');
    const textSpan = sortButton.querySelector('.sort-text');
    
    if (currentSortCriteria === 'name') {
        icon.className = sortAscending ? 'fas fa-sort-alpha-down' : 'fas fa-sort-alpha-up';
        textSpan.textContent = sortAscending ? 'Orden A-Z' : 'Orden Z-A';
    } else {
        icon.className = sortAscending ? 'fas fa-sort-numeric-down' : 'fas fa-sort-numeric-up';
        textSpan.textContent = sortAscending ? 'PL ↑' : 'PL ↓';
    }
}

function setupSorting() {
    const sortButton = document.getElementById('sortButton');
    const sortCriteria = document.getElementById('sortCriteria');
    
    sortButton.addEventListener('click', () => {
        sortAscending = !sortAscending;
        updateSortButton();
        applyCurrentFilters();
    });
    
    sortCriteria.addEventListener('change', (e) => {
        currentSortCriteria = e.target.value;
        updateSortButton();
        applyCurrentFilters();
    });
    
    updateSortButton();
}

function applyCurrentFilters() {
    const searchTerm = document.getElementById('search').value.toLowerCase();
    const filterType = document.getElementById('filter').value;
    filterWarframes(searchTerm, filterType);
}

async function editWarframe(name) {
    try {
        const response = await fetch(`/api/warframes/${name}`);
        if (!response.ok) throw new Error('Warframe no encontrado');
        
        const warframe = await response.json();
        currentEditWarframe = name;
        
        document.getElementById('warframeName').value = warframe.name;
        document.getElementById('neuropticas').value = warframe.neuropticas;
        document.getElementById('chasis').value = warframe.chasis;
        document.getElementById('systemas').value = warframe.systemas;
        document.getElementById('plano').value = warframe.plano;
        document.getElementById('warframePL').value = warframe.pl || 0;
        
        document.getElementById('modalTitle').textContent = `Editar ${warframe.name}`;
        document.getElementById('warframeModal').style.display = 'block';
    } catch (error) {
        console.error('Error al editar:', error);
        showError('No se pudo cargar el warframe para editar');
    }
}
// Asegúrate que el event listener del filtro esté así:
document.getElementById('filter').addEventListener('change', function() {
    const searchTerm = document.getElementById('search').value.toLowerCase();
    const filterType = this.value;
    filterWarframes(searchTerm, filterType);
});

async function deleteWarframe(name) {
    if (!confirm(`¿Estás seguro de eliminar ${name}?`)) return;
    
    try {
        const response = await fetch(`/api/warframes/${name}`, {
            method: 'DELETE'
        });
        
        if (!response.ok) throw new Error('Error al eliminar');
        
        loadWarframes();
        showSuccess(`${name} eliminado correctamente`);
    } catch (error) {
        console.error('Error al eliminar:', error);
        showError('No se pudo eliminar el warframe');
    }
}

function setupQuantityButtons() {
    // Limpiamos cualquier event listener previo para evitar duplicados
    document.querySelectorAll('.quantity-btn').forEach(btn => {
        btn.replaceWith(btn.cloneNode(true));
    });

    // Configuramos los nuevos listeners
    document.addEventListener('click', function(e) {
        if (e.target.classList.contains('quantity-btn')) {
            const action = e.target.getAttribute('data-action');
            const part = e.target.getAttribute('data-part');
            const input = document.getElementById(part);
            
            if (!input) return;
            
            let value = parseInt(input.value) || 0;
            
            if (action === 'increase') {
                input.value = value + 1;
            } else if (action === 'decrease' && value > 0) {
                input.value = value - 1;
            }
            
            // Dispara el evento change manualmente
            const event = new Event('change');
            input.dispatchEvent(event);
        }
    });
}

// Reemplazar setupFormSubmit con esta versión mejorada
function setupFormSubmit() {
    const form = document.getElementById('warframeForm');
    
    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        // Validación básica
        const name = document.getElementById('warframeName').value.trim();
        if (!name) {
            showError('El nombre del warframe es requerido');
            document.getElementById('warframeName').focus();
            return;
        }

        // Crear objeto con los datos
        const warframeData = {
            name,
            neuropticas: parseInt(document.getElementById('neuropticas').value) || 0,
            chasis: parseInt(document.getElementById('chasis').value) || 0,
            systemas: parseInt(document.getElementById('systemas').value) || 0,
            plano: parseInt(document.getElementById('plano').value) || 0,
            pl: parseInt(document.getElementById('warframePL').value) || 0,
            image: `images/warframes/${name.toLowerCase().replace(/\s+/g, '-')}.webp`
        };

        // Mostrar loading en el botón
        const submitBtn = form.querySelector('button[type="submit"]');
        const originalBtnText = submitBtn.innerHTML;
        submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Guardando...';
        submitBtn.disabled = true;

        try {
            // Determinar si es creación o edición
            const method = currentEditWarframe ? 'PUT' : 'POST';
            const endpoint = currentEditWarframe 
                ? `/api/warframes/${encodeURIComponent(currentEditWarframe)}` 
                : '/api/warframes';

            const response = await fetch(endpoint, {
                method,
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(warframeData)
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.message || 'Error al guardar');
            }

            // Cerrar modal y recargar datos
            document.getElementById('warframeModal').style.display = 'none';
            await loadWarframes();
            
            showSuccess(
                currentEditWarframe 
                    ? `Warframe "${name}" actualizado correctamente` 
                    : `Warframe "${name}" creado correctamente`
            );
            
            // Resetear estado de edición
            currentEditWarframe = null;
            
        } catch (error) {
            console.error('Error al guardar:', error);
            showError(error.message || 'Error al guardar el warframe');
        } finally {
            // Restaurar botón
            submitBtn.innerHTML = originalBtnText;
            submitBtn.disabled = false;
        }
    });
}

// ==================== SISTEMA DE PESTAÑAS ====================
function setupTabs() {
    // Mostrar pestaña Warframes por defecto
    document.getElementById('warframes').style.display = 'block';
    document.querySelector('.tab-btn[data-tab="warframes"]').classList.add('active');

    // Event listeners para pestañas
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            // Remover active de todos
            document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
            document.querySelectorAll('.tab-content').forEach(c => c.style.display = 'none');
            
            // Activar la seleccionada
            this.classList.add('active');
            const tabId = this.dataset.tab;
            document.getElementById(tabId).style.display = 'block';
            
            // Cargar armas primarias si es necesario
            if (tabId === 'primary-weapons' && !window.primaryWeaponsLoaded) {
                loadPrimaryWeapons();
                window.primaryWeaponsLoaded = true;
            }
        });
    });
}

function loadPrimaryWeapons() {
    fetch('/partials/primary-weapons.html')
        .then(response => {
            if (!response.ok) throw new Error('Error al cargar armas');
            return response.text();
        })
        .then(html => {
            document.getElementById('primary-weapons').innerHTML = html;
            
            // Cargar el CSS
            const cssLink = document.createElement('link');
            cssLink.href = '/styles/primary-weapons.css';
            cssLink.rel = 'stylesheet';
            document.head.appendChild(cssLink);
            
            // Cargar el JS
            const script = document.createElement('script');
            script.src = '/scripts/primary-weapons.js';
            script.onload = () => {
                // Llamar a la función de inicialización después de cargar el script
                if (window.initializePrimaryWeapons) {
                    window.initializePrimaryWeapons();
                }
            };
            document.body.appendChild(script);
        })
        .catch(error => {
            console.error('Error:', error);
            document.getElementById('primary-weapons').innerHTML = `
                <div class="error-message">
                    <i class="fas fa-exclamation-triangle"></i>
                    Error al cargar las armas primarias
                </div>
            `;
        });
}

// ==================== NOTIFICACIONES ====================
function showError(message) {
    const notification = document.createElement('div');
    notification.className = 'notification error';
    notification.innerHTML = `<i class="fas fa-exclamation-circle"></i> ${message}`;
    document.getElementById('notifications-container').appendChild(notification);
    setTimeout(() => notification.remove(), 5000);
}

function showSuccess(message) {
    const notification = document.createElement('div');
    notification.className = 'notification success';
    notification.innerHTML = `<i class="fas fa-check-circle"></i> ${message}`;
    document.getElementById('notifications-container').appendChild(notification);
    setTimeout(() => notification.remove(), 3000);
}

// ==================== INICIALIZACIÓN ====================
document.addEventListener('DOMContentLoaded', () => {
    // Sistema de pestañas
    setupTabs();
    document.getElementById('addWarframeBtn').addEventListener('click', openAddModal);
    // Configuraciones Warframes
    if (document.getElementById('warframes-grid')) {
        
        // Event listeners mejorados
        document.getElementById('addWarframeBtn').addEventListener('click', openAddModal);
        document.getElementById('search').addEventListener('input', function(e) {
            applyCurrentFilters();
        });
        document.getElementById('filter').addEventListener('change', function() {
            applyCurrentFilters();
        });
    }
    setupSorting();
    setupQuantityButtons();
    setupFormSubmit();
    loadWarframes();

    // Event delegation para botones
    document.addEventListener('click', (e) => {
        if (e.target.closest('.edit-warframe')) {
            const name = e.target.closest('.edit-warframe').dataset.warframe;
            editWarframe(name);
        }
        
        if (e.target.closest('.delete-warframe')) {
            const name = e.target.closest('.delete-warframe').dataset.warframe;
            deleteWarframe(name);
        }
        
        if (e.target.classList.contains('close-modal')) {
            document.getElementById('warframeModal').style.display = 'none';
        }
    });
        // Cerrar modal
    document.querySelector('.close-modal').addEventListener('click', () => {
        document.getElementById('warframeModal').style.display = 'none';
    });

    // Cerrar modal al hacer clic fuera
    window.addEventListener('click', (e) => {
        if (e.target === document.getElementById('warframeModal')) {
            document.getElementById('warframeModal').style.display = 'none';
        }
    });
});

// Sistema de pestañas
function setupTabs() {
    const tabs = document.querySelectorAll('.tab-btn');
    
    tabs.forEach(tab => {
        tab.addEventListener('click', () => {
            // Remover active de todos
            tabs.forEach(t => t.classList.remove('active'));
            document.querySelectorAll('.tab-content').forEach(c => {
                c.classList.remove('active');
            });
            
            // Activar la actual
            tab.classList.add('active');
            const tabId = tab.getAttribute('data-tab');
            document.getElementById(tabId).classList.add('active');
            
            // Cargar armas si es necesario
            if(tabId === 'primary-weapons' && !window.primaryWeaponsLoaded) {
                loadPrimaryWeapons();
            }
        });
    });
}

// Inicialización
document.addEventListener('DOMContentLoaded', () => {
    setupTabs();
    // ... resto de tu inicialización
});