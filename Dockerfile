# SkilletFresh deployment image — workspace monorepo variant.
#
# Deliberately single-stage / full node_modules (not Next standalone output):
# the workspace layout (app + packages/db with a generated Prisma client +
# transpilePackages) makes standalone tracing fragile, and reliability beats
# image size for the training platform. Students with plain create-next-app
# repos use the leaner template in student-platform/template/Dockerfile.
#
# Entrypoint runs `prisma migrate deploy` BEFORE the server starts — the
# Day 4 rule ("always migrate before deploying new code") encoded in the image.

FROM node:22-alpine
WORKDIR /app

# --include=dev: the build needs devDependencies (typescript, prisma CLI), and
# the runtime keeps the prisma CLI for migrate-on-start. NODE_ENV is set only
# after install so npm ci doesn't silently skip them.
COPY . .
RUN npm ci --include=dev && npx prisma generate && npm run build
ENV NODE_ENV=production

ENV PORT=3000
EXPOSE 3000
CMD ["sh", "-c", "npx prisma migrate deploy && npm start -w app -- -H 0.0.0.0"]
