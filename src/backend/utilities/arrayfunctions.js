module.exports = {
    getObjAttribMaxValue: getObjAttribMaxValue
};

function getObjAttribMaxValue(objArray, attribNameString) {
    return Math.max(...objArray.map((obj) => { return obj[attribNameString]; }));
}
