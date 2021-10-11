import { StoryContext } from "@storybook/addons";

import { getSnippetFromStoryFn } from "./getCodeSnippetFromStoryFn";
import { getCodeSnippetFromStorySource } from "./getCodeSnippetFromStorySource";

export function getCodeSnippet(context: StoryContext): string | undefined {
    try {
        if (context.parameters.docs?.source?.code) {
            return context.parameters.docs.source.code;
        }

        const snippet = getSnippetFromStoryFn(context) || getCodeSnippetFromStorySource(context);

        if (!snippet) {
            return snippet;
        }

        return context.parameters.docs?.transformSource?.(snippet, context) ?? snippet;
    } catch (e) {
        // eslint-disable-next-line no-console
        console.error("Error occurred while generating code snippet on Storybook", e);
        return undefined;
    }
}
