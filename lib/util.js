const Constants = {
    XML_DATA: "xmldata",
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
    
    let indices = [];

    if (!xmlString || !xmlString.trim() || !node || !node.trim()) {
        return indices;
    }

    const endTag = `</${node}>`;

    return _getIndices(xmlString, endTag);
};

//  array of array
const _getCommentIndices = (xmlString) => {
    
    let indices = [];

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
    
    let indices = [];

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

const _isInvalidTagIndex = (validateTagIndex, matrix, xmlString) => {
    // check if the start tag is present in any of the comments. If yes, skip it.
    return matrix[0].some((commentIndex, cIndex) => {
        matrix[1][cIndex] = matrix[1][cIndex] || xmlString.length;
        return validateTagIndex > matrix[0][cIndex] && validateTagIndex < matrix[1][cIndex];
    });
}

const _getMatchingEndIndex = (startIndices, endIndices, index, commentMatrix, cDataMatrix, xmlString, offset = 1) => {
    // check if the end tag index is present in any of the comments / cdata. If yes, skip it.
    if (_isInvalidTagIndex(endIndices[index], commentMatrix, xmlString) ||
        _isInvalidTagIndex(endIndices[index], cDataMatrix, xmlString)) {
        offset++;
    } 
    
    if (startIndices[index + offset] < endIndices[index]) {
        return _getMatchingEndIndex(startIndices, endIndices, index + 1, commentMatrix, cDataMatrix, xmlString, offset);
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

        // check if the start tag index is present in any of the comments / cdata. If yes, skip it.
        if (_isInvalidTagIndex(startIndex, commentMatrix, xmlString) ||
            _isInvalidTagIndex(startIndex, cDataMatrix, xmlString) ||
            skipIndex >= index) {
            return;
        }

        // get next logical start tag index
        skipIndex = _getMatchingEndIndex(array, endIndices, index, commentMatrix, cDataMatrix, xmlString);

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