/**
 * Constructs a string composed of a repeated character for a specified length.
 *
 * @param {string} char - The character to be repeated in the string.
 * @param {number} length - The number of times the character should be repeated.
 * @returns {string} A string consisting of the specified character repeated for the given length.
 */
function buildLogLine(char, length){

    let logLineContent = ""

    for (let index = 0; index < length; index++) {
        logLineContent += char;
    }
    return logLineContent

}


/**
 * Logs a message within a decorative box to the console.
 *
 * @param {string} message - The message to be displayed inside the box.
 * @param {number} [lengthBox=100] - The total length of the box, including borders and padding.
 *                                    Defaults to 100 if not provided.
 * @returns {void} This function does not return a value. It outputs the box to the console.
 */
function box(message, headerMessage = undefined, lengthBox = 100, toReturn = false){

    const messageLength = message.length

    const isEven = parseInt(lengthBox - messageLength) % 2 === 0 ? true : false

    const logBoxLength = buildLogLine("-", lengthBox)
    const logPaddingBox = `|${buildLogLine(" ", 98)}|`
    const spaceLength = (parseInt(lengthBox - messageLength) - 2) / 2;

    let logMessageLine = ""
    let headerMessageBox = ""

    if(isEven){
        const logMessageSpace = `${buildLogLine(" ", spaceLength)}`
        logMessageLine = `|${logMessageSpace}${message}${logMessageSpace}|`
    } else {
        const logMessageSpaceLeft = `${buildLogLine(" ", spaceLength - 1)}`
        const logMessageSpaceRight = `${buildLogLine(" ", spaceLength)}`
        logMessageLine = `|${logMessageSpaceLeft}${message}${logMessageSpaceRight}|`

    }

    if(headerMessage){

        const isHeaderEven = parseInt(lengthBox - headerMessage.length) % 2 === 0 ? true : false
        const headerSpace = (parseInt(lengthBox - headerMessage.length)) / 2

        if(isHeaderEven){
            const logMessageSpace = `${buildLogLine("-", headerSpace)}`
            headerMessageBox = `${logMessageSpace}${headerMessage}${logMessageSpace}`
        } else {
            const logMessageSpaceLeft = `${buildLogLine("-", headerSpace - 1)}`
            const logMessageSpaceRight = `${buildLogLine("-", headerSpace)}`
            headerMessageBox = `${logMessageSpaceLeft}${headerMessage}${logMessageSpaceRight}`
        }

    }

    if(!toReturn){
        console.log("\n")
        if(headerMessage){
            console.log(headerMessageBox)
        } else {
            console.log(logBoxLength)
        }
        console.log(logPaddingBox)
        console.log(logMessageLine)
        console.log(logPaddingBox)
        console.log(logBoxLength)
        console.log("\n")
        return;
    } else {

        const box = "\n" + (headerMessage ? headerMessageBox : logBoxLength) + "\n" + logPaddingBox + "\n" + logMessageLine + "\n" + logPaddingBox + "\n" + logBoxLength + "\n"
        return box

    }



}

module.exports.box = box

function error(message){
    console.log(`\x1b[48;5;9m\x1b[38;5;15m ${message} \x1b[0m`)
}

module.exports.error = error;