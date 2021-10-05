// Original file: https://github.com/storybookjs/storybook/blob/b1577905cb/addons/docs/src/frameworks/angular/sourceDecorator.ts
/* eslint-disable @typescript-eslint/no-explicit-any */

import prettierHtml from "prettier/parser-html";
import prettier from "prettier/standalone";
import { StoryContext } from "@storybook/addons";

import { getStory } from "../storyHelper";
import { GlobalContext } from "../../globalContext";

function getComponentDecoratorMetadata(component: any) {
    const decoratorKey = "__annotations__";
    const decorators: any[] =
        Reflect &&
        Reflect.getOwnPropertyDescriptor &&
        (Reflect?.getOwnPropertyDescriptor?.(component, decoratorKey)?.value ?? component[decoratorKey]);

    if (!decorators) {
        return component.decorators?.[0]?.args?.[0];
    }

    return decorators.find(({ ngMetadataName }) => ngMetadataName === "Component");
}
function getComponentPropsDecoratorMetadata(component: any) {
    const decoratorKey = "__prop__metadata__";
    let propsDecorators: Record<string, any[]> =
        Reflect &&
        Reflect.getOwnPropertyDescriptor &&
        (Reflect?.getOwnPropertyDescriptor?.(component, decoratorKey)?.value ?? component[decoratorKey]);

    const parent = Reflect && Reflect.getPrototypeOf && Reflect.getPrototypeOf(component);

    if (parent) {
        const parentPropsDecorators = getComponentPropsDecoratorMetadata(parent);
        propsDecorators = { ...parentPropsDecorators, ...propsDecorators };
    }

    return propsDecorators;
}
type ComponentInputsOutputs = {
    inputs: {
        propName: string;
        templateName: string;
    }[];
    outputs: {
        propName: string;
        templateName: string;
    }[];
};

function getComponentInputsOutputs(component: any): ComponentInputsOutputs {
    const componentMetadata = getComponentDecoratorMetadata(component);
    const componentPropsMetadata = getComponentPropsDecoratorMetadata(component);

    const initialValue: ComponentInputsOutputs = {
        inputs: [],
        outputs: []
    };

    // Adds the I/O present in @Component metadata
    if (componentMetadata && componentMetadata.inputs) {
        initialValue.inputs.push(
            ...componentMetadata.inputs.map((i: string) => ({ propName: i, templateName: i }))
        );
    }
    if (componentMetadata && componentMetadata.outputs) {
        initialValue.outputs.push(
            ...componentMetadata.outputs.map((i: string) => ({ propName: i, templateName: i }))
        );
    }

    if (!componentPropsMetadata) {
        return initialValue;
    }

    // Browses component properties to extract I/O
    // Filters properties that have the same name as the one present in the @Component property
    return Object.entries(componentPropsMetadata).reduce<ComponentInputsOutputs>(
        (previousValue, [propertyName, [value]]) => {
            if (value.ngMetadataName === "Input") {
                const inputToAdd = {
                    propName: propertyName,
                    templateName: value.bindingPropertyName ?? propertyName
                };

                const previousInputsFiltered = previousValue.inputs.filter(
                    i => i.templateName !== propertyName
                );
                return {
                    ...previousValue,
                    inputs: [...previousInputsFiltered, inputToAdd]
                };
            }
            if (value.ngMetadataName === "Output") {
                const outputToAdd = {
                    propName: propertyName,
                    templateName: value.bindingPropertyName ?? propertyName
                };

                const previousOutputsFiltered = previousValue.outputs.filter(
                    i => i.templateName !== propertyName
                );
                return {
                    ...previousValue,
                    outputs: [...previousOutputsFiltered, outputToAdd]
                };
            }
            return previousValue;
        },
        initialValue
    );
}

function separateInputsOutputsAttributes(
    ngComponentInputsOutputs: ComponentInputsOutputs,
    props = {}
) {
    const inputs = ngComponentInputsOutputs.inputs
        .filter(i => i.templateName in props)
        .map(i => i.templateName);
    const outputs = ngComponentInputsOutputs.outputs
        .filter(o => o.templateName in props)
        .map(o => o.templateName);

    return {
        inputs,
        outputs,
        otherProps: Object.keys(props).filter(k => ![...inputs, ...outputs].includes(k))
    };
}

