import { StoryContext } from "@storybook/types";
import {
    getReactCodeLanguage,
    getAngularCodeLanguage,
    // GetVueCodeLanguage,
    getSvelteCodeLanguage,
    getWebComponentsCodeLanguage
} from "./frameworks";
import { GlobalContext } from "../globalContext";

const codeLanguageFunctionMapper = new Map<string, (c: StoryContext, gc: GlobalContext) => string | undefined>([
    ["angular", getAngularCodeLanguage],
    ["react", getReactCodeLanguage],
    ["svelte", getSvelteCodeLanguage],
    ["web-components", getWebComponentsCodeLanguage]
    // ["vue", getVueCodeLanguage]
]);

export function getCodeLanguage(context: StoryContext, globalContext: GlobalContext): string | undefined {
    const {
        parameters: { framework, renderer }
    } = context;

    const codeLanguageFunction = codeLanguageFunctionMapper.get(framework || renderer);

    return codeLanguageFunction?.(context, globalContext);
}
