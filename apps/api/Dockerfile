# BackpackLink backend (Express + Prisma). Runs via tsx (no build step).
FROM node:22-alpine

# Prisma needs openssl; libc6-compat helps native-ish deps on alpine.
RUN apk add --no-cache openssl libc6-compat

WORKDIR /app

# Install dependencies (incl. devDeps: tsx + prisma CLI are needed at runtime).
COPY package.json ./
RUN npm install

# App source + Prisma schema.
COPY . .
RUN npx prisma generate

EXPOSE 4000

# On boot: sync the DB schema, ensure an admin exists, then start the API.
CMD ["sh", "-c", "npx prisma db push --skip-generate && npm run seed-admin && npm run seed-content && npm run start"]
