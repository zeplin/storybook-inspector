import { StoryContext } from "@storybook/addons";

interface Location {
    startBody: {
        col: number;
        line: number;
    };
    endBody: {
        col: number;
        line: number;
    };
}

/**
 * Given a location, extract the text from the full source
 */
function extractSource(
    {
        startBody: start,
        endBody: end
    }: Location,
    lines: string[]
): string | null {
    if (start.line === end.line && lines[start.line - 1] !== undefined) {
        return lines[start.line - 1].substring(start.col, end.col);
    }
    // NOTE: storysource locations are 1-based not 0-based!
    const startLine = lines[start.line - 1];
    const endLine = lines[end.line - 1];
    if (startLine === undefined || endLine === undefined) {
        return null;
    }
    return [
        startLine.substring(start.col),
        ...lines.slice(start.line, end.line - 1),
        endLine.substring(0, end.col)
    ].join("\n");
}

/**
 * Replaces full story id name like: story-kind--story-name -> story-name
 * @param id
 */
function storyIdToSanitizedStoryName(id: string): string {
    return id.replace(/^.*?--/, "");
}

interface StorySource {
    source: string;
    locationsMap: {
        [key: string]: Location
    }
}

function extract(targetId: string, { source, locationsMap }: StorySource) {
    if (!locationsMap) {
        return source;
    }

    const sanitizedStoryName = storyIdToSanitizedStoryName(targetId);
    const location = locationsMap[sanitizedStoryName];
    if (!location) {
        return source;
    }
    const lines = source.split("\n");

    return extractSource(location, lines);
}

export function getCodeSnippetFromStorySource(context: StoryContext): string | undefined {
    const {
        id,
        parameters: {
            storySource
        }
    } = context;

    // No input or user has manually overridden the output
    if (!storySource?.source) {
        return undefined;
    }

    return extract(id, storySource) || undefined;
}
