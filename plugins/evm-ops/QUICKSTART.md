# evm-ops Quick Start

## 1. Install Bun (if needed)

```bash
curl -fsSL https://bun.sh/install | bash
```

## 2. Install tool dependencies

As a Claude Code plugin (installs deps for every tool at once):

```bash
make -f <path-to-plugin>/Makefile setup
```

As standalone skills installed with `npx skills`, install per skill:

```bash
cd <skills-dir>/contract-diff/tools/contract-diff && bun install
cd <skills-dir>/validate-storage-upgrade/tools/validate-storage && bun install
```

The other tools have no dependencies to install.

## 3. Configure credentials

Two options, use one or both:

**Option A: Global plugin `.env`** (set once, works across all projects)
```bash
make -f <path-to-plugin>/Makefile setup-env
# Then edit <path-to-plugin>/.env with your credentials
```

**Option B: Project `.env`** (per-project override)
```bash
ETHERSCAN_V2_API_KEY=your_key_here
TENDERLY_USER=your_username
TENDERLY_PROJECT=your_project
TENDERLY_ACCESS_KEY=your_api_key
RPC_URL=https://your-rpc-url
```

Tools load both and merge; project values override global values.

## 4. Verify setup

```bash
/validate-env
```

## Common Workflows

### Upgrade review
```
/upgrade-pipeline --chain base ProxyName:0xOLD:0xNEW
```

### Just fetch source
```
Ask Claude: "fetch the source for 0x1234... on base"
```

### Just validate storage
```
Ask Claude: "validate storage upgrade safety for MyContract on linea"
```
