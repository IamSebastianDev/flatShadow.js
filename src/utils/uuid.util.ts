/** @format */

const chars = [...new Set([...'abcdefghijklmnopqrstuvwxyz0123456789'].flatMap((char) => [char, char.toUpperCase()]))];
console.log({ chars });
export const uuid = (): string => {
    return Array(24)
        .fill(undefined)
        .map(() => chars[Math.floor(Math.random() * chars.length) * 1])
        .join('');
};
