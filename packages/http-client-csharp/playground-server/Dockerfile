# Build from the http-client-csharp package root:
#   docker build -f playground-server/Dockerfile -t csharp-playground-server .
# cspell:ignore libbrotli
FROM node:22-bookworm-slim AS azure-generators
WORKDIR /azure-generators

# Each emitter supplies its own matching dependency closure. Preserve its npm
# metadata so the browser can discover the exact version installed in this image.
RUN set -eu; \
  for emitter in http-client-csharp http-client-csharp-mgmt http-client-csharp-provisioning; do \
    mkdir "$emitter"; \
    npm pack --ignore-scripts --pack-destination "$emitter" "@azure-typespec/$emitter@latest"; \
    tar -xzf "$emitter"/*.tgz --strip-components=1 -C "$emitter" package/package.json package/dist/generator; \
    rm "$emitter"/*.tgz; \
    test -f "$emitter/dist/generator/Microsoft.TypeSpec.Generator.dll"; \
    test -f "$emitter/dist/generator/Microsoft.TypeSpec.Generator.runtimeconfig.json"; \
  done

FROM mcr.microsoft.com/dotnet/sdk:10.0-noble AS base

# The SDK base can contain libbrotli1 without the CVE-2026-111497 fix.
RUN apt-get update \
  && apt-get install -y --no-install-recommends --only-upgrade libbrotli1 \
  && rm -rf /var/lib/apt/lists/*

FROM base AS build
WORKDIR /src

# Build the generator (populates dist/generator/)
COPY generator/ generator/
COPY eng/ eng/
RUN dotnet build generator -c Release

# Build the server
COPY playground-server/playground-server.csproj playground-server/
RUN dotnet restore playground-server/playground-server.csproj
COPY playground-server/ playground-server/
RUN dotnet publish playground-server -c Release -o /app --no-restore

# Copy generator output
RUN cp -r dist/generator /app/generator

# Need full SDK (not just aspnet) because the server spawns `dotnet` to run the generator DLL
FROM base AS runtime
WORKDIR /app
COPY --from=build /app .
COPY --from=azure-generators /azure-generators /app/azure-generators

ENV DOTNET_ENVIRONMENT=Production
ENV GENERATOR_PATH=/app/generator/Microsoft.TypeSpec.Generator.dll
ENV AZURE_GENERATOR_ROOT=/app/azure-generators

EXPOSE 5174
ENTRYPOINT ["dotnet", "playground-server.dll"]
