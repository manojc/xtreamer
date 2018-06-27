class TagIndex {
    [item: number]: { start: number, end: number };
    hierarchy: number;
    distance: number;
}

class Tags {
    [name: string]: TagIndex;
}

export { Tags, TagIndex }