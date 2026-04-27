const dedupeByField = <T extends Record<string, any>>(rows: T[], field: string): T[] => {
    const seen = new Set<string>();
    return rows.filter(row => {
        const value = row[field];
        if (!value) return true;
        if (seen.has(value)) return false;
        seen.add(value);
        return true;
    });
};

export default dedupeByField;
