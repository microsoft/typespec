param (
    [switch] $RebuildJar = $false
)

if ($RebuildJar) {
    mvn clean install -f generator/pom.xml -DskipTests
    if ($LASTEXITCODE -ne 0) {
        exit $LASTEXITCODE
    }
}

# re-build http-client-java
npm install 
npm run clean && npm run build:emitter

