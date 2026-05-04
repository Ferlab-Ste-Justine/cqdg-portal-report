const dedupeByField = <T extends Record<string, any>>(
    rows: T[],
    field: string,
    groupBy?: string,
): T[] => {
    const seen = new Set<string>();
    return rows.filter(row => {
        const value = row[field];
        if (!value) return true;
        const key = groupBy ? `${row[groupBy]}|${value}` : value;
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
    });
};

export default dedupeByField;
