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
    ExpressionAttributeNames: Record<string, string>
) {
    const [name, ...rest] = val.split("[");
    // const name = val.split('[')[0]
    const fixedName = name.split("/")[0] + randomId(5);
    ExpressionAttributeNames["#" + fixedName] = name;
    return "#" + [fixedName, ...rest].join("["); // val -> name
}

export function handleProjectionExpression(
    ExpressionAttributeNames: Record<string, string>,
    ProjectionExpression: string
) {
    return ProjectionExpression.split(",")
        .map((y) => toKeyAndExpName(y.trim(), ExpressionAttributeNames))
        .join(",");
}
// I like this function:)

export function handlePath(
    path: string,
    ExpressionAttributeNames: Record<string, any>
) {
    return path
        .split(".")
        .map((y) => toKeyAndExpName(y, ExpressionAttributeNames))
        .join(".");
}
