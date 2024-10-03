import { expect, test } from "vitest";
import { toKeyAndExpName } from "./utils";

test("should generate a key with a random ID appended when no custom ID generator is provided", () => {
    const ExpressionAttributeNames = {};
    const result = toKeyAndExpName("example", ExpressionAttributeNames);
    expect(result).toMatch(/^#example\w{5}$/);
    expect(Object.keys(ExpressionAttributeNames)).toHaveLength(1);
    const key = Object.values(ExpressionAttributeNames)[0];
    expect(key).toBe("example");
});

test('should replace invalid characters when present in the name', () => {
    const ExpressionAttributeNames = {};
    const result = toKeyAndExpName('dragtask-into-calendar', ExpressionAttributeNames);
    expect(result).toMatch(/^#dragtaskintocalendar\w{5}$/);
});