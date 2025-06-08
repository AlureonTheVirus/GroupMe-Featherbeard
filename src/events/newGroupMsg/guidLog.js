module.exports = async (bot, msg) => {
    const guid = msg.source_guid;

    const andReg = /android-[a-f0-9]{8}(-[a-f0-9]{4}){3}-[a-f0-9]{12}/;
    const webReg = /[a-f0-9]{32}/;
    const iOSReg = /[A-F0-9]{8}(-[A-F0-9]{4}){3}-[A-F0-9]{12}/;
    const smsReg = /[a-f0-9]{8}(-[a-f0-9]{4}){3}-[a-f0-9]{12}-0/;
    const featherReg = /Featherbeard-[0-9]+-[0-9]+/;
    
    if (andReg.test(guid)) {
        //console.log("And GUID:", guid);
    } else if (webReg.test(guid)) {
        //console.log("Web GUID:", guid);
    } else if (iOSReg.test(guid)) {
        //console.log("iOS GUID:", guid);
    } else if (smsReg.test(guid)) {
        //console.log("SMS GUID:", guid);
    } else if (featherReg.test(guid)) {
        //console.log("FEATHER GUID:", guid);
    } else {
        console.log("\nUNKNOWN GUID TYPE:");
        console.log(msg);
    }
    return true;
}