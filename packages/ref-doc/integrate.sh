#!/bin/bash
set -x

dir_path=$( cd "$(dirname "${BASH_SOURCE[0]}")" ; pwd -P )

repo_root=$dir_path/../../
echo "Repo root: $repo_root"

# Compiler decorators
# node $dir_path/dist/src/cli.js $repo_root/docs/standard-library
node $dir_path/dist/src/cli.js $repo_root/packages/rest/lib/rest.cadl $repo_root/docs/standard-library/rest/reference Cadl.Http Cadl.Rest Cadl.Rest.Resource
node $dir_path/dist/src/cli.js $repo_root/packages/openapi/lib/main.cadl $repo_root/docs/standard-library/openapi/reference OpenAPI
