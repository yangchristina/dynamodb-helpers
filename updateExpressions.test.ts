import { ADD_ON, updateSetExpressions } from "updateExpressions";
import { expect, test } from "vitest";

// Handles updates with empty set, listAppend, and setIfNotExists objects
test("should handle updates with empty set, listAppend, and setIfNotExists objects", () => {
    const updates = {
        set: {},
        listAppend: {},
        setIfNotExists: {},
    };
    const ExpressionAttributeValues = {};
    const ExpressionAttributeNames = {};

    const result = updateSetExpressions(
        updates,
        ExpressionAttributeValues,
        ExpressionAttributeNames
    );

    expect(result).toBe("set ");
    expect(ExpressionAttributeValues).toEqual({});
    expect(ExpressionAttributeNames).toEqual({});
});

// function* incrementGenerator() {
//     let i = 0;
//     while (true) {
//         yield i++;
//     }
// }

// Generates correct set expressions when 'set' is provided
test('should generate correct set expressions when "set" is provided', () => {
    const updates = {
        set: {
            attribute1: "value1",
            attribute2: "value2",
        },
    };
    const ExpressionAttributeValues = {};
    const ExpressionAttributeNames = {};

    const result = updateSetExpressions(
        updates,
        ExpressionAttributeValues,
        ExpressionAttributeNames,
        {
            generateRandomId() {
                return "randomId"
            },
        }
    );
    console.log('result', result)
    expect(result).toBe(
        `set #attribute1randomId = :randomId0${ADD_ON}valset, #attribute2randomId = :randomId1${ADD_ON}valset`
    );
    expect(ExpressionAttributeValues).toEqual({
        [`:randomId0${ADD_ON}valset`]: "value1",
        [`:randomId1${ADD_ON}valset`]: "value2",
    });
});
