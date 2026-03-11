import express from 'express';
import cors from 'cors';
import {initDatabase, seedTodos, Todo} from "./assets/js/models/index.js";
import path from "path";
import http from 'http';
import { Server as SocketIO } from 'socket.io';


const app = express();
const PORT= 3000;
const IP   = "127.0.0.1";

const root = process.cwd();
// Middleware
app.use(express.json());
app.use(cors());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(root, 'public')));
app.use('/assets', express.static(path.join(root, 'assets')));

// --- Todo REST API ---
app.get('/api/todos', async (req, res) => {
    try {
        const todos = await Todo.findAll({ order: [['id', 'ASC']] });
        const mapped = todos.map(t => ({
            key: t.id,
            title: t.title,
            content: t.content,
            status: t.status,
            priority: t.priority,
            deadline: t.deadline ? t.deadline.toISOString().split('T')[0] : null
        }));

        res.json(mapped);
    } catch (err) {
        console.error('GET /api/todos error', err);
        res.status(500).json({ error: 'Failed to fetch todos' });
    }
});

app.get('/api/todos/:id', async (req, res) => {
    try {
        const id = parseInt(req.params.id);
        const t = await Todo.findByPk(id);

        if (!t) return res.status(404).json({ error: 'Not found' });

        res.json({
            key: t.id,
            title: t.title,
            content: t.content,
            status: t.status,
            priority: t.priority,
            deadline: t.deadline ? t.deadline.toISOString().split('T')[0] : null
        });
    } catch (err) {
        console.error('GET /api/todos/:id error', err);
        res.status(500).json({ error: 'Failed to fetch todo' });
    }
});

app.post('/api/todos', async (req, res) => {
    try {
        const { title, content, status, priority, deadline } = req.body;
        const created = await Todo.create({
            title,
            content,
            status,
            priority,
            deadline: deadline || null
        });

        const payload = {
            key: created.id,
            title: created.title,
            content: created.content,
            status: created.status,
            priority: created.priority,
            deadline: created.deadline ? created.deadline.toISOString().split('T')[0] : null
        };

        // Broadcast creation to all connected clients
        try { io.emit('todo:created', payload); } catch (e) { console.error('Emit error', e); }

        res.status(201).json(payload);
    } catch (err) {
        console.error('POST /api/todos error', err);
        res.status(500).json({ error: 'Failed to create todo' });
    }
});

app.put('/api/todos/:id', async (req, res) => {
    try {
        const id = parseInt(req.params.id);
        const { title, content, status, priority, deadline } = req.body;
        const t = await Todo.findByPk(id);

        if (!t) return res.status(404).json({ error: 'Not found' });
        await t.update({ title, content, status, priority, deadline: deadline || null });

        const payload = {
            key: t.id,
            title: t.title,
            content: t.content,
            status: t.status,
            priority: t.priority,
            deadline: t.deadline ? t.deadline.toISOString().split('T')[0] : null
        };

        // Broadcast update to all connected clients
        try { io.emit('todo:updated', payload); } catch (e) { console.error('Emit error', e); }

        res.json(payload);
    } catch (err) {
        console.error('PUT /api/todos/:id error', err);
        res.status(500).json({ error: 'Failed to update todo' });
    }
});

app.delete('/api/todos/:id', async (req, res) => {
    try {
        const id = parseInt(req.params.id);
        const t = await Todo.findByPk(id);

        if (!t) return res.status(404).json({ error: 'Not found' });
        await t.destroy();

        // Broadcast deletion to all connected clients
        try { io.emit('todo:deleted', { key: id }); } catch (e) { console.error('Emit error', e); }

        res.status(204).send();
    } catch (err) {
        console.error('DELETE /api/todos/:id error', err);
        res.status(500).json({ error: 'Failed to delete todo' });
    }
});


// --- Socket.io ---
const httpServer = http.createServer(app);
const io = new SocketIO(httpServer, {
    cors: { origin: '*' }
});


const connections = new Map();
const todoPresence = new Map();


function broadcastPresenceList() {
    const list = Array.from(connections.entries()).map(([socketId, meta]) => ({ socketId, ...meta }));
    io.emit('presence:list', list);
}

io.on('connection', (socket) => {
    const palette = [
        '#E91E63',
        '#9C27B0',
        '#3F51B5',
        '#03A9F4',
        '#009688',
        '#4CAF50',
        '#FF9800',
        '#795548'
    ];

    const color = palette[Math.floor(Math.random() * palette.length)];
    const meta = { id: socket.id, color, name: `User-${socket.id.slice(0,4)}` };

    connections.set(socket.id, meta);
    broadcastPresenceList();

    socket.on('presence:join', (payload) => {
        if (payload && payload.name) connections.get(socket.id).name = String(payload.name).slice(0,32);
        if (payload && payload.color) connections.get(socket.id).color = String(payload.color).slice(0,16);
        broadcastPresenceList();
    });

    socket.on('presence:leave', () => {
        connections.delete(socket.id);
        for (const [key, set] of todoPresence.entries()) {
            set.delete(socket.id);
            if (set.size === 0) todoPresence.delete(key);
            else io.emit('todo:presence', { key: Number(key), users: Array.from(set).map(id => connections.get(id)).filter(Boolean) });
        }

        broadcastPresenceList();
    });

    socket.on('todo:enter', (data) => {
        const key = String(data && data.key);

        if (!key) return;
        if (!todoPresence.has(key)) todoPresence.set(key, new Set());

        todoPresence.get(key).add(socket.id);

        const users = Array.from(todoPresence.get(key)).map(id => connections.get(id)).filter(Boolean);
        io.emit('todo:presence', { key: Number(key), users });
    });

    socket.on('todo:leave', (data) => {
        const key = String(data && data.key);
        if (!key) return;

        const set = todoPresence.get(key);
        if (!set) return;

        set.delete(socket.id);
        if (set.size === 0) todoPresence.delete(key);

        const users = set ? Array.from(set).map(id => connections.get(id)).filter(Boolean) : [];
        io.emit('todo:presence', { key: Number(key), users });
    });

    socket.on('disconnect', () => {
        connections.delete(socket.id);

        for (const [key, set] of todoPresence.entries()) {
            set.delete(socket.id);
            if (set.size === 0) todoPresence.delete(key);
            else io.emit('todo:presence', { key: Number(key), users: Array.from(set).map(id => connections.get(id)).filter(Boolean) });
        }

        broadcastPresenceList();
    });
});


async function startServer() {
    try {
        await initDatabase();
        await seedTodos();

        httpServer.listen(PORT, IP, () => console.log(`Server running on http://${IP}:${PORT}`));
    }

    catch (error) {
        console.error("Error starting the Server:", error);
        process.exit(1); // End Process with failure
    }
}

startServer();