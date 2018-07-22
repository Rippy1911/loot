//\\//\\//\\//\\//\\//\\
//File created by Echo\\
//\\//\\//\\//\\//\\//\\
var fs = require('fs');
var request = require('request');
var log4js = require('log4js');
var express = require('express');
var config = require('./config.js');
var options = {
    key: fs.readFileSync('echo.key'),
    cert: fs.readFileSync('echo.crt'),
    requestCert: true
};
var app = express();
var server = require('https').createServer(options, app);
var io = require('socket.io').listen(server);
server.listen(2053, '0.0.0.0');

log4js.configure({
    appenders: {
        console: {
            type: 'console'
        },
        default: {
            type: 'file',
            filename: 'logs/main_'+time()+'.log'
        }
    },
    categories: {
        default: {
            appenders: ['default', 'console'],
            level: 'trace'
        }
    }
});
var logger = log4js.getLogger();

var mysql = require('mysql');
var db_config = {
    host: config.sql.host,
    user: config.sql.user,
    password: config.sql.password,
    database: config.sql.database
};
var pool;

check_errors();
database_connection();

// vgo stuff
var vgo = {
    uid: null,
    name: null,
    auth: 'Basic ' + Buffer.from(config.api_key + ":", "ascii").toString("base64"),
    opskins_api: function(url, method, bodi, callback) {
        request({
            headers: {
                'Authorization': vgo.auth,
            },
            uri: url,
            method: method,
            form: bodi
        }, function(err, res, body) {
            if(err) throw err;
            var response = JSON.parse(body);
            callback(response);
        });
    }
};
// vgo stuff

//get bot infs
var now_url = 'https://api-trade.opskins.com/IUser/GetProfile/v1/';
vgo.opskins_api(now_url, 'GET', {}, function(res) {
    vgo.uid = res['response']['user']['id'];
    vgo.name = res['response']['user']['display_name'];
    logger.info('Bot ' + vgo.uid + ' (' + vgo.name + ') got from OPSkins!');
});
//

//enable comissions
var network_id = 1;
var network_user_id = 3910541;
var referral_commission_rate = 5.00;
var now_url = 'https://api-trade.opskins.com/ICaseSite/UpdateCommissionSettings/v1';
vgo.opskins_api(now_url, 'POST', {'network_id': network_id, 'network_user_id': network_user_id, 'referral_commission_rate': referral_commission_rate}, function(res) {
    if(res.hasOwnProperty('message') && !res.hasOwnProperty('response')) return logger.error('Error on commission change: ' + res.message);

    if(res.response.network_id == network_id && res.response.network_user_id == network_user_id && res.response.referral_commission_rate == referral_commission_rate) {
        logger.info('Commission change done!');
    } else {
        logger.info('Commission didnt changed!');
        logger.info(res.response);
    }
});
//enable comissions

//global vars
var socketids = {};
var sockets = {};
var ssockets = {};
var users = {};
var chat_msgs = [];
var anti_spam_chat = {};
var tokens = {};
var website = {};
// cases
    var ItemsCases = [];
    var Cases = {};
    var Cases_History = [];
    var TopUnbox = {};
    var Website_Inventory = {};
// 
//global vars


// 
getAllItems();
loadHistoryCases();
loadTopUnbox();
// 


