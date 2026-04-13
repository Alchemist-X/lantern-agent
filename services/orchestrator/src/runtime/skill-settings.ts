import type {
  OrchestratorConfig,
  SkillLocale
} from "../config.js";

export type SupportedSkillId = string;

export interface ResolvedSkillDescriptor {
  id: SupportedSkillId;
  skillDir: string;
  skillFile: string;
}

export interface ResolvedProviderSkillSettings {
  provider: string;
  command: string;
  model: string;
  locale: SkillLocale;
  skillRootDir: string;
  skills: ResolvedSkillDescriptor[];
}

export function resolveEffectiveProvider(config: OrchestratorConfig, provider: string): string {
  if (provider !== "none") {
    return provider;
  }
  return config.runtimeProvider !== "none" ? config.runtimeProvider : "none";
}

export function resolveProviderSkillSettings(
  _config: OrchestratorConfig,
  provider: string
): ResolvedProviderSkillSettings {
  return {
    provider,
    command: "",
    model: "",
    locale: "en",
    skillRootDir: "",
    skills: []
  };
}
