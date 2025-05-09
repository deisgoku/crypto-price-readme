# ⚡️ About 

This project allows users to create stylish cryptocurrency cards with real-time data and customizable themes. It's ideal for showcasing dynamic crypto market info on GitHub and personal websites.

> Not just another README project. This one's alive.
> No code required needed , this make simple

Explore the pages to get started, learn how it works, and contribute.

- [Usage](#how-to-use)
- [API Reference](#api-reference)
- [Customization](#customization-guide)
- [FAQ](#faq)
- [Contributing](#contributing-guide)
- [Supports](#supports)


---

## 📝 Demo `Crypto Price Badge ( 🔴Live )`

- example badge default

![BTC](https://img.shields.io/endpoint?url=https://crypto-price-on.vercel.app/api/prices?coin=bitcoin&label=BTC&color=blue&style=flat&logo=bitcoin&logoColor=orange)
![ETH](https://img.shields.io/endpoint?url=https://crypto-price-on.vercel.app/api/prices?coin=ethereum&label=ETH&color=gray&style=flat&logo=ethereum&logoColor=white)
![SOL](https://img.shields.io/endpoint?url=https://crypto-price-on.vercel.app/api/prices?coin=solana&label=SOL&color=cyan&style=flat&logo=solana)
![BNB](https://img.shields.io/endpoint?url=https://crypto-price-on.vercel.app/api/prices?coin=binancecoin&label=BNB&color=yellow&style=flat&logo=binance)
![XRP](https://img.shields.io/endpoint?url=https://crypto-price-on.vercel.app/api/prices?coin=ripple&label=XRP&color=blueviolet&style=flat&logo=ripple)


---
 ## All in One Features 

![](https://crypto-price-on.vercel.app/api/info?theme=aurora)

- Crypto Market Mini Card


[![deisgoku](https://crypto-price-on.vercel.app/cards?user=nana&model=aurora&theme=aurora&coin=6&category=coinbase-50-index)](https://crypto-price-on.vercel.app/unlock)

[![ CARD MODERN AURORA](https://crypto-price-on.vercel.app/cards?user=nana&model=modern&theme=aurora&coin=6&category=depin)](https://crypto-price-on.vercel.app/unlock)

[![My Crypto Card](https://crypto-price-on.vercel.app/cards?user=deisgoku&model=futuristic&theme=tokyonight&coin=5&category=meme-token)](https://crypto-price-on.vercel.app/unlock)

[![nana](https://crypto-price-on.vercel.app/cards?user=nana&model=classic&theme=light&coin=6&category=binance-smart-chain)](https://crypto-price-on.vercel.app/unlock)

---
## 🧠 The Idea

Crypto is fast. Crypto is volatile.  
So why are dev READMEs... static?

This project brings **real-time crypto prices** directly into your GitHub profile using dynamic badges — including price movement indicators (⬆️/⬇️) and logos — all auto-updating.

---

## 🔧 Built With

- JavaScript (Node.js)
- Vercel Serverless Functions
- Shields.io custom badge formatting
- A little madness, a lot of coffee

---

# How to Use

## Features
- No required coding this make simple
- Select card model (Modern, Futuristic, Classic, Aurora)
- Choose from multiple themes
- Select data category (meme-token, dePin , Ai ,etc)
- Generate and preview crypto cards
- Copy the embed URL and MARKDOWN like '![YOURUSERNAME](url with query dropdown your chooise )'


## Steps
1. Open [App URL](https://crypto-price-on.vercel.app/unlock)
2. Select your preferred model and theme
3. Choose category filters
4. Click **Generate Card**
5. Copy the generated embed URL and use it anywhere

---
# Customization Guide

## Models
- **Modern**: Minimal, balanced layout
- **Futuristic**: Curved chart with glowing effects
- **Classic**: Retro table with hover highlight
- **Aurora**: Glassmorphism-inspired layout

## Themes
Choose from preset color schemes in `theme.js`. Each theme defines background, text, border, and trend colors.

## Fonts
The system uses preset font styles:
- `fontRow`: monospace, 13px
- `fontHeader`: Arial bold, 13px
- `fontTitle`: Verdana bold, 14px
- `fontFooter1`: Verdana bold, 12px
- `fontFooter2`: sans-serif, 12px

---
# API Reference

## Endpoint: `/api/cards`

### Parameters
- `user` : require user for this usage, so you must register first and login (unlock)
- `model`: Layout style (modern, futuristic, etc.)
- `theme`: Color theme (dark, neon, etc.)
- `coin count`: Count  (1 Up to +100 and more)
- `category`: Categoory data types (e.g meme-token , layer-1, layer-2, depin and etc)

### Example Request
```
https://crypto-price-on.vercel.app/api/card?model=modern&theme=dark&category=price,chart
```

### Response
Returns an SVG crypto card that can be embedded.


## Other Internal APIs

- `/api/prices`: Fetches historical price data
- `/api/chart`: Fetches historical chart data

---
## 🧑‍💻 Creator Spotlight

**`@deisgoku`** —  
Web3 native since 2016.  
Crypto bounty hunter, dev, and badge artist.  
Founder of a Web3 education community.

[![](https://img.shields.io/badge/Dynamic%20Crypto%20Badge%20Creator-est.%202025-blueviolet?style=for-the-badge&logo=ethereum&logoColor=white)](https://github.com/deisgoku/crypto-price-readme)

[![Follow on X](https://img.shields.io/badge/X-@Deisgoku-000000?style=flat)](http://www.x.com/Deisgoku)

<p align="center">
  <a href="https://git.io/typing-svg">
    <img src="https://readme-typing-svg.herokuapp.com?font=Fira+Code&size=18&pause=1000&color=000000&center=true&vCenter=true&width=500&lines=<+Github+is+your+digital+resume+/+>;<+I'm+just+giving+it+heartbeat+/+>;<+in+Code+we+Trust+/+>;<+Build+in+the+Future+of+Web3+/+>" alt="Typing SVG" />
  </a>
</p>

---
# Contributing Guide



## Steps
1. Fork the repo
2. Create a branch: `git checkout -b feature-name`
3. Commit your changes
4. Open a Pull Request

## Suggestions
- Fix bugs
- Add new themes or models
- Improve UI or UX
- Help write better docs

Please keep code clean and follow formatting used in the repo.

---
# FAQ
> Frequently Asked Questions (FAQ)

### Q: Can I embed the crypto card in my GitHub README?
A: Yes! The SVG card URL is static and compatible with GitHub markdown.

### Q: Is the data live?
A: Yes, data is fetched in real-time from CoinGecko, Binance, and CMC.

### Q: How do I preview my card?
A: Use the unlock page to see a live draggable/resizable preview popup.

### Q: Is there a way to support this project?
A: Yes, you can support the project via Ko-fi: https://ko-fi.com/deisgoku

---
# Supports

## ☕ --Tips for a cigarette-- and a cup of coffee 

If you find this project helpful and want to support me:

- **Network:** BNB Smart Chain (BEP20)  
- **USDT Address:** `0x2d4e53651cFC3f8C46774F5a3CE78cDA32fb1438`

- [![Donate with PayPal](https://img.shields.io/badge/Donate-PayPal-blue.svg?logo=paypal)](https://paypal.me/DIskandar) 
---

*This is not the end — it's just the start of living READMEs.*
