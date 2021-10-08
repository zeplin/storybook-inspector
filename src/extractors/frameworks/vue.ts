// Original file: https://github.com/storybookjs/storybook/blob/2e724f727b/addons/docs/src/frameworks/vue/sourceDecorator.ts
/* eslint-disable @typescript-eslint/no-explicit-any, no-underscore-dangle */

import prettier from "prettier/standalone";
import prettierHtml from "prettier/parser-html";
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
import Vue from "vue/dist/vue";
import { StoryContext } from "@storybook/addons";
import { getStory } from "../storyHelper";

function vnodeToString(vnode: any): string {
    const attrString = [
        ...(vnode.data?.slot ? ([["slot", vnode.data.slot]] as [string, any][]) : []),
        ["class", stringifyClassAttribute(vnode)],
        ...(vnode.componentOptions?.propsData ? Object.entries(vnode.componentOptions.propsData) : []),
        ...(vnode.data?.attrs ? Object.entries(vnode.data.attrs) : [])
    ]
        .filter(([name], index, list) => list.findIndex(item => item[0] === name) === index)
        .map(([name, value]) => stringifyAttr(name as string, value))
        .filter(Boolean)
        .join(" ");

    if (!vnode.componentOptions) {
        // Non-component elements (div, span, etc...)
        if (vnode.tag) {
            if (!vnode.children) {
                return `<${vnode.tag} ${attrString}/>`;
            }

            return `<${vnode.tag} ${attrString}>${vnode.children.map(vnodeToString).join("")}</${
                vnode.tag
            }>`;
        }

        // TextNode
        if (vnode.text) {
            if (/[<>"&]/.test(vnode.text)) {
                return `{{\`${vnode.text.replace(/`/g, "\\`")}\`}}`;
            }

            return vnode.text;
        }

        // Unknown
        return "";
    }

    // Probably users never see the "unknown-component". It seems that vnode.tag
    // Is always set.
    const tag = vnode.componentOptions.tag || vnode.tag || "unknown-component";

    if (!vnode.componentOptions.children) {
        return `<${tag} ${attrString}/>`;
    }

    return `<${tag} ${attrString}>${vnode.componentOptions.children
        .map(vnodeToString)
        .join("")}</${tag}>`;
}

function stringifyClassAttribute(vnode: Vue.VNode): string | undefined {
    if (!vnode.data || (!vnode.data.staticClass && !vnode.data.class)) {
        return undefined;
    }

    return (
        [...(vnode.data.staticClass?.split(" ") ?? []), ...normalizeClassBinding(vnode.data.class)]
            .filter(Boolean)
            .join(" ") || undefined
    );
}

// https://vuejs.org/v2/guide/class-and-style.html#Binding-HTML-Classes
function normalizeClassBinding(binding: unknown): readonly string[] {
    if (!binding) {
        return [];
    }

    if (typeof binding === "string") {
        return [binding];
    }

    if (binding instanceof Array) {
        // To handle an object-in-array binding smartly, we use recursion
        return binding.map(normalizeClassBinding).reduce((a, b) => [...a, ...b], []);
    }

    if (typeof binding === "object") {
        return Object.entries(binding || {})
            .filter(([, active]) => !!active)
            .map(([className]) => className);
    }

    // Unknown class binding
    return [];
}

function stringifyAttr(attrName: string, value?: any): string | null {
    if (typeof value === "undefined" || typeof value === "function") {
        return null;
    }

    if (value === true) {
        return attrName;
    }

    if (typeof value === "string") {
        return `${attrName}=${quote(value)}`;
    }

    // TODO: Better serialization (unquoted object key, Symbol/Classes, etc...)
    //       Seems like Prettier don't format JSON-look object (= when keys are quoted)
    return `:${attrName}=${quote(JSON.stringify(value))}`;
}

function quote(value: string) {
    return value.includes(`"`) && !value.includes(`'`)
        ? `'${value}'`
        : `"${value.replace(/"/g, "&quot;")}"`;
}

/**
 * Skip decorators and grab a story component itself.
 * https://github.com/pocka/storybook-addon-vue-info/pull/113
 */
function getStoryComponent(w: any) {
    let matched = w;

    while (matched?.options?.components?.story?.options?.STORYBOOK_WRAPS) {
        matched = matched.options.components.story.options.STORYBOOK_WRAPS;
    }
    return matched;
}

/**
 * Find the story's instance from VNode tree.
 */
function lookupStoryInstance(instance: Vue, storyComponent: any): any {
    if (instance.$vnode?.componentOptions?.Ctor === storyComponent) {
        return instance;
    }

    for (let i = 0, l = instance.$children.length; i < l; i += 1) {
        const found = lookupStoryInstance(instance.$children[i], storyComponent);

        if (found) {
            return found;
        }
    }

    return null;
}

export function getVueCodeSnippet(context: StoryContext): string | undefined {
    const story = getStory(context) as any;

    const storyComponent = getStoryComponent(story.options.STORYBOOK_WRAPS);

    const vm = new Vue({
        data() {
            return {
                STORYBOOK_VALUES: context.args
            };
        },
        render(h: any) {
            return h(story);
        }
    }).$mount();

    const storyNode = lookupStoryInstance(vm, storyComponent);

    if (!storyNode) {
        return;
    }

    const code = vnodeToString(storyNode._vnode);

    return prettier.format(`<template>${code}</template>`, {
        parser: "vue",
        plugins: [prettierHtml],
        // Because the parsed vnode missing spaces right before/after the surround tag,
        // We always get weird wrapped code without this option.
        htmlWhitespaceSensitivity: "ignore"
    });
}

export function getVueCodeLanguage(): string {
    return "html";
}

export function getVueFilePath(context: StoryContext): string | undefined {
    return context?.parameters?.component?.__file;
}

export function getVueComponentName(context: StoryContext): string | undefined {
    return context?.parameters?.component?.__docgenInfo?.displayName ||
        context?.parameters?.component?.name;
}
