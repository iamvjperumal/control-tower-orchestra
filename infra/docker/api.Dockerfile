FROM node:22-alpine
WORKDIR /app
COPY package.json package-lock.json tsconfig.base.json ./
COPY packages/shared/package.json packages/shared/
COPY packages/schemas/package.json packages/schemas/
COPY apps/api/package.json apps/api/
RUN npm ci --workspace=@signaltwin/api --workspace=@signaltwin/shared --workspace=@signaltwin/schemas
COPY packages/ packages/
COPY apps/api/ apps/api/
RUN npm run build --workspace=packages/shared --workspace=packages/schemas
CMD ["npm", "run", "dev", "--workspace=apps/api"]
