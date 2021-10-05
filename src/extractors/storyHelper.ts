import { ArgsStoryFn, LegacyStoryFn, StoryContext } from "@storybook/addons";

export function getStory(context: StoryContext, { useOriginal = false } = {}): unknown {
    const {
        parameters: {
            passArgsFirst = true
        }
    } = context;

    const storyFn = useOriginal ? context.getOriginal() : context.storyFn;

    return (
        passArgsFirst
            ? (storyFn as ArgsStoryFn)(context.args, context)
            : (storyFn as LegacyStoryFn)(context)
    );
}