io.on('connection', function(socket) {
    socket.on('login', function(token) {
        pool.query('SELECT steamid, name, avatar, rank, mute, steam_level FROM users WHERE token = ' + pool.escape(token), function(err, row) {
            if(err) throw err;
            // not logged in
            socketids[socket.id] = token;
            sockets[token] = socket.id;
            io.sockets.emit('website users online', Object.keys(sockets).length);
            if(chat_msgs.length > 0) socket.emit('website chat history', chat_msgs);

            socket.emit('website top unbox', TopUnbox);

            socket.emit('user to open cases', Cases);
            socket.emit('website live cases history', Cases_History);

            getWebsiteInformations(function(users, cases, preturile) {
                website = {
                    users: users,
                    cases: cases,
                    preturile: parseFloat(parseFloat(preturile/100).toFixed(2))
                }
                io.sockets.emit('website info', website);
            });

            // not logged in
            if(row.length == 0) return;
            //logged in
            users[token] = {
                steamid: row[0].steamid,
                name: row[0].name,
                avatar: row[0].avatar,
                rank: row[0].rank,
                mute: row[0].mute,
                keys: 0,
                level: -1
            };

            if(Website_Inventory.hasOwnProperty(token)) socket.emit('user inventory amount', Website_Inventory[token]);
            // Website_Inventory[token] = [];

            // var itemul = {
            //     id: '29392',
            //     color: '#ffffff',
            //     user: 'Echo',
            //     name: Cases['3'][0].items[10].name,
            //     suggested_price: parseFloat(parseFloat(Cases['3'][0].items[10].price/100).toFixed(2)),
            //     image: {
            //         "600px": Cases['3'][0].items[10].image
            //     }
            // };

            // Website_Inventory[token].push({
            //     caseid: '3',
            //     image: Cases['3'][0].img,
            //     item: itemul,
            //     type: 'real'
            // });

            // socket.emit('user inventory amount', Website_Inventory[token]);

            // Website_Inventory[token] = [];
            // var itemul = {  
            //     id:1593908,
            //     sku:146,
            //     wear:0.92508566379547,
            //     pattern_index:858,
            //     preview_urls:null,
            //     eth_inspect:null,
            //     trade_hold_expires:null,
            //     internal_app_id:1,
            //     inspect:null,
            //     name:'Glock-18 | Cardboard Warfare (Battle-Scarred)',
            //     category:'Mil-Spec Pistol',
            //     rarity:'Mil-Spec',
            //     type:'Pistol',
            //     paint_index:null,
            //     color:'#4b69ff',
            //     image:{  
            //         '300px':'https://files.opskins.media/file/vgo-img/item/glock-18-cardboard-warfare-battle-scarred-300.png',
            //         '600px':'https://files.opskins.media/file/vgo-img/item/glock-18-cardboard-warfare-battle-scarred-600.png'
            //     },
            //     suggested_price:13,
            //     suggested_price_floor:12
            //  };

            //  var itemul2 = {
            //     id: 1594320,
            //     sku: 135,
            //     wear: 0.0047961105592549,
            //     pattern_index: 16,
            //     preview_urls: null,
            //     eth_inspect: null,
            //     trade_hold_expires: null,
            //     internal_app_id: 1,
            //     inspect: null,
            //     name: 'M4A1-S | Silent Spray (Factory New)',
            //     category: 'Classified Rifle',
            //     rarity: 'Classified',
            //     type: 'Rifle',
            //     paint_index: null,
            //     color: '#d32ee6',
            //     image:
            //      { '300px': 'https://files.opskins.media/file/vgo-img/item/m4a1-s-silent-spray-factory-new-300.png',
            //        '600px': 'https://files.opskins.media/file/vgo-img/item/m4a1-s-silent-spray-factory-new-600.png' },
            //     suggested_price: 3443,
            //     suggested_price_floor: 3054
            //  }

            //  Website_Inventory[token].push({
            //     caseid: 3,
            //     image: Cases['3'][0].img,
            //     item:itemul,
            //     type: 'real'
            //  });

            //  Website_Inventory[token].push({
            //     caseid: 3,
            //     image: Cases['3'][0].img,
            //     item:itemul2,
            //     type: 'real'
            //  });

            //  console.log('how it looks like:');
            //  console.log(Website_Inventory[token]);

            //  socket.emit('user inventory amount', Website_Inventory[token]);

            var now_url = 'https://api-trade.opskins.com/ICaseSite/GetKeyCount/v1?steam_id=' + users[token].steamid;
            vgo.opskins_api(now_url, 'GET', {}, function(res) {
                if(res.hasOwnProperty('message') && !res.hasOwnProperty('response')) return;
                users[token].keys = parseInt(res.response.key_count);
                pool.query('UPDATE users SET `keys` = ' + pool.escape(users[token].keys) + ' WHERE token = ' + pool.escape(token), function(e, r) {
                    if(e) throw e;
                    logger.info('User ' + users[token].steamid + ' loaded with ' + users[token].keys + ' keys!');

                    checkSteamLevel(row[0].steamid, row[0].steam_level, function(level) {
                        pool.query('UPDATE users SET steam_level = ' + pool.escape(level) + ' WHERE token = ' + pool.escape(token), function(eee, rrr) {
                            if(eee) return;
        
                            users[token].level = level;

                            socket.emit('user info', users[token]);
                        });
                    });
                });
            });

            tokens[row[0].steamid] = token;
            ssockets[row[0].steamid] = socket.id;
        });
    });

    socket.on('user open test casess', function(caseid, amount, token) {
        if(caseid && amount && token) {
            socket.emit('user alerta', amount + ' test cases has been added to your website inventory!');
            if(!Website_Inventory.hasOwnProperty(token)) Website_Inventory[token] = [];

            for(var i = 0; i < amount; i++) {

                var casul = Cases[caseid][0].items;
                var image = Cases[caseid][0].img;

                casul.sort(function(a,b) {return b.price-a.price});

                var s;
                if(caseid == 1) {s = 135;}
                else if(caseid == 2) {s = 143;}
                else {s = 244;}

                var randIt = Math.floor(Math.random()*(100-1+1)+1);
                if(randIt == 69) var randItm = casul[Math.floor(Math.random()*(casul.length-1-0+1)+0)];
                else var randItm = casul[Math.floor(Math.random()*(casul.length-1-s+1)+s)];

                Website_Inventory[token].push({
                    caseid: caseid,
                    image: image,
                    item: randItm,
                    type: 'fake'
                });
            }

            socket.emit('user inventory amount', Website_Inventory[token]);
        }
    });

    socket.on('user inventory test open case', function(caseid, token) {
        if(token) {
            if(!Website_Inventory.hasOwnProperty(token)) return socket.emit('user eroare', 'You do not have any cases to open!');

            var case_to_open;
            for(var i in Website_Inventory[token]) {
                var itm = Website_Inventory[token][i];
                if(itm.caseid == caseid && itm.type == 'fake') {
                    case_to_open = itm;
                    socket.emit('user successfull test open cases', case_to_open);
                    socket.emit('user inventory amount', Website_Inventory[token]);
                    if(Website_Inventory[token].length == 0) delete Website_Inventory[token];
                    break;
                }
            }
        }
    });

    socket.on('user inventory test open case run', function(caseid, token, lightning) {
        if(token) {
            if(!Website_Inventory.hasOwnProperty(token)) return socket.emit('user eroare', 'You do not have any cases to open!');

            var case_to_open;
            for(var i in Website_Inventory[token]) {
                var itm = Website_Inventory[token][i];
                if(itm.caseid == caseid && itm.type == 'fake') {
                    case_to_open = itm;
                    socket.emit('user successfull test open cases', case_to_open, 1, lightning);
                    Website_Inventory[token].splice(i, 1);
                    socket.emit('user inventory amount', Website_Inventory[token]);
                    if(Website_Inventory[token].length == 0) delete Website_Inventory[token];
                    break;
                }
            }
        }
    });

    socket.on('user inventory open case', function(caseid, token) {
        if(token) {
            if(!Website_Inventory.hasOwnProperty(token)) return socket.emit('user eroare', 'You do not have any cases to open!');

            var case_to_open;
            for(var i in Website_Inventory[token]) {
                var itm = Website_Inventory[token][i];
                if(itm.id == caseid && itm.type == 'real') {
                    case_to_open = itm;
                    socket.emit('user successfull open cases', case_to_open);
                    socket.emit('user inventory amount', Website_Inventory[token]);
                    if(Website_Inventory[token].length == 0) delete Website_Inventory[token];
                    break;
                }
            }
        }
    });

    socket.on('user inventory open case run', function(caseid, token, lightning) {
        if(token) {
            if(!Website_Inventory.hasOwnProperty(token)) return socket.emit('user eroare', 'You do not have any cases to open!');

            var case_to_open;
            for(var i in Website_Inventory[token]) {
                var itm = Website_Inventory[token][i];
                if(itm.id == caseid && itm.type == 'real') {
                    case_to_open = itm;
                    socket.emit('user successfull open cases', case_to_open, 1, lightning);
                    Website_Inventory[token].splice(i, 1);
                    socket.emit('user inventory amount', Website_Inventory[token]);
                    emitHistory(token, itm);
                    if(Website_Inventory[token].length == 0) delete Website_Inventory[token];
                    break;
                }
            }
        }
    });

    socket.on('user open casess', function(caseid, amount, token) {
        if(caseid && amount && token) {
            if(!users.hasOwnProperty(token)) return socket.emit('user eroare', 'You need to login to open cases!');
            if(parseInt(users[token].keys) == 0) return socket.emit('user eroare', 'You do not have suficient keys to open cases!');
            if(parseInt(users[token].keys) < parseInt(amount)) return socket.emit('user eroare', 'Insuficient keys to open cases!');
            if(parseInt(amount) < 1 || parseInt(amount) > 100) return socket.emit('user eroare', 'You can open 1 case up to 100 cases at a time!');

            var steamid = users[token].steamid;
            var eth_address = config.address;

            var now_url = 'https://api-trade.opskins.com/ICaseSite/SendKeyRequest/v1';
            vgo.opskins_api(now_url, 'POST', {'steam_id': steamid, 'case_id': caseid, 'amount': amount, 'affiliate_eth_address': eth_address}, function(res) {
                if(res.hasOwnProperty('message') && !res.hasOwnProperty('response')) return socket.emit('user eroare', 'An error ocurred!');
                if(res.response.offer.state == 2) {
                    var tid = res.response.offer.id;

                    socket.emit('user trade', tid, res.response.offer_url);
                    checkUserOpenCase(tid, token, socket);
                } else {
                    socket.emit('user eroare', 'Failed to open cases!');
                }
            });
        }
    });

    socket.on('user chat message', function(msg, token) {
        if(msg && token) {
            var mesaj = chat_message_escape(msg);

            if(anti_spam_chat[token]+1 >= time()) return socket.emit('user eroare', 'Do not spam!');
            else anti_spam_chat[token] = time();
    
            if(mesaj.length > 128) return socket.emit('user eroare', 'The message is too long!');
            else if(mesaj.length < 4) return socket.emit('user eroare', 'The message is too short!');
    
            var args = null;
            if(args = /^\/mute ([0-9]*) ([0-9]*)/.exec(mesaj)) {
                if(users[token].rank == 100) {
    
                    var new_time = parseInt(time()+args[2]);
    
                    pool.query('UPDATE users SET mute = ' + pool.escape(new_time) + ' WHERE steamid = ' + pool.escape(args[1]), function(err, row) {
                        if(err) return socket.emit('user eroare', 'This user doesn\'t exists!');
    
                        users[tokens[args[1]]].mute = new_time;
                        socket.emit('user alerta', 'User successfully muted for ' + args[2] + ' seconds!');
                    });
                }
            } else if(args = /^\/ban ([0-9]*)/.exec(mesaj)) {
                if(users[token].rank == 100) {
                    pool.query('UPDATE users SET ban = 1 WHERE steamid = ' + pool.escape(args[1]), function(err, row) {
                        if(err) return socket.emit('user eroare', 'This user doesn\'t exists!');
    
                        socket.emit('user alerta', 'User successfully banned!');
                        if(io.sockets.connected[ssockets[args[1]]]) io.sockets.connected[ssockets[args[1]]].emit('user refresh');
                    });
                }
            } else if(args = /^\/unban ([0-9]*)/.exec(mesaj)) {
                if(users[token].rank == 100) {
                    pool.query('UPDATE users SET ban = 0 WHERE steamid = ' + pool.escape(args[1]), function(err, row) {
                        if(err) return socket.emit('user eroare', 'This user doesn\'t exists!');
    
                        socket.emit('user alerta', 'User successfully unbanned!');
                    });
                }
            } else if(args = /^\/clear/.exec(mesaj)) {
                if(users[token].rank == 100) {
                    chat_msgs = [];
                    io.sockets.emit('website chat clear');
                }
            } else if(args = /^\/check ([0-9]*)/.exec(mesaj)) {
                if(users[token].rank == 100) {
                    var now_url = 'https://api-trade.opskins.com/ICaseSite/GetTradeStatus/v1?offer_id=' + args[1];
                    vgo.opskins_api(now_url, 'GET', {}, function(res) {
                        console.log('checking trade #' + args[1]);
                        console.log(res);
                        console.log(res.response.cases);
                    });
                }
            } else {
                if(mesaj.includes('/mute') && users[token].rank == 100) return cmdSyntax('/mute', socket);
                else if(mesaj.includes('/ban') && users[token].rank == 100) return cmdSyntax('/ban', socket);
                else if(mesaj.includes('/unban') && users[token].rank == 100) return cmdSyntax('/unban', socket);
                else if(mesaj.includes('/clear') && users[token].rank == 100) return cmdSyntax('/clear', socket);


                if(users[token].mute-time() > 0) return socket.emit('user eroare', 'You are muted!');
                else {  
                    var props = {
                        steamid: users[token].steamid,
                        name: users[token].name,
                        avatar: users[token].avatar,
                        rank: users[token].rank,
                        msg: mesaj
                    };
    
                    chat_msgs.push(props);
                    if(chat_message_escape >= 30) chat_msgs.shift();
    
                    io.sockets.emit('user chat message add', props);
                }
            }
        }
    });

    socket.on('disconnect', function() {
        delete sockets[socketids[socket.id]];
        delete socketids[socket.id];
        io.sockets.emit('website users online', Object.keys(sockets).length);
    });
});


