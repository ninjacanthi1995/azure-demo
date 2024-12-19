export const findAsync = async <T>(
    array: Array<T>,
    predicate: (item: T) => Promise<boolean>
): Promise<T | undefined> => {
    for (const item of array) {
        if (await predicate(item)) {
            return item;
        }
    }
    return undefined;
};
