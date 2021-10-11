import { StoryContext } from "@storybook/addons";

import {
    getAngularCodeSnippet,
    getReactCodeSnippet,
    getSvelteCodeSnippet,
    getWebComponentsCodeSnippet,
    getVueCodeSnippet
} from "./frameworks";
import { getStory } from "./storyHelper";

const codeSnippetMapper = new Map<string, (c: StoryContext) => string | undefined>([
    ["react", getReactCodeSnippet],
    ["angular", getAngularCodeSnippet],
    ["web-components", getWebComponentsCodeSnippet],
    ["svelte", getSvelteCodeSnippet],
    ["vue", getVueCodeSnippet]
]);

export function getSnippetFromStoryFn(context: StoryContext): string | undefined {
    const {
        parameters: { framework }
    } = context;

    const snippetFunction = codeSnippetMapper.get(framework);

    const story = getStory(context);

    if (snippetFunction === undefined && typeof story === "string") {
        return story;
    }

    return snippetFunction?.(context);
}
