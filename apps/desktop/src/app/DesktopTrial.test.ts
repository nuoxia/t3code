import * as NodeFS from "node:fs";
import * as NodePath from "node:path";
import * as NodeVM from "node:vm";
import * as NodeServices from "@effect/platform-node/NodeServices";
import * as Effect from "effect/Effect";
import { it } from "@effect/vitest";
import { afterEach, expect, vi } from "vite-plus/test";

import { resolveDefaultDesktopSettings } from "../settings/DesktopAppSettings.ts";
import { resolveUserDataPath } from "./DesktopUserData.ts";

const boot = NodeFS.readFileSync(new URL("../boot.ts", import.meta.url), "utf8");
afterEach(() => vi.unstubAllEnvs());

it.each([true, false])("isolates trial boot before loading runtime (trial=%s)", (trial) => {
  const env = { T3CODE_HOME: "/existing/home", T3CODE_DISABLE_AUTO_UPDATE: "0" };
  const loaded: string[] = [];
  NodeVM.runInNewContext(boot, {
    process: { env },
    require: (name: string) => {
      if (name === "electron") return { app: { isPackaged: true, getAppPath: () => "/app" } };
      if (name === "node:path") return NodePath.posix;
      if (name === "node:os") return { homedir: () => "/home/test" };
      if (name === "node:fs") return { readFileSync: () => JSON.stringify({ t3codeTrial: trial }) };
      loaded.push(name);
      expect(env.T3CODE_HOME).toBe(
        trial ? "/home/test/.t3-multirepo-trial-desktop" : "/existing/home",
      );
      expect(env.T3CODE_DISABLE_AUTO_UPDATE).toBe(trial ? "1" : "0");
      return {};
    },
  });
  expect(loaded).toEqual(["./compileCache.cjs", "./main.cjs"]);
});

it.effect("starts trial with its local backend disabled and a separate Chromium profile", () =>
  Effect.gen(function* () {
    vi.stubEnv("T3CODE_DESKTOP_TRIAL", "1");
    expect(resolveDefaultDesktopSettings("0.1.9").localEnvironmentEnabled).toBe(false);
    const profile = yield* resolveUserDataPath({
      appDataDirectory: "/home/test/Library/Application Support",
      isDevelopment: false,
      platform: "darwin",
    }).pipe(Effect.provide(NodeServices.layer));
    expect(profile).toBe("/home/test/Library/Application Support/t3code-multirepo-trial");
    vi.stubEnv("T3CODE_DESKTOP_TRIAL", "0");
    expect(resolveDefaultDesktopSettings("0.1.9").localEnvironmentEnabled).toBe(true);
  }),
);
