# BackpackLink customer website (Next.js, standalone output).
# NEXT_PUBLIC_API_URL is baked in at BUILD time (browser calls — auth, checkout,
# socket) so it must be the host-published API URL. Server-side rendering uses
# the runtime API_URL (the api service on the docker network).

FROM node:22-alpine AS build
WORKDIR /app
COPY package.json ./
RUN npm install
COPY . .
ARG NEXT_PUBLIC_API_URL=http://localhost:4000
ARG NEXT_PUBLIC_SITE_URL=http://localhost:3000
# Server-side fetch target during the static build — the running api on the host.
# (Runtime API_URL is overridden to http://api:4000 by compose.)
ARG API_URL=http://host.docker.internal:4000
ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL
ENV NEXT_PUBLIC_SITE_URL=$NEXT_PUBLIC_SITE_URL
ENV API_URL=$API_URL
RUN npm run build

FROM node:22-alpine AS run
WORKDIR /app
ENV NODE_ENV=production
ENV PORT=3000
COPY --from=build /app/.next/standalone ./
COPY --from=build /app/.next/static ./.next/static
COPY --from=build /app/public ./public
EXPOSE 3000
CMD ["node", "server.js"]
