import { QueryCommandInput } from "@aws-sdk/lib-dynamodb";

export interface QueryOptions
    extends Omit<QueryCommandInput, "TableName" | "KeyConditionExpression"> {
    ProjectionExpression?: string;
    IndexName?: string;
    Limit?: number;
}

export interface UpdateItemParams<T extends {} = Record<string, any>> {
    // only set needs validation i think
    set?: Partial<T>; // edit or change an existing item
    remove?: string[]; // remove from a list, remove attributes
    add?: Record<
        string,
        number | Set<string> | Array<string> | Set<number> | Array<number>
    >; // add to a set (legacy - consider using increment/decrement for numbers)
    delete?: Record<
        string,
        Set<string> | Array<string> | Set<number> | Array<number>
    >; // delete from a set
    listAppend?: Record<string, Array<any>>; // append to a list
    setIfNotExists?: Partial<T>; // set if it doesn't exist
    increment?: Record<string, number>; // increment numeric values using SET expressions
    decrement?: Record<string, number>; // decrement numeric values using SET expressions
    allowCreatingNewItem?: boolean; // allow creating new item if it doesn't exist
}

export interface UpdateItemOptions {
    ReturnValues?:
        | "NONE"
        | "ALL_OLD"
        | "UPDATED_OLD"
        | "ALL_NEW"
        | "UPDATED_NEW";
    primaryKey?: string;
    debug?: boolean;
    throwConditionalFail?: boolean;
}

export interface UpdateExpressionOptions {
    generateRandomId?: () => string;
}