function createAngularInputProperty({
    propertyName,
    value,
    argType
}: {
    propertyName: string;
    value: any;
    argType?: any;
}) {
    const { name: type = null, summary = null } = argType?.type || {};
    let templateValue = type === "enum" && !!summary ? `${summary}.${value}` : value;

    const actualType = type === "enum" && summary ? "enum" : typeof value;
    const requiresBrackets = ["object", "any", "boolean", "enum", "number"].includes(actualType);

    if (typeof value === "object") {
        templateValue = propertyName;
    }

    return `${requiresBrackets ? "[" : ""}${propertyName}${
        requiresBrackets ? "]" : ""
    }="${templateValue}"`;
}

function buildTemplate(
    selector: string,
    innerTemplate: string,
    inputs: string,
    outputs: string
) {
    const templateReplacers: [
        string | RegExp,
        string | ((substring: string, ...args: any[]) => string)
    ][] = [
        [/(^\..+)/, "div$1"],
        [/(^\[.+?])/, "div$1"],
        [/([\w[\]]+)(\s*,[\w\s-[\],]+)+/, `$1`],
        [/#([\w-]+)/, ` id="$1"`],
        [/((\.[\w-]+)+)/, (_, c) => ` class="${c.split`.`.join` `.trim()}"`],
        [/(\[.+?])/g, (_, a) => ` ${a.slice(1, -1)}`],
        [/([\S]+)(.*)/, `<$1$2${inputs}${outputs}>${innerTemplate}</$1>`]
    ];

    return templateReplacers.reduce(
        (prevSelector, [searchValue, replacer]) => prevSelector.replace(searchValue, replacer as any),
        selector
    );
}

function computesTemplateSourceFromComponent(component: any, initialProps: any, argTypes: any) {
    const ngComponentMetadata = getComponentDecoratorMetadata(component);
    if (!ngComponentMetadata) {
        return null;
    }

    if (!ngComponentMetadata.selector) {
        // Allow to add renderer component when NgComponent selector is undefined
        return `<ng-container *ngComponentOutlet="${component.name}"></ng-container>`;
    }

    const ngComponentInputsOutputs = getComponentInputsOutputs(component);
    const { inputs: initialInputs, outputs: initialOutputs } = separateInputsOutputsAttributes(
        ngComponentInputsOutputs,
        initialProps
    );

    const templateInputs =
        initialInputs.length > 0
            ? ` ${initialInputs
                .map(propertyName =>
                    createAngularInputProperty({
                        propertyName,
                        value: initialProps[propertyName],
                        argType: argTypes?.[propertyName]
                    })
                )
                .join(" ")}`
            : "";
    const templateOutputs =
        initialOutputs.length > 0
            ? ` ${initialOutputs.map(i => `(${i})="${i}($event)"`).join(" ")}`
            : "";

    return buildTemplate(ngComponentMetadata.selector, "", templateInputs, templateOutputs);
}

function prettyUp(source: string) {
    return prettier.format(source, {
        parser: "angular",
        plugins: [prettierHtml],
        htmlWhitespaceSensitivity: "ignore"
    });
}

export function getAngularCodeSnippet(context: StoryContext): string | undefined {
    const {
        props,
        template,
        userDefinedTemplate
    } = getStory(context, { useOriginal: true }) as any;

    const {
        parameters: {
            component,
            argTypes
        }
    } = context;

    if (component && !userDefinedTemplate) {
        const source = computesTemplateSourceFromComponent(component, props, argTypes);
        if (source) {
            return prettyUp(source);
        }
    }
    if (template) {
        return prettyUp(template);
    }
}

export function getAngularCodeLanguage(): string {
    return "ts";
}

export function getAngularFilePath(context: StoryContext, globalContext: GlobalContext): string | undefined {
    const { angular: componentsFromGlobal } = globalContext;
    const componentName = context.parameters.component?.name;

    const matchingComponentFromGlobal = Object.values(componentsFromGlobal || {}).find(c => c.name === componentName);

    return matchingComponentFromGlobal?.file;
}

export function getAngularComponentName(context: StoryContext): string {
    return context.parameters.component?.name;
}
