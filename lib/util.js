const Constants = {
    XML_DATA: "xmldata",
    ERROR: "error",
    END: "end",
    CLOSE: "close",
    MAX_XML_LENGTH: 10000000
};


const _getIndices = (xmlString, subString) => {

    let indices = [];
    let offset = 0;

    if (!xmlString || !xmlString.trim() || !subString || !subString.trim()) {
        return indices;
    }

    while (offset <= xmlString.length) {
        const index = xmlString.indexOf(subString, offset);

        // no occurance
        if (index < 0) {
            offset = xmlString.length + 1;
        } else {
            offset = index + subString.length;
            indices.push(index);
        }
    }

    return indices;
}


const _getEndTagIndices = (xmlString, node) => {

    if (!xmlString || !xmlString.trim() || !node || !node.trim()) {
        return indices;
    }

    const endTag = `</${node}>`;

    return _getIndices(xmlString, endTag);
}


const _getStartTagIndices = (xmlString, node) => {

    let indices = [];

    if (!xmlString || !xmlString.trim() || !node || !node.trim()) {
        return indices;
    }

    const startTag1 = `<${node} `;
    const startTag2 = `<${node}>`;

    indices = [...indices, ..._getIndices(xmlString, startTag1), ..._getIndices(xmlString, startTag2)];

    return indices;
}


const _getMatchingEndIndex = (startIndices, endIndices, index) => {
    if (startIndices[index + 1] < endIndices[index]) {
        return _getMatchingEndIndex(startIndices, endIndices, index + 1);
    }
    return index;
}


// returns array [{start: number, end: number}]
const _getNodeIndices = (xmlString, node) => {

    const nodeIndices = [];
    let skipIndex = -1;

    if (!xmlString || !xmlString.trim() || !node || !node.trim()) {
        return nodeIndices;
    }

    let startIndices = _getStartTagIndices(xmlString, node);
    let endIndices = _getEndTagIndices(xmlString, node);

    if (!startIndices || !startIndices.length || !endIndices || !endIndices.length) {
        return nodeIndices;
    }

    startIndices.sort((a, b) => a - b);
    endIndices.sort((a, b) => a - b);

    startIndices.forEach((startIndex, index, array) => {
        if (skipIndex >= index) {
            return;
        }
        skipIndex = _getMatchingEndIndex(array, endIndices, index);
        if (endIndices[skipIndex]) {
            nodeIndices.push({
                start: startIndex,
                end: endIndices[skipIndex]
            });
        }
    });

    return nodeIndices;
}

module.exports = {
    Constants: Constants,
    getNodeIndices: _getNodeIndices
};