
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

import {
    pd,
    dateformat,
    url_api,
    file_api,
    date_range,
    getAllChannels
  } from "./utils/util";


import {
    reduceField,
    reduceFields,
    toDailyOverLimitPOLs,
    writeCSV
  } from "./utils/analytics";


function readData(place,channel,day){
  var format = "csv";
  var file = file_api(place,channel,dateformat(day),format);
  if(!fs.existsSync(file)){
    // throw "error data not found :" +place+":"+channel+":"+dateformat(day)+":"+format;
    console.log("error data not found :" +place+":"+channel+":"+dateformat(day)+":"+format);
    return [];
  }  

  return prase_day(fs.readFileSync(file).toString());

}


function prase_day(body){
  var lines = body.split(/[\r\n]+/);
  var columns = ['CNO','POLNO','DATE','TIME','ITEM','CODE2','VAL'];

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
    columns.forEach(function(key,index){
      item[key] = tokens[index];
    });
    data.push(item);    
    // data.push(JSON.parse(JSON.stringify(item)));
  });
  return data;
}

var year = 2016;
var days = date_range(new Date(year+ "/1/1"),new Date((year+1)+"/1/1"));

// days.forEach(function(){

// });


var channels = getAllChannels(pvplaces,reduceFields(pvchannels,"place"));

var items = [];
//.filter((d,ind)=>{ return ind == 0;})
days.forEach(function(day){
  console.log(day);
  channels.forEach(function(channel){
    items.push.apply(items,readData(channel.place,channel.channel,day)); 
  });
  console.log(day+"end");
});

// 'CNO','POLNO','DATE','TIME','ITEM','CODE2','VAL

var reducedata = reduceFields(items,["DATE","CNO","POLNO"],(values)=>{
  return values.filter((item)=> item.CODE2 == "逾限").length;
});

var result = toDailyOverLimitPOLs(reducedata);
writeCSV(year+"_year_overlimit.csv",result);

