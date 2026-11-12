# re-build http-client-java
npm ci --registry=https://pkgs.dev.azure.com/azure-sdk/public/_packaging/azure-sdk-for-js/npm/registry/
npm run clean && npm run build
npm pack
