import { StoryContext } from "@storybook/addons";
import {
    getReactCodeLanguage,
    getAngularCodeLanguage,
    getVueCodeLanguage,
    getSvelteCodeLanguage,
    getWebComponentsCodeLanguage
} from "./frameworks";
import { GlobalContext } from "../globalContext";

const codeLanguageFunctionMapper = new Map<string, (c: StoryContext, gc: GlobalContext) => string | undefined>([
    ["angular", getAngularCodeLanguage],
    ["react", getReactCodeLanguage],
    ["svelte", getSvelteCodeLanguage],
    ["web-components", getWebComponentsCodeLanguage],
    ["vue", getVueCodeLanguage]
]);

export function getCodeLanguage(context: StoryContext, globalContext: GlobalContext): string | undefined {
    const {
        parameters: { framework }
    } = context;

    const codeLanguageFunction = codeLanguageFunctionMapper.get(framework);

    return codeLanguageFunction?.(context, globalContext);
}
