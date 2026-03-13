(function () {
    // Presence / Socket.io client
    if (!window.io) {
        console.warn('Socket.io client not found. Presence disabled.');
        return;
    }

    const socket = io();
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

    function pickColor(seed) {
        if (!seed) return palette[Math.floor(Math.random() * palette.length)];

        let hash = 0;

        for (let i = 0; i < seed.length; i++) hash = (hash << 5) - hash + seed.charCodeAt(i) | 0;

        return palette[Math.abs(hash) % palette.length];
    }

    /**
     *  Assign client data to localStorage
     */
    let clientMeta = JSON.parse(localStorage.getItem('presence:meta') || 'null');
    if (!clientMeta) {
        const id    = 'u-' + Math.random().toString(36).slice(2, 9);
        const color = pickColor(id);

        clientMeta         = {
            id,
            name: `User-${id.slice(-4)}`,
            color
        };

        localStorage.setItem('presence:meta', JSON.stringify(clientMeta));
    }


    /** Append the presence-container */
    function ensureContainer() {
        let el = document.getElementById('presence-container');
        if (!el) {
            el              = document.createElement('div');
            el.id           = 'presence-container';
            el.className    = 'presence-container';

            document.body.appendChild(el);
        }
        return el;
    }


    /** Render a dot-list of online users */
    function renderPresenceList(list) {
        const container = ensureContainer();
        container.innerHTML = '';

        list.forEach(u => {
            const d = document.createElement('div');

            d.className             = 'presence-dot';
            d.title                 = u.name;
            d.style.background      = u.color || '#888';

            container.appendChild(d);
        });
    }

    /** Update presence style for to-do */
    function updateTodoPresence(key, users) {
        const selector  = `.todo-item[data-key="${key}"]`;
        const elem    = document.querySelector(selector);

        if (!elem) return;

        // Remove any existing badges and visual markers
        const existingBadges = elem.querySelector('.todo-presence-badges');
        if (existingBadges) existingBadges.remove();
        elem.classList.remove('presence-active');

        elem.style.borderLeft   = '';
        elem.style.borderColor  = '';

        if (!users || users.length === 0) return;

        elem.classList.add('presence-active');

        // set a visible border color using first user's color
        if (users[0] && users[0].color) {
            elem.style.borderColor = users[0].color;
        }
    }

    // socket handlers
    socket.on('connect', () => {
        socket.emit('presence:join', {name: clientMeta.name, color: clientMeta.color});
    });

    socket.on('presence:list', (list) => {
        renderPresenceList(list);
    });

    socket.on('todo:presence', (payload) => {
        updateTodoPresence(payload.key, payload.users || []);
    });

    // When todos change on the server, reload data so all clients update
    async function triggerReload() {
        const tryReload = async (attemptsLeft) => {
            try {
                if (window.todo && window.todo.loadTemplateData) {
                    await window.todo.loadTemplateData();
                    if (window.updateBoard) {
                        window.updateBoard(window.todo.getAll());
                    } else if (typeof window.updateBoard === 'undefined') {
                        try {
                            //
                        } catch (e) {
                            console.error(e);
                        }
                    }
                    return true;
                }
            } catch (e) {
                console.error(e);
            }

            if (attemptsLeft > 0) {
                setTimeout(() => tryReload(attemptsLeft - 1), 200);
            }
            return false;
        };

        await tryReload(10); // retry for ~2 seconds
    }

    socket.on('todo:created', async (payload) => {
        await triggerReload();
    });

    socket.on('todo:updated', async (payload) => {
        await triggerReload();
    });

    socket.on('todo:deleted', async (payload) => {
        await triggerReload();
    });

    // listen to popup close events to clean up presence
    window.addEventListener('popup:closed', (e) => {
        try {
            const key = e && e.detail && e.detail.todoKey;
            if (key) {
                updateTodoPresence(key, []);
                if (window.presence && window.presence.leaveTodo) window.presence.leaveTodo(key);
            }
        } catch (ex) {}
    });

    // window API for other scripts
    window.presence = {
        enterTodo(key) {
            if (!socket.connected) return;
            socket.emit('todo:enter', {key});
        },
        leaveTodo(key) {
            if (!socket.connected) return;
            socket.emit('todo:leave', {key});
        },
        join(name, color) {
            clientMeta.name     = name || clientMeta.name;
            clientMeta.color    = color || clientMeta.color;

            localStorage.setItem('presence:meta', JSON.stringify(clientMeta));
            socket.emit('presence:join', {name: clientMeta.name, color: clientMeta.color});
        },
        leave() {
            socket.emit('presence:leave');
        }
    };

    // leave presence on unload
    window.addEventListener('beforeunload', () => {
        try {
            socket.emit('presence:leave');
        } catch (e) {
        }
    });

})();
