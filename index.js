const express = require('express')
const bodyParser = require('body-parser')
const app = express()

const server = require('http').Server(app)
const io = require('socket.io')(server)
var Request = require("request");
const { json } = require('express')



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
var playersIngame = 0;
var reponse = "";
var nombreR= 0;
var gameStarted = false;
var showScore =false


io.on('connection', function (socket) {

    io.to(socket.id).emit('socketID', socket.id);
    playerList.push(socket.id)
    console.log(`Connecté au client ${socket.id}`)

    socket.on('disconnect', function () {
        for (let index = 0; index < players.length; index++) {
            if (socket.id == players[index].id){
                players.splice(index, 1);
                playersIngame -=1
            }
        }
        sendNewsSocket(players);
        if(playersIngame ==0){
            gameStarted = false
        }
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
        var allReady = true;
        playersIngame +=1;
        for (let i = 0; i < players.length; i++) {

            if(players[i].id == msg){
                players[i].ready = true;
                console.log(players[i].name +" "+ players[i].id +" "+ players[i].ready)
                io.to('room1').emit('PlayersReady', players)   

            }
            if(players[i].ready == false){
                console.log("allReady "+allReady);
                allReady = false;
            }
        }
        console.log("allReady "+allReady);
        if(allReady == true && players.length > 0){
            io.to('room1').emit('StartGame', players)
            if(gameStarted == false){
                getQuestion()
                gameStarted = true;
            }
            else{
                nombreR +=1
            }
        }
    })


    socket.on('newQuestion', function(msg){
        nombreR +=1;
        console.log(nombreR +" "+ players.length)
        if(nombreR == players.length){
            getQuestion()
            nombreR =0
        }
    })
    
    socket.on('checkReponse', function(msg){
        var maxPoints = 9 
        for (let i = 0; i < players.length; i++) {
            if(players[i].id == msg.socketID){
                if(reponse == msg.reponse){
                    players[i].points += 1;
                    console.log(players[i].points)
                    io.to('room1').emit('AddPoints', players) 
                }

            }
            if(players[i].points > maxPoints)   {
                showScore = true
                console.log('allotrue')

            }           

        }  
        if(showScore==true){
            for (let index = 0; index < players.length; index++) {
                    console.log("showleaderboard")
                    io.to(players[index].id).emit('ShowLeaderboard', players)
                    
            }
        }
        
    })
    /*
    if(playerList.length >3){
        io.to(playerList[3]).emit('hey', 'Last player')
    }
*/

})


server.listen(process.env.PORT || 3000, function () {

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

function getQuestion(){

    if(showScore ==false){

        Request.get("https://opentdb.com/api.php?amount=1&difficulty=easy", (error, response, body) => {
            if(error) {
                return console.dir(error);
            }
            var jsonBody = JSON.parse(body)

            if(jsonBody.response_code ==0){
                reponse = jsonBody.results[0].correct_answer
                console.log(reponse)
                io.to('room1').emit('getquestionjson', jsonBody)
                //console.log(jsonBody)
            }
            else{
                console.log("error question")
            }

        });
    }
}
