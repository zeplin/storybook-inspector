import { StoryContext } from "@storybook/types";

import {
    getAngularCodeSnippet,
    getReactCodeSnippet,
    getSvelteCodeSnippet,
    getWebComponentsCodeSnippet
    // GetVueCodeSnippet
} from "./frameworks";
import { getStory } from "./storyHelper";

const codeSnippetMapper = new Map<string, (c: StoryContext) => string | undefined>([
    ["react", getReactCodeSnippet],
    ["angular", getAngularCodeSnippet],
    ["web-components", getWebComponentsCodeSnippet],
    ["svelte", getSvelteCodeSnippet]
    // ["vue", getVueCodeSnippet]
]);

export function getSnippetFromStoryFn(context: StoryContext): string | undefined {
    const {
        parameters: { framework, renderer }
    } = context;

    const snippetFunction = codeSnippetMapper.get(framework || renderer);

    const story = getStory(context);

    if (snippetFunction === undefined && typeof story === "string") {
        return story;
    }

    return snippetFunction?.(context);
}
