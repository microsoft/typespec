# Build from the http-client-csharp package root:
#   docker build -f playground-server/Dockerfile -t csharp-playground-server .
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

ENV DOTNET_ENVIRONMENT=Production
ENV GENERATOR_PATH=/app/generator/Microsoft.TypeSpec.Generator.dll

EXPOSE 5174
ENTRYPOINT ["dotnet", "playground-server.dll"]
