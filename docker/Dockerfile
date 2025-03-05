# --------------------------------
#  Build compiler
# --------------------------------
FROM mcr.microsoft.com/mirror/docker/library/node:18-alpine AS builder

RUN apk add --no-cache git
COPY . /app

WORKDIR /app
ENV TYPESPEC_SKIP_VS_BUILD=1
RUN npm install -g corepack@latest && corepack enable && corepack prepare
RUN pnpm install --frozen-lockfile
RUN pnpm --filter "@typespec/compiler..." run build

WORKDIR /app/packages/compiler
RUN npm pack

# --------------------------------
#  Setup final image
# --------------------------------
FROM mcr.microsoft.com/mirror/docker/library/node:22-alpine

COPY --from=builder /app/packages/compiler/*.tgz /tmp/compiler.tgz

RUN npm install -g /tmp/compiler.tgz && rm /tmp/compiler.tgz

ENTRYPOINT [ "tsp" ]
