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


bot.hear(['hello', 'hi', 'ahoj'], (payload, chat) => {
	chat.say('Hi ! If you like to know about a some shares type "share [symbol of the share]"',{typing:  true})
  chat.say('you can also find out the exchange rate - from,to currency - type "exch [currency symbol],[currency symbol]"', {typing: true});

});

bot.hear(/share (.*)/i, (payload, chat, data) => {
  chat.conversation((conversation) => {
    const shareSymbol = data.match[1].toUpperCase();
    console.log("Somebody asked about share "+shareSymbol);
    fetch(SHARE_API+'&function=OVERVIEW&symbol='+ shareSymbol)
      .then(res => res.json())
      .then(json => {
        console.log("Search result is "+JSON.stringify(json));
        console.log("json :"+Object.keys(json).length )
      
          if (Object.keys(json).length === 0 && json.constructor === Object){
            conversation.say('I could not find the share symbol '+shareSymbol+', type the existing share symbol "share [share symbol]"', {typing: true});
            conversation.say('you can also find out the exchange rate - from,to currency - type "exch [currency symbol],[currency symbol]"', {typing: true});
            conversation.end();
        } else {
          // příprava na nalezení hodnot jehoz identifokátory začínají na číslo
          str = JSON.stringify(json)

          n = str.indexOf('52WeekHigh');
          n1 = str.indexOf(':',n)+2;
          n2 = str.indexOf(',',n)-1;
          WeekHigh52 = str.substring(n1, n2)
          
          n = str.indexOf('52WeekLow');
          n1 = str.indexOf(':',n)+2;
          n2 = str.indexOf(',',n)-1;
          WeekLow52 = str.substring(n1, n2)
          
          n = str.indexOf('50DayMovingAverage');
          n1 = str.indexOf(':',n)+2;
          n2 = str.indexOf(',',n)-1;
          DayMovingAverage50 = str.substring(n1, n2)
          
          n = str.indexOf('200DayMovingAverage');
          n1 = str.indexOf(':',n)+2;
          n2 = str.indexOf(',',n)-1;
          DayMovingAverage200 = str.substring(n1, n2)
        
            conversation.say('*I found a share: '+json.Name+'*'+
            "\n The share is traded at: "+json.Exchange+
            "\n Currency: "+json.Currency+
            "\n Country: "+json.Country+
            "\n Sector: "+json.Sector+
            "\n*----- PRICES -----*"+
            "\n 52 Week High: "+WeekHigh52+
            "\n 52 Week Low : "+WeekHigh52+
            "\n 50  Day Moving Average: "+DayMovingAverage50+
            "\n 200 Day Moving Average: "+DayMovingAverage200+
//            "'", {typing: true});
            "'");
            
          handlePlot(conversation, json, shareSymbol);
        }
    });
  })
})

function handlePlot(conversation, json, shareSymbol) {
  console.log("spuštěn handlePlot " + shareSymbol)
  setTimeout(() => {
    conversation.ask({
      text: "Would you like to know what the "+ shareSymbol +" is about?",
      quickReplies: ["Yes", "No"],
      options: {typing: true}
    }, (payload, conversation) => {
      if (payload.message.text === "Yes") {
      //  conversation.say(json.Description, {typing: true});
     // nemůže zde být  {typing: true} jinak se program předběhne a nepočká na vypsání
        conversation.say(json.Description );
        handlePlot0(conversation, json, shareSymbol); // zalolám tlačítka
     //   setTimeout(handlePlot0(conversation, json, shareSymbol),15000) 
     // nefunguje casová prodleva

      } else {
        conversation.say("Ok, ask me about a different share then.", {typing: true});
        conversation.say('you can also find out the exchange rate - from,to currency - type "exch [currency symbol],[currency symbol]"', {typing: true});
        conversation.end();
      }
    });
  }, 2000)
}

