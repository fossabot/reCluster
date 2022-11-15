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

# Current directory
# shellcheck disable=SC1007
DIRNAME=$(CDPATH= cd -- "$(dirname -- "$0")" && pwd)

# Load commons
. "$DIRNAME/__commons.sh"

# ================
# CONFIGURATION
# ================
# Configuration file
CONFIG_FILE="$DIRNAME/bundle.config.yml"
# Output file
OUT_FILE="bundle.tar.gz"
# Root directory
ROOT_DIR="$(readlink -f "$DIRNAME/..")"

# ================
# GLOBALS
# ================
# Configuration
CONFIG=
# Git files
GIT_FILES=
# Return value
RETVAL=
# Temporary directory
TMP_DIR=

# ================
# CLEANUP
# ================
cleanup() {
  # Exit code
  _exit_code=$?
  [ $_exit_code = 0 ] || WARN "Cleanup exit code $_exit_code"

  # Cleanup temporary directory
  cleanup_dir "$TMP_DIR"

  exit "$_exit_code"
}

# Trap
trap cleanup INT QUIT TERM EXIT

# ================
# FUNCTIONS
# ================
# Show help message
show_help() {
  cat << EOF
Usage: $(basename "$0") [--help] [--out-file <FILE>]

reCluster bundle script.

Options:
  --help   Show this help message and exit

  --out-file <FILE>  Output file
                     Default: $OUT_FILE
                     Values:
                       Any valid file
EOF
}

# Check if directory in git
# @param $1 Directory path
directory_in_git() {
  _dir=$1
  DEBUG "Checking directory '$_dir' in Git"
  [ "$(echo "$GIT_FILES" | jq --raw-output --arg dir "$_dir" 'any(.[]; startswith($dir))')" = true ]
}

# Bundle files
bundle_files() {
  _files="[]"

  while read -r _entry; do
    _path="$(echo "$_entry" | jq --raw-output '.key')"
    _path_src="$ROOT_DIR/$_path"
    _skip=$(echo "$_entry" | jq --raw-output '.value | type == "boolean" and . | not')

    INFO "Checking '$_path'"

    [ "$_skip" = false ] || {
      WARN "Skipping '$_path' from bundle files"
      continue
    }
    [ -f "$_path_src" ] || [ -d "$_path_src" ] || FATAL "File or directory '$_path_src' does not exists"

    # Add path to bundle
    if [ -f "$_path_src" ]; then
      # File
      DEBUG "Adding file '$_path' to bundle files"
      _files=$(echo "$_files" | jq --arg file "$_path" '. += [$file]')
    elif [ -d "$_path_src" ]; then
      # Directory
      DEBUG "Adding directory '$_path' to bundle files"
      _new_files=

      # Check Git
      if directory_in_git "$_path"; then
        # Git
        DEBUG "Directory '$_path' in Git"
        _new_files=$(echo "$GIT_FILES" | jq --arg dir "$_path" 'map(select(startswith($dir) and (contains(".gitignore") | not) and (contains(".gitkeep") | not)))')
      else
        # No Git
        DEBUG "Directory '$_path' not in Git"
        _new_files=$(find "$_path_src" -type f | sed -n -e 's#^.*'"$ROOT_DIR"'/##p' | jq --raw-input --null-input '[inputs | select(length > 0)]')
      fi

      # Skip if no new files
      { [ "$_new_files" != "" ] && [ "$_new_files" != "[]" ]; } || {
        WARN "Directory '$_path' is empty"
        continue
      }

      DEBUG "Bundle files from '$_path':" "$_new_files"
      # Add to files
      _files=$(echo "$_files" | jq --argjson files "$_new_files" '. + $files')
    fi
  done << EOF
$(echo "$CONFIG" | jq --compact-output '[paths([scalars] != []) as $path | {"key": $path | join("/"), "value": getpath($path)}] | from_entries | to_entries[]')
EOF

  # Remove duplicates and sort
  _files=$(echo "$_files" | jq 'unique | sort')

  # Return
  RETVAL=$_files
}

################################################################################################################################

# Parse command line arguments
# @param $@ Arguments
parse_args() {
  # Parse
  while [ $# -gt 0 ]; do
    case $1 in
      --help)
        # Display help message and exit
        show_help
        exit 0
        ;;
      --out-file)
        # Output file
        parse_args_assert_value "$@"

        _out_file=$2
        shift
        shift
        ;;
      -*)
        # Unknown argument
        WARN "Unknown argument '$1' is ignored"
        shift
        ;;
      *)
        # No argument
        WARN "Skipping argument '$1'"
        shift
        ;;
    esac
  done

  # Output file
  if [ -n "$_out_file" ]; then OUT_FILE=$_out_file; fi
}

# Verify system
verify_system() {
  assert_cmd find
  assert_cmd git
  assert_cmd jq
  assert_cmd mktemp
  assert_cmd sed
  assert_cmd tar
  assert_cmd yq

  [ ! -f "$OUT_FILE" ] || WARN "Output file '$OUT_FILE' already exists"

  # Configuration
  [ -f "$CONFIG_FILE" ] || FATAL "Configuration file '$CONFIG_FILE' not found"
  INFO "Reading configuration file '$CONFIG_FILE'"
  CONFIG=$(yq e --output-format=json --no-colors '.' "$CONFIG_FILE") || FATAL "Error reading configuration file '$CONFIG_FILE'"
  DEBUG "Configuration:" "$CONFIG"
}

# Setup system
setup_system() {
  # Temporary directory
  TMP_DIR=$(mktemp --directory)
  DEBUG "Created temporary directory '$TMP_DIR'"

  # Git files
  GIT_FILES=$(git --git-dir "$ROOT_DIR/.git" ls-files --cached --others --exclude-standard --full-name | jq --raw-input --null-input '[inputs | select(length > 0)]')
  DEBUG "Git files:" "$GIT_FILES"
}

# Bundle
bundle() {
  _files=

  # Files
  bundle_files
  _files=$RETVAL
  DEBUG "Bundle files:" "$_files"

  while read -r _file; do
    _file="$(echo "$_file" | jq --raw-output '.')"
    _file_src="$ROOT_DIR/$_file"
    _file_dst="$TMP_DIR/$_file"
    _file_dst_dir=$(dirname "$_file_dst")

    INFO "Bundling '$_file'"

    # Create destination directory if not exists
    [ -d "$_file_dst_dir" ] || {
      DEBUG "Creating directory '$_file_dst_dir'"
      mkdir -p "$_file_dst_dir"
    }

    # Copy
    DEBUG "Copying '$_file_src' to '$_file_dst'"
    cp "$_file_src" "$_file_dst" || FATAL "Error copying '$_file_src' to '$_file_dst'"
  done << EOF
$(echo "$_files" | jq --compact-output '.[]')
EOF
}

# Bundle tarball
bundle_tarball() {
  INFO "Generating tarball '$OUT_FILE'"

  find "$TMP_DIR" -printf "%P\n" \
    | tar \
      --create \
      --verbose \
      --gzip \
      --no-recursion \
      --file="$OUT_FILE" \
      --directory="$TMP_DIR" \
      --files-from=-
}

# ================
# MAIN
# ================
{
  parse_args "$@"
  verify_system
  setup_system
  bundle
  bundle_tarball
}
