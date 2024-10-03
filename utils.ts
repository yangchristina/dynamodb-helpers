import type { UpdateExpressionOptions } from "./types.js";

export const isEmpty = (obj: any) => {
    if (obj === null || obj === undefined) return true;
    if (Array.isArray(obj) && obj.length === 0) return true;
    if (typeof obj === "object" && Object.keys(obj).length === 0) return true;
    return false;
};
export function randomId(length = 8) {
    let result = "";
    const characters = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
    const charactersLength = characters.length;
    let counter = 0;
    while (counter < length) {
        result += characters.charAt(
            Math.floor(Math.random() * charactersLength)
        );
        counter += 1;
    }
    return result;
}

export function toKeyAndExpName(
    val: string,
    ExpressionAttributeNames: Record<string, string>,
    options?: UpdateExpressionOptions
) {
    const id = options?.generateRandomId ? options.generateRandomId() : randomId(5);
    const [name, ...rest] = val.split("[");
    // const name = val.split('[')[0]
    const fixedName = name.split("/")[0].replace(/[-#]/, '') + id;
    ExpressionAttributeNames["#" + fixedName] = name;
    return "#" + [fixedName, ...rest].join("["); // val -> name
}

export function handleProjectionExpression(
    ExpressionAttributeNames: Record<string, string>,
    ProjectionExpression: string,
    options?: UpdateExpressionOptions
) {
    return ProjectionExpression.split(",")
        .map((y) => toKeyAndExpName(y.trim(), ExpressionAttributeNames, options))
        .join(",");
}
// I like this function:)

export function handlePath(
    path: string,
    ExpressionAttributeNames: Record<string, any>,
    options?: UpdateExpressionOptions
) {
    return path
        .split(".")
        .map((y) => toKeyAndExpName(y, ExpressionAttributeNames, options))
        .join(".");
}

export const attributeNameToPath = (attributeName: string) => {
    const arr: (string | number)[] = [];
    const components = attributeName.split(".");
    for (let c of components) {
        const regex = /\[\d+\]/g;
        const split = c.split(regex);
        const matches = c.match(regex)?.map((x) => parseInt(x.slice(1, -1)));
        for (let i = 0; i < split.length; i++) {
            arr.push(split[i]);
            if (matches && i < matches.length) {
                arr.push(matches[i]);
            }
        }
    }
    return arr;
};