function handlePlot0(conversation, json, shareSymbol) {
  console.log("spušten handlePlot0 akcie " + shareSymbol)
  setTimeout(() => {
    conversation.ask({
      // Send a button template
    text: 'What more information would you like to know about ' + shareSymbol + '?' ,
    buttons: [
      { type: 'postback', title: 'Dividend', payload: 'Dividend' },
      { type: 'postback', title: 'Earnings', payload: 'Earnings' },
      { type: 'postback', title: 'Cancel', payload: 'Cancel' }

    ]
      //options: {typing: true}
    }, (payload, conversation) => {
      //console.log('payload ' + payload)
      console.log("výběr = " +JSON.stringify(payload));
      //console.log('payload.message' + payload.message)
      try {
          vybrano = payload.postback.payload
          console.log("vybráno = " + vybrano)
    
        if (vybrano === 'Dividend') {
          console.log('Dividend')
          conversation.say('Dividend per share ' + shareSymbol + ' is ' + json.DividendPerShare, {typing: true});
          conversation.say('Share '+ shareSymbol +' Divident Date is ' + json.DividendDate, {typing: true});
    //      setTimeout(handlePlot0(conversation, json, shareSymbol), 5000);
          handlePlot0(conversation, json, shareSymbol)
        } else if (vybrano === 'Earnings') {
          console.log('Earnings')
          earnings(conversation, json, shareSymbol)
        // setTimeout(handlePlot0(conversation, json, shareSymbol),20000) // Nefinguje nečaká
        } else if (vybrano === 'Cancel') {
          conversation.say("Ok, ask me about a different share then.", {typing: true});
          conversation.say('you can also find out the exchange rate - from to currency" - type [exch currency symbol,currency symbol]"', {typing: true});
          conversation.end();
        } else {
          console.log(`No, ${vybrano} isn't one of the TMNT.`)
        }  
      } catch (error) {
          conversation.say("You did not klick on any botton, ask me about a different share then.", {typing: true});
          conversation.say('you can also find out the exchange rate - from to currency" - type [exch currency symbol,currency symbol]"', {typing: true});
          conversation.end();
      }
      
    });
  }, 3000)
}


function earnings(conversation, json, shareSymbol){
    console.log("earnings akcie = "+shareSymbol)
    fetch(SHARE_API+'&function=EARNINGS&symbol='+shareSymbol)
      .then(res => res.json())
      .then(json => {
        console.log("Search result is "+JSON.stringify(json));
        console.log("json :"+Object.keys(json).length )
      
          if (Object.keys(json).length === 0 && json.constructor === Object){
            conversation.say('I could not find the share symbol '+shareSymbol+', you can try searching - type "share [symbol of the share]"', {typing: true});
            conversation.say('you can also find out the exchange rate - from to currency" - type [exch currency symbol,currency symbol]"', {typing: true});
            conversation.end();
        } else {
          earnings2(conversation, json, shareSymbol);
        }
    });
 
}


function earnings2(conversation, json, shareSymbol){
  console.log("**** earning2 ****")
  console.log("shareSymbol = " + shareSymbol)
//  console.log(json)
  temp = '*I found ' + json.annualEarnings.length +' Anual earnings of share : ' + shareSymbol +'*'

  for (let i = 0; i < json.annualEarnings.length; i++) {
           temp += "\n" + json.annualEarnings[i].fiscalDateEnding + " : " + json.annualEarnings[i].reportedEPS;
         }
//        conversation.say('I found ' + json.annualEarnings.length +' Anual earnings of share :' + shareSymbol  + temp, {typing: true});
// nemůže zde být  {typing: true} jinak se program předběhne a nepočká na vypsání
//        conversation.say('I found ' + json.annualEarnings.length +' Anual earnings of share :' + shareSymbol  + temp);
        // setTimeout(handlePlot2(conversation, json, shareSymbol),5000) // - nefunguje
//       handlePlot2(conversation, json, shareSymbol)
// zazavolám rovnou i kvartální earnings, neboť nefunhuje spolehlivě aby se zavolání funkce nepředběhlo
pocetQ = json.quarterlyEarnings.length
if (pocetQ > 20) {
  pocetQ = 20
}
temp += '\n\n*There are ' + pocetQ + ' quarterly earnings of share :' + shareSymbol  +'*'; // nelze použít {typing: true} jinak se předběhmne
temp += "\nfiscalDateEnding : reportedDate : reportedEPS : estimatedEPS : surprise : surprisePercentage "

for (let i = 0; i < pocetQ; i++) {
  temp += "\n" +
  json.quarterlyEarnings[i].fiscalDateEnding + " : " +
  json.quarterlyEarnings[i].reportedDate + " : " +                    
  json.quarterlyEarnings[i].reportedEPS + " : " +                   
  json.quarterlyEarnings[i].estimatedEPS + " : " +
  json.quarterlyEarnings[i].surprise + " : " +
  json.quarterlyEarnings[i].surprisePercentage 
} 
//conversation.say('There are ' + pocetQ + ' quarterly earnings of share :' + shareSymbol  + temp , {typing: true}); // nelze použít {typing: true} jinak se předběhmne
//conversation.say('There are ' + pocetQ + ' quarterly earnings of share :' + shareSymbol  + temp ); // nelze použít {typing: true} jinak se předběhmne
console.log("temp = "+ temp)
conversation.say(temp) // nelze použít {typing: true} jinak se předběhmne

handlePlot0(conversation, json, shareSymbol) // zavolá tlačítka


}

