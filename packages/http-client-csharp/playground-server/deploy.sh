#!/usr/bin/env bash
# Copyright (c) Microsoft Corporation. All rights reserved.
# Licensed under the MIT License.
set -euo pipefail

storage=(--account-name typespec --container-name pkgs --auth-mode login --only-show-errors)
blob="_locks/csharp-playground-server"

deploy() {
  local context="$1" tag="$2" lease="$3"
  local registry="typespecacr" app="csharp-playground-server" group="typespec"
  local image="$registry.azurecr.io/$app:$tag"

  az acr build --registry "$registry" --no-cache --image "$app:$tag" \
    --file "$context/playground-server/Dockerfile" "$context"

  # ARM may apply the update even when the CLI reports a GatewayTimeout.
  # Verify the configured image before deciding whether to retry.
  for attempt in 1 2 3; do
    timeout --kill-after=5 20 az storage blob lease renew "${storage[@]}" \
      --blob-name "$blob" --lease-id "$lease"
    echo "Deploy attempt $attempt: $image"
    if ! timeout --kill-after=5 90 az webapp config container set \
      --name "$app" --resource-group "$group" \
      --container-image-name "$image" \
      --container-registry-url "https://$registry.azurecr.io"; then
      echo "Container update failed or timed out; verifying live configuration." >&2
    fi
    for poll in 1 2 3 4 5 6; do
      local configured
      configured=$(timeout --kill-after=5 20 az webapp config container show \
        --name "$app" --resource-group "$group" -o json)
      if grep -Fq "\"$image\"" <<< "$configured" || grep -Fq "\"DOCKER|$image\"" <<< "$configured"; then
        echo "Confirmed container image $image is configured."
        return
      fi
      echo "Image not applied yet; checking again in 10s..."
      sleep 10
    done
  done
  echo "Failed to confirm container image update for $image" >&2
  return 1
}

# The child runs in timeout's process group so losing the lease can stop both it
# and any active CLI command before another publisher acquires the expired lease.
if [[ "${1:-}" == "--deploy" ]]; then
  deploy "$2" "$3" "$4"
  exit
fi

if [[ $# != 2 || ! -d "$1" || ! "$2" =~ ^[A-Za-z0-9_][A-Za-z0-9_.-]{0,127}$ ]]; then
  echo "Usage: bash deploy.sh <package-context> <image-tag>" >&2
  exit 1
fi

error_file=$(mktemp)
lock_file=$(mktemp)
lease_id=""
deployment_pid=""

cleanup() {
  local status=$?
  trap - EXIT INT TERM
  if [[ -n "$deployment_pid" ]]; then
    kill -TERM -- "-$deployment_pid" 2> /dev/null || true
    sleep 1
    kill -KILL -- "-$deployment_pid" 2>/dev/null || true
    wait "$deployment_pid" 2>/dev/null || true
  fi
  if [[ -n "$lease_id" ]]; then
    if ! timeout --kill-after=5 20 az storage blob lease release "${storage[@]}" \
      --blob-name "$blob" --lease-id "$lease_id"; then
      echo "Failed to release playground deployment lease; it will expire after 60s." >&2
      status=1
    fi
  fi
  rm -f "$error_file" "$lock_file"
  exit "$status"
}
trap cleanup EXIT
trap 'exit 130' INT
trap 'exit 143' TERM

if ! timeout --kill-after=5 20 az storage blob upload "${storage[@]}" \
  --name "$blob" --file "$lock_file" --overwrite false --if-none-match '*' \
  > /dev/null 2> "$error_file"; then
  if ! grep -Eq 'BlobAlreadyExists|ConditionNotMet|LeaseIdMissing' "$error_file"; then
    echo "Failed to initialize the playground deployment lock blob." >&2
    cat "$error_file" >&2
    exit 1
  fi
fi

deadline=$((SECONDS + 1800))
while true; do
  if lease_id=$(timeout --kill-after=5 20 az storage blob lease acquire "${storage[@]}" \
    --blob-name "$blob" --lease-duration 60 -o tsv 2> "$error_file"); then
    if [[ -z "$lease_id" ]]; then
      echo "Storage returned an empty deployment lease ID." >&2
      exit 1
    fi
    break
  fi
  if ! grep -q 'LeaseAlreadyPresent' "$error_file"; then
    echo "Failed to acquire the playground deployment lease." >&2
    cat "$error_file" >&2
    exit 1
  fi
  if ((SECONDS >= deadline)); then
    echo "Timed out waiting 30 minutes for the playground deployment lease." >&2
    exit 1
  fi
  echo "Another playground deployment holds the lease; retrying in 10s..."
  sleep 10
done

timeout --kill-after=5 3600 bash "$0" --deploy "$1" "$2" "$lease_id" &
deployment_pid=$!
while kill -0 "$deployment_pid" 2> /dev/null; do
  sleep 20
  if kill -0 "$deployment_pid" 2> /dev/null; then
    if ! timeout --kill-after=5 20 az storage blob lease renew "${storage[@]}" \
      --blob-name "$blob" --lease-id "$lease_id"; then
      echo "Deployment lease renewal failed; stopping build/deployment." >&2
      exit 1
    fi
  fi
done
if wait "$deployment_pid"; then
  deployment_pid=""
else
  status=$?
  echo "Playground build/deployment failed with exit code $status." >&2
  exit "$status"
fi
