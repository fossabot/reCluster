#!/usr/bin/env sh
# MIT License
#
# Copyright (c) 2022-2022 Carlo Corradini
#
# Permission is hereby granted, free of charge, to any person obtaining a copy
# of this software and associated documentation files (the "Software"), to deal
# in the Software without restriction, including without limitation the rights
# to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
# copies of the Software, and to permit persons to whom the Software is
# furnished to do so, subject to the following conditions:
#
# The above copyright notice and this permission notice shall be included in all
# copies or substantial portions of the Software.
#
# THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
# IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
# FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
# AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
# LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
# OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
# SOFTWARE.

# Fail on error
set -o errexit
# Fail on unset var usage
set -o nounset
# Disable wildcard character expansion
set -o noglob

# ================
# ARGUMENTS
# ================
# Installation stage
ARG_STAGE=

# ================
# LOGGER
# ================
# Fatal log level. Cause exit failure
LOG_LEVEL_FATAL=100
# Error log level
LOG_LEVEL_ERROR=200
# Warning log level
LOG_LEVEL_WARN=300
# Informational log level
LOG_LEVEL_INFO=500
# Debug log level
LOG_LEVEL_DEBUG=600

# Default log level
LOG_LEVEL=$LOG_LEVEL_INFO

# Print log message
# @param $1 Log level
# @param $2 Message
log_print_message() {
  _log_level=$1
  shift
  _log_message=${*:-}
  _log_name=""
  _log_prefix=""
  _log_suffix="\e[0m"

  # Check log level is enabled
  if [ "$_log_level" -gt "$LOG_LEVEL" ]; then
    return
  fi

  case $_log_level in
    "$LOG_LEVEL_FATAL")
      _log_name="FATAL"
      _log_prefix="\e[41;37m"
    ;;
    "$LOG_LEVEL_ERROR")
      _log_name="ERROR"
      _log_prefix="\e[1;31m"
    ;;
    "$LOG_LEVEL_WARN")
      _log_name="WARN"
      _log_prefix="\e[1;33m"
    ;;
    "$LOG_LEVEL_INFO")
      _log_name="INFO"
      _log_prefix="\e[37m"
    ;;
    "$LOG_LEVEL_DEBUG")
      _log_name="DEBUG"
      _log_prefix="\e[1;34m"
    ;;
  esac

  # Output to stdout
  printf "%b[%-6s] %s%b\n" "$_log_prefix" "$_log_name" "$_log_message" "$_log_suffix"

  # Exit if fatal
  if [ "$_log_level" -eq "${LOG_LEVEL_FATAL}" ]; then
      exit 1
  fi
}

# Fatal log message
FATAL() { log_print_message ${LOG_LEVEL_FATAL} "$@"; }
# Error log message
ERROR() { log_print_message ${LOG_LEVEL_ERROR} "$@"; }
# Warning log message
WARN() { log_print_message ${LOG_LEVEL_WARN} "$@"; }
# Informational log message
INFO() { log_print_message ${LOG_LEVEL_INFO} "$@"; }
# Debug log message
DEBUG() { log_print_message ${LOG_LEVEL_DEBUG} "$@"; }

# ================
# UTILS
# ================
# Show help message
show_help() {
cat << EOF
Usage: recluster.sh [--help] --stage <STAGE>

reCluster installation script.

Options:
  --help     Show this help message and exit
  --stage    Specify installation stage
EOF
}

# Assert command is installed
# @param $1 Command name
assert_cmd() {
  if ! command -v "$1" >/dev/null 2>&1; then
    FATAL "'$1' not found"
  fi
  DEBUG "'$1' found at $(command -v "$1")"
}

# Parse command line arguments
# @param $# Arguments
parse_args() {
  # Parse
  while [ $# -gt 0 ]; do
    case $1 in
      --help)
        # Display help message and exit
        show_help
        exit 1
      ;;
      --stage)
        # Installation stage
        if [ -n "${2+x}" ]; then
          ARG_STAGE=$2
          shift
          shift
        else
          FATAL "Argument '--stage' requires a non-empty value"
        fi
      ;;
      -*)
        # Unknown argument
        WARN "Unknown argument '$1' is ignored"
        shift
      ;;
      *)
        # No argument
        DEBUG "Skipping argument '$1'"
        shift
      ;;
    esac
  done

  # Checks
  if [ -z "$ARG_STAGE" ]; then FATAL "Argument '--stage' is required"; fi
}

# Stage 0
stage_0() {
  # reCluster directory
  if [ -d "$RECLUSTER_DIR" ]; then
    FATAL "reCluster directory '$RECLUSTER_DIR' already exists"
  fi
  INFO "Creating reCluster directory '$RECLUSTER_DIR'"
  mkdir -p "$RECLUSTER_DIR"

  INFO "Reading CPU info"
  read_cpu_info
  INFO "CPU is '$(echo "$CPU_INFO" | jq --raw-output .name)'"
}

# Read CPU info
read_cpu_info() {
  CPU_INFO="$(lscpu --json \
              | jq --compact-output --sort-keys '
                  .lscpu
                  | map({(.field): .data})
                  | add
                  | with_entries(if .key | endswith(":") then .key |= sub(":";"") else . end)
                  | .Flags /= " "
                  | ."CPU op-mode(s)" /= ", "
                  | .vulnerabilities = (to_entries | map(.key | select(startswith("Vulnerability "))[14:]))
                  | with_entries(select(.key | startswith("Vulnerability ") | not))
                  | . + {"architecture": .Architecture}
                  | . + {"flags": .Flags}
                  | . + {"modes": ."CPU op-mode(s)" | map(. | split("-")[0] | tonumber)}
                  | . + {"byteOrder": ."Byte Order"}
                  | . + {"cores": ."CPU(s)" | tonumber}
                  | . + {"vendor": ."Vendor ID"}
                  | . + {"family": ."CPU family" | tonumber}
                  | . + {"model": .Model | tonumber}
                  | . + {"name": ."Model name"}
                  | . + {"frequency": ."CPU MHz" | tonumber}
                  | . + {"cache": {"l1d": ."L1d cache", "l1i": ."L1i cache", "l2": ."L2 cache", "l3": ."L3 cache"}}
                  | with_entries(select(.key as $f | ["architecture", "flags", "modes", "byteOrder", "cores", "vendor", "family", "model", "name", "frequency", "cache", "vulnerabilities"] | index($f)))
                '
  )"

  DEBUG "CPU info: $(echo "$CPU_INFO" | jq .)"
}

################################################################################################################################

# === CONFIGURATION ===
# Log level
LOG_LEVEL=$LOG_LEVEL_DEBUG
# reCluster directory
RECLUSTER_DIR="/etc/recluster"

# === ASSERT ===
if [ "$(id -u)" -ne 0 ]; then FATAL "Run as 'root' for administrative rights"; fi
assert_cmd "curl"
assert_cmd "lscpu"
assert_cmd "lshw"
assert_cmd "lsmem"

# === ARGUMENTS ===
parse_args "$@"

# === MAIN ===
case $ARG_STAGE in
  0)
    stage_0
  ;;
  *)
    FATAL "Unknown stage '$ARG_STAGE'"
  ;;
esac
