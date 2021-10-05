import { PublishedStoreItem } from "@storybook/client-api";
import { StoryContext } from "@storybook/addons";

import { LinkBases, LinkProperties, getZeplinLinkProperties } from "./zeplinLink";
import { getCodeLanguage, getCodeSnippet, getComponentName, getFilePath } from "./extractors";
import { GlobalContext } from "./globalContext";

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
): { code: string; lang: string; } | string | undefined {
    const code = getCodeSnippet(storyContext);
    const lang = getCodeLanguage(storyContext, globalContext);
    if (!code) {
        return undefined;
    }
    if (!lang) {
        return code;
    }
    return {
        code,
        lang
    };
}

export interface StorySummary {
    id: string;
    kind: string;
    name: string;
    zeplinSources: LinkProperties[];
}
export interface StoryDetail extends StorySummary{
    componentName?: string;
    filePath?: string;
    framework: string;
    description?: string;
    snippet?: {
        code: string;
        lang: string;
    } | string
}

export function getStories({ store, linkBases }: GlobalContext):StorySummary[] {
    return Object.keys(store.extract({ includeDocsOnly: false }))
        .map(key => store.fromId(key))
        .filter((value): value is PublishedStoreItem => Boolean(value))
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
        })).sort((a, b) => {
            if (a.kind.includes("/") && !b.kind.includes("/")) {
                return 1;
            }
            if (b.kind.includes("/") && !a.kind.includes("/")) {
                return -1;
            }
            return 0;
        });
}

export function getStoryDetail(id: string, globalContext: GlobalContext): StoryDetail | undefined {
    const storyContext = globalContext.store.fromId(id);

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