function checkUserOpenCase(tid, token, socket) {
    logger.info('checkUserOpenCase #' + tid + ' ');

    var done = setInterval(function() {
        var now_url = 'https://api-trade.opskins.com/ICaseSite/GetTradeStatus/v1?offer_id=' + tid;
        vgo.opskins_api(now_url, 'GET', {}, function(res) {
            console.log(res);

            if(res.hasOwnProperty('message') && !res.hasOwnProperty('response')) {
                logger.error(tid + ' error ' + res.message);
                socket.emit('user eroare', res.message);
                return;
            }

            if(res.response.offer.state == 9) {
                socket.emit('user alerta', 'Your trade has been approved! We will add your cases to website inventory in few seconds!');
                socket.emit('user waiting cases');

                logger.info('Waaiting');

                var done2 = setInterval(function() {
                    var now_url = 'https://api-trade.opskins.com/ICaseSite/GetTradeStatus/v1?offer_id=' + tid;
                    vgo.opskins_api(now_url, 'GET', {}, function(res) {
                        if(res.hasOwnProperty('response') && res.response.hasOwnProperty('cases') && res.response.offer.state == 3) {
                            logger.info('got case items');
                            var cases = res.response.cases;
                            if(!Website_Inventory.hasOwnProperty(token)) Website_Inventory[token] = [];
                            for(var i in cases) {
                                var itm = cases[i];
                                logger.info(itm);
                                pool.query('INSERT INTO cases SET trade_id = ' + pool.escape(res.response.offer.id) + ', item_color = ' + pool.escape(itm.item.color) + ', case_id = ' + pool.escape(itm.item.id) + ', item_image = ' + pool.escape(itm.item.image["600px"]) + ', name = ' + pool.escape(users[token].name) + ', user = ' + pool.escape(users[token].steamid) + ', item_name = ' + pool.escape(itm.item.name) + ', item_price = ' + pool.escape(itm.item.suggested_price) + ', caseid = ' + pool.escape(itm.case_id) + ', time = ' + pool.escape(time()), function(ee, rr) {
                                    
                                });

                                Website_Inventory[token].push({
                                    id: itm.case_id,
                                    image: Cases[itm.case_id][0].img,
                                    item: itm.item,
                                    type: 'real'
                                });

                                console.log('how it looks the website inventory');
                                console.log(Website_Inventory[token]);

                                users[token].keys = users[token].keys - 1;
                                socket.emit('user keys', users[token].keys);
                            }

                            socket.emit('user inventory amount', Website_Inventory[token]);

                            logger.info('user ' + users[token].steamid + ' got ');
                            logger.info(res.response.cases);

                            clearInterval(done2);
                        }
                    });
                }, 2500);

                clearInterval(done);
            } else if((res.response.offer.state != 3 || res.response.offer.state != 9 || res.response.offer.state != 10 || res.response.offer.state != 12) && (res.hasOwnProperty('cases') && Object.keys(res.cases).lenght > 1)) {
                socket.emit('user eroare', 'An error ocurred with your trade!');
                clearInterval(done);
            } else if(res.response.offer.state == 7) {
                socket.emit('user eroare', 'Trade declined!');
                clearInterval(done);
            }
        });
    }, 3000);
}

