import {
    DynamoDBClient,
    DynamoDBClientConfig,
    UpdateItemCommand,
} from "@aws-sdk/client-dynamodb";
import {
    DynamoDBDocumentClient,
    GetCommand,
    GetCommandInput,
    PutCommand,
    PutCommandInput,
    QueryCommand,
    QueryCommandInput,
    UpdateCommand,
    UpdateCommandInput,
    DeleteCommand,
    DeleteCommandInput,
    BatchWriteCommandInput,
    BatchWriteCommand,
    BatchGetCommandInput,
    BatchGetCommand,
    TransactWriteCommand,
    TransactWriteCommandInput,
    ScanCommandInput,
    ScanCommand,
    TranslateConfig,
} from "@aws-sdk/lib-dynamodb"; // ES6 import
import type { QueryOptions, UpdateItemOptions, UpdateItemParams } from "./types";
import { isEmpty } from "./utils";
import {
    updateAddDeleteExpressions,
    updateRemoveExpressions,
    updateSetExpressions,
} from "./updateExpressions";

export const DB_RESERVED_WORDS = new Set([
    "name",
    "date",
    "count",
    "counter",
    // 'duration'
]);

const createDynamoDBHelpers = (dbConfig: DynamoDBClientConfig, translateConfig?: TranslateConfig) => {
    const client = new DynamoDBClient(dbConfig);
    const ddbDocClient = DynamoDBDocumentClient.from(client, translateConfig); // client is DynamoDB client

    const update = async (params: UpdateCommandInput) =>
        await ddbDocClient.send(new UpdateCommand(params));
    const batchWriteNative = async (params: BatchWriteCommandInput) =>
        await ddbDocClient.send(new BatchWriteCommand(params));

    const dynamodb = {
        client: ddbDocClient,
        get: async (params: GetCommandInput) =>
            await ddbDocClient.send(new GetCommand(params)),
        getAWSFormat: async (params: GetCommandInput) =>
            await client.send(new GetCommand(params)),
        put: async (params: PutCommandInput) =>
            await ddbDocClient.send(new PutCommand(params)),
        query: async (params: QueryCommandInput) =>
            await ddbDocClient.send(new QueryCommand(params)),
        update,
        delete: async (params: DeleteCommandInput) =>
            await ddbDocClient.send(new DeleteCommand(params)),
        batchWrite: batchWriteNative,
        batchGet: async (params: BatchGetCommandInput) =>
            await ddbDocClient.send(new BatchGetCommand(params)),
        transactWrite: async (params: TransactWriteCommandInput) =>
            await ddbDocClient.send(new TransactWriteCommand(params)),
        ogUpdate: async (params: any) =>
            await ddbDocClient.send(new UpdateItemCommand(params)),
        scan: async (params: ScanCommandInput) =>
            await ddbDocClient.send(new ScanCommand(params)),
    };
    const getItem = async (
        Key: Record<string, string>,
        TableName = process.env.TABLE_NAME
    ) => {
        try {
            const res = await dynamodb.get({
                TableName,
                Key,
            });
            return res.Item;
        } catch (error) {
            if (!(error instanceof Error)) throw new Error(String(error));
            console.log("get item");
            console.error(error.message);
            throw error;
            // return undefined
        }
    };

    const putItem = async (
        Item: Record<string, any>,
        TableName = process.env.TABLE_NAME,
        options?: Omit<PutCommandInput, "Item" | "TableName">
    ) => {
        try {
            return await dynamodb.put({
                TableName,
                Item,
                ...options,
            });
        } catch (error) {
            console.log("put item", Item);
            console.error(error);
            throw error;
        }
    };

    const queryByPkOnly = async (
        pk: { name: string; value: string | number },
        TableName: string,
        options?: QueryOptions
    ) => {
        try {
            let KeyConditionExpression = "#userId = :userId";

            const res = await dynamodb.query({
                TableName,
                KeyConditionExpression,
                ExpressionAttributeNames: {
                    "#userId": pk.name,
                },
                ExpressionAttributeValues: {
                    ":userId": pk.value,
                },
                ...options,
            });

            return res.Items;
        } catch (error) {
            if (!(error instanceof Error)) throw new Error(String(error));
            console.log("queryByPkOnly error");
            console.error(error.message);
            throw error;
            // return undefined
        }
    };

    const queryStartsWith = async (
        pk: { name: string; value: string | number },
        sk: { name: string; startsWith?: string; equals?: string } | undefined,
        TableName: string,
        options?: QueryOptions
    ) => {
        if (!sk) return queryByPkOnly(pk, TableName, options);
        if (!sk.startsWith && !sk.equals)
            throw new Error("sk.startsWith or sk.equals is required");
        try {
            let KeyConditionExpression = "#userId = :userId";
            if (sk.startsWith) {
                KeyConditionExpression += " AND begins_with(#id, :idPrefix)";
            }
            if (sk.equals) {
                KeyConditionExpression += " AND #id = :idFull";
            }

            const res = await dynamodb.query({
                TableName,
                KeyConditionExpression,
                ExpressionAttributeNames: {
                    "#userId": pk.name,
                    "#id": sk.name,
                },
                ExpressionAttributeValues: {
                    ":userId": pk.value,
                    ...(sk.startsWith && { ":idPrefix": sk.startsWith }),
                    ...(sk.equals && { ":idFull": sk.equals }),
                },
                ...options,
            });

            return res.Items;
        } catch (error) {
            if (!(error instanceof Error)) throw new Error(String(error));
            console.log("queryStartsWith error");
            console.error(error.message);
            throw error;
            // return undefined
        }
    };

    async function batchWriteAll(params: BatchWriteCommandInput) {
        if (!params.RequestItems) return;
        const tables = Object.keys(params.RequestItems);
        let count = 0;
        let req = { RequestItems: {} as Record<string, any[]> };
        try {
            for (let table of tables) {
                const items = params.RequestItems[table];
                while (items.length >= 25) {
                    const writeItems = items.splice(0, 25);
                    try {
                        await batchWriteNative({
                            ...params,
                            RequestItems: { [table]: writeItems },
                        });
                    } catch (e) {
                        console.log(
                            "in while",
                            writeItems.length,
                            items.length
                        );
                        console.error(e);
                    }
                }
                if (items.length + count < 25) {
                    if (items.length > 0) req.RequestItems[table] = items;
                    count += items.length;
                    continue;
                }
                try {
                    req.RequestItems[table] = items.splice(0, 25 - count);
                    await batchWriteNative({ ...params, ...req });
                    count = items.length;
                } catch (e) {
                    const query = { ...params, ...req };
                    console.log(
                        "in last",
                        count,
                        Object.keys(query.RequestItems).length,
                        query
                    );
                    console.log(e);
                }
                if (items.length > 0) req.RequestItems[table] = items;
            }
            // last batch
            if (count > 0) await batchWriteNative({ ...params, ...req });
        } catch (error) {
            console.error(error);
        }
    }

    const queryAllItems = async <T>(params: QueryCommandInput) => {
        let items: any[] = [];
        try {
            let LastEvaluatedKey: Record<string, any> | undefined;
            do {
                if (LastEvaluatedKey)
                    params.ExclusiveStartKey = LastEvaluatedKey;
                const res = await dynamodb.query(params);
                LastEvaluatedKey = res.LastEvaluatedKey;
                items = items.concat(res.Items || []);
            } while (LastEvaluatedKey);
        } catch (error) {
            console.error(error);
        }
        return items as T[];
    };

    const scanAll = async <T>(
        TableName: string,
        options?: Omit<ScanCommandInput, "TableName">
    ) => {
        if (process.env.NODE_ENV !== "development")
            throw new Error("HOW DARE YOU SCAN MY TABLE");
        let items: any[] = [];
        try {
            let LastEvaluatedKey: Record<string, any> | undefined;
            do {
                let params: ScanCommandInput = {
                    TableName,
                    ...options,
                };
                if (LastEvaluatedKey)
                    params.ExclusiveStartKey = LastEvaluatedKey;
                const res = await dynamodb.scan(params);
                LastEvaluatedKey = res.LastEvaluatedKey;
                items = items.concat(res.Items || []);
            } while (LastEvaluatedKey);
        } catch (error) {
            console.error(error);
        }
        return items as T[];
    };

    const batchGetItem = async (
        Keys: Record<string, any>[],
        TableName = process.env.TABLE_NAME!,
        options?: {
            ProjectionExpression?: string;
            ExpressionAttributeNames?: { [x: string]: string };
            maxGet?: number;
        }
    ): Promise<Record<string, any>[] | void> => {
        if (Keys.length === 0) return;
        const { ProjectionExpression, ExpressionAttributeNames, maxGet } =
            options || {};
        if (maxGet && Keys.length > maxGet)
            throw new Error("Keys length exceeds maxGet");

        const currentKeys = Keys.slice(0, 25);
        const laterKeys = Keys.slice(25);

        const data = await dynamodb.batchGet({
            RequestItems: {
                [TableName]: {
                    Keys: currentKeys,
                    ...(ProjectionExpression !== undefined && {
                        ProjectionExpression,
                    }),
                    ...(ExpressionAttributeNames !== undefined && {
                        ExpressionAttributeNames,
                    }),
                },
            },
        });

        if (!(data.Responses && data.Responses[TableName])) return;
        const items = data.Responses[TableName];

        if (laterKeys.length > 0) {
            const otherItems = await batchGetItem(
                laterKeys,
                TableName,
                options
            );
            if (otherItems) return items.concat(otherItems);
        }
        return items;
    };

    const updateItem = async (
        TableName: string,
        Key: Record<string, string>,
        updates: UpdateItemParams,
        preventNewItem = true,
        options?: UpdateItemOptions
    ) => {
        if (isEmpty(updates)) return;
        // console.log('in update')
        // console.log(updates)
        for (let key of Object.keys(Key)) {
            if (updates.set && key in updates.set) {
                delete updates.set[key];
            }
        }

        const primaryKey =
            options?.primaryKey || ("userId" in Key ? "userId" : "pk");

        const ExpressionAttributeValues: Record<string, any> = {};
        const ExpressionAttributeNames: Record<string, any> = {};

        const SetUpdateExpression =
            (updates.set || updates.listAppend || updates.setIfNotExists) &&
            updateSetExpressions(
                {
                    set: { ...updates.set, updatedAt: Date.now() },
                    listAppend: updates.listAppend,
                    setIfNotExists: updates.setIfNotExists,
                },
                ExpressionAttributeValues,
                ExpressionAttributeNames
            );
        const RemoveUpdateExpression =
            updates.remove &&
            updateRemoveExpressions(updates.remove, ExpressionAttributeNames);
        const AddUpdateExpression =
            updates.add &&
            updateAddDeleteExpressions(
                "add",
                updates.add,
                ExpressionAttributeValues,
                ExpressionAttributeNames
            );
        const DeleteUpdateExpression =
            updates.delete &&
            updateAddDeleteExpressions(
                "delete",
                updates.delete,
                ExpressionAttributeValues,
                ExpressionAttributeNames
            );

        const UpdateExpression = [
            SetUpdateExpression,
            RemoveUpdateExpression,
            AddUpdateExpression,
            DeleteUpdateExpression,
        ]
            .filter(Boolean)
            .join(" ");
        const params: any = {
            TableName,
            Key,
            UpdateExpression,
            ExpressionAttributeNames,
            ...(!isEmpty(ExpressionAttributeValues) && {
                ExpressionAttributeValues,
            }),
            ...(preventNewItem && {
                ConditionExpression: `attribute_exists(${primaryKey})`,
            }),
            ...(options?.ReturnValues && {
                ReturnValues: options.ReturnValues,
            }),
        };

        if (options?.debug) console.log("params", params);

        try {
            return await update(params);
        } catch (e) {
            if (!(e instanceof Error)) throw e;
            if (
                e.message.startsWith("ConditionalCheckFailedException") &&
                !options?.throwConditionalFail
            )
                return;
            console.log(e);
            console.log("params", params);
            // @ts-expect-error
            throw new Error(e);
        }
    };

    return {
        dynamodb,
        getItem,
        putItem,
        queryStartsWith,
        batchWriteAll,
        queryAllItems,
        scanAll,
        batchGetItem,
        updateItem,
        client,
        ddbDocClient,
    };
};

export { createDynamoDBHelpers };
