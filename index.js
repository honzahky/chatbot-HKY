const BootBot = require('bootbot');
const config = require('config');
const fetch = require('node-fetch');


// Welcome to Alpha Vantage! Your dedicated access key is: GDT9I6VQ4SRF4ZRD. 
// Please record this API key for future access to Alpha Vantage.
const SHARE_API = "https://www.alphavantage.co/query?apikey=GDT9I6VQ4SRF4ZRD"

var port = process.env.PORT || config.get('PORT');

const bot = new BootBot({
  accessToken: config.get('ACCESS_TOKEN'),
  verifyToken: config.get('VERIFY_TOKEN'),
  appSecret: config.get('APP_SECRET')
});


bot.hear(['hello', 'hi'], (payload, chat) => {
	chat.say('Hi ! If you like to know about a some shares "share" and symbol of the share',{typing:  true})
});

bot.hear(/share (.*)/i, (payload, chat, data) => {
  chat.conversation((conversation) => {
    const shareSymbol = data.match[1];
    console.log("Somebody asked about share "+shareSymbol);
    fetch(SHARE_API+'&function=OVERVIEW&symbol='+ shareSymbol)
      .then(res => res.json())
      .then(json => {
        console.log("Search result is "+JSON.stringify(json));
        console.log("json :"+Object.keys(json).length )
      
  //      if (JSON.stringify(json) === "False") { 
          if (Object.keys(json).length === 0 && json.constructor === Object){
  //        if (json.Name === "undefined"){
            conversation.say('I could not find the share symbol '+shareSymbol+', you can try searching for share like "search [share symbol]"', {typing: true});
            conversation.end();
        } else {
          //  conversation.say('I found a share: '+json.Name, {typing: true});
          setTimeout(() => {
           // conversation.say('I found a share: '+json.Name, {typing: true});
            conversation.say('I found a share: '+json.Name+
            "\n The share is traded at: "+json.Exchange+
            "\n Currency: "+json.Currency+
            "\n Country: "+json.Country+
            "\n Sector: "+json.Sector, {typing: true});
          }, 1000)
          handlePlot(conversation, json);
        }
    });
  })
})



function handlePlot(conversation, json) {
  setTimeout(() => {
    conversation.ask({
      text: "Would you like to know what the "+ json.Symbol +" is about?",
      quickReplies: ["Yes", "No"],
      options: {typing: true}
    }, (payload, conversation) => {
      if (payload.message.text === "Yes") {
        conversation.say(json.Description, {typing: true});
        conversation.end();
      } else {
        conversation.say("Ok, ask me about a different share then.", {typing: true});
        conversation.end();
      }
    });
  }, 2000)
}


bot.start(port);