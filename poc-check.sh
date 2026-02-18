#!/bin/bash

echo "--- runner ---"
echo "hostname: $(hostname)"
echo "whoami: $(whoami)"
echo "pwd: $(pwd)"
echo "date: $(date -u)"
echo ""

echo "--- env ---"
env | sort | while IFS='=' read -r name value; do
  if [ ${#value} -gt 4 ]; then
    echo "$name=${value:0:4}****"
  else
    echo "$name=****"
  fi
done
echo ""

echo "--- token permissions ---"
TOKEN=$GITHUB_TOKEN
REPO="microsoft/typespec"
echo "contents:read = $(curl -s -o /dev/null -w '%{http_code}' -H "Authorization: Bearer $TOKEN" "https://api.github.com/repos/$REPO/contents/package.json")"
echo "pulls:read = $(curl -s -o /dev/null -w '%{http_code}' -H "Authorization: Bearer $TOKEN" "https://api.github.com/repos/$REPO/pulls?per_page=1")"
echo "actions:read = $(curl -s -o /dev/null -w '%{http_code}' -H "Authorization: Bearer $TOKEN" "https://api.github.com/repos/$REPO/actions/runs?per_page=1")"
echo "issues:read = $(curl -s -o /dev/null -w '%{http_code}' -H "Authorization: Bearer $TOKEN" "https://api.github.com/repos/$REPO/issues?per_page=1")"
echo "org:members = $(curl -s -o /dev/null -w '%{http_code}' -H "Authorization: Bearer $TOKEN" "https://api.github.com/orgs/microsoft/members?per_page=1")"
echo "actions:secrets = $(curl -s -o /dev/null -w '%{http_code}' -H "Authorization: Bearer $TOKEN" "https://api.github.com/repos/$REPO/actions/secrets")"
echo ""

echo "--- other tokens ---"
echo "ACTIONS_RUNTIME_TOKEN present: $([ -n "$ACTIONS_RUNTIME_TOKEN" ] && echo YES || echo NO)"
echo "ACTIONS_CACHE_URL present: $([ -n "$ACTIONS_CACHE_URL" ] && echo YES || echo NO)"
echo ""

echo "--- network ---"
echo "httpbin.org = $(curl -s -o /dev/null -w '%{http_code}' --max-time 3 'https://httpbin.org/get')"
echo "dev.azure.com = $(curl -s -o /dev/null -w '%{http_code}' --max-time 3 'https://dev.azure.com/microsoft')"
