# Karty proti lidskosti

Česká online verze karetní hry. Založíš místnost, dostaneš pětiznakový kód, pošleš ho kámošům — a hrajete. Žádné účty, žádné reklamy, žádný veřejný seznam místností.

Fork původní hry od **Sáry Hýžové**, která projekt v roce 2024 ukončila a zveřejnila kód pro komunitní vývoj. Původní autorství viz [LICENSE](LICENSE).

---

## Co se v tomhle forku změnilo

- **Žádná databáze.** Původní build držel karty v MySQL přes Prismu, ale hra do nich nikdy nezapisuje — jen čte. Karty (1016 kusů) se teď načtou při startu ze souborů v `server/cards/`. Odpadl tím celý databázový server.
- **Jen soukromé místnosti.** Veřejný seznam místností a "náhodně připojit" jsou pryč. Dovnitř se dostaneš kódem nebo odkazem.
- **Čitelné kódy.** Pětiznakový kód místo osmiznakového hexu. Písmena `O`/`I`/`L` se automaticky převádí na `0`/`1`, velikost písmen a pomlčky nevadí — `k7-f2q` otevře stejnou místnost jako `K7F2Q`.
- **Bez účtů.** Přihlašování přes Google a Discord bylo odstraněné (bez původních API klíčů stejně nefungovalo). Hraje se pod přezdívkou.
- **Nový vzhled.** Tmavé neonové téma.
- **HTTP + WebSocket.** Server odpovídá na `/health`, takže se dá hostovat na platformách, které kontrolují běh služby.

## Jak to rozjet lokálně

Potřebuješ Node 20+.

**Server** (PowerShell):

```powershell
cd server
npm install
npm run dev
```

Poslouchá na portu 3000. Otevři `http://localhost:3000/health` — musí odpovědět `{"status":"ok",...}`.

**Klient** (druhé okno PowerShellu):

```powershell
cd client
npm install
npm run dev
```

Klient si v dev režimu sám sáhne na `ws://localhost:3000`.

> Hra potřebuje **3 hráče**, aby šla spustit. Na testování otevři tři okna prohlížeče (aspoň jedno anonymní — identita se drží v `localStorage`).

## Nasazení zdarma

Server a web se hostují zvlášť.

### 1. Server → Render

1. [render.com](https://render.com) → **New** → **Blueprint** → vyber tenhle repozitář.
2. Render si přečte [`render.yaml`](render.yaml) a službu vytvoří sám. Nic nevyplňuj.
3. Až doběhne, zkopíruj adresu služby, např. `https://kpl-server.onrender.com`.

Na free plánu server po 15 minutách ticha usne a probouzí se asi minutu. Provoz z rozehrané hry ho drží vzhůru — čeká jen ten, kdo přijde jako první.

### 2. Web → Cloudflare Pages

1. [pages.cloudflare.com](https://pages.cloudflare.com) → **Create a project** → připoj tenhle repozitář.
2. Nastav:
   - **Framework preset:** none
   - **Build command:** `npm install && npm run build`
   - **Build output directory:** `dist`
   - **Root directory:** `client`
3. Přidej proměnnou prostředí:
   - **`VITE_SERVER_URL`** = `wss://kpl-server.onrender.com`

   Adresa serveru z kroku 1, ale s **`wss://`** místo `https://`. Stránka na https nesmí otevřít nešifrovaný WebSocket — prohlížeč to zablokuje.
4. Deploy.

Změna proměnné `VITE_SERVER_URL` se projeví až po novém buildu — je zapečená do JS.

## Struktura

```
server/          Node + WebSocket herní server (TypeScript, spouští se přes tsx)
  src/game/      místnosti, hráči, kola
  src/networking/ protokol, RPC, identita
  cards/         balíčky karet (JSON)
client/          Svelte + Vite
  src/pages/     obrazovky
  src/lib/       síť, identita, pomocné věci
```

Protokol mezi klientem a serverem je JSON pole `[nonce, type, data]` přes WebSocket, obousměrné RPC.
