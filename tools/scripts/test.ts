import { defineConfig } from "vitest/config";
import { settings } from "./settings.ts";

export default defineConfig(settings("test"));
