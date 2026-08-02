---
name: azure-personal-identity
description: Apply the personal Azure CLI identity convention before running ANY local `az` command in HumanAngle repos. The shell default AZURE_CONFIG_DIR belongs to the Sidley WORK ARM identity — never use it here. Every `az` call in this repo (ARM and ADO alike) must be prefixed with AZURE_CONFIG_DIR=$HOME/.azure-personal, which holds the personal identity kamalraj2000@hotmail.com for both the HumanAngle Azure tenant and the humanangle Azure DevOps org. Triggers in Summer 2026 Training and any other HumanAngle personal repo running `az` locally.
---

# HumanAngle personal Azure CLI identity convention

Kamal has three Azure identities in isolated `AZURE_CONFIG_DIR`s — no `az account set`
switching, no shared token cache:

| Identity | UPN | Config dir | Used for |
|---|---|---|---|
| Work ARM | `kraj-sa@sidley.com` | `$HOME/.azure-arm` (**shell default**) | Sidley Azure subscriptions — never this repo |
| Work ADO | `kamal.raj@sidley.com` | `$HOME/.azure-ado` | Sidley Azure DevOps — never this repo |
| **Personal ARM + ADO** | `kamalraj2000@hotmail.com` | `$HOME/.azure-personal` | **Everything in this repo** |

Unlike the Sidley convention (two dirs split by command surface), the personal identity
covers **both** ARM and ADO. The decision rule is therefore simple and absolute:

## Decision rule (every `az` call in this repo)

**Prefix every `az` invocation — ARM, ADO, `az account`, everything — with:**

```bash
AZURE_CONFIG_DIR=$HOME/.azure-personal az ...
```

- **Never run bare `az` in this repo.** The shell default is the Sidley work ARM
  identity; a bare call silently reads (or worse, mutates) work resources.
- **Self-contained always.** Each Bash invocation carries its own
  `AZURE_CONFIG_DIR=...` prefix — never `export` it expecting persistence between
  separate tool calls.
- For scripts, define one helper at the top and use it at every call site:

```bash
azp() { AZURE_CONFIG_DIR="$HOME/.azure-personal" az "$@"; }   # personal (HumanAngle)
```

## Personal-context reference

| Fact | Value |
|---|---|
| Tenant (Default Directory) | `d75a3b31-b6ea-4bc1-9a3c-f760e543f24e` |
| Subscriptions | `Pay-As-You-Go`, `HumanAngle-Platform`, `HumanAngle-Students` |
| Student deployment subscription | `HumanAngle-Students` = `da17b3c4-4654-42b9-8719-5be9df6afa9f` |
| ADO org | `https://dev.azure.com/humanangle` |

Always pass `--subscription` explicitly for resource operations; verify with
`AZURE_CONFIG_DIR=$HOME/.azure-personal az account show --query name -o tsv` before
anything destructive.

**ADO note:** day-to-day Azure DevOps work in this repo goes through the `azure-devops`
MCP server (already authenticated separately), not `az devops`. Only use
`az devops/boards/pipelines/repos` CLI when the MCP server can't do the job — and then
with the personal prefix.

## Failure modes

| Symptom | Cause | Response |
|---|---|---|
| `Please run 'az login'` / `AADSTS70043` | Token expired (or dir never logged in) | Tell user the exact command: `AZURE_CONFIG_DIR=$HOME/.azure-personal az login --tenant d75a3b31-b6ea-4bc1-9a3c-f760e543f24e`. Do NOT auto-run `az login` (browser interaction). |
| `AADSTS50173` (grant revoked / password changed) | Tokens issued before the last password reset | Same as above — fresh `az login` required; no non-interactive recovery. |
| Output shows Sidley subscriptions (`Sidley-AIE-*`) | Prefix was dropped; call hit the work ARM dir | Stop, re-run with the personal prefix. Note the correction. |
| `TF400813` / org `humanangle` not found on `az devops` calls | Prefix dropped, or `azure-devops` extension missing in the personal dir (extensions are isolated per config dir) | `AZURE_CONFIG_DIR=$HOME/.azure-personal az extension add --name azure-devops` |
| `ResourceNotFound` on a known-good resource | Wrong default subscription inside the personal dir | Pass `--subscription HumanAngle-Students` (or the right one) explicitly. |
| Config dir missing (first run) | One-time setup not done | `az login` with the prefix creates the dir; see setup below. |

## One-time setup (user runs interactively)

```bash
# 1. Login (creates ~/.azure-personal; browser opens)
AZURE_CONFIG_DIR=$HOME/.azure-personal az login --tenant d75a3b31-b6ea-4bc1-9a3c-f760e543f24e

# 2. Default to the student subscription inside this dir only
AZURE_CONFIG_DIR=$HOME/.azure-personal az account set --subscription HumanAngle-Students

# 3. ADO CLI support (only if az devops commands are ever needed)
AZURE_CONFIG_DIR=$HOME/.azure-personal az extension add --name azure-devops
AZURE_CONFIG_DIR=$HOME/.azure-personal az devops configure --defaults organization=https://dev.azure.com/humanangle
```

## What's NOT covered

- **Git operations** — this repo's git identity is handled by local git config
  (see CLAUDE.md), not Azure CLI.
- **The `azure-devops` MCP server** — authenticates on its own; no config dir involved.
- **Sidley repos** — they follow their own `azure-cli-identities` skill
  (`.azure-arm` default + `.azure-ado` prefix). Don't mix the conventions.