function loadTopUnbox() {
    pool.query('SELECT * FROM cases ORDER BY item_price DESC LIMIT 1', function(err, row) {
        if(err) return;
        if(row.length == 0) return;

        TopUnbox = {
            name: row[0].item_name,
            image: row[0].item_image,
            value: parseFloat(row[0].item_price/100).toFixed(2),
            case: row[0].case_id,
            opener: row[0].name
        };
    });
}

// setTimeout(function() {
//     getWebsiteInformations(function(users, cases, preturile) {
//         website = {
//             users: users,
//             cases: cases,
//             preturile: parseFloat(parseFloat(preturile/100).toFixed(2))
//         }
//         io.sockets.emit('website info', website);

//         setTimeout(function() {
//             newTopUnbox();
//         }, 2500);
//     });
// }, 9000);

function newTopUnbox() {
    pool.query('SELECT * FROM cases ORDER BY item_price DESC LIMIT 1', function(err, row) {
        if(err) return;
        if(row.length == 0) return;

        TopUnbox = {
            name: row[0].item_name,
            image: row[0].item_image,
            value: parseFloat(row[0].item_price/100).toFixed(2),
            case: row[0].case_id,
            opener: row[0].name
        };

        io.sockets.emit('website top unbox', TopUnbox);
    });
}

