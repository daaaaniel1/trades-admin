FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .

# 🔴 REQUIRED for Prisma
RUN npx prisma generate

ENV NODE_ENV=production

EXPOSE 3000

CMD ["npm", "start"]
