import { StoryContext } from "@storybook/addons";
import {
    getReactComponentName,
    getAngularComponentName,
    getVueComponentName,
    getSvelteComponentName
} from "./frameworks";

const componentNameFunctionMapper = new Map<string, (c: StoryContext) => string | undefined>([
    ["react", getReactComponentName],
    ["angular", getAngularComponentName],
    ["svelte", getSvelteComponentName],
    ["vue", getVueComponentName]
]);

export function getComponentName(context: StoryContext): string | undefined {
    const {
        parameters: { framework }
    } = context;

    const componentNameFunction = componentNameFunctionMapper.get(framework);

    return componentNameFunction?.(context);
}
