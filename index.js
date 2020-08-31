const app = require("express")();
const server = require("http").createServer(app);
const websocketServer = require("websocket").server

const port = process.env.PORT || 9091;
server.listen(port ,() => {
    console.log(`Listening on port ${port}`) 
})



app.get("/", (req,res)=> res.sendFile(__dirname + "/index.html"))



const players = {};
const games_server = {};
var position;
var attack = {};
var game_state;
var i;
var players_round = [];
var x;
var player_delete_index;
var game;
var color;

games_server["xyz"] = {

               "id": "xyz",
               "players": []
              
            }

const wsServer = new websocketServer({
    "httpServer": server
})
wsServer.on("request", request => {
    //connect
    const connection = request.accept(null, request.origin);
    connection.on("open", () => console.log("opened!"))
    connection.on("close", () => console.log("closed"))
    connection.on("message", message => {
        const result = JSON.parse(message.utf8Data)
        //I have received a message from the client
        //a user want to create a new game

        

if (result.action === "join") {
            

            const playerId = result.playerId;
           
             game = games_server["xyz"];


        
            if (game.players.length >= 4) 
            {
                //sorry max players reach
                return;
            }

            color =  {"0": "red", "1": "blue", "2": "green"}[game.players.length] 
             // assign colors to new players 


            game.players.push({              // add new players in the game list 
                "playerId": playerId,
                "color": color,
                "position": null
            })
                

            const players_required = 3 - game.players.length;  // check the remaining players

            if(players_required == 0)
            {
            	game_state = "Started";
            	

              players_round = {...game.players}; // copy
                 
              start(0); // if game started, call player 0 to take chance


          
            }

            else
            {
            	game_state = "Not started";
            }
 
           


           
           
            const payLoad = {
                "action": "join",
                "game": game,
                "players_required": players_required,
                "game_state": game_state
            }
            //loop through all players and tell them that people has joined
            game.players.forEach(c => {
                players[c.playerId].connection.send(JSON.stringify(payLoad))
            })

           } //join end



  if (result.action === "play") {
             index = result.index;
             index = index + 1;

             if(index === 3)
             {
                index = 0;
             }
              start(index)


             console.log("index", index);
            const playerId = result.playerId;
            const gameId = result.gameId;
            const color = result.playerColor;
            const game = games_server[gameId];
            const pos = result.pos;
            const game_state = result.game_state;
            

              if(game_state === "started" )
            {
            // finding current player
            for(var i=0;i<game.players.length;i++)
            {
                if(game.players[i].playerId === playerId)
                {
                    current = i; 
                    break;
                }
            }

            
         
            // finding current player
            for(var i=0;i<game.players.length;i++)
            {
            	if(game.players[i].playerId === playerId)
            	{
            		current = i; 
            		break;
            	}
            }

              console.log("existing", game.players[current].position);
             // updating current player position
             game.players[current].position = pos;

            attack = {};
             // checking other players on that same position
            
            for(var i=0;i<game.players.length;i++)  // looping through all the players
            {

            	if(i!==current)  // skip the current player
            	{ 
            	if(game.players[i].position === game.players[current].position)  // if position match , add to the attack object [id & color] 
            	{
            		 var attack_Id = game.players[i].playerId;
            		 var attack_color = game.players[i].color;
            		 attack[playerId] = {
                   "attack_Id": attack_Id,
	               "color": attack_color
                   }
            	}
                }

            }
        

            console.log("game", game);
          
             const payLoad = {
                "action": "play",
                "playerId": playerId,
                "color": color,
                "game": game,
                "pos":  pos,
                "attack": attack
            }
           
             
           game.players.forEach(c => {
                players[c.playerId].connection.send(JSON.stringify(payLoad))
            })
       }
       else if (game_state === "finished"){  // if game is finished , send completed message
      

             const payLoad = {
                "action": "play",
                "color": color,
                "game": game,
                "game_state": game_state
            }
           
             
           game.players.forEach(c => {
                players[c.playerId].connection.send(JSON.stringify(payLoad))
            })


       }
       

       
           } //play end


           if (result.action === "kill") {
            const gameId = result.gameId;
            const game = games_server[gameId];
            const player_killed_id = result.player_killed_id;
            const player_killed_color = result.player_killed_color;

            console.log("killed",player_killed_id);
              var killed_id;

             // finding index of player killed and reseting the position to 1
            for(var i=0;i<game.players.length;i++)
            {
            	if(game.players[i].playerId === player_killed_id)
            	{
            		game.players[i].position = 1;
            		break;
            	}
            }
                
            
           

              console.log("game", game);
        
           

            const payLoad = {
                "action": "kill",
                "player_killed_color": player_killed_color,
                "game": game,
                
            }
            //loop through all players and tell them that people has joined
              game.players.forEach(c => {
                players[c.playerId].connection.send(JSON.stringify(payLoad))
            })


           } //kill end


 

       }) // message end





    
            
    //generate a new playerId
    const playerId = guid();

            
    players[playerId] = {
        "connection":  connection
    }

    const payLoad = {
        "action": "connect",
        "playerId": playerId
    }
    //send back the client connect
    connection.send(JSON.stringify(payLoad))


})


function S4() {
    return (((1+Math.random())*0x10000)|0).toString(16).substring(1); 
}
 

 // Generating Gobal unique ID in JS 

// then to call it, plus stitch in '4' in the third group    
const guid = () => (S4() + S4() + "-" + S4() + "-4" + S4().substr(0,3) + "-" + S4() + "-" + S4() + S4() + S4()).toLowerCase();




  function start(i){ // sendoing player ID from server to client to enable play button
    var game = games_server["xyz"];
                 var current = players_round[i].playerId;
                 console.log("current", current);
                 const payLoad = {
                 "action": "chance",
                 "playerId": current,
                 "index": i
                    }
          
                  game.players.forEach(c => {
                players[c.playerId].connection.send(JSON.stringify(payLoad))
            })
       
                //players[current].connection.send(JSON.stringify(payLoad))
            
      }