function getWebsiteInformations(cb) {
    pool.query('SELECT COUNT(*) AS users FROM users', function(eeee, rrrr) {
        pool.query('SELECT COUNT(*) AS cases, SUM(`item_price`) AS preturile FROM cases', function(e1e, r1r) {
            var users = rrrr[0].users;
            var cases = r1r[0].cases;
            var preturile = r1r[0].preturile;

            cb(users, cases, preturile);
        });
    });
}

function loadHistoryCases() {
    pool.query('SELECT name, case_id, item_name, item_image, item_price, item_color, time FROM cases ORDER BY id DESC LIMIT 10', function(err, row) {
        if(err) throw err;
        if(row.length == 0) return;

        Cases_History = [];

        for(var z in row) {
            var itm = row[z];
            Cases_History.push({
                color: itm.item_color,
                image: itm.item_image,
                name: itm.item_name,
                user: itm.name,
                type: itm.item_name.match(/\((.*)\)/)[1],
                id: itm.case_id,
                price: parseFloat(parseFloat(itm.item_price/100).toFixed(2))
            });
        }
    });
}

function emitHistory(token, itm) {
    setTimeout(function() {
        Cases_History.unshift({
            color: itm.item.color,
            image: itm.item.image["600px"],
            name: itm.item.name,
            user: users[token].name,
            type: itm.item.name.match(/\((.*)\)/)[1],
            id: itm.item.id,
            price: parseFloat(parseFloat(itm.item.suggested_price/100).toFixed(2))
        });

        var toemit = {
            color: itm.item.color,
            image: itm.item.image["600px"],
            user: users[token].name,
            type: itm.item.name.match(/\((.*)\)/)[1],
            name: itm.item.name,
            id: itm.item.id,
            price: parseFloat(parseFloat(itm.item.suggested_price/100).toFixed(2))
        };

        io.sockets.emit('website live cases', toemit);
    }, 10000);
}

