module.exports = async (bot, msg) => {
    const guid = msg.source_guid;

    const andReg = /android-[a-f0-9]{8}(-[a-f0-9]{4}){3}-[a-f0-9]{12}/
    const webReg = /[a-f0-9]{32}/
    const iOSReg = /[A-F0-9]{8}(-[A-F0-9]{4}){3}-[A-F0-9]{12}/

    if (andReg.test(guid)) {
        //console.log("And GUID:", guid);
    } else if (webReg.test(guid)) {
        //console.log("Web GUID:", guid);
    } else if (iOSReg.test(guid)) {
        //console.log("iOS GUID:", guid);
    } else {
        console.log("\nUNKNOWN GUID TYPE:");
        console.log(msg);
    }
    return true;
}