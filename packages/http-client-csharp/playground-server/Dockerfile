# Build from the http-client-csharp package root:
#   docker build -f playground-server/Dockerfile -t csharp-playground-server .
FROM mcr.microsoft.com/dotnet/sdk:10.0 AS build
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
FROM mcr.microsoft.com/dotnet/sdk:10.0 AS runtime
WORKDIR /app
COPY --from=build /app .

ENV DOTNET_ENVIRONMENT=Production
ENV GENERATOR_PATH=/app/generator/Microsoft.TypeSpec.Generator.dll

EXPOSE 5174
ENTRYPOINT ["dotnet", "playground-server.dll"]
