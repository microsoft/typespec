# --------------------------------
#  Build compiler
# --------------------------------
FROM mcr.microsoft.com/mirror/docker/library/node:18-alpine as builder

RUN apk add --no-cache git
COPY . /app

WORKDIR /app
ENV TYPESPEC_SKIP_VS_BUILD=1
RUN npm install -g @microsoft/rush
RUN rush install
RUN rush rebuild --to @typespec/compiler

WORKDIR /app/packages/compiler
RUN rush publish --publish --pack --include-all

# --------------------------------
#  Setup final image
# --------------------------------
FROM mcr.microsoft.com/mirror/docker/library/node:18-alpine

COPY --from=builder /app/common/temp/artifacts/packages/typespec-compiler-*.tgz /tmp/compiler.tgz

RUN npm install -g /tmp/compiler.tgz && rm /tmp/compiler.tgz

ENTRYPOINT [ "tsp" ]
