const wls = require("wlsjs");
wls.api.setOptions({ url: 'wss://188.166.99.136:2001' });
wls.api.getAccounts(['ederaleng'], (err, response)=>{
    console.log(err, response);
});