function getAllItems() {
    var now_url = 'https://api-trade.opskins.com/IItem/GetItems/v1/';
    vgo.opskins_api(now_url, 'GET', {}, function(res) {
        if(res.status == 1) {
            var items = res.response.items;
            for(var z in items) {
                if(items[z].length == 1) continue;
                for(var g in items[z]) {
                    ItemsCases.push({
                        sku: z,
                        name: items[z][g].name,
                        color: items[z][g].color,
                        rarity: items[z][g].rarity,
                        type: items[z][g].name.match(/\((.*)\)/)[1],
                        image: items[z][g].image['600px'],
                        price: items[z][g].suggested_price
                    });
                }
            }

            logger.info('All Items loaded. Total items loaded: ' + ItemsCases.length);

            getCasesSchema();
        } else {
            logger.error('Error getting AllItems');
            setTimeout('getAllItems', 5000);
        }
    });
}

function getCasesSchema() {
    var now_url = 'https://api-trade.opskins.com/ICase/GetCaseSchema/v1';
    vgo.opskins_api(now_url, 'GET', {}, function(res) {
        if(res.status == 1) {
            var cases = res.response.cases;
            for(var z in cases) {
                var itm = cases[z];
                if(!Cases.hasOwnProperty(itm.id)) Cases[itm.id] = [];
                var items = [];

                for(var j in itm.skus) {
                    var itmID = itm.skus[j];

                    for(var h in ItemsCases) {
                        if(itmID == ItemsCases[h].sku) {
                            items.push({
                                name: ItemsCases[h].name,
                                color: ItemsCases[h].color,
                                rarity: ItemsCases[h].rarity,
                                type: ItemsCases[h].type,
                                image: ItemsCases[h].image,
                                price: parseFloat(ItemsCases[h].price/100).toFixed(2)
                            });
                        }
                    }
                }

                Cases[itm.id].push({
                    name: itm.name,
                    img: itm.image['300px'],
                    items: items
                });
            }

            logger.info('CaseSchema loaded successfully! Total cases loaded: ' + Object.keys(Cases).length);
        } else {
            logger.error('Error getting CaseSchema');
            setTimeout('getCasesSchema', 5000);
        }
    });
}

