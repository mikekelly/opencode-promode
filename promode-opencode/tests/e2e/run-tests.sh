#!/bin/bash

# E2E Test Runner for promode-opencode
#
# Runs OpenCode CLI with test prompts and verifies plugin behavior.
#
# Usage:
#   ./run-tests.sh              Run all tests
#   ./run-tests.sh test-name    Run specific test
#   ./run-tests.sh --verbose    Run with verbose output

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROMPTS_DIR="$SCRIPT_DIR/prompts"
FIXTURES_DIR="$SCRIPT_DIR/fixtures"
VERBOSE=false

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[0;33m'
NC='\033[0m' # No Color

# Parse arguments
SPECIFIC_TEST=""
while [[ $# -gt 0 ]]; do
  case $1 in
    --verbose|-v)
      VERBOSE=true
      shift
      ;;
    --help|-h)
      echo "Usage: $0 [OPTIONS] [TEST_NAME]"
      echo ""
      echo "Options:"
      echo "  --verbose, -v    Show full test output"
      echo "  --help, -h       Show this help message"
      echo ""
      echo "Tests:"
      for f in "$PROMPTS_DIR"/*.md; do
        name=$(basename "$f" .md)
        echo "  $name"
      done
      exit 0
      ;;
    *)
      SPECIFIC_TEST="$1"
      shift
      ;;
  esac
done

# Check prerequisites
check_prerequisites() {
  echo "Checking prerequisites..."

  if ! command -v opencode &> /dev/null; then
    echo -e "${RED}Error: opencode CLI not found${NC}"
    echo "Install OpenCode first: https://opencode.ai/docs/installation"
    exit 1
  fi

  # Check if plugin is installed
  if ! node "$SCRIPT_DIR/../../dist/cli/install.js" status 2>&1 | grep -q "installed"; then
    echo -e "${YELLOW}Warning: promode-opencode plugin may not be installed${NC}"
    echo "Run: bunx promode-opencode install"
  fi

  echo "Prerequisites OK"
}

# Run a single test
run_test() {
  local test_name="$1"
  local prompt_file="$PROMPTS_DIR/$test_name.md"

  if [[ ! -f "$prompt_file" ]]; then
    echo -e "${RED}Test not found: $test_name${NC}"
    return 1
  fi

  echo -n "Running test: $test_name ... "

  # Create temp directory for test
  local test_dir=$(mktemp -d)
  trap "rm -rf $test_dir" EXIT

  # Copy fixtures if they exist
  if [[ -d "$FIXTURES_DIR/simple-project" ]]; then
    cp -r "$FIXTURES_DIR/simple-project/"* "$test_dir/"
  fi

  # Read prompt content
  local prompt=$(cat "$prompt_file")

  # Run OpenCode with the prompt
  local output
  local exit_code=0

  if $VERBOSE; then
    echo ""
    output=$(cd "$test_dir" && echo "$prompt" | opencode run 2>&1) || exit_code=$?
    echo "$output"
  else
    output=$(cd "$test_dir" && echo "$prompt" | opencode run 2>&1) || exit_code=$?
  fi

  # Check for PASS/FAIL markers in output
  if echo "$output" | grep -q "PASS"; then
    echo -e "${GREEN}PASSED${NC}"
    return 0
  elif echo "$output" | grep -q "FAIL"; then
    echo -e "${RED}FAILED${NC}"
    if ! $VERBOSE; then
      echo "Output:"
      echo "$output" | tail -20
    fi
    return 1
  else
    echo -e "${YELLOW}INCONCLUSIVE${NC}"
    if ! $VERBOSE; then
      echo "Output:"
      echo "$output" | tail -20
    fi
    return 1
  fi
}

# Main test runner
main() {
  check_prerequisites

  local passed=0
  local failed=0
  local tests=()

  if [[ -n "$SPECIFIC_TEST" ]]; then
    tests=("$SPECIFIC_TEST")
  else
    for f in "$PROMPTS_DIR"/*.md; do
      if [[ -f "$f" ]]; then
        tests+=($(basename "$f" .md))
      fi
    done
  fi

  if [[ ${#tests[@]} -eq 0 ]]; then
    echo "No tests found in $PROMPTS_DIR"
    exit 0
  fi

  echo ""
  echo "Running ${#tests[@]} test(s)..."
  echo ""

  for test in "${tests[@]}"; do
    if run_test "$test"; then
      ((passed++))
    else
      ((failed++))
    fi
  done

  echo ""
  echo "Results: $passed passed, $failed failed"

  if [[ $failed -gt 0 ]]; then
    exit 1
  fi
}

main
