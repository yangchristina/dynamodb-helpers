
export interface QueryOptions {
    ProjectionExpression?: string;
    IndexName?: string;
    Limit?: number;
}

export interface UpdateItemParams {
    // only set needs validation i think
    set?: Record<string, any>; // edit or change an existing item
    remove?: string[]; // remove from a list, remove attributes
    add?: Record<
        string, number | Set<string> | Array<string> | Set<number> | Array<number>
    >; // add to a set
    delete?: Record<string, Set<string> | Array<string>>; // delete from a set
    listAppend?: Record<string, Array<any>>; // append to a list
    setIfNotExists?: Record<string, any>; // set if it doesn't exist
}

export interface UpdateItemOptions {
    ReturnValues?: "NONE" |
    "ALL_OLD" |
    "UPDATED_OLD" |
    "ALL_NEW" |
    "UPDATED_NEW";
    primaryKey?: string;
    debug?: boolean;
    throwConditionalFail?: boolean;
}

export interface UpdateExpressionOptions {
    generateRandomId?: () => string;
}