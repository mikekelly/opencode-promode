#!/usr/bin/env node

/**
 * CLI Installer for promode-opencode
 *
 * Registers the plugin with OpenCode by:
 * 1. Adding to ~/.config/opencode/opencode.json plugins array
 * 2. Creating default config at ~/.config/opencode/promode.json
 *
 * Usage:
 *   bunx promode-opencode install   # Install the plugin
 *   bunx promode-opencode uninstall # Remove the plugin
 *   bunx promode-opencode status    # Check installation status
 */

import { existsSync, mkdirSync, readFileSync, writeFileSync } from "fs"
import { homedir } from "os"
import { join } from "path"

const PLUGIN_NAME = "promode-opencode"
const CONFIG_DIR = join(homedir(), ".config", "opencode")
const OPENCODE_CONFIG = join(CONFIG_DIR, "opencode.json")
const PROMODE_CONFIG = join(CONFIG_DIR, "promode.json")

interface OpencodeConfig {
  plugin?: string[]
  [key: string]: unknown
}

interface PromodeConfig {
  version: string
  features: {
    tdd_enforcement: boolean
    context_monitoring: boolean
    self_compaction: boolean
  }
}

const DEFAULT_PROMODE_CONFIG: PromodeConfig = {
  version: "0.1.0",
  features: {
    tdd_enforcement: true,
    context_monitoring: true,
    self_compaction: true,
  },
}

function ensureConfigDir(): void {
  if (!existsSync(CONFIG_DIR)) {
    mkdirSync(CONFIG_DIR, { recursive: true })
    console.log(`Created config directory: ${CONFIG_DIR}`)
  }
}

function readOpencodeConfig(): OpencodeConfig {
  if (!existsSync(OPENCODE_CONFIG)) {
    return {}
  }
  try {
    return JSON.parse(readFileSync(OPENCODE_CONFIG, "utf-8"))
  } catch (error) {
    console.warn(`Warning: Could not parse ${OPENCODE_CONFIG}, starting fresh`)
    return {}
  }
}

function writeOpencodeConfig(config: OpencodeConfig): void {
  writeFileSync(OPENCODE_CONFIG, JSON.stringify(config, null, 2))
}

function isInstalled(): boolean {
  const config = readOpencodeConfig()
  return config.plugin?.includes(PLUGIN_NAME) ?? false
}

function install(): void {
  ensureConfigDir()

  // Update OpenCode config
  const config = readOpencodeConfig()
  config.plugin = config.plugin ?? []

  if (config.plugin.includes(PLUGIN_NAME)) {
    console.log(`${PLUGIN_NAME} is already installed`)
  } else {
    config.plugin.push(PLUGIN_NAME)
    writeOpencodeConfig(config)
    console.log(`Added ${PLUGIN_NAME} to OpenCode plugins`)
  }

  // Create promode config if it doesn't exist
  if (!existsSync(PROMODE_CONFIG)) {
    writeFileSync(PROMODE_CONFIG, JSON.stringify(DEFAULT_PROMODE_CONFIG, null, 2))
    console.log(`Created promode config at ${PROMODE_CONFIG}`)
  } else {
    console.log(`Promode config already exists at ${PROMODE_CONFIG}`)
  }

  console.log(`
Installation complete!

Features enabled:
  - TDD enforcement: Reminds you to write tests first
  - Context monitoring: Shows context usage warnings
  - Self-compaction: Tools for agent-initiated context management
  - Promode subagent: Subagent that follows promode methodology

Restart OpenCode to activate the plugin.
`)
}

function uninstall(): void {
  const config = readOpencodeConfig()

  if (!config.plugin?.includes(PLUGIN_NAME)) {
    console.log(`${PLUGIN_NAME} is not installed`)
    return
  }

  config.plugin = config.plugin.filter((p) => p !== PLUGIN_NAME)
  writeOpencodeConfig(config)
  console.log(`Removed ${PLUGIN_NAME} from OpenCode plugins`)
  console.log(`Note: Promode config at ${PROMODE_CONFIG} was preserved`)
  console.log(`Restart OpenCode to complete uninstallation.`)
}

function status(): void {
  const installed = isInstalled()
  console.log(`${PLUGIN_NAME}: ${installed ? "installed" : "not installed"}`)

  if (existsSync(PROMODE_CONFIG)) {
    try {
      const promodeConfig = JSON.parse(readFileSync(PROMODE_CONFIG, "utf-8"))
      console.log(`\nPromode config (${PROMODE_CONFIG}):`)
      console.log(JSON.stringify(promodeConfig, null, 2))
    } catch {
      console.log(`\nPromode config exists but could not be parsed`)
    }
  } else {
    console.log(`\nNo promode config found`)
  }
}

function printHelp(): void {
  console.log(`
promode-opencode - Promode methodology plugin for OpenCode

Usage:
  promode-opencode install    Install the plugin
  promode-opencode uninstall  Remove the plugin
  promode-opencode status     Check installation status
  promode-opencode help       Show this help message

The plugin provides:
  - TDD enforcement hooks (reminds you to write tests first)
  - Context monitoring (shows usage warnings at thresholds)
  - Self-compaction tools (get_context_usage, self_compact)
  - Promode-trained subagent for task delegation

Configuration:
  ${OPENCODE_CONFIG} - Plugin registration
  ${PROMODE_CONFIG} - Feature toggles
`)
}

// Main entry point
const command = process.argv[2]

switch (command) {
  case "install":
    install()
    break
  case "uninstall":
    uninstall()
    break
  case "status":
    status()
    break
  case "help":
  case "--help":
  case "-h":
    printHelp()
    break
  default:
    if (command) {
      console.error(`Unknown command: ${command}`)
    }
    printHelp()
    process.exit(command ? 1 : 0)
}
