FROM node:22-alpine
WORKDIR /app
COPY package.json package-lock.json ./
COPY apps/dashboard/package.json apps/dashboard/
RUN npm ci --workspace=@signaltwin/dashboard
COPY apps/dashboard/ apps/dashboard/
CMD ["npm", "run", "dev", "--workspace=apps/dashboard", "--", "--host"]
