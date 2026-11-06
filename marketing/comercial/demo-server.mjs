// Sobe o sistema com os dados de demonstração (porta 3299), sem tocar nos dados reais.
process.env.ELECTRON_USER_DATA_DIR = process.env.DEMO_DIR || 'C:/Users/felip/AppData/Local/Temp/mdemo'
process.env.PORT = '3299'
await import(new URL('../../disparo-em-massa/src/server.js', import.meta.url).href)