// tuto funkci nakonec nepoužívám dám to do jedné finkce bez dotazu
function handlePlot2(conversation, json, shareSymbol) {
  console.log("start handlePlot2")
  //shareSymbol = json.symbol
//  setTimeout(() => {
    conversation.ask({
      text: "Would you like to know a quarial earnings of the "+ shareSymbol +" ?",
      quickReplies: ["Yes", "No"],
      options: {typing: true}
    }, (payload, conversation) => {
      if (payload.message.text === "Yes") {
          temp = "\nfiscalDateEnding : reportedDate : reportedEPS : estimatedEPS : surprise : surprisePercentage "
          pocetQ = json.quarterlyEarnings.length
          if (pocetQ > 20) {
            pocetQ = 20
          }
          for (let i = 0; i < pocetQ; i++) {
            temp = temp +"\n" +
            json.quarterlyEarnings[i].fiscalDateEnding + " : " +
            json.quarterlyEarnings[i].reportedDate + " : " +                    
            json.quarterlyEarnings[i].reportedEPS + " : " +                   
            json.quarterlyEarnings[i].estimatedEPS + " : " +
            json.quarterlyEarnings[i].surprise + " : " +
            json.quarterlyEarnings[i].surprisePercentage 
          } 
//          conversation.say('There are ' + pocetQ + ' quarterly earnings of share :' + shareSymbol  + temp, {typing: true})
// nemůže zde být  {typing: true} jinak se program předběhne a nepočká na vypsání
          conversation.say('There are ' + pocetQ + ' quarterly earnings of share :' + shareSymbol  + temp)
          console.log(" Yes zavolání menu")
          handlePlot0(conversation, json, shareSymbol) // zavolá tlačítka

          
      } else {
        conversation.say("Ok, ask me about a different share then.", {typing: true});
        console.log(" No end conversation")
        conversation.end();
      }
    });
//  }, 2000)
}

bot.hear(/exch (.*)/i, (payload, chat, data) => {
  chat.conversation((conversation) => {
    const exch = data.match[1];
    fromCur = ""
    toCur = ""
    prvni = true
    if (exch.includes(",")) {
      for (let index = 0; index < exch.length; index++) {
        if (exch[index]===",") {
          prvni=false
        }
        if (prvni) {
          if ((exch[index]!==",") && (exch[index]!==" ")) {
            fromCur += exch[index]
          }
        } else {
          if ((exch[index]!==",") && (exch[index]!==" ")) {
            toCur += exch[index]
          }
        }
      }
    }else {
      conversation.say('Please devide by "," from and to curency  - type "[exch from curency symbol,to curency symbol]"', {typing: true});
      conversation.end();
    }
// vse je formálně ok
    console.log('&from_currency=' + fromCur +'&to_currency=' + toCur );
    
    try { 
      fetch(SHARE_API+'&function=CURRENCY_EXCHANGE_RATE&from_currency=' + fromCur +'&to_currency=' + toCur)
      // CURRENCY_EXCHANGE_RATE&from_currency=USD&to_currency=JPY&apikey=demo
         .then(res => res.json())
         .then(json => {
           console.log("Search result is "+JSON.stringify(json));
           console.log("json :"+Object.keys(json).length )
         
             if (Object.keys(json).length === 0 && json.constructor === Object){
              conversation.say('Please devide by "," from and to curency  - type "[exch from curency symbol,to curency symbol]"', {typing: true});
              conversation.end();
           } else {
           temp = JSON.stringify(json)
           // vyhodím začítek {"Realtime Currency Exchange Rate": { 
           // vyhodím konec }}
           temp = temp.substr(36,temp.length-2) 
           // pak postupne přidám nový řádak míst čárky
           temp = temp.replace(',', '\n')
           temp = temp.replace(',', '\n')
           temp = temp.replace(',', '\n')
           temp = temp.replace(',', '\n')
           temp = temp.replace(',', '\n')
           temp = temp.replace(',', '\n')
           temp = temp.replace(',', '\n')
           temp = temp.replace(',', '\n')
           
           
           //  obj = JSON.parse(json)
             console.log(temp)
          //   for (const [key, value] of Object.entries(obj)) {
            //  console.log(`${key}: ${value}`);
          //    temp += "\n" + (`${key}: ${value}`)
          //  }
//             temp = obj."Realtime Currency Exchange Rate"
//          for (let index = 0; index < temp.length; index++) {
  //          if (exch[index]===",") {
    //          prvni=false
      //      }
             conversation.say(temp); //nelze dát {typing: true} jinak se přeběhne
             conversation.say('you can find out another exchange rate."', {typing: true});
             conversation.say('you can also find out information of the share - type "share [symbol of the share]"',{typing:  true})
             conversation.end();
           }  
          });    
    } catch (error) {
      console.log(error)
      conversation.say('Please devide by "," from and to currency  - type "[exch from curency symbol,to curency symbol]"', {typing: true});
      conversation.end();
    }

   
  })
})

bot.start(port);