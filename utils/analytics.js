
import fs from "fs";

export function reduceField(ary,field){
  return ary.reduce((now,next)=>{
    now[next[field]] = now[next[field]] || []
    now[next[field]].push(next);
    return now;
  },{});
}

export function reduceFields(ary,fields,valueCallback){
  if(fields == null){
    throw "reduceFields: fields can not be empty ";
  }
  if(fields.push == null){
    fields = [ fields ];
  }
  if(fields.length == 0 ){
    if(valueCallback == null){
      return ary;
    }else{
      return valueCallback(ary);
    }
  }

  var res = reduceField(ary,fields[0]);
  for(var k in res){
    res[k] = reduceFields(res[k],fields.slice(1),valueCallback);
  }

  return res;
}

export function writeCSV(filename,data,fields){

  if(fields == null){
    fields = Object.keys(data[0]);
  }
  var out = [ fields.join(",") +"\n" ];
  out.push(data.map(function(item){
    var line = [];
    fields.forEach(function(f){
      line.push(item[f]);
    });
    return line.join(",");
  }).join("\n"));

  fs.writeFileSync(filename,out.join(""));

}

export function toDailyOverLimitPOLs(datamap){
  var channel_items = require("./../channel.json");
  var place_data = require("./../places.json");


  var output = [];
  for(var date in datamap){ //date
    var dateitems = datamap[date];

    var place_output = {
      //工廠:place_data[place],
      日期:date
    };

    channel_items.forEach(function(c){
      if(dateitems[c.place] && dateitems[c.place][c.id]){
        place_output[place_data[c.place]+ "-" + c.id +"-"+c.name +"違規"] = dateitems[c.place][c.id];
      }else{
        place_output[place_data[c.place]+ "-" + c.id +"-"+c.name +"違規"] = "";
      }
    });

    output.push(place_output);

  }
  return output;
}


export function toDailyOverLimitItems(datamap){
  var channel_items = require("./../channel.json");
  var place_data = require("./../places.json");
  var envmap = require("./../envmap.json");


  var output = [];
  for(var date in datamap){ //date
    var dateitems = datamap[date];

    var place_output = {
      //工廠:place_data[place],
      日期:date
    };

    channel_items.forEach(function(c){

      for(var item in c.warning){

        var warn = c.warning[item];
        var title = place_data[c.place] + "-" + c.id +" "+ c.name +
          "-" + envmap[item].name + "("+  warn.min + envmap[item].unit +")-超標";

        if(dateitems[c.place] && dateitems[c.place][c.id] 
            && dateitems[c.place][c.id][item] ){

          place_output[title] = dateitems[c.place][c.id][item];
        }else{
          place_output[title] = "";
        }
      }
    });

    output.push(place_output);

  }
  return output;
}




