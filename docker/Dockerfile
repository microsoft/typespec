# --------------------------------
#  Build compiler
# --------------------------------
FROM node:16-alpine3.12 as builder

RUN apk add --no-cache git
COPY . /app

WORKDIR /app
RUN npm install -g @microsoft/rush
RUN rush install
RUN rush rebuild

WORKDIR /app/packages/compiler
RUN npm pack

# --------------------------------
#  Setup final image
# --------------------------------
FROM node:16-alpine3.12

COPY --from=builder /app/packages/compiler/*.tgz /tmp/compiler.tgz

RUN npm install -g /tmp/compiler.tgz && rm /tmp/compiler.tgz

ENTRYPOINT [ "cadl" ]
