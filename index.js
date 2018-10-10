const express = require("express")
const app = express()
const morgan = require('morgan')
const path = require("path")
const favicon = require('serve-favicon');
const wls = require("wlsjs");
const moment = require('moment');
var current=0

nodo()
setInterval(()=>{ nodo() },10*60*1000)
function nodo(){
    const noneCurrent=[
        'https://rpc.smoke.io',
        'http://104.248.168.86:8090'
        
    ]
    wls.api.setOptions({ url: noneCurrent[current] });
    console.log(`current node ${noneCurrent[current]}`)
    current>=noneCurrent.length-1 ? current=0 : current++
    console.log(`next node ${noneCurrent[current]}`)
}


app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.set('port', process.env.PORT || 3000);

app.engine('.html', require('ejs').__express);


//middelwares
app.use(morgan('dev'));
app.disable('view cache');
app.use(favicon(path.join(__dirname,'views','favicon.ico')));


//public folder
app.use(express.static(__dirname + '/public'));



//rutas de renderisado
app.get('/',(req,res)=>{
    res.status(200).render("index")
})
var data=[]
var datosU=[]
var manejoerrores=false
var fech=[]
function cargarhistorial(usuario,start,callback){
    wls.api.getAccounts([usuario], (err, response)=>{
        if(err){
            nodo()
            manejoerrores=true
            if(callback)
                callback(err)
        }
        if(response){
            datosU.push(response[0])
            dataUser(usuario,start,(data,data1,datosU)=>{
                if(callback)
                    callback(data,(data1 ? data1 : null),datosU)
            })
        }

    })   
}
function dataUser(usuario,start,callback){
    wls.api.getAccountHistory(usuario, start*-1 , Math.min(start,1000), function(err, result) {
        if(err){
            nodo()
            manejoerrores=true
            if(callback)
                callback(null,err,null)
        }
        else if(result && result.length>0){
            console.log("esta aqui")
            result.reverse();
            console.log(result.length)
            console.log(start*-1)
            console.log(Math.min(start,1000))
            var numero=start<=1000 ? 100 : start<=10000 ? 1000 : start<=100000 ? 10000 : null
            var n=start/numero
            var putno=n.toString().indexOf(".");
            var numeroN=n.toString()
            var numeroS=numeroN.substring((putno!=-1 ? putno+1 : 0),numero.length)
            console.log(Number(numeroS)*100-100)
            console.log(Number(numeroS)*100)
            for(var i = (Number(numeroS)*100-100);i<(result.length< (Number(numeroS)*100) ? result.length : Number(numeroS)*100); i++) {
                //if(result[i][0]>=1){
                    data.push(result[i])
                    var fpreviud=moment.utc(result[i][1].timestamp).valueOf()
                    fech.push(moment(fpreviud).fromNow())
                //}
            }
            if (callback){
                console.log("generando callback")
                callback(data,null,datosU)
            }     
        }else{
            if (callback){
                callback(null,true,null)
            }  
        }

    });
}
function confis(callback){
    wls.api.getDynamicGlobalProperties((err, result) => {
        if(err){
            nodo()
            manejoerrores=true
            if(callback)
                callback(err)
        }
        if(datosU[0] && result){
            var vestingShares=parseFloat(datosU[0].vesting_shares)
            if(vestingShares){
                var g=wls.formatter.vestToSteem(vestingShares, parseFloat(result.total_vesting_shares), parseFloat(result.total_vesting_fund_steem));
                if(callback)
                    callback(g)
            }
        }
    });
}


app.get('/:id',(req,res)=>{
    sp=null
    data=[]
    user=null
    datosU=[]
    fech=[]
    var user=req.path,
        page=req.query.page
    if(user!="/@"){
        user.toLowerCase();
        cargarhistorial(user.substr(2,user.length),(page ? page*100 : 100),(data,err,datau)=>{
                confis((gsp)=>{
                if(gsp){
                    res.status(200).render('usernames',{
                            datos:data,
                            fech:fech,
                            u:user.substr(2,user.length),
                            datau:datau,
                            sp:gsp,
                            page:page
                    })
                }
                else if(manejoerrores){
                    res.redirect('/err')
                }
                
            })
        })
    }else{
        res.status(200).send("hubo algun error con el @")
    }
})
function buscarinfo(trxid,callback){
    wls.api.getTransaction(trxid, function(err, result) {
        if(err){
            nodo()
            manejoerrores=true
            if(callback)
                callback(err)
        }
        if(result){
            if(callback)
                callback(result)
        }
    });
}
app.get('/trx/:id',(req,res)=>{
    console.log(req.path)
    var trxid=path.basename(req.path)
    buscarinfo(trxid,(datossend)=>{
        if(datossend){
            res.status(200).render('trx',{
                data:datossend
            })
        }
        else if(manejoerrores){
            res.redirect('/err')
        }
    })
})

app.get('/err',(req,res)=>{
    res.status(200).render("errores")
})

app.listen(app.get('port'),()=>{
    console.log(`servidor corriendo en el puerto ${app.get('port')}`)
})