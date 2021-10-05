// Original file: https://github.com/storybookjs/storybook/blob/bea2e5c38e/addons/docs/src/frameworks/svelte/sourceDecorator.ts
/* eslint-disable @typescript-eslint/no-explicit-any */

import { StoryContext } from "@storybook/addons";
import { getStory } from "../storyHelper";

/**
 * Transform a key/value to a svelte declaration as string.
 *
 * Default values are ommited
 *
 * @param key Key
 * @param value Value
 * @param argTypes Component ArgTypes
 */
function toSvelteProperty(key: string, value: any, argTypes: any): string | null {
    if (value === undefined || value === null) {
        return null;
    }

    // Default value ?
    if (argTypes[key] && argTypes[key].defaultValue === value) {
        return null;
    }

    if (value === true) {
        return key;
    }

    if (typeof value === "string") {
        return `${key}=${JSON.stringify(value)}`;
    }

    return `${key}={${JSON.stringify(value)}}`;
}

/**
 * Extract a component name.
 *
 * @param component Component
 */
function getComponentName(component: any): string | null {
    if (component === null) {
        return null;
    }

    const { __docgen = {} } = component;
    const { name } = __docgen;

    if (!name) {
        return component.name;
    }

    return name.replace(/\.svelte$/, "");
}

/**
 * Generate a svelte template.
 *
 * @param component Component
 * @param args Args
 * @param argTypes ArgTypes
 * @param slotProperty Property used to simulate a slot
 */
function generateSvelteSource(
    component: any,
    args: any = {},
    argTypes = {},
    slotProperty: string | undefined
): string | null {
    const name = getComponentName(component);

    if (!name) {
        return null;
    }

    const props = Object.entries(args)
        .filter(([k]) => k !== slotProperty)
        .map(([k, v]) => toSvelteProperty(k, v, argTypes))
        .filter(p => p)
        .join(" ");

    const slotValue = slotProperty ? args[slotProperty] : null;

    if (slotValue) {
        return `<${name} ${props}>\n    ${slotValue}\n</${name}>`;
    }

    return `<${name} ${props}/>`;
}

/**
 * Check if the story component is a wrapper to the real component.
 *
 * A component can be annoted with @wrapper to indicate that
 * it's just a wrapper for the real tested component. If it's the case
 * then the code generated references the real component, not the wrapper.
 *
 * moreover, a wrapper can annotate a property with @slot : this property
 * is then assumed to be an alias to the default slot.
 *
 * @param component Component
 */
function getWrapperProperties(component: any) {
    const { __docgen } = component;
    if (!__docgen) {
        return { wrapper: false };
    }

    // The component should be declared as a wrapper
    if (!__docgen.keywords.find((kw: any) => kw.name === "wrapper")) {
        return { wrapper: false };
    }

    const slotProp = __docgen.data.find((prop: any) =>
        prop.keywords.find((kw: any) => kw.name === "slot")
    );
    return { wrapper: true, slotProperty: slotProp?.name as string };
}

export function getSvelteCodeSnippet(context: StoryContext): string | undefined {
    const { Component: component = {}, props } = getStory(
        context,
        { useOriginal: true }
    ) as any;
    const { parameters, args, argTypes } = context;

    const { wrapper, slotProperty } = getWrapperProperties(component);
    const sourceComponent = wrapper && parameters.component ? parameters.component : component;

    const enhancedArgs = {
        ...props,
        ...args
    };

    return generateSvelteSource(sourceComponent, enhancedArgs, argTypes, slotProperty) || undefined;
}

export function getSvelteCodeLanguage(): string {
    return "html";
}

export function getSvelteComponentName(context: StoryContext): string | undefined {
    return context.parameters.component?.name;
}
