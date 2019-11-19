# Kingsland Explorer - Kingslandscan


KingsLand is a BlockExplorer for **Kingsland**, built with VueJS, Nuxt and MongoDB. Veloxscan allows you to explore and search the **Kingsland** for transactions, addresses, tokens, prices and other activities taking place on **Kingsland**.

## Current Features
- Browse blocks, transactions, accounts and contracts
- View pending transactions
- Upload & verify contract sources
- Display the current state of verified contracts
- Follow an address list
- Responsive layout


## Getting started

### Requirements
- [Docker](https://www.docker.com/get-docker)

### Setup

Copy .env files
```bash
cp client/.env.example client/.env
```

Build & up docker
```bash
docker-compose -f docker-compose-dev.yml up --build
```
The site will run at http://localhost:3000, server will run at http://localhost:3333

### Environment variables

#### Client (in `client/.env`)

```bash
API_URL=http://localhost:3333
WS_URL=http://localhost:3333
BASE_UNIT=VELOX
```
#### Server (in `server/src/config/default.json`)
```
cp server/src/config/default.json server/src/config/local.json
```
```
{
  "APP_ENV": "prod",
  "MONGODB": "localhost",
  "MONGODB_URI": "mongodb://localhost:27017/explorer",
  "redis": {
    "host": "localhost",
    "port": 6379,
    "password": null,
    "prefix": "TomoScan"
  },

  "WEB3_URI": "https://testnet.veloxchain.com/",
  "WEB3_WS_URI": "wss://testnet.veloxchain.com/ws",
  "DEBUG_QUERY": false,

  "BASE_UNIT": "VELOX",
  "PORT": 3333,
  "DEBUG": "express:*",

  "JWT_SECRET": "RANDOM_HASH",
  "APP_SECRET": "RANDOM_HASH",

  "SENDGRID_API_KEY": "",
  "SENDER_EMAIL": "",

  "CLIENT_URL": "http://localhost:3000/",
  "CMC_ID": 2570,
  "SLACK_WEBHOOK_URL": ""
}
```
