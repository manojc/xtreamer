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
};

const _getStartTagIndices = (xmlString, node) => {

    let indices = [];

    if (!xmlString || !xmlString.trim() || !node || !node.trim()) {
        return indices;
    }

    const startTag1 = `<${node} `;
    const startTag2 = `<${node}>`;

    indices = [
        ...indices,
        ..._getIndices(xmlString, startTag1),
        ..._getIndices(xmlString, startTag2)
    ];

    return indices;
};

const _getEndTagIndices = (xmlString, node) => {

    if (!xmlString || !xmlString.trim() || !node || !node.trim()) {
        return indices;
    }

    const endTag = `</${node}>`;

    return _getIndices(xmlString, endTag);
};

//  array of array
const _getCommentIndices = (xmlString) => {

    if (!xmlString || !xmlString.trim()) {
        return indices;
    }

    const startOfComment = "<!--";
    const endOfComment = "-->";

    indices = [
        _getIndices(xmlString, startOfComment),
        _getIndices(xmlString, endOfComment)
    ];

    return indices;
};

//  array of array
const _getCdataIndices = (xmlString) => {

    if (!xmlString || !xmlString.trim()) {
        return indices;
    }

    const startOfCdata = "<![CDATA[";
    const endOfCdata = "]]>";

    indices = [
        _getIndices(xmlString, startOfCdata),
        _getIndices(xmlString, endOfCdata)
    ];

    return indices;
};

const _getMatchingEndIndex = (startIndices, endIndices, index) => {
    if (startIndices[index + 1] < endIndices[index]) {
        return _getMatchingEndIndex(startIndices, endIndices, index + 1);
    }
    return index;
};

// returns array [{start: number, end: number}]
const _getNodeIndices = (xmlString, node) => {

    const nodeIndices = [];
    let skipIndex = -1;

    if (!xmlString || !xmlString.trim() || !node || !node.trim()) {
        return nodeIndices;
    }

    let startIndices = _getStartTagIndices(xmlString, node);
    let endIndices = _getEndTagIndices(xmlString, node);

    let commentMatrix = _getCommentIndices(xmlString);
    let cDataMatrix = _getCdataIndices(xmlString);

    if (!startIndices || !startIndices.length || !endIndices || !endIndices.length) {
        return nodeIndices;
    }

    startIndices.sort((a, b) => a - b);
    endIndices.sort((a, b) => a - b);

    startIndices.forEach((startIndex, index, array) => {

        // check if the tag is present in any of the comments. If yes, skip it.
        const isCommentIndex = commentMatrix[0].some((commentIndex, cIndex) => {
            commentMatrix[1][cIndex] = commentMatrix[1][cIndex] || xmlString.length;
            return startIndex > commentMatrix[0][cIndex] || startIndex < commentMatrix[1][cIndex];
        });

        // check if the tag is present in any of the cdata sections. If yes, skip it.
        const isCdataIndex = cDataMatrix[0].some((cDataIndex, cIndex) => {
            cDataMatrix[1][cIndex] = cDataMatrix[1][cIndex] || xmlString.length;
            return startIndex > cDataMatrix[0][cIndex] || startIndex < cDataMatrix[1][cIndex];
        });

        if (skipIndex >= index || isCommentIndex || isCdataIndex) {
            return;
        }

        // get next logical start tag index
        skipIndex = _getMatchingEndIndex(array, endIndices, index);

        if (endIndices[skipIndex]) {
            nodeIndices.push({
                start: startIndex,
                end: endIndices[skipIndex]
            });
        }
    });

    return nodeIndices;
};

module.exports = {
    Constants: Constants,
    getNodeIndices: _getNodeIndices
};