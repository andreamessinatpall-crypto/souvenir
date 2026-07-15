-- Suddivide la giacenza prodotto tra "in negozio" (esposta, scalata dalle vendite)
-- e "scorta" (negli scatoli, alimentata dagli ordini ricevuti e travasata a mano).

alter table products add column quantita_negozio integer not null default 0;
alter table products add column quantita_scorta integer not null default 0;

update products set quantita_negozio = quantita, quantita_scorta = 0;

alter table products drop column quantita;
