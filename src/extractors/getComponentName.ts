import { StoryContext } from "@storybook/types";
import {
    getReactComponentName,
    getAngularComponentName,
    // GetVueComponentName,
    getSvelteComponentName
} from "./frameworks";

const componentNameFunctionMapper = new Map<string, (c: StoryContext) => string | undefined>([
    ["react", getReactComponentName],
    ["angular", getAngularComponentName],
    ["svelte", getSvelteComponentName]
    // ["vue", getVueComponentName]
]);

export function getComponentName(context: StoryContext): string | undefined {
    const {
        parameters: { framework, renderer }
    } = context;

    const componentNameFunction = componentNameFunctionMapper.get(framework || renderer);

    return componentNameFunction?.(context);
}
