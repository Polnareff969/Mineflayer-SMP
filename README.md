# 🎃 Billionaire Bunker Master v10.0

An industrial-grade Mineflayer bot designed for cracked servers. This bot manages a 100x100 underground pumpkin farm, handles complex lobby-to-world transitions, and maintains chunk loading through perimeter patrols.

## 🚀 Full Feature Suite

* **Smart Auth Memory:** Automatically toggles between `/register` and `/login` based on deployment state.
* **Lobby Escape Protocol:** High-precision pathfinding to NPC coordinates; only triggers when the Master is detected.
* **Sign-Aware Warehouse:** Only interacts with containers marked with a `Collector` sign.
* **Hygienic Sorting:** Scans chests to ensure zero "trash" items are mixed with pumpkins.
* **Dynamic Overflow:** Automatically places and fills **Barrels** if the primary warehouse is full.
* **Industrial Cycles:** * **5m:** Collector check + Anti-AFK micro-jumps.
    * **15m:** 100x100 perimeter patrol for chunk activation.
* **Auto-Nutrition:** Automated golden carrot consumption for max saturation.

---

## 🛠️ Installation & Setup

### 1. GitHub Configuration
1. Clone this repository.
2. Ensure `index.js` and `package.json` are in the root folder.
3. Update the `LOBBY_NPC_COORDS` in `index.js` with your server's specific coordinates.

### 2. Render.com Deployment
1. Create a **Web Service** on Render and connect your repo.
2. **Runtime:** Node
3. **Build Command:** `npm install`
4. **Start Command:** `node index.js`
5. **Environment Variables:** * Add `ALREADY_REGISTERED` = `false` for the first run.
    * After the bot successfully registers, change this to `true` to enable auto-login.

---

## 🎮 Workflow & Commands

### First Run (Setup)
1. Bot joins lobby and registers.
2. Join the server as `.HattoriZXCZ`. The bot will run to the NPC and warp.
3. Use `type: /tp .HattoriZXCZ` to bring the bot to the bunker.
4. Give the bot **Golden Carrots** and **Barrels**.
5. Place a sign on your main chest labeled `Collector`.
6. Type `start farming botbot` in Minecraft chat.

### Routine Runs
The bot will automatically login and spawn in the bunker. Simply join and type `start farming botbot` to resume industrial cycles.

### Master Chat Commands
| Command | Action |
| :--- | :--- |
| `start farming botbot` | Initializes all warehouse and patrol timers. |
| `type: [command]` | Proxy command execution (e.g., `type: /home`, `type: /sethome`). |
| `escape lobby` | Manual trigger for the NPC pathfinding. |

---

## ⚠️ Important Notes
* **Uptime:** Use a service like `cron-job.org` to ping your Render URL every 5 minutes to prevent the bot from sleeping.
* **Persistence:** Ensure the `BUNKER_Y` and `PATROL_POINTS` in `index.js` match your farm's exact layout.
