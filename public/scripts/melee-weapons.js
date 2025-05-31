let currentEditMeleeWeapon = null;

document.addEventListener('DOMContentLoaded', () => {
    loadMeleeWeapons();
    setupMeleeWeaponForm();
    setupMeleeEventListeners();
});

async function loadMeleeWeapons() {
    try {
        const response = await fetch('/api/melee-weapons');
        const weapons = await response.json();
        renderMeleeWeapons(weapons);
        updateMeleeStats(weapons);
    } catch (error) {
        console.error('Error loading melee weapons:', error);
    }
}

function renderMeleeWeapons(weapons) {
    const grid = document.getElementById('melee-weapons-grid');
    grid.innerHTML = '';

    weapons.forEach(weapon => {
        const card = document.createElement('div');
        card.className = 'weapon-card melee';
        card.innerHTML = `
            <div class="weapon-header">
                <h3>${weapon.name}</h3>
                <span class="weapon-pl">PL: ${weapon.pl || 0}</span>
            </div>
            <div class="weapon-parts">
                <div class="part">
                    <span class="part-name">Hoja</span>
                    <span class="part-count">${weapon.blade || 0}</span>
                </div>
                <div class="part">
                    <span class="part-name">Mango</span>
                    <span class="part-count">${weapon.handle || 0}</span>
                </div>
                <div class="part">
                    <span class="part-name">Guardamanos</span>
                    <span class="part-count">${weapon.guard || 0}</span>
                </div>
                <div class="part">
                    <span class="part-name">Plano</span>
                    <span class="part-count">${weapon.blueprint || 0}</span>
                </div>
            </div>
            <div class="weapon-actions">
                <button class="edit-weapon" data-id="${weapon.name}">
                    <i class="fas fa-edit"></i> Editar
                </button>
                <button class="delete-weapon" data-id="${weapon.name}">
                    <i class="fas fa-trash"></i> Eliminar
                </button>
            </div>
        `;
        grid.appendChild(card);
    });
}

function updateMeleeStats(weapons) {
    const total = weapons.length;
    const complete = weapons.filter(w => 
        w.blade > 0 && w.handle > 0 && w.guard > 0 && w.blueprint > 0
    ).length;
    
    document.getElementById('total-melee').textContent = total;
    document.getElementById('complete-melee').textContent = complete;
}

function setupMeleeWeaponForm() {
    document.getElementById('meleeWeaponForm').addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const weaponData = {
            name: document.getElementById('meleeWeaponName').value,
            blade: parseInt(document.getElementById('meleeBlade').value) || 0,
            handle: parseInt(document.getElementById('meleeHandle').value) || 0,
            guard: parseInt(document.getElementById('meleeGuard').value) || 0,
            blueprint: parseInt(document.getElementById('meleeBlueprint').value) || 0,
            pl: parseInt(document.getElementById('meleeWeaponPL').value) || 0
        };

        try {
            const method = currentEditMeleeWeapon ? 'PUT' : 'POST';
            const endpoint = currentEditMeleeWeapon 
                ? `/api/melee-weapons/${currentEditMeleeWeapon}`
                : '/api/melee-weapons';

            const response = await fetch(endpoint, {
                method,
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(weaponData)
            });

            if (!response.ok) throw new Error('Error saving weapon');

            document.getElementById('meleeWeaponModal').style.display = 'none';
            loadMeleeWeapons();
            currentEditMeleeWeapon = null;
        } catch (error) {
            console.error('Error:', error);
        }
    });
}

function setupMeleeEventListeners() {
    // Abrir modal para añadir
    document.getElementById('addMeleeWeaponBtn').addEventListener('click', () => {
        currentEditMeleeWeapon = null;
        document.getElementById('meleeWeaponForm').reset();
        document.getElementById('meleeModalTitle').textContent = 'Añadir Nueva Arma Melee';
        document.getElementById('meleeWeaponModal').style.display = 'block';
    });

    // Delegación de eventos para editar/eliminar
    document.addEventListener('click', (e) => {
        if (e.target.closest('.edit-weapon')) {
            const weaponName = e.target.closest('.edit-weapon').dataset.id;
            editMeleeWeapon(weaponName);
        }
        
        if (e.target.closest('.delete-weapon')) {
            const weaponName = e.target.closest('.delete-weapon').dataset.id;
            deleteMeleeWeapon(weaponName);
        }
    });
}

async function editMeleeWeapon(name) {
    try {
        const response = await fetch(`/api/melee-weapons/${name}`);
        const weapon = await response.json();
        
        document.getElementById('meleeWeaponName').value = weapon.name;
        document.getElementById('meleeBlade').value = weapon.blade || 0;
        document.getElementById('meleeHandle').value = weapon.handle || 0;
        document.getElementById('meleeGuard').value = weapon.guard || 0;
        document.getElementById('meleeBlueprint').value = weapon.blueprint || 0;
        document.getElementById('meleeWeaponPL').value = weapon.pl || 0;
        
        currentEditMeleeWeapon = name;
        document.getElementById('meleeModalTitle').textContent = `Editar ${weapon.name}`;
        document.getElementById('meleeWeaponModal').style.display = 'block';
    } catch (error) {
        console.error('Error editing weapon:', error);
    }
}

async function deleteMeleeWeapon(name) {
    if (!confirm(`¿Eliminar ${name}?`)) return;
    
    try {
        const response = await fetch(`/api/melee-weapons/${name}`, {
            method: 'DELETE'
        });
        
        if (!response.ok) throw new Error('Error deleting weapon');
        
        loadMeleeWeapons();
    } catch (error) {
        console.error('Error:', error);
    }
}