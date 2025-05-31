const express = require('express');
const fs = require('fs');
const path = require('path');
const cors = require('cors');

const app = express();
const PORT = 3000;
const DATA_FILE = path.join(__dirname, 'data', 'warframes.json');
// Añade estas rutas al servidor
const WEAPONS_FILE = path.join(__dirname, 'data', 'primary-weapons.json');
const SECONDARY_WEAPONS_FILE = path.join(__dirname, 'data', 'secondary-weapons.json');
const MELEE_WEAPONS_FILE = path.join(__dirname, 'data', 'melee-weapons.json');

// Configuración
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));
app.use('/images', express.static(path.join(__dirname, 'public', 'images')));

// Inicializar archivo de datos si no existe
if (!fs.existsSync(DATA_FILE)) {
    fs.mkdirSync(path.dirname(DATA_FILE), { recursive: true });
    fs.writeFileSync(DATA_FILE, '[]');
}
// Crear archivos si no existen
[WEAPONS_FILE, SECONDARY_WEAPONS_FILE, MELEE_WEAPONS_FILE].forEach(file => {
    if (!fs.existsSync(file)) {
        fs.writeFileSync(file, '[]');
    }
});

// Rutas API
app.get('/api/warframes', (req, res) => {
    fs.readFile(DATA_FILE, 'utf8', (err, data) => {
        if (err) {
            console.error('Error leyendo archivo:', err);
            return res.status(500).json({ error: 'Error interno del servidor' });
        }
        try {
            const warframes = JSON.parse(data);
            res.json(warframes);
        } catch (parseError) {
            console.error('Error parseando JSON:', parseError);
            res.status(500).json({ error: 'Error en formato de datos' });
        }
    });
});

// Rutas para armas (similar a warframes)
app.get('/api/primary-weapons', (req, res) => {
    fs.readFile(WEAPONS_FILE, 'utf8', (err, data) => {
        if (err) return res.status(500).json({ error: 'Error reading weapons' });
        res.json(JSON.parse(data || '[]'));
    });
});

app.get('/api/secondary-weapons', (req, res) => {
    fs.readFile(SECONDARY_WEAPONS_FILE, 'utf8', (err, data) => {
        if (err) return res.status(500).json({ error: 'Error reading secondary weapons' });
        res.json(JSON.parse(data || '[]'));
    });
});

app.get('/api/melee-weapons', (req, res) => {
    fs.readFile(MELEE_WEAPONS_FILE, 'utf8', (err, data) => {
        if (err) return res.status(500).json({ error: 'Error reading melee weapons' });
        res.json(JSON.parse(data || '[]'));
    });
});

// Otras rutas API (POST, PUT, DELETE) aquí...
// Añade esta ruta POST en server.js
// Reemplazar setupFormSubmit con esta versión mejorada
function setupFormSubmit() {
    document.getElementById('warframeForm').addEventListener('submit', async (e) => {
        e.preventDefault();
        
        // Obtener y validar los valores del formulario
        const nameInput = document.getElementById('warframeName');
        const name = nameInput.value.trim();
        
        if (!name) {
            showError('El nombre del warframe es requerido');
            nameInput.focus();
            return;
        }

        // Crear objeto con todos los datos del warframe
        const warframeData = {
            name,
            neuropticas: parseInt(document.getElementById('neuropticas').value) || 0,
            chasis: parseInt(document.getElementById('chasis').value) || 0,
            systemas: parseInt(document.getElementById('systemas').value) || 0,
            plano: parseInt(document.getElementById('plano').value) || 0,
            pl: parseInt(document.getElementById('warframePL').value) || 0,
            image: `images/warframes/${name.toLowerCase().replace(/\s+/g, '-')}.webp`
        };

        // Validación adicional de cantidades no negativas
        const parts = ['neuropticas', 'chasis', 'systemas', 'plano', 'pl'];
        for (const part of parts) {
            if (warframeData[part] < 0) {
                showError(`La cantidad de ${part} no puede ser negativa`);
                document.getElementById(part).focus();
                return;
            }
        }

        try {
            // Determinar si es una edición o creación nueva
            const method = currentEditWarframe ? 'PUT' : 'POST';
            const url = currentEditWarframe 
                ? `/api/warframes/${encodeURIComponent(currentEditWarframe)}`
                : '/api/warframes';

            // Enviar datos al servidor
            const response = await fetch(url, {
                method,
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(warframeData)
            });

            // Manejar respuesta del servidor
            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.error || `Error ${response.status}: ${response.statusText}`);
            }

            // Cerrar modal y actualizar lista
            document.getElementById('warframeModal').style.display = 'none';
            loadWarframes();
            
            // Mostrar notificación adecuada
            showSuccess(
                currentEditWarframe 
                    ? `Warframe "${name}" actualizado correctamente` 
                    : `Warframe "${name}" añadido correctamente`
            );
            
            // Resetear variable de edición
            currentEditWarframe = null;
            
        } catch (error) {
            console.error('Error al guardar warframe:', error);
            showError(error.message || 'Error al guardar el warframe');
            
            // Mostrar detalles adicionales en consola para depuración
            if (error.response) {
                console.error('Detalles del error:', await error.response.json());
            }
        }
    });
}

