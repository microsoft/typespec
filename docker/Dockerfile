# --------------------------------
#  Build compiler
# --------------------------------
FROM mcr.microsoft.com/mirror/docker/library/node:18-alpine as builder

RUN apk add --no-cache git
COPY . /build

WORKDIR /build
ENV TYPESPEC_SKIP_VS_BUILD=1
RUN npm install -g @microsoft/rush
RUN rush install
RUN rush rebuild --to @typespec/compiler

WORKDIR /build/packages/compiler
RUN rush publish --publish --pack --include-all

# --------------------------------
#  Setup final image
# --------------------------------
FROM mcr.microsoft.com/mirror/docker/library/node:18-alpine

COPY --from=builder /build/common/temp/artifacts/packages/typespec-compiler-*.tgz /tmp/compiler.tgz
COPY --from=builder /build/common/temp/artifacts/packages/typespec-init-templates-*.tgz /tmp/init-templates.tgz

WORKDIR /app

RUN npm install /tmp/compiler.tgz /tmp/init-templates.tgz && rm /tmp/compiler.tgz /tmp/init-templates.tgz

ENTRYPOINT [ "/app/node_modules/.bin/tsp" ]
