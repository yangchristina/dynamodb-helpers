import { ADD_ON, updateSetExpressions } from "./updateExpressions";
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

// Test increment functionality using SET expressions
test('should generate correct SET expressions for increment operations', () => {
    const updates = {
        increment: {
            price: 15,
            quantity: 1,
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
                return "randomId";
            },
        }
    );

    expect(result).toBe(
        "set #pricerandomId = #pricerandomId + :incpricerandomId, #quantityrandomId = #quantityrandomId + :incquantityrandomId"
    );
    expect(ExpressionAttributeValues).toEqual({
        ":incpricerandomId": 15,
        ":incquantityrandomId": 1,
    });
});

// Test decrement functionality using SET expressions
test('should generate correct SET expressions for decrement operations', () => {
    const updates = {
        decrement: {
            price: 10,
            stock: 5,
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
                return "randomId";
            },
        }
    );

    expect(result).toBe(
        "set #pricerandomId = #pricerandomId - :decpricerandomId, #stockrandomId = #stockrandomId - :decstockrandomId"
    );
    expect(ExpressionAttributeValues).toEqual({
        ":decpricerandomId": 10,
        ":decstockrandomId": 5,
    });
});

// Test mixed operations (set, increment, decrement)
test('should handle mixed set, increment, and decrement operations', () => {
    const updates = {
        set: {
            name: "Updated Product",
        },
        increment: {
            views: 1,
        },
        decrement: {
            stock: 2,
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
                return "randomId";
            },
        }
    );

    expect(result).toBe(
        `set #namerandomId = :randomId0${ADD_ON}valset, #viewsrandomId = #viewsrandomId + :incviewsrandomId, #stockrandomId = #stockrandomId - :decstockrandomId`
    );
    expect(ExpressionAttributeValues).toEqual({
        [`:randomId0${ADD_ON}valset`]: "Updated Product",
        ":incviewsrandomId": 1,
        ":decstockrandomId": 2,
    });
});
