let messageQueue = [];

module.exports = {
    add: add,
    extract: extract,
    extractAll: extractAll,
    length: length,
    flush: flush,
    viewContents: viewContents
};

function add(messageString) {
    let queueCopy = null;
    messageQueue.push(messageString);
    queueCopy = messageQueue;
    return queueCopy;
}

function extract(count) {
    let retrieved = messageQueue.splice(0, count);
    return retrieved;
}

function extractAll() {
    let retrieved = null;
    retrieved = messageQueue.splice(0, messageQueue.length);
    return retrieved;
}

function length() {
    return messageQueue.length;
}

function flush() {
    messageQueue = [];
    return [];
}

function viewContents() {
    let copy = messageQueue.slice();
    return copy;
}
