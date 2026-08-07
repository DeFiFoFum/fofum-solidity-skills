#!/usr/bin/env bash
# Fetches a contract's deployed runtime bytecode from a live RPC endpoint and
# writes it as a vendored artifact: a plain hex file for vm.etch to load, plus
# a provenance JSON recording where it came from and when. Deterministic given
# the same address/rpc/block; re-run it deliberately to refresh, don't treat
# vendored bytecode as fetch-once-forget-forever.
#
# Usage:
#   fetch-vendored-bytecode.sh <address> <rpc-url> <name> [output-dir]
#
# Example:
#   fetch-vendored-bytecode.sh \
#     0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2 \
#     https://ethereum-rpc.publicnode.com \
#     WETH9 \
#     ./vendored
#
#   address      Contract address to fetch code from.
#   rpc-url      JSON-RPC endpoint. Any API key in the URL is NOT written to
#                the provenance file, only its hostname is.
#   name         Base name for the two output files: <name>.runtime.hex and
#                <name>.provenance.json.
#   output-dir   Defaults to ./vendored.
#
# Requires: curl, python3.
set -euo pipefail

ADDRESS="${1:?Usage: fetch-vendored-bytecode.sh <address> <rpc-url> <name> [output-dir]}"
RPC_URL="${2:?Usage: fetch-vendored-bytecode.sh <address> <rpc-url> <name> [output-dir]}"
NAME="${3:?Usage: fetch-vendored-bytecode.sh <address> <rpc-url> <name> [output-dir]}"
OUTPUT_DIR="${4:-./vendored}"

mkdir -p "${OUTPUT_DIR}"
HEX_FILE="${OUTPUT_DIR}/${NAME}.runtime.hex"
PROVENANCE_FILE="${OUTPUT_DIR}/${NAME}.provenance.json"

BLOCK_HEX="$(curl -s -m 15 "${RPC_URL}" -X POST -H "Content-Type: application/json" \
  --data '{"jsonrpc":"2.0","method":"eth_blockNumber","params":[],"id":1}' \
  | python3 -c "import json,sys; print(json.load(sys.stdin)['result'])")"

CODE="$(curl -s -m 15 "${RPC_URL}" -X POST -H "Content-Type: application/json" \
  --data "{\"jsonrpc\":\"2.0\",\"method\":\"eth_getCode\",\"params\":[\"${ADDRESS}\",\"${BLOCK_HEX}\"],\"id\":1}" \
  | python3 -c "import json,sys; print(json.load(sys.stdin)['result'])")"

if [ "${CODE}" = "0x" ] || [ -z "${CODE}" ]; then
  echo "Error: no code at ${ADDRESS} on this RPC (empty or EOA address?)" >&2
  exit 1
fi

# No trailing newline: vm.parseBytes rejects one.
printf '%s' "${CODE}" > "${HEX_FILE}"

# Values are passed as argv, not interpolated into the python source
# string, so a stray quote or shell metacharacter in RPC_URL (or a
# malformed BLOCK_HEX) can't break out of the string literal.
BLOCK_NUMBER="$(python3 -c "import sys; print(int(sys.argv[1], 16))" "${BLOCK_HEX}")"
FETCHED_AT="$(date -u +%Y-%m-%dT%H:%M:%SZ)"
# .hostname (not .netloc): netloc includes userinfo, so an RPC URL like
# https://api_key@host would otherwise leak the key into provenance despite
# the "no API keys" claim below.
RPC_HOST="$(python3 -c "import sys; from urllib.parse import urlparse; print(urlparse(sys.argv[1]).hostname)" "${RPC_URL}")"

cat > "${PROVENANCE_FILE}" <<EOF
{
  "name": "${NAME}",
  "address": "${ADDRESS}",
  "rpcHost": "${RPC_HOST}",
  "blockNumber": ${BLOCK_NUMBER},
  "fetchedAt": "${FETCHED_AT}"
}
EOF

echo "Wrote ${HEX_FILE} ($(wc -c < "${HEX_FILE}" | tr -d ' ') chars) and ${PROVENANCE_FILE}"
