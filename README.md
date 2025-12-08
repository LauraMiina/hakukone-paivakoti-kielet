# Hakukoneen luonnos
Luonnos hakukoneen käyttöliittymälle Tilastokeskuksen datan pohjalta. Käytössä taulukko, joka on haettu täältä: https://pxdata.stat.fi/PxWeb/pxweb/fi/StatFin/StatFin__vaka/statfin_vaka_pxt_14jt.px/

## Vaaditaan
- Node.js (suositus: uusin LTS)
- npm

## Asennus ja käynnistys (localhost)
1. Kloonaa repo ja siirry kansioon:
   ```bash
   git clone <REPO-URL>
   cd paivakoti-kielet
2. Asenna riippuvuudet:
   ```bash
   npm install
4. Käynnistä dev-palvelin:
   ```bash
   npm run dev
6. Avaa selaimessa terminaalin tulostama osoite.

## Kehitys
- UI: React + Vite
- CSV-parsinta: PapaParse
