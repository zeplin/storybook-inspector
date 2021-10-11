// Original file: https://github.com/storybookjs/storybook/blob/618fc1c34b/addons/docs/src/frameworks/react/jsxDecorator.tsx
/* eslint-disable @typescript-eslint/no-explicit-any, no-underscore-dangle */

import React from "react";
import reactElementToJSXString from "react-element-to-jsx-string";
import { StoryContext } from "@storybook/addons";
import { getStory } from "../storyHelper";
import { GlobalContext } from "../../globalContext";

function isMemo(component: any) {
    return component.$$typeof === Symbol.for("react.memo");
}
function isForwardRef(component: any) {
    return component.$$typeof === Symbol.for("react.forward_ref");
}

const TS_EXTENSIONS = [".ts", ".tsx"];

export function getReactCodeSnippet(context: StoryContext): string | undefined {
    const jsx = getStory(context, { useOriginal: true }) as any;

    const { parameters } = context;

    const options = {
        enableBeautify: true,
        showDefaultProps: false,
        ...parameters.jsx,
        displayName: (
            parameters.jsx?.displayName instanceof Function
                ? parameters.jsx.displayName
                : (el: any): string => (
                    parameters.jsx?.displayName ||
                    el.type.displayName ||
                    el.type.__docgenInfo?.displayName ||
                    (el.type.name !== "_default" ? el.type.name : null) ||
                    (typeof el.type === "function" ? "No Display Name" : null) ||
                    (isForwardRef(el.type) ? el.type.render.name : null) ||
                    (isMemo(el.type) ? el.type.type.name : null) ||
                    el.type
                )
        ),
        filterProps: (value: any): boolean => value !== undefined
    };

    return React.Children.map(jsx, c => {
        const child = typeof c === "number" ? c.toString() : c;
        let string = reactElementToJSXString(child, options);

        if (string.indexOf("&quot;") > -1) {
            const matches = string.match(/\S+=\\"([^"]*)\\"/g);
            if (matches) {
                matches.forEach(match => {
                    string = string.replace(match, match.replace(/&quot;/g, "'"));
                });
            }
        }

        return string;
    }).join("\n").replace(/function\s+noRefCheck\(\)\s+\{\}/, "() => {}");
}

export function getReactFilePath(context: StoryContext, globalContext: GlobalContext): string | undefined {
    const { react: docgensFromGlobal } = globalContext;
    const { parameters: { component } } = context;

    const docgenFromLocal = component?.__docgenInfo;

    const matchingDocgenFromGlobal = Object.values(docgensFromGlobal || {}).find(dfg =>
        dfg.docgenInfo &&
        dfg.docgenInfo.displayName === docgenFromLocal?.displayName &&
        dfg.docgenInfo.props?.length === docgenFromLocal?.props?.length &&
        JSON.stringify(dfg.docgenInfo.props) === JSON.stringify(docgenFromLocal?.props)
    );

    return matchingDocgenFromGlobal?.path.replace(/#.*$/, "");
}

export function getReactComponentName(context: StoryContext): string | undefined {
    return context.parameters.component?.__docgenInfo?.displayName;
}

export function getReactCodeLanguage(context: StoryContext, globalContext: GlobalContext): string {
    const filePath = getReactFilePath(context, globalContext);

    return filePath && TS_EXTENSIONS.some(tsExt => filePath.endsWith(tsExt)) ? "tsx" : "jsx";
}
