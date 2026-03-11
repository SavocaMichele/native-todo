import express from 'express';
import cors from 'cors';
import {initDatabase, seedTodos, Todo} from "./assets/js/models/index.js";
import path from "path";


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

        res.status(201).json({
            key: created.id,
            title: created.title,
            content: created.content,
            status: created.status,
            priority: created.priority,
            deadline: created.deadline ? created.deadline.toISOString().split('T')[0] : null
        });
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

        res.json({
            key: t.id,
            title: t.title,
            content: t.content,
            status: t.status,
            priority: t.priority,
            deadline: t.deadline ? t.deadline.toISOString().split('T')[0] : null
        });
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

        res.status(204).send();
    } catch (err) {
        console.error('DELETE /api/todos/:id error', err);
        res.status(500).json({ error: 'Failed to delete todo' });
    }
});


async function startServer() {
    try {
        await initDatabase();
        await seedTodos();

        app.listen(PORT, IP, () => console.log(`Server running on http://${IP}:${PORT}`));
    }

    catch (error) {
        console.error("Error starting the Server:", error);
        process.exit(1); // End Process with failure
    }
}

startServer();