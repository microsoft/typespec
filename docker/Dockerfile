# --------------------------------
#  Build compiler
# --------------------------------
FROM mcr.microsoft.com/azurelinux/base/nodejs:20.14 AS builder

COPY . /app

WORKDIR /app
ENV TYPESPEC_SKIP_VS_BUILD=1
RUN npm install -g pnpm
RUN pnpm install --frozen-lockfile
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
