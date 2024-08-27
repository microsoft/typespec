Invoke-LoggedCommand "node node_modules/\@azure-tools/cadl-ranch/dist/cli/cli.js serve node_modules/\@azure-tools/cadl-ranch-specs/http/ --coverageFile ./cadl-ranch-coverage-java.json &"
mvn clean test
Invoke-LoggedCommand "node node_modules/\@azure-tools/cadl-ranch/dist/cli/cli.js server stop"
