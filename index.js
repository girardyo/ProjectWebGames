const express = require('express')
const bodyParser = require('body-parser')
const app = express()

const server = require('http').Server(app)
const io = require('socket.io')(server)


app.use(express.static('public'))
app.use(bodyParser.json())
app.use(bodyParser.urlencoded({extended:true}))


app.get('/', function (req, res){
    res.sendFile('index.html', { root: __dirname })
})

app.get('/json', function (req, res){
    res.status(200).json({"message":"ok"})
})

var playerList = [];
var players = [];

io.on('connection', function (socket) {

    io.to(socket.id).emit('socketID', socket.id);
    playerList.push(socket.id)
    console.log(`Connecté au client ${socket.id}`)

    socket.on('disconnect', function () {

        players.pop()
        sendNewsSocket(players);
        socket.removeAllListeners();
        console.log(`Déconnexion du client ${socket.id}`)
    });

    
    socket.on('reconnect', () => {
        console.log(`reconnecté au client ${socket.id}`)
    })


    socket.on('NewPlayer', function(msg){
        console.log("player" + msg +" connected")
        const player = {
            id: socket.id,
            name: msg.name,
            icon: msg.icon,
            points: 0,
            ready: false
        };

        players.push(player);
        players.forEach(element => {
            console.log(element.name +" "+ element.id +" "+ element.icon)
        });

        socket.join('room1');
        sendNewsSocket(players);
/*
        if(players.length ==2){
            io.to('room1').emit('testRoom', 'slt la room');
            
        }*/
    })
    socket.on('Readyplayer', function(msg){
        for (let i = 0; i < players.length; i++) {
            if(players[i].id == msg){
                players[i].ready = true;
                console.log(players[i].name +" "+ players[i].id +" "+ players[i].ready)

            }
            
        }
        io.to('room1').emit('PlayersReady', players)
    })

    /*
    if(playerList.length >3){
        io.to(playerList[3]).emit('hey', 'Last player')
    }
*/

})


server.listen(3000, function () {

    console.log('Votre app est disponible sur localhost:3000 !')
})

/*
function newsEverySecond(){

    for (let i = 0; i < tableauNews.length; i++) {
        setTimeout(function timer() {
          sendNewsSocket(tableauNews[i])
        }, i * 1000);
      }}
*/

function sendNewsSocket(value){
    io.to('room1').emit('news', value)
}