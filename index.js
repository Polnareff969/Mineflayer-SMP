const mineflayer = require('mineflayer');
const autoeat = require('mineflayer-auto-eat').plugin;
const pathfinder = require('mineflayer-pathfinder').pathfinder;
const { Movements, goals } = require('mineflayer-pathfinder');
const Vec3 = require('vec3');
const express = require('express');
const fs = require('fs');

// --- UPTIME SERVER ---
const app = express();
app.get('/', (req, res) => res.send('Bunker Bot Master v10.0 Active'));
app.listen(process.env.PORT || 3000);

// --- CONFIGURATION ---
const MASTER = ".HattoriZXCZ";
const PROTECTED_ITEMS = ['golden_carrot', 'barrel'];
const LOBBY_NPC_COORDS = { x: 0, y: 0, z: 0 }; // UPDATE WITH F3
const NPC_NAME = "Survival"; 
const BUNKER_Y = 64; 
const PATROL_POINTS = [
    { x: 110, y: BUNKER_Y, z: 110 }, { x: 190, y: BUNKER_Y, z: 110 },
    { x: 190, y: BUNKER_Y, z: 190 }, { x: 110, y: BUNKER_Y, z: 190 }
];

const bot = mineflayer.createBot({
    host: 'sisiwcraft.corehost.store',
    port: 20128,
    username: 'Botbot',
    auth: 'offline',
    version: '1.21.1'
});

bot.loadPlugin(pathfinder);
bot.loadPlugin(autoeat);

let isFarming = false;
const AUTH_FILE = './auth_state.json';

// --- AUTHENTICATION LOGIC ---
function handleAuth() {
    let registered = false;
    if (fs.existsSync(AUTH_FILE)) {
        registered = JSON.parse(fs.readFileSync(AUTH_FILE)).registered;
    }

    if (!registered) {
        bot.chat('/register Botbot Botbot');
        fs.writeFileSync(AUTH_FILE, JSON.stringify({ registered: true }));
    } else {
        bot.chat('/login Botbot');
    }
}

// --- STORAGE SYSTEM ---
async function findCollector() {
    const sign = bot.findBlock({
        matching: (block) => block.name.includes('sign'),
        maxDistance: 32,
        useExtraInfo: (block) => block.getSignText().some(l => l.toLowerCase().includes('collector'))
    });
    if (!sign) return null;
    return bot.findBlock({
        matching: (b) => b.name.includes('chest') || b.name === 'barrel',
        point: sign.position, maxDistance: 2
    });
}

async function depositItems() {
    const collector = await findCollector();
    const bins = bot.findBlocks({
        matching: (b) => (b.name.includes('chest') || b.name === 'barrel') && (!collector || !b.position.equals(collector.position)),
        maxDistance: 32, count: 50
    });

    for (const pos of bins) {
        await bot.pathfinder.goto(new goals.GoalBlock(pos.x, pos.y, pos.z));
        const chest = await bot.openContainer(bot.blockAt(pos));
        const items = chest.containerItems();
        const isClean = items.every(i => i.name === 'pumpkin');
        
        if (isClean && chest.freeSlotCount() > 0) {
            for (const item of bot.inventory.items()) {
                if (PROTECTED_ITEMS.includes(item.name)) continue;
                try { await chest.deposit(item.type, null, item.count); } catch (e) { break; }
            }
            chest.close();
            if (bot.inventory.emptySlotCount() > 30) return;
        } else { chest.close(); }
    }

    // Barrel Overflow Logic
    const barrelItem = bot.inventory.items().find(i => i.name === 'barrel');
    if (bot.inventory.items().some(i => i.name === 'pumpkin') && barrelItem) {
        const ref = bot.blockAt(bot.entity.position.offset(0, -1, 0));
        await bot.placeBlock(ref, new Vec3(0, 1, 0));
        await new Promise(r => setTimeout(r, 1000));
        await depositItems();
    }
}

// --- AUTOMATION LOOPS ---
async function warehouseCycle() {
    if (!isFarming) return;
    const collector = await findCollector();
    if (!collector) return;

    await bot.pathfinder.goto(new goals.GoalBlock(collector.position.x, collector.position.y, collector.position.z));
    const chest = await bot.openContainer(collector);
    const count = chest.containerItems().filter(i => i.name === 'pumpkin').reduce((s, i) => s + i.count, 0);

    if (count >= 1280) { // 20 Stacks
        for (const i of chest.containerItems().filter(i => i.name === 'pumpkin')) await chest.withdraw(i.type, null, i.count);
        chest.close();
        await depositItems();
    } else {
        chest.close();
        bot.setControlState('jump', true);
        setTimeout(() => bot.setControlState('jump', false), 500);
    }
}

async function runPatrol() {
    if (!isFarming) return;
    const mcData = require('minecraft-data')(bot.version);
    bot.pathfinder.setMovements(new Movements(bot, mcData));
    for (const p of PATROL_POINTS) {
        await bot.pathfinder.goto(new goals.GoalNear(p.x, p.y, p.z, 2));
        await new Promise(r => setTimeout(r, 2000));
    }
}

// --- EVENTS ---
bot.on('spawn', () => {
    handleAuth();
    bot.autoEat.options.priority = 'saturation';
    bot.autoEat.options.startAt = 14;
});

bot.on('playerJoined', (player) => {
    // Only run escape if MASTER joins and bot isn't at the bunker (farming) yet
    if (player.username === MASTER && !isFarming) {
        const mcData = require('minecraft-data')(bot.version);
        bot.pathfinder.setMovements(new Movements(bot, mcData));
        bot.pathfinder.goto(new goals.GoalBlock(LOBBY_NPC_COORDS.x, LOBBY_NPC_COORDS.y, LOBBY_NPC_COORDS.z)).then(() => {
            const npc = bot.nearestEntity(e => e.name?.includes(NPC_NAME) || e.displayName?.includes(NPC_NAME));
            if (npc) bot.activateEntity(npc);
        });
    }
});

bot.on('chat', (username, message) => {
    if (username !== MASTER) return;
    if (message === 'start farming botbot') {
        isFarming = true;
        bot.chat("Bunker Master Active. Initializing 5m Warehouse and 15m Patrol cycles.");
        setInterval(warehouseCycle, 5 * 60 * 1000);
        setInterval(runPatrol, 15 * 60 * 1000);
    }
    if (message.startsWith('type: ')) bot.chat(message.replace('type: ', ''));
});
