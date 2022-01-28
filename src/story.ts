import { BoundStory } from "@storybook/client-api";
import { StoryContext } from "@storybook/addons";

import { LinkBases, LinkProperties, getZeplinLinkProperties } from "./zeplinLink";
import { getCodeLanguage, getCodeSnippet, getComponentName, getFilePath } from "./extractors";
import { GlobalContext } from "./globalContext";
import { AnyFramework } from "@storybook/csf";

function extractZeplinLink(
    zeplinLink: string | { link: string }[] | undefined,
    linkBases: LinkBases
): LinkProperties[] {
    if (!zeplinLink) {
        return [];
    }
    if (Array.isArray(zeplinLink)) {
        return zeplinLink.map(({ link }) => getZeplinLinkProperties(link, linkBases));
    }

    return [getZeplinLinkProperties(zeplinLink, linkBases)];
}

function getSnippet(
    storyContext: StoryContext,
    globalContext: GlobalContext
): { code: string; lang?: string; } | undefined {
    const code = getCodeSnippet(storyContext);
    if (!code) {
        return undefined;
    }
    return {
        code,
        lang: getCodeLanguage(storyContext, globalContext)
    };
}

/**
 * Storybook shows the grouped components after ungrouped ones.
 * This comparison helps to sort components and stories like in the UI.
 * You can also check here about grouping and hierarchy.
 * {@link https://storybook.js.org/docs/react/writing-stories/naming-components-and-hierarchy grouping and hierarchy on Storybook}
 * @param left
 * @param right
 */
function compareByGroupedOrNot(left: { kind: string; }, right: { kind: string; }): number {
    if (left.kind.includes("/") && !right.kind.includes("/")) {
        return 1;
    }
    if (right.kind.includes("/") && !left.kind.includes("/")) {
        return -1;
    }
    return 0;
}

export interface StorySummary {
    id: string;
    kind: string;
    name: string;
    zeplinSources: LinkProperties[];
}

export interface StoryDetail extends StorySummary {
    componentName?: string;
    filePath?: string;
    framework: string;
    description?: string;
    snippet?: {
        code: string;
        lang?: string;
    }
}

export async function getStories({ store, linkBases }: GlobalContext): Promise<StorySummary[]> {
    // `cacheAllCSFFiles` is added with Storybook v7
    // To support older versions, we need to call with optional chaining.
    await store.cacheAllCSFFiles?.();
    return Object.keys(store.extract({ includeDocsOnly: false }))
        .map(key => store.fromId(key))
        .filter((value): value is BoundStory<AnyFramework> => Boolean(value))
        .map(({
            id,
            kind,
            name,
            parameters: {
                zeplinLink
            }
        }) => ({
            id,
            kind,
            name,
            zeplinSources: extractZeplinLink(zeplinLink, linkBases)
        })).sort(compareByGroupedOrNot);
}

export function getStoryDetail(id: string, globalContext: GlobalContext): StoryDetail | undefined {
    const { store } = globalContext;

    // The return type of `fromId` is changed with Storybook v7
    // For older versions, `storyContext` is `boundStory`,
    // For newer versions, we need to call `getStoryContext` to get context.
    const boundStory = store.fromId(id);
    const storyContext = (store.getStoryContext?.(boundStory) ?? boundStory) as StoryContext;

    if (!storyContext || storyContext.parameters.docsOnly) {
        return undefined;
    }

    const {
        kind,
        name,
        parameters
    } = storyContext;

    return {
        id,
        kind,
        name,
        zeplinSources: extractZeplinLink(parameters.zeplinLink, globalContext.linkBases),
        componentName: getComponentName(storyContext) || undefined,
        filePath: getFilePath(storyContext, globalContext) || undefined,
        framework: parameters.framework,
        description: parameters.docs?.extractComponentDescription?.(parameters.component) || undefined,
        snippet: getSnippet(storyContext, globalContext)
    };
}
