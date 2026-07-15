# Gestionale Souvenir Cefalù — Istruzioni per Claude Code

## Obiettivo
App PWA installabile su smartphone per gestire vendite e magazzino di un negozio di souvenir. Deve funzionare completamente offline (dati salvati sul telefono) e sincronizzarsi in automatico su Supabase quando torna la connessione. Priorità assoluta: semplicità d'uso. Chi la usa non è esperto di tecnologia — pensala come una cassa touch, non come un gestionale complesso.

## Stack tecnico
- React 19 + TypeScript + Vite
- Dexie.js (wrapper su IndexedDB) come database locale — è la fonte di verità, l'app deve funzionare al 100% anche senza mai andare online
- Supabase come backend di sync/backup (Postgres + Auth con singolo utente)
- vite-plugin-pwa per installabilità e funzionamento offline (service worker, manifest, icone)
- Tailwind CSS per lo stile, ottimizzato mobile-first (l'app si usa SOLO da telefono, verticale)
- Hosting: Cloudflare Pages (come circolo.v2)

## Principio guida per l'UX
Ogni schermata deve essere usabile senza istruzioni. Regole:
- Pulsanti grandi, testo grande, poche parole
- Massimo 2-3 tap per completare una vendita
- Niente menu nascosti o gesture complesse: navigazione con bottom bar fissa a 3 voci (Vendi / Magazzino / Report)
- Conferme visive immediate (es. animazione/checkmark dopo una vendita registrata)
- Nessun campo obbligatorio "tecnico" (niente SKU, niente codici a barre a meno che non lo richieda dopo)
- Numeri e prezzi sempre in formato italiano (€, virgola decimale)

## Modello dati (Dexie / IndexedDB, poi mirror su Supabase)

**products**
- id (uuid)
- nome (string)
- categoria (string, opzionale — es. "Calamite", "Magliette", "Ceramiche")
- prezzo (number)
- quantita (number, giacenza attuale)
- soglia_minima (number, default 3 — sotto questa soglia mostra avviso "scorta bassa")
- foto (opzionale, base64 o url — vedi nota sotto)
- fornitore_id (fk, opzionale)
- costo_acquisto (number, opzionale — abilita calcolo margine)
- created_at, updated_at

**sales**
- id (uuid)
- data (timestamp)
- totale (number)
- metodo_pagamento (enum: contanti / carta)
- created_at

**sale_items**
- id (uuid)
- sale_id (fk)
- product_id (fk)
- nome_prodotto (denormalizzato, così resta leggibile anche se il prodotto viene poi eliminato)
- quantita (number)
- prezzo_unitario (number)

**suppliers**
- id (uuid)
- nome (string)
- telefono (string, opzionale — abilita chiamata/WhatsApp diretti)
- note (string, opzionale)
- created_at, updated_at

**orders** (ordini a fornitore)
- id (uuid)
- fornitore_id (fk)
- data (timestamp)
- stato (enum: in_attesa / ricevuto)
- totale_costo (number)
- created_at, updated_at

**order_items**
- id (uuid)
- order_id (fk)
- product_id (fk)
- nome_prodotto (denormalizzato)
- quantita (number)
- costo_unitario (number)

**sync_queue** (tabella tecnica interna)
- id, tabella, record_id, operazione (insert/update/delete), stato (pending/synced/error), timestamp

## Logica di sync
- L'app scrive SEMPRE prima su Dexie (locale), mai aspetta la rete
- Ogni scrittura locale aggiunge una riga a `sync_queue`
- Un listener su `navigator.onLine` + un retry ogni 30 secondi processano la coda verso Supabase
- Conflict resolution: dato che è un solo dispositivo, va bene "ultima scrittura vince" (last-write-wins) — non serve una logica complessa
- Mostrare un piccolo indicatore discreto (pallino verde/grigio) in alto che segnala "sincronizzato" vs "in attesa di rete" — senza essere invasivo

## Schermate

### 1. Vendi (schermata principale all'apertura)
- Griglia di prodotti (foto/nome/prezzo), tap per aggiungere al carrello
- Barra in basso col totale carrello sempre visibile
- Tap su totale → schermata riepilogo → scegli contanti/carta → "Conferma vendita" (1 tap)
- Dopo conferma: scala automaticamente le quantità a magazzino, torna alla griglia prodotti

### 2. Magazzino
- Selettore in alto a due stati: `Prodotti` / `Fornitori`
- **Vista Prodotti**: lista prodotti con giacenza attuale, evidenziati in rosso/arancio quelli sotto soglia minima. Tap su prodotto → modifica rapida (prezzo, quantità, nome, foto, fornitore, costo di acquisto — tutti i nuovi campi opzionali). Pulsante grande "+ Nuovo prodotto" in evidenza. Aggiungere/togliere quantità con pulsanti +/- grandi, non tastiera numerica come default
- **Vista Fornitori**: elenco fornitori (nome, telefono, numero di prodotti collegati), con "+ Nuovo fornitore" in evidenza (solo nome obbligatorio, telefono e note opzionali). Tap su un fornitore → scheda fornitore con nome, telefono (tap diretto → chiamata o WhatsApp), note, e sotto la lista dei prodotti che fornisce con foto/nome/prezzo/giacenza, più pulsante "+ Aggiungi prodotto a questo fornitore" (apre la scheda nuovo prodotto con fornitore precompilato)
- **Lista "Da ordinare"**: generata automaticamente, prodotti sotto soglia minima raggruppati per fornitore, con pulsante "Ordina su WhatsApp" che apre `wa.me` con messaggio precompilato (es. "Vorrei ordinare: Calamite Cefalù x20, Magneti ceramica x10. Grazie!"). Se il fornitore non ha telefono, il pulsante diventa "Segna come ordinato"
- **Storico ordini**: ogni fornitore mostra il suo ultimo ordine con pulsante "Ordina di nuovo" (ripropone le stesse quantità). Quando la merce arriva: tap su ordine "in attesa" → "Segna ricevuto" → conferma quantità (uguali all'ordine con un tap, o modifica con +/-) → aggiorna il magazzino in automatico

### 3. Report
- Incasso di oggi, di questa settimana, di questo mese (3 numeri grandi, ben visibili)
- Se è stato inserito un costo_acquisto sui prodotti: un quarto numero opzionale "Guadagno stimato" (incasso − costo prodotti venduti). Se non ci sono costi inseriti, il numero semplicemente non compare
- Lista prodotti più venduti (top 5)
- Nessun grafico complesso: numeri chiari e diretti

## Setup Supabase richiesto
1. Nuovo progetto Supabase (separato da circolo.v2)
2. Tabelle `products`, `sales`, `sale_items`, `suppliers`, `orders`, `order_items` speculari allo schema Dexie sopra
3. Auth: singolo utente (email/password), niente registrazione pubblica
4. Row Level Security attiva, solo l'utente proprietario può leggere/scrivere

## Foto prodotti — nota
Per tenere l'app leggera e davvero offline-first, meglio salvare le foto come immagini compresse (max ~200kb, ridimensionate lato client prima del salvataggio) direttamente in IndexedDB, con sync opzionale su Supabase Storage in un secondo momento. Non bloccare il salvo prodotto in attesa dell'upload foto. Stesso meccanismo va riusato per l'aggiunta prodotto dalla scheda fornitore.

## Fasi di implementazione (in ordine)
1. Setup progetto Vite + PWA + Tailwind, verifica che l'app si installi e si apra offline (anche vuota)
2. Schema Dexie + CRUD prodotti (schermata Magazzino) — funzionante 100% offline
3. Schermata Vendi con carrello e scarico automatico magazzino
4. Schermata Report con calcoli su dati locali
5. Setup Supabase + sync queue + indicatore stato connessione
6. Rifinitura UX: animazioni conferma, stati vuoti, gestione errori in modo silenzioso (mai bloccare l'utente con errori tecnici)
7. Gestione fornitori: elenco fornitori, collegamento prodotto-fornitore, lista "Da ordinare" con WhatsApp, storico ordini e ricezione merce, margine opzionale nei Report

## Cosa NON fare
- Non aggiungere funzioni non richieste (fatturazione, gestione clienti, multi-utente) in questa fase
- Non usare terminologia tecnica nell'interfaccia (mai "sync", "queue", "IndexedDB" visibili all'utente)
- Non richiedere login ripetuti: una volta autenticato, resta loggato
- Non aggiungere condizioni contrattuali, listini multipli o pagamenti/fatture ai fornitori — il modulo fornitori serve solo a riordinare in fretta, non a fare contabilità
