
export function pd(str,len){
  var out = [];
  for(var i = (""+str).length ; i < len; ++i){
    out.push("0");
  }
  out.push(str);
  return out.join("");
}
export function dateformat(day){
  var d = null;
  if(day.getTime) {
    d = day;
  }else{
    d = new Date(day);
  }

  return d.getFullYear()+""+pd(d.getMonth()+1,2)+""+pd(d.getDate(),2);
}

export function url_api(place,channel,day,format){
  return 'http://cems.ilepb.gov.tw/OpenData/API/Daily/'+ place+'/'+channel+'/'+day+'/'+format;
}

export function file_api(place,channel,day,format){
  return "files-test/"+format+"-"+day+"-"+place+'-'+channel+'-';
}

//include start but less than end
export function date_range(nstart,nend){

  var start = new Date(nstart.getTime());
  var time = [];
  while(start < nend){
    time.push(new Date(start.getTime()));
    start.setDate(start.getDate()+1);
  }
  return time;
}

export function getAllChannels(places,channels){
  var allchannels = [];

  for(var placeNo in places){
    if(channels[placeNo].forEach == null){
      console.log("wrong channel:",channels[placeNo]);
    }
    // console.log(channels[placeNo].forEach == null,placeNo);
    channels[placeNo].forEach((channel,ind)=>{
      allchannels.push({place:placeNo,channel:channel.id});
    });
  }

  return allchannels;
}