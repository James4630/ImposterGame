const uuids: string[] = [];

export function genUUID(): string {
    let uuid
    do {
        uuid = crypto.randomUUID()
    } while (uuids.includes(uuid));
    uuids.push(uuid);
    return uuid;
}