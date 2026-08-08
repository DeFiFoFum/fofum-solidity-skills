#!/usr/bin/env bash
# Generates a NamedProxy contract from
# ../assets/proof-of-concept/templates/NamedProxy.template.sol by
# substituting the contract and implementation names. Deterministic: same
# inputs always produce the same output file.
#
# Usage:
#   generate-named-proxy.sh <ContractName> <ImplementationName> [output-dir]
#
# Example:
#   generate-named-proxy.sh ExampleVaultProxy ExampleVault ./contracts/proxies
#
#   ContractName        Name of the generated contract, e.g. ExampleVaultProxy.
#   ImplementationName   Name of the implementation contract it wraps, e.g. ExampleVault.
#   output-dir            Defaults to ./contracts/proxies.
set -euo pipefail

CONTRACT_NAME="${1:?Usage: generate-named-proxy.sh <ContractName> <ImplementationName> [output-dir]}"
IMPLEMENTATION_NAME="${2:?Usage: generate-named-proxy.sh <ContractName> <ImplementationName> [output-dir]}"
OUTPUT_DIR="${3:-./contracts/proxies}"

# Both names become both a Solidity contract identifier and a component of
# OUTPUT_FILE's path, and both get substituted into the template via sed.
# Restricting them to valid Solidity identifiers up front closes off sed
# metacharacter injection (/, &, backslash) and path traversal (.., /) in
# one check, since a valid identifier can contain neither.
IDENTIFIER_RE='^[A-Za-z_][A-Za-z0-9_]*$'
# A syntactically valid identifier can still be a reserved word ("contract",
# "is", ...), which would compile to nonsense ("contract contract is ...").
# This list covers the keywords that could plausibly appear as a proxy or
# implementation name; it isn't the full Solidity grammar's reserved-word
# list, just the realistic footguns.
RESERVED_WORDS=(contract interface library is function returns import pragma using struct enum event error modifier)

is_reserved() {
  local name="$1"
  local word
  for word in "${RESERVED_WORDS[@]}"; do
    [[ "${name}" == "${word}" ]] && return 0
  done
  return 1
}

for label_and_value in "CONTRACT_NAME:${CONTRACT_NAME}" "IMPLEMENTATION_NAME:${IMPLEMENTATION_NAME}"; do
  label="${label_and_value%%:*}"
  value="${label_and_value#*:}"
  if [[ ! "${value}" =~ ${IDENTIFIER_RE} ]]; then
    echo "Error: ${label} '${value}' is not a valid Solidity identifier" >&2
    exit 1
  fi
  if is_reserved "${value}"; then
    echo "Error: ${label} '${value}' is a Solidity reserved word" >&2
    exit 1
  fi
done

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
TEMPLATE="${SCRIPT_DIR}/../assets/proof-of-concept/templates/NamedProxy.template.sol"
OUTPUT_FILE="${OUTPUT_DIR}/${CONTRACT_NAME}.sol"

mkdir -p "${OUTPUT_DIR}"

sed \
  -e "s/{{CONTRACT_NAME}}/${CONTRACT_NAME}/g" \
  -e "s/{{IMPLEMENTATION_NAME}}/${IMPLEMENTATION_NAME}/g" \
  "${TEMPLATE}" > "${OUTPUT_FILE}"

echo "Generated ${OUTPUT_FILE}"
