#!/usr/bin/env bash
# Fleet-run the client-criteria check across scenarios using GitHub Copilot CLI
# in headless mode. Runs locally or in an Actions workflow. This is the CLI
# equivalent of the /check-client-criteria prompt.
#
# Requires the `copilot` CLI installed and authenticated (active Copilot plan).
# Each invocation consumes one premium request.
#
# Usage:
#   ./fleet.sh azure naming                  # one scenario
#   ./fleet.sh azure naming enums encode     # several, in parallel (the fleet)
#   FLAVOR=unbranded ./fleet.sh              # default scenario list below
set -euo pipefail

HERE="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
FLAVOR="${1:-${FLAVOR:-azure}}"
shift || true
SCENARIOS=("${@:-naming}") # pass scenarios as args, or edit this default

run_one() {
  local scenario="$1"
  echo "=== ${FLAVOR} / ${scenario} ==="
  copilot -p "This is the http-client-python emitter (language: python). \
Read ${HERE}/rules.md (how each client-shaping decorator maps to an \
expectation), ${HERE}/context.md (how to read the generated Python code), and \
${HERE}/criteria.md (hand-written edge cases). \
Find the spec for scenario '${scenario}': search \
node_modules/@azure-tools/azure-http-specs/specs (azure) or \
node_modules/@typespec/http-specs/specs (unbranded) for a path containing it, \
and read its .tsp files. Find the generated package under \
tests/generated/${FLAVOR}/ whose folder name contains '${scenario}'. \
For every symbol in the spec carrying a client-shaping decorator from rules.md, \
apply the matching rule (resolving language-scoped @clientName to the python \
override), locate the symbol in the generated package, read its exact \
identifier, and verify (clientName = ignoring case/separators; exactName = \
byte-for-byte). Print a PASS/FAIL/N/A table: source decorator+symbol | found | \
expected | result | the line of code you read it from." \
    --allow-all-tools
}

# Dispatch scenarios in parallel = the fleet
for scenario in "${SCENARIOS[@]}"; do
  run_one "$scenario" &
done
wait
