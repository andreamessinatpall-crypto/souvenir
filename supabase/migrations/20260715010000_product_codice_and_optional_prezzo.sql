-- Aggiunge il codice prodotto (generato lato client da tipologia+nome)
-- e rende il prezzo di vendita opzionale: il prezzo di acquisto diventa
-- il dato principale, quello di vendita è un'informazione facoltativa.

alter table products add column codice text;
alter table products alter column prezzo drop not null;