function checkSteamLevel(steamid, current_level, cb) {
    if(current_level == -1) {
        var url = 'http://api.steampowered.com/IPlayerService/GetSteamLevel/v1/?key=EE7FB681DD96C0447B91E670E446BB69&steamid=' + encodeURIComponent(steamid);
        request(url, function(err, res, body) {
            if(res.statusCode == 200) {
                var level = JSON.parse(body);
                cb(level.response.player_level);
            } else cb(0);
        });
    } else cb(current_level);
}

function cmdSyntax(cmd, socket) {
    if(cmd == '/mute') socket.emit('user alerta', 'Syntax: /mute [steamid] [seconds]');
    else if(cmd == '/ban') socket.emit('user alerta', 'Syntax: /ban [steamid]');
    else if(cmd == '/unban') socket.emit('user alerta', 'Syntax: /unban [steamid]');
    else if(cmd == '/clear') socket.emit('user alerta', 'Syntax: /clear');
}




function check_errors() {
    process.on('uncaughtException', function (err) {
        logger.error('[ERROR]');
        logger.error(err);
    });
}

function database_connection() {
    pool = mysql.createConnection(db_config);
    pool.connect(function(err) {
        if(err) {
            logger.error('[ERROR] Connecting to database "' + err.toString() + '"');
            setTimeout(function() { database_connection(); }, 2500);
        }
        else
        {
            logger.trace('[INFO] Connected to database!');
        }
    });
    pool.on('error', function(err) {
        logger.error('[ERROR] Syntax "' + err.toString() + '"');
        logger.error(err);
        if(err.code == 'PROTOCOL_CONNECTION_LOST') {
            setTimeout(function() { database_connection(); }, 2500);
            logger.trace('[INFO] Trying to reconnect to database...');
        }
        else
        {
            logger.error('[ERROR] Connecting to database ' + err.toString());
        }
    });
}

function chat_message_escape(text) {
    var map = {
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#039;'
    };

    return text.replace(/[&<>"']/g, function(m) { return map[m]; });
}

function time() {
    return parseInt(new Date().getTime()/1000);
}