let currentEditSecondaryWeapon = null;

document.addEventListener('DOMContentLoaded', () => {
    loadSecondaryWeapons();
    setupSecondaryWeaponForm();
    setupSecondaryEventListeners();
});

async function loadSecondaryWeapons() {
    try {
        const response = await fetch('/api/secondary-weapons');
        const weapons = await response.json();
        renderSecondaryWeapons(weapons);
        updateSecondaryStats(weapons);
    } catch (error) {
        console.error('Error loading secondary weapons:', error);
    }
}

function renderSecondaryWeapons(weapons) {
    const grid = document.getElementById('secondary-weapons-grid');
    grid.innerHTML = '';

    weapons.forEach(weapon => {
        const card = document.createElement('div');
        card.className = 'weapon-card secondary';
        card.innerHTML = `
            <div class="weapon-header">
                <h3>${weapon.name}</h3>
                <span class="weapon-pl">PL: ${weapon.pl || 0}</span>
            </div>
            <div class="weapon-parts">
                <div class="part">
                    <span class="part-name">Parte 1</span>
                    <span class="part-count">${weapon.part1 || 0}</span>
                </div>
                <div class="part">
                    <span class="part-name">Parte 2</span>
                    <span class="part-count">${weapon.part2 || 0}</span>
                </div>
                <div class="part">
                    <span class="part-name">Parte 3</span>
                    <span class="part-count">${weapon.part3 || 0}</span>
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

function updateSecondaryStats(weapons) {
    const total = weapons.length;
    const complete = weapons.filter(w => 
        w.part1 > 0 && w.part2 > 0 && w.part3 > 0 && w.blueprint > 0
    ).length;
    
    document.getElementById('total-secondary').textContent = total;
    document.getElementById('complete-secondary').textContent = complete;
}

function setupSecondaryWeaponForm() {
    document.getElementById('secondaryWeaponForm').addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const weaponData = {
            name: document.getElementById('secondaryWeaponName').value,
            part1: parseInt(document.getElementById('secondaryPart1').value) || 0,
            part2: parseInt(document.getElementById('secondaryPart2').value) || 0,
            part3: parseInt(document.getElementById('secondaryPart3').value) || 0,
            blueprint: parseInt(document.getElementById('secondaryBlueprint').value) || 0,
            pl: parseInt(document.getElementById('secondaryWeaponPL').value) || 0
        };

        try {
            const method = currentEditSecondaryWeapon ? 'PUT' : 'POST';
            const endpoint = currentEditSecondaryWeapon 
                ? `/api/secondary-weapons/${currentEditSecondaryWeapon}`
                : '/api/secondary-weapons';

            const response = await fetch(endpoint, {
                method,
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(weaponData)
            });

            if (!response.ok) throw new Error('Error saving weapon');

            document.getElementById('secondaryWeaponModal').style.display = 'none';
            loadSecondaryWeapons();
            currentEditSecondaryWeapon = null;
        } catch (error) {
            console.error('Error:', error);
        }
    });
}

function setupSecondaryEventListeners() {
    // Abrir modal para añadir
    document.getElementById('addSecondaryWeaponBtn').addEventListener('click', () => {
        currentEditSecondaryWeapon = null;
        document.getElementById('secondaryWeaponForm').reset();
        document.getElementById('secondaryModalTitle').textContent = 'Añadir Nueva Arma Secundaria';
        document.getElementById('secondaryWeaponModal').style.display = 'block';
    });

    // Delegación de eventos para editar/eliminar
    document.addEventListener('click', (e) => {
        if (e.target.closest('.edit-weapon')) {
            const weaponName = e.target.closest('.edit-weapon').dataset.id;
            editSecondaryWeapon(weaponName);
        }
        
        if (e.target.closest('.delete-weapon')) {
            const weaponName = e.target.closest('.delete-weapon').dataset.id;
            deleteSecondaryWeapon(weaponName);
        }
    });
}

async function editSecondaryWeapon(name) {
    try {
        const response = await fetch(`/api/secondary-weapons/${name}`);
        const weapon = await response.json();
        
        document.getElementById('secondaryWeaponName').value = weapon.name;
        document.getElementById('secondaryPart1').value = weapon.part1 || 0;
        document.getElementById('secondaryPart2').value = weapon.part2 || 0;
        document.getElementById('secondaryPart3').value = weapon.part3 || 0;
        document.getElementById('secondaryBlueprint').value = weapon.blueprint || 0;
        document.getElementById('secondaryWeaponPL').value = weapon.pl || 0;
        
        currentEditSecondaryWeapon = name;
        document.getElementById('secondaryModalTitle').textContent = `Editar ${weapon.name}`;
        document.getElementById('secondaryWeaponModal').style.display = 'block';
    } catch (error) {
        console.error('Error editing weapon:', error);
    }
}

async function deleteSecondaryWeapon(name) {
    if (!confirm(`¿Eliminar ${name}?`)) return;
    
    try {
        const response = await fetch(`/api/secondary-weapons/${name}`, {
            method: 'DELETE'
        });
        
        if (!response.ok) throw new Error('Error deleting weapon');
        
        loadSecondaryWeapons();
    } catch (error) {
        console.error('Error:', error);
    }
}