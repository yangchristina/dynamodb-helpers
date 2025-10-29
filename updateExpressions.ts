import { randomId, handlePath, isEmpty } from "./utils.js";
import { UpdateItemParams } from "./types.js";

type Options = { generateRandomId?: () => string }

export const ADD_ON = "AO1";
export const updateSetExpressions = (
    updates: Pick<UpdateItemParams, "set" | "listAppend" | "setIfNotExists" | "increment" | "decrement">,
    ExpressionAttributeValues: Record<string, any>,
    ExpressionAttributeNames: Record<string, any>,
    options?: Options
): string => {
    const { set, listAppend, setIfNotExists, increment, decrement } = updates;

    const generateRandomId = options?.generateRandomId || randomId;

    const str = set
        ? Object.keys(set).map((key, i) => {
              const { name, id } = handleSet(key, i, set);
              return `${name} = :${id + i}${ADD_ON}valset`;
          })
        : [];

    const ifNotExists = setIfNotExists
        ? Object.keys(setIfNotExists).map((key, i) => {
              const { name, id } = handleSet(key, i, setIfNotExists);
              return `${name} = if_not_exists(${name}, :${
                  id + i
              }${ADD_ON}valset)`;
          })
        : [];

    const list = listAppend
        ? Object.keys(listAppend).map((path) => {
              const id = generateRandomId();
              const name = handlePath(path, ExpressionAttributeNames, { generateRandomId });
              const valKey = `:arr${id}`;
              ExpressionAttributeValues[valKey] = listAppend[path];
              ExpressionAttributeValues[":empty_list"] = [];
              return `${name} = list_append(if_not_exists(${name}, :empty_list), ${valKey})`;
          })
        : [];

    const incrementExpressions = increment
        ? Object.keys(increment).map((path) => {
              const id = generateRandomId();
              const name = handlePath(path, ExpressionAttributeNames, { generateRandomId });
              const valKey = `:inc${path}${id}`;
              ExpressionAttributeValues[valKey] = increment[path];
              return `${name} = ${name} + ${valKey}`;
          })
        : [];

    const decrementExpressions = decrement
        ? Object.keys(decrement).map((path) => {
              const id = generateRandomId();
              const name = handlePath(path, ExpressionAttributeNames, { generateRandomId });
              const valKey = `:dec${path}${id}`;
              ExpressionAttributeValues[valKey] = decrement[path];
              return `${name} = ${name} - ${valKey}`;
          })
        : [];

    return "set " + [...str, ...list, ...ifNotExists, ...incrementExpressions, ...decrementExpressions].join(", ");

    function handleSet(key: string, i: number, set: Record<string, any>) {
        const id = generateRandomId();
        const name = handlePath(key, ExpressionAttributeNames, { generateRandomId });
        ExpressionAttributeValues[`:${id + i}${ADD_ON}valset`] = set[key];
        return { name, id };
    }
};

const isEmptySetOrArray = (value: any): boolean => {
    if (value instanceof Set) return value.size === 0;
    if (Array.isArray(value)) return value.length === 0;
    return false;
};

export const updateRemoveExpressions = (
    attributes: string[],
    ExpressionAttributeNames: Record<string, any>,
    options?: Options
) => {
    if (
        !Array.isArray(attributes) ||
        attributes.length === 0 ||
        !attributes.every((x) => typeof x === "string")
    )
        return undefined;
    const UpdateExpression =
        "remove " +
        attributes
            .map((x) => {
                return handlePath(x, ExpressionAttributeNames, options);
            })
            .join(", ");

    return UpdateExpression;
};

export const updateAddDeleteExpressions = (
    op: "add" | "delete",
    pathValuesDict: Record<
        string,
        number | Set<string> | Array<string> | Set<number> | Array<number>
    >,
    ExpressionAttributeValues: Record<string, any>,
    ExpressionAttributeNames: Record<string, any>,
    options?: Options
) => {
    if (isEmpty(pathValuesDict) || (op !== "add" && op !== "delete")) return;
    const filteredPaths = Object.keys(pathValuesDict).filter(
        (path) => !isEmptySetOrArray(pathValuesDict[path])
    );
    if (filteredPaths.length === 0) return;
    const exp = filteredPaths
        .map((path) => {
            const id = options?.generateRandomId?.() ?? randomId();
            const valKey = ":p" + id;
            const value = pathValuesDict[path];
            ExpressionAttributeValues[valKey] =
                typeof value === "number" ? value : new Set([...value]);
            return `${handlePath(path, ExpressionAttributeNames, options)} ${valKey}`;
        })
        .join(", ");
    const UpdateExpression = `${op} ${exp}`;
    return UpdateExpression;
};

// export const updateRemove = async (
//     TableName: string,
//     Key: Record<string, string>,
//     attributes: string[]
// ) => {
//     if (isEmpty(attributes)) return;
//     const ExpressionAttributeNames: Record<string, string> = {};
//     const UpdateExpression = "set updatedAt = :updatedAt remove " +
//         attributes
//             .map((x) => {
//                 return x
//                     .split(".")
//                     .map((y) => toKeyAndExpName(y, ExpressionAttributeNames))
//                     .join(".");
//             })
//             .join(", ");

//     const params: any = {
//         TableName,
//         Key,
//         UpdateExpression,
//         ExpressionAttributeNames,
//         ExpressionAttributeValues: {
//             ":updatedAt": Date.now(),
//         },
//     };
//     await update(params);
// };

// export const updateSet = async (
//     TableName: string,
//     Key: Record<string, string>,
//     updates: { [x: string | number | symbol]: any; }
// ) => {
//     if (isEmpty(updates)) return;

//     const ExpressionAttributeValues: Record<string, any> = {};
//     const ExpressionAttributeNames: Record<string, any> = {};
//     const UpdateExpression = updateSetExpressions(
//         updates,
//         ExpressionAttributeValues,
//         ExpressionAttributeNames
//     );

//     const params: any = {
//         TableName,
//         Key,
//         UpdateExpression,
//         ExpressionAttributeValues,
//         ...(!isEmpty(ExpressionAttributeNames) && { ExpressionAttributeNames }),
//     };

//     await update(params);
// };

// export const updateListAppend = async (
//     TableName: string,
//     Key: Record<string, string>,
//     propertyName: string,
//     items: any[]
// ) => {
//     const ename = "#" + propertyName;
//     const UpdateExpression = `set updatedAt = :updatedAt, ${ename} = list_append(if_not_exists(${ename}, :empty_list), :new_arr_item)`; //if_not_exists(subtasks, :empty_list)

//     const params: any = {
//         TableName,
//         Key,
//         UpdateExpression,
//         ExpressionAttributeValues: {
//             ":updatedAt": Date.now(),
//             ":empty_list": [],
//             ":new_arr_item": items,
//         },
//         ExpressionAttributeNames: {
//             [ename]: propertyName,
//         },
//     };
//     await update(params);
// };
