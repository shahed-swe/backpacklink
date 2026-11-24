# BackpackLink affiliate portal (affiliate.backpacklink.com) (Next.js, standalone output).
# NEXT_PUBLIC_API_URL is baked in at BUILD time (client-side calls), so pass it
# as a build arg matching how the browser reaches the API (host-published port).

FROM node:22-alpine AS build
WORKDIR /app
COPY package.json ./
RUN npm install
COPY . .
ARG NEXT_PUBLIC_API_URL=http://localhost:4000
ARG NEXT_PUBLIC_SITE_URL=https://backpacklink.com
ARG NEXT_PUBLIC_AFFILIATE_URL=https://affiliate.backpacklink.com
ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL
ENV NEXT_PUBLIC_SITE_URL=$NEXT_PUBLIC_SITE_URL
ENV NEXT_PUBLIC_AFFILIATE_URL=$NEXT_PUBLIC_AFFILIATE_URL
RUN npm run build

FROM node:22-alpine AS run
WORKDIR /app
ENV NODE_ENV=production
ENV PORT=3002
# Standalone server + static assets only (small image).
COPY --from=build /app/.next/standalone ./
COPY --from=build /app/.next/static ./.next/static
COPY --from=build /app/public ./public
EXPOSE 3002
CMD ["node", "server.js"]
