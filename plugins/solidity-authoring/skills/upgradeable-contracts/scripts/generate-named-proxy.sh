#!/usr/bin/env bash
# Generates a NamedProxy contract from ../assets/NamedProxy.template.sol by
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
if [[ ! "${CONTRACT_NAME}" =~ ${IDENTIFIER_RE} ]]; then
  echo "Error: CONTRACT_NAME '${CONTRACT_NAME}' is not a valid Solidity identifier" >&2
  exit 1
fi
if [[ ! "${IMPLEMENTATION_NAME}" =~ ${IDENTIFIER_RE} ]]; then
  echo "Error: IMPLEMENTATION_NAME '${IMPLEMENTATION_NAME}' is not a valid Solidity identifier" >&2
  exit 1
fi

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
TEMPLATE="${SCRIPT_DIR}/../assets/NamedProxy.template.sol"
OUTPUT_FILE="${OUTPUT_DIR}/${CONTRACT_NAME}.sol"

mkdir -p "${OUTPUT_DIR}"

sed \
  -e "s/{{CONTRACT_NAME}}/${CONTRACT_NAME}/g" \
  -e "s/{{IMPLEMENTATION_NAME}}/${IMPLEMENTATION_NAME}/g" \
  "${TEMPLATE}" > "${OUTPUT_FILE}"

echo "Generated ${OUTPUT_FILE}"
