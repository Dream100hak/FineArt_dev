#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "${SCRIPT_DIR}/.." && pwd)"

export DOTNET_ROOT=${DOTNET_ROOT:-"$(dirname "$(command -v dotnet)")"}

command -v dotnet >/dev/null 2>&1 || {
  echo "dotnet CLI is required" >&2
  exit 1
}

dotnet tool install -g dotnet-ef

dotnet ef migrations add Init \
  --project "${REPO_ROOT}/FineArt.Infrastructure" \
  --startup-project "${REPO_ROOT}/FineArt.Api"

dotnet ef database update \
  --project "${REPO_ROOT}/FineArt.Infrastructure" \
  --startup-project "${REPO_ROOT}/FineArt.Api"
