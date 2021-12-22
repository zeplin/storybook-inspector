import { ArgsStoryFn, LegacyStoryFn, StoryContext } from "@storybook/addons";

export function getStory(context: StoryContext, { useOriginal = false } = {}): unknown {
    const {
        parameters: {
            passArgsFirst = true
        }
    } = context;

    // Storybook 6.4 doesn't have the getOriginal property. Use the originalStoryFn instead.
    const storyFn = (useOriginal
        ? context.getOriginal?.() || context.originalStoryFn
        : context.storyFn
    );

    return (
        passArgsFirst
            ? (storyFn as ArgsStoryFn)(context.args, context)
            : (storyFn as LegacyStoryFn)(context)
    );
}