// Ruta para obtener un warframe específico
app.get('/api/warframes/:name', (req, res) => {
    fs.readFile(DATA_FILE, 'utf8', (err, data) => {
        if (err) return res.status(500).send('Error reading data');
        
        const warframes = JSON.parse(data);
        const warframe = warframes.find(wf => wf.name === req.params.name);
        
        if (!warframe) return res.status(404).send('Warframe not found');
        res.json(warframe);
    });
});
app.post('/api/warframes', (req, res) => {
    fs.readFile(DATA_FILE, 'utf8', (err, data) => {
        if (err) {
            console.error('Error leyendo archivo:', err);
            return res.status(500).json({ error: 'Error interno del servidor' });
        }

        try {
            const warframes = JSON.parse(data);
            const newWarframe = req.body;
            
            // Validación básica
            if (!newWarframe.name || typeof newWarframe.name !== 'string') {
                return res.status(400).json({ error: 'Nombre inválido' });
            }

            // Verificar si ya existe
            if (warframes.some(wf => wf.name.toLowerCase() === newWarframe.name.toLowerCase())) {
                return res.status(400).json({ error: 'El warframe ya existe' });
            }

            // Añadir nuevo warframe
            warframes.push(newWarframe);
            
            // Guardar en archivo
            fs.writeFile(DATA_FILE, JSON.stringify(warframes, null, 2), (err) => {
                if (err) {
                    console.error('Error guardando archivo:', err);
                    return res.status(500).json({ error: 'Error guardando datos' });
                }
                res.status(201).json(newWarframe);
            });
        } catch (error) {
            console.error('Error procesando datos:', error);
            res.status(500).json({ error: 'Error en el servidor' });
        }
    });
});
app.post('/api/primary-weapons', (req, res) => {
    const filePath = path.join(__dirname, 'data', 'primary-weapons.json');
    
    fs.readFile(filePath, 'utf8', (err, data) => {
        if (err) return res.status(500).json({ error: 'Error reading file' });
        
        const weapons = JSON.parse(data || '[]');
        const newWeapon = req.body;
        
        // Validación básica
        if (!newWeapon.name || typeof newWeapon.name !== 'string') {
            return res.status(400).json({ error: 'Nombre inválido' });
        }
        
        weapons.push({
            name: newWeapon.name,
            stock: parseInt(newWeapon.stock) || 0,
            receiver: parseInt(newWeapon.receiver) || 0,
            barrel: parseInt(newWeapon.barrel) || 0,
            blueprint: parseInt(newWeapon.blueprint) || 0,
            pl: parseInt(newWeapon.pl) || 0,
            image: newWeapon.image || `images/primary-weapons/${newWeapon.name.toLowerCase().replace(/\s+/g, '-')}.webp`
        });
        
        fs.writeFile(filePath, JSON.stringify(weapons, null, 2), (err) => {
            if (err) return res.status(500).json({ error: 'Error saving data' });
            res.status(201).json(newWeapon);
        });
    });
});

app.post('/api/secondary-weapons', (req, res) => {
    handleWeaponCreation(SECONDARY_WEAPONS_FILE, req, res);
});

app.post('/api/melee-weapons', (req, res) => {
    handleWeaponCreation(MELEE_WEAPONS_FILE, req, res);
});

// Ruta para eliminar
app.delete('/api/warframes/:name', (req, res) => {
    fs.readFile(DATA_FILE, 'utf8', (err, data) => {
        if (err) return res.status(500).send('Error reading data');
        
        let warframes = JSON.parse(data);
        const initialLength = warframes.length;
        warframes = warframes.filter(wf => wf.name !== req.params.name);
        
        if (warframes.length === initialLength) {
            return res.status(404).send('Warframe not found');
        }
        
        fs.writeFile(DATA_FILE, JSON.stringify(warframes, null, 2), (err) => {
            if (err) return res.status(500).send('Error saving data');
            res.status(200).send('Warframe deleted');
        });
    });
});

app.put('/api/warframes/:name', (req, res) => {
    fs.readFile(DATA_FILE, 'utf8', (err, data) => {
        if (err) return res.status(500).send('Error reading data');
        
        let warframes = JSON.parse(data);
        const index = warframes.findIndex(wf => wf.name === req.params.name);
        
        if (index === -1) return res.status(404).send('Warframe not found');
        
        warframes[index] = { ...warframes[index], ...req.body };
        
        fs.writeFile(DATA_FILE, JSON.stringify(warframes, null, 2), (err) => {
            if (err) return res.status(500).send('Error saving data');
            res.json(warframes[index]);
        });
    });
});

function handleWeaponCreation(file, req, res) {
    fs.readFile(file, 'utf8', (err, data) => {
        if (err) return res.status(500).json({ error: 'Error reading file' });
        
        const weapons = JSON.parse(data || '[]');
        const newWeapon = req.body;
        
        if (!newWeapon.name) {
            return res.status(400).json({ error: 'Name is required' });
        }
        
        weapons.push(newWeapon);
        
        fs.writeFile(file, JSON.stringify(weapons, null, 2), (err) => {
            if (err) return res.status(500).json({ error: 'Error saving data' });
            res.status(201).json(newWeapon);
        });
    });
}

app.listen(PORT, () => {
    console.log(`Servidor ejecutándose en http://localhost:${PORT}`);
});
