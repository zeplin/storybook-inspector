import { StoryContext } from "@storybook/addons";
import { getReactFilePath, getAngularFilePath, getVueFilePath } from "./frameworks";
import { GlobalContext } from "../globalContext";

function getStoryFilePath(context: StoryContext): string | undefined {
    const fileName = context?.parameters?.fileName;
    return typeof fileName === "string" && Number.isNaN(Number(fileName)) ? fileName : undefined;
}

const filePathFunctionMapper = new Map<string, (c: StoryContext, gc: GlobalContext) => string | undefined>([
    ["react", getReactFilePath],
    ["angular", getAngularFilePath],
    ["vue", getVueFilePath]
]);

export function getFilePath(context: StoryContext, globalContext: GlobalContext): string | undefined {
    const {
        parameters: { framework }
    } = context;

    const filePathFunction = filePathFunctionMapper.get(framework) || getStoryFilePath;

    return filePathFunction(context, globalContext) || getStoryFilePath(context);
}
