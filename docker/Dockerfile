# --------------------------------
#  Build compiler
# --------------------------------
# cspell:ignore tdnf
FROM mcr.microsoft.com/azurelinux/base/nodejs:20.14 AS builder
COPY . /app

RUN set -eux; \
    # Upgrade all packages per https://eng.ms/docs/more/containers-secure-supply-chain/updating.
	tdnf update -y; \
    tdnf install -y \
        git \
    ; \
    tdnf clean all


WORKDIR /app
RUN npm install -g pnpm
RUN pnpm install --filter "@typespec/compiler..."
RUN pnpm --filter "@typespec/compiler..." run build

WORKDIR /app/packages/compiler
RUN npm pack

# --------------------------------
#  Setup final image
# --------------------------------
FROM mcr.microsoft.com/azurelinux/base/nodejs:20.14

COPY --from=builder /app/packages/compiler/*.tgz /tmp/compiler.tgz

RUN npm install -g /tmp/compiler.tgz && rm /tmp/compiler.tgz

ENTRYPOINT [ "tsp" ]
