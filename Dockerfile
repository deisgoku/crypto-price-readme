# dockefile for telegram into Bahasa

# Gunakan image Node.js versi 20
FROM node:20

# Direktori kerja di dalam container
WORKDIR /app

# Salin file dependency
COPY package*.json ./

# Install dependencies
RUN npm install

# Salin seluruh project
COPY . .

# Jalankan entry point bot
CMD ["node", "api/bot.js"]
