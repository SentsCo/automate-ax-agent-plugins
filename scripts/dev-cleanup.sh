#!/usr/bin/env bash

set -euo pipefail

shutdown_timeout_seconds=35
workspace_dir="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd -P)"
process_compose_socket="$workspace_dir/.process-compose.sock"
env_file="$workspace_dir/.env.local"

is_development_stack_process() {
  local command="$1"

  [[ "$command" =~ (^|/)process-compose([[:space:]]|$) ]] ||
    [[ "$command" =~ (^|[[:space:]])bun[[:space:]]+(run[[:space:]]+)?dev([[:space:]]|$) ]] ||
    [[ "$command" =~ (^|[[:space:]])bun[[:space:]]+run[[:space:]]+--cwd[[:space:]]+(apps/web|apps/worker|docs)[[:space:]]+dev([[:space:]]|$) ]]
}

contains() {
  local needle="$1"
  shift
  local value

  for value in "$@"; do
    if [[ "$value" == "$needle" ]]; then
      return 0
    fi
  done

  return 1
}

wait_for_process_groups() {
  local process_groups=("$@")
  local deadline=$((SECONDS + shutdown_timeout_seconds))
  local process_group
  local running

  while ((SECONDS < deadline)); do
    running=false

    for process_group in "${process_groups[@]}"; do
      if kill -0 -- "-$process_group" 2>/dev/null; then
        running=true
        break
      fi
    done

    if [[ "$running" == false ]]; then
      return
    fi

    sleep 0.1
  done

  for process_group in "${process_groups[@]}"; do
    if kill -0 -- "-$process_group" 2>/dev/null; then
      kill -KILL -- "-$process_group" 2>/dev/null || true
    fi
  done
}

if [[ ! -f "$env_file" ]]; then
  echo "Missing $env_file. Run gtl setup first." >&2
  exit 1
fi

compose_project_name="$(sed -n 's/^COMPOSE_PROJECT_NAME=//p' "$env_file" | tail -n 1)"
compose_project_name="${compose_project_name%\"}"
compose_project_name="${compose_project_name#\"}"
compose_project_name="${compose_project_name%\'}"
compose_project_name="${compose_project_name#\'}"

if [[ ! "$compose_project_name" =~ ^[a-zA-Z0-9][a-zA-Z0-9_.-]*$ ]]; then
  echo "COMPOSE_PROJECT_NAME is missing or invalid in .env.local" >&2
  exit 1
fi

stopped_stack=false

if process-compose down \
  --use-uds \
  --unix-socket "$process_compose_socket" \
  >/dev/null 2>&1; then
  stopped_stack=true
else
  current_process_group="$(ps -o pgid= -p $$ | tr -d ' ')"
  process_groups=()

  while read -r pid process_group command; do
    if ! is_development_stack_process "$command"; then
      continue
    fi

    working_directory="$(
      lsof -Fn -a -p "$pid" -d cwd 2>/dev/null |
        sed -n 's/^n//p' |
        head -n 1 || true
    )"

    if [[ "$working_directory" != "$workspace_dir" && "$working_directory" != "$workspace_dir/"* ]]; then
      continue
    fi

    if [[ "$process_group" == "$current_process_group" ]]; then
      echo "Refusing to stop the process group running dev:cleanup" >&2
      exit 1
    fi

    if ((${#process_groups[@]} == 0)) ||
      ! contains "$process_group" "${process_groups[@]}"; then
      process_groups+=("$process_group")
    fi
  done < <(ps -axo pid=,pgid=,command=)

  if ((${#process_groups[@]} > 0)); then
    for process_group in "${process_groups[@]}"; do
      kill -TERM -- "-$process_group" 2>/dev/null || true
    done

    wait_for_process_groups "${process_groups[@]}"
    stopped_stack=true
  fi
fi

container_ids=()

while IFS=$'\t' read -r container_id container_name; do
  if [[ "$container_name" == "$compose_project_name-"* ]]; then
    container_ids+=("$container_id")
  fi
done < <(docker ps --all --format '{{.ID}}\t{{.Names}}')

if ((${#container_ids[@]} > 0)); then
  docker stop --time 30 "${container_ids[@]}" >/dev/null
  stopped_stack=true
fi

remaining_container_ids=()

while IFS=$'\t' read -r container_id container_name; do
  if [[ "$container_name" == "$compose_project_name-"* ]]; then
    remaining_container_ids+=("$container_id")
  fi
done < <(docker ps --all --format '{{.ID}}\t{{.Names}}')

if ((${#remaining_container_ids[@]} > 0)); then
  docker rm --force "${remaining_container_ids[@]}" >/dev/null
fi

if [[ "$stopped_stack" == true ]]; then
  echo "Stopped this worktree's development stack."
else
  echo "This worktree's development stack is already stopped."
fi
