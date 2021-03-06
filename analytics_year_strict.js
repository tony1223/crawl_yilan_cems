
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
    toDailyOverLimitItems,
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

var year = parseInt(process.argv[3],10);

var days = date_range(new Date(year+ "/1/1"),new Date((year+1)+"/1/1"));

// days.forEach(function(){

// });


var channels = getAllChannels(pvplaces,reduceFields(pvchannels,"place"));
var channelsMap = reduceFields(pvchannels,["place","id"],(m)=> m[0]);


var items = [];

days.forEach(function(day){
  console.log(day);
  channels.forEach(function(channel){
    items.push.apply(items,readData(channel.place,channel.channel,day)); 
  });
  console.log(day+"end");
});

// items.push.apply(items,readData("G3200778","P301",new Date("2015/04/10"))); 

// 'CNO','POLNO','DATE','TIME','ITEM','CODE2','VAL

var reducedata = reduceFields(items,["DATE","CNO","POLNO","ITEM"],(values)=>{

  var overlimit = values.filter((item)=> {
    var warn = channelsMap[item.CNO][item.POLNO].warning[item.ITEM];

    if(warn){
      return parseInt(item.VAL,10) >= warn.min;
    }
    return false;
  }).length;

  var overlimit_office = values.filter((item)=> {
    return item.CODE2 == "逾限";
  }).length;

  
  var overlimit_office2 = values.filter((item)=> {
    var warn = channelsMap[item.CNO][item.POLNO].warning[item.ITEM];

    if(warn){
      return  item.CODE2 == "逾限" && parseInt(item.VAL,10) == warn.min;
    } else{
      return false;
    }
  }).length;  

  return overlimit + "/" + overlimit_office+"/"+overlimit_office2;
});

var result = toDailyOverLimitItems(reducedata);
writeCSV("analytics/"+year+"_year_overlimit_strict_items.csv",result);

