# --------------------------------
#  Build compiler
# --------------------------------
# cspell:ignore tdnf
FROM mcr.microsoft.com/devcontainers/javascript-node:24 AS builder

# Optional: Override npm registry for CFS compliance.
# pnpm 11+ requires PNPM_CONFIG_REGISTRY (ignores NPM_CONFIG_REGISTRY).
ARG NPM_REGISTRY=
ENV PNPM_CONFIG_REGISTRY=${NPM_REGISTRY}
ENV NPM_CONFIG_REGISTRY=${NPM_REGISTRY}

COPY . /app

# Upgrade all packages per https://eng.ms/docs/more/containers-secure-supply-chain/updating.
# RUN tdnf update -y \
#   && tdnf install -y \
#     git \
#   && tdnf clean all

WORKDIR /app
RUN npm install -g pnpm
RUN pnpm install --filter "@typespec/compiler..."
RUN pnpm --filter "@typespec/compiler..." run build

WORKDIR /app/packages/compiler
RUN pnpm pack

# --------------------------------
#  Setup final image
# --------------------------------
FROM mcr.microsoft.com/azurelinux/base/nodejs:24

# Inherit registry setting for final stage
ARG NPM_REGISTRY=
ENV NPM_CONFIG_REGISTRY=${NPM_REGISTRY}

COPY --from=builder /app/packages/compiler/*.tgz /tmp/compiler.tgz

RUN npm install -g /tmp/compiler.tgz && rm /tmp/compiler.tgz

ENTRYPOINT ["tsp"]
