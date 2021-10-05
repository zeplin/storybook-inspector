import { StoryStore } from "@storybook/client-api";
import { LinkBases } from "./zeplinLink";

const DEFAULT_RETRY_COUNT = 120;
const DEFAULT_SLEEP_DURATION = 500;

function sleep(duration: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, duration));
}

export interface GlobalContext {
    framework: string;
    store: StoryStore;
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
        !("0" in windowObject) ||
        !("__STORYBOOK_CLIENT_API__" in windowObject[0])) {
        if (retryCount === 0) {
            throw new Error("Timeout while extracting Storybook data");
        }

        await sleep(DEFAULT_SLEEP_DURATION);
        return getGlobalContext(windowObject, linkBases, retryCount - 1);
    }

    const {
        __STORYBOOK_CLIENT_API__: {
            store
        },
        STORYBOOK_ENV,
        STORYBOOK_REACT_CLASSES = {},
        __STORYBOOK_COMPODOC_JSON__ = {}
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } = windowObject[0] as any;

    switch (STORYBOOK_ENV) {
        case "react":
            return {
                store: store(),
                linkBases,
                framework: STORYBOOK_ENV,
                react: STORYBOOK_REACT_CLASSES
            };
        case "angular":
            return {
                store: store(),
                linkBases,
                framework: STORYBOOK_ENV,
                angular: __STORYBOOK_COMPODOC_JSON__
            };
        default:
            return {
                store: store(),
                linkBases,
                framework: STORYBOOK_ENV
            };
    }
}
