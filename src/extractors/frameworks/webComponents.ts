// Original file: https://github.com/storybookjs/storybook/blob/9a5dccde24/addons/docs/src/frameworks/web-components/sourceDecorator.ts

import { render } from "lit-html";
import { StoryContext } from "@storybook/addons";
import { getStory } from "../storyHelper";

export function getWebComponentsCodeSnippet(context: StoryContext): string | undefined {
    const story = getStory(context, { useOriginal: true });

    const container = window.document.createElement("div");

    render(story, container);

    return container.innerHTML.replace(/<!---->/g, "");
}

export function getWebComponentsCodeLanguage(): string {
    return "html";
}
