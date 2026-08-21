# Mytheder

Česká online karetní hra pro partu. Založíš místnost, dostaneš pětiznakový kód, pošleš ho kámošům — a hrajete. Žádné účty, žádné reklamy, žádný veřejný seznam místností.

Fork původní hry od **Sáry Hýžové**, která projekt v roce 2024 ukončila a zveřejnila kód pro komunitní vývoj. Původní autorství viz [LICENSE](LICENSE).

---

## Co se v tomhle forku změnilo

- **Žádná databáze.** Původní build držel karty v MySQL přes Prismu, ale hra do nich nikdy nezapisuje — jen čte. Karty (1016 kusů) se teď načtou při startu ze souborů v `server/cards/`. Odpadl tím celý databázový server.
- **Jen soukromé místnosti.** Veřejný seznam místností a "náhodně připojit" jsou pryč. Dovnitř se dostaneš kódem nebo odkazem.
- **Čitelné kódy.** Pětiznakový kód místo osmiznakového hexu. Písmena `O`/`I`/`L` se automaticky převádí na `0`/`1`, velikost písmen a pomlčky nevadí — `k7-f2q` otevře stejnou místnost jako `K7F2Q`.
- **Bez účtů.** Přihlašování přes Google a Discord bylo odstraněné (bez původních API klíčů stejně nefungovalo). Hraje se pod přezdívkou.
- **Chat.** Původní `RoomChat.svelte` byl prázdný soubor — hra chat nikdy neměla. Teď má: zprávy, historie pro toho, kdo přijde později, systémové hlášky (kdo přišel, kdo odešel, kdo bere bod) a ochrana proti spamu.
- **Tematické balíčky.** Místo dvou historických balíčků je jich pět podle témat: *Sex a erotika*, *Hnus a tělesnosti*, *Politika a dějiny*, *Popkultura*, *Absurdní humor*. Karta nese štítky, ne příslušnost k jednomu balíčku — většina karet patří do víc témat najednou. Když vybereš víc balíčků, karty se sloučí a nedublují.
- **Nový vzhled.** Téma *Mytheder*: zlato a tyrkys na temně modročerné, podle grafiky balíčku.
- **HTTP + WebSocket.** Server odpovídá na `/health`, takže se dá hostovat na platformách, které kontrolují běh služby.

## Přebarvení pro jiný server

Celý vzhled visí na třech barvách a čtyřech obrázcích, takže překlopit hru pro jinou komunitu je práce na pár minut, ne na odpoledne.

1. `client/src/app.css` — nahoře v paletě přepiš `--accent-rgb`, `--accent-2-rgb` a `--ember-rgb`. Všechny odstíny v aplikaci se počítají z nich; v komponentách nejsou žádné natvrdo zapsané barvy.
2. `client/public/img/` — vyměň `card-back.webp` (rub karty, ořízni na poměr 4:5), `logo_white.png` a `logo.png` (640×128, světlá a tmavá varianta) a `favicon.png` (128×128).
3. `client/src/components/layout/LayoutMenu.svelte` — nahoře `COMMUNITY_NAME` a `COMMUNITY_DISCORD` (prázdný odkaz = jméno se vypíše jako text).
4. `client/index.html` a `wrangler.jsonc` — název hry a jméno Workeru (mění URL).

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

> Hra potřebuje **3 hráče**, aby šla spustit.
>
> Na testování přidej do adresy `?tab` — třeba `http://localhost:5173/?tab`.
> Identita se pak drží per-záložka místo per-prohlížeč, takže tři záložky
> v jednom okně jsou tři různí hráči. Bez `?tab` jsou všechny záložky jeden
> hráč (což je správně: otevřeš hru podruhé a máš svoje místo s sebou).

### Vlastní karty

Karty jsou obyčejný JSON v `server/cards/`. Bílá karta:

```json
{ "id": 784, "text": "Tvoje vlastní karta", "tags": ["absurdni"] }
```

Černá karta má navíc `pick` (kolik bílých karet se doplňuje). Štítky jsou
`sex`, `hnus`, `politika`, `popkultura`, `absurdni` — karta jich může mít víc.
Přidat karty = upravit soubor a restartovat server. Žádné migrace.

## Test

V repozitáři je integrační test: připojí tři hráče, projde chat a odehraje celou hru do konce.

```powershell
# v jednom okně
cd server
npm run dev

# ve druhém
cd server
npm run test
```

Proti nasazenému serveru:

```powershell
$env:TEST_SERVER_URL="wss://kpl-server.onrender.com"; npm run test
```

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

   Stačí adresa serveru z kroku 1. Klient si doplní `wss://` sám, takže se to nedá splést.
4. Deploy.

Adresa serveru se dá zadat jakkoliv — `kpl-server.onrender.com`, `https://kpl-server.onrender.com`
i `wss://kpl-server.onrender.com` fungují stejně, klient si `wss://` doplní sám.

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
