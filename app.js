
import request from 'request'
import Promise from "bluebird"
import fs from "fs"
import pvchannels from "./channel.json"


import pvplaces from "./places.json"


var codeMap = {
  "00":"暫停運轉",
  "10":"正常值", 
  "11":"逾限", 
  "20":"校正值", 
  "30":"無效值", 
  "31":"系統維修", 
  "32":"失控值"
};


// Daily :
// 211 不透光率(%), 222 二氧化硫(ppm), 223 氮氧化物(ppm), 224 一氧化碳(ppm), 226 氯化氫(ppm), 236 氧氣(%), 
// 248 排放流率(Nm3/h), 259 溫度(°C)

//不透光率、氮氧化物、氧氣、流率

import env_map from "./envmap.json";


function replaceEnvName(str){
  var nums = [];
  for(var k in env_map){
    var env = env_map[k];
    if(str.indexOf(env.name) != -1){
      nums.push(k);
    }
  }
  return nums;
}

// console.log(pvchannels);

import {pd,dateformat,url_api,file_api} from "./utils/util";

function request_day(place,channel,day,format){
  return new Promise((ok,fail)=>{

    var file = file_api(place,channel,dateformat(day),format);
    if(fs.existsSync(file)){
      ok(fs.readFileSync(file));
      return ;
    }

    request(url_api(place,channel,dateformat(day),format),(err,data) =>{
      var datas = prase_day(dateformat(day),data.body);
      if(datas.length == 0 ){
        console.log("fail:",place,channel,dateformat(day),format);
        ok(null);
      }else{
        fs.writeFileSync(file,day2csv(datas));
        ok(day2csv(datas));
      }
    });
  });
}

function day2csv(ary){
  var lines = [], columns = ['CNO','POLNO','DATE','TIME','ITEM','CODE2','VAL'];

  lines.push(columns.join(","));

  ary.forEach(function(item){
    var data = [] ;

    columns.forEach(function(key){
      data.push(item[key]);
    });
    lines.push(data.join(","));
  });

  return lines.join("\n");
}

var g_ind = 0;
function prase_day(date,body){
  var lines = body.split(/[\r\n]+/);
  var columns = ['CNO','POLNO','TIME','ITEM','CODE2','VAL'];
  var data = [];
  lines.forEach((line,ind)=>{
    if(ind == 0){
      return true;
    }
    var tokens = line.split(",");

    if(tokens[0] == ""){
      return true;
    }
    var item = {}

    item["DATE"] = date;
    columns.forEach(function(key,index){
      item[key] = tokens[index];
    });

    item["CODE2"] = codeMap[item["CODE2"]];

    if(item["CODE2"] == "逾限"){
      g_ind++;
      console.log(g_ind,item);
    }

    data.push(item);    
    // data.push(JSON.parse(JSON.stringify(item)));
  });
  return data;
}

var items = [] , item_index = 0;;


var end = new Date();
end.setDate(end.getDate()-1);

var start = new Date("2011/5/10");

var grouped_channels = reduceFields(pvchannels,"place");

while(start < end){

  for(var placeNo in pvplaces){

    grouped_channels[placeNo].forEach((channel,ind)=>{
      try{
        items.push([placeNo, channel.id , start.getTime(),"csv"]);
        // request_day(placeNo, channel.id , "2016/4/10","csv");
      }catch(ex){
        console.log(ex);
      }
    });
  }
  start.setDate(start.getDate()+1);
}

var works = 0;

function recursive(){

  var item = items[item_index];  
  console.log("handling:"+item_index,items.length,works,dateformat(item[2]));
  if(items.length == item_index){
    return ;
  }

  item_index++;

  var file = file_api(item[0],item[1],dateformat(item[2]),item[3]);
  if(fs.existsSync(file)){
    console.log("exist");
    recursive();
  } else{
    request_day.apply(request_day,item).then((success)=>{
      setTimeout((d)=>{
        if(success != null){
          works++;
        }
        
        console.log("handled:"+item_index,items.length,works,dateformat(item[2]));

        if(works < 200){
          recursive();
        }else{
          console.log("works end");
        }
      },20);
    });
  }  
}

recursive();
