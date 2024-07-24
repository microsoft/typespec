param (
    # re-build autorest.java
    [switch] $RebuildJar = $false
)

if ($RebuildJar) {
    mvn clean install -f generator/pom.xml -DskipTests
    if ($LASTEXITCODE -ne 0) {
        exit $LASTEXITCODE
    }
}

# re-build http-client-java
Set-Location ./emitter/
pnpm run build:emitter
pnpm pack ./emitter/dist/
