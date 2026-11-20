#!/usr/bin/env bash
# Copyright (c) Microsoft Corporation. All rights reserved.
# Licensed under the MIT License.
set -euo pipefail

deploy() {
  local context="$1" tag="$2"
  local registry="typespecacr" app="csharp-playground-server" group="typespec"
  local image="$registry.azurecr.io/$app:$tag"

  az acr build --registry "$registry" --image "$app:$tag" \
    --file "$context/playground-server/Dockerfile" "$context"

  # ARM may apply the update even when the CLI reports a GatewayTimeout.
  # Verify the configured image before deciding whether to retry.
  for attempt in 1 2 3; do
    echo "Deploy attempt $attempt: $image"
    if ! timeout --foreground --kill-after=5 90 az webapp config container set \
      --name "$app" --resource-group "$group" \
      --container-image-name "$image" \
      --container-registry-url "https://$registry.azurecr.io"; then
      echo "Container update failed or timed out; verifying live configuration." >&2
    fi
    for poll in 1 2 3 4 5 6; do
      local configured
      if configured=$(timeout --foreground --kill-after=5 20 az webapp config container show \
        --name "$app" --resource-group "$group" -o json 2>&1); then
        if grep -Fq "\"$image\"" <<< "$configured" || grep -Fq "\"DOCKER|$image\"" <<< "$configured"; then
          echo "Confirmed container image $image is configured."
          return
        fi
      else
        local status=$?
        printf 'Container configuration read failed (exit %s):\n%s\n' "$status" "$configured" >&2
        if [[ "$status" != 124 && "$status" != 137 ]] \
          && ! grep -Eiq 'GatewayTimeout|Gateway Timeout|BadGateway|Bad Gateway|InternalServerError|Internal Server Error|ServiceUnavailable|Service Unavailable|TooManyRequests|Too Many Requests|ConnectionError|ConnectionResetError|ReadTimeout|ConnectTimeout' <<< "$configured"; then
          return "$status"
        fi
      fi
      echo "Image not applied yet; checking again in 10s..."
      sleep 10
    done
  done
  echo "Failed to confirm container image update for $image" >&2
  return 1
}

if [[ "${1:-}" == "--deploy" ]]; then
  deploy "$2" "$3"
  exit
fi

if [[ $# != 2 || ! -d "$1" || ! "$2" =~ ^[A-Za-z0-9_][A-Za-z0-9_.-]{0,127}$ ]]; then
  echo "Usage: bash deploy.sh <package-context> <image-tag>" >&2
  exit 1
fi

if timeout --kill-after=5 3600 bash "$0" --deploy "$1" "$2"; then
  exit 0
else
  status=$?
  echo "Playground build/deployment failed with exit code $status." >&2
  exit "$status"
fi
