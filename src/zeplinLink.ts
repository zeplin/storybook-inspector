import queryString from "query-string";

const webScreenRegex = /\/project\/([\da-f]{24})\/screen\/([\da-f]{24})?/i;
// eslint-disable-next-line max-len
const webComponentRegex = /(?:\/project\/([\da-f]{24}))?\/styleguide(?:\/([\da-f]{24}))?\/components\?coid=([\da-f]{24})?/i;

enum RESOURCE_TYPES {
    PROJECT_COMPONENT = "project-component",
    STYLEGUIDE_COMPONENT = "styleguide-component",
    SCREEN = "screen",
    INVALID = "invalid",
}

enum LINK_TYPES {
    WEB = "web",
    APP = "app",
}

interface LinkProperties {
    type: string;
    pid?: string;
    stid?: string;
    sid?: string;
    coid?: string;
}

interface LinkBases {
    app: string;
    web: string;
}

function getLinkType(url: string, linkBases: LinkBases): LINK_TYPES | null {
    if (url.startsWith(linkBases.app)) {
        return LINK_TYPES.APP;
    } else if (url.startsWith(linkBases.web)) {
        return LINK_TYPES.WEB;
    }

    return null;
}

function getComponentProperties({
    pid,
    stid,
    coid
}: {
    pid?: string;
    stid?: string;
    coid?: string;
}): LinkProperties {
    if (!coid || (pid && stid)) {
        return {
            type: RESOURCE_TYPES.INVALID
        };
    }

    if (pid) {
        return {
            type: RESOURCE_TYPES.PROJECT_COMPONENT,
            pid,
            coid
        };
    }

    if (stid) {
        return {
            type: RESOURCE_TYPES.STYLEGUIDE_COMPONENT,
            stid,
            coid
        };
    }

    return {
        type: RESOURCE_TYPES.INVALID
    };
}

function getWebLinkProperties(link: string): LinkProperties {
    const screenMatch = link.match(webScreenRegex) || [];
    const [, pidOfScreen, sid] = screenMatch;

    if (pidOfScreen && sid) {
        return {
            type: RESOURCE_TYPES.SCREEN,
            pid: pidOfScreen,
            sid
        };
    }

    const componentMatch = link.match(webComponentRegex) || [];

    const [, pid, stid, coid] = componentMatch;

    return getComponentProperties({ pid, stid, coid });
}

function getAppUriProperties(uri: string, linkBases: LinkBases): LinkProperties {
    const [, searchParams] = uri.split("?");

    if (!searchParams) {
        return { type: RESOURCE_TYPES.INVALID };
    }

    const componentUri = `${linkBases.app}//components`;
    const screenUri = `${linkBases.app}//screen`;

    if (uri.startsWith(componentUri)) {
        const parsedSearchParams = queryString.parse(searchParams);

        const pid = parsedSearchParams.pid?.toString();
        const stid = parsedSearchParams.stid?.toString();
        const coid = (
            parsedSearchParams.coid?.toString() ||
            parsedSearchParams.coids?.toString()
        );

        return getComponentProperties({ pid, stid, coid });
    } else if (uri.startsWith(screenUri)) {
        const parsedSearchParams = queryString.parse(searchParams);

        const pid = parsedSearchParams.pid?.toString();
        const sid = parsedSearchParams.sid?.toString();

        if (pid && sid) {
            return {
                type: RESOURCE_TYPES.SCREEN,
                pid,
                sid
            };
        }
    }

    return { type: RESOURCE_TYPES.INVALID };
}

export {
    LinkProperties,
    LinkBases,
    RESOURCE_TYPES,
    LINK_TYPES
};

export function getZeplinLinkProperties(link: string, linkBases: LinkBases): LinkProperties {
    const linkType = getLinkType(link, linkBases);

    if (linkType === LINK_TYPES.WEB) {
        return getWebLinkProperties(link);
    } else if (linkType === LINK_TYPES.APP) {
        return getAppUriProperties(link, linkBases);
    }

    return { type: RESOURCE_TYPES.INVALID };
}
