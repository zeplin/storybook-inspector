import { StoryStore } from "@storybook/preview-api";
import { LinkBases } from "./zeplinLink";
import { AnyFramework } from "@storybook/csf";

const DEFAULT_RETRY_COUNT = 120;
const DEFAULT_SLEEP_DURATION = 500;

function sleep(duration: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, duration));
}

export interface GlobalContext {
    framework: string;
    renderer: string;
    store: StoryStore<AnyFramework>;
    linkBases: LinkBases;
    react?: Record<string, {
        docgenInfo: {
            description: string;
            displayName: string;
            props: Array<{
                defaultValue: string;
                description: string;
                name: string;
                required: boolean;
                type: unknown;
            }>
        };
        path: string;
        name: string;
    }>;
    angular?: Array<{
        name: string;
        file: string;
    }>
}

export async function getGlobalContext(
    windowObject: unknown,
    linkBases: LinkBases,
    retryCount = DEFAULT_RETRY_COUNT
): Promise<GlobalContext> {
    if (!windowObject ||
        !(windowObject instanceof Object) ||
        !(typeof windowObject === "object" && "0" in windowObject) ||
        !(windowObject[0] && typeof windowObject[0] === "object" && (
            "__STORYBOOK_CLIENT_API__" in windowObject[0] || "__STORYBOOK_PREVIEW__" in windowObject[0]
        ))) {
        if (retryCount === 0) {
            throw new Error("Timeout while getting Storybook Client API");
        }

        await sleep(DEFAULT_SLEEP_DURATION);
        return getGlobalContext(windowObject, linkBases, retryCount - 1);
    }

    const {
        __STORYBOOK_CLIENT_API__: {
            store,
            storyStore
        } = {
            store: undefined,
            storyStore: undefined
        },
        __STORYBOOK_PREVIEW__: {
            storyStoreValue
        },
        STORYBOOK_ENV,
        STORYBOOK_REACT_CLASSES = {},
        __STORYBOOK_COMPODOC_JSON__ = {}
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } = windowObject[0] as any;

    // Storybook 6.4 doesn't have the store property. Use the storyStore instead.
    // Storybook 8 doesn't have storyStore property. Use preview's storyStoreValue instead.
    // TODO: update this to use preview api for storybook v9
    const foundStore = store?.() || storyStore || storyStoreValue;

    switch (STORYBOOK_ENV) {
        case "react":
            return {
                store: foundStore,
                linkBases,
                framework: STORYBOOK_ENV,
                renderer: STORYBOOK_ENV,
                react: STORYBOOK_REACT_CLASSES
            };
        case "angular":
            return {
                store: foundStore,
                linkBases,
                framework: STORYBOOK_ENV,
                renderer: STORYBOOK_ENV,
                angular: __STORYBOOK_COMPODOC_JSON__
            };
        default:
            return {
                store: foundStore,
                linkBases,
                framework: STORYBOOK_ENV,
                renderer: STORYBOOK_ENV
            };
    }
}
