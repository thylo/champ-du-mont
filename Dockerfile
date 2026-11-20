# --- Build du front (Svelte + Vite) ---
FROM node:24-alpine AS build
WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

COPY . .
# Coordonnées du bénéficiaire, intégrées au QR au moment du build
ARG VITE_BENEFICIAIRE VITE_IBAN VITE_CHAMP_REF=structure
ENV VITE_BENEFICIAIRE=$VITE_BENEFICIAIRE VITE_IBAN=$VITE_IBAN VITE_CHAMP_REF=$VITE_CHAMP_REF
RUN npm run build

# --- Service statique + proxy CouchDB ---
FROM nginx:1.27-alpine
COPY docker/nginx/default.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist /usr/share/nginx/html
EXPOSE 80
