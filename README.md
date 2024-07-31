# dynamodb-helpers

## Installation

```bash
npm install dynamodb-helpers @aws-sdk/client-dynamodb @aws-sdk/lib-dynamodb
```

> [!NOTE]
> `@aws-sdk/client-dynamodb` and `@aws-sdk/lib-dynamodb` are peer dependencies.

## Setup

Create a file (I use `lib/dynamodb.ts`). All the helper functions will be exported from this file. Paste the following code in the file:

```ts
export {
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
 } = createDynamoDBHelpers(dbConfig, translateConfig);
```

`dbConfig` and `translateConfig` come from the DyanmoDB Docs. Here is an example of how to set them up:


```ts
// lib/dynamodb.ts
import createDynamoDBHelpers from 'dynamodb-helpers';

const marshallOptions = {
    // Whether to automatically convert empty strings, blobs, and sets to `null`.
    convertEmptyValues: false, // false, by default.
    // Whether to remove undefined values while marshalling.
    removeUndefinedValues: true, // false, by default.
    // Whether to convert typeof object to map attribute.
    convertClassInstanceToMap: false, // false, by default.
};

const unmarshallOptions = {
    // Whether to return numbers as a string instead of converting them to native JavaScript numbers.
    wrapNumbers: false, // false, by default.
};

const translateConfig = { marshallOptions, unmarshallOptions };
export const dbConfig: DynamoDBClientConfig = {
    region: process.env.REGION,
    credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
    },
};

export const {
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
 } = createDynamoDBHelpers(dbConfig, translateConfig);
```

Now simply import a function to use it!

```ts
import { updateItem } from '@/lib/dynamodb';

await updateItem(process.env.TABLE_NAME!, { pk: '1', sk: 'John Doe' }, {
    set: {
        date: '2021-01-01',
        name: 'John Doe',
    },
    setIfNotExists: {
        age: 30,
        dateOfBirth: '1990-01-01',
    }
});

```